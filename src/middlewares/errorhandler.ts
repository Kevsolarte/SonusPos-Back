import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "./error.middleware.js";
import { prisma } from "../config/db.config.js";

export const errorHandler: ErrorRequestHandler = async (err, req, res, next) => {
  // 1. LOG DE ERROR EN DB (PROACTIVO)
  try {
    const auth = (req as any).auth;
    await prisma.errorLog.create({
      data: {
        mensaje: err.message || "Error desconocido",
        stack: process.env.NODE_ENV !== "production" ? err.stack : null,
        ruta: req.originalUrl,
        metodo: req.method,
        userId: auth?.sub,
        negocioId: auth?.negocioId
      }
    });
  } catch (logError) {
    console.error("⚠️ Error al guardar log en DB:", logError);
  }

  // 2. RESPUESTAS SEGÚN TIPO DE ERROR
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
  if ((err as any)?.code === "P2002") {
    return res.status(409).json({
      error: "UNIQUE_CONSTRAINT",
      message: "Ya existe un registro con ese valor único.",
      meta: (err as any)?.meta,
    });
  }

  // Prisma DecimalError (opcional)
  if ((err as any)?.name === "DecimalError") {
    return res.status(400).json({ error: "INVALID_DECIMAL", message: (err as any).message });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  } else {
    console.error(err?.message ?? err);
  }

  return res.status(500).json({ error: "INTERNAL_ERROR", message: "Error interno" });
};