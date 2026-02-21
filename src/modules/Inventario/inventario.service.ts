import { createProductoSchema } from "./inventario.schema.js";
import { inventarioRepository, } from "./inventario.repository.js";
import { AppError } from "../../middlewares/error.middleware.js";

const formatName = (text: string) => {
    return text
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};


export const inventarioService = {
    async createProducto(negocioId: string, dto: any) {
        // 1. Validaciones de coherencia de precios
        if (dto.precio.precioDetal <= dto.precio.preciocompra) {
            throw new AppError("El precio de venta no puede ser menor o igual al precio de compra");
        }
        // 2. Validaciones de coherencia de inventario
        if (dto.inventario.stockMin > dto.inventario.stockMax) {
            throw new AppError("El stock mínimo no puede ser mayor al stock máximo.");
        }
        // 3. Formateo y validación de duplicados con scope de negocio
        const nameClean = formatName(dto.nombre);
        const existe = await inventarioRepository.findByNombre(negocioId, nameClean, dto.codigoBarra);
        if (existe) throw new AppError(`Ya existe un producto con ese nombre o código en tu negocio.`);

        // Si todo está ok, guardamos con negocioId
        return await inventarioRepository.createProducto(negocioId, {
            ...dto,
            nombre: nameClean
        });
    },

    async updateProducto(negocioId: string, id: string, dto: any) {
        // 1. ¿El producto existe dentro del negocio?
        const actual = await inventarioRepository.findById(negocioId, id);
        if (!actual) throw new AppError("El producto que intentas editar no existe o no pertenece a tu negocio.");

        // 2. Si viene el nombre, formatear y validar que no choque con OTRO producto del mismo negocio
        if (dto.nombre) {
            const nombreLimpio = formatName(dto.nombre);
            if (nombreLimpio !== actual.nombre) {
                const existe = await inventarioRepository.findByNombre(negocioId, nombreLimpio, dto.codigoBarra, id);
                if (existe) throw new AppError(`El nombre "${nombreLimpio}" ya está en uso en tu negocio.`);
                dto.nombre = nombreLimpio;
            }
        }

        // 3. Validar Reglas de Negocio: Precios
        const pCompra = dto.precio?.preciocompra ?? actual.precio?.preciocompra.toNumber();
        const pDetal = dto.precio?.precioDetal ?? actual.precio?.precioDetal.toNumber();

        if (pDetal <= pCompra) {
            throw new AppError("El precio de venta debe ser mayor al costo de compra.");
        }

        // 4. Todo validado -> Mandamos al Repository con scope de negocio
        return await inventarioRepository.updateProducto(negocioId, id, dto);
    },

    async deleteProducto(negocioId: string, id: string) {
        const existe = await inventarioRepository.findById(negocioId, id);
        if (!existe) throw new AppError("El producto no existe o no pertenece a tu negocio.");

        return await inventarioRepository.deleteProducto(negocioId, id);
    },
    async getInventario(negocioId: string) {
        return await inventarioRepository.getInventario(negocioId);
    },
    async addStock(negocioId: string, productoId: string, cantidad: number, motivo: string) {
        const existe = await inventarioRepository.findById(negocioId, productoId);
        if (!existe) throw new AppError(/* "El producto no existe o no pertenece a tu negocio." */ "El producto no existe o no pertenece a tu negocio.");

        return await inventarioRepository.addStock(negocioId, productoId, cantidad, motivo);
    }
}
