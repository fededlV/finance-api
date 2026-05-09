# MisFinanzas API - Contexto del Proyecto

## Resumen del Proyecto
MisFinanzas API es el backend serverless para la aplicación móvil MisFinanzas. Está construido sobre **Cloudflare Workers** utilizando el framework **Hono 4+** y **TypeScript**. La persistencia de datos se realiza en **Cloudflare D1** (SQLite).

### Tecnologías Principales
- **Runtime**: Cloudflare Workers
- **Framework HTTP**: Hono
- **Base de Datos**: Cloudflare D1 (SQLite)
- **Validación**: Zod
- **Lenguaje**: TypeScript (Strict Mode)

## Arquitectura y Estructura
El proyecto sigue una estructura modular para separar responsabilidades:

- `src/index.ts`: Punto de entrada, configuración de Hono y registro de rutas.
- `src/routes/`: Definición de endpoints y manejo de parámetros HTTP.
- `src/services/`: Lógica de negocio y consultas SQL a D1.
- `src/schemas/`: Esquemas de validación Zod para payloads de entrada.
- `src/db/`: Definición del schema SQL (`schema.sql`) y datos de prueba (`seed.sql`).
- `src/middlewares/`: Manejo global de errores y validación de esquemas.

## Convenciones de Desarrollo
- **Manejo de Moneda (IMPORTANTE)**: Al igual que en la App, todos los montos monetarios (`monto`, `dinero_inicial`, `monto_limite`) se almacenan como **enteros representando centavos** (valor real * 100). Aunque el schema use `REAL`, se espera recibir y enviar valores multiplicados por 100 para evitar errores de punto flotante.
- **Contratos de Respuesta**:
  - Éxito estándar: `{ "data": ... }`
  - Errores: `{ "error": "Mensaje de error", "details": ... }`
  - Excepción: Los endpoints de `/resumen` devuelven el objeto directo por su complejidad.
- **Tipado**: Uso estricto de interfaces definidas en `src/types/models.ts`.

## Comandos Clave (Scripts de npm)
- `npm run dev`: Inicia el servidor de desarrollo local con Wrangler.
- `npm run typecheck`: Ejecuta el compilador de TypeScript para validar tipos.
- `npm run deploy`: Despliega el worker a la infraestructura de Cloudflare.
- `npm run cf-typegen`: Genera los tipos de TypeScript para los bindings de D1 y otras variables de entorno.

## Configuración de Base de Datos (D1)
Para inicializar o actualizar la base de datos local de desarrollo:
1. `npx wrangler d1 execute misfinanzas-db-local --file=src/db/schema.sql` (Crea tablas)
2. `npx wrangler d1 execute misfinanzas-db-local --file=src/db/seed.sql` (Opcional: carga datos de prueba)

## Pendientes / Roadmap
- [ ] Implementar autenticación (JWT o Cloudflare Access).
- [ ] Agregar soporte para múltiples cuentas/usuarios.
- [ ] Implementar exportación de datos a CSV/JSON.
