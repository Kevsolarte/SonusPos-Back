import { promocionesRepository } from "./promociones.repository.js";
import { createPromocionSchema, updatePromocionSchema, type createPromocionType, type updatePromocionType } from "./promociones.schema.js";

export const promocionesService = {
    async create(negocioId: string, dto: createPromocionType) {
        const data = createPromocionSchema.parse(dto);
        return await promocionesRepository.create(negocioId, data);
    },

    async getAll(negocioId: string) {
        return await promocionesRepository.getAll(negocioId);
    },

    async getById(id: string, negocioId: string) {
        return await promocionesRepository.getById(id, negocioId);
    },

    async update(id: string, negocioId: string, dto: updatePromocionType) {
        const data = updatePromocionSchema.parse(dto);
        return await promocionesRepository.update(id, negocioId, data);
    },

    async delete(id: string, negocioId: string) {
        return await promocionesRepository.delete(id, negocioId);
    }
};
