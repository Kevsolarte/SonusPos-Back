import { tasaService } from "./tasas.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
export const tasaController = {
    getAll: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const tasas = await tasaService.getAll(negocioId);
        res.status(200).json(tasas);
    }),
    create: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const nuevaTasa = await tasaService.create(negocioId, req.body);
        res.status(201).json(nuevaTasa);
    }),
    update: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        const tasaActualizada = await tasaService.update(negocioId, id, req.body);
        res.status(200).json(tasaActualizada);
    }),
    delete: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        await tasaService.delete(negocioId, id);
        res.status(204).send();
    }),
};
//# sourceMappingURL=tasas.controller.js.map