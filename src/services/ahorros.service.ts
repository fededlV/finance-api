import { AppError } from '../middlewares/error.middleware';
import type { CreateAhorroInput, PatchAhorroInput } from '../schemas/ahorro.schema';
import type { Ahorro } from '../types/models';

interface AhorroFilters {
  periodo_id?: number;
  moneda?: 'ARS' | 'USD';
}

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

export const listAhorros = async (db: D1Database, filters: AhorroFilters): Promise<Ahorro[]> => {
  let sql = `SELECT id, periodo_id, descripcion, monto, moneda, origen, fecha, nota, creado_en
             FROM ahorros
             WHERE 1 = 1`;

  const params: Array<number | string> = [];

  if (filters.periodo_id !== undefined) {
    sql += ' AND periodo_id = ?';
    params.push(filters.periodo_id);
  }

  if (filters.moneda !== undefined) {
    sql += ' AND moneda = ?';
    params.push(filters.moneda);
  }

  sql += ' ORDER BY fecha DESC, id DESC';

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<Ahorro>();

  return result.results;
};

export const getAhorroById = async (db: D1Database, id: number): Promise<Ahorro> => {
  const ahorro = await db
    .prepare(
      `SELECT id, periodo_id, descripcion, monto, moneda, origen, fecha, nota, creado_en
       FROM ahorros
       WHERE id = ?`,
    )
    .bind(id)
    .first<Ahorro>();

  if (!ahorro) {
    throw new AppError('Ahorro no encontrado.', 404);
  }

  return ahorro;
};

export const createAhorro = async (db: D1Database, input: CreateAhorroInput): Promise<Ahorro> => {
  try {
    const result = await db
      .prepare(
        `INSERT INTO ahorros (periodo_id, descripcion, monto, moneda, origen, fecha, nota)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.periodo_id,
        input.descripcion,
        input.monto,
        input.moneda,
        input.origen ?? null,
        input.fecha,
        input.nota ?? null,
      )
      .run();

    const rowId = getLastRowId(result);

    if (!rowId) {
      throw new AppError('No se pudo crear el ahorro.', 500);
    }

    return getAhorroById(db, rowId);
  } catch (error: unknown) {
    if (isForeignKeyError(error)) {
      throw new AppError('Periodo invalido.', 400);
    }

    if (isCheckError(error)) {
      throw new AppError('Los datos del ahorro no cumplen las restricciones.', 400);
    }

    throw error;
  }
};

export const patchAhorro = async (db: D1Database, id: number, input: PatchAhorroInput): Promise<Ahorro> => {
  const updates: string[] = [];
  const params: Array<number | string | null> = [];

  if (input.periodo_id !== undefined) {
    updates.push('periodo_id = ?');
    params.push(input.periodo_id);
  }

  if (input.descripcion !== undefined) {
    updates.push('descripcion = ?');
    params.push(input.descripcion);
  }

  if (input.monto !== undefined) {
    updates.push('monto = ?');
    params.push(input.monto);
  }

  if (input.moneda !== undefined) {
    updates.push('moneda = ?');
    params.push(input.moneda);
  }

  if (input.origen !== undefined) {
    updates.push('origen = ?');
    params.push(input.origen ?? null);
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

  params.push(id);

  try {
    const result = await db
      .prepare(`UPDATE ahorros SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    if (getChangedRows(result) === 0) {
      throw new AppError('Ahorro no encontrado.', 404);
    }

    return getAhorroById(db, id);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isForeignKeyError(error)) {
      throw new AppError('Periodo invalido.', 400);
    }

    if (isCheckError(error)) {
      throw new AppError('Los datos del ahorro no cumplen las restricciones.', 400);
    }

    throw error;
  }
};

export const deleteAhorro = async (db: D1Database, id: number): Promise<void> => {
  const result = await db.prepare('DELETE FROM ahorros WHERE id = ?').bind(id).run();

  if (getChangedRows(result) === 0) {
    throw new AppError('Ahorro no encontrado.', 404);
  }
};
