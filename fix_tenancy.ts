import { prisma } from "./src/config/db.config.js";

async function fixData() {
  console.log("🚀 Iniciando vinculación de datos a negocio por defecto...");

  // 1. Crear el negocio por defecto
  const negocio = await prisma.negocio.upsert({
    where: { ruc: "000000000" },
    update: {},
    create: {
      nombre: "Mi Primer Negocio",
      ruc: "000000000",
      direccion: "Calle Principal #123",
      telefono: "555-0123"
    }
  });

  console.log(`✅ Negocio creado/encontrado: ${negocio.nombre} (${negocio.id})`);

  // 2. Vincular Users
  const users = await prisma.user.updateMany({
    where: { negocioId: null },
    data: { negocioId: negocio.id }
  });
  console.log(`👤 Usuarios actualizados: ${users.count}`);

  // 3. Vincular Productos
  const productos = await prisma.producto.updateMany({
    where: { negocioId: null },
    data: { negocioId: negocio.id }
  });
  console.log(`📦 Productos actualizados: ${productos.count}`);

  // 4. Vincular Clientes
  const clientes = await prisma.cliente.updateMany({
    where: { negocioId: null },
    data: { negocioId: negocio.id }
  });
  console.log(`👥 Clientes actualizados: ${clientes.count}`);

  // 5. Vincular Ventas
  const ventas = await prisma.venta.updateMany({
    where: { negocioId: null },
    data: { negocioId: negocio.id }
  });
  console.log(`💰 Ventas actualizadas: ${ventas.count}`);

  // 6. Vincular Movimientos
  const movimientos = await prisma.movimientoInventario.updateMany({
    where: { negocioId: null },
    data: { negocioId: negocio.id }
  });
  console.log(`🔄 Movimientos actualizados: ${movimientos.count}`);

  console.log("✨ Proceso completado exitosamente.");
}

fixData()
  .catch(e => console.error("❌ Error en fixData:", e))
  .finally(() => prisma.$disconnect());
