import type { AccessPayload } from "../modules/Auth/auth.jwt.js";

/**
 * Augmenta el tipo `Request` de Express para incluir la propiedad `auth`.
 * Esta propiedad es inyectada por el middleware `requireAuth` después de
 * verificar el JWT. Al declararlo aquí, todos los controllers tienen
 * autocompletado y validación de tipos en `req.auth` sin necesitar `(req as any)`.
 *
 * Campos disponibles:
 * - `req.auth.sub`       → ID del usuario autenticado
 * - `req.auth.role`      → Rol: "ADMIN" | "SUPERADMIN"
 * - `req.auth.negocioId` → ID del negocio al que pertenece el usuario
 */
declare global {
  namespace Express {
    interface Request {
      auth: AccessPayload;
    }
  }
}
