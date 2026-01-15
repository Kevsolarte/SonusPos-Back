import type { Request, Response } from "express";
import { authService,  } from "./auth.service.js";

export const authController = {
    async createAdmin(req: Request, res: Response) {
        const dto = req.body;
        const { user, credentials } = await authService.createAdmin(dto);
        res.status(201).json({ user, credentials });
    },
   
    async login(req: Request, res: Response) {
        const dto = req.body;
        const user = await authService.login(dto);
        res.status(200).json(user);
    }
}