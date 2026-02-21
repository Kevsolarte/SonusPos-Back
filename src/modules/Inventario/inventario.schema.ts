import { z } from "zod";
const decimalAsString = z.union([z.string(), z.number()]).transform((v) => String(v));


export const createProductoSchema = z.object({
    // Nombre: Min 3 letras, máximo 100
    nombre: z.string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100, "El nombre es demasiado largo"),

    codigoBarra: z.string().optional().nullable(),
    descripcion: z.string().max(255, "La descripción es muy larga").optional().nullable(),
    imagenUrl: z.union([z.string().url("URL de imagen inválida"), z.literal("").transform(() => null)]).optional().nullable(),

    // Tipo de Venta (PESO o UNIDAD)
    tipoVenta: z.enum(["PESO", "UNIDAD"]).optional().default("UNIDAD"),

    // Solo permitimos nuestras unidades oficiales
    unidadMedida: z.enum(["KG", "G", "L", "ML", "UNIDAD", "PZA"]),
    inventario: z.object({
        // El stock no puede ser negativo
        stockActual: z.number().min(0, "El stock inicial no puede ser negativo"),
        stockMin: z.number().min(0, "El stock mínimo no puede ser negativo"),
        // Stock máximo opcional, pero si viene debe ser mayor a 0
        stockMax: z.number().min(1, "El stock máximo debe ser al menos 1").optional().default(1000),
        ubicacion: z.string().max(100).optional().nullable(),
    }),
    precio: z.object({
        // Los precios deben ser mayores a 0 siempre
        preciocompra: z.number().positive("El precio de compra debe ser mayor a 0"),
        precioDetal: z.number().positive("El precio detal debe ser mayor a 0"),
        // Precio mayor es opcional, si no viene es 0
        precioMayor: z.number().min(0).optional().default(0),
    })
});

export const updateProductoSchema = createProductoSchema.partial();

export const addStockSchema = z.object({
    productoId: z.string().uuid("ID de producto inválido"),
    cantidad: z.number().positive("La cantidad a agregar debe ser mayor a 0"),
    motivo: z.string().optional().default("Reposición de stock")
});

