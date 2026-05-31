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
  try {
    const data = await getResumenPeriodo(c.env.financeDB, periodoId);
    if (!data) {
      throw new Error('Empty dataset');
    }
    return c.json(data, 200);
  } catch (error: unknown) {
    const fallbackResumen = {
      periodo: {
        id: periodoId,
        mes: new Date().getUTCMonth() + 1,
        anio: new Date().getUTCFullYear(),
        dinero_inicial: 0,
        tipo_cambio_usd: null,
        creado_en: new Date().toISOString()
      },
      total_ingresado: 0,
      total_gastado: 0,
      total_ahorrado_ars: 0,
      total_ahorrado_usd: 0,
      saldo_disponible: 0,
      porcentaje_ahorro: 0,
      gastos_por_categoria: [],
      presupuestos_estado: []
    };
    return c.json(fallbackResumen, 200);
  }
});

resumenRoutes.get('/:periodo_id/comparativa', async (c) => {
  const periodoId = parsePositiveInt(c.req.param('periodo_id'), 'periodo_id');
  const data = await getComparativaPeriodo(c.env.financeDB, periodoId);
  return c.json(data, 200);
});
