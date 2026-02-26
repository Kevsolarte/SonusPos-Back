import { createProductoSchema } from "./inventario.schema.js";
import { inventarioRepository, } from "./inventario.repository.js";
import { AppError } from "../../middlewares/error.middleware.js";
const formatName = (text) => {
    return text
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};
export const inventarioService = {
    async createProducto(negocioId, dto) {
        // 1. Validaciones de coherencia de precios
        if (dto.precio.precioDetal <= dto.precio.preciocompra) {
            throw new AppError("El precio de venta no puede ser menor o igual al precio de compra");
        }
        // 2. Validaciones de coherencia de inventario
        if (dto.inventario.stockMin > dto.inventario.stockMax) {
            throw new AppError("El stock mínimo no puede ser mayor al stock máximo.");
        }
        // 3. Formateo y limpieza de datos
        const nameClean = formatName(dto.nombre);
        const barcodeClean = (dto.codigoBarra === "" || !dto.codigoBarra) ? null : dto.codigoBarra;
        // 4. Validación de duplicados con scope de negocio
        const existe = await inventarioRepository.findByNombre(negocioId, nameClean, barcodeClean);
        if (existe) {
            if (existe.nombre.toLowerCase() === nameClean.toLowerCase()) {
                throw new AppError(`Ya existe un producto con el nombre "${nameClean}" en tu negocio.`);
            }
            if (barcodeClean && existe.codigoBarra === barcodeClean) {
                throw new AppError(`El código de barras "${barcodeClean}" ya está asignado a otro producto.`);
            }
        }
        // Si todo está ok, guardamos con negocioId
        return await inventarioRepository.createProducto(negocioId, {
            ...dto,
            nombre: nameClean,
            codigoBarra: barcodeClean
        });
    },
    async updateProducto(negocioId, id, dto) {
        // 1. ¿El producto existe dentro del negocio?
        const actual = await inventarioRepository.findById(negocioId, id);
        if (!actual)
            throw new AppError("El producto que intentas editar no existe o no pertenece a tu negocio.");
        // 2. Si viene el nombre, formatear y validar que no choque con OTRO producto del mismo negocio
        if (dto.nombre || dto.codigoBarra !== undefined) {
            const nombreLimpio = dto.nombre ? formatName(dto.nombre) : actual.nombre;
            const barcodeLimpio = (dto.codigoBarra === "" || dto.codigoBarra === null) ? null : (dto.codigoBarra ?? actual.codigoBarra);
            const existe = await inventarioRepository.findByNombre(negocioId, nombreLimpio, barcodeLimpio, id);
            if (existe) {
                if (dto.nombre && existe.nombre.toLowerCase() === nombreLimpio.toLowerCase()) {
                    throw new AppError(`El nombre "${nombreLimpio}" ya está en uso en tu negocio.`);
                }
                if (barcodeLimpio && existe.codigoBarra === barcodeLimpio) {
                    throw new AppError(`El código de barras "${barcodeLimpio}" ya está en uso.`);
                }
            }
            if (dto.nombre)
                dto.nombre = nombreLimpio;
            if (dto.codigoBarra !== undefined)
                dto.codigoBarra = barcodeLimpio;
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
    async deleteProducto(negocioId, id) {
        const existe = await inventarioRepository.findById(negocioId, id);
        if (!existe)
            throw new AppError("El producto no existe o no pertenece a tu negocio.");
        return await inventarioRepository.deleteProducto(negocioId, id);
    },
    async getInventario(negocioId, page, limit, search) {
        return await inventarioRepository.getInventario(negocioId, page, limit, search);
    },
    async addStock(negocioId, productoId, cantidad, motivo) {
        const existe = await inventarioRepository.findById(negocioId, productoId);
        if (!existe)
            throw new AppError(/* "El producto no existe o no pertenece a tu negocio." */ "El producto no existe o no pertenece a tu negocio.");
        return await inventarioRepository.addStock(negocioId, productoId, cantidad, motivo);
    }
};
//# sourceMappingURL=inventario.service.js.map