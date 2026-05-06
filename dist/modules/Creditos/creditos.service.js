import { cobrosRepository, deudasRepository } from "./creditos.repository.js";
import { AppError } from "../../middlewares/error.middleware.js";
import { createCobroSchema, updateCobroSchema, createDeudaSchema, updateDeudaSchema, createAbonoSchema, } from "./creditos.schema.js";
// ─── Servicio Cobros ──────────────────────────────────────────────────────────
export const cobrosService = {
    async getAll(negocioId, params) {
        return await cobrosRepository.findAll(negocioId, params);
    },
    async getById(negocioId, id) {
        const cobro = await cobrosRepository.findById(id, negocioId);
        if (!cobro)
            throw new AppError("Cobro no encontrado", 404);
        return cobro;
    },
    async create(negocioId, dto) {
        const data = createCobroSchema.parse(dto);
        return await cobrosRepository.create(negocioId, data);
    },
    async update(negocioId, id, dto) {
        const data = updateCobroSchema.parse(dto);
        const exists = await cobrosRepository.findById(id, negocioId);
        if (!exists)
            throw new AppError("Cobro no encontrado", 404);
        return await cobrosRepository.update(id, negocioId, data);
    },
    async delete(negocioId, id) {
        return await cobrosRepository.delete(id, negocioId);
    },
    async registrarAbono(negocioId, cobroId, dto) {
        const data = createAbonoSchema.parse(dto);
        return await cobrosRepository.registrarAbono(cobroId, negocioId, data);
    },
};
// ─── Servicio Deudas ──────────────────────────────────────────────────────────
export const deudasService = {
    async getAll(negocioId, params) {
        return await deudasRepository.findAll(negocioId, params);
    },
    async getById(negocioId, id) {
        const deuda = await deudasRepository.findById(id, negocioId);
        if (!deuda)
            throw new AppError("Deuda no encontrada", 404);
        return deuda;
    },
    async create(negocioId, dto) {
        const data = createDeudaSchema.parse(dto);
        return await deudasRepository.create(negocioId, data);
    },
    async update(negocioId, id, dto) {
        const data = updateDeudaSchema.parse(dto);
        const exists = await deudasRepository.findById(id, negocioId);
        if (!exists)
            throw new AppError("Deuda no encontrada", 404);
        return await deudasRepository.update(id, negocioId, data);
    },
    async delete(negocioId, id) {
        return await deudasRepository.delete(id, negocioId);
    },
    async registrarAbono(negocioId, deudaId, dto) {
        const data = createAbonoSchema.parse(dto);
        return await deudasRepository.registrarAbono(deudaId, negocioId, data);
    },
};
//# sourceMappingURL=creditos.service.js.map