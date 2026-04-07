import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { env } from "./config/env.config.js";
import { authRoutes } from "./modules/Auth/auth.routes.js";
import { inventarioRoutes } from "./modules/Inventario/inventario.routes.js";
import { ventasRoutes } from "./modules/ventas/ventas.routes.js";
import reportesRoutes from "./modules/ventas/reportes.routes.js";
import clienteRoutes from "./modules/Clientes/cliente.routes.js";
import movimientosRoutes from "./modules/Movimientos/movimientos.routes.js";
import cierresRoutes from "./modules/Cierres/cierres.routes.js";

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

// Optimized CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
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
app.get("/health", (req, res) => {
  res.status(200).send("OK Server Running");
});

// Domain Routes
app.use("/auth", authRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/pos", ventasRoutes);
app.use("/reportes", reportesRoutes);
app.use("/clientes", clienteRoutes);
app.use("/movimientos", movimientosRoutes);
app.use("/cierres", cierresRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);