-- =====================================================
-- CARGA DE DATOS FALTANTES PARA SUCURSAL 25
-- =====================================================
-- Fecha: $(date)
-- Objetivo: Cargar datos específicos de sucursal_id = 25 desde central (172.25.1.200) a filial 25 (172.25.1.25)
-- =====================================================

-- =====================================================
-- CARGA DE DATOS ESPECÍFICOS DE SUCURSAL 25
-- =====================================================

-- 1. financiero.gasto (sucursal_id = 25)
INSERT INTO financiero.gasto (id, sucursal_id, fecha, total, observacion, usuario_id, creado_en)
SELECT id, sucursal_id, fecha, total, observacion, usuario_id, creado_en 
FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, sucursal_id, fecha, total, observacion, usuario_id, creado_en FROM financiero.gasto WHERE sucursal_id = 25') 
AS t1(id bigint, sucursal_id bigint, fecha timestamp with time zone, total numeric, observacion character varying, usuario_id bigint, creado_en timestamp with time zone)
ON CONFLICT DO NOTHING;

-- 2. financiero.retiro (sucursal_id = 25)
INSERT INTO financiero.retiro (id, sucursal_id, fecha, monto, observacion, usuario_id, creado_en)
SELECT id, sucursal_id, fecha, monto, observacion, usuario_id, creado_en 
FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, sucursal_id, fecha, monto, observacion, usuario_id, creado_en FROM financiero.retiro WHERE sucursal_id = 25') 
AS t1(id bigint, sucursal_id bigint, fecha timestamp with time zone, monto numeric, observacion character varying, usuario_id bigint, creado_en timestamp with time zone)
ON CONFLICT DO NOTHING;

-- 3. financiero.sencillo (sucursal_id = 25)
INSERT INTO financiero.sencillo (id, sucursal_id, fecha, monto, observacion, usuario_id, creado_en)
SELECT id, sucursal_id, fecha, monto, observacion, usuario_id, creado_en 
FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, sucursal_id, fecha, monto, observacion, usuario_id, creado_en FROM financiero.sencillo WHERE sucursal_id = 25') 
AS t1(id bigint, sucursal_id bigint, fecha timestamp with time zone, monto numeric, observacion character varying, usuario_id bigint, creado_en timestamp with time zone)
ON CONFLICT DO NOTHING;

-- 4. financiero.conteo (sucursal_id = 25)
INSERT INTO financiero.conteo (id, sucursal_id, fecha, total, observacion, usuario_id, creado_en)
SELECT id, sucursal_id, fecha, total, observacion, usuario_id, creado_en 
FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, sucursal_id, fecha, total, observacion, usuario_id, creado_en FROM financiero.conteo WHERE sucursal_id = 25') 
AS t1(id bigint, sucursal_id bigint, fecha timestamp with time zone, total numeric, observacion character varying, usuario_id bigint, creado_en timestamp with time zone)
ON CONFLICT DO NOTHING;

-- 5. financiero.factura_legal (sucursal_id = 25)
INSERT INTO financiero.factura_legal (id, venta_id, numero_factura, ruc, razon_social, total, usuario_id, creado_en, sucursal_id)
SELECT id, venta_id, numero_factura, ruc, razon_social, total, usuario_id, creado_en, sucursal_id 
FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, venta_id, numero_factura, ruc, razon_social, total, usuario_id, creado_en, sucursal_id FROM financiero.factura_legal WHERE sucursal_id = 25') 
AS t1(id bigint, venta_id bigint, numero_factura character varying, ruc character varying, razon_social character varying, total numeric, usuario_id bigint, creado_en timestamp with time zone, sucursal_id bigint)
ON CONFLICT DO NOTHING;

-- 6. operaciones.delivery (sucursal_id = 25)
INSERT INTO operaciones.delivery (id, usuario_id, sucursal_id, estado, creado_en)
SELECT id, usuario_id, sucursal_id, estado, creado_en 
FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, usuario_id, sucursal_id, estado, creado_en FROM operaciones.delivery WHERE sucursal_id = 25') 
AS t1(id bigint, usuario_id bigint, sucursal_id bigint, estado operaciones.delivery_estado, creado_en timestamp with time zone)
ON CONFLICT DO NOTHING;

-- 7. operaciones.movimiento_stock (sucursal_id = 25)
INSERT INTO operaciones.movimiento_stock (id, producto_id, sucursal_id, tipo_movimiento, cantidad, motivo, usuario_id, creado_en)
SELECT id, producto_id, sucursal_id, tipo_movimiento, cantidad, motivo, usuario_id, creado_en 
FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, producto_id, sucursal_id, tipo_movimiento, cantidad, motivo, usuario_id, creado_en FROM operaciones.movimiento_stock WHERE sucursal_id = 25') 
AS t1(id bigint, producto_id bigint, sucursal_id bigint, tipo_movimiento operaciones.tipo_movimiento, cantidad numeric, motivo character varying, usuario_id bigint, creado_en timestamp with time zone)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ACTUALIZACIÓN DE SECUENCIAS DESPUÉS DE LA CARGA
-- =====================================================

-- Actualizar secuencias basándose en los valores máximos de central
SELECT setval('financiero.gasto_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 'SELECT COALESCE(MAX(id), 0) FROM financiero.gasto WHERE sucursal_id = 25') AS t1(max_id bigint)), false);
SELECT setval('financiero.retiro_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 'SELECT COALESCE(MAX(id), 0) FROM financiero.retiro WHERE sucursal_id = 25') AS t1(max_id bigint)), false);
SELECT setval('financiero.sencillo_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 'SELECT COALESCE(MAX(id), 0) FROM financiero.sencillo WHERE sucursal_id = 25') AS t1(max_id bigint)), false);
SELECT setval('financiero.conteo_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 'SELECT COALESCE(MAX(id), 0) FROM financiero.conteo WHERE sucursal_id = 25') AS t1(max_id bigint)), false);
SELECT setval('financiero.factura_legal_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 'SELECT COALESCE(MAX(id), 0) FROM financiero.factura_legal WHERE sucursal_id = 25') AS t1(max_id bigint)), false);
SELECT setval('operaciones.delivery_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 'SELECT COALESCE(MAX(id), 0) FROM operaciones.delivery WHERE sucursal_id = 25') AS t1(max_id bigint)), false);
SELECT setval('operaciones.movimiento_stock_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 'SELECT COALESCE(MAX(id), 0) FROM operaciones.movimiento_stock WHERE sucursal_id = 25') AS t1(max_id bigint)), false);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que los datos se cargaron correctamente
SELECT 'financiero.gasto' as tabla, COUNT(*) as registros FROM financiero.gasto WHERE sucursal_id = 25
UNION ALL
SELECT 'financiero.retiro', COUNT(*) FROM financiero.retiro WHERE sucursal_id = 25
UNION ALL
SELECT 'financiero.sencillo', COUNT(*) FROM financiero.sencillo WHERE sucursal_id = 25
UNION ALL
SELECT 'financiero.conteo', COUNT(*) FROM financiero.conteo WHERE sucursal_id = 25
UNION ALL
SELECT 'financiero.factura_legal', COUNT(*) FROM financiero.factura_legal WHERE sucursal_id = 25
UNION ALL
SELECT 'operaciones.delivery', COUNT(*) FROM operaciones.delivery WHERE sucursal_id = 25
UNION ALL
SELECT 'operaciones.movimiento_stock', COUNT(*) FROM operaciones.movimiento_stock WHERE sucursal_id = 25;

-- Verificar secuencias actualizadas
SELECT 'financiero.gasto_id_seq' as secuencia, last_value FROM pg_sequences WHERE sequencename = 'gasto_id_seq'
UNION ALL
SELECT 'financiero.retiro_id_seq', last_value FROM pg_sequences WHERE sequencename = 'retiro_id_seq'
UNION ALL
SELECT 'financiero.sencillo_id_seq', last_value FROM pg_sequences WHERE sequencename = 'sencillo_id_seq'
UNION ALL
SELECT 'financiero.conteo_id_seq', last_value FROM pg_sequences WHERE sequencename = 'conteo_id_seq'
UNION ALL
SELECT 'financiero.factura_legal_id_seq', last_value FROM pg_sequences WHERE sequencename = 'factura_legal_id_seq'
UNION ALL
SELECT 'operaciones.delivery_id_seq', last_value FROM pg_sequences WHERE sequencename = 'delivery_id_seq'
UNION ALL
SELECT 'operaciones.movimiento_stock_id_seq', last_value FROM pg_sequences WHERE sequencename = 'movimiento_stock_id_seq';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Este script carga datos específicos de sucursal_id = 25 desde central
-- 2. Actualiza las secuencias para que coincidan con los valores máximos de central
-- 3. Verifica que los datos se cargaron correctamente
-- 4. Usa ON CONFLICT DO NOTHING para evitar duplicados
-- ===================================================== 