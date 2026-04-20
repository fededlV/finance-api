# MisFinanzas API

Backend serverless de la aplicación mobile MisFinanzas para gestionar gastos, ahorros y presupuestos mensuales, con reportes de resumen y comparativas entre períodos.

Documentación complementaria:

- Inicio rápido: [QUICKSTART.md](QUICKSTART.md)
- Setup detallado: [SETUP.md](SETUP.md)
- Resumen ejecutivo: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## Características

- API REST con Hono y TypeScript estricto.
- Gestión de períodos mensuales (incluye endpoint de período actual auto-creable).
- CRUD de gastos con filtros por período, categoría y rango de fechas.
- CRUD de ahorros con filtros por período y moneda.
- Gestión de presupuestos por categoría/período (upsert lógico).
- Resumen mensual consolidado con totales y distribución por categoría.
- Comparativa mensual contra período anterior.
- Validación de bodies con Zod.
- Manejo global de errores con formato homogéneo.

## Stack tecnológico

- Runtime: Cloudflare Workers
- Framework: Hono 4+
- Lenguaje: TypeScript (strict)
- Base de datos: Cloudflare D1 (SQLite serverless)
- Deploy y desarrollo local: Wrangler
- Validación: Zod

## Estructura del proyecto

```txt
.
├── README.md
├── QUICKSTART.md
├── SETUP.md
├── PROJECT_SUMMARY.md
├── package.json
├── tsconfig.json
├── wrangler.toml
└── src
		├── index.ts
		├── db
		│   └── schema.sql
		├── routes
		│   ├── categorias.ts
		│   ├── periodos.ts
		│   ├── gastos.ts
		│   ├── ahorros.ts
		│   ├── presupuestos.ts
		│   └── resumen.ts
		├── services
		│   ├── categorias.service.ts
		│   ├── periodos.service.ts
		│   ├── gastos.service.ts
		│   ├── ahorros.service.ts
		│   ├── presupuestos.service.ts
		│   └── resumen.service.ts
		├── middlewares
		│   ├── error.middleware.ts
		│   └── validate.middleware.ts
		├── schemas
		│   ├── gasto.schema.ts
		│   ├── ahorro.schema.ts
		│   ├── periodo.schema.ts
		│   └── presupuesto.schema.ts
		└── types
				├── env.d.ts
				└── models.ts
```

## Configuración inicial

### 1) Instalar dependencias

```bash
npm install
```

### 2) Crear base D1

```bash
npx wrangler d1 create misfinanzas-db
```

### 3) Ejecutar schema

```bash
npx wrangler d1 execute misfinanzas-db --file=src/db/schema.sql
```

### 4) Completar IDs en wrangler.toml

Reemplazar los placeholders en [wrangler.toml](wrangler.toml):

- REPLACE_WITH_PROD_DB_ID
- REPLACE_WITH_PREVIEW_DB_ID
- REPLACE_WITH_LOCAL_DB_ID

### 5) Levantar en local

```bash
npm run dev
```

## API Endpoints

### Health

- GET /health

### Categorías

- GET /categorias

### Períodos

- GET /periodos
- GET /periodos/:id
- GET /periodos/actual
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

## Ejemplos curl

### Health

```bash
curl -X GET http://127.0.0.1:8787/health
```

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

### Listar gastos filtrados

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

### Resumen mensual

```bash
curl -X GET http://127.0.0.1:8787/resumen/1
```

### Comparativa con período anterior

```bash
curl -X GET http://127.0.0.1:8787/resumen/1/comparativa
```

## Base de datos

El schema está en [src/db/schema.sql](src/db/schema.sql).

### Tabla categorias

- id: INTEGER PK AUTOINCREMENT
- nombre: TEXT UNIQUE NOT NULL
- icono: TEXT NOT NULL
- color: TEXT NOT NULL

### Tabla periodos

- id: INTEGER PK AUTOINCREMENT
- mes: INTEGER NOT NULL
- anio: INTEGER NOT NULL
- dinero_inicial: REAL NOT NULL DEFAULT 0
- tipo_cambio_usd: REAL NULL
- creado_en: TEXT NOT NULL DEFAULT datetime('now')
- Restricción UNIQUE(mes, anio)

### Tabla gastos

- id: INTEGER PK AUTOINCREMENT
- periodo_id: INTEGER FK -> periodos(id) ON DELETE CASCADE
- categoria_id: INTEGER FK -> categorias(id)
- descripcion: TEXT NOT NULL
- monto: REAL NOT NULL CHECK(monto > 0)
- fecha: TEXT NOT NULL
- nota: TEXT NULL
- creado_en: TEXT NOT NULL DEFAULT datetime('now')
- modificado_en: TEXT NULL

Índices:

- idx_gastos_periodo
- idx_gastos_categoria
- idx_gastos_fecha

### Tabla ahorros

- id: INTEGER PK AUTOINCREMENT
- periodo_id: INTEGER FK -> periodos(id) ON DELETE CASCADE
- descripcion: TEXT NOT NULL
- monto: REAL NOT NULL CHECK(monto > 0)
- moneda: TEXT NOT NULL DEFAULT 'ARS' CHECK(moneda IN ('ARS', 'USD'))
- origen: TEXT NULL
- fecha: TEXT NOT NULL
- nota: TEXT NULL
- creado_en: TEXT NOT NULL DEFAULT datetime('now')

Índices:

- idx_ahorros_periodo
- idx_ahorros_moneda

### Tabla presupuestos

- id: INTEGER PK AUTOINCREMENT
- periodo_id: INTEGER FK -> periodos(id) ON DELETE CASCADE
- categoria_id: INTEGER FK -> categorias(id)
- monto_limite: REAL NOT NULL CHECK(monto_limite > 0)
- Restricción UNIQUE(periodo_id, categoria_id)

### Seed inicial

Se insertan 8 categorías por defecto (si no existen):

- Alimentación
- Transporte
- Salud
- Entretenimiento
- Servicios
- Indumentaria
- Educación
- Otros

## Estado y respuestas

- Respuestas exitosas de recursos y colecciones: `{ data: ... }`
- Endpoints de resumen: objeto directo
- Errores: `{ error: string, details?: any }`
- Códigos usados: 200, 201, 204, 400, 404, 409, 422, 500
