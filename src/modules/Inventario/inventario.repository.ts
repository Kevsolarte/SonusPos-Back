import { prisma } from "../../config/db.config.js";





export const inventarioRepository = {
    /**
     * Crea un producto con su precio, inventario inicial 
     * y genera el primer movimiento de entrada.
     */
    async createProducto(negocioId: string, data: any) {
        return await prisma.producto.create({
            data: {
                negocioId,
                nombre: data.nombre,
                codigoBarra: data.codigoBarra,
                descripcion: data.descripcion,
                tipoVenta: data.tipoVenta || 'UNIDAD',
                unidadMedida: data.unidadMedida,

                // Creación del bloque de Precio
                precio: {
                    create: {
                        preciocompra: data.precio.preciocompra,
                        precioDetal: data.precio.precioDetal,
                        precioMayor: data.precio.precioMayor || null,
                    }
                },
                // Creación del bloque de Inventario
                inventario: {
                    create: {
                        stockActual: data.inventario.stockActual,
                        stockMin: data.inventario.stockMin,
                        stockMax: data.inventario.stockMax || 1000,
                        ubicacion: data.inventario.ubicacion,
                    }
                },
                // Registro automático del primer movimiento (Historial)
                movimientos: {
                    create: {
                        negocioId,
                        tipo: 'ENTRADA',
                        cantidad: data.inventario.stockActual,
                        motivo: 'Carga inicial de producto'
                    }
                }
            },
            include: {
                precio: true,
                inventario: true
            }
        });
    },

    async updateProducto(negocioId: string, id: string, data: any) {
        // Aseguramos que el producto pertenezca al negocio
        return await prisma.producto.update({
            where: { id, negocioId },
            data: {
                nombre: data.nombre,
                codigoBarra: data.codigoBarra,
                descripcion: data.descripcion,
                unidadMedida: data.unidadMedida,
                precio: {
                    update: {
                        preciocompra: data.precio?.preciocompra,
                        precioDetal: data.precio?.precioDetal,
                        precioMayor: data.precio?.precioMayor,
                    }
                },
                inventario: {
                    update: {
                        stockActual: data.inventario?.stockActual,
                        stockMin: data.inventario?.stockMin,
                        stockMax: data.inventario?.stockMax,
                        ubicacion: data.inventario?.ubicacion,
                    }
                }
            },
            include: { precio: true, inventario: true }
        });
    },

    async deleteProducto(negocioId: string, id: string) {
        // Soft delete: marcar como inactivo para preservar historial
        return await prisma.producto.update({
            where: { id, negocioId },
            data: { activo: false }
        });
    },

    async findByNombre(negocioId: string, nombre: string, codigoBarra: string | null, excludeId?: string) {
        const OR: any[] = [{ nombre: nombre }];

        if (codigoBarra) {
            OR.push({ codigoBarra: codigoBarra });
        }

        return await prisma.producto.findFirst({
            where: {
                negocioId,
                activo: true,
                ...(excludeId ? { NOT: { id: excludeId } } : {}),
                OR
            } as any
        });
    },

    async findById(negocioId: string, id: string) {
        return await prisma.producto.findFirst({
            where: { id, negocioId, activo: true } as any,
            include: {
                precio: true,
                inventario: true
            }
        });
    },
    async getInventario(negocioId: string, page = 1, limit = 50, search = "") {
        const skip = (page - 1) * limit;

        // 1. Filtro base
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

        // 2. Consulta paginada y conteo
        const [productos, total] = await Promise.all([
            prisma.inventario.findMany({
                where,
                include: {
                    producto: {
                        include: {
                            precio: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    producto: { nombre: 'asc' }
                }
            }),
            prisma.inventario.count({ where })
        ]);

        let capitalInventario = 0;
        let gananciaEstimada = 0;

        // 3. Cálculos de totales (Opcional: Solo en primera página sin búsqueda para ahorrar recursos)
        if (page === 1 && !search) {
            const todos = await prisma.inventario.findMany({
                where: {
                    producto: {
                        negocioId,
                        activo: true
                    }
                },
                select: {
                    stockActual: true,
                    producto: {
                        select: {
                            precio: {
                                select: {
                                    preciocompra: true,
                                    precioDetal: true
                                }
                            }
                        }
                    }
                }
            });

            for (const item of todos) {
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
            // 1. Actualizar Stock
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

            // 2. Crear Movimiento
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
