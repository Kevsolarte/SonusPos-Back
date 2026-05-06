import { Router } from "express";
import { ProveedorController } from "./proveedor.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
const router = Router();
router.use(requireAuth);
router.get("/", ProveedorController.getAll);
router.get("/:id", ProveedorController.getById);
router.post("/", ProveedorController.create);
router.patch("/:id", ProveedorController.update);
router.delete("/:id", ProveedorController.delete);
export default router;
//# sourceMappingURL=proveedor.routes.js.map