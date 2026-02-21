export const validateBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: "VALIDACION DE ZOD",
            issues: result.error.issues,
        });
    }
    req.body = result.data; // body tipado/limpio
    next();
};
//# sourceMappingURL=validate.zod.js.map