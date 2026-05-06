import { reportesService } from "./reportes.service.js";

export const reportesController = {
  async getGeneralReport(req: any, res: any) {
    try {
      const { negocioId } = req.auth;
      const { range } = req.query; // hoy, semanal, mensual
      
      const stats = await reportesService.getGeneralReport(negocioId, range);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: "INTERNAL_ERROR", message: error.message });
    }
  }
};
