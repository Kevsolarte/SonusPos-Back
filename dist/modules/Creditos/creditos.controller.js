import { cobrosService, deudasService } from "./creditos.service.js";
// ─── Controller Cobros ────────────────────────────────────────────────────────
export const cobrosController = {
    async getAll(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const estado = req.query.estado;
            const result = await cobrosService.getAll(negocioId, { page, limit, ...(estado !== undefined && { estado }) });
            res.json(result);
        }
        catch (e) {
            next(e);
        }
    },
    async getById(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const result = await cobrosService.getById(negocioId, req.params.id);
            res.json(result);
        }
        catch (e) {
            next(e);
        }
    },
    async create(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const result = await cobrosService.create(negocioId, req.body);
            res.status(201).json(result);
        }
        catch (e) {
            next(e);
        }
    },
    async update(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const result = await cobrosService.update(negocioId, req.params.id, req.body);
            res.json(result);
        }
        catch (e) {
            next(e);
        }
    },
    async delete(req, res, next) {
        try {
            const { negocioId } = req.auth;
            await cobrosService.delete(negocioId, req.params.id);
            res.status(204).send();
        }
        catch (e) {
            next(e);
        }
    },
    /** POST /cobros/:id/abono — Registra un pago (parcial o total) de un cobro */
    async registrarAbono(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const result = await cobrosService.registrarAbono(negocioId, req.params.id, req.body);
            res.status(201).json(result);
        }
        catch (e) {
            next(e);
        }
    },
};
// ─── Controller Deudas ────────────────────────────────────────────────────────
export const deudasController = {
    async getAll(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const estado = req.query.estado;
            const result = await deudasService.getAll(negocioId, { page, limit, ...(estado !== undefined && { estado }) });
            res.json(result);
        }
        catch (e) {
            next(e);
        }
    },
    async getById(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const result = await deudasService.getById(negocioId, req.params.id);
            res.json(result);
        }
        catch (e) {
            next(e);
        }
    },
    async create(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const result = await deudasService.create(negocioId, req.body);
            res.status(201).json(result);
        }
        catch (e) {
            next(e);
        }
    },
    async update(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const result = await deudasService.update(negocioId, req.params.id, req.body);
            res.json(result);
        }
        catch (e) {
            next(e);
        }
    },
    async delete(req, res, next) {
        try {
            const { negocioId } = req.auth;
            await deudasService.delete(negocioId, req.params.id);
            res.status(204).send();
        }
        catch (e) {
            next(e);
        }
    },
    /** POST /deudas/:id/abono — Registra un pago (parcial o total) de una deuda */
    async registrarAbono(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const result = await deudasService.registrarAbono(negocioId, req.params.id, req.body);
            res.status(201).json(result);
        }
        catch (e) {
            next(e);
        }
    },
};
//# sourceMappingURL=creditos.controller.js.map