import { prisma } from "../../config/db.config.js";
export const inventarioRepository = {
    /**
     * Crea un producto con su precio, inventario inicial
     * y genera el primer movimiento de entrada.
     */
    async createProducto(negocioId, data) {
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
    async updateProducto(negocioId, id, data) {
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
    async deleteProducto(negocioId, id) {
        // Soft delete: marcar como inactivo para preservar historial
        return await prisma.producto.update({
            where: { id, negocioId },
            data: { activo: false }
        });
    },
    async findByNombre(negocioId, nombre, codigoBarra, excludeId) {
        return await prisma.producto.findFirst({
            where: {
                negocioId,
                activo: true,
                ...(excludeId ? { NOT: { id: excludeId } } : {}),
                OR: [
                    { nombre: nombre },
                    { codigoBarra: codigoBarra }
                ]
            }
        });
    },
    async findById(negocioId, id) {
        return await prisma.producto.findFirst({
            where: { id, negocioId, activo: true },
            include: {
                precio: true,
                inventario: true
            }
        });
    },
    async getInventario(negocioId) {
        return await prisma.inventario.findMany({
            where: {
                producto: {
                    negocioId,
                    activo: true
                }
            },
            include: {
                producto: {
                    include: {
                        precio: true
                    }
                }
            }
        });
    },
    async addStock(negocioId, productoId, cantidad, motivo) {
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
//# sourceMappingURL=inventario.repository.js.map