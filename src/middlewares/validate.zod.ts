import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export const validateBody =
  (schema: ZodSchema): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "VALIDACION DE ZOD",
        issues: result.error.issues,
      });
    }
    req.body = result.data; // body tipado/limpio
    next();
  };
