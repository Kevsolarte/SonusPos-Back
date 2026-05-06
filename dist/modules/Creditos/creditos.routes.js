import { Router } from "express";
import { cobrosController, deudasController } from "./creditos.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
// ─── /cobros ──────────────────────────────────────────────────────────────────
export const cobrosRoutes = Router();
cobrosRoutes.use(requireAuth);
cobrosRoutes.get("/", cobrosController.getAll);
cobrosRoutes.post("/", cobrosController.create);
cobrosRoutes.get("/:id", cobrosController.getById);
cobrosRoutes.patch("/:id", cobrosController.update);
cobrosRoutes.delete("/:id", cobrosController.delete);
cobrosRoutes.post("/:id/abono", cobrosController.registrarAbono); // pago recibido
// ─── /deudas ──────────────────────────────────────────────────────────────────
export const deudasRoutes = Router();
deudasRoutes.use(requireAuth);
deudasRoutes.get("/", deudasController.getAll);
deudasRoutes.post("/", deudasController.create);
deudasRoutes.get("/:id", deudasController.getById);
deudasRoutes.patch("/:id", deudasController.update);
deudasRoutes.delete("/:id", deudasController.delete);
deudasRoutes.post("/:id/abono", deudasController.registrarAbono); // pago realizado
//# sourceMappingURL=creditos.routes.js.map