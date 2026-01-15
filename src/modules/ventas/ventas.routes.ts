import { Router } from "express";
import { ventasController } from "./ventas.controller.js";


export const ventasRoutes = Router();

ventasRoutes.post("/venta", ventasController.createVenta);
