import { prisma } from "../../config/db.config.js";
export const tasaRepository = {
    findAll: async (negocioId) => {
        return prisma.tasaCambio.findMany({
            where: { negocioId },
            orderBy: { createdAt: "desc" },
        });
    },
    findById: async (id, negocioId) => {
        return prisma.tasaCambio.findUnique({
            where: { id, negocioId },
        });
    },
    create: async (data, negocioId) => {
        return prisma.tasaCambio.create({
            data: {
                nombre: data.nombre,
                moneda: data.moneda,
                tasa: new prisma.constructor.Decimal(data.tasa),
                isPrincipal: data.isPrincipal || false,
                negocioId,
            },
        });
    },
    update: async (id, data, negocioId) => {
        return prisma.tasaCambio.update({
            where: { id, negocioId },
            data: {
                ...(data.nombre !== undefined && { nombre: data.nombre }),
                ...(data.moneda !== undefined && { moneda: data.moneda }),
                ...(data.tasa !== undefined && { tasa: new prisma.constructor.Decimal(data.tasa) }),
                ...(data.isPrincipal !== undefined && { isPrincipal: data.isPrincipal })
            },
        });
    },
    delete: async (id, negocioId) => {
        return prisma.tasaCambio.delete({
            where: { id, negocioId },
        });
    },
    /**
     * Cuando se marca una tasa como principal para una moneda,
     * se deben desmarcar las demás de la misma moneda.
     */
    unsetPrincipal: async (moneda, negocioId) => {
        return prisma.tasaCambio.updateMany({
            where: { moneda: moneda, negocioId },
            data: { isPrincipal: false },
        });
    }
};
//# sourceMappingURL=tasas.repository.js.map