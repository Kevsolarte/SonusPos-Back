import { prisma } from "../config/db.config.js";
import { AppError } from "../middlewares/error.middleware.js";
export const saasGuard = {
    /**
     * Verifica si un negocio puede crear más productos basándose en su límite de plan.
     */
    async canCreateProduct(negocioId) {
        const negocio = await prisma.negocio.findUnique({
            where: { id: negocioId },
            select: {
                limiteProductos: true,
                _count: { select: { productos: { where: { activo: true } } } }
            }
        });
        if (!negocio)
            throw new AppError("Negocio no encontrado", 404);
        if (negocio._count.productos >= negocio.limiteProductos) {
            throw new AppError(`Límite de productos alcanzado (${negocio.limiteProductos}). Sube de nivel tu plan para agregar más.`, 403);
        }
    },
    /**
     * Verifica si un negocio puede crear más usuarios.
     */
    async canCreateUser(negocioId) {
        const negocio = await prisma.negocio.findUnique({
            where: { id: negocioId },
            select: {
                limiteUsuarios: true,
                _count: { select: { users: { where: { activo: true } } } }
            }
        });
        if (!negocio)
            throw new AppError("Negocio no encontrado", 404);
        if (negocio._count.users >= negocio.limiteUsuarios) {
            throw new AppError(`Límite de usuarios alcanzado (${negocio.limiteUsuarios}). Sube de nivel tu plan para agregar más.`, 403);
        }
    }
};
//# sourceMappingURL=saasGuard.js.map