import { inventarioService } from "./src/modules/Inventario/inventario.service.js";
import { prisma } from "./src/config/db.config.js";
import "dotenv/config";

async function verify() {
    try {
        const negocio = await prisma.negocio.findFirst({ where: { ruc: "000000000" } });
        if (!negocio) throw new Error("Negocio no encontrado");

        console.log(`Using Negocio ID: ${negocio.id}`);

        const randomSuffix = Math.floor(Math.random() * 1000);
        const result = await inventarioService.createProducto(negocio.id, {
            nombre: `Producto Test MT ${randomSuffix}`,
            codigoBarra: `BAR-${randomSuffix}`,
            tipoVenta: "UNIDAD",
            unidadMedida: "UNIDAD",
            precio: {
                preciocompra: 100,
                precioDetal: 150
            },
            inventario: {
                stockActual: 10,
                stockMin: 1,
                stockMax: 20
            }
        });

        console.log("Product created in service:", (result as any).id);

        // Verificar en DB que tenga el negocioId
        const dbProd = await prisma.producto.findUnique({
            where: { id: (result as any).id },
            include: { inventario: true }
        });

        if (dbProd?.negocioId === negocio.id) {
            console.log("✅ VERIFICATION SUCCESS: Product is correctly linked to negocioId.");
        } else {
            console.error("❌ VERIFICATION FAILED: negocioId mismatch or not found.", dbProd?.negocioId);
        }

    } catch (e) {
        console.error("Verification error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
