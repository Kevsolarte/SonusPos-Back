import { ZodError } from "zod";
import { AppError } from "./error.middleware.js";
export const errorHandler = (err, req, res, next) => {
    // Zod
    if (err instanceof ZodError) {
        return res.status(400).json({ error: "VALIDATION_ERROR", issues: err.issues });
    }
    // CORS bloqueado
    if (err?.message?.startsWith("CORS blocked for origin:")) {
        return res.status(403).json({ error: "CORS_BLOCKED", message: err.message });
    }
    // Negocio
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.code, message: err.message });
    }
    // Prisma: unique constraint
    if (err?.code === "P2002") {
        return res.status(409).json({
            error: "UNIQUE_CONSTRAINT",
            message: "Ya existe un registro con ese valor único.",
            meta: err?.meta,
        });
    }
    // Prisma DecimalError (opcional)
    if (err?.name === "DecimalError") {
        return res.status(400).json({ error: "INVALID_DECIMAL", message: err.message });
    }
    if (process.env.NODE_ENV !== "production") {
        console.error(err);
    }
    else {
        console.error(err?.message ?? err);
    }
    return res.status(500).json({ error: "INTERNAL_ERROR", message: "Error interno" });
};
//# sourceMappingURL=errorhandler.js.map