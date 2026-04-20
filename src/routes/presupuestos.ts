import { Hono } from 'hono';
import { AppError } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createPresupuestoSchema, patchPresupuestoSchema } from '../schemas/presupuesto.schema';
import {
  createOrReplacePresupuesto,
  deletePresupuesto,
  listPresupuestos,
  patchPresupuesto,
} from '../services/presupuestos.service';
import type { CreatePresupuestoInput, PatchPresupuestoInput } from '../schemas/presupuesto.schema';
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

  return parsePositiveInt(value, field);
};

export const presupuestosRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

presupuestosRoutes.get('/', async (c) => {
  const periodoId = parseOptionalPositiveInt(c.req.query('periodo_id'), 'periodo_id');
  const data = await listPresupuestos(c.env.DB, periodoId);
  return c.json({ data }, 200);
});

presupuestosRoutes.post('/', validateBody(createPresupuestoSchema), async (c) => {
  const body = c.get('validatedBody') as CreatePresupuestoInput;
  const data = await createOrReplacePresupuesto(c.env.DB, body);
  return c.json({ data }, 201);
});

presupuestosRoutes.patch('/:id', validateBody(patchPresupuestoSchema), async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const body = c.get('validatedBody') as PatchPresupuestoInput;
  const data = await patchPresupuesto(c.env.DB, id, body);
  return c.json({ data }, 200);
});

presupuestosRoutes.delete('/:id', async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  await deletePresupuesto(c.env.DB, id);
  return c.body(null, 204);
});
