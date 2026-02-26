import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedMassiveProducts() {
    const user = await prisma.user.findUnique({
        where: { email: "ksolarte14@gmail.com" },
    });

    if (!user) {
        console.error("No se encontro el usuario paula@test.com.");
        return;
    }

    const negocioId = user.negocioId;
    if (!negocioId) {
        console.error("El usuario no tiene un negocioId asociado.");
        return;
    }

    console.log(`Cargando productos para el negocio de Paula (ID: ${negocioId})...`);

    const categoryNames = ["Refresco", "Galleta", "Harina", "Arroz", "Pasta", "Aceite", "Jabon", "Shampoo", "Snack"];
    // Valores validos según UnidadMedida enum: KG, G, L, ML, UNIDAD, PZA
    const units: any[] = ["UNIDAD", "KG", "PZA"];

    for (let i = 1; i <= 60; i++) {
        const name = `${categoryNames[i % categoryNames.length]} Prueba ${i}`;
        const barcode = `PROD-TEST-${1000 + i}`;

        try {
            await prisma.producto.create({
                data: {
                    negocioId,
                    nombre: name,
                    codigoBarra: barcode,
                    descripcion: `Descripcion del producto ${i}`,
                    tipoVenta: "UNIDAD",
                    unidadMedida: units[i % units.length],
                    precio: {
                        create: {
                            preciocompra: 1.0,
                            precioDetal: i + 0.5, // Precio variable para ver diferencia visual
                            precioMayor: i + 0.2,
                        }
                    },
                    inventario: {
                        create: {
                            stockActual: 10 + i,
                            stockMin: 5,
                            stockMax: 200,
                            ubicacion: "Pasillo Central",
                        }
                    }
                }
            });
            if (i % 20 === 0) console.log(`Progreso: ${i} productos creados...`);
        } catch (error) {
            // Ignorar errores (ej: producto ya creado)
        }
    }

    console.log("¡Listo! Se han intentado crear 60 productos.");
}

seedMassiveProducts()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
