-- CreateEnum
CREATE TYPE "TipoPromocion" AS ENUM ('PORCENTAJE', 'PRECIO_FIJO');

-- AlterTable
ALTER TABLE "VentaDetalle" ADD COLUMN     "promocionId" TEXT;

-- CreateTable
CREATE TABLE "Promocion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoPromocion" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "negocioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promocion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromocionProducto" (
    "id" TEXT NOT NULL,
    "promocionId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,

    CONSTRAINT "PromocionProducto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promocion_negocioId_idx" ON "Promocion"("negocioId");

-- CreateIndex
CREATE INDEX "PromocionProducto_promocionId_idx" ON "PromocionProducto"("promocionId");

-- CreateIndex
CREATE INDEX "PromocionProducto_productoId_idx" ON "PromocionProducto"("productoId");

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "Promocion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promocion" ADD CONSTRAINT "Promocion_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocionProducto" ADD CONSTRAINT "PromocionProducto_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "Promocion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocionProducto" ADD CONSTRAINT "PromocionProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
