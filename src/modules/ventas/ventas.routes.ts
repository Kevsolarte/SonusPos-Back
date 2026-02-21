import { Router } from "express";
import { ventasController } from "./ventas.controller.js";
import { validateBody } from "../../middlewares/validate.zod.js";
import { createVentaFullSchema } from "./ventas.schema.js"
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { } from "../../middlewares/error.middleware.js"

export const ventasRoutes = Router();



ventasRoutes.post("/venta", requireAuth, validateBody(createVentaFullSchema), ventasController.createVenta);
ventasRoutes.post("/calcular-totales", requireAuth, ventasController.calcularTotales);