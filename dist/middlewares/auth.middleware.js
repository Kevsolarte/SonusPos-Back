import { verifyAccessToken } from "../modules/Auth/auth.jwt.js";
export function requireAuth(req, res, next) {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer "))
        return res.status(401).json({ message: "No token" });
    const token = h.slice("Bearer ".length);
    try {
        const payload = verifyAccessToken(token);
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