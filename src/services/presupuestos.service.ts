import { AppError } from '../middlewares/error.middleware';
import type { CreatePresupuestoInput, PatchPresupuestoInput } from '../schemas/presupuesto.schema';
import type { Presupuesto } from '../types/models';

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

export const listPresupuestos = async (db: D1Database, periodoId?: number): Promise<Presupuesto[]> => {
  let sql = `SELECT id, periodo_id, categoria_id, monto_limite
             FROM presupuestos`;

  const params: number[] = [];

  if (periodoId !== undefined) {
    sql += ' WHERE periodo_id = ?';
    params.push(periodoId);
  }

  sql += ' ORDER BY id DESC';

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<Presupuesto>();

  return result.results;
};

export const getPresupuestoById = async (db: D1Database, id: number): Promise<Presupuesto> => {
  const presupuesto = await db
    .prepare(
      `SELECT id, periodo_id, categoria_id, monto_limite
       FROM presupuestos
       WHERE id = ?`,
    )
    .bind(id)
    .first<Presupuesto>();

  if (!presupuesto) {
    throw new AppError('Presupuesto no encontrado.', 404);
  }

  return presupuesto;
};

export const createOrReplacePresupuesto = async (
  db: D1Database,
  input: CreatePresupuestoInput,
): Promise<Presupuesto> => {
  try {
    await db
      .prepare(
        `INSERT INTO presupuestos (periodo_id, categoria_id, monto_limite)
         VALUES (?, ?, ?)
         ON CONFLICT(periodo_id, categoria_id)
         DO UPDATE SET monto_limite = excluded.monto_limite`,
      )
      .bind(input.periodo_id, input.categoria_id, input.monto_limite)
      .run();

    const presupuesto = await db
      .prepare(
        `SELECT id, periodo_id, categoria_id, monto_limite
         FROM presupuestos
         WHERE periodo_id = ? AND categoria_id = ?`,
      )
      .bind(input.periodo_id, input.categoria_id)
      .first<Presupuesto>();

    if (!presupuesto) {
      throw new AppError('No se pudo crear o reemplazar el presupuesto.', 500);
    }

    return presupuesto;
  } catch (error: unknown) {
    if (isForeignKeyError(error)) {
      throw new AppError('Periodo o categoria invalida.', 400);
    }

    if (isCheckError(error)) {
      throw new AppError('El monto limite no cumple las restricciones.', 400);
    }

    throw error;
  }
};

export const patchPresupuesto = async (
  db: D1Database,
  id: number,
  input: PatchPresupuestoInput,
): Promise<Presupuesto> => {
  try {
    const result = await db
      .prepare('UPDATE presupuestos SET monto_limite = ? WHERE id = ?')
      .bind(input.monto_limite, id)
      .run();

    if (getChangedRows(result) === 0) {
      throw new AppError('Presupuesto no encontrado.', 404);
    }

    return getPresupuestoById(db, id);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isCheckError(error)) {
      throw new AppError('El monto limite no cumple las restricciones.', 400);
    }

    throw error;
  }
};

export const deletePresupuesto = async (db: D1Database, id: number): Promise<void> => {
  const result = await db.prepare('DELETE FROM presupuestos WHERE id = ?').bind(id).run();

  if (getChangedRows(result) === 0) {
    throw new AppError('Presupuesto no encontrado.', 404);
  }
};
