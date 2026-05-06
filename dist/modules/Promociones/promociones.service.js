import { promocionesRepository } from "./promociones.repository.js";
import { createPromocionSchema, updatePromocionSchema } from "./promociones.schema.js";
export const promocionesService = {
    async create(negocioId, dto) {
        const data = createPromocionSchema.parse(dto);
        return await promocionesRepository.create(negocioId, data);
    },
    async getAll(negocioId) {
        return await promocionesRepository.getAll(negocioId);
    },
    async getById(id, negocioId) {
        return await promocionesRepository.getById(id, negocioId);
    },
    async update(id, negocioId, dto) {
        const data = updatePromocionSchema.parse(dto);
        return await promocionesRepository.update(id, negocioId, data);
    },
    async delete(id, negocioId) {
        return await promocionesRepository.delete(id, negocioId);
    }
};
//# sourceMappingURL=promociones.service.js.map