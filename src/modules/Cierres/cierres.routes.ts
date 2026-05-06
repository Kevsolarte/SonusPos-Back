import { Router } from "express";
import { cierresController } from "./cierres.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";

const router = Router();

// Todos los endpoints de cierres requieren autenticación
router.use(requireAuth);

router.get("/status", cierresController.getStatus);
router.post("/abrir", cierresController.abrirCaja);
router.post("/cerrar", cierresController.cerrarCaja);
router.get("/historial", cierresController.getHistorial);
router.get("/:id/ventas", cierresController.getVentasByCierre);

// Auditoría - Solo Admin o SuperAdmin
router.patch("/:id/verificar", requireRole("ADMIN", "SUPERADMIN"), cierresController.verificarCierre);

export default router;
