import jwt from "jsonwebtoken";
import { env } from "../../config/env.config.js";

const ACCESS_SECRET = env.JWT_ACCESS_SECRET;
const ACCESS_TTL = env.JWT_ACCESS_TTL ?? "12h";

export type Role = "SUPERADMIN" | "ADMIN" | "USUARIO";
export type AccessPayload = { sub: string; role: Role; negocioId: string; permissions?: any };

export function signAccessToken(userId: string, role: string, negocioId: string, permissions?: any) {
  const payload: AccessPayload = { sub: userId, role: role as Role, negocioId, permissions };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL as any });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

export function signRecoveryToken(userId: string) {
  return jwt.sign({ sub: userId, type: "recovery" }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function verifyRecoveryToken(token: string) {
  const payload = jwt.verify(token, ACCESS_SECRET) as { sub: string, type: string };
  if (payload.type !== "recovery") throw new Error("Token inválido");
  return payload;
}
