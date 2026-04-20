import { AppError } from '../middlewares/error.middleware';
import type { CreateGastoInput, PatchGastoInput, PutGastoInput } from '../schemas/gasto.schema';
import type { Gasto } from '../types/models';

interface GastoFilters {
  periodo_id?: number;
  categoria_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

const isUniqueConstraintError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed');
};

const isForeignKeyError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('FOREIGN KEY constraint failed');
};

const isCheckError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('CHECK constraint failed');
};

const getChangedRows = (result: D1Result<unknown>): number => {
  const maybeMeta = result.meta as { changes?: number } | undefined;
  return maybeMeta?.changes ?? 0;
};

const getLastRowId = (result: D1Result<unknown>): number | null => {
  const maybeMeta = result.meta as { last_row_id?: number } | undefined;
  return typeof maybeMeta?.last_row_id === 'number' ? maybeMeta.last_row_id : null;
};

export const listGastos = async (db: D1Database, filters: GastoFilters): Promise<Gasto[]> => {
  let sql = `SELECT id, periodo_id, categoria_id, descripcion, monto, fecha, nota, creado_en, modificado_en
             FROM gastos
             WHERE 1 = 1`;

  const params: Array<number | string> = [];

  if (filters.periodo_id !== undefined) {
    sql += ' AND periodo_id = ?';
    params.push(filters.periodo_id);
  }

  if (filters.categoria_id !== undefined) {
    sql += ' AND categoria_id = ?';
    params.push(filters.categoria_id);
  }

  if (filters.fecha_desde !== undefined) {
    sql += ' AND fecha >= ?';
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta !== undefined) {
    sql += ' AND fecha <= ?';
    params.push(filters.fecha_hasta);
  }

  sql += ' ORDER BY fecha DESC, id DESC';

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<Gasto>();

  return result.results;
};

export const getGastoById = async (db: D1Database, id: number): Promise<Gasto> => {
  const gasto = await db
    .prepare(
      `SELECT id, periodo_id, categoria_id, descripcion, monto, fecha, nota, creado_en, modificado_en
       FROM gastos
       WHERE id = ?`,
    )
    .bind(id)
    .first<Gasto>();

  if (!gasto) {
    throw new AppError('Gasto no encontrado.', 404);
  }

  return gasto;
};

export const createGasto = async (db: D1Database, input: CreateGastoInput): Promise<Gasto> => {
  try {
    const result = await db
      .prepare(
        `INSERT INTO gastos (periodo_id, categoria_id, descripcion, monto, fecha, nota)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.periodo_id,
        input.categoria_id,
        input.descripcion,
        input.monto,
        input.fecha,
        input.nota ?? null,
      )
      .run();

    const rowId = getLastRowId(result);

    if (!rowId) {
      throw new AppError('No se pudo crear el gasto.', 500);
    }

    return getGastoById(db, rowId);
  } catch (error: unknown) {
    if (isForeignKeyError(error)) {
      throw new AppError('Periodo o categoria invalida.', 400);
    }

    if (isCheckError(error)) {
      throw new AppError('Los datos del gasto no cumplen las restricciones.', 400);
    }

    if (isUniqueConstraintError(error)) {
      throw new AppError('El gasto entra en conflicto con una restriccion unica.', 409);
    }

    throw error;
  }
};

export const replaceGasto = async (db: D1Database, id: number, input: PutGastoInput): Promise<Gasto> => {
  try {
    const result = await db
      .prepare(
        `UPDATE gastos
         SET periodo_id = ?, categoria_id = ?, descripcion = ?, monto = ?, fecha = ?, nota = ?, modificado_en = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        input.periodo_id,
        input.categoria_id,
        input.descripcion,
        input.monto,
        input.fecha,
        input.nota ?? null,
        id,
      )
      .run();

    if (getChangedRows(result) === 0) {
      throw new AppError('Gasto no encontrado.', 404);
    }

    return getGastoById(db, id);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isForeignKeyError(error)) {
      throw new AppError('Periodo o categoria invalida.', 400);
    }

    if (isCheckError(error)) {
      throw new AppError('Los datos del gasto no cumplen las restricciones.', 400);
    }

    throw error;
  }
};

export const patchGasto = async (db: D1Database, id: number, input: PatchGastoInput): Promise<Gasto> => {
  const updates: string[] = [];
  const params: Array<number | string | null> = [];

  if (input.periodo_id !== undefined) {
    updates.push('periodo_id = ?');
    params.push(input.periodo_id);
  }

  if (input.categoria_id !== undefined) {
    updates.push('categoria_id = ?');
    params.push(input.categoria_id);
  }

  if (input.descripcion !== undefined) {
    updates.push('descripcion = ?');
    params.push(input.descripcion);
  }

  if (input.monto !== undefined) {
    updates.push('monto = ?');
    params.push(input.monto);
  }

  if (input.fecha !== undefined) {
    updates.push('fecha = ?');
    params.push(input.fecha);
  }

  if (input.nota !== undefined) {
    updates.push('nota = ?');
    params.push(input.nota ?? null);
  }

  if (updates.length === 0) {
    throw new AppError('No hay campos para actualizar.', 400);
  }

  updates.push("modificado_en = datetime('now')");
  params.push(id);

  try {
    const result = await db
      .prepare(`UPDATE gastos SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    if (getChangedRows(result) === 0) {
      throw new AppError('Gasto no encontrado.', 404);
    }

    return getGastoById(db, id);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isForeignKeyError(error)) {
      throw new AppError('Periodo o categoria invalida.', 400);
    }

    if (isCheckError(error)) {
      throw new AppError('Los datos del gasto no cumplen las restricciones.', 400);
    }

    throw error;
  }
};

export const deleteGasto = async (db: D1Database, id: number): Promise<void> => {
  const result = await db.prepare('DELETE FROM gastos WHERE id = ?').bind(id).run();

  if (getChangedRows(result) === 0) {
    throw new AppError('Gasto no encontrado.', 404);
  }
};
