import jwt from "jsonwebtoken";
import { env } from "../../config/env.config.js";
const ACCESS_SECRET = env.JWT_ACCESS_SECRET;
const ACCESS_TTL = "12h";
export function signAccessToken(userId, role, negocioId, permissions) {
    const payload = { sub: userId, role: role, negocioId, permissions };
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
}
export function signRecoveryToken(userId) {
    return jwt.sign({ sub: userId, type: "recovery" }, ACCESS_SECRET, { expiresIn: "15m" });
}
export function verifyRecoveryToken(token) {
    const payload = jwt.verify(token, ACCESS_SECRET);
    if (payload.type !== "recovery")
        throw new Error("Token inválido");
    return payload;
}
//# sourceMappingURL=auth.jwt.js.map