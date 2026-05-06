import { categoriasRepository } from "./categorias.repository.js";
import type { createCategoriaType, updateCategoriaType } from "./categorias.schema.js";

export const categoriasService = {
  async getCategorias(negocioId: string) {
    return await categoriasRepository.getAll(negocioId);
  },

  async createCategoria(negocioId: string, data: createCategoriaType) {
    const existe = await categoriasRepository.getByNameRaw(negocioId, data.nombre);
    
    if (existe) {
      if (existe.activo) {
        throw new Error(`La categoría "${data.nombre}" ya existe.`);
      } else {
        return await categoriasRepository.reactivate(existe.id, negocioId);
      }
    }
    
    return await categoriasRepository.create(negocioId, data);
  },

  async updateCategoria(id: string, negocioId: string, data: updateCategoriaType) {
    return await categoriasRepository.update(id, negocioId, data);
  },

  async deleteCategoria(id: string, negocioId: string) {
    return await categoriasRepository.delete(id, negocioId);
  }
};
