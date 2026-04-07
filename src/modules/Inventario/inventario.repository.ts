import { prisma } from "../../config/db.config.js";
import { type createProductoType, type updateProductoType } from "./inventario.schema.js";

export const inventarioRepository = {
    async createProducto(negocioId: string, data: createProductoType) {
        return await prisma.producto.create({
            data: {
                negocioId,
                nombre: data.nombre,
                codigoBarra: data.codigoBarra ?? null,
                descripcion: data.descripcion ?? null,
                tipoVenta: data.tipoVenta,
                unidadMedida: data.unidadMedida,
                imagenUrl: data.imagenUrl ?? null,

                precio: {
                    create: {
                        preciocompra: data.precio.preciocompra,
                        precioDetal: data.precio.precioDetal,
                        precioMayor: data.precio.precioMayor,
                    }
                },
                inventario: {
                    create: {
                        stockActual: data.inventario.stockActual,
                        stockMin: data.inventario.stockMin,
                        stockMax: data.inventario.stockMax,
                        ubicacion: data.inventario.ubicacion ?? null,
                    }
                },
                movimientos: {
                    create: {
                        negocioId,
                        tipo: 'ENTRADA',
                        cantidad: data.inventario.stockActual,
                        motivo: 'Carga inicial de producto'
                    }
                }
            },
            include: { precio: true, inventario: true }
        });
    },

    async updateProducto(negocioId: string, id: string, data: updateProductoType) {
        // Refactorizado para evitar errores de 'exactOptionalPropertyTypes'
        const updateData: any = {
            ...(data.nombre !== undefined && { nombre: data.nombre }),
            ...(data.codigoBarra !== undefined && { codigoBarra: data.codigoBarra }),
            ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
            ...(data.unidadMedida !== undefined && { unidadMedida: data.unidadMedida }),
            ...(data.imagenUrl !== undefined && { imagenUrl: data.imagenUrl }),
        };

        if (data.precio) {
            updateData.precio = {
                update: {
                    ...(data.precio.preciocompra !== undefined && { preciocompra: data.precio.preciocompra }),
                    ...(data.precio.precioDetal !== undefined && { precioDetal: data.precio.precioDetal }),
                    ...(data.precio.precioMayor !== undefined && { precioMayor: data.precio.precioMayor }),
                }
            };
        }

        if (data.inventario) {
            updateData.inventario = {
                update: {
                    ...(data.inventario.stockActual !== undefined && { stockActual: data.inventario.stockActual }),
                    ...(data.inventario.stockMin !== undefined && { stockMin: data.inventario.stockMin }),
                    ...(data.inventario.stockMax !== undefined && { stockMax: data.inventario.stockMax }),
                    ...(data.inventario.ubicacion !== undefined && { ubicacion: data.inventario.ubicacion }),
                }
            };
        }

        return await prisma.producto.update({
            where: { id, negocioId },
            data: updateData,
            include: { precio: true, inventario: true }
        });
    },

    async deleteProducto(negocioId: string, id: string) {
        return await prisma.producto.update({
            where: { id, negocioId },
            data: { activo: false }
        });
    },

    async findByNombre(negocioId: string, nombre: string, codigoBarra: string | null, excludeId?: string) {
        const OR = [{ nombre: nombre }] as any[];
        if (codigoBarra) OR.push({ codigoBarra: codigoBarra });

        return await prisma.producto.findFirst({
            where: {
                negocioId,
                activo: true,
                ...(excludeId ? { NOT: { id: excludeId } } : {}),
                OR
            }
        });
    },

    async findById(negocioId: string, id: string) {
        return await prisma.producto.findFirst({
            where: { id, negocioId, activo: true },
            include: { precio: true, inventario: true }
        });
    },

    async getInventario(negocioId: string, page = 1, limit = 50, search = "") {
        const skip = (page - 1) * limit;

        const where: any = {
            producto: {
                negocioId,
                activo: true,
                ...(search ? {
                    OR: [
                        { nombre: { contains: search, mode: 'insensitive' } },
                        { codigoBarra: { contains: search, mode: 'insensitive' } }
                    ]
                } : {})
            }
        };

        const [productos, total] = await Promise.all([
            prisma.inventario.findMany({
                where,
                include: {
                    producto: { include: { precio: true } }
                },
                skip,
                take: limit,
                orderBy: { producto: { nombre: 'asc' } }
            }),
            prisma.inventario.count({ where })
        ]);

        let capitalInventario = 0;
        let gananciaEstimada = 0;

        if (page === 1 && !search) {
            const stats = await prisma.inventario.findMany({
                where: { producto: { negocioId, activo: true } },
                select: {
                    stockActual: true,
                    producto: {
                        select: {
                            precio: { select: { preciocompra: true, precioDetal: true } }
                        }
                    }
                }
            });

            for (const item of stats) {
                const stock = item.stockActual.toNumber();
                const costo = item.producto.precio?.preciocompra.toNumber() ?? 0;
                const venta = item.producto.precio?.precioDetal.toNumber() ?? 0;

                capitalInventario += stock * costo;
                gananciaEstimada += stock * (venta - costo);
            }
        }

        return {
            productos,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            capitalInventario,
            gananciaEstimada
        };
    },

    async addStock(negocioId: string, productoId: string, cantidad: number, motivo: string) {
        return await prisma.$transaction(async (tx) => {
            const producto = await tx.producto.update({
                where: { id: productoId, negocioId },
                data: {
                    inventario: {
                        update: {
                            stockActual: { increment: cantidad }
                        }
                    }
                },
                include: { inventario: true }
            });

            await tx.movimientoInventario.create({
                data: {
                    negocioId,
                    productoId,
                    tipo: 'ENTRADA',
                    cantidad,
                    motivo
                }
            });

            return producto;
        });
    }
};
