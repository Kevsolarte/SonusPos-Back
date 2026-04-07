import { createProductoSchema, updateProductoSchema, type createProductoType, type updateProductoType } from "./inventario.schema.js";
import { inventarioRepository } from "./inventario.repository.js";
import { AppError } from "../../middlewares/error.middleware.js";

const formatName = (text: string) => {
    return text
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const inventarioService = {
    async createProducto(negocioId: string, dto: createProductoType) {
        const data = createProductoSchema.parse(dto);

        if (data.precio.precioDetal <= data.precio.preciocompra) {
            throw new AppError("El precio de venta debe ser mayor al precio de compra.");
        }
        if (data.inventario.stockMin > data.inventario.stockMax) {
            throw new AppError("El stock mínimo no puede ser mayor al stock máximo.");
        }

        const nameClean = formatName(data.nombre);
        const barcodeClean = (data.codigoBarra === "" || !data.codigoBarra) ? null : data.codigoBarra;

        const existe = await inventarioRepository.findByNombre(negocioId, nameClean, barcodeClean);
        if (existe) {
            if (existe.nombre.toLowerCase() === nameClean.toLowerCase()) {
                throw new AppError(`Ya existe el producto "${nameClean}" en tu negocio.`);
            }
            if (barcodeClean && existe.codigoBarra === barcodeClean) {
                throw new AppError(`El código "${barcodeClean}" ya está asignado.`);
            }
        }

        return await inventarioRepository.createProducto(negocioId, {
            ...data,
            nombre: nameClean,
            codigoBarra: barcodeClean
        });
    },

    async updateProducto(negocioId: string, id: string, dto: updateProductoType) {
        const data = updateProductoSchema.parse(dto);
        const actual = await inventarioRepository.findById(negocioId, id);

        if (!actual) throw new AppError("El producto no existe o no pertenece a tu negocio.");

        if (data.nombre || data.codigoBarra !== undefined) {
            const nombreLimpio = data.nombre ? formatName(data.nombre) : actual.nombre;
            const barcodeLimpio = (data.codigoBarra === "" || data.codigoBarra === null) ? null : (data.codigoBarra ?? actual.codigoBarra);
            const existe = await inventarioRepository.findByNombre(negocioId, nombreLimpio, barcodeLimpio, id);

            if (existe) {
                if (data.nombre && existe.nombre.toLowerCase() === nombreLimpio.toLowerCase()) {
                    throw new AppError(`El nombre "${nombreLimpio}" ya está en uso.`);
                }
                if (barcodeLimpio && existe.codigoBarra === barcodeLimpio) {
                    throw new AppError(`El código "${barcodeLimpio}" ya está en uso.`);
                }
            }

            if (data.nombre) data.nombre = nombreLimpio;
            if (data.codigoBarra !== undefined) data.codigoBarra = barcodeLimpio;
        }

        const pCompra = data.precio?.preciocompra ?? actual.precio?.preciocompra.toNumber();
        const pDetal = data.precio?.precioDetal ?? actual.precio?.precioDetal.toNumber();

        if (pDetal && pCompra && pDetal <= pCompra) {
            throw new AppError("El precio de venta debe ser mayor al costo de compra.");
        }

        return await inventarioRepository.updateProducto(negocioId, id, data);
    },

    async deleteProducto(negocioId: string, id: string) {
        const existe = await inventarioRepository.findById(negocioId, id);
        if (!existe) throw new AppError("El producto no existe.");
        return await inventarioRepository.deleteProducto(negocioId, id);
    },

    async getInventario(negocioId: string, page?: number, limit?: number, search?: string) {
        return await inventarioRepository.getInventario(negocioId, page, limit, search);
    },

    async addStock(negocioId: string, productoId: string, cantidad: number, motivo: string) {
        const existe = await inventarioRepository.findById(negocioId, productoId);
        if (!existe) throw new AppError("El producto no existe.");
        return await inventarioRepository.addStock(negocioId, productoId, cantidad, motivo);
    }
}
