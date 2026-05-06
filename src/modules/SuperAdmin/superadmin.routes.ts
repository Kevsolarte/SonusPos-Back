import { Router } from "express";
import { 
  getGlobalStats, getNegocios, getPendingPayments, 
  approvePayment, rejectPayment, getMethods, createMethod, updateMethod, deleteMethod, updateNegocio, getNegocioPayments, getNegocioErrors
} from "./superadmin.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";

const router = Router();

// Seguridad nivel Máximo
router.use(requireAuth);
router.use(requireRole("SUPERADMIN"));

router.get("/stats", getGlobalStats);
router.get("/negocios", getNegocios);
router.get("/negocios/:id/pagos", getNegocioPayments);
router.get("/negocios/:id/errores", getNegocioErrors);
router.patch("/negocios/:id", updateNegocio);
router.get("/pagos/pendientes", getPendingPayments);
router.patch("/pagos/:pagoId/aprobar", approvePayment);
router.patch("/pagos/:pagoId/rechazar", rejectPayment);
router.get("/metodos-pago", getMethods);
router.post("/metodos-pago", createMethod);
router.patch("/metodos-pago/:id", updateMethod);
router.delete("/metodos-pago/:id", deleteMethod);

export default router;
