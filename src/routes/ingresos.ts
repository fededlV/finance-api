import { Hono } from 'hono';
import { AppError } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createIngresoSchema, patchIngresoSchema } from '../schemas/ingreso.schema';
import {
  createIngreso,
  deleteIngreso,
  getIngresoById,
  listIngresos,
  patchIngreso,
} from '../services/ingresos.service';
import type { CreateIngresoInput, PatchIngresoInput } from '../schemas/ingreso.schema';
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

export const ingresosRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

ingresosRoutes.get('/', async (c) => {
  const periodoId = parseOptionalPositiveInt(c.req.query('periodo_id'), 'periodo_id');

  const data = await listIngresos(c.env.financeDB, {
    periodo_id: periodoId,
  });

  return c.json({ data }, 200);
});

ingresosRoutes.get('/:id', async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const data = await getIngresoById(c.env.financeDB, id);
  return c.json({ data }, 200);
});

ingresosRoutes.post('/', validateBody(createIngresoSchema), async (c) => {
  const body = c.get('validatedBody') as CreateIngresoInput;
  const data = await createIngreso(c.env.financeDB, body);
  return c.json({ data }, 201);
});

ingresosRoutes.patch('/:id', validateBody(patchIngresoSchema), async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const body = c.get('validatedBody') as PatchIngresoInput;
  const data = await patchIngreso(c.env.financeDB, id, body);
  return c.json({ data }, 200);
});

ingresosRoutes.delete('/:id', async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  await deleteIngreso(c.env.financeDB, id);
  return c.body(null, 204);
});
