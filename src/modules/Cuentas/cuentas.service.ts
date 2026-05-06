import { prisma }            from "../../config/db.config.js";
import { cuentasRepository } from "./cuentas.repository.js";
import { AppError }          from "../../middlewares/error.middleware.js";
import type {
  createCuentaType,
  updateCuentaType,
  transaccionManualType,
} from "./cuentas.schema.js";

// ─── Helper: obtener tasa VES principal ───────────────────────────────────────

async function getTasaActiva(negocioId: string): Promise<number> {
  const tasa = await prisma.tasaCambio.findFirst({
    where: { negocioId, isPrincipal: true, moneda: "VES" },
  });
  if (!tasa) {
    throw new AppError(
      "No hay tasa de cambio activa. Configura una tasa VES en el módulo de Tasas de Cambio.",
      400
    );
  }
  return Number(tasa.tasa);
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const cuentasService = {
  async getCuentas(negocioId: string) {
    return await cuentasRepository.findAll(negocioId);
  },

  /**
   * Crea la cuenta y convierte el saldo de apertura:
   * - Si se envía saldoUSD > 0 → saldoVES = saldoUSD * tasaActiva
   * - Si se envía saldoVES > 0 → saldoUSD = saldoVES / tasaActiva
   * El cálculo ocurre en el backend para garantizar la consistencia.
   */
  async createCuenta(negocioId: string, data: createCuentaType) {
    let { saldoUSD = 0, saldoVES = 0 } = data;

    if (saldoUSD > 0 || saldoVES > 0) {
      const tasa = await getTasaActiva(negocioId);

      if (saldoUSD > 0 && saldoVES === 0) {
        // El usuario ingresó en USD → calcular VES
        saldoVES = Math.round(saldoUSD * tasa * 100) / 100;
      } else if (saldoVES > 0 && saldoUSD === 0) {
        // El usuario ingresó en VES → calcular USD
        saldoUSD = Math.round((saldoVES / tasa) * 100) / 100;
      }
      // Si enviaron ambos (caso raro), se respetan tal como vienen
    }

    return await cuentasRepository.create(negocioId, {
      ...data,
      saldoUSD,
      saldoVES,
    });
  },

  async updateCuenta(id: string, negocioId: string, data: updateCuentaType) {
    return await cuentasRepository.update(id, negocioId, data);
  },

  async deleteCuenta(id: string, negocioId: string) {
    const cuenta = await cuentasRepository.findById(id, negocioId);
    if (!cuenta) throw new AppError("Cuenta no encontrada", 404);

    if (Number(cuenta.saldoUSD) !== 0 || Number(cuenta.saldoVES) !== 0) {
      throw new AppError(
        "No puedes eliminar una cuenta con saldo. Ajusta a cero primero.",
        400
      );
    }
    return await cuentasRepository.delete(id, negocioId);
  },

  /**
   * GET /cuentas/:id/movimientos
   */
  async getMovimientos(
    id: string,
    negocioId: string,
    params?: { page?: number; limit?: number; tipo?: "INGRESO" | "EGRESO" }
  ) {
    const result = await cuentasRepository.findMovimientos(id, negocioId, params);
    if (!result) throw new AppError("Cuenta no encontrada", 404);
    return result;
  },

  /**
   * POST /cuentas/:id/movimiento
   * Busca la tasa activa en el backend y actualiza AMBOS balances (USD + VES)
   * en una sola transacción atómica.
   */
  async registrarMovimientoManual(
    id: string,
    negocioId: string,
    data: transaccionManualType
  ) {
    const cuenta = await cuentasRepository.findById(id, negocioId);
    if (!cuenta) throw new AppError("Cuenta no encontrada", 404);

    // Obtener tasa activa desde la BD — no se confía en el cliente
    const tasaVES = await getTasaActiva(negocioId);

    return await cuentasRepository.registrarMovimiento({
      cuentaId:   id,
      negocioId,
      monto:      data.monto,
      tipo:       data.tipo,
      moneda:     data.moneda,
      motivo:     data.motivo,
      referencia: data.referencia ?? null,
      tasaVES,
    });
  },
};
