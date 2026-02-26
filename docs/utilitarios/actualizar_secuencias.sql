-- =====================================================
-- ACTUALIZACIÓN DE SECUENCIAS DESPUÉS DE CARGA DE DATOS
-- =====================================================
-- Fecha: $(date)
-- Objetivo: Actualizar todas las secuencias para que coincidan con los valores máximos de ID
-- Base: general (172.25.1.25:5551)
-- =====================================================

-- Función para actualizar secuencia de una tabla
CREATE OR REPLACE FUNCTION actualizar_secuencia(nombre_tabla text, nombre_secuencia text)
RETURNS void AS $$
DECLARE
    max_id bigint;
    sql_query text;
BEGIN
    -- Obtener el máximo ID de la tabla
    sql_query := 'SELECT COALESCE(MAX(id), 0) FROM ' || nombre_tabla;
    EXECUTE sql_query INTO max_id;
    
    -- Actualizar la secuencia
    EXECUTE 'SELECT setval(''' || nombre_secuencia || ''', ' || (max_id + 1) || ', false)';
    
    RAISE NOTICE 'Tabla: %, Máximo ID: %, Secuencia actualizada: %', nombre_tabla, max_id, nombre_secuencia;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ACTUALIZACIÓN DE SECUENCIAS POR TABLA
-- =====================================================

-- 1. financiero.gasto_detalle
SELECT actualizar_secuencia('financiero.gasto_detalle', 'financiero.gasto_detalle_id_seq');

-- 2. financiero.retiro_detalle
SELECT actualizar_secuencia('financiero.retiro_detalle', 'financiero.retiro_detalle_id_seq');

-- 3. financiero.sencillo_detalle
SELECT actualizar_secuencia('financiero.sencillo_detalle', 'financiero.sencillo_detalle_id_seq');

-- 4. financiero.conteo_moneda
SELECT actualizar_secuencia('financiero.conteo_moneda', 'financiero.conteo_moneda_id_seq');

-- 5. financiero.factura_legal_item
SELECT actualizar_secuencia('financiero.factura_legal_item', 'financiero.factura_legal_item_id_seq');

-- 6. operaciones.cobro_detalle
SELECT actualizar_secuencia('operaciones.cobro_detalle', 'operaciones.cobro_detalle_id_seq');

-- 7. operaciones.venta_item
SELECT actualizar_secuencia('operaciones.venta_item', 'operaciones.venta_item_id_seq');

-- 8. operaciones.vuelto_item
SELECT actualizar_secuencia('operaciones.vuelto_item', 'operaciones.vuelto_item_id_seq');

-- 9. operaciones.venta_observacion
SELECT actualizar_secuencia('operaciones.venta_observacion', 'operaciones.venta_observacion_id_seq');

-- 10. financiero.caja_observacion
SELECT actualizar_secuencia('financiero.caja_observacion', 'financiero.caja_observacion_id_seq');

-- 11. financiero.gasto
SELECT actualizar_secuencia('financiero.gasto', 'financiero.gasto_id_seq');

-- 12. financiero.retiro
SELECT actualizar_secuencia('financiero.retiro', 'financiero.retiro_id_seq');

-- 13. financiero.sencillo
SELECT actualizar_secuencia('financiero.sencillo', 'financiero.sencillo_id_seq');

-- 14. financiero.conteo
SELECT actualizar_secuencia('financiero.conteo', 'financiero.conteo_id_seq');

-- 15. financiero.factura_legal
SELECT actualizar_secuencia('financiero.factura_legal', 'financiero.factura_legal_id_seq');

-- 16. operaciones.cobro
SELECT actualizar_secuencia('operaciones.cobro', 'operaciones.cobro_id_seq');

-- 17. operaciones.vuelto
SELECT actualizar_secuencia('operaciones.vuelto', 'operaciones.vuelto_id_seq');

-- 18. operaciones.delivery
SELECT actualizar_secuencia('operaciones.delivery', 'operaciones.delivery_id_seq');

-- 19. operaciones.venta
SELECT actualizar_secuencia('operaciones.venta', 'operaciones.venta_id_seq');

-- 20. operaciones.movimiento_stock
SELECT actualizar_secuencia('operaciones.movimiento_stock', 'operaciones.movimiento_stock_id_seq');

-- 21. financiero.movimiento_caja
SELECT actualizar_secuencia('financiero.movimiento_caja', 'financiero.movimiento_caja_id_seq');

-- 22. financiero.venta_credito_cuota
SELECT actualizar_secuencia('financiero.venta_credito_cuota', 'financiero.venta_credito_cuota_id_seq');

-- 23. financiero.venta_credito
SELECT actualizar_secuencia('financiero.venta_credito', 'financiero.venta_credito_id_seq');

-- 24. administrativo.marcacion
SELECT actualizar_secuencia('administrativo.marcacion', 'administrativo.marcacion_id_seq');

-- 25. configuraciones.inicio_sesion
SELECT actualizar_secuencia('configuraciones.inicio_sesion', 'configuraciones.inicio_sesion_id_seq');

-- 26. financiero.cambio_caja
SELECT actualizar_secuencia('financiero.cambio_caja', 'financiero.cambio_caja_id_seq');

-- 27. financiero.pdv_caja
SELECT actualizar_secuencia('financiero.pdv_caja', 'financiero.pdv_caja_id_seq');

-- 28. financiero.maletin
SELECT actualizar_secuencia('financiero.maletin', 'financiero.maletin_id_seq');

-- =====================================================
-- VERIFICACIÓN DE SECUENCIAS ACTUALIZADAS
-- =====================================================

-- Mostrar el estado final de todas las secuencias
SELECT 
    schemaname,
    sequencename,
    last_value,
    start_value,
    increment_by,
    max_value,
    min_value,
    cache_value,
    is_cycled,
    is_called
FROM pg_sequences 
WHERE schemaname IN ('administrativo', 'configuraciones', 'financiero', 'operaciones')
AND sequencename IN (
    'gasto_detalle_id_seq',
    'retiro_detalle_id_seq',
    'sencillo_detalle_id_seq',
    'conteo_moneda_id_seq',
    'factura_legal_item_id_seq',
    'cobro_detalle_id_seq',
    'venta_item_id_seq',
    'vuelto_item_id_seq',
    'venta_observacion_id_seq',
    'caja_observacion_id_seq',
    'gasto_id_seq',
    'retiro_id_seq',
    'sencillo_id_seq',
    'conteo_id_seq',
    'factura_legal_id_seq',
    'cobro_id_seq',
    'vuelto_id_seq',
    'delivery_id_seq',
    'venta_id_seq',
    'movimiento_stock_id_seq',
    'movimiento_caja_id_seq',
    'venta_credito_cuota_id_seq',
    'venta_credito_id_seq',
    'marcacion_id_seq',
    'inicio_sesion_id_seq',
    'cambio_caja_id_seq',
    'pdv_caja_id_seq',
    'maletin_id_seq'
)
ORDER BY schemaname, sequencename;

-- =====================================================
-- LIMPIEZA
-- =====================================================

-- Eliminar la función temporal
DROP FUNCTION IF EXISTS actualizar_secuencia(text, text);

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Este script actualiza las secuencias para que el próximo ID generado sea correcto
-- 2. Se usa setval con 'false' para que el próximo valor sea el especificado
-- 3. Se suma 1 al máximo ID para que el próximo registro tenga el ID correcto
-- 4. Verificar que todas las secuencias se actualizaron correctamente
-- ===================================================== 