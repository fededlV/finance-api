import type { Categoria } from '../types/models';

export const listCategorias = async (db: D1Database): Promise<Categoria[]> => {
  const result = await db
    .prepare(
      `SELECT id, nombre, icono, color
       FROM categorias
       ORDER BY nombre ASC`,
    )
    .all<Categoria>();

  return result.results;
};
