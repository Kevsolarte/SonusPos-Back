import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";

export const dashboardRepository = {
  async getTotalsHoy(negocioId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await prisma.venta.aggregate({
      where: {
        negocioId,
        createdAt: { gte: today },
        estado: { not: "ANULADA" },
      },
      _sum: {
        total: true,      // USD
        totalLocal: true, // VES (o la moneda local principal)
      },
      _count: {
        id: true,
      },
    });

    return {
      totalUSD: Number(stats._sum.total || 0),
      totalVES: Number(stats._sum.totalLocal || 0),
      count: stats._count.id || 0,
    };
  },

  async getSaldosCuentas(negocioId: string) {
    const cuentas = await prisma.cuenta.findMany({
      where: { negocioId, activo: true },
      select: {
        nombre: true,
        tipo: true,
        saldoUSD: true,
        saldoVES: true,
      },
    });

    return cuentas.map(c => ({
      nombre: c.nombre,
      tipo: c.tipo,
      saldoUSD: Number(c.saldoUSD),
      saldoVES: Number(c.saldoVES),
    }));
  },

  async getStockCritico(negocioId: string) {
    const criticos = await prisma.$queryRaw<{ stockActual: number; stockMin: number | null; nombre: string }[]>`
      SELECT i."stockActual", i."stockMin", p.nombre
      FROM "Inventario" i
      JOIN "Producto" p ON p.id = i."productoId"
      WHERE p."negocioId" = ${negocioId}
        AND p.activo = true
        AND (
          i."stockActual" <= 0
          OR (i."stockMin" IS NOT NULL AND i."stockActual" <= i."stockMin")
        )
      ORDER BY i."stockActual" ASC
      LIMIT 5
    `;
    return criticos.map(c => ({
      nombre: c.nombre,
      actual: Number(c.stockActual),
      minimo: Number(c.stockMin || 0),
    }));
  },

  async getResumenCreditos(negocioId: string) {
    const [cobros, deudas] = await Promise.all([
      prisma.cobro.aggregate({
        where: { negocioId },
        _sum: { monto: true, montoPagado: true },
      }),
      prisma.deuda.aggregate({
        where: { negocioId },
        _sum: { monto: true, montoPagado: true },
      }),
    ]);

    const porCobrar = Number(cobros._sum.monto || 0) - Number(cobros._sum.montoPagado || 0);
    const porPagar = Number(deudas._sum.monto || 0) - Number(deudas._sum.montoPagado || 0);

    return { porCobrar, porPagar };
  },

  async getTopCobros(negocioId: string) {
    const cobros = await prisma.$queryRaw<{ id: string; monto: number; montoPagado: number; createdAt: Date; cliente_nombre: string | null }[]>`
      SELECT c.id, c.monto, c."montoPagado", c."createdAt", cl.nombre AS cliente_nombre
      FROM "Cobro" c
      LEFT JOIN "Cliente" cl ON cl.id = c."clienteId"
      WHERE c."negocioId" = ${negocioId}
        AND c.monto > c."montoPagado"
      ORDER BY c.monto DESC
      LIMIT 10
    `;
    return cobros.map(c => ({
      id: c.id,
      nombre: c.cliente_nombre || "Varios / Otros",
      monto: Number(c.monto),
      pendiente: Number(c.monto) - Number(c.montoPagado),
      fecha: c.createdAt,
    }));
  },

  async getTopDeudas(negocioId: string) {
    // Deudas pendientes
    const deudas = await prisma.deuda.findMany({
      where: {
        negocioId,
        monto: { gt: prisma.deuda.fields.montoPagado as any },
      },
      include: {
        proveedor: { select: { nombre: true } }
      },
      take: 10,
      orderBy: [
        { monto: "desc" },
        { createdAt: "asc" }
      ]
    });

    return deudas.map(d => ({
      id: d.id,
      nombre: d.proveedor?.nombre || d.descripcionAcreedor || "Varios / Otros",
      monto: Number(d.monto),
      pendiente: Number(d.monto) - Number(d.montoPagado),
      fecha: d.createdAt,
    }));
  },

  async getMetodosPagoDistribucion(negocioId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pagos = await prisma.ventaPago.groupBy({
      by: ["metodo"],
      where: {
        venta: {
          negocioId,
          createdAt: { gte: today },
          estado: { not: "ANULADA" },
        },
      },
      _sum: {
        montoBase: true, // Monto en USD
      },
    });

    return pagos.map(p => ({
      metodo: p.metodo,
      monto: Number(p._sum.montoBase || 0),
    }));
  },

  async getVentasPorHora(negocioId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.$queryRaw<{ hora: number; total: number }[]>`
      SELECT EXTRACT(HOUR FROM "createdAt") AS hora, SUM(total) AS total
      FROM "Venta"
      WHERE "negocioId" = ${negocioId}
        AND "createdAt" >= ${today}
        AND estado != 'ANULADA'
      GROUP BY hora
      ORDER BY hora
    `;

    return result.map(r => ({
      hour: Number(r.hora),
      total: Number(r.total),
    }));
  },

  async getTopProductos(negocioId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.ventaDetalle.groupBy({
      by: ["productoId"],
      where: {
        venta: {
          negocioId,
          estado: { not: "ANULADA" },
          createdAt: { gte: thirtyDaysAgo },
        }
      },
      _sum: {
        cantidad: true,
        subtotal: true,
      },
      take: 5,
      orderBy: {
        _sum: {
          cantidad: "desc"
        }
      }
    });

    // Hidratar nombres
    const productIds = result.map(r => r.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: productIds } },
      select: { id: true, nombre: true }
    });

    return result.map(r => {
      const p = productos.find(prod => prod.id === r.productoId);
      return {
        nombre: p?.nombre || "Desconocido",
        vendido: Number(r._sum.cantidad || 0),
        monto: Number(r._sum.subtotal || 0),
      };
    });
  },

  async getCajasActivas(negocioId: string) {
    const cierres = await prisma.cierre.findMany({
      where: {
        negocioId,
        estado: "ABIERTO",
      },
      include: {
        user: {
          select: { name: true, permissions: true }
        }
      },
      orderBy: {
        totalVentas: "desc"
      }
    });

    return cierres.map(c => {
      const perms = c.user.permissions as any;
      return {
        id: c.id,
        usuario: c.user.name,
        nombreCaja: perms?.nombreCaja || "Caja General",
        ventasUSD: Number(c.totalVentas),
        operaciones: c.cantVentas,
        desde: c.createdAt
      };
    });
  }
};
