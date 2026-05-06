import { Router } from "express";
import { getNegocio, updateNegocio, getMiSuscripcion, registrarPago } from "./negocio.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
const router = Router();
router.use(requireAuth);
router.get("/", getNegocio);
router.patch("/", updateNegocio);
router.get("/suscripcion", getMiSuscripcion);
router.post("/registrar-pago", registrarPago);
export default router;
//# sourceMappingURL=negocio.routes.js.map