# MisFinanzas API - Setup

Guía completa de configuración para desarrollo y despliegue en Cloudflare Workers con D1.

## Requisitos del entorno

- Node.js 20 o superior
- npm
- Wrangler CLI (se instala como dependencia dev del proyecto)
- Cuenta de Cloudflare con acceso a D1

## Instalación

```bash
npm install
```

## Configuración de Cloudflare

### 1) Login en Cloudflare

```bash
npx wrangler login
```

### 2) Crear bases D1

Producción:

```bash
npx wrangler d1 create misfinanzas-db
```

Preview:

```bash
npx wrangler d1 create misfinanzas-db-preview
```

Local dedicada (opcional):

```bash
npx wrangler d1 create misfinanzas-db-local
```

### 3) Actualizar binding DB

Completar IDs en [wrangler.toml](wrangler.toml) usando los valores devueltos por `wrangler d1 create`.

## Cargar schema

Producción:

```bash
npx wrangler d1 execute misfinanzas-db --file=src/db/schema.sql
```

Preview:

```bash
npx wrangler d1 execute misfinanzas-db-preview --file=src/db/schema.sql
```

Local (si aplica):

```bash
npx wrangler d1 execute misfinanzas-db-local --file=src/db/schema.sql
```

## Scripts del proyecto

- `npm run dev`: ejecuta Worker en local.
- `npm run typecheck`: verifica TypeScript en modo estricto.
- `npm run deploy`: despliegue a Cloudflare.
- `npm run cf-typegen`: genera tipos de bindings.

## Flujo recomendado de desarrollo

1. Ejecutar `npm run typecheck` antes de abrir PR.
2. Ejecutar `npm run dev` y validar endpoints críticos.
3. Probar casos de error 422, 404 y 409 con payloads inválidos o duplicados.

## Estructura técnica clave

- Entrada: [src/index.ts](src/index.ts)
- Schema SQL: [src/db/schema.sql](src/db/schema.sql)
- Rutas: [src/routes](src/routes)
- Servicios SQL: [src/services](src/services)
- Validación: [src/schemas](src/schemas)
- Middlewares: [src/middlewares](src/middlewares)
- Tipos: [src/types](src/types)

## Verificación rápida post-setup

```bash
curl -X GET http://127.0.0.1:8787/health
```

Si responde `status: ok`, la API está operativa.
