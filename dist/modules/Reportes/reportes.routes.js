import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { reportesController } from "./reportes.controller.js";
const router = Router();
router.get("/general", requireAuth, reportesController.getGeneralReport);
export default router;
//# sourceMappingURL=reportes.routes.js.map