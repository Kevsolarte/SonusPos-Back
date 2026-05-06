import { prisma } from "../../config/db.config.js";
import type { CreateProveedorDto, UpdateProveedorDto } from "./proveedor.schema.js";

/**
 * Proveedor Repository
 * Responsabilidad: Única capa que habla con Prisma para el modelo Proveedor.
 * El service no debe importar `prisma` directamente; siempre usa este repositorio.
 */
export const proveedorRepository = {
  /**
   * Devuelve todos los proveedores activos de un negocio, ordenados por nombre.
   */
  findAll: async (negocioId: string, page = 1, limit = 50, search?: string) => {
    const where: any = { negocioId, activo: true };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { documento: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.proveedor.count({ where })
    ]);

    return {
      proveedores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * Busca un proveedor por ID e incluye el historial completo de suministros
   * (MovimientoInventario) con el nombre del producto asociado.
   */
  findById: async (id: string, negocioId: string) => {
    return prisma.proveedor.findFirst({
      where: { id, negocioId },
      include: {
        movimientos: {
          include: { producto: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  /**
   * Crea un nuevo proveedor vinculado al negocio.
   */
  create: async (data: CreateProveedorDto, negocioId: string) => {
    return prisma.proveedor.create({
      data: { 
        nombre: data.nombre,
        documento: data.documento ?? null,
        telefono: data.telefono ?? null,
        direccion: data.direccion ?? null,
        negocioId 
      },
    });
  },

  /**
   * Actualiza los datos de contacto de un proveedor existente.
   */
  update: async (id: string, negocioId: string, data: UpdateProveedorDto) => {
    return prisma.proveedor.update({
      where: { id, negocioId },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.documento !== undefined && { documento: data.documento ?? null }),
        ...(data.telefono !== undefined && { telefono: data.telefono ?? null }),
        ...(data.direccion !== undefined && { direccion: data.direccion ?? null }),
        ...(data.activo !== undefined && { activo: data.activo })
      },
    });
  },

  /**
   * Soft delete: marca el proveedor como inactivo sin eliminarlo de la BD.
   * Preserva el historial de suministros asociados.
   */
  softDelete: async (id: string, negocioId: string) => {
    return prisma.proveedor.update({
      where: { id, negocioId },
      data: { activo: false },
    });
  },
};
