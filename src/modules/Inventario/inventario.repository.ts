import { prisma } from "../../config/db.config.js";
import { type createProductoType, type updateProductoType } from "./inventario.schema.js";

export const inventarioRepository = {
    async createProducto(negocioId: string, data: createProductoType) {
        return await prisma.producto.create({
            data: {
                negocioId,
                nombre: data.nombre,
                codigoBarra: data.codigoBarra === undefined ? null : data.codigoBarra,
                descripcion: data.descripcion === undefined ? null : data.descripcion,
                tipoVenta: data.tipoVenta,
                unidadMedida: data.unidadMedida,
                imagenUrl: data.imagenUrl === undefined ? null : data.imagenUrl,

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
                        ubicacion: data.inventario.ubicacion === undefined ? null : data.inventario.ubicacion,
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
        const updateData: any = {
            nombre: data.nombre,
            codigoBarra: data.codigoBarra === undefined ? undefined : (data.codigoBarra ?? null),
            descripcion: data.descripcion === undefined ? undefined : (data.descripcion ?? null),
            unidadMedida: data.unidadMedida,
            imagenUrl: data.imagenUrl === undefined ? undefined : (data.imagenUrl ?? null),
        };

        if (data.precio) {
            updateData.precio = {
                update: {
                    preciocompra: data.precio.preciocompra,
                    precioDetal: data.precio.precioDetal,
                    precioMayor: data.precio.precioMayor,
                }
            };
        }

        if (data.inventario) {
            updateData.inventario = {
                update: {
                    stockActual: data.inventario.stockActual,
                    stockMin: data.inventario.stockMin,
                    stockMax: data.inventario.stockMax,
                    ubicacion: data.inventario.ubicacion === undefined ? undefined : (data.inventario.ubicacion ?? null),
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

        // Optimización: Solo calcular si no hay búsqueda
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
