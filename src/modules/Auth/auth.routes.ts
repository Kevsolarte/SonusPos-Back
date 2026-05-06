import { Router } from "express";
import { authController } from "./auth.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";

export const authRoutes = Router();

// Rutas públicas
authRoutes.post("/login", authController.login);
authRoutes.post("/register", authController.registerAdmin);
authRoutes.post("/forgot-password", authController.forgotPassword);
authRoutes.post("/reset-password", authController.resetPassword);

// Rutas protegidas
authRoutes.get("/me", requireAuth, authController.getMe);

// Ruta protegida solo para SUPERADMIN
authRoutes.post("/CreadorUsuario", requireAuth, requireRole("SUPERADMIN"), authController.createAdmin);