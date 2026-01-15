import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js"; // import del cliente de prisma
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
import argon2 from "argon2";


async function main() {
  const email = (process.env.SUPERADMIN_EMAIL ?? "ksolarte14@gmail.com")
    .toLowerCase()
    .trim();

  const password = process.env.SUPERADMIN_PASSWORD ?? "Kevinsolarte1.";

  const passwordHash = await argon2.hash(password);

  // Upsert: si existe lo deja, si no existe lo crea
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      // si quieres actualizar la clave en cada seed, descomenta:
      // passwordHash,
    },
    create: {
      name: "KEVIN SOLARTE",
      email,
      passwordHash,
      role: "SUPERADMIN",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  console.log("✅ SUPERADMIN listo:", user);
  console.log("📧 Email:", email);
  console.log("🔑 Password:", password);
  console.log("⚠️ Cámbiala luego del primer login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
