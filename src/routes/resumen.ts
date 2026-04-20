import { Hono } from 'hono';
import { AppError } from '../middlewares/error.middleware';
import { getComparativaPeriodo, getResumenPeriodo } from '../services/resumen.service';
import type { AppVariables, Env } from '../types/env';

const parsePositiveInt = (value: string, field: string): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} invalido.`, 400);
  }

  return parsed;
};

export const resumenRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

resumenRoutes.get('/:periodo_id', async (c) => {
  const periodoId = parsePositiveInt(c.req.param('periodo_id'), 'periodo_id');
  const data = await getResumenPeriodo(c.env.DB, periodoId);
  return c.json(data, 200);
});

resumenRoutes.get('/:periodo_id/comparativa', async (c) => {
  const periodoId = parsePositiveInt(c.req.param('periodo_id'), 'periodo_id');
  const data = await getComparativaPeriodo(c.env.DB, periodoId);
  return c.json(data, 200);
});
