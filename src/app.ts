import express from "express";
import { authRoutes, } from "./modules/Auth/auth.routes.js";
import { inventarioRoutes } from "./modules/Inventario/inventario.routes.js";
import { ventasRoutes } from "./modules/ventas/ventas.routes.js";

export const app = express();

app.use(express.json());

app.get("/Health", (req, res) => {
  res.send("OK");
});

app.use("/auth", authRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/pos", ventasRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
