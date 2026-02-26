import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedTestData() {
    const negocio = await prisma.negocio.findFirst();
    if (!negocio) {
        console.log("No se encontró ningún negocio. Ejecuta primero el seed básico.");
        return;
    }

    const negocioId = negocio.id;
    console.log(`Sembrando datos para el negocio: ${negocio.nombre} (${negocioId})`);

    // 1. Clientes de prueba
    const clientes = [
        { nombre: "Juan Pérez", documento: "V-12345678", email: "juan@gmail.com", telefono: "0412-1112233" },
        { nombre: "María Garcia", documento: "V-87654321", email: "maria@hotmail.com", telefono: "0424-4445566" },
        { nombre: "Pedro Colina", documento: "V-11223344", email: "pedro@outlook.com", telefono: "0416-7778899" },
    ];

    for (const c of clientes) {
        await prisma.cliente.upsert({
            where: { documento_negocioId: { documento: c.documento, negocioId } },
            update: {},
            create: { ...c, negocioId }
        });
    }
    console.log("✅ Clientes creados");

    // 2. Productos de prueba (Charcutería/Víveres)
    const productos = [
        {
            nombre: "Queso Llanero",
            codigoBarra: "7590001",
            descripcion: "Queso blanco duro",
            tipoVenta: "PESO",
            unidadMedida: "KG",
            precioCompra: 4.5,
            precioDetal: 6.5,
            stockActual: 15.5,
            stockMin: 5
        },
        {
            nombre: "Jamón Ahumado",
            codigoBarra: "7590002",
            descripcion: "Jamón de espalda ahumado",
            tipoVenta: "PESO",
            unidadMedida: "KG",
            precioCompra: 5.2,
            precioDetal: 8.9,
            stockActual: 10.0,
            stockMin: 3
        },
        {
            nombre: "Harina Pan 1kg",
            codigoBarra: "7591001",
            descripcion: "Harina de maíz precocida",
            tipoVenta: "UNIDAD",
            unidadMedida: "UNIDAD",
            precioCompra: 0.9,
            precioDetal: 1.25,
            stockActual: 50,
            stockMin: 12
        },
        {
            nombre: "Arroz Primor 1kg",
            codigoBarra: "7591002",
            descripcion: "Arroz blanco tipo I",
            tipoVenta: "UNIDAD",
            unidadMedida: "UNIDAD",
            precioCompra: 1.1,
            precioDetal: 1.5,
            stockActual: 40,
            stockMin: 10
        },
        {
            nombre: "Mortadela Especial",
            codigoBarra: "7590003",
            descripcion: "Mortadela de pollo/carne",
            tipoVenta: "PESO",
            unidadMedida: "KG",
            precioCompra: 3.5,
            precioDetal: 5.8,
            stockActual: 8.4,
            stockMin: 2
        },
        {
            nombre: "Coca Cola 2L",
            codigoBarra: "7592001",
            descripcion: "Refresco sabor original",
            tipoVenta: "UNIDAD",
            unidadMedida: "UNIDAD",
            precioCompra: 1.8,
            precioDetal: 2.5,
            stockActual: 24,
            stockMin: 6
        }
    ];

    for (const p of productos) {
        // Usamos el repositorio o lógica similar para crear producto con precio e inventario
        await prisma.producto.create({
            data: {
                negocioId,
                nombre: p.nombre,
                codigoBarra: p.codigoBarra,
                descripcion: p.descripcion,
                tipoVenta: p.tipoVenta as any,
                unidadMedida: p.unidadMedida as any,
                precio: {
                    create: {
                        preciocompra: p.precioCompra,
                        precioDetal: p.precioDetal
                    }
                },
                inventario: {
                    create: {
                        stockActual: p.stockActual,
                        stockMin: p.stockMin,
                        stockMax: 1000
                    }
                },
                movimientos: {
                    create: {
                        negocioId,
                        tipo: 'ENTRADA',
                        cantidad: p.stockActual,
                        motivo: 'Carga inicial de prueba'
                    }
                }
            }
        });
    }

    console.log("✅ Productos e Inventario creados");
}

seedTestData()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
