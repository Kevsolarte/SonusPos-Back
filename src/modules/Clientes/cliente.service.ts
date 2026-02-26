import { clienteRepository } from "./cliente.repository.js";
import { AppError } from "../../middlewares/error.middleware.js";
import { createClienteSchema, updateClienteSchema } from "./cliente.schema.js";

export const clienteService = {
    async crearCliente(negocioId: string, dto: unknown) {
        const data = createClienteSchema.parse(dto);

        // Verificar si ya existe un cliente con ese documento en el mismo negocio
        const existente = await clienteRepository.findByDocumento(data.documento, negocioId);
        if (existente) {
            throw new AppError("Ya existe un cliente registrado con ese documento.");
        }

        // Limpiar campos undefined para evitar errores con exactOptionalPropertyTypes
        const createData = {
            nombre: data.nombre,
            documento: data.documento,
            ...(data.telefono !== undefined && { telefono: data.telefono }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.direccion !== undefined && { direccion: data.direccion }),
        } as any;

        return await clienteRepository.create(negocioId, createData);
    },

    async actualizarCliente(id: string, negocioId: string, dto: unknown) {
        const data = updateClienteSchema.parse(dto);

        // Verificar existencia antes de actualizar
        const cliente = await clienteRepository.findById(id, negocioId);
        if (!cliente) {
            throw new AppError("Cliente no encontrado.");
        }

        // Si está actualizando el documento, verificar que no choque con otro
        if (data.documento && data.documento !== cliente.documento) {
            const choque = await clienteRepository.findByDocumento(data.documento, negocioId);
            if (choque) {
                throw new AppError("El nuevo documento ya está registrado con otro cliente.");
            }
        }

        // Limpiar campos undefined
        const updateData: any = {};
        if (data.nombre !== undefined) updateData.nombre = data.nombre;
        if (data.documento !== undefined) updateData.documento = data.documento;
        if (data.telefono !== undefined) updateData.telefono = data.telefono;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.direccion !== undefined) updateData.direccion = data.direccion;

        return await clienteRepository.update(id, negocioId, updateData);
    },

    async eliminarCliente(id: string, negocioId: string) {
        const cliente = await clienteRepository.findById(id, negocioId);
        if (!cliente) {
            throw new AppError("Cliente no encontrado.");
        }
        return await clienteRepository.delete(id, negocioId);
    },

    async obtenerClientes(negocioId: string, page?: number, limit?: number, search?: string) {
        return await clienteRepository.findAll(negocioId, page, limit, search);
    },

    async obtenerClientePorId(id: string, negocioId: string) {
        const cliente = await clienteRepository.findById(id, negocioId);
        if (!cliente) {
            throw new AppError("Cliente no encontrado.");
        }
        return cliente;
    },
};
