import { proveedorRepository } from "./proveedor.repository.js";
import { CreateProveedorSchema, UpdateProveedorSchema } from "./proveedor.schema.js";
import type { CreateProveedorDto, UpdateProveedorDto } from "./proveedor.schema.js";
import { AppError } from "../../middlewares/error.middleware.js";

/**
 * Proveedor Service
 * Responsabilidad: Lógica de negocio para gestión de proveedores.
 * Valida los datos de entrada con Zod, aplica reglas de negocio
 * y delega el acceso a datos al proveedorRepository.
 */
export const ProveedorService = {
  /**
   * Devuelve todos los proveedores activos del negocio.
   */
  async getAll(negocioId: string, page?: number, limit?: number, search?: string) {
    return proveedorRepository.findAll(negocioId, page, limit, search);
  },

  /**
   * Busca un proveedor por ID y devuelve su historial de suministros.
   * Lanza AppError 404 si no existe.
   */
  async getById(id: string, negocioId: string) {
    const proveedor = await proveedorRepository.findById(id, negocioId);
    if (!proveedor) throw new AppError("Proveedor no encontrado", 404);
    return proveedor;
  },

  /**
   * Crea un nuevo proveedor. Valida los datos con Zod antes de persistir.
   */
  async create(data: CreateProveedorDto, negocioId: string) {
    const validated = CreateProveedorSchema.parse(data);
    return proveedorRepository.create(validated, negocioId);
  },

  /**
   * Actualiza los datos de un proveedor. Solo los campos enviados son modificados.
   */
  async update(id: string, negocioId: string, data: UpdateProveedorDto) {
    const validated = UpdateProveedorSchema.parse(data);
    return proveedorRepository.update(id, negocioId, validated);
  },

  /**
   * Desactiva un proveedor (soft delete, preserva historial).
   */
  async delete(id: string, negocioId: string) {
    return proveedorRepository.softDelete(id, negocioId);
  },
};
