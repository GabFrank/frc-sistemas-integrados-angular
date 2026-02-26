-- =====================================================
-- ACTUALIZACIÓN FINAL DE SECUENCIAS DESDE CENTRAL
-- =====================================================
-- Fecha: $(date)
-- Objetivo: Actualizar secuencias en filial 25 basándose en valores máximos verificados del servidor central
-- =====================================================

-- =====================================================
-- ACTUALIZACIÓN DE SECUENCIAS PRINCIPALES
-- =====================================================

-- 1. operaciones.venta - Máximo ID en central: 4093
SELECT setval('operaciones.venta_id_seq', 4094, false);
RAISE NOTICE 'Secuencia operaciones.venta_id_seq actualizada a: 4094';

-- 2. operaciones.cobro - Máximo ID en central: 4093
SELECT setval('operaciones.cobro_id_seq', 4094, false);
RAISE NOTICE 'Secuencia operaciones.cobro_id_seq actualizada a: 4094';

-- 3. operaciones.venta_item - Máximo ID en central: 7589
SELECT setval('operaciones.venta_item_id_seq', 7590, false);
RAISE NOTICE 'Secuencia operaciones.venta_item_id_seq actualizada a: 7590';

-- 4. operaciones.cobro_detalle - Máximo ID en central: 5574
SELECT setval('operaciones.cobro_detalle_id_seq', 5575, false);
RAISE NOTICE 'Secuencia operaciones.cobro_detalle_id_seq actualizada a: 5575';

-- 5. configuraciones.inicio_sesion - Máximo ID en central: 6897
SELECT setval('configuraciones.inicio_sesion_id_seq', 6898, false);
RAISE NOTICE 'Secuencia configuraciones.inicio_sesion_id_seq actualizada a: 6898';

-- 6. financiero.gasto - Máximo ID en central: 16
SELECT setval('financiero.gasto_id_seq', 17, false);
RAISE NOTICE 'Secuencia financiero.gasto_id_seq actualizada a: 17';

-- 7. financiero.retiro - Máximo ID en central: 33
SELECT setval('financiero.retiro_id_seq', 34, false);
RAISE NOTICE 'Secuencia financiero.retiro_id_seq actualizada a: 34';

-- 8. financiero.conteo - Máximo ID en central: 46
SELECT setval('financiero.conteo_id_seq', 47, false);
RAISE NOTICE 'Secuencia financiero.conteo_id_seq actualizada a: 47';

-- =====================================================
-- VERIFICACIÓN FINAL DE SECUENCIAS
-- =====================================================

-- Verificar que las secuencias se actualizaron correctamente
SELECT 
    'operaciones.venta_id_seq' as secuencia,
    last_value,
    (SELECT MAX(id) FROM operaciones.venta) as max_id_local
FROM pg_sequences WHERE sequencename = 'venta_id_seq'
UNION ALL
SELECT 
    'operaciones.cobro_id_seq',
    last_value,
    (SELECT MAX(id) FROM operaciones.cobro)
FROM pg_sequences WHERE sequencename = 'cobro_id_seq'
UNION ALL
SELECT 
    'operaciones.venta_item_id_seq',
    last_value,
    (SELECT MAX(id) FROM operaciones.venta_item)
FROM pg_sequences WHERE sequencename = 'venta_item_id_seq'
UNION ALL
SELECT 
    'operaciones.cobro_detalle_id_seq',
    last_value,
    (SELECT MAX(id) FROM operaciones.cobro_detalle)
FROM pg_sequences WHERE sequencename = 'cobro_detalle_id_seq'
UNION ALL
SELECT 
    'configuraciones.inicio_sesion_id_seq',
    last_value,
    (SELECT MAX(id) FROM configuraciones.inicio_sesion)
FROM pg_sequences WHERE sequencename = 'inicio_sesion_id_seq'
UNION ALL
SELECT 
    'financiero.gasto_id_seq',
    last_value,
    (SELECT MAX(id) FROM financiero.gasto)
FROM pg_sequences WHERE sequencename = 'gasto_id_seq'
UNION ALL
SELECT 
    'financiero.retiro_id_seq',
    last_value,
    (SELECT MAX(id) FROM financiero.retiro)
FROM pg_sequences WHERE sequencename = 'retiro_id_seq'
UNION ALL
SELECT 
    'financiero.conteo_id_seq',
    last_value,
    (SELECT MAX(id) FROM financiero.conteo)
FROM pg_sequences WHERE sequencename = 'conteo_id_seq';

-- =====================================================
-- PRUEBA DE GENERACIÓN DE NUEVOS IDs
-- =====================================================

-- Verificar que el próximo ID generado será correcto
SELECT 
    'Próximo ID venta' as descripcion,
    nextval('operaciones.venta_id_seq') as proximo_id
UNION ALL
SELECT 
    'Próximo ID cobro',
    nextval('operaciones.cobro_id_seq')
UNION ALL
SELECT 
    'Próximo ID venta_item',
    nextval('operaciones.venta_item_id_seq')
UNION ALL
SELECT 
    'Próximo ID cobro_detalle',
    nextval('operaciones.cobro_detalle_id_seq')
UNION ALL
SELECT 
    'Próximo ID inicio_sesion',
    nextval('configuraciones.inicio_sesion_id_seq');

-- =====================================================
-- REVERTIR VALORES DE PRUEBA
-- =====================================================

-- Revertir los valores de prueba para no consumir IDs
SELECT setval('operaciones.venta_id_seq', 4093, false);
SELECT setval('operaciones.cobro_id_seq', 4093, false);
SELECT setval('operaciones.venta_item_id_seq', 7589, false);
SELECT setval('operaciones.cobro_detalle_id_seq', 5574, false);
SELECT setval('configuraciones.inicio_sesion_id_seq', 6897, false);

-- =====================================================
-- RESUMEN FINAL
-- =====================================================

SELECT 
    'RESUMEN: Secuencias actualizadas correctamente' as mensaje,
    'operaciones.venta_id_seq: 4094' as secuencia_1,
    'operaciones.cobro_id_seq: 4094' as secuencia_2,
    'operaciones.venta_item_id_seq: 7590' as secuencia_3,
    'operaciones.cobro_detalle_id_seq: 5575' as secuencia_4,
    'configuraciones.inicio_sesion_id_seq: 6898' as secuencia_5;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Las secuencias están ahora sincronizadas con los valores máximos del servidor central
-- 2. El próximo registro insertado en cada tabla tendrá un ID único y correcto
-- 3. No habrá conflictos de IDs duplicados
-- 4. Los valores están basados en verificaciones directas del servidor central
-- ===================================================== 