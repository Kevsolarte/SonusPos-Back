import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../middlewares/error.middleware.js";

export const movimientosService = {
    async getMovimientos(negocioId: string, filters: any) {
        const { productoId, tipo, startDate, endDate, search, page, limit } = filters;

        // Filtramos por negocioId para seguridad
        const where: Prisma.MovimientoInventarioWhereInput = {
            OR: [
                { negocioId: negocioId },
                { negocioId: null } // Por si hay datos huérfanos de pruebas anteriores
            ]
        };

        if (productoId) {
            where.productoId = productoId;
            // Si filtramos por producto, quitamos el OR del negocio para ser específicos
            delete where.OR;
            where.negocioId = negocioId;
        }

        if (tipo) where.tipo = tipo;

        if (startDate || endDate) {
            const dateFilter: Prisma.DateTimeFilter = {};
            if (startDate) dateFilter.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.lte = end;
            }
            where.createdAt = dateFilter;
        }

        if (search) {
            where.OR = [
                { motivo: { contains: search, mode: 'insensitive' } },
                { producto: { nombre: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const skip = (page - 1) * limit;

        const [movimientos, total] = await Promise.all([
            prisma.movimientoInventario.findMany({
                where,
                include: {
                    producto: {
                        include: {
                            inventario: {
                                select: {
                                    stockActual: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.movimientoInventario.count({ where })
        ]);

        return {
            movimientos,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    },

    async createManualMovimiento(negocioId: string, dto: any) {
        const { productoId, tipo, cantidad, motivo } = dto;

        // 1. Verificar que el producto pertenece al negocio
        const producto = await prisma.producto.findFirst({
            where: { id: productoId, negocioId }
        });

        if (!producto) {
            throw new AppError("Producto no encontrado en su negocio", 404);
        }

        const decimalCantidad = new Prisma.Decimal(cantidad);

        return await prisma.$transaction(async (tx) => {
            // 2. Crear el movimiento
            const movimiento = await tx.movimientoInventario.create({
                data: {
                    negocioId,
                    productoId,
                    tipo,
                    cantidad: decimalCantidad,
                    motivo
                },
                include: { producto: true }
            });

            // 3. Actualizar el stock en inventario
            // Si es ENTRADA o AJUSTE positivo (aunque aquí usamos tipos explícitos)
            // Tipos: ENTRADA, SALIDA, MERMA, AJUSTE
            // Para simplificar: ENTRADA aumenta, el resto disminuye. 
            // O podríamos ser más específicos si AJUSTE pudiera ser positivo/negativo, 
            // pero normalmente se registran como entradas o salidas.

            const isIncrement = tipo === "ENTRADA";

            await tx.inventario.update({
                where: { productoId },
                data: {
                    stockActual: isIncrement
                        ? { increment: decimalCantidad }
                        : { decrement: decimalCantidad }
                }
            });

            return movimiento;
        });
    }
};
