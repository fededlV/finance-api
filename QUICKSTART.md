# MisFinanzas API - Quickstart

Esta guía te permite levantar la API en pocos minutos.

## Requisitos

- Node.js 20+
- npm
- Cuenta de Cloudflare
- Wrangler autenticado

## 1) Instalar dependencias

```bash
npm install
```

## 2) Completar D1 en wrangler.toml

Editar los placeholders en [wrangler.toml](wrangler.toml):

- REPLACE_WITH_PROD_DB_ID
- REPLACE_WITH_PREVIEW_DB_ID
- REPLACE_WITH_LOCAL_DB_ID

## 3) Crear base D1 y ejecutar schema

```bash
npx wrangler d1 create misfinanzas-db
npx wrangler d1 execute misfinanzas-db --file=src/db/schema.sql
```

Opcional preview:

```bash
npx wrangler d1 create misfinanzas-db-preview
npx wrangler d1 execute misfinanzas-db-preview --file=src/db/schema.sql
```

## 4) Levantar en desarrollo

```bash
npm run dev
```

## 5) Verificar salud

```bash
curl -X GET http://127.0.0.1:8787/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "timestamp": "2026-04-20T12:00:00.000Z"
}
```

## 6) Validar tipado

```bash
npm run typecheck
```

## Documentación completa

- Setup detallado: [SETUP.md](SETUP.md)
- Resumen del proyecto: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- Guía principal (endpoints, curl, tablas): [README.md](README.md)
