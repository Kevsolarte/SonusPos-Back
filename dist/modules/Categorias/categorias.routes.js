import { Router } from "express";
import { categoriasController } from "./categorias.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
const router = Router();
router.use(requireAuth);
router.get("/", categoriasController.getAll);
router.post("/", categoriasController.create);
router.put("/:id", categoriasController.update);
router.delete("/:id", categoriasController.delete);
export default router;
//# sourceMappingURL=categorias.routes.js.map