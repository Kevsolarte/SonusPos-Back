import { prisma } from "../../config/db.config.js";
import { createVentaFullSchema } from "./ventas.schema.js";
import { Prisma, TipoMovimiento } from "../../generated/prisma/client.js";

const dec = (v: string | number) => new Prisma.Decimal(String(v));

function makeVentaNumero() {
    return `V-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export const ventasService = {
    async createVenta(dto: unknown) {
        const body = createVentaFullSchema.parse(dto);

        return await prisma.$transaction(async (tx) => {
            const numero = makeVentaNumero();

            // 1) Prevalidar que todos los productos existen y tienen inventario
            const productoIds = body.detalles.map((d) => d.productoId);

            const productos = await tx.producto.findMany({
                where: { id: { in: productoIds } },
                select: {
                    id: true,
                    nombre: true,
                    inventario: { select: { stockActual: true } },
                },
            });

            if (productos.length !== new Set(productoIds).size) {
                throw new Error("Uno o más productos no existen.");
            }

            const prodMap = new Map(productos.map((p) => [p.id, p]));

            for (const d of body.detalles) {
                const p = prodMap.get(d.productoId);
                if (!p) throw new Error(`Producto no existe: ${d.productoId}`);
                if (!p.inventario) throw new Error(`El producto "${p.nombre}" no tiene inventario creado.`);
            }

            // 2) Actualizar inventario (decrement) con protección contra stock negativo
            for (const d of body.detalles) {
                const qty = dec(d.cantidad);

                const updated = await tx.inventario.updateMany({
                    where: {
                        productoId: d.productoId,
                        stockActual: { gte: qty }, // evita stock negativo
                    },
                    data: {
                        stockActual: { decrement: qty },
                    },
                });

                if (updated.count === 0) {
                    const p = prodMap.get(d.productoId)!;
                    throw new Error(`Stock insuficiente para "${p.nombre}".`);
                }
            }

            // 3) Crear movimientos SALIDA (uno por detalle)
            await tx.movimientoInventario.createMany({
                data: body.detalles.map((d) => ({
                    productoId: d.productoId,
                    tipo: TipoMovimiento.SALIDA,
                    // MovimientoInventario.cantidad es (10,2)
                    cantidad: dec(d.cantidad).toDecimalPlaces(2),
                    motivo: `Venta ${numero}`,
                })),
            });

            // 4) Crear Venta + Detalles + Pagos + Cliente (connect/create)
            const venta = await tx.venta.create({
                data: {
                    numero,
                    estado: "PAGADA",

                    subtotal: body.subtotal,
                    descuento: body.descuento ?? "0",
                    impuesto: body.impuesto ?? "0",
                    total: body.total,

                    nota: body.nota ?? null,

                    ...(body.clienteId
                        ? { cliente: { connect: { id: body.clienteId } } }
                        : body.clienteCreate
                            ? {
                                cliente: {
                                    create: {
                                        nombre: body.clienteCreate.nombre,
                                        documento: body.clienteCreate.documento ?? null,
                                        telefono: body.clienteCreate.telefono ?? null,
                                        email: body.clienteCreate.email ?? null,
                                        direccion: body.clienteCreate.direccion ?? null,
                                    },
                                },
                            }
                            : {}),

                    detalles: {
                        create: body.detalles.map((d) => ({
                            productoId: d.productoId,
                            cantidad: d.cantidad,
                            precioUnitario: d.precioUnitario,
                            subtotal: d.subtotal,
                            tipoVenta: d.tipoVenta,
                            unidadMedida: d.unidadMedida,
                        })),
                    },

                    pagos: {
                        create: body.pagos.map((p) => ({
                            metodo: p.metodo,
                            monto: p.monto,
                            referencia: p.referencia ?? null,
                            ultimos4: p.ultimos4 ?? null,
                            recibido: p.recibido ?? null,
                            cambio: p.cambio ?? null,
                        })),
                    },
                },
                include: {
                    cliente: true,
                    pagos: true,
                    detalles: {
                        include: {
                            producto: {
                                include: {
                                    inventario: true, // ✅ aquí verás el stock ya actualizado
                                },
                            },
                        },
                    },
                },
            });

            return venta;
        });
    },
};
