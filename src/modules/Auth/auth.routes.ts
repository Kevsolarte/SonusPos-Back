import { Router } from "express";
import { authController } from "./Auth.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
export const authRoutes = Router();

authRoutes.post("/CreadorUsuario", requireAuth, requireRole("SUPERADMIN"), authController.createAdmin);
authRoutes.post("/login", authController.login);