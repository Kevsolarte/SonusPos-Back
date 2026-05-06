-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "esCombo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ComboComponente" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "componenteId" TEXT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "ComboComponente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComboComponente_comboId_idx" ON "ComboComponente"("comboId");

-- CreateIndex
CREATE INDEX "ComboComponente_componenteId_idx" ON "ComboComponente"("componenteId");

-- AddForeignKey
ALTER TABLE "ComboComponente" ADD CONSTRAINT "ComboComponente_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboComponente" ADD CONSTRAINT "ComboComponente_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
