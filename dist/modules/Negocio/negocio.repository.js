import { prisma } from "../../config/db.config.js";
export const negocioRepository = {
    async findByNegocioId(negocioId) {
        return await prisma.negocio.findUnique({
            where: { id: negocioId },
            include: { config: true }
        });
    },
    async getLimits(negocioId) {
        return await prisma.negocio.findUnique({
            where: { id: negocioId },
            select: {
                limiteUsuarios: true,
                limiteProductos: true,
                _count: {
                    select: {
                        users: true,
                        productos: true
                    }
                }
            }
        });
    },
    async updateNegocio(negocioId, data) {
        const { config, ...negocioData } = data;
        return await prisma.$transaction(async (tx) => {
            // 1. Actualizar datos básicos del negocio
            await tx.negocio.update({
                where: { id: negocioId },
                data: {
                    ...(negocioData.nombre !== undefined && { nombre: negocioData.nombre }),
                    ...(negocioData.ruc !== undefined && { ruc: negocioData.ruc ?? null }),
                    ...(negocioData.direccion !== undefined && { direccion: negocioData.direccion ?? null }),
                    ...(negocioData.telefono !== undefined && { telefono: negocioData.telefono ?? null }),
                }
            });
            // 2. Actualizar o crear configuración
            if (config) {
                await tx.negocioConfig.upsert({
                    where: { negocioId },
                    create: {
                        negocioId,
                        ...(config.monedaSimbolo !== undefined && { monedaSimbolo: config.monedaSimbolo }),
                        ...(config.permitirStockNegativo !== undefined && { permitirStockNegativo: config.permitirStockNegativo }),
                        ...(config.ticketMensaje !== undefined && { ticketMensaje: config.ticketMensaje ?? null }),
                    },
                    update: {
                        ...(config.monedaSimbolo !== undefined && { monedaSimbolo: config.monedaSimbolo }),
                        ...(config.permitirStockNegativo !== undefined && { permitirStockNegativo: config.permitirStockNegativo }),
                        ...(config.ticketMensaje !== undefined && { ticketMensaje: config.ticketMensaje ?? null }),
                    }
                });
            }
            return await tx.negocio.findUnique({
                where: { id: negocioId },
                include: { config: true }
            });
        });
    },
    async getSubscriptionData(negocioId) {
        const [negocio, metodosPago, pagos] = await Promise.all([
            this.getLimits(negocioId),
            prisma.saaSMetodoPago.findMany({ where: { activo: true } }),
            prisma.suscripcionPago.findMany({
                where: { negocioId },
                orderBy: { createdAt: 'desc' }
            })
        ]);
        const info = await prisma.negocio.findUnique({
            where: { id: negocioId },
            select: { plan: true, venceEl: true, activo: true }
        });
        return {
            ...info,
            usage: negocio,
            metodosPago,
            pagos
        };
    },
    async createSuscripcionPago(negocioId, data) {
        return await prisma.suscripcionPago.create({
            data: {
                negocioId,
                plan: data.plan,
                ciclo: data.ciclo,
                monto: Number(data.monto),
                metodoPago: data.metodoPago,
                referencia: data.referencia,
                comprobanteUrl: data.comprobanteUrl ?? null,
                fechaPago: new Date(data.fechaPago || new Date()),
                estado: "PENDIENTE"
            }
        });
    }
};
//# sourceMappingURL=negocio.repository.js.map