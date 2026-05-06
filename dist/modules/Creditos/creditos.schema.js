import { z } from "zod";
const MONEDAS = ["USD", "VES"];
// ─── Cobro ────────────────────────────────────────────────────────────────────
export const createCobroSchema = z.object({
    clienteId: z.string().uuid().optional().nullable(),
    descripcion: z.string().min(1, "La descripción es obligatoria"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    moneda: z.enum(MONEDAS).default("USD"),
    fechaVencimiento: z.string().datetime().optional().nullable(),
    notas: z.string().optional().nullable(),
});
export const updateCobroSchema = z.object({
    descripcion: z.string().min(1).optional(),
    fechaVencimiento: z.string().datetime().optional().nullable(),
    notas: z.string().optional().nullable(),
});
// ─── Deuda ────────────────────────────────────────────────────────────────────
export const createDeudaSchema = z.object({
    proveedorId: z.string().uuid().optional().nullable(),
    descripcionAcreedor: z.string().optional().nullable(), // cuando no hay proveedor
    descripcion: z.string().min(1, "La descripción es obligatoria"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    moneda: z.enum(MONEDAS).default("USD"),
    fechaVencimiento: z.string().datetime().optional().nullable(),
    notas: z.string().optional().nullable(),
}).refine((d) => d.proveedorId || d.descripcionAcreedor, { message: "Debe indicar un proveedor o el nombre del acreedor" });
export const updateDeudaSchema = z.object({
    descripcion: z.string().min(1).optional(),
    fechaVencimiento: z.string().datetime().optional().nullable(),
    notas: z.string().optional().nullable(),
});
// ─── Abono (pago parcial o total de un Cobro o Deuda) ─────────────────────────
export const createAbonoSchema = z.object({
    monto: z.number().positive("El monto debe ser mayor a 0"),
    moneda: z.enum(MONEDAS).default("USD"),
    cuentaId: z.string().uuid().optional().nullable(), // cuenta que afecta el saldo
    notas: z.string().optional().nullable(),
});
//# sourceMappingURL=creditos.schema.js.map