import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";
export const promocionesRepository = {
    async create(negocioId, data) {
        const { productosIds, ...promoData } = data;
        return await prisma.promocion.create({
            data: {
                ...promoData,
                negocioId,
                productos: {
                    create: productosIds.map((id) => ({
                        producto: { connect: { id } }
                    }))
                }
            },
            include: { productos: true }
        });
    },
    async getAll(negocioId) {
        return await prisma.promocion.findMany({
            where: { negocioId },
            include: {
                productos: {
                    include: { producto: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    async getById(id, negocioId) {
        return await prisma.promocion.findFirst({
            where: { id, negocioId },
            include: {
                productos: {
                    include: { producto: true }
                }
            }
        });
    },
    async update(id, negocioId, data) {
        const { productosIds, ...promoData } = data;
        return await prisma.$transaction(async (tx) => {
            // Si vienen productos nuevos, borramos los anteriores y creamos los nuevos
            if (productosIds) {
                await tx.promocionProducto.deleteMany({ where: { promocionId: id } });
            }
            return await tx.promocion.update({
                where: { id, negocioId },
                data: {
                    ...promoData,
                    ...(productosIds && {
                        productos: {
                            create: productosIds.map((pid) => ({
                                producto: { connect: { id: pid } }
                            }))
                        }
                    })
                },
                include: { productos: true }
            });
        });
    },
    async delete(id, negocioId) {
        return await prisma.promocion.delete({
            where: { id, negocioId }
        });
    },
    // LÓGICA VITAL: Buscar promo activa para un producto específico
    async findActivePromo(productoId, negocioId) {
        const now = new Date();
        return await prisma.promocion.findFirst({
            where: {
                negocioId,
                activa: true,
                fechaInicio: { lte: now },
                fechaFin: { gte: now },
                productos: {
                    some: { productoId }
                }
            },
            orderBy: { createdAt: 'desc' } // Si hay varias, tomamos la más reciente
        });
    }
};
//# sourceMappingURL=promociones.repository.js.map