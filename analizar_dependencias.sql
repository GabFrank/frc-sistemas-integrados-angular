-- Script para analizar dependencias entre tablas
-- Ejecutar en bodega (172.25.1.200:5551)

-- 1. Tablas sin dependencias (NIVEL 0)
SELECT 'NIVEL 0 - SIN DEPENDENCIAS' as nivel, table_schema, table_name
FROM information_schema.tables t
WHERE table_schema IN ('administrativo', 'configuraciones', 'financiero', 'operaciones', 'personas', 'general', 'productos', 'equipos', 'empresarial', 'vehiculos')
AND table_type = 'BASE TABLE'
AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = t.table_schema
    AND tc.table_name = t.table_name
)
ORDER BY table_schema, table_name;

-- 2. Tablas con dependencias (mostrar qué dependen)
SELECT 
    tc.table_schema, 
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS depends_on_schema,
    ccu.table_name AS depends_on_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema IN ('administrativo', 'configuraciones', 'financiero', 'operaciones', 'personas', 'general', 'productos', 'equipos', 'empresarial', 'vehiculos')
ORDER BY tc.table_schema, tc.table_name, kcu.column_name; 