import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";

/**
 * Auth Controller
 * Responsabilidad: Recibir la request HTTP, delegar al service y devolver la respuesta.
 * No contiene lógica de negocio. Todo error se propaga al errorHandler global.
 */
export const authController = {
  /**
   * POST /auth/admin
   * Crea un nuevo usuario administrador (solo SUPERADMIN).
   */
  createAdmin: asyncHandler(async (req: Request, res: Response) => {
    const { user, credentials } = await authService.createAdmin(req.body);
    res.status(201).json({ user, credentials });
  }),

  /**
   * POST /auth/login
   * Autentica un usuario y devuelve un JWT de acceso.
   */
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  }),

  /**
   * POST /auth/register
   * Registro público para dueños de negocio (ADMIN).
   * Crea el negocio y el usuario en un solo paso.
   */
  registerAdmin: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.registerAdmin(req.body);
    res.status(201).json(result);
  }),

  /**
   * GET /auth/me
   * Retorna el perfil del usuario autenticado.
   */
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const { sub } = (req as any).auth;
    const user = await authService.getMe(sub);
    res.status(200).json(user);
  }),

  /**
   * POST /auth/forgot-password
   */
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({ message: "Si el email existe, se ha enviado un enlace de recuperación." });
  }),

  /**
   * POST /auth/reset-password
   */
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json({ message: "Contraseña actualizada exitosamente." });
  }),
};