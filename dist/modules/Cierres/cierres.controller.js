import { cierresService } from "./cierres.service.js";
export const cierresController = {
    async getStatus(req, res) {
        const negocioId = req.auth?.negocioId;
        console.log("Consultando status de cierre. NegocioId:", negocioId);
        const stats = await cierresService.getVentasPendientes(negocioId);
        res.json(stats);
    },
    async cerrarCaja(req, res) {
        const negocioId = req.auth?.negocioId;
        const userId = req.auth?.sub; // En el JWT guardamos como 'sub'
        console.log("Iniciando cierre de caja. Negocio:", negocioId, "Usuario:", userId);
        if (!negocioId || !userId) {
            console.error("Faltan datos en req.auth:", req.auth);
            return res.status(401).json({ error: "UNAUTHORIZED", message: "Datos de sesión incompletos" });
        }
        const result = await cierresService.ejecutarCierre(negocioId, userId);
        res.json({
            message: "Cierre de caja realizado con éxito",
            data: result
        });
    },
    async getHistorial(req, res) {
        const negocioId = req.auth?.negocioId;
        const historial = await cierresService.getHistorialCierres(negocioId);
        res.json(historial);
    }
};
//# sourceMappingURL=cierres.controller.js.map