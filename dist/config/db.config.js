import { env } from "./env.config.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
const { Pool } = pg;
const connectionString = env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    // Configuración de SSL robusta para Supabase/Render
    ssl: connectionString.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
//# sourceMappingURL=db.config.js.map