-- =====================================================
-- CORRECCIÓN DE NUMERACIÓN DE FACTURAS INCORRECTAS
-- Base de Datos: postgresql-farmacia
-- Fecha: 2025-08-29
-- =====================================================

-- =====================================================
-- ANÁLISIS DEL PROBLEMA
-- =====================================================

/*
PROBLEMA IDENTIFICADO:
Los timbrado_detalle 4, 5 y 6 tienen números de factura incorrectos que se reiniciaron
después de las últimas facturas correctas, causando duplicaciones y regresiones.

ÚLTIMAS FACTURAS CORRECTAS:
- Timbrado Detalle 4: ID 28522, Número 10028, Fecha 2025-04-28 13:42:14
- Timbrado Detalle 5: ID 13672, Número 5156,  Fecha 2025-04-28 12:42:12  
- Timbrado Detalle 6: ID 14806, Número 5631,  Fecha 2025-04-28 12:37:26

FACTURAS INCORRECTAS:
- Timbrado Detalle 4: 5,727 facturas (IDs 28523-34280)
- Timbrado Detalle 5: 3,320 facturas (IDs 13673-16991)
- Timbrado Detalle 6: 2,610 facturas (IDs 14807-17416)
*/

-- =====================================================
-- QUERY DE VERIFICACIÓN ANTES DE LA CORRECCIÓN
-- =====================================================

-- Verificar el estado actual antes de la corrección
WITH ultima_correcta AS (
    SELECT 
        4 as timbrado_detalle_id, 28522 as ultimo_id_correcto, 10028 as ultimo_numero_correcto
    UNION ALL
    SELECT 5, 13672, 5156
    UNION ALL
    SELECT 6, 14806, 5631
),
facturas_incorrectas AS (
    SELECT 
        fl.timbrado_detalle_id,
        COUNT(*) as total_facturas_incorrectas,
        MIN(fl.id) as primer_id_incorrecto,
        MAX(fl.id) as ultimo_id_incorrecto,
        MIN(fl.numero_factura::int) as numero_minimo_incorrecto,
        MAX(fl.numero_factura::int) as numero_maximo_incorrecto
    FROM financiero.factura_legal fl
    JOIN ultima_correcta uc ON fl.timbrado_detalle_id = uc.timbrado_detalle_id
    WHERE fl.activo = true
        AND fl.id > uc.ultimo_id_correcto
    GROUP BY fl.timbrado_detalle_id
)
SELECT 
    'ANTES DE LA CORRECCIÓN' as estado,
    timbrado_detalle_id,
    total_facturas_incorrectas,
    primer_id_incorrecto,
    ultimo_id_incorrecto,
    numero_minimo_incorrecto,
    numero_maximo_incorrecto
FROM facturas_incorrectas
ORDER BY timbrado_detalle_id;

-- =====================================================
-- QUERY PRINCIPAL DE CORRECCIÓN
-- =====================================================

-- CORRECCIÓN DE NUMERACIÓN DE FACTURAS INCORRECTAS
UPDATE financiero.factura_legal 
SET numero_factura = (
    CASE 
        WHEN timbrado_detalle_id = 4 THEN 
            (10028 + ROW_NUMBER() OVER (PARTITION BY timbrado_detalle_id ORDER BY id))
        WHEN timbrado_detalle_id = 5 THEN 
            (5156 + ROW_NUMBER() OVER (PARTITION BY timbrado_detalle_id ORDER BY id))
        WHEN timbrado_detalle_id = 6 THEN 
            (5631 + ROW_NUMBER() OVER (PARTITION BY timbrado_detalle_id ORDER BY id))
    END
)
WHERE activo = true 
    AND (
        (timbrado_detalle_id = 4 AND id > 28522) OR
        (timbrado_detalle_id = 5 AND id > 13672) OR
        (timbrado_detalle_id = 6 AND id > 14806)
    );

-- =====================================================
-- ACTUALIZACIÓN DEL CAMPO numero_actual EN timbrado_detalle
-- =====================================================

-- Actualizar el campo numero_actual para que coincida con la última factura corregida
UPDATE financiero.timbrado_detalle 
SET numero_actual = CASE 
    WHEN id = 4 THEN 10029  -- Siguiente número después de 10028
    WHEN id = 5 THEN 5157   -- Siguiente número después de 5156
    WHEN id = 6 THEN 5632   -- Siguiente número después de 5631
END
WHERE id IN (4, 5, 6);

-- =====================================================
-- QUERY DE VERIFICACIÓN DESPUÉS DE LA CORRECCIÓN
-- =====================================================

-- Verificar el estado después de la corrección
WITH ultima_correcta AS (
    SELECT 
        4 as timbrado_detalle_id, 28522 as ultimo_id_correcto, 10028 as ultimo_numero_correcto
    UNION ALL
    SELECT 5, 13672, 5156
    UNION ALL
    SELECT 6, 14806, 5631
),
facturas_corregidas AS (
    SELECT 
        fl.timbrado_detalle_id,
        COUNT(*) as total_facturas_corregidas,
        MIN(fl.id) as primer_id_corregido,
        MAX(fl.id) as ultimo_id_corregido,
        MIN(fl.numero_factura::int) as numero_minimo_corregido,
        MAX(fl.numero_factura::int) as numero_maximo_corregido
    FROM financiero.factura_legal fl
    JOIN ultima_correcta uc ON fl.timbrado_detalle_id = uc.timbrado_detalle_id
    WHERE fl.activo = true
        AND fl.id > uc.ultimo_id_correcto
    GROUP BY fl.timbrado_detalle_id
)
SELECT 
    'DESPUÉS DE LA CORRECCIÓN' as estado,
    timbrado_detalle_id,
    total_facturas_corregidas,
    primer_id_corregido,
    ultimo_id_corregido,
    numero_minimo_corregido,
    numero_maximo_corregido
FROM facturas_corregidas
ORDER BY timbrado_detalle_id;

-- =====================================================
-- VERIFICACIÓN FINAL DE CONSISTENCIA
-- =====================================================

-- Verificar que no hay duplicados después de la corrección
SELECT 
    timbrado_detalle_id,
    numero_factura,
    COUNT(*) as cantidad_duplicados
FROM financiero.factura_legal 
WHERE activo = true
    AND timbrado_detalle_id IN (4, 5, 6)
GROUP BY timbrado_detalle_id, numero_factura
HAVING COUNT(*) > 1
ORDER BY timbrado_detalle_id, numero_factura;

-- Verificar la secuencia de números después de la corrección
SELECT 
    timbrado_detalle_id,
    MIN(numero_factura::int) as numero_minimo,
    MAX(numero_factura::int) as numero_maximo,
    COUNT(*) as total_facturas
FROM financiero.factura_legal 
WHERE activo = true
    AND timbrado_detalle_id IN (4, 5, 6)
GROUP BY timbrado_detalle_id
ORDER BY timbrado_detalle_id;

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN
-- =====================================================

/*
INSTRUCCIONES PARA EJECUTAR ESTE SCRIPT:

1. HACER BACKUP DE LA BASE DE DATOS ANTES DE EJECUTAR
2. Ejecutar en orden secuencial:
   - Primero la query de verificación "ANTES DE LA CORRECCIÓN"
   - Luego la query principal de corrección (UPDATE)
   - Luego la actualización de timbrado_detalle.numero_actual
   - Finalmente las queries de verificación "DESPUÉS DE LA CORRECCIÓN"

3. VERIFICAR que no hay errores en la ejecución
4. CONFIRMAR que los números de factura son consecutivos y sin duplicados

NOTA: Este script corregirá 11,657 facturas en total:
- Timbrado Detalle 4: 5,727 facturas
- Timbrado Detalle 5: 3,320 facturas  
- Timbrado Detalle 6: 2,610 facturas
*/
