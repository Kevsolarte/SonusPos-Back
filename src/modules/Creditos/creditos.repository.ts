import { prisma }        from "../../config/db.config.js";
import { cuentasRepository } from "../Cuentas/cuentas.repository.js";
import type { CreateCobroDto, UpdateCobroDto, CreateDeudaDto, UpdateDeudaDto, CreateAbonoDto } from "./creditos.schema.js";
import { AppError } from "../../middlewares/error.middleware.js";

// ─── Helper: derivar estado on-read ──────────────────────────────────────────

function derivarEstado(monto: number, montoPagado: number, fechaVencimiento: Date | null): string {
  if (montoPagado >= monto) return "PAGADO";
  if (montoPagado > 0)      return "PARCIAL";
  if (fechaVencimiento && new Date() > fechaVencimiento) return "VENCIDO";
  return "PENDIENTE";
}

function enriquecer(item: any) {
  return {
    ...item,
    estado: derivarEstado(
      Number(item.monto),
      Number(item.montoPagado),
      item.fechaVencimiento ?? null
    ),
    saldoPendiente: Number(item.monto) - Number(item.montoPagado),
  };
}

// ─── Helper: tasa activa ─────────────────────────────────────────────────────

async function getTasaVES(negocioId: string): Promise<number | null> {
  const t = await (prisma as any).tasaCambio.findFirst({
    where: { negocioId, isPrincipal: true, moneda: "VES" },
  });
  return t ? Number(t.tasa) : null;
}

// ─── Repositorio Cobros ───────────────────────────────────────────────────────

export const cobrosRepository = {
  async findAll(negocioId: string, params?: { page?: number; limit?: number; estado?: string }) {
    const page  = params?.page  ?? 1;
    const limit = params?.limit ?? 50;
    const skip  = (page - 1) * limit;

    const [items, total] = await Promise.all([
      (prisma as any).cobro.findMany({
        where:   { negocioId },
        include: { cliente: true, abonos: { include: { cuenta: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      (prisma as any).cobro.count({ where: { negocioId } }),
    ]);

    const enriquecidos = items.map(enriquecer);

    // Filtrar por estado derivado si se solicita
    const filtrados = params?.estado
      ? enriquecidos.filter((c: any) => c.estado === params.estado)
      : enriquecidos;

    return { cobros: filtrados, total, page, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string, negocioId: string) {
    const cobro = await (prisma as any).cobro.findFirst({
      where:   { id, negocioId },
      include: { cliente: true, venta: true, abonos: { include: { cuenta: true } } },
    });
    return cobro ? enriquecer(cobro) : null;
  },

  async create(negocioId: string, data: CreateCobroDto & { ventaId?: string; tasaCreacion?: number }) {
    const cobro = await (prisma as any).cobro.create({
      data: {
        negocioId,
        clienteId:        data.clienteId        ?? null,
        ventaId:          data.ventaId          ?? null,
        descripcion:      data.descripcion,
        monto:            data.monto,
        moneda:           data.moneda,
        tasaCreacion:     data.tasaCreacion     ?? null,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        notas:            data.notas            ?? null,
      },
      include: { cliente: true },
    });
    return enriquecer(cobro);
  },

  async update(id: string, negocioId: string, data: UpdateCobroDto) {
    const cobro = await (prisma as any).cobro.update({
      where: { id, negocioId },
      data: {
        ...(data.descripcion      && { descripcion: data.descripcion }),
        ...(data.notas !== undefined && { notas: data.notas }),
        fechaVencimiento: data.fechaVencimiento
          ? new Date(data.fechaVencimiento)
          : data.fechaVencimiento === null ? null : undefined,
      },
    });
    return enriquecer(cobro);
  },

  async delete(id: string, negocioId: string) {
    const cobro = await (prisma as any).cobro.findFirst({ where: { id, negocioId } });
    if (!cobro) throw new AppError("Cobro no encontrado", 404);
    if (Number(cobro.montoPagado) > 0)
      throw new AppError("No puedes eliminar un cobro con pagos registrados", 400);
    return await (prisma as any).cobro.delete({ where: { id } });
  },

  /**
   * Registra un abono a un Cobro:
   * 1. Valida que no exceda el saldo pendiente
   * 2. Crea el Abono
   * 3. Actualiza montoPagado en el Cobro
   * 4. Si hay cuentaId → TransaccionFinanciera INGRESO (dinero entra)
   * Todo en una sola transacción.
   */
  async registrarAbono(id: string, negocioId: string, data: CreateAbonoDto) {
    const cobro = await (prisma as any).cobro.findFirst({ where: { id, negocioId } });
    if (!cobro) throw new AppError("Cobro no encontrado", 404);

    const pendiente = Number(cobro.monto) - Number(cobro.montoPagado);
    if (data.monto > pendiente + 0.001)
      throw new AppError(`El abono ($${data.monto}) supera el saldo pendiente ($${pendiente.toFixed(2)})`, 400);

    const tasaVES = data.cuentaId ? await getTasaVES(negocioId) : null;

    return await (prisma as any).$transaction(async (tx: any) => {
      // 1. Crear Abono
      const abono = await tx.abono.create({
        data: {
          cobroId:  id,
          monto:    data.monto,
          moneda:   data.moneda,
          cuentaId: data.cuentaId ?? null,
          tasaUsada: tasaVES,
          notas:    data.notas ?? null,
        },
      });

      // 2. Actualizar montoPagado
      await tx.cobro.update({
        where: { id },
        data:  { montoPagado: { increment: data.monto } },
      });

      // 3. Movimiento financiero si hay cuenta
      if (data.cuentaId && tasaVES) {
        await cuentasRepository.registrarMovimiento({
          cuentaId:    data.cuentaId,
          negocioId,
          monto:       data.monto,
          tipo:        "INGRESO",
          moneda:      data.moneda as "USD" | "VES",
          motivo:      `Cobro recibido: ${cobro.descripcion}`,
          referenciaId: id,
          tasaVES,
          tx,
        });
      }

      return abono;
    });
  },
};

// ─── Repositorio Deudas ───────────────────────────────────────────────────────

export const deudasRepository = {
  async findAll(negocioId: string, params?: { page?: number; limit?: number; estado?: string }) {
    const page  = params?.page  ?? 1;
    const limit = params?.limit ?? 50;
    const skip  = (page - 1) * limit;

    const [items, total] = await Promise.all([
      (prisma as any).deuda.findMany({
        where:   { negocioId },
        include: { proveedor: true, abonos: { include: { cuenta: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      (prisma as any).deuda.count({ where: { negocioId } }),
    ]);

    const enriquecidos = items.map(enriquecer);

    const filtrados = params?.estado
      ? enriquecidos.filter((d: any) => d.estado === params.estado)
      : enriquecidos;

    return { deudas: filtrados, total, page, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string, negocioId: string) {
    const deuda = await (prisma as any).deuda.findFirst({
      where:   { id, negocioId },
      include: { proveedor: true, abonos: { include: { cuenta: true } } },
    });
    return deuda ? enriquecer(deuda) : null;
  },

  async create(negocioId: string, data: CreateDeudaDto & { movimientoId?: string; tasaCreacion?: number }) {
    const deuda = await (prisma as any).deuda.create({
      data: {
        negocioId,
        proveedorId:         data.proveedorId         ?? null,
        descripcionAcreedor: data.descripcionAcreedor ?? null,
        movimientoId:        data.movimientoId        ?? null,
        descripcion:         data.descripcion,
        monto:               data.monto,
        moneda:              data.moneda,
        tasaCreacion:        data.tasaCreacion        ?? null,
        fechaVencimiento:    data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        notas:               data.notas              ?? null,
      },
      include: { proveedor: true },
    });
    return enriquecer(deuda);
  },

  async update(id: string, negocioId: string, data: UpdateDeudaDto) {
    const deuda = await (prisma as any).deuda.update({
      where: { id, negocioId },
      data: {
        ...(data.descripcion      && { descripcion: data.descripcion }),
        ...(data.notas !== undefined && { notas: data.notas }),
        fechaVencimiento: data.fechaVencimiento
          ? new Date(data.fechaVencimiento)
          : data.fechaVencimiento === null ? null : undefined,
      },
    });
    return enriquecer(deuda);
  },

  async delete(id: string, negocioId: string) {
    const deuda = await (prisma as any).deuda.findFirst({ where: { id, negocioId } });
    if (!deuda) throw new AppError("Deuda no encontrada", 404);
    if (Number(deuda.montoPagado) > 0)
      throw new AppError("No puedes eliminar una deuda con pagos registrados", 400);
    return await (prisma as any).deuda.delete({ where: { id } });
  },

  /**
   * Registra un abono a una Deuda:
   * 1. Valida que no exceda el saldo pendiente
   * 2. Crea el Abono
   * 3. Actualiza montoPagado en la Deuda
   * 4. Si hay cuentaId → TransaccionFinanciera EGRESO (dinero sale)
   */
  async registrarAbono(id: string, negocioId: string, data: CreateAbonoDto) {
    const deuda = await (prisma as any).deuda.findFirst({ where: { id, negocioId } });
    if (!deuda) throw new AppError("Deuda no encontrada", 404);

    const pendiente = Number(deuda.monto) - Number(deuda.montoPagado);
    if (data.monto > pendiente + 0.001)
      throw new AppError(`El abono ($${data.monto}) supera el saldo pendiente ($${pendiente.toFixed(2)})`, 400);

    const tasaVES = data.cuentaId ? await getTasaVES(negocioId) : null;

    return await (prisma as any).$transaction(async (tx: any) => {
      const abono = await tx.abono.create({
        data: {
          deudaId:  id,
          monto:    data.monto,
          moneda:   data.moneda,
          cuentaId: data.cuentaId ?? null,
          tasaUsada: tasaVES,
          notas:    data.notas ?? null,
        },
      });

      await tx.deuda.update({
        where: { id },
        data:  { montoPagado: { increment: data.monto } },
      });

      if (data.cuentaId && tasaVES) {
        await cuentasRepository.registrarMovimiento({
          cuentaId:    data.cuentaId,
          negocioId,
          monto:       data.monto,
          tipo:        "EGRESO",
          moneda:      data.moneda as "USD" | "VES",
          motivo:      `Pago de deuda: ${deuda.descripcion}`,
          referenciaId: id,
          tasaVES,
          tx,
        });
      }

      return abono;
    });
  },
};
