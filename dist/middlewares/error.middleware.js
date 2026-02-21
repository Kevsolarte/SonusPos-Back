export class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 400, code = "BUSINESS_RULE") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
//# sourceMappingURL=error.middleware.js.map