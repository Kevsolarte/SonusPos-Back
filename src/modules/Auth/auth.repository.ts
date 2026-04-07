import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";

export const authRepository = {
    async findByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { 
                id: true, 
                name: true, 
                email: true, 
                role: true, 
                passwordHash: true, 
                negocioId: true 
            },
        });
    },

    async findByIdWithNegocio(id: string) {
        return await prisma.user.findUnique({
            where: { id },
            include: { negocio: true }
        });
    },

    async createAdminInstance(data: { name: string; email: string; passwordHash: string }) {
        return await prisma.user.create({
            data: {
                name: data.name.trim(),
                email: data.email.toLowerCase().trim(),
                role: "ADMIN",
                passwordHash: data.passwordHash,
            },
            select: { 
                id: true, 
                name: true, 
                email: true, 
                role: true, 
                createdAt: true, 
                negocioId: true 
            },
        });
    }
};
