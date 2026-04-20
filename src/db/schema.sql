CREATE TABLE IF NOT EXISTS categorias (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT    NOT NULL UNIQUE,
  icono     TEXT    NOT NULL,
  color     TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS periodos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  mes             INTEGER NOT NULL,
  anio            INTEGER NOT NULL,
  dinero_inicial  REAL    NOT NULL DEFAULT 0,
  tipo_cambio_usd REAL    DEFAULT NULL,
  creado_en       TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(mes, anio)
);

CREATE TABLE IF NOT EXISTS gastos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id    INTEGER NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  categoria_id  INTEGER NOT NULL REFERENCES categorias(id),
  descripcion   TEXT    NOT NULL,
  monto         REAL    NOT NULL CHECK(monto > 0),
  fecha         TEXT    NOT NULL,
  nota          TEXT    DEFAULT NULL,
  creado_en     TEXT    NOT NULL DEFAULT (datetime('now')),
  modificado_en TEXT    DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS ahorros (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id   INTEGER NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  descripcion  TEXT    NOT NULL,
  monto        REAL    NOT NULL CHECK(monto > 0),
  moneda       TEXT    NOT NULL DEFAULT 'ARS' CHECK(moneda IN ('ARS', 'USD')),
  origen       TEXT    DEFAULT NULL,
  fecha        TEXT    NOT NULL,
  nota         TEXT    DEFAULT NULL,
  creado_en    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS presupuestos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id    INTEGER NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  categoria_id  INTEGER NOT NULL REFERENCES categorias(id),
  monto_limite  REAL    NOT NULL CHECK(monto_limite > 0),
  UNIQUE(periodo_id, categoria_id)
);

CREATE INDEX IF NOT EXISTS idx_gastos_periodo   ON gastos(periodo_id);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha     ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_ahorros_periodo  ON ahorros(periodo_id);
CREATE INDEX IF NOT EXISTS idx_ahorros_moneda   ON ahorros(moneda);

INSERT OR IGNORE INTO categorias (nombre, icono, color) VALUES
  ('Alimentación',     'cart',                  '#FF6B6B'),
  ('Transporte',       'car',                   '#4ECDC4'),
  ('Salud',            'heart',                 '#FF8C42'),
  ('Entretenimiento',  'game-controller',        '#A855F7'),
  ('Servicios',        'flash',                 '#3B82F6'),
  ('Indumentaria',     'shirt',                 '#EC4899'),
  ('Educación',        'book',                  '#F59E0B'),
  ('Otros',            'ellipsis-horizontal',   '#6B7280');
