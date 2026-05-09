# Funcionalidad de MisFinanzas API

Este documento detalla la funcionalidad completa del backend de MisFinanzas, analizando sus módulos, lógica de negocio y capacidades de reporte.

## 1. Conceptos Fundamentales

La API está diseñada para gestionar las finanzas personales basándose en **Períodos** mensuales. Toda la información financiera (gastos, ahorros, presupuestos) está vinculada a un período específico (mes/año).

### Manejo de Moneda (Regla Crítica)
Para evitar errores de redondeo y precisión con punto flotante, todos los montos monetarios se manejan como **enteros representando centavos** (Valor Real * 100).
*   Ejemplo: $1.250,50 se almacena y transmite como `125050`.

---

## 2. Módulos y Funcionalidades

### 2.1 Gestión de Períodos
Es el eje central de la aplicación.
*   **Identificación**: Cada período se define por un mes y un año.
*   **Balance Inicial**: Permite establecer el dinero disponible al inicio del mes.
*   **Tipo de Cambio**: Soporta el registro del valor del USD para referencia dentro del período.
*   **Período Actual**: Funcionalidad para obtener o crear automáticamente el período correspondiente al mes calendario en curso.

### 2.2 Categorización
Sistema de clasificación para gastos y presupuestos.
*   **Atributos**: Cada categoría posee un nombre, un ícono y un color hexadecimal para representación visual en el frontend.
*   **Predefinidas**: Incluye categorías estándar como Alimentación, Transporte, Salud, Entretenimiento, Servicios, Indumentaria, Educación y Otros.

### 2.3 Control de Gastos
Registro detallado de salidas de dinero.
*   **Vinculación**: Cada gasto pertenece a un período y a una categoría.
*   **Detalles**: Almacena descripción, monto, fecha exacta y notas adicionales.
*   **Operaciones**: Soporta CRUD completo (Crear, Leer, Actualizar, Parchear y Eliminar).

### 2.4 Gestión de Ahorros
Seguimiento del capital reservado.
*   **Multimoneda**: Soporta ahorros en Pesos (ARS) y Dólares (USD).
*   **Origen**: Permite registrar de dónde proviene el ahorro o dónde se deposita.
*   **Impacto en Balance**: Los ahorros en ARS se restan del saldo disponible del período.

### 2.5 Presupuestos (Límites de Gasto)
Planificación financiera por categoría.
*   **Límites por Categoría**: Permite definir un monto máximo de gasto para una categoría específica dentro de un período.
*   **Seguimiento**: El sistema calcula en tiempo real cuánto del presupuesto ha sido consumido por los gastos registrados.

---

## 3. Inteligencia de Negocio y Reportes

El módulo de `Resumen` consolida la información para ofrecer una visión clara de la salud financiera.

### 3.1 Resumen del Período
Devuelve un objeto integral que incluye:
*   **Totales**: Sumatoria de gastos, ahorros (ARS y USD).
*   **Saldo Disponible**: Cálculo automático: `Dinero Inicial - Gastos - Ahorros ARS`.
*   **Porcentaje de Ahorro**: Relación entre el ahorro ARS y el dinero inicial.
*   **Análisis por Categoría**: Lista de gastos agrupados por categoría, incluyendo el porcentaje que representa cada una sobre el total gastado.
*   **Estado de Presupuestos**: Comparativa de `Monto Límite` vs. `Consumido` para cada categoría presupuestada.

### 3.2 Comparativa Inter-Mensual
Permite comparar el desempeño financiero con el mes anterior:
*   **Variación de Gastos**: Porcentaje de incremento o disminución del gasto total respecto al período anterior.
*   **Variación de Ahorros**: Porcentaje de cambio en la capacidad de ahorro.

---

## 4. Estructura de la API (Endpoints)

| Ruta | Métodos | Descripción |
| :--- | :--- | :--- |
| `/periodos` | `GET`, `POST` | Listar y crear períodos. |
| `/periodos/actual` | `GET` | Obtener el período del mes corriente. |
| `/categorias` | `GET` | Listar categorías disponibles. |
| `/gastos` | `GET`, `POST` | Listar (con filtros) y crear gastos. |
| `/gastos/:id` | `GET`, `PUT`, `PATCH`, `DELETE` | Operaciones individuales sobre gastos. |
| `/ahorros` | `GET`, `POST` | Listar y crear ahorros. |
| `/ahorros/:id` | `GET`, `PATCH`, `DELETE` | Operaciones individuales sobre ahorros. |
| `/presupuestos` | `GET`, `POST` | Listar y crear/reemplazar presupuestos. |
| `/resumen/:periodo_id` | `GET` | Resumen financiero completo del período. |
| `/resumen/:periodo_id/comparativa` | `GET` | Comparativa con el mes anterior. |

---

## 5. Detalles Técnicos

*   **Arquitectura**: Serverless (Cloudflare Workers).
*   **Framework**: Hono.
*   **Base de Datos**: SQLite (Cloudflare D1).
*   **Validación**: Zod (asegura que los datos entrantes cumplan con los contratos).
*   **Seguridad**: Middleware de manejo de errores global y CORS configurado.
