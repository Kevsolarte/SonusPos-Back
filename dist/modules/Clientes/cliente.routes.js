import { Router } from "express";
import { clienteController } from "./cliente.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
const router = Router();
router.use(requireAuth);
router.get("/", clienteController.getAll);
router.get("/:id", clienteController.getById);
router.post("/", clienteController.create);
router.put("/:id", clienteController.update);
router.delete("/:id", clienteController.delete);
export default router;
//# sourceMappingURL=cliente.routes.js.map