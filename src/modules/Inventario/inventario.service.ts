import { prisma,  } from "../../config/db.config.js";
import { createProductoSchema, entradaInventarioSchema } from "./inventario.schema.js";
import { Decimal } from "decimal.js";
import { TipoMovimiento } from "../../generated/prisma/client.js";


const dec = (v: string | number) => new Decimal(String(v));


export const inventarioService = {
    async createProducto(dto: unknown) {
        const body = createProductoSchema.parse(dto);

        const producto = await prisma.producto.create({
            data: {
                nombre: body.nombre,
                codigoBarra: body.codigoBarra,
                descripcion: body.descripcion,
                tipoVenta: body.tipoVenta,
                unidadMedida: body.unidadMedida,
                inventario: {
                    create: {
                        stockActual: body.inventario.stockActual,
                        stockMin: body.inventario.stockMin,
                        stockMax: body.inventario.stockMax,
                        alertastockbaja: body.inventario.alertastockbaja,
                        ubicacion: body.inventario.ubicacion,
                    },
                },
                precio: {
                    create: {
                        preciocompra: body.precio.preciocompra,
                        precioDetal: body.precio.precioDetal,
                        precioMayor: body.precio.precioMayor,
                        minimoMayor: body.precio.minimoMayor,
                    },
                },
                movimientos: {
                    create: body.movimientos.map((movimiento) => ({
                        tipo: movimiento.tipo,
                        cantidad: movimiento.cantidad,
                        motivo: movimiento.motivo,
                    })),
                },
            },
            include: {
                inventario: true,
                precio: true,
                movimientos: true,
            },
        });

        return producto;
    },
    async agregarMasProducto(dto: unknown) {
        const body = entradaInventarioSchema.parse(dto);
        return await prisma.$transaction(async (tx) => {
            const producto = await tx.producto.findUnique({
                where: { id: body.productoId },
                select: { id: true },
            });
            if (!producto) throw new Error("Producto no existe");
            // if (!p) throw new Error("Producto no tiene inventario");
            const qty = dec(body.cantidad);
            const inv = await tx.inventario.update({
                where: { productoId: producto.id },
                data: {
                    stockActual: { increment: qty },
                },
            });
            const movimiento = await tx.movimientoInventario.create({
                data: {
                    productoId: body.productoId,
                    tipo: TipoMovimiento.ENTRADA,
                    cantidad: (body.cantidad), // string con 2 decimales
                    motivo: body.motivo ?? "Entrada de inventario",
                },
            });

        })

    }
};
