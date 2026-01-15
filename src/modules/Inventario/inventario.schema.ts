import { z } from "zod";
const decimalAsString = z.union([z.string(), z.number()]).transform((v) => String(v));
export const createProductoSchema = z.object({
    nombre: z.string().min(3).max(100),
    codigoBarra: z.string().min(3).max(100),
    descripcion: z.string().min(3).max(100),
    tipoVenta: z.enum(["PESO", "UNIDAD"]),
    unidadMedida: z.enum(["KG", "G", "L", "ML"]),

    inventario: z.object({
        stockActual: z.number().min(0).max(1000),
        stockMin: z.number().min(0).max(1000),
        stockMax: z.number().min(0).max(1000),
        alertastockbaja: z.boolean(),
        ubicacion: z.string().min(3).max(100),
    }),

    precio: z.object({
        preciocompra: z.number().min(0).max(1000),
        precioDetal: z.number().min(0).max(1000),
        precioMayor: z.number().min(0).max(1000),
        minimoMayor: z.number().min(0).max(1000),
    }),

    movimientos: z.array(
        z.object({
            tipo: z.enum(["ENTRADA", "SALIDA", "MERMA", "AJUSTE"]),
            cantidad: z.number().min(0).max(1000),
            motivo: z.string().min(3).max(100),
        })
    ),
});
export const entradaInventarioSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: decimalAsString.refine((v) => Number(v) > 0, {
    message: "cantidad debe ser mayor que 0",
  }),
  motivo: z.string().optional(),
});
