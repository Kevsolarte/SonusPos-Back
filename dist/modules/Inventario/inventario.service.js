import { createProductoSchema, updateProductoSchema } from "./inventario.schema.js";
import { inventarioRepository } from "./inventario.repository.js";
import { negocioRepository } from "../Negocio/negocio.repository.js";
import { deudasRepository } from "../Creditos/creditos.repository.js";
import { AppError } from "../../middlewares/error.middleware.js";
const formatName = (text) => {
    return text
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};
export const inventarioService = {
    async createProducto(negocioId, dto) {
        const data = createProductoSchema.parse(dto);
        // VALIDACIÓN DE LÍMITES (PLAN)
        const limits = await negocioRepository.getLimits(negocioId);
        if (limits && limits._count.productos >= limits.limiteProductos) {
            throw new AppError(`Has alcanzado el límite de ${limits.limiteProductos} productos permitido por tu plan.`, 403);
        }
        if (data.precio.precioDetal <= data.precio.preciocompra) {
            throw new AppError("El precio de venta debe ser mayor al precio de compra.");
        }
        if (data.inventario.stockMin && data.inventario.stockMax && data.inventario.stockMin > data.inventario.stockMax) {
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
    async updateProducto(negocioId, id, dto) {
        const data = updateProductoSchema.parse(dto);
        const actual = await inventarioRepository.findById(negocioId, id);
        if (!actual)
            throw new AppError("El producto no existe o no pertenece a tu negocio.");
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
            if (data.nombre)
                data.nombre = nombreLimpio;
            if (data.codigoBarra !== undefined)
                data.codigoBarra = barcodeLimpio;
        }
        const pCompra = data.precio?.preciocompra ?? actual.precio?.preciocompra.toNumber();
        const pDetal = data.precio?.precioDetal ?? actual.precio?.precioDetal.toNumber();
        if (pDetal && pCompra && pDetal <= pCompra) {
            throw new AppError("El precio de venta debe ser mayor al costo de compra.");
        }
        return await inventarioRepository.updateProducto(negocioId, id, data);
    },
    async deleteProducto(negocioId, id) {
        const existe = await inventarioRepository.findById(negocioId, id);
        if (!existe)
            throw new AppError("El producto no existe.");
        return await inventarioRepository.deleteProducto(negocioId, id);
    },
    async getInventario(negocioId, page, limit, search, statusFilter) {
        return await inventarioRepository.getInventario(negocioId, page, limit, search, statusFilter);
    },
    async addStock(negocioId, productoId, cantidad, motivo, cuentaId, monto, moneda, proveedorId, estadoPago) {
        const existe = await inventarioRepository.findById(negocioId, productoId);
        if (!existe)
            throw new AppError("El producto no existe.");
        const result = await inventarioRepository.addStock(negocioId, productoId, cantidad, motivo, cuentaId, monto, moneda, proveedorId, estadoPago);
        // Si el pago es PENDIENTE y hay un monto, crear la Deuda automáticamente
        if (estadoPago === "PENDIENTE" && monto && monto > 0) {
            await deudasRepository.create(negocioId, {
                proveedorId: proveedorId || null,
                descripcion: `Deuda por compra de stock: ${existe.nombre} (+${cantidad})`,
                monto: monto,
                moneda: moneda || "USD",
                movimientoId: result.movimientoId,
                tasaCreacion: result.tasaVES ?? undefined,
            });
        }
        return result.producto;
    },
    async getProductoHistory(negocioId, id) {
        return await inventarioRepository.getProductoHistory(negocioId, id);
    },
    async getProductoSales(negocioId, id, page, limit) {
        return await inventarioRepository.getProductoSales(negocioId, id, page, limit);
    },
    async getProductoMovimientos(negocioId, id, page, limit) {
        return await inventarioRepository.getProductoMovimientos(negocioId, id, page, limit);
    }
};
//# sourceMappingURL=inventario.service.js.map