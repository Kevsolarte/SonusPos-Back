/**
 * Helper para obtener la tasa oficial (BCV) desde el backend.
 * Se usa específicamente para el reporte de pagos de suscripción.
 */
export const getDolarTasa = async () => {
    try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        const data = await response.json();
        const bcv = data.find((item) => item.fuente === 'oficial');
        return bcv?.promedio || 36.5;
    }
    catch (error) {
        console.error('Error fetching BCV rate:', error);
        return 36.5;
    }
};
//# sourceMappingURL=tasaApi.js.map