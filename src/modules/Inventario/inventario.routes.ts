import { Router } from "express";
import { inventarioController, entradaInventarioController } from "./inventario.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
export const inventarioRoutes = Router();

inventarioRoutes.post("/producto",inventarioController.createProducto);
inventarioRoutes.post("/entrada",entradaInventarioController.entradaInventario);