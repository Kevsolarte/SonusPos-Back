import { z } from "zod";

// ─── Tipos de cuenta (sincronizado con schema.prisma) ─────────────────────────
const tipoCuentaValues = [
  "EFECTIVO",
  "BANCO",
  "DIGITAL",
  "PUNTO_DE_VENTA",
  "PAGO_MOVIL",
  "BIO_PAGO",
  "ZELLE",
  "PAYPAL",
  "BINANCE",
  "TRANSFERENCIA",
] as const;

// ─── Schema: crear cuenta ─────────────────────────────────────────────────────
export const createCuentaSchema = z.object({
  nombre:   z.string().min(1, "El nombre de la cuenta es obligatorio"),
  tipo:     z.enum(tipoCuentaValues, {
    message: "Tipo de cuenta inválido"
  }),
  saldoUSD: z.number().min(0).optional().default(0),
  saldoVES: z.number().min(0).optional().default(0),
});

// ─── Schema: actualizar cuenta ────────────────────────────────────────────────
// ⚠️  saldoUSD y saldoVES se excluyen intencionalmente: el saldo solo cambia
//     a través de movimientos (POST /:id/movimiento), nunca por PATCH directo.
export const updateCuentaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").optional(),
  tipo:   z.enum(tipoCuentaValues).optional(),
  activo: z.boolean().optional(),
});

// ─── Schema: movimiento manual ────────────────────────────────────────────────
export const transaccionManualSchema = z.object({
  tipo:      z.enum(["INGRESO", "EGRESO"]),
  monto:     z.number().positive("El monto debe ser mayor a 0"),
  moneda:    z.enum(["USD", "VES"]),            // qué balance afectar
  motivo:    z.string().min(1, "El motivo es obligatorio"),
  referencia: z.string().optional().nullable(), // número de referencia (opcional)
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type createCuentaType      = z.infer<typeof createCuentaSchema>;
export type updateCuentaType      = z.infer<typeof updateCuentaSchema>;
export type transaccionManualType = z.infer<typeof transaccionManualSchema>;
export type TipoCuenta            = typeof tipoCuentaValues[number];
