import { prisma } from "../../config/db.config.js";
import { ventasRepository } from "./ventas.repository.js";
import { createVentaFullSchema, calcularTotalesSchema } from "./ventas.schema.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../middlewares/error.middleware.js";
import { cuentasRepository } from "../Cuentas/cuentas.repository.js";
import { cobrosRepository } from "../Creditos/creditos.repository.js";
import { cierresRepository } from "../Cierres/cierres.repository.js";
function makeVentaNumero() {
    return `V-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
export const ventasService = {
    async createVenta(negocioId, userId, dto) {
        const body = createVentaFullSchema.parse(dto);
        // ... existing logic ...
        const activeCierre = await cierresRepository.getActiveCierre(userId, negocioId);
        if (!activeCierre) {
            throw new AppError("Debes abrir caja para poder realizar ventas.", 403);
        }
        const tasaActiva = await prisma.tasaCambio.findFirst({
            where: { negocioId, isPrincipal: true, moneda: "VES" }
        });
        if (!tasaActiva) {
            throw new AppError("No hay tasa de cambio activa. Configura una en Tasas de Cambio.", 400);
        }
        const tasaVES = Number(tasaActiva.tasa);
        const totalesCalculados = await this.calcularTotalesVenta(negocioId, body.detalles.map(d => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            varianteId: d.varianteId || null
        })), Number(body.descuentoPorcentaje || 0));
        const totalVenta = new Prisma.Decimal(totalesCalculados.total);
        // ... payments validation ...
        let totalPagos = new Prisma.Decimal(0);
        for (const pago of body.pagos) {
            const montoPago = new Prisma.Decimal(pago.montoBase);
            totalPagos = totalPagos.plus(montoPago);
            if (["EFECTIVO", "EFECTIVO_USD", "EFECTIVO_VES"].includes(pago.metodo)) {
                if (pago.recibido && pago.cambio) {
                    const recibido = new Prisma.Decimal(pago.recibido);
                    const cambioEnviado = new Prisma.Decimal(pago.cambio);
                    const cambioCalculado = recibido.minus(montoPago);
                    if (!cambioEnviado.equals(cambioCalculado)) {
                        throw new AppError(`El cambio enviado (${cambioEnviado}) no coincide con el cálculo (${cambioCalculado})`);
                    }
                }
            }
        }
        if (body.estado === "PAGADA" && !totalPagos.equals(totalVenta)) {
            throw new AppError(`El total de pagos (${totalPagos}) no coincide con el total de la venta (${totalVenta})`);
        }
        if (body.estado === "CREDITO") {
            if (!body.clienteId && !body.clienteCreate) {
                throw new AppError("Debes seleccionar un cliente para una venta a crédito.", 400);
            }
            if (totalPagos.greaterThan(totalVenta)) {
                throw new AppError("Los pagos no pueden ser mayores al total en una venta a crédito.");
            }
        }
        return await prisma.$transaction(async (tx) => {
            let clienteId = body.clienteId;
            if (body.clienteCreate) {
                const nuevoCliente = await tx.cliente.create({
                    data: {
                        negocioId,
                        nombre: body.clienteCreate.nombre,
                        documento: body.clienteCreate.documento ?? null,
                        telefono: body.clienteCreate.telefono ?? null,
                        email: body.clienteCreate.email ?? null,
                        direccion: body.clienteCreate.direccion ?? null,
                    }
                });
                clienteId = nuevoCliente.id;
            }
            else if (clienteId) {
                const c = await tx.cliente.findFirst({ where: { id: clienteId, negocioId } });
                if (!c)
                    throw new AppError("El cliente no pertenece a tu negocio.");
            }
            const nuevaVenta = await ventasRepository.saveVenta(tx, {
                negocioId,
                userId,
                cierreId: activeCierre.id,
                numero: makeVentaNumero(),
                clienteId: clienteId ?? null,
                subtotal: new Prisma.Decimal(totalesCalculados.subtotal),
                descuento: new Prisma.Decimal(totalesCalculados.descuento),
                descuentoPorcentaje: new Prisma.Decimal(totalesCalculados.descuentoPorcentaje),
                impuesto: new Prisma.Decimal(totalesCalculados.impuesto),
                total: totalVenta,
                tasaCambio: new Prisma.Decimal(tasaVES),
                totalLocal: totalVenta.mul(new Prisma.Decimal(tasaVES)),
                nota: body.nota ?? null,
                estado: body.estado,
                detalles: {
                    create: totalesCalculados.detalles.map(d => ({
                        productoId: d.productoId,
                        cantidad: new Prisma.Decimal(d.cantidad),
                        precioUnitario: new Prisma.Decimal(d.precioUnitario),
                        subtotal: new Prisma.Decimal(d.subtotal),
                        tipoVenta: d.tipoVenta,
                        unidadMedida: d.unidadMedida,
                        promocionId: d.promocionId || null,
                        varianteId: d.varianteId || null
                    }))
                },
                pagos: {
                    create: body.pagos.map(p => ({
                        metodo: p.metodo,
                        montoBase: new Prisma.Decimal(p.montoBase),
                        montoLocal: p.montoLocal ? new Prisma.Decimal(p.montoLocal) : null,
                        moneda: p.moneda,
                        tasaCambioId: p.tasaCambioId ?? null,
                        tasaCambioUsada: p.tasaCambioUsada ? new Prisma.Decimal(p.tasaCambioUsada) : null,
                        referencia: p.referencia ?? null,
                        ultimos4: p.ultimos4 ?? null,
                        recibido: p.recibido ? new Prisma.Decimal(p.recibido) : null,
                        cambio: p.cambio ? new Prisma.Decimal(p.cambio) : null,
                        cuentaId: p.cuentaId ?? null
                    }))
                }
            });
            // ... rest of the code ...
            for (const pago of body.pagos) {
                if (pago.cuentaId) {
                    const montoPago = pago.moneda === "VES" && pago.montoLocal
                        ? Number(pago.montoLocal)
                        : Number(pago.montoBase);
                    await cuentasRepository.registrarMovimiento({
                        cuentaId: pago.cuentaId,
                        negocioId,
                        monto: montoPago,
                        tipo: "INGRESO",
                        moneda: pago.moneda,
                        motivo: `Venta #${nuevaVenta.numero}`,
                        referenciaId: nuevaVenta.id,
                        tasaVES,
                        tx,
                    });
                }
            }
            // Registrar salidas de stock e inventario
            for (const detalle of totalesCalculados.detalles) {
                const cantidadVendida = new Prisma.Decimal(detalle.cantidad);
                if (detalle.esCombo && detalle.componentes.length > 0) {
                    for (const comp of detalle.componentes) {
                        const totalADescontar = new Prisma.Decimal(comp.cantidad).times(cantidadVendida);
                        await ventasRepository.updateStock(tx, comp.componenteId, totalADescontar);
                        await ventasRepository.createMovimiento(tx, {
                            negocioId,
                            productoId: comp.componenteId,
                            tipo: "SALIDA",
                            cantidad: totalADescontar,
                            motivo: `Componente de Combo: ${detalle.nombreProducto} (Venta #${nuevaVenta.numero})`
                        });
                    }
                }
                else if (detalle.varianteId) {
                    await ventasRepository.updateVarianteStock(tx, detalle.varianteId, cantidadVendida);
                    await ventasRepository.createMovimiento(tx, {
                        negocioId,
                        productoId: detalle.productoId,
                        tipo: "SALIDA",
                        cantidad: cantidadVendida,
                        motivo: `Venta #${nuevaVenta.numero} (Variante)`
                    });
                }
                else {
                    await ventasRepository.updateStock(tx, detalle.productoId, cantidadVendida);
                    await ventasRepository.createMovimiento(tx, {
                        negocioId,
                        productoId: detalle.productoId,
                        tipo: "SALIDA",
                        cantidad: cantidadVendida,
                        motivo: `Venta #${nuevaVenta.numero}`
                    });
                }
            }
            if (nuevaVenta.estado === "CREDITO") {
                const diferencia = totalVenta.minus(totalPagos);
                if (diferencia.greaterThan(0)) {
                    await tx.cobro.create({
                        data: {
                            negocioId,
                            clienteId: nuevaVenta.clienteId,
                            ventaId: nuevaVenta.id,
                            descripcion: `Crédito por Venta #${nuevaVenta.numero}`,
                            monto: Number(diferencia),
                            moneda: "USD",
                            tasaCreacion: tasaVES,
                        }
                    });
                }
            }
            await tx.cierre.update({
                where: { id: activeCierre.id },
                data: {
                    totalVentas: { increment: totalVenta },
                    cantVentas: { increment: 1 }
                }
            });
            return nuevaVenta;
        });
    },
    async calcularTotalesVenta(negocioId, detalles, descuentoPorcentaje = 0) {
        let subtotalAccum = new Prisma.Decimal(0);
        const detallesCalculados = [];
        const productIds = detalles.map(d => d.productoId);
        const productos = await ventasRepository.findProductsForVenta(negocioId, productIds);
        const productosMap = new Map(productos.map(p => [p.id, p]));
        for (const detalle of detalles) {
            const producto = productosMap.get(detalle.productoId);
            if (!producto || !producto.precio) {
                throw new AppError(`Producto ${detalle.productoId} no válido o sin precio.`);
            }
            const cantidad = new Prisma.Decimal(detalle.cantidad);
            let precioUnitario = producto.precio.precioDetal;
            if (detalle.varianteId && producto.variantes) {
                const variante = producto.variantes.find((v) => v.id === detalle.varianteId);
                if (variante) {
                    precioUnitario = variante.precioExtra;
                }
            }
            let promoAplicadaId = null;
            const promoRel = producto.promociones?.[0];
            if (promoRel) {
                const promo = promoRel.promocion;
                promoAplicadaId = promo.id;
                if (promo.tipo === "PORCENTAJE") {
                    const descuento = precioUnitario.times(promo.valor);
                    precioUnitario = precioUnitario.minus(descuento);
                }
                else if (promo.tipo === "PRECIO_FIJO") {
                    precioUnitario = promo.valor;
                }
            }
            const subtotalDetalle = cantidad.times(precioUnitario);
            subtotalAccum = subtotalAccum.plus(subtotalDetalle);
            detallesCalculados.push({
                productoId: producto.id,
                nombreProducto: producto.nombre,
                cantidad: cantidad.toString(),
                precioUnitario: precioUnitario.toString(),
                subtotal: subtotalDetalle.toString(),
                tipoVenta: producto.tipoVenta,
                unidadMedida: producto.unidadMedida,
                esCombo: producto.esCombo,
                componentes: producto.componentes || [],
                promocionId: promoAplicadaId,
                varianteId: detalle.varianteId || null,
            });
        }
        const descuentoMonto = subtotalAccum.times(new Prisma.Decimal(descuentoPorcentaje).div(100));
        const total = subtotalAccum.minus(descuentoMonto);
        return {
            detalles: detallesCalculados,
            subtotal: subtotalAccum.toString(),
            descuento: descuentoMonto.toString(),
            descuentoPorcentaje: descuentoPorcentaje.toString(),
            impuesto: "0",
            total: total.toString(),
        };
    },
    async calcularTotales(negocioId, dto) {
        const body = calcularTotalesSchema.parse(dto);
        return await this.calcularTotalesVenta(negocioId, body.detalles.map(d => ({ ...d, varianteId: d.varianteId || null })));
    },
    async getVentasHistory(negocioId, filters) {
        const where = { negocioId };
        if (filters.startDate || filters.endDate) {
            const dateFilter = {};
            if (filters.startDate)
                dateFilter.gte = new Date(filters.startDate);
            if (filters.endDate)
                dateFilter.lte = new Date(filters.endDate);
            where.createdAt = dateFilter;
        }
        if (filters.metodoPago)
            where.pagos = { some: { metodo: filters.metodoPago } };
        if (filters.estado)
            where.estado = filters.estado;
        if (filters.search) {
            where.OR = [
                { numero: { contains: filters.search, mode: 'insensitive' } },
                { cliente: { nombre: { contains: filters.search, mode: 'insensitive' } } }
            ];
        }
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;
        const [ventas, total] = await Promise.all([
            prisma.venta.findMany({
                where,
                include: {
                    cliente: true,
                    pagos: { include: { cuenta: true } },
                    detalles: { include: { producto: true } }
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.venta.count({ where })
        ]);
        return { ventas, total, page, limit, totalPages: Math.ceil(total / limit) };
    },
    async getVentasStats(negocioId, date) {
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        const [ventas, ventasAnuladas] = await Promise.all([
            prisma.venta.findMany({
                where: {
                    negocioId,
                    estado: 'PAGADA',
                    createdAt: { gte: startOfDay, lte: endOfDay }
                },
                include: { pagos: true }
            }),
            prisma.venta.findMany({
                where: {
                    negocioId,
                    estado: 'ANULADA',
                    createdAt: { gte: startOfDay, lte: endOfDay }
                }
            })
        ]);
        const totalUSD = ventas.reduce((acc, v) => acc.plus(v.total), new Prisma.Decimal(0));
        const totalAnuladasUSD = ventasAnuladas.reduce((acc, v) => acc.plus(v.total), new Prisma.Decimal(0));
        const porMetodo = {};
        ventas.forEach((v) => {
            v.pagos?.forEach((p) => {
                const m = p.metodo.toString();
                porMetodo[m] = (porMetodo[m] || 0) + Number(p.montoBase);
            });
        });
        return {
            totalVentas: ventas.length,
            totalUSD: totalUSD.toNumber(),
            totalAnuladas: ventasAnuladas.length,
            totalAnuladasUSD: totalAnuladasUSD.toNumber(),
            desgloseMetodos: porMetodo
        };
    },
    async voidSale(negocioId, ventaId) {
        // Tasa activa como fallback si el pago no tiene tasaCambioUsada guardada
        const tasaActivaRef = await prisma.tasaCambio.findFirst({
            where: { negocioId, isPrincipal: true, moneda: "VES" }
        });
        const tasaVES = tasaActivaRef ? Number(tasaActivaRef.tasa) : 1;
        return await prisma.$transaction(async (tx) => {
            const venta = await tx.venta.findFirst({
                where: { id: ventaId, negocioId },
                include: { detalles: true, pagos: true }
            });
            if (!venta)
                throw new AppError("Venta no encontrada");
            if (venta.estado === 'ANULADA')
                throw new AppError("La venta ya está anulada");
            // 1. Marcar venta como anulada
            const updatedVenta = await tx.venta.update({
                where: { id: ventaId },
                data: { estado: 'ANULADA' }
            });
            // 2. Reversar Inventario (Devolver stock)
            for (const detalle of venta.detalles) {
                await tx.inventario.update({
                    where: { productoId: detalle.productoId },
                    data: { stockActual: { increment: detalle.cantidad } }
                });
                await ventasRepository.createMovimiento(tx, {
                    negocioId,
                    productoId: detalle.productoId,
                    tipo: 'ENTRADA',
                    cantidad: detalle.cantidad,
                    motivo: `Anulación Venta #${venta.numero}`
                });
            }
            // 3. Reversar Dinero (EGRESO por anulación si hubo cuenta asociada)
            for (const pago of venta.pagos) {
                if (pago.cuentaId) {
                    const montoPago = pago.moneda === "VES" && pago.montoLocal
                        ? Number(pago.montoLocal)
                        : Number(pago.montoBase);
                    // Usar la tasa snapshot guardada en el pago para revertir exactamente lo mismo
                    const tasaSnapshot = pago.tasaCambioUsada
                        ? Number(pago.tasaCambioUsada)
                        : tasaVES;
                    await cuentasRepository.registrarMovimiento({
                        cuentaId: pago.cuentaId,
                        negocioId,
                        monto: montoPago,
                        tipo: "EGRESO",
                        moneda: pago.moneda,
                        motivo: `Anulación Venta #${venta.numero}`,
                        referenciaId: venta.id,
                        tasaVES: tasaSnapshot,
                        tx,
                    });
                }
            }
            return updatedVenta;
        });
    }
};
//# sourceMappingURL=ventas.service.js.map