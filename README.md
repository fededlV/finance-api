# MisFinanzas API

Backend serverless de la app mobile MisFinanzas para gestionar gastos, ahorros, presupuestos y reportes mensuales.

## Documentación relacionada

- Inicio rápido: [QUICKSTART.md](QUICKSTART.md)
- Setup paso a paso: [SETUP.md](SETUP.md)
- Resumen ejecutivo: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## Qué resuelve esta API

- Gestión de períodos mensuales con endpoint de período actual (auto-creable).
- CRUD de gastos con filtros por período, categoría y rango de fechas.
- CRUD de ahorros con filtros por período y moneda.
- Presupuestos por categoría/período con comportamiento de upsert en creación.
- Reporte consolidado por período y comparativa contra período anterior.
- Validación de payloads con Zod y manejo centralizado de errores.

## Stack

- Runtime: Cloudflare Workers
- Framework HTTP: Hono 4+
- Lenguaje: TypeScript (strict)
- Base de datos: Cloudflare D1 (SQLite serverless)
- Tooling: Wrangler

## Requisitos

- Node.js 20+
- npm
- Cuenta Cloudflare con D1 habilitado
- Wrangler autenticado (npx wrangler login)

## Inicio rápido

1. Instalar dependencias:

```bash
npm install
```

2. Crear base de datos D1 (si todavía no existe):

```bash
npx wrangler d1 create misfinanzas-db
```

3. Ejecutar schema:

```bash
npx wrangler d1 execute misfinanzas-db --file=src/db/schema.sql
```

4. Levantar API en local:

```bash
npm run dev
```

5. Verificar health:

```bash
curl -X GET http://127.0.0.1:8787/health
```

## Scripts

- npm run dev: ejecuta Worker local.
- npm run typecheck: valida TypeScript sin emitir archivos.
- npm run deploy: despliega a Cloudflare.
- npm run cf-typegen: regenera tipos de bindings de Worker.

## Entornos y D1

La configuración de bindings está en [wrangler.toml](wrangler.toml) y contempla:

- Producción (default): misfinanzas-db
- Preview: misfinanzas-db-preview
- Local: misfinanzas-db-local

Comandos útiles:

```bash
# Ejecutar API en entorno local definido en wrangler.toml
npx wrangler dev --env local

# Ejecutar API en entorno por defecto
npm run dev

# Deploy a producción
npm run deploy
```

## Base de datos

- Schema principal: [src/db/schema.sql](src/db/schema.sql)
- Seed de pruebas: [src/db/seed.sql](src/db/seed.sql)

### Modelo de datos

- categorias: catálogo de categorías de gasto.
- periodos: período mensual (mes + año único).
- gastos: movimientos de egreso.
- ahorros: movimientos de ahorro en ARS/USD.
- presupuestos: límites por categoría y período.

Índices principales:

- gastos: periodo_id, categoria_id, fecha
- ahorros: periodo_id, moneda

### Datos iniciales

El schema inserta 8 categorías por defecto con INSERT OR IGNORE:

- Alimentación
- Transporte
- Salud
- Entretenimiento
- Servicios
- Indumentaria
- Educación
- Otros

### Cargar datos de ejemplo

El script [src/db/seed.sql](src/db/seed.sql) limpia e inserta periodos, gastos, ahorros y presupuestos de prueba.

```bash
# En remoto (Cloudflare)
npx wrangler d1 execute misfinanzas-db --file=src/db/seed.sql --remote

# En entorno local de wrangler
npx wrangler d1 execute misfinanzas-db-local --file=src/db/seed.sql
```

## Convenciones de API

- Respuesta exitosa estándar: { data: ... }
- Excepción: endpoints de resumen responden objeto directo.
- Respuesta de error: { error: string, details?: any }
- Códigos frecuentes: 200, 201, 204, 400, 404, 409, 422, 500

## Endpoints

### Health

- GET /health

### Categorías

- GET /categorias

### Períodos

- GET /periodos
- GET /periodos/actual
- GET /periodos/:id
- POST /periodos
- PATCH /periodos/:id

### Gastos

- GET /gastos?periodo_id=&categoria_id=&fecha_desde=&fecha_hasta=
- GET /gastos/:id
- POST /gastos
- PUT /gastos/:id
- PATCH /gastos/:id
- DELETE /gastos/:id

### Ahorros

- GET /ahorros?periodo_id=&moneda=
- GET /ahorros/:id
- POST /ahorros
- PATCH /ahorros/:id
- DELETE /ahorros/:id

### Presupuestos

- GET /presupuestos?periodo_id=
- POST /presupuestos
- PATCH /presupuestos/:id
- DELETE /presupuestos/:id

### Resumen

- GET /resumen/:periodo_id
- GET /resumen/:periodo_id/comparativa

## Ejemplos de uso (curl)

### Crear período

```bash
curl -X POST http://127.0.0.1:8787/periodos \
  -H "Content-Type: application/json" \
  -d '{
    "mes": 6,
    "anio": 2026,
    "dinero_inicial": 350000,
    "tipo_cambio_usd": 1150
  }'
```

### Crear gasto

```bash
curl -X POST http://127.0.0.1:8787/gastos \
  -H "Content-Type: application/json" \
  -d '{
    "periodo_id": 1,
    "categoria_id": 1,
    "descripcion": "Supermercado",
    "monto": 24500,
    "fecha": "2026-06-12",
    "nota": "Compra semanal"
  }'
```

### Listar gastos con filtros

```bash
curl -X GET "http://127.0.0.1:8787/gastos?periodo_id=1&fecha_desde=2026-06-01&fecha_hasta=2026-06-30"
```

### Crear ahorro

```bash
curl -X POST http://127.0.0.1:8787/ahorros \
  -H "Content-Type: application/json" \
  -d '{
    "periodo_id": 1,
    "descripcion": "Fondo emergencia",
    "monto": 50000,
    "moneda": "ARS",
    "origen": "Transferencia",
    "fecha": "2026-06-15"
  }'
```

### Crear o reemplazar presupuesto

```bash
curl -X POST http://127.0.0.1:8787/presupuestos \
  -H "Content-Type: application/json" \
  -d '{
    "periodo_id": 1,
    "categoria_id": 1,
    "monto_limite": 120000
  }'
```

### Obtener resumen

```bash
curl -X GET http://127.0.0.1:8787/resumen/1
```

### Obtener comparativa

```bash
curl -X GET http://127.0.0.1:8787/resumen/1/comparativa
```

## Estructura técnica

```txt
src/
  index.ts                  # bootstrap de Hono y registro de rutas
  db/
    schema.sql              # schema e inserción inicial de categorías
    seed.sql                # dataset de prueba
  routes/                   # capa HTTP (parámetros, status, contrato)
  services/                 # lógica de negocio y SQL
  schemas/                  # validación Zod
  middlewares/              # validación y error handling
  types/                    # contratos de tipos compartidos
```

## Flujo recomendado para desarrollo

1. Levantar API con npm run dev.
2. Probar endpoints críticos (health, periodos, gastos, resumen).
3. Validar casos de error (422, 404, 409).
4. Ejecutar npm run typecheck antes de abrir PR.
