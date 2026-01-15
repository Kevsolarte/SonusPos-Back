-- CreateEnum
CREATE TYPE "TipoVenta" AS ENUM ('PESO', 'UNIDAD');

-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('KG', 'G', 'L', 'ML');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'MERMA', 'AJUSTE');

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoBarra" TEXT,
    "descripcion" TEXT,
    "tipoVenta" "TipoVenta" NOT NULL,
    "unidadMedida" "UnidadMedida" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "stockActual" DECIMAL(10,3) NOT NULL,
    "stockMin" DECIMAL(10,3),
    "stockMax" DECIMAL(10,3),
    "alertastockbaja" BOOLEAN,
    "ubicacion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Precio" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "preciocompra" DECIMAL(10,3) NOT NULL,
    "precioDetal" DECIMAL(10,2) NOT NULL,
    "precioMayor" DECIMAL(10,2),
    "minimoMayor" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Precio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_productoId_key" ON "Inventario"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "Precio_productoId_key" ON "Precio"("productoId");

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Precio" ADD CONSTRAINT "Precio_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
