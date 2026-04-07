import 'dotenv/config'; 
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
const { Pool } = pg;
import argon2 from "argon2";

// Usamos la misma configuración que en la App para evitar errores de inicialización
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("localhost") ? false : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting seeding...");
    
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

    const passwordHash = await argon2.hash("demo1234");
    const user = await prisma.user.upsert({
        where: { email: "demo@sonuspos.com" },
        update: { passwordHash },
        create: {
            name: "Administrador Demo",
            email: "demo@sonuspos.com",
            passwordHash,
            role: "ADMIN",
            negocioId: negocio.id
        }
    });

    console.log(`✅ User created: ${user.email} / password: demo1234`);

    const productosData = [
        { nombre: "Harina de Maíz 1kg", precioC: 0.8, precioD: 1.2, stock: 50, codigo: "7591234" },
        { nombre: "Leche Completa 1L", precioC: 1.2, precioD: 1.8, stock: 30, codigo: "7595678" },
        { nombre: "Café Molido 250g", precioC: 2.0, precioD: 3.5, stock: 20, codigo: "7599012" },
        { nombre: "Arroz Blanco 1kg", precioC: 0.7, precioD: 1.1, stock: 100, codigo: "7593456" },
        { nombre: "Aceite Vegetal 1L", precioC: 2.5, precioD: 3.8, stock: 15, codigo: "7597890" },
    ];

    for (const p of productosData) {
        const exists = await prisma.producto.findFirst({
            where: { nombre: p.nombre, negocioId: negocio.id }
        });

        if (!exists) {
            await prisma.producto.create({
                data: {
                    nombre: p.nombre,
                    codigoBarra: p.codigo,
                    tipoVenta: "UNIDAD",
                    unidadMedida: "UNIDAD",
                    negocioId: negocio.id,
                    precio: {
                        create: {
                            preciocompra: p.precioC,
                            precioDetal: p.precioD,
                        }
                    },
                    inventario: {
                        create: {
                            stockActual: p.stock,
                            stockMin: 5,
                            stockMax: 200,
                        }
                    }
                }
            });
        }
    }

    await prisma.cliente.upsert({
        where: { documento_negocioId: { documento: "V-12345678", negocioId: negocio.id } },
        update: {},
        create: {
            nombre: "Juan Pérez (Cliente Demo)",
            documento: "V-12345678",
            telefono: "0424-1112233",
            negocioId: negocio.id
        }
    });

    console.log("📦 Products and Customers ready.");
    console.log("✨ Seeding finished successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
