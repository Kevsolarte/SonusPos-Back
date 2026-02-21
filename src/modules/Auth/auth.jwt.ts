import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const ACCESS_TTL = process.env.JWT_ACCESS_TTL ?? "12h";

export type Role = "SUPERADMIN" | "ADMIN";
export type AccessPayload = { sub: string; role: Role; negocioId: string };

export function signAccessToken(userId: string, role: Role, negocioId: string) {
  const payload: AccessPayload = { sub: userId, role, negocioId };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL } as any);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}
