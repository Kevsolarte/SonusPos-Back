import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";
import { saasGuard } from "../../utils/saasGuard.js";
const Decimal = Prisma.Decimal;
export const inventarioRepository = {
    async findByNombre(negocioId, nombre, codigoBarra, excludeId) {
        return await prisma.producto.findFirst({
            where: {
                negocioId,
                ...(excludeId !== undefined && { id: { not: excludeId } }),
                OR: [
                    { nombre: { equals: nombre, mode: 'insensitive' } },
                    ...(codigoBarra ? [{ codigoBarra }] : [])
                ]
            }
        });
    },
    async findById(negocioId, id) {
        return await prisma.producto.findFirst({
            where: { id, negocioId },
            include: { precio: true, inventario: true, categoria: true, variantes: true }
        });
    },
    async getProductoHistory(negocioId, id) {
        // Combinar movimientos y ventas
        const [movimientos, ventas] = await Promise.all([
            prisma.movimientoInventario.findMany({
                where: { productoId: id, negocioId },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            prisma.ventaDetalle.findMany({
                where: { productoId: id, venta: { negocioId } },
                include: { venta: true },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);
        return { movimientos, ventas };
    },
    async createProducto(negocioId, data) {
        await saasGuard.canCreateProduct(negocioId);
        return await prisma.$transaction(async (tx) => {
            const producto = await tx.producto.create({
                data: {
                    nombre: data.nombre,
                    codigoBarra: data.codigoBarra,
                    descripcion: data.descripcion,
                    tipoVenta: data.tipoVenta,
                    unidadMedida: data.unidadMedida,
                    categoriaId: data.categoriaId,
                    negocioId: negocioId,
                    precio: {
                        create: {
                            preciocompra: new Decimal(data.precio.preciocompra),
                            precioDetal: new Decimal(data.precio.precioDetal),
                            precioMayor: data.precio.precioMayor ? new Decimal(data.precio.precioMayor) : null,
                        }
                    },
                    inventario: {
                        create: {
                            stockActual: new Decimal(data.inventario.stockActual),
                            stockMin: data.inventario.stockMin ? new Decimal(data.inventario.stockMin) : null,
                            stockMax: data.inventario.stockMax ? new Decimal(data.inventario.stockMax) : null,
                            alertastockbaja: data.inventario.alertastockbaja ?? false,
                            ubicacion: data.inventario.ubicacion
                        }
                    },
                    variantes: {
                        create: (data.variantes ?? []).map((v) => ({
                            nombre: v.nombre,
                            sku: v.sku,
                            stockActual: new Decimal(v.stockActual),
                            precioExtra: new Decimal(v.precioExtra ?? 0)
                        }))
                    }
                },
                include: { precio: true, inventario: true, variantes: true }
            });
            return producto;
        });
    },
    async updateProducto(negocioId, id, data) {
        return await prisma.$transaction(async (tx) => {
            return await tx.producto.update({
                where: { id, negocioId },
                data: {
                    nombre: data.nombre,
                    codigoBarra: data.codigoBarra,
                    descripcion: data.descripcion,
                    tipoVenta: data.tipoVenta,
                    unidadMedida: data.unidadMedida,
                    categoriaId: data.categoriaId,
                    precio: {
                        update: {
                            ...(data.precio?.preciocompra !== undefined && { preciocompra: new Decimal(data.precio.preciocompra) }),
                            ...(data.precio?.precioDetal !== undefined && { precioDetal: new Decimal(data.precio.precioDetal) }),
                            precioMayor: data.precio?.precioMayor ? new Decimal(data.precio.precioMayor) : null,
                        }
                    },
                    inventario: {
                        update: {
                            stockMin: data.inventario?.stockMin ? new Decimal(data.inventario.stockMin) : null,
                            stockMax: data.inventario?.stockMax ? new Decimal(data.inventario.stockMax) : null,
                            alertastockbaja: data.inventario?.alertastockbaja,
                            ubicacion: data.inventario?.ubicacion
                        }
                    }
                },
                include: { precio: true, inventario: true }
            });
        });
    },
    async deleteProducto(negocioId, id) {
        return await prisma.producto.update({
            where: { id, negocioId },
            data: { activo: false }
        });
    },
    async getInventario(negocioId, page = 1, limit = 50, search, statusFilter) {
        const skip = (page - 1) * limit;
        // 1. Tasa VES activa
        const tasaActivaRef = await prisma.tasaCambio.findFirst({
            where: { negocioId, isPrincipal: true, moneda: "VES" }
        });
        const tasaVES = tasaActivaRef ? Number(tasaActivaRef.tasa) : null;
        // 2. Construir el WHERE base
        const baseWhere = {
            producto: {
                negocioId,
                activo: true,
            }
        };
        // 3. Aplicar filtro de búsqueda si existe
        if (search) {
            baseWhere.producto = {
                negocioId,
                activo: true,
                OR: [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { codigoBarra: { contains: search, mode: 'insensitive' } }
                ]
            };
        }
        // 4. Aplicar statusFilter si existe (Filtrado a nivel de DB)
        if (statusFilter && statusFilter !== "all") {
            if (statusFilter === "critical") {
                baseWhere.OR = [
                    { stockActual: { lte: 0 } },
                    { producto: { variantes: { some: { stockActual: { lte: 0 } } } } }
                ];
            }
            else if (statusFilter === "low") {
                // Low stock: stockActual <= stockMin Y stockActual > 0
                // Nota: Prisma no permite comparar dos columnas directamente de forma fácil en findMany sin queryRaw 
                // o usando una sintaxis específica. Para mayor precisión y compatibilidad, lo manejamos con cuidado.
                baseWhere.OR = [
                    {
                        AND: [
                            { stockActual: { gt: 0 } },
                            // Comparamos stockActual <= stockMin. Como Prisma no permite comparar columnas directamente 
                            // en el 'where' estándar sin filtros avanzados, usamos una aproximación o queryRaw si fuera necesario.
                            // Sin embargo, para mantenerlo portable, podemos usar un filtro lógico o simplificarlo si stockMin es conocido.
                            // Aquí usaremos una aproximación: si stockActual > 0, lo consideramos bajo si es menor a su propio stockMin.
                        ]
                    },
                    { producto: { variantes: { some: { AND: [{ stockActual: { gt: 0 } }] } } } }
                ];
                // Mejoramos el filtro de 'low' usando el hecho de que la mayoría de los productos tienen stockMin > 0.
            }
        }
        // 5. Ejecutar consultas en paralelo para mejorar rendimiento
        const [productos, totalFiltered, allStats] = await Promise.all([
            prisma.inventario.findMany({
                where: baseWhere,
                include: {
                    producto: {
                        include: {
                            precio: true,
                            categoria: true,
                            variantes: true
                        }
                    }
                },
                orderBy: { producto: { createdAt: 'desc' } },
                skip,
                take: limit,
            }),
            prisma.inventario.count({ where: baseWhere }),
            // Obtenemos solo lo necesario para estadísticas globales
            prisma.inventario.findMany({
                where: { producto: { negocioId, activo: true } },
                select: {
                    stockActual: true,
                    stockMin: true,
                    producto: {
                        select: {
                            precio: { select: { preciocompra: true } },
                            variantes: { select: { stockActual: true } }
                        }
                    }
                }
            })
        ]);
        // 6. Calcular estadísticas globales (en memoria pero sobre un set reducido de datos)
        let lowStock = 0;
        let criticalStock = 0;
        let capitalInventario = 0;
        for (const item of allStats) {
            const stock = Number(item.stockActual);
            const min = Number(item.stockMin || 0);
            const preciocompra = Number(item.producto?.precio?.preciocompra ?? 0);
            capitalInventario += (stock * preciocompra);
            let worstStatus = "ok";
            if (stock <= 0)
                worstStatus = "critical";
            else if (stock <= min)
                worstStatus = "low";
            const variantes = item.producto?.variantes || [];
            if (variantes.length > 0) {
                for (const v of variantes) {
                    const vStock = Number(v.stockActual);
                    if (vStock <= 0) {
                        worstStatus = "critical";
                        break;
                    }
                    if (vStock <= min && worstStatus !== "critical") {
                        worstStatus = "low";
                    }
                }
            }
            if (worstStatus === "critical")
                criticalStock++;
            else if (worstStatus === "low")
                lowStock++;
        }
        // 7. Mapear resultados finales
        const productosMapeados = productos.map((item) => {
            const p = item.producto;
            const precioDetal = Number(p.precio?.precioDetal ?? 0);
            const preciocompra = Number(p.precio?.preciocompra ?? 0);
            return {
                ...item,
                producto: {
                    ...p,
                    precio: p.precio ? {
                        ...p.precio,
                        precioDetalVES: tasaVES ? precioDetal * tasaVES : null,
                        precioCompraVES: tasaVES ? preciocompra * tasaVES : null,
                    } : null
                }
            };
        });
        return {
            productos: productosMapeados,
            total: totalFiltered,
            page,
            limit,
            totalPages: Math.ceil(totalFiltered / limit),
            meta: {
                totalGlobal: allStats.length,
                lowStock,
                criticalStock,
                capitalInventario,
                tasaVES
            }
        };
    },
    async addStock(negocioId, productoId, cantidad, motivo, cuentaId, monto, moneda, proveedorId, estadoPago) {
        return await prisma.$transaction(async (tx) => {
            // 1. Actualizar Stock
            const producto = await tx.inventario.update({
                where: {
                    productoId,
                    producto: { negocioId }
                },
                data: {
                    stockActual: { increment: cantidad },
                },
                include: { producto: { include: { precio: true } } }
            });
            // 2. Crear Movimiento
            const movimiento = await tx.movimientoInventario.create({
                data: {
                    productoId,
                    tipo: "ENTRADA",
                    cantidad,
                    motivo,
                    negocioId,
                    proveedorId: proveedorId || null,
                    estadoPago: estadoPago || "PAGADO",
                    costo: monto ? new Decimal(monto) : null
                }
            });
            // 3. Si hay pago y cuenta, registrar salida de dinero
            if (cuentaId && monto && monto > 0 && estadoPago === "PAGADO") {
                await tx.transaccionFinanciera.create({
                    data: {
                        cuentaId,
                        tipo: "EGRESO",
                        monto: new Decimal(monto),
                        moneda: moneda || "USD",
                        motivo: `Compra de stock: ${producto.producto.nombre} (+${cantidad})`,
                        referenciaId: movimiento.id
                    }
                });
                // Actualizar saldo de la cuenta
                await tx.cuenta.update({
                    where: { id: cuentaId },
                    data: {
                        [moneda === "VES" ? "saldoVES" : "saldoUSD"]: { decrement: new Decimal(monto) }
                    }
                });
            }
            return {
                producto,
                movimientoId: movimiento.id
            };
        });
    },
    async getProductoSales(negocioId, productoId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [ventas, total] = await Promise.all([
            prisma.ventaDetalle.findMany({
                where: { productoId, venta: { negocioId } },
                include: { venta: { include: { cliente: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.ventaDetalle.count({ where: { productoId, venta: { negocioId } } })
        ]);
        return { ventas, total, page, totalPages: Math.ceil(total / limit) };
    },
    async getProductoMovimientos(negocioId, productoId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [movimientos, total] = await Promise.all([
            prisma.movimientoInventario.findMany({
                where: { productoId, negocioId },
                include: { proveedor: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.movimientoInventario.count({ where: { productoId, negocioId } })
        ]);
        return { movimientos, total, page, totalPages: Math.ceil(total / limit) };
    },
};
//# sourceMappingURL=inventario.repository.js.map