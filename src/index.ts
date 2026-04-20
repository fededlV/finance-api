import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { errorHandler } from './middlewares/error.middleware';
import { ahorrosRoutes } from './routes/ahorros';
import { categoriasRoutes } from './routes/categorias';
import { gastosRoutes } from './routes/gastos';
import { periodosRoutes } from './routes/periodos';
import { presupuestosRoutes } from './routes/presupuestos';
import { resumenRoutes } from './routes/resumen';
import type { AppVariables, Env } from './types/env';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', cors({ origin: '*' }));

app.get('/health', (c) => {
  return c.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    200,
  );
});

app.route('/categorias', categoriasRoutes);
app.route('/periodos', periodosRoutes);
app.route('/gastos', gastosRoutes);
app.route('/ahorros', ahorrosRoutes);
app.route('/presupuestos', presupuestosRoutes);
app.route('/resumen', resumenRoutes);

app.notFound((c) => {
  return c.json({ error: 'Ruta no encontrada.' }, 404);
});

app.onError(errorHandler);

export default app;
