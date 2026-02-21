import { prisma } from "../src/config/db.config.js";
import argon2 from "argon2";


async function main() {
  const email = (process.env.SUPERADMIN_EMAIL ?? "ksolarte14@gmail.com")
    .toLowerCase()
    .trim();

  const password = process.env.SUPERADMIN_PASSWORD ?? "Kevinsolarte1.";
  const passwordHash = await argon2.hash(password);

  // 1. Asegurar que existe un negocio
  const negocio = await prisma.negocio.upsert({
    where: { ruc: "000000000" },
    update: {},
    create: {
      nombre: "Mi Primer Negocio",
      ruc: "000000000",
      direccion: "Calle Principal",
      telefono: "555-0000"
    }
  });

  // 2. Upsert SuperAdmin vinculado al negocio
  const user = await prisma.user.upsert({
    where: { email },
    update: { negocioId: negocio.id },
    create: {
      name: "KEVIN SOLARTE",
      email,
      passwordHash,
      role: "SUPERADMIN",
      negocioId: negocio.id
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  console.log("✅ SUPERADMIN listo vinculado a:", negocio.nombre);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
