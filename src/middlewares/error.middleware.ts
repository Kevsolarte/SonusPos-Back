export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "BUSINESS_RULE") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
