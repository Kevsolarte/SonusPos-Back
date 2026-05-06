import { Router } from "express";
import { usuariosController } from "./usuarios.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";

export const usuariosRoutes = Router();

usuariosRoutes.use(requireAuth);
usuariosRoutes.use(requireRole("ADMIN", "SUPERADMIN"));

usuariosRoutes.get("/", usuariosController.getAll);
usuariosRoutes.post("/", usuariosController.create);
usuariosRoutes.patch("/:id", usuariosController.update);
usuariosRoutes.delete("/:id", usuariosController.delete);
