import express from "express";
import cors from "cors";
import { authRoutes } from "./modules/Auth/auth.routes.js";
import { inventarioRoutes } from "./modules/Inventario/inventario.routes.js";
import { ventasRoutes } from "./modules/ventas/ventas.routes.js";
import reportesRoutes from "./modules/ventas/reportes.routes.js";
import clienteRoutes from "./modules/Clientes/cliente.routes.js";
import { errorHandler } from "./middlewares/errorhandler.js";
export const app = express();
app.set("trust proxy", 1);
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true);
        if (allowedOrigins.includes(origin))
            return cb(null, true);
        return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});
app.use("/auth", authRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/pos", ventasRoutes);
app.use("/reportes", reportesRoutes);
app.use("/clientes", clienteRoutes);
app.use(errorHandler);
//# sourceMappingURL=app.js.map