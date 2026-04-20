-- MisFinanzas - Seed de datos de prueba
--
-- Uso recomendado:
-- 1) Insertar/reinicializar datos de prueba:
--    npx wrangler d1 execute misfinanzas-db --file=src/db/seed.sql --remote
--
-- 2) Limpiar cuando quieras (sin insertar):
--    npx wrangler d1 execute misfinanzas-db --command "DELETE FROM presupuestos; DELETE FROM gastos; DELETE FROM ahorros; DELETE FROM periodos; DELETE FROM sqlite_sequence WHERE name IN ('periodos','gastos','ahorros','presupuestos');" --remote
--
-- Nota: este script REINICIA periodos, gastos, ahorros y presupuestos,
-- y vuelve a insertar datos de prueba.

PRAGMA foreign_keys = ON;

-- 1) Limpiar datos de prueba existentes
DELETE FROM presupuestos;
DELETE FROM gastos;
DELETE FROM ahorros;
DELETE FROM periodos;

-- Reset de autoincrement para IDs predecibles
DELETE FROM sqlite_sequence
WHERE name IN ('periodos', 'gastos', 'ahorros', 'presupuestos');

-- 2) Insertar periodos
INSERT INTO periodos (id, mes, anio, dinero_inicial, tipo_cambio_usd) VALUES
  (1, 5, 2026, 380000, 1100),
  (2, 6, 2026, 420000, 1150),
  (3, 7, 2026, 450000, 1180);

-- 3) Insertar gastos
INSERT INTO gastos (id, periodo_id, categoria_id, descripcion, monto, fecha, nota) VALUES
  -- Periodo 1
  (1, 1, 1, 'Supermercado quincenal', 46000, '2026-05-05', 'Compra mayorista'),
  (2, 1, 2, 'Carga de nafta', 28000, '2026-05-07', NULL),
  (3, 1, 5, 'Luz y gas', 31500, '2026-05-10', 'Pago servicios'),
  (4, 1, 4, 'Salida cine', 12000, '2026-05-14', NULL),
  (5, 1, 3, 'Farmacia', 9800, '2026-05-18', 'Medicacion'),
  -- Periodo 2
  (6, 2, 1, 'Supermercado mensual', 58500, '2026-06-03', NULL),
  (7, 2, 2, 'Sube y movilidad', 23500, '2026-06-08', NULL),
  (8, 2, 6, 'Ropa de invierno', 49000, '2026-06-12', 'Campera y buzo'),
  (9, 2, 5, 'Internet y celular', 26500, '2026-06-15', NULL),
  (10, 2, 7, 'Curso online', 19000, '2026-06-22', NULL),
  -- Periodo 3
  (11, 3, 1, 'Supermercado primera semana', 33500, '2026-07-04', NULL),
  (12, 3, 2, 'Combustible', 31000, '2026-07-09', NULL),
  (13, 3, 8, 'Gastos varios', 14500, '2026-07-11', 'Ferreteria y hogar'),
  (14, 3, 4, 'Streaming y ocio', 11200, '2026-07-17', NULL),
  (15, 3, 3, 'Consulta medica', 18000, '2026-07-20', NULL);

-- 4) Insertar ahorros
INSERT INTO ahorros (id, periodo_id, descripcion, monto, moneda, origen, fecha, nota) VALUES
  (1, 1, 'Fondo emergencia', 50000, 'ARS', 'Transferencia', '2026-05-20', NULL),
  (2, 1, 'Compra de USD', 120, 'USD', 'Caja de ahorro', '2026-05-25', 'Dolar ahorro'),
  (3, 2, 'Fondo viaje', 65000, 'ARS', 'Transferencia', '2026-06-19', NULL),
  (4, 2, 'Compra de USD', 140, 'USD', 'Caja de ahorro', '2026-06-27', NULL),
  (5, 3, 'Ahorro mensual automatico', 70000, 'ARS', 'Debito automatico', '2026-07-21', NULL),
  (6, 3, 'Compra de USD', 160, 'USD', 'Caja de ahorro', '2026-07-26', NULL);

-- 5) Insertar presupuestos (1 por categoria y periodo)
INSERT INTO presupuestos (id, periodo_id, categoria_id, monto_limite) VALUES
  -- Periodo 1
  (1, 1, 1, 90000),
  (2, 1, 2, 50000),
  (3, 1, 5, 40000),
  (4, 1, 4, 25000),
  -- Periodo 2
  (5, 2, 1, 100000),
  (6, 2, 2, 55000),
  (7, 2, 6, 60000),
  (8, 2, 5, 35000),
  (9, 2, 7, 30000),
  -- Periodo 3
  (10, 3, 1, 105000),
  (11, 3, 2, 60000),
  (12, 3, 8, 30000),
  (13, 3, 4, 25000),
  (14, 3, 3, 35000);

