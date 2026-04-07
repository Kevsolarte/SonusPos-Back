import { env } from "./env.config.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
