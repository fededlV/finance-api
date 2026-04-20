# MisFinanzas API - Project Summary

## Objetivo

Backend serverless para la app mobile MisFinanzas, orientado a gestionar periodos mensuales, gastos, ahorros, presupuestos y reportes comparativos.

## Alcance funcional

- Gestión de categorías de gasto.
- Gestión de períodos por mes/año.
- CRUD de gastos con filtros.
- CRUD de ahorros con filtros.
- Gestión de presupuestos por categoría y período.
- Resumen consolidado mensual.
- Comparativa con período anterior.

## Arquitectura

- Rutas HTTP separadas por recurso en [src/routes](src/routes).
- Lógica de negocio y SQL en [src/services](src/services).
- Validación Zod en [src/schemas](src/schemas).
- Manejo global de errores en [src/middlewares/error.middleware.ts](src/middlewares/error.middleware.ts).
- Middleware reutilizable para body validation en [src/middlewares/validate.middleware.ts](src/middlewares/validate.middleware.ts).

## Stack tecnológico

- Runtime: Cloudflare Workers
- Framework HTTP: Hono 4+
- Lenguaje: TypeScript estricto
- Base de datos: Cloudflare D1 (SQLite serverless)
- Configuración deploy: Wrangler

## Contratos API

- Respuestas exitosas estándar: `{ data: ... }`
- Excepción: endpoints de resumen devuelven objeto directo por complejidad.
- Respuestas de error: `{ error: string, details?: any }`

## Estado actual

- Proyecto inicializado y estructurado.
- Schema D1 implementado en [src/db/schema.sql](src/db/schema.sql).
- Endpoints principales implementados y enroutados en [src/index.ts](src/index.ts).
- TypeScript en modo estricto configurado.
