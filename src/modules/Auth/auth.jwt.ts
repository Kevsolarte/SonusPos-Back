import jwt from "jsonwebtoken";
import { env } from "../../config/env.config.js";

const ACCESS_SECRET = env.JWT_ACCESS_SECRET;
const ACCESS_TTL = "12h"; 

export type Role = "SUPERADMIN" | "ADMIN";
export type AccessPayload = { sub: string; role: Role; negocioId: string };

export function signAccessToken(userId: string, role: string, negocioId: string) {
  const payload: AccessPayload = { sub: userId, role: role as Role, negocioId };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}
