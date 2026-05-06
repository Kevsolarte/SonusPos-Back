import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas de dashboard requieren autenticación
router.use(requireAuth);

router.get("/stats", dashboardController.getStats);

export default router;
