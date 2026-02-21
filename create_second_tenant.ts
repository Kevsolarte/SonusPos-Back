import { prisma } from "./src/config/db.config.js";
import argon2 from "argon2";
import "dotenv/config";

async function createSecondTenant() {
    try {
        console.log("🚀 Creando segundo Negocio y Administrador para pruebas...");

        // 1. Crear el nuevo Negocio
        const negocio = await prisma.negocio.upsert({
            where: { ruc: "999999999" },
            update: {},
            create: {
                nombre: "Tienda de Mascotas B",
                ruc: "999999999",
                direccion: "Avenida Secundaria 456",
                telefono: "555-9999"
            }
        });

        console.log(`✅ Negocio creado: ${negocio.nombre} (ID: ${negocio.id})`);

        // 2. Crear el nuevo Administrador vinculado a ese negocio
        const email = "admin_b@test.com";
        const password = "PasswordTenantB123!";
        const passwordHash = await argon2.hash(password);

        const user = await prisma.user.upsert({
            where: { email },
            update: { negocioId: negocio.id },
            create: {
                name: "Admin Mascotas",
                email,
                passwordHash,
                role: "ADMIN",
                negocioId: negocio.id
            }
        });

        console.log(`✅ Usuario creado: ${user.name}`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log("\n--- INSTRUCCIONES DE PRUEBA ---");
        console.log("1. Cierra sesión en el Frontend.");
        console.log(`2. Inicia sesión con: ${email}`);
        console.log("3. Ve a Inventario: Debería estar VACÍO (aislado de 'Mi Primer Negocio').");
        console.log("4. Crea un producto: Solo será visible para este usuario.");

    } catch (e) {
        console.error("❌ Error al crear el segundo tenant:", e);
    } finally {
        await prisma.$disconnect();
    }
}

createSecondTenant();
