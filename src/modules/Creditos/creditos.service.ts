import { cobrosRepository, deudasRepository } from "./creditos.repository.js";
import { AppError } from "../../middlewares/error.middleware.js";
import {
  createCobroSchema,  updateCobroSchema,
  createDeudaSchema,  updateDeudaSchema,
  createAbonoSchema,
  type CreateCobroDto, type UpdateCobroDto,
  type CreateDeudaDto, type UpdateDeudaDto,
  type CreateAbonoDto,
} from "./creditos.schema.js";

// ─── Servicio Cobros ──────────────────────────────────────────────────────────

export const cobrosService = {
  async getAll(negocioId: string, params?: { page?: number; limit?: number; estado?: string }) {
    return await cobrosRepository.findAll(negocioId, params);
  },

  async getById(negocioId: string, id: string) {
    const cobro = await cobrosRepository.findById(id, negocioId);
    if (!cobro) throw new AppError("Cobro no encontrado", 404);
    return cobro;
  },

  async create(negocioId: string, dto: CreateCobroDto) {
    const data = createCobroSchema.parse(dto);
    return await cobrosRepository.create(negocioId, data);
  },

  async update(negocioId: string, id: string, dto: UpdateCobroDto) {
    const data = updateCobroSchema.parse(dto);
    const exists = await cobrosRepository.findById(id, negocioId);
    if (!exists) throw new AppError("Cobro no encontrado", 404);
    return await cobrosRepository.update(id, negocioId, data);
  },

  async delete(negocioId: string, id: string) {
    return await cobrosRepository.delete(id, negocioId);
  },

  async registrarAbono(negocioId: string, cobroId: string, dto: CreateAbonoDto) {
    const data = createAbonoSchema.parse(dto);
    return await cobrosRepository.registrarAbono(cobroId, negocioId, data);
  },
};

// ─── Servicio Deudas ──────────────────────────────────────────────────────────

export const deudasService = {
  async getAll(negocioId: string, params?: { page?: number; limit?: number; estado?: string }) {
    return await deudasRepository.findAll(negocioId, params);
  },

  async getById(negocioId: string, id: string) {
    const deuda = await deudasRepository.findById(id, negocioId);
    if (!deuda) throw new AppError("Deuda no encontrada", 404);
    return deuda;
  },

  async create(negocioId: string, dto: CreateDeudaDto) {
    const data = createDeudaSchema.parse(dto);
    return await deudasRepository.create(negocioId, data);
  },

  async update(negocioId: string, id: string, dto: UpdateDeudaDto) {
    const data = updateDeudaSchema.parse(dto);
    const exists = await deudasRepository.findById(id, negocioId);
    if (!exists) throw new AppError("Deuda no encontrada", 404);
    return await deudasRepository.update(id, negocioId, data);
  },

  async delete(negocioId: string, id: string) {
    return await deudasRepository.delete(id, negocioId);
  },

  async registrarAbono(negocioId: string, deudaId: string, dto: CreateAbonoDto) {
    const data = createAbonoSchema.parse(dto);
    return await deudasRepository.registrarAbono(deudaId, negocioId, data);
  },
};
