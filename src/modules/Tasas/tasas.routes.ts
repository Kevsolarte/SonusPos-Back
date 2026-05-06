import { Router } from "express";
import { tasaController } from "./tasas.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", tasaController.getAll);
router.post("/", tasaController.create);
router.patch("/:id", tasaController.update);
router.delete("/:id", tasaController.delete);

export default router;
