-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MetodoPago" ADD VALUE 'PAGO_MOVIL';
ALTER TYPE "MetodoPago" ADD VALUE 'EFECTIVO_USD';
ALTER TYPE "MetodoPago" ADD VALUE 'EFECTIVO_VES';

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "imagenUrl" TEXT;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "cierreId" TEXT;

-- CreateTable
CREATE TABLE "Cierre" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalVentas" DECIMAL(10,2) NOT NULL,
    "cantVentas" INTEGER NOT NULL,
    "detallePagos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cierre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cierre_negocioId_idx" ON "Cierre"("negocioId");

-- CreateIndex
CREATE INDEX "Venta_cierreId_idx" ON "Venta"("cierreId");

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_cierreId_fkey" FOREIGN KEY ("cierreId") REFERENCES "Cierre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cierre" ADD CONSTRAINT "Cierre_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cierre" ADD CONSTRAINT "Cierre_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
