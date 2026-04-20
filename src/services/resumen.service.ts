import { AppError } from '../middlewares/error.middleware';
import type {
  ComparativaItem,
  ComparativaResumen,
  GastoPorCategoria,
  Periodo,
  PresupuestoEstado,
  ResumenPeriodo,
} from '../types/models';

interface AggregateRow {
  total: number | null;
}

const toNumber = (value: number | null | undefined): number => {
  return typeof value === 'number' ? value : 0;
};

const round2 = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const calcPercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return round2(((current - previous) / previous) * 100);
};

const getPeriodById = async (db: D1Database, id: number): Promise<Periodo> => {
  const period = await db
    .prepare(
      `SELECT id, mes, anio, dinero_inicial, tipo_cambio_usd, creado_en
       FROM periodos
       WHERE id = ?`,
    )
    .bind(id)
    .first<Periodo>();

  if (!period) {
    throw new AppError('Periodo no encontrado.', 404);
  }

  return period;
};

const getTotalsForPeriod = async (
  db: D1Database,
  periodoId: number,
): Promise<{ total_gastado: number; total_ahorrado_ars: number }> => {
  const [spentResult, savedArsResult] = await db.batch([
    db.prepare('SELECT COALESCE(SUM(monto), 0) AS total FROM gastos WHERE periodo_id = ?').bind(periodoId),
    db
      .prepare("SELECT COALESCE(SUM(monto), 0) AS total FROM ahorros WHERE periodo_id = ? AND moneda = 'ARS'")
      .bind(periodoId),
  ]);

  const spentRow = (spentResult as D1Result<AggregateRow>).results[0];
  const savedArsRow = (savedArsResult as D1Result<AggregateRow>).results[0];

  return {
    total_gastado: toNumber(spentRow?.total),
    total_ahorrado_ars: toNumber(savedArsRow?.total),
  };
};

export const getResumenPeriodo = async (db: D1Database, periodoId: number): Promise<ResumenPeriodo> => {
  const periodo = await getPeriodById(db, periodoId);

  const [
    gastosTotalResult,
    ahorroArsTotalResult,
    ahorroUsdTotalResult,
    gastosCategoriaResult,
    presupuestosEstadoResult,
  ] = await db.batch([
    db.prepare('SELECT COALESCE(SUM(monto), 0) AS total FROM gastos WHERE periodo_id = ?').bind(periodoId),
    db
      .prepare("SELECT COALESCE(SUM(monto), 0) AS total FROM ahorros WHERE periodo_id = ? AND moneda = 'ARS'")
      .bind(periodoId),
    db
      .prepare("SELECT COALESCE(SUM(monto), 0) AS total FROM ahorros WHERE periodo_id = ? AND moneda = 'USD'")
      .bind(periodoId),
    db
      .prepare(
        `SELECT c.id AS categoria_id, c.nombre AS nombre, COALESCE(SUM(g.monto), 0) AS total
         FROM categorias c
         LEFT JOIN gastos g ON g.categoria_id = c.id AND g.periodo_id = ?
         GROUP BY c.id, c.nombre
         ORDER BY total DESC`,
      )
      .bind(periodoId),
    db
      .prepare(
        `SELECT p.categoria_id AS categoria_id,
                p.monto_limite AS limite,
                COALESCE(SUM(g.monto), 0) AS gastado
         FROM presupuestos p
         LEFT JOIN gastos g ON g.categoria_id = p.categoria_id AND g.periodo_id = p.periodo_id
         WHERE p.periodo_id = ?
         GROUP BY p.id, p.categoria_id, p.monto_limite
         ORDER BY p.id DESC`,
      )
      .bind(periodoId),
  ]);

  const totalGastado =
    toNumber(((gastosTotalResult as D1Result<AggregateRow>).results[0] as AggregateRow | undefined)?.total) || 0;
  const totalAhorradoArs =
    toNumber(((ahorroArsTotalResult as D1Result<AggregateRow>).results[0] as AggregateRow | undefined)?.total) || 0;
  const totalAhorradoUsd =
    toNumber(((ahorroUsdTotalResult as D1Result<AggregateRow>).results[0] as AggregateRow | undefined)?.total) || 0;

  const gastosRows = (gastosCategoriaResult as D1Result<{ categoria_id: number; nombre: string; total: number | null }>)
    .results;

  const gastosPorCategoria: GastoPorCategoria[] = gastosRows.map((row) => {
    const total = toNumber(row.total);
    const porcentaje = totalGastado > 0 ? round2((total / totalGastado) * 100) : 0;

    return {
      categoria_id: row.categoria_id,
      nombre: row.nombre,
      total: round2(total),
      porcentaje,
    };
  });

  const presupuestosRows = (presupuestosEstadoResult as D1Result<{ categoria_id: number; limite: number; gastado: number | null }>)
    .results;

  const presupuestosEstado: PresupuestoEstado[] = presupuestosRows.map((row) => {
    const gastado = toNumber(row.gastado);
    const porcentajeUsado = row.limite > 0 ? round2((gastado / row.limite) * 100) : 0;

    return {
      categoria_id: row.categoria_id,
      limite: round2(row.limite),
      gastado: round2(gastado),
      porcentaje_usado: porcentajeUsado,
    };
  });

  const saldoDisponible = round2(periodo.dinero_inicial - totalGastado - totalAhorradoArs);
  const porcentajeAhorro =
    periodo.dinero_inicial > 0 ? round2((totalAhorradoArs / periodo.dinero_inicial) * 100) : 0;

  return {
    periodo,
    total_gastado: round2(totalGastado),
    total_ahorrado_ars: round2(totalAhorradoArs),
    total_ahorrado_usd: round2(totalAhorradoUsd),
    saldo_disponible: saldoDisponible,
    porcentaje_ahorro: porcentajeAhorro,
    gastos_por_categoria: gastosPorCategoria,
    presupuestos_estado: presupuestosEstado,
  };
};

export const getComparativaPeriodo = async (
  db: D1Database,
  periodoId: number,
): Promise<ComparativaResumen> => {
  const actual = await getPeriodById(db, periodoId);

  const prevMes = actual.mes === 1 ? 12 : actual.mes - 1;
  const prevAnio = actual.mes === 1 ? actual.anio - 1 : actual.anio;

  const previousPeriod = await db
    .prepare(
      `SELECT id, mes, anio, dinero_inicial, tipo_cambio_usd, creado_en
       FROM periodos
       WHERE mes = ? AND anio = ?`,
    )
    .bind(prevMes, prevAnio)
    .first<Periodo>();

  const currentTotals = await getTotalsForPeriod(db, actual.id);

  const previousTotals = previousPeriod
    ? await getTotalsForPeriod(db, previousPeriod.id)
    : { total_gastado: 0, total_ahorrado_ars: 0 };

  const periodoActual: ComparativaItem = {
    id: actual.id,
    mes: actual.mes,
    anio: actual.anio,
    total_gastado: round2(currentTotals.total_gastado),
    total_ahorrado_ars: round2(currentTotals.total_ahorrado_ars),
  };

  const periodoAnterior: ComparativaItem = {
    id: previousPeriod?.id ?? 0,
    mes: previousPeriod?.mes ?? prevMes,
    anio: previousPeriod?.anio ?? prevAnio,
    total_gastado: round2(previousTotals.total_gastado),
    total_ahorrado_ars: round2(previousTotals.total_ahorrado_ars),
  };

  return {
    periodo_actual: periodoActual,
    periodo_anterior: periodoAnterior,
    variacion_gastos_pct: calcPercentageChange(periodoActual.total_gastado, periodoAnterior.total_gastado),
    variacion_ahorros_pct: calcPercentageChange(
      periodoActual.total_ahorrado_ars,
      periodoAnterior.total_ahorrado_ars,
    ),
  };
};
