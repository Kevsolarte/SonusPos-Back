/*
  Warnings:

  - You are about to drop the column `moneda` on the `Cuenta` table. All the data in the column will be lost.
  - You are about to drop the column `saldoActual` on the `Cuenta` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoCierre" AS ENUM ('ABIERTO', 'PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoCredito" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO');

-- AlterEnum
ALTER TYPE "EstadoVenta" ADD VALUE 'CREDITO';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'USUARIO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoCuenta" ADD VALUE 'PUNTO_DE_VENTA';
ALTER TYPE "TipoCuenta" ADD VALUE 'PAGO_MOVIL';
ALTER TYPE "TipoCuenta" ADD VALUE 'BIO_PAGO';
ALTER TYPE "TipoCuenta" ADD VALUE 'ZELLE';
ALTER TYPE "TipoCuenta" ADD VALUE 'PAYPAL';
ALTER TYPE "TipoCuenta" ADD VALUE 'BINANCE';
ALTER TYPE "TipoCuenta" ADD VALUE 'TRANSFERENCIA';

-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "descripcion" TEXT;

-- AlterTable
ALTER TABLE "Cierre" ADD COLUMN     "auditadoPor" TEXT,
ADD COLUMN     "diferencia" DECIMAL(10,2),
ADD COLUMN     "estado" "EstadoCierre" NOT NULL DEFAULT 'ABIERTO',
ADD COLUMN     "fechaCierre" TIMESTAMP(3),
ADD COLUMN     "montoApertura" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "montoCierreReal" DECIMAL(10,2),
ADD COLUMN     "notasAuditoria" TEXT;

-- AlterTable
ALTER TABLE "Cuenta" DROP COLUMN "moneda",
DROP COLUMN "saldoActual",
ADD COLUMN     "saldoUSD" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "saldoVES" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Negocio" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "limiteProductos" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "limiteUsuarios" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'GRATIS',
ADD COLUMN     "venceEl" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaccionFinanciera" ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "referencia" TEXT,
ADD COLUMN     "tasaUsada" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permissions" JSONB;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "descuentoPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VentaDetalle" ADD COLUMN     "varianteId" TEXT;

-- CreateTable
CREATE TABLE "NegocioConfig" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "impuestoNombre" TEXT NOT NULL DEFAULT 'IVA',
    "impuestoValor" DOUBLE PRECISION NOT NULL DEFAULT 0.16,
    "preciosIncluyenImpuesto" BOOLEAN NOT NULL DEFAULT false,
    "monedaSimbolo" TEXT NOT NULL DEFAULT '$',
    "permitirStockNegativo" BOOLEAN NOT NULL DEFAULT false,
    "obligatorioAbrirCaja" BOOLEAN NOT NULL DEFAULT true,
    "ticketMensaje" TEXT DEFAULT '¡Gracias por su compra!',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NegocioConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cobro" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "clienteId" TEXT,
    "ventaId" TEXT,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "montoPagado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "tasaCreacion" DECIMAL(10,4),
    "fechaVencimiento" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cobro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deuda" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "proveedorId" TEXT,
    "descripcionAcreedor" TEXT,
    "movimientoId" TEXT,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "montoPagado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "tasaCreacion" DECIMAL(10,4),
    "fechaVencimiento" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abono" (
    "id" TEXT NOT NULL,
    "cobroId" TEXT,
    "deudaId" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "tasaUsada" DECIMAL(10,4),
    "cuentaId" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Abono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuscripcionPago" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "ciclo" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "comprobanteUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuscripcionPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaaSMetodoPago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "detalles" TEXT NOT NULL,
    "instrucciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaaSMetodoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT,
    "userId" TEXT,
    "mensaje" TEXT NOT NULL,
    "stack" TEXT,
    "ruta" TEXT,
    "metodo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NegocioConfig_negocioId_key" ON "NegocioConfig"("negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "Cobro_ventaId_key" ON "Cobro"("ventaId");

-- CreateIndex
CREATE INDEX "Cobro_negocioId_idx" ON "Cobro"("negocioId");

-- CreateIndex
CREATE INDEX "Cobro_clienteId_idx" ON "Cobro"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Deuda_movimientoId_key" ON "Deuda"("movimientoId");

-- CreateIndex
CREATE INDEX "Deuda_negocioId_idx" ON "Deuda"("negocioId");

-- CreateIndex
CREATE INDEX "Deuda_proveedorId_idx" ON "Deuda"("proveedorId");

-- CreateIndex
CREATE INDEX "Abono_cobroId_idx" ON "Abono"("cobroId");

-- CreateIndex
CREATE INDEX "Abono_deudaId_idx" ON "Abono"("deudaId");

-- CreateIndex
CREATE INDEX "Abono_cuentaId_idx" ON "Abono"("cuentaId");

-- CreateIndex
CREATE INDEX "SuscripcionPago_negocioId_idx" ON "SuscripcionPago"("negocioId");

-- CreateIndex
CREATE INDEX "SuscripcionPago_estado_idx" ON "SuscripcionPago"("estado");

-- CreateIndex
CREATE INDEX "ErrorLog_negocioId_idx" ON "ErrorLog"("negocioId");

-- CreateIndex
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "Cierre_userId_idx" ON "Cierre"("userId");

-- CreateIndex
CREATE INDEX "Venta_userId_idx" ON "Venta"("userId");

-- AddForeignKey
ALTER TABLE "NegocioConfig" ADD CONSTRAINT "NegocioConfig_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "ProductoVariante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobro" ADD CONSTRAINT "Cobro_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobro" ADD CONSTRAINT "Cobro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobro" ADD CONSTRAINT "Cobro_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deuda" ADD CONSTRAINT "Deuda_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deuda" ADD CONSTRAINT "Deuda_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_cobroId_fkey" FOREIGN KEY ("cobroId") REFERENCES "Cobro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_deudaId_fkey" FOREIGN KEY ("deudaId") REFERENCES "Deuda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuscripcionPago" ADD CONSTRAINT "SuscripcionPago_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
