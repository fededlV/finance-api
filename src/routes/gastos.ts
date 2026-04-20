import { Hono } from 'hono';
import { AppError } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createGastoSchema, patchGastoSchema, putGastoSchema } from '../schemas/gasto.schema';
import {
  createGasto,
  deleteGasto,
  getGastoById,
  listGastos,
  patchGasto,
  replaceGasto,
} from '../services/gastos.service';
import type { CreateGastoInput, PatchGastoInput, PutGastoInput } from '../schemas/gasto.schema';
import type { AppVariables, Env } from '../types/env';

const parsePositiveInt = (value: string, field: string): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} invalido.`, 400);
  }

  return parsed;
};

const parseOptionalPositiveInt = (value: string | undefined, field: string): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} invalido.`, 400);
  }

  return parsed;
};

export const gastosRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

gastosRoutes.get('/', async (c) => {
  const periodoId = parseOptionalPositiveInt(c.req.query('periodo_id'), 'periodo_id');
  const categoriaId = parseOptionalPositiveInt(c.req.query('categoria_id'), 'categoria_id');

  const data = await listGastos(c.env.DB, {
    periodo_id: periodoId,
    categoria_id: categoriaId,
    fecha_desde: c.req.query('fecha_desde') ?? undefined,
    fecha_hasta: c.req.query('fecha_hasta') ?? undefined,
  });

  return c.json({ data }, 200);
});

gastosRoutes.get('/:id', async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const data = await getGastoById(c.env.DB, id);
  return c.json({ data }, 200);
});

gastosRoutes.post('/', validateBody(createGastoSchema), async (c) => {
  const body = c.get('validatedBody') as CreateGastoInput;
  const data = await createGasto(c.env.DB, body);
  return c.json({ data }, 201);
});

gastosRoutes.put('/:id', validateBody(putGastoSchema), async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const body = c.get('validatedBody') as PutGastoInput;
  const data = await replaceGasto(c.env.DB, id, body);
  return c.json({ data }, 200);
});

gastosRoutes.patch('/:id', validateBody(patchGastoSchema), async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const body = c.get('validatedBody') as PatchGastoInput;
  const data = await patchGasto(c.env.DB, id, body);
  return c.json({ data }, 200);
});

gastosRoutes.delete('/:id', async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  await deleteGasto(c.env.DB, id);
  return c.body(null, 204);
});
