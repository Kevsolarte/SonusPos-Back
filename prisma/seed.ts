import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import argon2 from "argon2";

// Pool con TLS desactivado (porque Supabase + self-signed)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createUserWithBusiness(
  name: string,
  email: string,
  password: string,
  businessName: string
) {
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Usuario ${email} ya existe`);
    return;
  }

  // Crear negocio
  const negocio = await prisma.negocio.create({
    data: {
      nombre: businessName,
    },
  });

  const hashed = await argon2.hash(password);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashed,
      role: "ADMIN",
      negocioId: negocio.id,
    },
  });

  console.log(`Usuario ${email} y negocio ${businessName} creados`);
}

async function main() {
  await createUserWithBusiness(
    "paula",
    "paula@test.com",
    "Paula123*",
    "PaqueYoya"
  );

  await createUserWithBusiness(
    "chicho",
    "chicho@test.com",
    "Chicho123*",
    "ANDRIMAR BOUTIQUE"
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });