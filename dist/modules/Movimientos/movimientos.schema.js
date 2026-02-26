import { z } from "zod";
const decimalAsString = z.union([z.string(), z.number()]).transform((v) => String(v));
export const createMovimientoManualSchema = z.object({
    productoId: z.string().uuid("ID de producto inválido"),
    tipo: z.enum(["ENTRADA", "SALIDA", "MERMA", "AJUSTE"]),
    cantidad: decimalAsString,
    motivo: z.string().min(1, "El motivo es obligatorio").max(255),
});
export const listMovimientosQuerySchema = z.object({
    productoId: z.preprocess((v) => (v === "" ? undefined : v), z.string().uuid().optional()),
    tipo: z.preprocess((v) => (v === "" ? undefined : v), z.enum(["ENTRADA", "SALIDA", "MERMA", "AJUSTE"]).optional()),
    startDate: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
    endDate: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
    search: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
    page: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().transform(v => v ? Number(v) : 1)),
    limit: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().transform(v => v ? Number(v) : 50)),
});
//# sourceMappingURL=movimientos.schema.js.map