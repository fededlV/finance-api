import { Hono } from 'hono';
import { AppError } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createPeriodoSchema, patchPeriodoSchema } from '../schemas/periodo.schema';
import { createPeriodo, getOrCreatePeriodoActual, getPeriodoById, listPeriodos, patchPeriodo } from '../services/periodos.service';
import type { CreatePeriodoInput, PatchPeriodoInput } from '../schemas/periodo.schema';
import type { AppVariables, Env } from '../types/env';

const parsePositiveInt = (value: string, field: string): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} invalido.`, 400);
  }

  return parsed;
};

export const periodosRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

periodosRoutes.get('/', async (c) => {
  const data = await listPeriodos(c.env.financeDB);
  return c.json({ data }, 200);
});
periodosRoutes.get('/actual', async (c) => {
  const fallbackPeriodo = {
    id: 0,
    mes: new Date().getUTCMonth() + 1,
    anio: new Date().getUTCFullYear(),
    dinero_inicial: 0,
    tipo_cambio_usd: null,
    creado_en: new Date().toISOString(),
  };

  if (!c.env.financeDB) {
    return c.json({ data: fallbackPeriodo }, 200);
  }
  try {
    const data = await getOrCreatePeriodoActual(c.env.financeDB);
    if (!data) {
      return c.json({ data: fallbackPeriodo }, 200);
    }
    return c.json({ data }, 200);
  } catch (error: unknown) {
    return c.json({ data: fallbackPeriodo }, 200);
  }
});

periodosRoutes.get('/:id', async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const data = await getPeriodoById(c.env.financeDB, id);
  return c.json({ data }, 200);
});

periodosRoutes.post('/', validateBody(createPeriodoSchema), async (c) => {
  const body = c.get('validatedBody') as CreatePeriodoInput;
  const data = await createPeriodo(c.env.financeDB, body);
  return c.json({ data }, 201);
});

periodosRoutes.patch('/:id', validateBody(patchPeriodoSchema), async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const body = c.get('validatedBody') as PatchPeriodoInput;
  const data = await patchPeriodo(c.env.financeDB, id, body);
  return c.json({ data }, 200);
});
