import jwt from "jsonwebtoken";
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_TTL = process.env.JWT_ACCESS_TTL ?? "12h";
export function signAccessToken(userId, role, negocioId) {
    const payload = { sub: userId, role, negocioId };
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
}
//# sourceMappingURL=auth.jwt.js.map