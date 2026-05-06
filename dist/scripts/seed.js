import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
const prisma = new PrismaClient();
async function main() {
    console.log("🌱 Starting seeding...");
    // 1. Limpieza (Opcional: solo si quieres vaciar datos previos de la demo)
    // Cuidado: En producción esto no se hace.
    // await prisma.ventaPago.deleteMany();
    // await prisma.ventaDetalle.deleteMany();
    // await prisma.venta.deleteMany();
    // await prisma.inventario.deleteMany();
    // await prisma.precio.deleteMany();
    // ... etc
    // 2. Crear Negocio Demo
    const negocio = await prisma.negocio.upsert({
        where: { ruc: "DEMO-123456" },
        update: {},
        create: {
            nombre: "SonusPos Store - Demo",
            ruc: "DEMO-123456",
            direccion: "Av. Principal, Edificio Tech, Piso 5",
            telefono: "+58 412-0000000",
        }
    });
    // 3. Crear Usuario Administrador
    const passwordHash = await argon2.hash("demo1234");
    const user = await prisma.user.upsert({
        where: { email: "demo@sonuspos.com" },
        update: { passwordHash }, // Reset password if exists
        create: {
            name: "Administrador Demo",
            email: "demo@sonuspos.com",
            passwordHash,
            role: "ADMIN",
            negocioId: negocio.id
        }
    });
    console.log(`✅ User created: ${user.email} / password: demo1234`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map