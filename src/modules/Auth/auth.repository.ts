import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";

export const authRepository = {
    async findNegocioById(id: string) {
        return await prisma.negocio.findUnique({
            where: { id },
            select: { activo: true, venceEl: true }
        });
    },
    async findByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { 
                id: true, 
                name: true, 
                email: true, 
                role: true, 
                passwordHash: true, 
                negocioId: true,
                activo: true,
                permissions: true
            },
        });
    },

    async findByIdWithNegocio(id: string) {
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                activo: true,
                permissions: true,
                negocioId: true,
                negocio: {
                    include: {
                        config: true
                    }
                }
            }
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
    },

    /**
     * Registro público de dueño de negocio (ADMIN).
     * Crea el Negocio y el User en una sola transacción atómica.
     */
    async registerAdmin(data: {
        name: string;
        email: string;
        passwordHash: string;
        negocioNombre: string;
        negocioRuc?: string;
        negocioDireccion?: string;
        negocioTelefono?: string;
    }) {
        return await prisma.$transaction(async (tx) => {
            const vence = new Date();
            vence.setDate(vence.getDate() + 10); // 10 días de prueba

            // 1. Crear el negocio
            const negocio = await tx.negocio.create({
                data: {
                    nombre: data.negocioNombre.trim(),
                    ruc: data.negocioRuc?.trim() || null,
                    direccion: data.negocioDireccion?.trim() || null,
                    telefono: data.negocioTelefono?.trim() || null,
                    plan: "PRUEBA",
                    venceEl: vence,
                    limiteUsuarios: 5,
                    limiteProductos: 500,
                    // Crear config inicial
                    config: {
                        create: {} // Usa los defaults del esquema
                    }
                },
                include: {
                    config: true
                }
            });

            // 2. Crear el usuario ADMIN vinculado al negocio
            const user = await tx.user.create({
                data: {
                    name: data.name.trim(),
                    email: data.email.toLowerCase().trim(),
                    role: "ADMIN",
                    passwordHash: data.passwordHash,
                    negocioId: negocio.id,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    negocioId: true,
                    permissions: true,
                },
            });

            // 3. SEEDING: Datos iniciales necesarios para operar el POS de inmediato
            
            // 3a. Categoría por defecto
            await tx.categoria.create({
                data: {
                    nombre: "General",
                    negocioId: negocio.id
                }
            });

            // 3b. Cuenta principal (Efectivo)
            await tx.cuenta.create({
                data: {
                    nombre: "Caja Principal",
                    tipo: "EFECTIVO",
                    negocioId: negocio.id,
                    saldoUSD: 0,
                    saldoVES: 0
                }
            });

            return { user, negocio };
        });
    },
};

