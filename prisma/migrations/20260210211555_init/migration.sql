/*
  Warnings:

  - A unique constraint covering the columns `[documento,negocioId]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre,negocioId]` on the table `Producto` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigoBarra,negocioId]` on the table `Producto` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numero,negocioId]` on the table `Venta` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Producto_codigoBarra_key";

-- DropIndex
DROP INDEX "Producto_nombre_key";

-- DropIndex
DROP INDEX "Venta_numero_key";

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "negocioId" TEXT;

-- AlterTable
ALTER TABLE "MovimientoInventario" ADD COLUMN     "negocioId" TEXT;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "negocioId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "negocioId" TEXT;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "negocioId" TEXT;

-- CreateTable
CREATE TABLE "Negocio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruc" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Negocio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Negocio_ruc_key" ON "Negocio"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_documento_negocioId_key" ON "Cliente"("documento", "negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_nombre_negocioId_key" ON "Producto"("nombre", "negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigoBarra_negocioId_key" ON "Producto"("codigoBarra", "negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_numero_negocioId_key" ON "Venta"("numero", "negocioId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
