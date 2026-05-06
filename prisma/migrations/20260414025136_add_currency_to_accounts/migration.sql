-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('USD', 'VES', 'BTC', 'EUR', 'COP', 'OTHER');

-- AlterTable
ALTER TABLE "Cuenta" ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'USD';
