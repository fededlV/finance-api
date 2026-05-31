-- Migration number: 0001_add_ingresos.sql
CREATE TABLE IF NOT EXISTS ingresos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id    INTEGER NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  descripcion   TEXT    NOT NULL,
  monto         INTEGER NOT NULL CHECK(monto > 0),
  fecha         TEXT    NOT NULL,
  nota          TEXT    DEFAULT NULL,
  creado_en     TEXT    NOT NULL DEFAULT (datetime('now')),
  modificado_en TEXT    DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_ingresos_periodo ON ingresos(periodo_id);
