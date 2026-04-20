import { Hono } from 'hono';
import { listCategorias } from '../services/categorias.service';
import type { AppVariables, Env } from '../types/env';

export const categoriasRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

categoriasRoutes.get('/', async (c) => {
  const data = await listCategorias(c.env.DB);
  return c.json({ data }, 200);
});
