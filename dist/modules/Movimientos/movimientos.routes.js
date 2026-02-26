import { Router } from "express";
import { movimientosController } from "./movimientos.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
const router = Router();
router.get("/", requireAuth, movimientosController.getHistory);
router.post("/manual", requireAuth, movimientosController.createManual);
export default router;
//# sourceMappingURL=movimientos.routes.js.map