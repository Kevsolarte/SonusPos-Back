import { Router } from "express";
import { promocionesController } from "./promociones.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
const router = Router();
router.use(requireAuth);
router.post("/", promocionesController.create);
router.get("/", promocionesController.getAll);
router.get("/:id", promocionesController.getById);
router.put("/:id", promocionesController.update);
router.delete("/:id", promocionesController.delete);
export default router;
//# sourceMappingURL=promociones.routes.js.map