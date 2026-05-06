import { movimientosRepository } from "./movimientos.repository.js";
import { createMovimientoManualSchema, listMovimientosQuerySchema } from "./movimientos.schema.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../middlewares/error.middleware.js";
export const movimientosService = {
    async createMovimientoManual(negocioId, dto) {
        // 1. Validar
        const data = createMovimientoManualSchema.parse(dto);
        // 2. Verificar existencia del producto
        const producto = await movimientosRepository.findProducto(data.productoId, negocioId);
        if (!producto)
            throw new AppError("El producto no existe o no pertenece a tu negocio.");
        const cantidadDecimal = new Prisma.Decimal(data.cantidad);
        // 3. Crear el movimiento vía repositorio
        return await movimientosRepository.createMovimientoManual({
            negocioId,
            productoId: data.productoId,
            tipo: data.tipo,
            cantidad: cantidadDecimal,
            motivo: data.motivo
        });
    },
    async getMovimientos(negocioId, query) {
        const filters = listMovimientosQuerySchema.parse(query);
        // Armar el where de Prisma
        const where = {};
        if (filters.productoId)
            where.productoId = filters.productoId;
        if (filters.tipo)
            where.tipo = filters.tipo;
        if (filters.startDate || filters.endDate) {
            const dateFilter = {};
            if (filters.startDate)
                dateFilter.gte = new Date(filters.startDate);
            if (filters.endDate)
                dateFilter.lte = new Date(filters.endDate);
            where.createdAt = dateFilter;
        }
        if (filters.search) {
            where.OR = [
                { motivo: { contains: filters.search, mode: 'insensitive' } },
                { producto: { nombre: { contains: filters.search, mode: 'insensitive' } } },
                { producto: { codigoBarra: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;
        const { movimientos, total } = await movimientosRepository.getMovimientos(negocioId, where, skip, limit);
        return {
            movimientos,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
};
//# sourceMappingURL=movimientos.service.js.map