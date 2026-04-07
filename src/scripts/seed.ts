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

    // 4. Crear Productos Variados
    const productosData = [
        { nombre: "Harina de Maíz 1kg", precioC: 0.8, precioD: 1.2, stock: 50, codigo: "7591234" },
        { nombre: "Leche Completa 1L", precioC: 1.2, precioD: 1.8, stock: 30, codigo: "7595678" },
        { nombre: "Café Molido 250g", precioC: 2.0, precioD: 3.5, stock: 20, codigo: "7599012" },
        { nombre: "Arroz Blanco 1kg", precioC: 0.7, precioD: 1.1, stock: 100, codigo: "7593456" },
        { nombre: "Aceite Vegetal 1L", precioC: 2.5, precioD: 3.8, stock: 15, codigo: "7597890" },
    ];

    for (const p of productosData) {
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

    // 5. Crear Clientes
    const cliente = await prisma.cliente.create({
        data: {
            nombre: "Juan Pérez (Cliente VIP)",
            documento: "V-12345678",
            telefono: "0424-1112233",
            negocioId: negocio.id
        }
    });

    console.log("📦 Products and Customers created.");

    // 6. Crear algunas Ventas Históricas para que los reportes tengan datos
    for (let i = 0; i < 3; i++) {
        const total = 5.5 + i;
        await prisma.venta.create({
            data: {
                numero: `V-DEMO-${Date.now()}-${i}`,
                negocioId: negocio.id,
                clienteId: cliente.id,
                subtotal: total,
                total: total,
                estado: "PAGADA",
                pagos: {
                    create: {
                        metodo: "EFECTIVO_USD",
                        monto: total,
                    }
                },
                detalles: {
                    create: {
                        productoId: (await prisma.producto.findFirst({ where: { negocioId: negocio.id } }))?.id || "",
                        cantidad: 1,
                        precioUnitario: total,
                        subtotal: total,
                        tipoVenta: "UNIDAD",
                        unidadMedida: "UNIDAD"
                    }
                }
            }
        });
    }

    console.log("💰 Sales generated.");
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
