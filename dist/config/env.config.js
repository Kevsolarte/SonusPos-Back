import { z } from "zod";
import "dotenv/config";
const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
    JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET must be defined"),
    JWT_ACCESS_TTL: z.string().default("12h"),
    FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL").optional(),
    SUPERADMIN_EMAIL: z.string().email().optional(),
    SUPERADMIN_PASSWORD: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().optional(),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    process.exit(1);
}
export const env = _env.data;
//# sourceMappingURL=env.config.js.map