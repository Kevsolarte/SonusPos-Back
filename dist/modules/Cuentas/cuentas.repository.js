import { prisma } from "../../config/db.config.js";
import {} from "./cuentas.schema.js";
export const cuentasRepository = {
    async create(negocioId, data) {
        return await prisma.cuenta.create({
            data: {
                nombre: data.nombre,
                tipo: data.tipo,
                saldoUSD: data.saldoUSD ?? 0,
                saldoVES: data.saldoVES ?? 0,
                negocioId,
            },
        });
    },
    async findAll(negocioId) {
        return await prisma.cuenta.findMany({
            where: { negocioId, activo: true },
            orderBy: { nombre: "asc" },
        });
    },
    async findById(id, negocioId) {
        return await prisma.cuenta.findFirst({
            where: { id, negocioId },
        });
    },
    async update(id, negocioId, data) {
        return await prisma.cuenta.update({
            where: { id, negocioId },
            data: {
                ...(data.nombre !== undefined && { nombre: data.nombre }),
                ...(data.tipo !== undefined && { tipo: data.tipo }),
                ...(data.activo !== undefined && { activo: data.activo })
            },
        });
    },
    async delete(id, negocioId) {
        return await prisma.cuenta.update({
            where: { id, negocioId },
            data: { activo: false },
        });
    },
    /**
     * Historial de todos los movimientos de una cuenta, paginado.
     */
    async findMovimientos(cuentaId, negocioId, params) {
        const cuenta = await prisma.cuenta.findFirst({
            where: { id: cuentaId, negocioId },
        });
        if (!cuenta)
            return null;
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        const skip = (page - 1) * limit;
        const where = { cuentaId };
        if (params?.tipo)
            where.tipo = params.tipo;
        const [movimientos, total] = await Promise.all([
            prisma.transaccionFinanciera.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.transaccionFinanciera.count({ where }),
        ]);
        return { cuenta, movimientos, total, page, limit, totalPages: Math.ceil(total / limit) };
    },
    /**
     * Registra un ingreso/egreso y actualiza AMBOS balances (USD + VES) en una sola transacción.
     * - Si moneda = USD: saldoUSD ± monto | saldoVES ± (monto * tasaVES)
     * - Si moneda = VES: saldoVES ± monto | saldoUSD ± (monto / tasaVES)
     */
    async registrarMovimiento(data) {
        const signo = data.tipo === "INGRESO" ? 1 : -1;
        const tasa = data.tasaVES;
        // Calcular ambos montos con la tasa activa
        const deltaUSD = data.moneda === "USD"
            ? data.monto * signo
            : (data.monto / tasa) * signo;
        const deltaVES = data.moneda === "VES"
            ? data.monto * signo
            : (data.monto * tasa) * signo;
        // Operaciones atómicas (se ejecutan dentro del tx externo o en uno nuevo)
        const doWork = async (tx) => {
            const transaccion = await tx.transaccionFinanciera.create({
                data: {
                    cuentaId: data.cuentaId,
                    tipo: data.tipo,
                    monto: data.monto,
                    moneda: data.moneda,
                    tasaUsada: data.tasaVES, // ← snapshot de la tasa para auditoría
                    motivo: data.motivo,
                    referencia: data.referencia ?? null,
                    referenciaId: data.referenciaId ?? null,
                },
            });
            await tx.cuenta.update({
                where: { id: data.cuentaId, negocioId: data.negocioId },
                data: {
                    saldoUSD: { increment: deltaUSD },
                    saldoVES: { increment: deltaVES },
                },
            });
            return transaccion;
        };
        // Si ya viene un tx externo, ejecutamos directamente (sin anidar transacciones)
        if (data.tx) {
            return await doWork(data.tx);
        }
        return await prisma.$transaction(async (tx) => doWork(tx));
    },
};
//# sourceMappingURL=cuentas.repository.js.map