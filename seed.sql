-- Seeding script for Finance API
-- Safely initializes the default tracking period (ID 1) for May 2026 with a zeroed base balance ($0.00)

INSERT OR IGNORE INTO periodos (id, mes, anio, dinero_inicial, tipo_cambio_usd, creado_en)
VALUES (1, 5, 2026, 0, NULL, datetime('now'));
