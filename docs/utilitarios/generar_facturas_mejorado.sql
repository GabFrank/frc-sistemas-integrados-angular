-- funcion para generar facturas nuevo metodo chatgpt 03 - MEJORADO
-- Incluye soporte para documentos electrónicos y detección de facturas canceladas/anuladas/rechazadas

WITH fact_agg AS (
  SELECT 
    fl.id,
    fl.numero_factura,
    fl.credito,
    fl.ruc,
    fl.nombre,
    fl.creado_en,
    fl.total_final,
    fl.timbrado_detalle_id,
    fl.sucursal_id,
    fl.cliente_id,
    fl.total_parcial_5,
    fl.total_parcial_10,
    fl.total_parcial_0,
    fl.venta_id,
    -- Obtener información del documento electrónico (si existe)
    (SELECT de.id 
     FROM financiero.documento_electronico de
     WHERE de.factura_legal_id = fl.id
       AND de.sucursal_id = fl.sucursal_id
       AND de.activo = true
     ORDER BY de.creado_en DESC
     LIMIT 1) AS de_id,
    (SELECT de.estado 
     FROM financiero.documento_electronico de
     WHERE de.factura_legal_id = fl.id
       AND de.sucursal_id = fl.sucursal_id
       AND de.activo = true
     ORDER BY de.creado_en DESC
     LIMIT 1) AS de_estado,
    -- Obtener estado de la venta (si existe)
    (SELECT v.estado 
     FROM operaciones.venta v
     WHERE v.id = fl.venta_id
       AND v.sucursal_id = fl.sucursal_id) AS venta_estado,
    -- Compute amounts for 5% IVA:
    CASE 
      WHEN fl.total_parcial_5 IS NOT NULL 
        THEN fl.total_parcial_5 - (fl.total_parcial_5 / 21)
      ELSE 0 
    END AS parcial_gra05,
    CASE 
      WHEN fl.total_parcial_5 IS NOT NULL 
        THEN fl.total_parcial_5 / 21
      ELSE 0 
    END AS parcial_iva05,
    -- Compute amounts for 10% IVA:
    CASE 
      WHEN fl.total_parcial_10 IS NOT NULL 
        THEN fl.total_parcial_10 - (fl.total_parcial_10 / 11)
      ELSE 0 
    END AS parcial_gravad,
    CASE 
      WHEN fl.total_parcial_10 IS NOT NULL 
        THEN fl.total_parcial_10 / 11
      ELSE 0 
    END AS parcial_iva
  FROM financiero.factura_legal fl
  WHERE fl.creado_en BETWEEN :fechaInicio AND :fechaFin
    AND fl.sucursal_id = :id 
    AND fl.activo IS FALSE
)
SELECT 
  'I' AS ven_tipimp,
  SUM(fa.parcial_gra05) AS ven_gra05,
  SUM(fa.parcial_iva05) AS ven_iva05,
  'B' AS ven_disg05,
  '' AS cta_iva05,
  '1' AS ven_rubgra,
  '1' AS ven_rubg05,
  '' AS ven_disexe,
  -- Build invoice number using LPAD for uniform 7-digit formatting:
  CONCAT(s.codigo_establecimiento_factura, '-', td.punto_expedicion, '-', LPAD(fa.numero_factura::text, 7, '0')) AS ven_numero,
  '' AS ven_imputa,
  s.codigo_establecimiento_factura AS ven_sucurs,
  '' AS generar,
  CASE WHEN fa.credito = true THEN 'CREDITO' ELSE 'CONTADO' END AS form_pag,
  '' AS ven_centro,
  CASE 
    WHEN c.tributa 
      THEN COALESCE(c.ruc, fa.ruc)
    ELSE 
      CASE WHEN fa.cliente_id IS NULL THEN fa.ruc ELSE p.documento END
  END AS ven_provee,
  '' AS ven_cuenta,
  CASE 
    WHEN c.tributa 
      THEN COALESCE(c.razon_social, fa.nombre)
    ELSE 
      CASE WHEN fa.cliente_id IS NULL THEN fa.nombre ELSE p.nombre END
  END AS ven_prvnom,
  -- Determinar si es factura electrónica basado en existencia de documento electrónico
  CASE 
    WHEN fa.de_id IS NOT NULL THEN 'Factura Electrónica'
    ELSE 'FACTURA'
  END AS ven_tipofa,
  to_char(fa.creado_en, 'DD/MM/YYYY') AS ven_fecha,
  fa.total_final AS ven_totfac,
  fa.total_parcial_0 AS ven_exenta,
  SUM(fa.parcial_gravad) AS ven_gravad,
  SUM(fa.parcial_iva) AS ven_iva,
  '' AS ven_retenc,
  '' AS ven_aux,
  '' AS ven_ctrl,
  '' AS ven_con,
  '0' AS ven_cuota,
  to_char(fa.creado_en, 'DD-MM-YYYY') AS ven_fecven,
  '' AS cant_dias,
  '' AS origen,
  '' AS cambio,
  '' AS valor,
  '' AS moneda,
  '' AS exen_dolar,
  '' AS concepto,
  '' AS cta_iva,
  '' AS cta_caja,
  '' AS tkdesde,
  '' AS tkhasta,
  '' AS caja,
  'A' AS ven_disgra,
  '' AS forma_devo,
  '' AS ven_cuense,
  -- Determinar si la factura debe ser anulada:
  -- 1. Si tiene venta vinculada y la venta está CANCELADA
  -- 2. Si tiene documento electrónico y el estado es CANCELADO o RECHAZADO
  CASE 
    WHEN (fa.venta_id IS NOT NULL AND fa.venta_estado = 'CANCELADA') 
         OR (fa.de_id IS NOT NULL AND fa.de_estado IN ('CANCELADO', 'RECHAZADO'))
      THEN '1'
    ELSE ''
  END AS anular,
  '' AS reproceso,
  '' AS cuenta_exe,
  '' AS usu_ide,
  t.numero AS rucvennrotim,
  '' AS clieasi,
  '' AS ventirptip,
  '' AS ventirpgra,
  '' AS ventirpexe,
  '1' AS irpc,
  '' AS ivasimplificado,
  '' AS venIRPrygc,
  '' AS VenBcoNom,
  '' AS VenBcoCtaCte,
  '' AS nofacnotcre,
  '' AS notimbfacnotcre,
  '' AS ventipodoc,
  '' AS VentaNoIva,
  CASE 
    WHEN fa.ruc LIKE 'X%' THEN 15 
    ELSE 
      CASE WHEN c.tributa = false THEN 12 ELSE 11 END 
  END AS IdentifClie,
  '' AS GDCBIENID,
  '' AS GDCTIPOBIEN,
  '' AS GDCIMPCOSTO,
  '' AS GDCIMPVENTAGRAV
FROM fact_agg fa
JOIN financiero.timbrado_detalle td 
  ON fa.timbrado_detalle_id = td.id 
 AND fa.sucursal_id = td.sucursal_id
JOIN financiero.timbrado t 
  ON td.timbrado_id = t.id 
JOIN empresarial.sucursal s 
  ON fa.sucursal_id = s.id
-- LEFT JOIN con cliente y persona para incluir todas las facturas, incluso sin cliente
LEFT JOIN personas.cliente c 
  ON fa.cliente_id = c.id
LEFT JOIN personas.persona p 
  ON c.persona_id = p.id
WHERE s.id = :id
GROUP BY 
  td.punto_expedicion, 
  s.codigo_establecimiento_factura, 
  fa.numero_factura, 
  fa.credito, 
  fa.ruc, 
  fa.nombre, 
  fa.creado_en, 
  fa.total_final, 
  t.numero, 
  c.tributa, 
  c.ruc, 
  c.razon_social, 
  p.documento, 
  p.nombre, 
  fa.cliente_id, 
  fa.sucursal_id,
  fa.total_parcial_0,
  fa.de_id,
  fa.de_estado,
  fa.venta_id,
  fa.venta_estado
ORDER BY fa.numero_factura;

