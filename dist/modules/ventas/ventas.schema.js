import { z } from "zod";
const decimalAsString = z.union([z.string(), z.number()]).transform((v) => String(v));
const clienteCreateSchema = z.object({
    nombre: z.string().min(1, "Nombre es obligatorio"),
    documento: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
    direccion: z.string().optional(),
});
const ventaDetalleSchema = z.object({
    productoId: z.string().uuid("Producto no existe"),
    varianteId: z.string().uuid("Variante no válida").optional().nullable(),
    cantidad: decimalAsString,
});
const pagoSchema = z.object({
    metodo: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "PAGO_MOVIL", "EFECTIVO_USD", "EFECTIVO_VES", "CREDITO"]),
    montoBase: decimalAsString,
    montoLocal: decimalAsString.optional().nullable(),
    moneda: z.enum(["USD", "VES", "BTC", "EUR", "COP", "OTHER"]).default("USD"),
    tasaCambioId: z.string().uuid().optional().nullable(),
    tasaCambioUsada: decimalAsString.optional().nullable(),
    referencia: z.string().optional().nullable(),
    ultimos4: z.string().optional().nullable(),
    recibido: decimalAsString.optional().nullable(),
    cambio: decimalAsString.optional().nullable(),
    cuentaId: z.string().uuid().optional().nullable(),
});
export const createVentaFullSchema = z
    .object({
    clienteId: z.string().uuid().optional().nullable(),
    clienteCreate: clienteCreateSchema.optional().nullable(),
    nota: z.string().optional(),
    tasaCambio: decimalAsString.optional().nullable(),
    descuentoPorcentaje: decimalAsString.default("0").optional(),
    detalles: z.array(ventaDetalleSchema).min(1),
    pagos: z.array(pagoSchema).min(0), // permitimos 0 pagos si es 100% crédito
    estado: z.enum(["PAGADA", "CREDITO"]).default("PAGADA"),
})
    .refine((d) => !(d.clienteId && d.clienteCreate), {
    message: "Envía clienteId o clienteCreate, no ambos.",
    path: ["clienteId"],
});
export const calcularTotalesSchema = z.object({
    detalles: z.array(z.object({
        productoId: z.string().uuid(),
        varianteId: z.string().uuid().optional().nullable(),
        cantidad: decimalAsString,
    })).min(1),
});
//# sourceMappingURL=ventas.schema.js.map