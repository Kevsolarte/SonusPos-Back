import { Router } from "express";
import { cuentasController } from "./cuentas.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
const router = Router();
router.use(requireAuth);
router.get("/", cuentasController.getAll);
router.post("/", cuentasController.create);
router.patch("/:id", cuentasController.update);
router.delete("/:id", cuentasController.delete);
// Historial de movimientos de una cuenta (ingresos + egresos)
router.get("/:id/movimientos", cuentasController.getMovimientos);
// Registrar movimiento manual (con conversión de moneda)
router.post("/:id/movimiento", cuentasController.registrarMovimiento);
export default router;
//# sourceMappingURL=cuentas.routes.js.map