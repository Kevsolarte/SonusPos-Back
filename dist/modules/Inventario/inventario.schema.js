import { z } from "zod";
// Helper para transformar "" en null
const emptyToNull = z.string().transform(v => v === "" ? null : v).nullable().optional();
export const createProductoSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio").max(100),
    codigoBarra: emptyToNull,
    descripcion: emptyToNull,
    imagenUrl: z.preprocess((val) => val === "" ? null : val, z.string().url().nullable().optional()),
    categoriaId: z.preprocess((val) => val === "" ? null : val, z.string().uuid("Categoría inválida").optional().nullable()),
    esCombo: z.boolean().optional().default(false),
    componentes: z.array(z.object({
        componenteId: z.string().uuid(),
        cantidad: z.number().positive()
    })).optional().nullable(),
    tipoVenta: z.enum(["PESO", "UNIDAD"]).optional().default("UNIDAD"),
    unidadMedida: z.string().max(20).optional().default("UNIDAD"),
    precio: z.object({
        preciocompra: z.number().min(0).default(0),
        precioDetal: z.number().positive("El precio al detal debe ser mayor a 0"),
        precioMayor: z.number().min(0).optional().default(0),
    }),
    inventario: z.object({
        stockActual: z.number().min(0).default(0),
        stockMin: z.number().min(0).optional().default(0),
        stockMax: z.number().min(0).optional().nullable(),
        alertastockbaja: z.boolean().optional().default(false),
        ubicacion: emptyToNull,
    }),
    variantes: z.array(z.object({
        nombre: z.string().min(1, "Nombre de variante obligatorio"),
        sku: z.string().optional().nullable(),
        stockActual: z.number().min(0).default(0),
        precioExtra: z.coerce.number().default(0)
    })).optional().nullable(),
});
export const updateProductoSchema = createProductoSchema.partial();
export const addStockSchema = z.object({
    productoId: z.string().uuid("ID de producto inválido"),
    cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
    motivo: z.string().max(255).optional(),
    cuentaId: z.string().uuid().optional().nullable(),
    monto: z.number().min(0).optional().nullable(),
    proveedorId: z.string().uuid().optional().nullable(),
    estadoPago: z.enum(["PAGADO", "PENDIENTE"]).optional().nullable(),
});
//# sourceMappingURL=inventario.schema.js.map