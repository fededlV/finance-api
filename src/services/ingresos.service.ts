import { AppError } from '../middlewares/error.middleware';
import type { CreateIngresoInput, PatchIngresoInput } from '../schemas/ingreso.schema';
import type { Ingreso } from '../types/models';

interface IngresoFilters {
  periodo_id?: number;
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

export const listIngresos = async (db: D1Database, filters: IngresoFilters): Promise<Ingreso[]> => {
  let sql = `SELECT id, periodo_id, descripcion, monto, fecha, nota, creado_en, modificado_en
             FROM ingresos
             WHERE 1 = 1`;

  const params: Array<number | string> = [];

  if (filters.periodo_id !== undefined) {
    sql += ' AND periodo_id = ?';
    params.push(filters.periodo_id);
  }

  sql += ' ORDER BY fecha DESC, id DESC';

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<Ingreso>();

  return result.results;
};

export const getIngresoById = async (db: D1Database, id: number): Promise<Ingreso> => {
  const ingreso = await db
    .prepare(
      `SELECT id, periodo_id, descripcion, monto, fecha, nota, creado_en, modificado_en
       FROM ingresos
       WHERE id = ?`,
    )
    .bind(id)
    .first<Ingreso>();

  if (!ingreso) {
    throw new AppError('Ingreso no encontrado.', 404);
  }

  return ingreso;
};

export const createIngreso = async (db: D1Database, input: CreateIngresoInput): Promise<Ingreso> => {
  try {
    const result = await db
      .prepare(
        `INSERT INTO ingresos (periodo_id, descripcion, monto, fecha, nota)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        input.periodo_id,
        input.descripcion,
        input.monto,
        input.fecha,
        input.nota ?? null,
      )
      .run();

    const rowId = getLastRowId(result);

    if (!rowId) {
      throw new AppError('No se pudo crear el ingreso.', 500);
    }

    return getIngresoById(db, rowId);
  } catch (error: unknown) {
    if (isForeignKeyError(error)) {
      throw new AppError('Periodo invalido.', 400);
    }

    if (isCheckError(error)) {
      throw new AppError('Los datos del ingreso no cumplen las restricciones.', 400);
    }

    if (isUniqueConstraintError(error)) {
      throw new AppError('El ingreso entra en conflicto con una restriccion unica.', 409);
    }

    throw error;
  }
};

export const patchIngreso = async (db: D1Database, id: number, input: PatchIngresoInput): Promise<Ingreso> => {
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
      .prepare(`UPDATE ingresos SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    if (getChangedRows(result) === 0) {
      throw new AppError('Ingreso no encontrado.', 404);
    }

    return getIngresoById(db, id);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isForeignKeyError(error)) {
      throw new AppError('Periodo invalido.', 400);
    }

    if (isCheckError(error)) {
      throw new AppError('Los datos del ingreso no cumplen las restricciones.', 400);
    }

    throw error;
  }
};

export const deleteIngreso = async (db: D1Database, id: number): Promise<void> => {
  const result = await db.prepare('DELETE FROM ingresos WHERE id = ?').bind(id).run();

  if (getChangedRows(result) === 0) {
    throw new AppError('Ingreso no encontrado.', 404);
  }
};
