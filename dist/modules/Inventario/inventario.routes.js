import { Router } from "express";
import { inventarioController } from "./inventario.controller.js";
import { validateBody } from '../../middlewares/validate.zod.js';
import { createProductoSchema, addStockSchema } from "./inventario.schema.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
export const inventarioRoutes = Router();
inventarioRoutes.post("/producto", requireAuth, validateBody(createProductoSchema), inventarioController.createProducto);
inventarioRoutes.put("/producto/:id", requireAuth, inventarioController.updateProducto);
inventarioRoutes.delete("/producto/:id", requireAuth, inventarioController.deleteProducto);
inventarioRoutes.get("/", requireAuth, inventarioController.getInventario);
inventarioRoutes.post("/entrada", requireAuth, validateBody(addStockSchema), inventarioController.addStock);
inventarioRoutes.get("/producto/:id/historial", requireAuth, inventarioController.getProductoHistory);
inventarioRoutes.get("/producto/:id/ventas", requireAuth, inventarioController.getProductoSales);
inventarioRoutes.get("/producto/:id/movimientos", requireAuth, inventarioController.getProductoMovimientos);
//# sourceMappingURL=inventario.routes.js.map