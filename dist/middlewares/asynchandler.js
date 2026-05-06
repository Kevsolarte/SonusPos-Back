/**
 * Wrapper que convierte un handler async en uno compatible con Express.
 * Sin esto, si un handler async lanza un error, Express no lo captura
 * y la request queda colgada sin respuesta.
 *
 * ANTES (problemático):
 *   async getAll(req, res) { await service.getAll() }  ← error no capturado
 *
 * DESPUÉS (correcto):
 *   getAll: asyncHandler(async (req, res) => { await service.getAll() })
 *
 * El error viaja automáticamente al `errorHandler` global en app.ts.
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
//# sourceMappingURL=asynchandler.js.map