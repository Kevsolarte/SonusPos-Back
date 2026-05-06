import { prisma } from "../../config/db.config.js";
import { type createCategoriaType, type updateCategoriaType } from "./categorias.schema.js";

export const categoriasRepository = {
  async getAll(negocioId: string) {
    return await prisma.categoria.findMany({
      where: { negocioId },
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { productos: true }
        }
      }
    });
  },

  async getById(id: string, negocioId: string) {
    return await prisma.categoria.findFirst({
      where: { id, negocioId }
    });
  },

  async getByNameRaw(negocioId: string, nombre: string) {
    return await prisma.categoria.findFirst({
      where: { negocioId, nombre }
    });
  },

  async reactivate(id: string, negocioId: string) {
    return await prisma.categoria.update({
      where: { id, negocioId },
      data: { activo: true }
    });
  },

  async create(negocioId: string, data: createCategoriaType) {
    return await prisma.categoria.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        negocioId
      }
    });
  },

  async update(id: string, negocioId: string, data: updateCategoriaType) {
    return await prisma.categoria.update({
      where: { id, negocioId },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion ?? null }),
        ...(data.activo !== undefined && { activo: data.activo })
      }
    });
  },

  async delete(id: string, negocioId: string) {
    // Soft delete
    return await prisma.categoria.update({
      where: { id, negocioId },
      data: { activo: false }
    });
  }
};
