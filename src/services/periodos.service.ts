import { AppError } from '../middlewares/error.middleware';
import type { CreatePeriodoInput, PatchPeriodoInput } from '../schemas/periodo.schema';
import type { Periodo } from '../types/models';

const isUniqueConstraintError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed');
};

const getChangedRows = (result: D1Result<unknown>): number => {
  const maybeMeta = result.meta as { changes?: number } | undefined;
  return maybeMeta?.changes ?? 0;
};

const getLastRowId = (result: D1Result<unknown>): number | null => {
  const maybeMeta = result.meta as { last_row_id?: number } | undefined;
  return typeof maybeMeta?.last_row_id === 'number' ? maybeMeta.last_row_id : null;
};

export const listPeriodos = async (db: D1Database): Promise<Periodo[]> => {
  const result = await db
    .prepare(
      `SELECT id, mes, anio, dinero_inicial, tipo_cambio_usd, creado_en
       FROM periodos
       ORDER BY anio DESC, mes DESC`,
    )
    .all<Periodo>();

  return result.results;
};

export const getPeriodoById = async (db: D1Database, id: number): Promise<Periodo> => {
  const periodo = await db
    .prepare(
      `SELECT id, mes, anio, dinero_inicial, tipo_cambio_usd, creado_en
       FROM periodos
       WHERE id = ?`,
    )
    .bind(id)
    .first<Periodo>();

  if (!periodo) {
    throw new AppError('Periodo no encontrado.', 404);
  }

  return periodo;
};

export const getOrCreatePeriodoActual = async (db: D1Database): Promise<Periodo> => {
  const now = new Date();
  const mes = now.getUTCMonth() + 1;
  const anio = now.getUTCFullYear();

  const existing = await db
    .prepare(
      `SELECT id, mes, anio, dinero_inicial, tipo_cambio_usd, creado_en
       FROM periodos
       WHERE mes = ? AND anio = ?`,
    )
    .bind(mes, anio)
    .first<Periodo>();

  if (existing) {
    return existing;
  }

  try {
    await db
      .prepare(
        `INSERT INTO periodos (mes, anio, dinero_inicial, tipo_cambio_usd)
         VALUES (?, ?, 0, NULL)`,
      )
      .bind(mes, anio)
      .run();
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      const concurrent = await db
        .prepare(
          `SELECT id, mes, anio, dinero_inicial, tipo_cambio_usd, creado_en
           FROM periodos
           WHERE mes = ? AND anio = ?`,
        )
        .bind(mes, anio)
        .first<Periodo>();

      if (concurrent) {
        return concurrent;
      }
    }

    throw error;
  }

  const created = await db
    .prepare(
      `SELECT id, mes, anio, dinero_inicial, tipo_cambio_usd, creado_en
       FROM periodos
       WHERE mes = ? AND anio = ?`,
    )
    .bind(mes, anio)
    .first<Periodo>();

  if (!created) {
    throw new AppError('No se pudo crear el periodo actual.', 500);
  }

  return created;
};

export const createPeriodo = async (db: D1Database, input: CreatePeriodoInput): Promise<Periodo> => {
  try {
    const insertResult = await db
      .prepare(
        `INSERT INTO periodos (mes, anio, dinero_inicial, tipo_cambio_usd)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(input.mes, input.anio, input.dinero_inicial, input.tipo_cambio_usd ?? null)
      .run();

    const rowId = getLastRowId(insertResult);

    if (!rowId) {
      throw new AppError('No se pudo crear el periodo.', 500);
    }

    return getPeriodoById(db, rowId);
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw new AppError('Ya existe un periodo para ese mes y anio.', 409);
    }

    throw error;
  }
};

export const patchPeriodo = async (
  db: D1Database,
  id: number,
  input: PatchPeriodoInput,
): Promise<Periodo> => {
  const updates: string[] = [];
  const params: Array<number | null> = [];

  if (input.dinero_inicial !== undefined) {
    updates.push('dinero_inicial = ?');
    params.push(input.dinero_inicial);
  }

  if (input.tipo_cambio_usd !== undefined) {
    updates.push('tipo_cambio_usd = ?');
    params.push(input.tipo_cambio_usd ?? null);
  }

  if (updates.length === 0) {
    throw new AppError('No hay campos para actualizar.', 400);
  }

  params.push(id);

  const result = await db
    .prepare(`UPDATE periodos SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  if (getChangedRows(result) === 0) {
    throw new AppError('Periodo no encontrado.', 404);
  }

  return getPeriodoById(db, id);
};
