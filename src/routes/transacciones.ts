import { Hono } from 'hono';
import { AppError } from '../middlewares/error.middleware';
import { getExportData } from '../services/resumen.service';
import * as XLSX from 'xlsx';
import type { AppVariables, Env } from '../types/env';

const parsePositiveInt = (value: string, field: string): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} invalido.`, 400);
  }

  return parsed;
};

export const transaccionesRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

transaccionesRoutes.get('/exportar', async (c) => {
  const queryVal = c.req.query('periodo_id');
  if (!queryVal) {
    throw new AppError('periodo_id es requerido.', 400);
  }
  const periodoId = parsePositiveInt(queryVal, 'periodo_id');

  const { gastos, ingresos, ahorros } = await getExportData(c.env.financeDB, periodoId);

  const formatMonto = (montoCents: number, moneda: string = 'ARS'): string => {
    const value = montoCents / 100;
    if (moneda === 'USD') {
      return `U$S ${value.toFixed(2)}`;
    }
    return `$ ${value.toFixed(2)}`;
  };

  const wb = XLSX.utils.book_new();

  const wsGastos = XLSX.utils.json_to_sheet(
    gastos.map((g) => ({
      'Fecha': g.fecha,
      'Descripción': g.descripcion,
      'Monto Formateado': formatMonto(g.monto),
      'Nota/Origen': g.nota || '',
    })),
    { header: ['Fecha', 'Descripción', 'Monto Formateado', 'Nota/Origen'] }
  );
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos');

  const wsIngresos = XLSX.utils.json_to_sheet(
    ingresos.map((i) => ({
      'Fecha': i.fecha,
      'Descripción': i.descripcion,
      'Monto Formateado': formatMonto(i.monto),
      'Nota/Origen': i.nota || '',
    })),
    { header: ['Fecha', 'Descripción', 'Monto Formateado', 'Nota/Origen'] }
  );
  XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos');

  const wsAhorros = XLSX.utils.json_to_sheet(
    ahorros.map((a) => {
      let notaOrigen = '';
      if (a.origen && a.nota) {
        notaOrigen = `${a.origen} - ${a.nota}`;
      } else if (a.origen) {
        notaOrigen = a.origen;
      } else if (a.nota) {
        notaOrigen = a.nota;
      }
      return {
        'Fecha': a.fecha,
        'Descripción': a.descripcion,
        'Monto Formateado': formatMonto(a.monto, a.moneda),
        'Nota/Origen': notaOrigen,
      };
    }),
    { header: ['Fecha', 'Descripción', 'Monto Formateado', 'Nota/Origen'] }
  );
  XLSX.utils.book_append_sheet(wb, wsAhorros, 'Ahorros');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  return c.body(excelBuffer as any, 200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename=Resumen_Periodo_${periodoId}.xlsx`,
  });
});
