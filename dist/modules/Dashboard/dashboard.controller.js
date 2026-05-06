import { dashboardService } from "./dashboard.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
export const dashboardController = {
    getStats: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const stats = await dashboardService.getDashboardStats(negocioId);
        res.status(200).json(stats);
    }),
};
//# sourceMappingURL=dashboard.controller.js.map