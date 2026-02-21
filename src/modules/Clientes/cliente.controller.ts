import type { Request, Response } from "express";
import { clienteService } from "./cliente.service.js";
import { AppError } from "../../middlewares/error.middleware.js";

export const clienteController = {
    async create(req: Request, res: Response) {
        const negocioId = (req as any).auth.negocioId;
        const cliente = await clienteService.crearCliente(negocioId, req.body);
        res.status(201).json(cliente);
    },

    async update(req: Request, res: Response) {
        const negocioId = (req as any).auth.negocioId;
        const id = req.params.id as string;
        if (!id) throw new AppError("ID requerido", 400);

        const cliente = await clienteService.actualizarCliente(id, negocioId, req.body);
        res.json(cliente);
    },

    async delete(req: Request, res: Response) {
        const negocioId = (req as any).auth.negocioId;
        const id = req.params.id as string;
        if (!id) throw new AppError("ID requerido", 400);

        await clienteService.eliminarCliente(id, negocioId);
        res.json({ message: "Cliente eliminado correctamente" });
    },

    async getAll(req: Request, res: Response) {
        const negocioId = (req as any).auth.negocioId;
        const search = req.query.search as string | undefined;
        const clientes = await clienteService.obtenerClientes(negocioId, search);
        res.json(clientes);
    },

    async getById(req: Request, res: Response) {
        const negocioId = (req as any).auth.negocioId;
        const id = req.params.id as string;
        if (!id) throw new AppError("ID requerido", 400);

        const cliente = await clienteService.obtenerClientePorId(id, negocioId);
        res.json(cliente);
    },
};
