import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type Role } from "../modules/Auth/auth.jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ message: "No token" });

  const token = h.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
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
