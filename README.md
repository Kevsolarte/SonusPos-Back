# 🚀 SonusPos Backend - Clean Architecture & Data Consistency

**SonusPos API** es el motor multitenant que orquesta el flujo de negocio bajo los principios de **Clean Architecture** y **SOLID**. Diseñado para garantizar la consistencia de datos (ACID) y un aislamiento total entre comercios, este backend demuestra un dominio avanzado de Node.js y patrones de diseño.

## 🏗️ Filosofía de Arquitectura: Repository Pattern
He seleccionado el **Patrón Repositorio** para separar la lógica de negocio (Servicios) del mecanismo de persistencia (ORM/Prisma).
*   **Por qué:** Esto permite que el sistema sea testeable y escalable. Si en el futuro cambiamos de base de datos o de ORM, la lógica de negocio en los `Services` permanece intacta.
*   **Buenas Prácticas:** Inyección de dependencias implícita y contratos de datos mediante esquemas de **Zod**.

---

## 🛠️ Ingeniería de Módulos (Problema -> Solución -> Resultado)

### 1. 💳 Ventas (POS) & Atomicidad
*   **Problema:** Una venta implica 4 acciones críticas: Guardar venta, registrar detalles, registrar pagos y descontar stock. Un error a mitad de camino causa "dinero fantasma" o "stock fantasma".
*   **Solución Técnica:** Implementación de **Prisma `$transaction`**. Se agrupan todas las operaciones en una unidad atómica.
*   **Dato Técnico:** El sistema usa precisión decimal con `Decimal.js` (Decimal(10, 2)) para evitar errores de coma flotante en los precios.
*   **Resultado:** Consistencia 100% garantizada. Si falla el descuento de stock, la venta se revierte automáticamente.

### 2. 📦 Inventario & Repositorio Multitenant
*   **Problema:** Calcular capital y ganancias en tiempo real para cientos de productos bajo el filtro de un negocio específico.
*   **Solución Técnica:** Consultas de agregación en el nivel de repositorio filtradas por `negocioId`.
*   **Dato Técnico:** Se implementó un middleware de **Scope de Negocio** que inyecta el ID del comercio desde el JWT, asegurando que ningún negocio acceda a datos ajenos.
*   **Resultado:** Aislamiento total de n-tenants en una única base de datos (Shared Database Architecture).

### 3. 📜 Movimientos & Inmutabilidad de Auditoría
*   **Problema:** Los ajustes manuales de stock suelen ser puntos ciegos en las auditorías.
*   **Solución Técnica:** Cada cambio de existencias genera una fila en la tabla `MovimientoInventario`. Estos registros son inmutables (solo creación).
*   **Dato Técnico:** Uso de Enums tipados para `TipoMovimiento` (ENTRADA, SALIDA, MERMA) para asegurar la integridad de la base de datos.
*   **Resultado:** Trazabilidad forense de cada unidad de inventario desde su entrada hasta su venta.

### 👥 Clientes, Cierres & Reportes
*   **Problema:** El "ruido" de datos en las consultas de reportes suele ralentizar la API.
*   **Solución Técnica:** Consultas de sólo lectura (`findMany` con `select` selectivo) para optimizar el consumo de memoria en el servidor.
*   **Dato Técnico:** Implementación de paginación basada en cursor para listas masivas de clientes y movimientos, evitando la sobrecarga del payload.
*   **Resultado:** Respuestas rápidas (<200ms) independientemente del tamaño de la base de datos.

---

## 🏗️ Instalación & Docker
Orientado a desarrolladores que buscan rapidez en el despliegue local:

```bash
# 1. Levantar contenedor de base de datos
docker-compose up -d

# 2. Setup (Docker Map: Local Port 5434 -> Contenedor 5432)
npx prisma db push
npm run seed  # Semilla con datos realistas para pruebas
