import { prisma }         from "../../config/db.config.js";
import { tasaRepository } from "./tasas.repository.js";
import { createTasaSchema, updateTasaSchema } from "./tasas.schema.js";
import type { CreateTasaDto, UpdateTasaDto } from "./tasas.schema.js";
import { AppError } from "../../middlewares/error.middleware.js";

// ─── Helper: recalcular saldoVES de todas las cuentas ────────────────────────
/**
 * Cuando la tasa VES principal cambia, el equivalente en Bs. de cada cuenta
 * se recalcula como: saldoVES = saldoUSD × nuevaTasa
 *
 * Esto garantiza que saldoVES siempre refleja el valor actual del saldo USD
 * con la tasa vigente, en lugar de quedar desactualizado.
 */
async function recalcularSaldosVES(negocioId: string, nuevaTasa: number) {
  const cuentas = await prisma.cuenta.findMany({
    where: { negocioId, activo: true },
  });

  if (cuentas.length === 0) return;

  await prisma.$transaction(
    cuentas.map((c) =>
      prisma.cuenta.update({
        where: { id: c.id },
        data:  { saldoVES: Number(c.saldoUSD) * nuevaTasa },
      })
    )
  );
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const tasaService = {
  async getAll(negocioId: string) {
    console.log(`[Tasas] Sincronizando para negocio: ${negocioId}`);
    try {
      // 1. Obtener Dólares (Oficial y Paralelo)
      const resDolar = await fetch('https://ve.dolarapi.com/v1/dolares');
      const dataDolar: any = await resDolar.json();
      const bcv = dataDolar.find((r: any) => r.fuente === 'oficial');
      const par = dataDolar.find((r: any) => r.fuente === 'paralelo');

      // 2. Obtener Euros (Oficial)
      const resEuro = await fetch('https://ve.dolarapi.com/v1/euros');
      const dataEuro: any = await resEuro.json();
      const eur = dataEuro.find((r: any) => r.fuente === 'oficial');

      console.log(`[Tasas] API Data - BCV: ${bcv?.promedio}, Par: ${par?.promedio}, EUR: ${eur?.promedio}`);

      // Verificamos si ya existe alguna tasa principal para este negocio en moneda VES
      const hasPrincipal = await prisma.tasaCambio.findFirst({
        where: { negocioId, moneda: "VES", isPrincipal: true }
      });

      if (bcv) {
        await prisma.tasaCambio.upsert({
          where: { id: `off-bcv-${negocioId}` },
          update: { tasa: bcv.promedio, updatedAt: new Date() },
          create: { 
            id: `off-bcv-${negocioId}`,
            nombre: "Dólar BCV (Oficial)", 
            tasa: bcv.promedio, 
            moneda: "VES", 
            negocioId,
            isPrincipal: !hasPrincipal // Si no hay principal, esta lo será
          }
        });
      }

      if (par) {
        await prisma.tasaCambio.upsert({
          where: { id: `off-par-${negocioId}` },
          update: { tasa: par.promedio, updatedAt: new Date() },
          create: { 
            id: `off-par-${negocioId}`,
            nombre: "Dólar Paralelo (Promedio)", 
            tasa: par.promedio, 
            moneda: "VES", 
            negocioId,
            isPrincipal: false
          }
        });
      }

      if (eur) {
        await prisma.tasaCambio.upsert({
          where: { id: `off-eur-${negocioId}` },
          update: { tasa: eur.promedio, updatedAt: new Date() },
          create: { 
            id: `off-eur-${negocioId}`,
            nombre: "Euro (Oficial)", 
            tasa: eur.promedio, 
            moneda: "VES", 
            negocioId,
            isPrincipal: false
          }
        });
      }

      console.log(`[Tasas] Sincronización completada.`);
    } catch (error) {
      console.error("[Tasas] Error syncing official rates:", error);
    }

    return await tasaRepository.findAll(negocioId);
  },

  async create(negocioId: string, dto: CreateTasaDto) {
    const data = createTasaSchema.parse(dto);

    if (data.isPrincipal) {
      await tasaRepository.unsetPrincipal(data.moneda, negocioId);
    }

    const tasaCreada = await tasaRepository.create(data, negocioId);

    // Si se registra directamente como principal VES → recalcular saldos
    if (data.isPrincipal && data.moneda === "VES") {
      await recalcularSaldosVES(negocioId, Number(tasaCreada.tasa));
    }

    return tasaCreada;
  },

  async update(negocioId: string, id: string, dto: UpdateTasaDto) {
    const data = updateTasaSchema.parse(dto);

    let monedaAfectada: string | null = null;

    if (data.isPrincipal) {
      const existing = await tasaRepository.findById(id, negocioId);
      if (!existing) throw new AppError("Tasa no encontrada", 404);

      monedaAfectada = data.moneda || existing.moneda;
      await tasaRepository.unsetPrincipal(monedaAfectada, negocioId);
    }

    const tasaActualizada = await tasaRepository.update(id, data, negocioId);

    // Si se activó como principal VES → recalcular saldoVES en todas las cuentas
    if (data.isPrincipal && (monedaAfectada === "VES" || tasaActualizada.moneda === "VES")) {
      await recalcularSaldosVES(negocioId, Number(tasaActualizada.tasa));
    }

    return tasaActualizada;
  },

  async delete(negocioId: string, id: string) {
    return await tasaRepository.delete(id, negocioId);
  },
};
