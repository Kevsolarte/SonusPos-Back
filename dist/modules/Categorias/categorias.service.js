import { categoriasRepository } from "./categorias.repository.js";
export const categoriasService = {
    async getCategorias(negocioId) {
        return await categoriasRepository.getAll(negocioId);
    },
    async createCategoria(negocioId, data) {
        const existe = await categoriasRepository.getByNameRaw(negocioId, data.nombre);
        if (existe) {
            if (existe.activo) {
                throw new Error(`La categoría "${data.nombre}" ya existe.`);
            }
            else {
                return await categoriasRepository.reactivate(existe.id, negocioId);
            }
        }
        return await categoriasRepository.create(negocioId, data);
    },
    async updateCategoria(id, negocioId, data) {
        return await categoriasRepository.update(id, negocioId, data);
    },
    async deleteCategoria(id, negocioId) {
        return await categoriasRepository.delete(id, negocioId);
    }
};
//# sourceMappingURL=categorias.service.js.map