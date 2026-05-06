import { usuariosService } from "./usuarios.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
export const usuariosController = {
    getAll: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const usuarios = await usuariosService.getUsuarios(negocioId);
        res.json(usuarios);
    }),
    create: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const usuario = await usuariosService.createUsuario(negocioId, req.body);
        res.status(201).json(usuario);
    }),
    update: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { negocioId } = req.auth;
        const actualizado = await usuariosService.updateUsuario(id, negocioId, req.body);
        res.json(actualizado);
    }),
    delete: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { negocioId } = req.auth;
        await usuariosService.deleteUsuario(id, negocioId);
        res.json({ message: "Usuario eliminado" });
    }),
};
//# sourceMappingURL=usuarios.controller.js.map