import { prisma } from '../src/config/db.config.js';
import argon2 from 'argon2';

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Limpieza total definitiva (Orden de hijos a padres)
  console.log('🧹 Limpiando base de datos...');
  
  // Nivel 4 (Hijos de hijos)
  await prisma.transaccionFinanciera.deleteMany({});
  await prisma.ventaPago.deleteMany({});
  await prisma.promocionProducto.deleteMany({});
  await prisma.comboComponente.deleteMany({});
  
  // Nivel 3 (Dependen de Productos/Ventas)
  await prisma.ventaDetalle.deleteMany({});
  await prisma.movimientoInventario.deleteMany({});
  await prisma.productoVariante.deleteMany({});
  await prisma.inventario.deleteMany({});
  await prisma.precio.deleteMany({});
  
  // Nivel 2 (Dependen del Negocio)
  await prisma.venta.deleteMany({});
  await prisma.promocion.deleteMany({});
  await prisma.tasaCambio.deleteMany({});
  await prisma.cierre.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.categoria.deleteMany({});
  await prisma.cuenta.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.proveedor.deleteMany({});

  // Nivel 1 (Entidad Raíz)
  await prisma.negocio.deleteMany({});

  // 2. Crear Negocio
  const negocio = await prisma.negocio.create({
    data: {
      nombre: 'SoftPos Charcutería CA',
      ruc: 'J-12345678-9',
      direccion: 'Av Principal, Caracas',
      telefono: '0414-1234567'
    }
  });

  console.log(`✅ Negocio creado: ${negocio.nombre}`);

  // 3. Crear Tasas de Cambio Iniciales
  await prisma.tasaCambio.createMany({
    data: [
      { nombre: 'Dólar Paralelo', moneda: 'VES', tasa: 38.50, isPrincipal: true, negocioId: negocio.id },
      { nombre: 'BCV', moneda: 'VES', tasa: 36.40, isPrincipal: false, negocioId: negocio.id },
    ]
  });

  // 4. Crear Cuentas Financieras
  await prisma.cuenta.createMany({
    data: [
      { nombre: 'Caja Efectivo USD', tipo: 'EFECTIVO', moneda: 'USD', saldoActual: 100, negocioId: negocio.id },
      { nombre: 'Caja Efectivo VES', tipo: 'EFECTIVO', moneda: 'VES', saldoActual: 5000, negocioId: negocio.id },
      { nombre: 'Banesco (Pago Móvil)', tipo: 'BANCO', moneda: 'VES', saldoActual: 0, negocioId: negocio.id },
    ]
  });

  // 5. Crear Categoría
  const cat = await prisma.categoria.create({
    data: { nombre: 'CHARCUTERÍA', negocioId: negocio.id }
  });

  // 6. Crear Usuarios
  const hashedPassword = await argon2.hash('123456');
  
  await prisma.user.createMany({
    data: [
      { name: 'Administrador', email: 'admin@admin.com', passwordHash: hashedPassword, role: 'SUPERADMIN', negocioId: negocio.id },
      { name: 'Cajero 1', email: 'caja1@test.com', passwordHash: hashedPassword, role: 'ADMIN', negocioId: negocio.id },
    ]
  });

  console.log('✅ Base de datos sembrada con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
