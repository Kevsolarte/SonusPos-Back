import { prisma } from "../../config/db.config.js";
import { createVentaFullSchema, calcularTotalesSchema } from "./ventas.schema.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../middlewares/error.middleware.js";

function makeVentaNumero() {
    return `V-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export const ventasService = {
    async createVenta(negocioId: string, dto: unknown) {
        const body = createVentaFullSchema.parse(dto);

        // 1. Calcular totales con scope de negocio
        const totalesCalculados = await this.calcularTotalesVenta(
            negocioId,
            body.detalles.map(d => ({ productoId: d.productoId, cantidad: d.cantidad }))
        );
        const totalVenta = new Prisma.Decimal(totalesCalculados.total);

        // 2. Validar pagos
        let totalPagos = new Prisma.Decimal(0);
        for (const pago of body.pagos) {
            const montoPago = new Prisma.Decimal(pago.monto);
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

        if (!totalPagos.equals(totalVenta)) {
            throw new AppError(`El total de pagos (${totalPagos}) no coincide con el total de la venta (${totalVenta})`);
        }

        // 3. Transacción para guardar la venta con scope de negocio
        const venta = await prisma.$transaction(async (tx) => {
            // 3.1 Manejar Cliente
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
            } else if (clienteId) {
                // Verificar que el cliente pertenezca al negocio
                const c = await tx.cliente.findFirst({ where: { id: clienteId, negocioId } });
                if (!c) throw new AppError("El cliente no pertenece a tu negocio.");
            }

            // 3.2 Crear la Venta
            const nuevaVenta = await tx.venta.create({
                data: {
                    negocioId,
                    numero: makeVentaNumero(),
                    clienteId: clienteId ?? null,
                    subtotal: new Prisma.Decimal(totalesCalculados.subtotal),
                    descuento: new Prisma.Decimal(totalesCalculados.descuento),
                    impuesto: new Prisma.Decimal(totalesCalculados.impuesto),
                    total: totalVenta,
                    nota: body.nota ?? null,
                    estado: "PAGADA",

                    detalles: {
                        create: totalesCalculados.detalles.map(d => ({
                            productoId: d.productoId,
                            cantidad: new Prisma.Decimal(d.cantidad),
                            precioUnitario: new Prisma.Decimal(d.precioUnitario),
                            subtotal: new Prisma.Decimal(d.subtotal),
                            tipoVenta: d.tipoVenta as any,
                            unidadMedida: d.unidadMedida as any
                        }))
                    },
                    pagos: {
                        create: body.pagos.map(p => ({
                            metodo: p.metodo as any,
                            monto: new Prisma.Decimal(p.monto),
                            referencia: p.referencia ?? null,
                            ultimos4: p.ultimos4 ?? null,
                            recibido: p.recibido ? new Prisma.Decimal(p.recibido) : null,
                            cambio: p.cambio ? new Prisma.Decimal(p.cambio) : null,
                        }))
                    }
                }
            });

            // 3.3 Descontar Inventario y Registrar Movimientos
            for (const detalle of totalesCalculados.detalles) {
                const cantidadVendida = new Prisma.Decimal(detalle.cantidad);

                // Actualizar stock en Inventario (filtrando por productoId que está ligado al negocio indirectamente, pero mejor ser explícitos si el schema lo permite)
                await tx.inventario.update({
                    where: { productoId: detalle.productoId },
                    data: {
                        stockActual: {
                            decrement: cantidadVendida
                        }
                    }
                });

                // Registrar el movimiento de SALIDA con negocioId
                await tx.movimientoInventario.create({
                    data: {
                        negocioId,
                        productoId: detalle.productoId,
                        tipo: "SALIDA",
                        cantidad: cantidadVendida,
                        motivo: `Venta #${nuevaVenta.numero}`
                    }
                });
            }

            return nuevaVenta;
        });

        return venta;
    },

    async calcularTotalesVenta(negocioId: string, detalles: { productoId: string; cantidad: string }[]) {
        let subtotal = new Prisma.Decimal(0);
        const detallesCalculados = [];
        for (const detalle of detalles) {
            const producto = await prisma.producto.findFirst({
                where: { id: detalle.productoId, negocioId },
                include: { precio: true },
            });
            if (!producto) {
                throw new AppError(`Producto ${detalle.productoId} no encontrado en tu negocio`);
            }
            if (!producto.precio) {
                throw new AppError(`Producto ${producto.nombre} no tiene precio configurado`);
            }
            const cantidad = new Prisma.Decimal(detalle.cantidad);
            const precioUnitario = producto.precio.precioDetal;
            const subtotalDetalle = cantidad.times(precioUnitario);
            subtotal = subtotal.plus(subtotalDetalle);
            detallesCalculados.push({
                productoId: producto.id,
                nombreProducto: producto.nombre,
                cantidad: cantidad.toString(),
                precioUnitario: precioUnitario.toString(),
                subtotal: subtotalDetalle.toString(),
                tipoVenta: producto.tipoVenta,
                unidadMedida: producto.unidadMedida
            });
        }
        const descuento = new Prisma.Decimal(0);
        const impuesto = new Prisma.Decimal(0);
        const total = subtotal.minus(descuento).plus(impuesto);

        return {
            detalles: detallesCalculados,
            subtotal: subtotal.toString(),
            descuento: descuento.toString(),
            impuesto: impuesto.toString(),
            total: total.toString(),
        };
    },

    async calcularTotales(negocioId: string, dto: unknown) {
        const body = calcularTotalesSchema.parse(dto);
        return await this.calcularTotalesVenta(negocioId, body.detalles);
    },

    async getVentasHistory(negocioId: string, filters: { startDate?: string, endDate?: string, metodoPago?: string }) {
        const where: Prisma.VentaWhereInput = { negocioId };

        if (filters.startDate || filters.endDate) {
            const dateFilter: Prisma.DateTimeFilter = {};
            if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
            if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
            where.createdAt = dateFilter;
        }

        if (filters.metodoPago) {
            where.pagos = {
                some: { metodo: filters.metodoPago as any }
            };
        }

        return await prisma.venta.findMany({
            where,
            include: {
                cliente: true,
                pagos: true,
                detalles: {
                    include: { producto: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    async getVentasStats(negocioId: string, date?: string) {
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const [ventas, ventasAnuladas] = await Promise.all([
            prisma.venta.findMany({
                where: {
                    negocioId,
                    estado: 'PAGADA',
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: { pagos: true }
            }),
            prisma.venta.findMany({
                where: {
                    negocioId,
                    estado: 'ANULADA',
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            })
        ]);

        const totalUSD = ventas.reduce((acc, v) => acc.plus(v.total), new Prisma.Decimal(0));
        const totalAnuladasUSD = ventasAnuladas.reduce((acc, v) => acc.plus(v.total), new Prisma.Decimal(0));

        // Desglose por método de pago
        const porMetodo: Record<string, number> = {};
        ventas.forEach(v => {
            v.pagos.forEach(p => {
                const m = p.metodo.toString();
                porMetodo[m] = (porMetodo[m] || 0) + Number(p.monto);
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

    async voidSale(negocioId: string, ventaId: string) {
        return await prisma.$transaction(async (tx) => {
            const venta = await tx.venta.findFirst({
                where: { id: ventaId, negocioId },
                include: { detalles: true }
            });

            if (!venta) throw new AppError("Venta no encontrada");
            if (venta.estado === 'ANULADA') throw new AppError("La venta ya está anulada");

            // 1. Marcar venta como anulada
            const updatedVenta = await tx.venta.update({
                where: { id: ventaId },
                data: { estado: 'ANULADA' }
            });

            // 2. Devolver stock
            for (const detalle of venta.detalles) {
                await tx.inventario.update({
                    where: { productoId: detalle.productoId },
                    data: {
                        stockActual: { increment: detalle.cantidad }
                    }
                });

                // Registrar movimiento de devolución
                await tx.movimientoInventario.create({
                    data: {
                        negocioId,
                        productoId: detalle.productoId,
                        tipo: 'ENTRADA',
                        cantidad: detalle.cantidad,
                        motivo: `Anulación Venta #${venta.numero}`
                    }
                });
            }

            return updatedVenta;
        });
    }
};

