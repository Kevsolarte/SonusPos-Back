import { cuentasService } from "./cuentas.service.js";
import { createCuentaSchema, updateCuentaSchema, transaccionManualSchema, } from "./cuentas.schema.js";
export const cuentasController = {
    async getAll(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const result = await cuentasService.getCuentas(negocioId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const data = createCuentaSchema.parse(req.body);
            const result = await cuentasService.createCuenta(negocioId, data);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const { id } = req.params;
            const data = updateCuentaSchema.parse(req.body);
            const result = await cuentasService.updateCuenta(id, negocioId, data);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async delete(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const { id } = req.params;
            await cuentasService.deleteCuenta(id, negocioId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * GET /cuentas/:id/movimientos
     * Historial completo de ingresos y egresos de una cuenta.
     * Query params: ?page=1&limit=50&tipo=INGRESO|EGRESO
     */
    async getMovimientos(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const tipo = req.query.tipo;
            const result = await cuentasService.getMovimientos(id, negocioId, {
                page,
                limit,
                ...(tipo && ["INGRESO", "EGRESO"].includes(tipo) && { tipo: tipo }),
            });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * POST /cuentas/:id/movimiento
     * Registra ingreso o egreso manual con conversión automática de moneda.
     */
    async registrarMovimiento(req, res, next) {
        try {
            const { negocioId } = req.auth;
            const { id } = req.params;
            const data = transaccionManualSchema.parse(req.body);
            const result = await cuentasService.registrarMovimientoManual(id, negocioId, data);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=cuentas.controller.js.map