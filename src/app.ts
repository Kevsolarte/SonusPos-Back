import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { env } from "./config/env.config.js";
import { authRoutes } from "./modules/Auth/auth.routes.js";
import { inventarioRoutes } from "./modules/Inventario/inventario.routes.js";
import { ventasRoutes } from "./modules/ventas/ventas.routes.js";
import reportesRoutes from "./modules/Reportes/reportes.routes.js";
import clienteRoutes from "./modules/Clientes/cliente.routes.js";
import movimientosRoutes from "./modules/Movimientos/movimientos.routes.js";
import cierresRoutes from "./modules/Cierres/cierres.routes.js";
import cuentasRoutes from "./modules/Cuentas/cuentas.routes.js";
import categoriasRoutes from "./modules/Categorias/categorias.routes.js";
import promocionesRoutes from "./modules/Promociones/promociones.routes.js";
import proveedorRoutes from "./modules/proveedores/proveedor.routes.js";
import tasasRoutes from "./modules/Tasas/tasas.routes.js";
import { cobrosRoutes, deudasRoutes } from "./modules/Creditos/creditos.routes.js";
import { usuariosRoutes } from "./modules/Usuarios/usuarios.routes.js";
import negocioRoutes from "./modules/Negocio/negocio.routes.js";
import superAdminRoutes from "./modules/SuperAdmin/superadmin.routes.js";
import dashboardRoutes from "./modules/Dashboard/dashboard.routes.js";

import { errorHandler } from "./middlewares/errorhandler.js";

export const app = express();

app.set("trust proxy", 1);

// Security layer
app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_REQUESTS", message: "Demasiadas peticiones. Intenta en 15 min." }
});
app.use(globalLimiter);

/**
 * Rate limiter estricto para el endpoint de login.
 * Previene ataques de fuerza bruta: máximo 10 intentos por IP cada 15 minutos.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_ATTEMPTS", message: "Demasiados intentos de login. Intenta en 15 min." }
});


// Optimized CORS configuration
const allowedOrigins = [
  "http://localhost:8080",
  env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Payload size safety
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Health Check
import { asyncHandler } from "./middlewares/asynchandler.js";
import { prisma } from "./config/db.config.js";

app.get("/health", asyncHandler(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.status(200).json({ status: "ok", db: "connected", ts: new Date().toISOString() });
}));

// Domain Routes
app.use("/auth", loginLimiter, authRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/pos", ventasRoutes);
app.use("/reportes", reportesRoutes);
app.use("/clientes", clienteRoutes);
app.use("/movimientos", movimientosRoutes);
app.use("/cierres", cierresRoutes);
app.use("/cuentas", cuentasRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/promociones", promocionesRoutes);
app.use("/proveedores", proveedorRoutes);
app.use("/tasas",       tasasRoutes);
app.use("/cobros",      cobrosRoutes);
app.use("/deudas",      deudasRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/negocio", negocioRoutes);
app.use("/superadmin", superAdminRoutes);
app.use("/dashboard",  dashboardRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);