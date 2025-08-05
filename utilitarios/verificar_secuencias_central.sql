-- =====================================================
-- VERIFICACIÓN Y ACTUALIZACIÓN DE SECUENCIAS DESDE CENTRAL
-- =====================================================
-- Fecha: $(date)
-- Objetivo: Verificar cada tabla en central (172.25.1.200) con filtro sucursal_id = 25
--          Obtener el mayor ID y actualizar la secuencia en filial 25 (172.25.1.25)
-- =====================================================

-- Función para verificar y actualizar secuencia desde central
CREATE OR REPLACE FUNCTION verificar_y_actualizar_secuencia_central(
    nombre_tabla text, 
    nombre_secuencia text,
    esquema text DEFAULT 'operaciones'
)
RETURNS void AS $$
DECLARE
    max_id_central bigint;
    max_id_local bigint;
    sql_query text;
BEGIN
    -- Obtener el máximo ID de la tabla en central con filtro sucursal_id = 25
    sql_query := 'SELECT COALESCE(MAX(id), 0) FROM dblink(''host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco'', ''SELECT COALESCE(MAX(id), 0) FROM ' || esquema || '.' || nombre_tabla || ' WHERE sucursal_id = 25'') AS t1(max_id bigint)';
    EXECUTE sql_query INTO max_id_central;
    
    -- Obtener el máximo ID de la tabla local
    sql_query := 'SELECT COALESCE(MAX(id), 0) FROM ' || esquema || '.' || nombre_tabla;
    EXECUTE sql_query INTO max_id_local;
    
    -- Usar el mayor de los dos valores
    IF max_id_central > max_id_local THEN
        -- Actualizar la secuencia en local
        EXECUTE 'SELECT setval(''' || esquema || '.' || nombre_secuencia || ''', ' || (max_id_central + 1) || ', false)';
        RAISE NOTICE 'Tabla: %.%, Máximo ID Central: %, Máximo ID Local: %, Secuencia actualizada a: %', esquema, nombre_tabla, max_id_central, max_id_local, (max_id_central + 1);
    ELSE
        -- Actualizar la secuencia en local con el valor local
        EXECUTE 'SELECT setval(''' || esquema || '.' || nombre_secuencia || ''', ' || (max_id_local + 1) || ', false)';
        RAISE NOTICE 'Tabla: %.%, Máximo ID Central: %, Máximo ID Local: %, Secuencia actualizada a: % (usando local)', esquema, nombre_tabla, max_id_central, max_id_local, (max_id_local + 1);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICACIÓN Y ACTUALIZACIÓN POR TABLA
-- =====================================================

-- 1. financiero.gasto_detalle
SELECT verificar_y_actualizar_secuencia_central('gasto_detalle', 'gasto_detalle_id_seq', 'financiero');

-- 2. financiero.retiro_detalle
SELECT verificar_y_actualizar_secuencia_central('retiro_detalle', 'retiro_detalle_id_seq', 'financiero');

-- 3. financiero.sencillo_detalle
SELECT verificar_y_actualizar_secuencia_central('sencillo_detalle', 'sencillo_detalle_id_seq', 'financiero');

-- 4. financiero.conteo_moneda
SELECT verificar_y_actualizar_secuencia_central('conteo_moneda', 'conteo_moneda_id_seq', 'financiero');

-- 5. financiero.factura_legal_item
SELECT verificar_y_actualizar_secuencia_central('factura_legal_item', 'factura_legal_item_id_seq', 'financiero');

-- 6. operaciones.cobro_detalle
SELECT verificar_y_actualizar_secuencia_central('cobro_detalle', 'cobro_detalle_id_seq', 'operaciones');

-- 7. operaciones.venta_item
SELECT verificar_y_actualizar_secuencia_central('venta_item', 'venta_item_id_seq', 'operaciones');

-- 8. operaciones.vuelto_item
SELECT verificar_y_actualizar_secuencia_central('vuelto_item', 'vuelto_item_id_seq', 'operaciones');

-- 9. financiero.gasto
SELECT verificar_y_actualizar_secuencia_central('gasto', 'gasto_id_seq', 'financiero');

-- 10. financiero.retiro
SELECT verificar_y_actualizar_secuencia_central('retiro', 'retiro_id_seq', 'financiero');

-- 11. financiero.sencillo
SELECT verificar_y_actualizar_secuencia_central('sencillo', 'sencillo_id_seq', 'financiero');

-- 12. financiero.conteo
SELECT verificar_y_actualizar_secuencia_central('conteo', 'conteo_id_seq', 'financiero');

-- 13. financiero.factura_legal
SELECT verificar_y_actualizar_secuencia_central('factura_legal', 'factura_legal_id_seq', 'financiero');

-- 14. operaciones.cobro
SELECT verificar_y_actualizar_secuencia_central('cobro', 'cobro_id_seq', 'operaciones');

-- 15. operaciones.vuelto
SELECT verificar_y_actualizar_secuencia_central('vuelto', 'vuelto_id_seq', 'operaciones');

-- 16. operaciones.delivery
SELECT verificar_y_actualizar_secuencia_central('delivery', 'delivery_id_seq', 'operaciones');

-- 17. operaciones.venta
SELECT verificar_y_actualizar_secuencia_central('venta', 'venta_id_seq', 'operaciones');

-- 18. operaciones.movimiento_stock
SELECT verificar_y_actualizar_secuencia_central('movimiento_stock', 'movimiento_stock_id_seq', 'operaciones');

-- 19. financiero.movimiento_caja
SELECT verificar_y_actualizar_secuencia_central('movimiento_caja', 'movimiento_caja_id_seq', 'financiero');

-- 20. financiero.venta_credito_cuota
SELECT verificar_y_actualizar_secuencia_central('venta_credito_cuota', 'venta_credito_cuota_id_seq', 'financiero');

-- 21. financiero.venta_credito
SELECT verificar_y_actualizar_secuencia_central('venta_credito', 'venta_credito_id_seq', 'financiero');

-- 22. administrativo.marcacion
SELECT verificar_y_actualizar_secuencia_central('marcacion', 'marcacion_id_seq', 'administrativo');

-- 23. configuraciones.inicio_sesion
SELECT verificar_y_actualizar_secuencia_central('inicio_sesion', 'inicio_sesion_id_seq', 'configuraciones');

-- 24. financiero.cambio_caja
SELECT verificar_y_actualizar_secuencia_central('cambio_caja', 'cambio_caja_id_seq', 'financiero');

-- 25. financiero.pdv_caja
SELECT verificar_y_actualizar_secuencia_central('pdv_caja', 'pdv_caja_id_seq', 'financiero');

-- 26. financiero.maletin
SELECT verificar_y_actualizar_secuencia_central('maletin', 'maletin_id_seq', 'financiero');

-- =====================================================
-- VERIFICACIÓN FINAL DE SECUENCIAS
-- =====================================================

-- Mostrar el estado final de las secuencias principales
SELECT 
    'operaciones.venta' as tabla,
    (SELECT last_value FROM pg_sequences WHERE sequencename = 'venta_id_seq') as secuencia_venta,
    (SELECT MAX(id) FROM operaciones.venta) as max_venta
UNION ALL
SELECT 
    'operaciones.cobro',
    (SELECT last_value FROM pg_sequences WHERE sequencename = 'cobro_id_seq'),
    (SELECT MAX(id) FROM operaciones.cobro)
UNION ALL
SELECT 
    'operaciones.venta_item',
    (SELECT last_value FROM pg_sequences WHERE sequencename = 'venta_item_id_seq'),
    (SELECT MAX(id) FROM operaciones.venta_item)
UNION ALL
SELECT 
    'operaciones.cobro_detalle',
    (SELECT last_value FROM pg_sequences WHERE sequencename = 'cobro_detalle_id_seq'),
    (SELECT MAX(id) FROM operaciones.cobro_detalle)
UNION ALL
SELECT 
    'configuraciones.inicio_sesion',
    (SELECT last_value FROM pg_sequences WHERE sequencename = 'inicio_sesion_id_seq'),
    (SELECT MAX(id) FROM configuraciones.inicio_sesion);

-- =====================================================
-- LIMPIEZA
-- =====================================================

-- Eliminar la función temporal
DROP FUNCTION IF EXISTS verificar_y_actualizar_secuencia_central(text, text, text);

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Este script verifica cada tabla en central con filtro sucursal_id = 25
-- 2. Compara el máximo ID de central vs local y usa el mayor
-- 3. Actualiza la secuencia para que el próximo ID sea correcto
-- 4. Verifica que todas las secuencias se actualizaron correctamente
-- ===================================================== 