import { verifyAccessToken } from "../modules/Auth/auth.jwt.js";
import { prisma } from "../config/db.config.js";
const businessCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minuto en milisegundos
/**
 * Invalida la caché de un negocio específico.
 * Útil cuando el SuperAdmin cambia el estado manualmente.
 */
export function invalidateBusinessCache(negocioId) {
    businessCache.delete(negocioId);
}
export async function requireAuth(req, res, next) {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer "))
        return res.status(401).json({ message: "No token" });
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
            const SUBSCRIPTION_PATHS = [
                '/negocio/suscripcion',
                '/negocio/registrar-pago',
                '/negocio/metodos-pago',
                '/negocio',
                '/auth/me',
            ];
            const isSubscriptionRoute = SUBSCRIPTION_PATHS.some(p => req.originalUrl === p ||
                req.originalUrl.startsWith(p + '?') ||
                req.originalUrl.startsWith(p + '/'));
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
        req.auth = payload; // { sub, role, negocioId }
        next();
    }
    catch {
        return res.status(401).json({ message: "Token inválido/expirado" });
    }
}
export function requireRole(...allowed) {
    return (req, res, next) => {
        const role = req.auth?.role;
        if (!role || !allowed.includes(role)) {
            return res.status(403).json({ message: "No autorizado" });
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map