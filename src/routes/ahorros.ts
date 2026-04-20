import { Hono } from 'hono';
import { AppError } from '../middlewares/error.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createAhorroSchema, patchAhorroSchema } from '../schemas/ahorro.schema';
import { createAhorro, deleteAhorro, getAhorroById, listAhorros, patchAhorro } from '../services/ahorros.service';
import type { CreateAhorroInput, PatchAhorroInput } from '../schemas/ahorro.schema';
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

const parseMoneda = (value: string | undefined): 'ARS' | 'USD' | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value !== 'ARS' && value !== 'USD') {
    throw new AppError('moneda invalida.', 400);
  }

  return value;
};

export const ahorrosRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

ahorrosRoutes.get('/', async (c) => {
  const periodoId = parseOptionalPositiveInt(c.req.query('periodo_id'), 'periodo_id');
  const moneda = parseMoneda(c.req.query('moneda'));

  const data = await listAhorros(c.env.DB, {
    periodo_id: periodoId,
    moneda,
  });

  return c.json({ data }, 200);
});

ahorrosRoutes.get('/:id', async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const data = await getAhorroById(c.env.DB, id);
  return c.json({ data }, 200);
});

ahorrosRoutes.post('/', validateBody(createAhorroSchema), async (c) => {
  const body = c.get('validatedBody') as CreateAhorroInput;
  const data = await createAhorro(c.env.DB, body);
  return c.json({ data }, 201);
});

ahorrosRoutes.patch('/:id', validateBody(patchAhorroSchema), async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  const body = c.get('validatedBody') as PatchAhorroInput;
  const data = await patchAhorro(c.env.DB, id, body);
  return c.json({ data }, 200);
});

ahorrosRoutes.delete('/:id', async (c) => {
  const id = parsePositiveInt(c.req.param('id'), 'id');
  await deleteAhorro(c.env.DB, id);
  return c.body(null, 204);
});
