-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "tasaCambio" DECIMAL(10,4),
ADD COLUMN     "totalLocal" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "ProductoVariante" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sku" TEXT,
    "stockActual" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "precioExtra" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "ProductoVariante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductoVariante_productoId_idx" ON "ProductoVariante"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoVariante_sku_productoId_key" ON "ProductoVariante"("sku", "productoId");

-- AddForeignKey
ALTER TABLE "ProductoVariante" ADD CONSTRAINT "ProductoVariante_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
