-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('EFECTIVO', 'BANCO', 'DIGITAL');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('INGRESO', 'EGRESO');

-- AlterTable
ALTER TABLE "VentaPago" ADD COLUMN     "cuentaId" TEXT;

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCuenta" NOT NULL DEFAULT 'EFECTIVO',
    "saldoActual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "negocioId" TEXT NOT NULL,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaccionFinanciera" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "referenciaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransaccionFinanciera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_nombre_negocioId_key" ON "Cuenta"("nombre", "negocioId");

-- CreateIndex
CREATE INDEX "TransaccionFinanciera_cuentaId_idx" ON "TransaccionFinanciera"("cuentaId");

-- CreateIndex
CREATE INDEX "TransaccionFinanciera_referenciaId_idx" ON "TransaccionFinanciera"("referenciaId");

-- CreateIndex
CREATE INDEX "VentaPago_cuentaId_idx" ON "VentaPago"("cuentaId");

-- AddForeignKey
ALTER TABLE "VentaPago" ADD CONSTRAINT "VentaPago_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaccionFinanciera" ADD CONSTRAINT "TransaccionFinanciera_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
