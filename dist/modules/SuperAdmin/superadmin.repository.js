import { prisma } from "../../config/db.config.js";
import { invalidateBusinessCache } from "../../middlewares/auth.middleware.js";
export const superAdminRepository = {
    // ─── MÉTRICAS GLOBALES ───────────────────────────────────────────────────
    async getGlobalStats() {
        const totalNegocios = await prisma.negocio.count();
        const negociosPorPlan = await prisma.negocio.groupBy({
            by: ['plan'],
            _count: true
        });
        const ultimosErrores = await prisma.errorLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        return {
            totalNegocios,
            negociosPorPlan,
            ultimosErrores
        };
    },
    // ─── GESTIÓN DE NEGOCIOS ─────────────────────────────────────────────────
    async getAllNegocios() {
        return await prisma.negocio.findMany({
            include: {
                _count: {
                    select: {
                        ventas: true,
                        productos: true,
                        users: true
                    }
                },
                config: true
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    async updateNegocioPlan(id, data) {
        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.negocio.update({
                where: { id },
                data
            });
            // Sincronizar el estado de los usuarios con el del negocio
            await tx.user.updateMany({
                where: { negocioId: id },
                data: { activo: data.activo }
            });
            return updated;
        });
        // Invalidar caché para que el cambio sea instantáneo
        invalidateBusinessCache(id);
        return result;
    },
    async getPaymentsByNegocio(negocioId) {
        return await prisma.suscripcionPago.findMany({
            where: { negocioId },
            orderBy: { createdAt: 'desc' }
        });
    },
    async getErrorsByNegocio(negocioId) {
        return await prisma.errorLog.findMany({
            where: { negocioId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    },
    // ─── GESTIÓN DE PAGOS SAAS ───────────────────────────────────────────────
    async getPendingPayments() {
        return await prisma.suscripcionPago.findMany({
            where: { estado: 'PENDIENTE' },
            include: { negocio: true },
            orderBy: { createdAt: 'desc' }
        });
    },
    async approvePayment(pagoId, extensionDays) {
        return await prisma.$transaction(async (tx) => {
            // 1. Obtener datos del pago
            const pago = await tx.suscripcionPago.findUnique({
                where: { id: pagoId },
                include: { negocio: true }
            });
            if (!pago)
                throw new Error("Pago no encontrado");
            // 2. Actualizar estado del pago
            await tx.suscripcionPago.update({
                where: { id: pagoId },
                data: { estado: 'APROBADO' }
            });
            // 3. Calcular nueva fecha de vencimiento
            const currentVence = pago.negocio.venceEl || new Date();
            const newVence = new Date(currentVence);
            newVence.setDate(newVence.getDate() + extensionDays);
            // 4. Determinar límites según el plan
            const PLAN_LIMITS = {
                PRUEBA: { limiteUsuarios: 1, limiteProductos: 50 },
                TIENDITA: { limiteUsuarios: 3, limiteProductos: 250 },
                EMPRESA: { limiteUsuarios: 10, limiteProductos: 1000 },
            };
            const limits = PLAN_LIMITS[pago.plan] ?? { limiteUsuarios: 3, limiteProductos: 250 };
            // 5. Actualizar negocio — activo: true reactiva negocios suspendidos
            const updatedNegocio = await tx.negocio.update({
                where: { id: pago.negocioId },
                data: {
                    plan: pago.plan,
                    venceEl: newVence,
                    limiteUsuarios: limits.limiteUsuarios,
                    limiteProductos: limits.limiteProductos,
                    activo: true,
                }
            });
            // 6. Reactivar todos los usuarios del negocio
            await tx.user.updateMany({
                where: { negocioId: pago.negocioId },
                data: { activo: true }
            });
            return updatedNegocio;
        });
    },
    async rejectPayment(pagoId) {
        return await prisma.suscripcionPago.update({
            where: { id: pagoId },
            data: { estado: 'RECHAZADO' }
        });
    },
    // ─── MÉTODOS DE PAGO SAAS (Tus cuentas) ──────────────────────────────────
    async getMyPaymentMethods() {
        return await prisma.saaSMetodoPago.findMany();
    },
    async createPaymentMethod(data) {
        return await prisma.saaSMetodoPago.create({ data });
    },
    async updatePaymentMethod(id, data) {
        return await prisma.saaSMetodoPago.update({
            where: { id },
            data
        });
    },
    async deletePaymentMethod(id) {
        return await prisma.saaSMetodoPago.delete({
            where: { id }
        });
    }
};
//# sourceMappingURL=superadmin.repository.js.map