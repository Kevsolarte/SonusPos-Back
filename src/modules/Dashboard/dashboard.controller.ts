import type { Request, Response } from "express";
import { dashboardService } from "./dashboard.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";

export const dashboardController = {
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = (req as any).auth;
    
    const stats = await dashboardService.getDashboardStats(negocioId);
    
    res.status(200).json(stats);
  }),
};
