import { Router } from "express";
import { cierresController } from "./cierres.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
const router = Router();
router.get("/status", requireAuth, cierresController.getStatus);
router.post("/ejecutar", requireAuth, cierresController.cerrarCaja);
router.get("/historial", requireAuth, cierresController.getHistorial);
export default router;
//# sourceMappingURL=cierres.routes.js.map