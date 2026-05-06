/*
  Warnings:

  - You are about to drop the column `monto` on the `VentaPago` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VentaPago" DROP COLUMN "monto",
ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'USD',
ADD COLUMN     "montoBase" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "montoLocal" DECIMAL(10,2),
ADD COLUMN     "tasaCambioId" TEXT,
ADD COLUMN     "tasaCambioUsada" DECIMAL(10,4);

-- CreateTable
CREATE TABLE "TasaCambio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "tasa" DECIMAL(10,4) NOT NULL,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "negocioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TasaCambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VentaPago_tasaCambioId_idx" ON "VentaPago"("tasaCambioId");

-- AddForeignKey
ALTER TABLE "TasaCambio" ADD CONSTRAINT "TasaCambio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaPago" ADD CONSTRAINT "VentaPago_tasaCambioId_fkey" FOREIGN KEY ("tasaCambioId") REFERENCES "TasaCambio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
