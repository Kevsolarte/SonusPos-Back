import { prisma } from "../src/config/db.config.js";
import argon2 from "argon2";

async function main() {
  const email = "ksolarte14@gmail.com";
  const password = "Kevinsolarte1.";
  
  console.log("🚀 Iniciando creación de SuperAdmin con Argon2...");

  // 1. Hashear contraseña con Argon2
  const hashedPassword = await argon2.hash(password);

  // 2. Crear un Negocio administrativo si no existe
  const negocioAdmin = await prisma.negocio.upsert({
    where: { ruc: "0000000000" },
    update: {},
    create: {
      nombre: "SaaS Administration",
      ruc: "0000000000",
      plan: "PREMIUM",
      config: {
        create: {
          monedaSimbolo: "$",
          impuestoNombre: "IVA",
          impuestoValor: 0
        }
      }
    }
  });

  // 3. Crear el SuperAdmin
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: "SUPERADMIN",
      activo: true
    },
    create: {
      email,
      name: "Kevin Solarte (Master)",
      passwordHash: hashedPassword,
      role: "SUPERADMIN",
      activo: true,
      negocioId: negocioAdmin.id,
      permissions: {} // El SuperAdmin tiene acceso total por bypass de rol
    }
  });

  console.log(`✅ SuperAdmin creado con éxito: ${user.email}`);
  console.log(`🏢 Vinculado a: ${negocioAdmin.nombre}`);
}

main()
  .catch((e) => {
    console.error("❌ Error al crear SuperAdmin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
