import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type Role } from "../modules/Auth/auth.jwt.js";
import { prisma } from "../config/db.config.js";

// Estructura de la caché en memoria
interface BusinessStatusCache {
  activo: boolean;
  venceEl: Date | null;
  cachedAt: number;
}

const businessCache = new Map<string, BusinessStatusCache>();
const CACHE_TTL = 60 * 1000; // 1 minuto en milisegundos

/**
 * Invalida la caché de un negocio específico. 
 * Útil cuando el SuperAdmin cambia el estado manualmente.
 */
export function invalidateBusinessCache(negocioId: string) {
  businessCache.delete(negocioId);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ message: "No token" });

  const token = h.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);

    // Verificación con Caché del estado del negocio (solo si no es SuperAdmin)
    if (payload.role !== 'SUPERADMIN' && payload.negocioId) {
        const now = Date.now();
        let cached = businessCache.get(payload.negocioId);

        // Si no está en caché o expiró el TTL, consultamos DB
        if (!cached || (now - cached.cachedAt) > CACHE_TTL) {
            const negocio = await prisma.negocio.findUnique({
                where: { id: payload.negocioId },
                select: { activo: true, venceEl: true }
            });

            cached = {
                activo: negocio?.activo ?? false,
                venceEl: negocio?.venceEl ?? null,
                cachedAt: now
            };
            
            businessCache.set(payload.negocioId, cached);
        }

        const isSubscriptionRoute = 
            req.originalUrl.includes('/suscripcion') || 
            req.originalUrl.includes('/registrar-pago') || 
            req.originalUrl.includes('/metodos-pago') ||
            req.originalUrl.includes('/negocio') || 
            req.originalUrl.includes('/auth/me');

        if (!isSubscriptionRoute) {
            if (!cached.activo) {
                return res.status(403).json({ 
                    message: "Acceso denegado: El negocio está inactivo o suspendido.",
                    code: "BUSINESS_INACTIVE"
                });
            }

            if (cached.venceEl && new Date(cached.venceEl) < new Date()) {
                return res.status(403).json({ 
                    message: "Acceso denegado: La suscripción de este negocio ha vencido.",
                    code: "SUBSCRIPTION_EXPIRED"
                });
            }
        }
    }

    (req as any).auth = payload; // { sub, role, negocioId }
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido/expirado" });
  }
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).auth?.role as Role | undefined;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: "No autorizado" });
    }
    next();
  };
}
