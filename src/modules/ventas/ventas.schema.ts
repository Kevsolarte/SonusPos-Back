import { z } from "zod";

const decimalAsString = z.union([z.string(), z.number()]).transform((v) => String(v));

const clienteCreateSchema = z.object({
  nombre: z.string().min(1),
  documento: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  direccion: z.string().optional(),
});

const ventaDetalleSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: decimalAsString,
  precioUnitario: decimalAsString,
  subtotal: decimalAsString,
  tipoVenta: z.enum(["PESO", "UNIDAD"]),
  unidadMedida: z.enum(["KG", "G", "L", "ML"]),
});

const pagoSchema = z.object({
  metodo: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA"]),
  monto: decimalAsString,
  referencia: z.string().optional(),
  ultimos4: z.string().min(4).max(4).optional(),
  recibido: decimalAsString.optional(),
  cambio: decimalAsString.optional(),
});

export const createVentaFullSchema = z
  .object({
    clienteId: z.string().uuid().optional().nullable(),
    clienteCreate: clienteCreateSchema.optional().nullable(),

    subtotal: decimalAsString,
    descuento: decimalAsString.optional().default("0"),
    impuesto: decimalAsString.optional().default("0"),
    total: decimalAsString,

    nota: z.string().optional(),

    detalles: z.array(ventaDetalleSchema).min(1),
    pagos: z.array(pagoSchema).min(1),
  })
  .refine((d) => !(d.clienteId && d.clienteCreate), {
    message: "Envía clienteId o clienteCreate, no ambos.",
    path: ["clienteId"],
  });
