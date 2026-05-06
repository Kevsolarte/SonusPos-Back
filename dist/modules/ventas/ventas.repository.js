import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.config.js";
export const ventasRepository = {
    async findProductsForVenta(negocioId, productIds) {
        return await prisma.producto.findMany({
            where: {
                id: { in: productIds },
                negocioId
            },
            include: {
                precio: true,
                variantes: true,
                componentes: true,
                promociones: {
                    where: {
                        promocion: {
                            activa: true,
                            fechaInicio: { lte: new Date() },
                            fechaFin: { gte: new Date() }
                        }
                    },
                    include: { promocion: true }
                }
            }
        });
    },
    async saveVenta(tx, data) {
        return await tx.venta.create({
            data,
            include: { pagos: true, detalles: true }
        });
    },
    async updateStock(tx, productoId, cantidad) {
        return await tx.inventario.update({
            where: { productoId },
            data: {
                stockActual: {
                    decrement: cantidad
                }
            }
        });
    },
    async updateVarianteStock(tx, varianteId, cantidad) {
        return await tx.productoVariante.update({
            where: { id: varianteId },
            data: {
                stockActual: {
                    decrement: cantidad
                }
            }
        });
    },
    async createMovimiento(tx, data) {
        return await tx.movimientoInventario.create({
            data: {
                negocioId: data.negocioId,
                productoId: data.productoId,
                tipo: data.tipo,
                cantidad: data.cantidad,
                motivo: data.motivo
            }
        });
    }
};
//# sourceMappingURL=ventas.repository.js.map