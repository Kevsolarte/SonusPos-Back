import { prisma } from "../../config/db.config.js";
import type { CreateTasaDto, UpdateTasaDto } from "./tasas.schema.js";

export const tasaRepository = {
  findAll: async (negocioId: string) => {
    return prisma.tasaCambio.findMany({
      where: { negocioId },
      orderBy: { createdAt: "desc" },
    });
  },

  findById: async (id: string, negocioId: string) => {
    return prisma.tasaCambio.findUnique({
      where: { id, negocioId },
    });
  },

  create: async (data: CreateTasaDto, negocioId: string) => {
    return prisma.tasaCambio.create({
      data: {
        nombre: data.nombre,
        moneda: data.moneda,
        tasa: new (prisma as any).constructor.Decimal(data.tasa),
        isPrincipal: data.isPrincipal || false,
        negocioId,
      },
    });
  },

  update: async (id: string, data: UpdateTasaDto, negocioId: string) => {
    return prisma.tasaCambio.update({
      where: { id, negocioId },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.moneda !== undefined && { moneda: data.moneda }),
        ...(data.tasa !== undefined && { tasa: new (prisma as any).constructor.Decimal(data.tasa) }),
        ...(data.isPrincipal !== undefined && { isPrincipal: data.isPrincipal })
      },
    });
  },

  delete: async (id: string, negocioId: string) => {
    return prisma.tasaCambio.delete({
      where: { id, negocioId },
    });
  },

  /**
   * Cuando se marca una tasa como principal para una moneda,
   * se deben desmarcar las demás de la misma moneda.
   */
  unsetPrincipal: async (moneda: string, negocioId: string) => {
    return prisma.tasaCambio.updateMany({
      where: { moneda: moneda as any, negocioId },
      data: { isPrincipal: false },
    });
  }
};
