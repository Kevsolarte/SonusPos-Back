import { Router } from "express";
import { reportesController } from "./reportes.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
const router = Router();
router.use(requireAuth);
router.get("/historial", reportesController.getHistory);
router.get("/diario", reportesController.getStats);
router.post("/anular/:id", reportesController.voidSale);
export default router;
//# sourceMappingURL=reportes.routes.js.map