-- funcion para generar facturas nuevo metodo chatgpt 03
WITH fact_agg AS (
  SELECT 
    id,
    numero_factura,
    credito,
    ruc,
    nombre,
    creado_en,
    total_final,
    timbrado_detalle_id,
    sucursal_id,
    cliente_id,
    total_parcial_5,
    total_parcial_10,
    -- Compute amounts for 5% IVA:
    CASE 
      WHEN total_parcial_5 IS NOT NULL 
        THEN total_parcial_5 - (total_parcial_5 / 21)
      ELSE 0 
    END AS parcial_gra05,
    CASE 
      WHEN total_parcial_5 IS NOT NULL 
        THEN total_parcial_5 / 21
      ELSE 0 
    END AS parcial_iva05,
    -- Compute amounts for 10% IVA:
    CASE 
      WHEN total_parcial_10 IS NOT NULL 
        THEN total_parcial_10 - (total_parcial_10 / 11)
      ELSE 0 
    END AS parcial_gravad,
    CASE 
      WHEN total_parcial_10 IS NOT NULL 
        THEN total_parcial_10 / 11
      ELSE 0 
    END AS parcial_iva
  FROM financiero.factura_legal
  WHERE creado_en BETWEEN :fechaInicio AND :fechaFin
    AND sucursal_id = :id
)
SELECT 
  'I' AS ven_tipimp,
  SUM(fa.parcial_gra05) AS ven_gra05,
  SUM(fa.parcial_iva05) AS ven_iva05,
  'A' AS ven_disg05,
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
  'FACTURA' AS ven_tipofa,
  to_char(fa.creado_en, 'DD-MM-YYYY') AS ven_fecha,
  fa.total_final AS ven_totfac,
  '0' AS ven_exenta,
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
  '' AS anular,
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
    WHEN fa.ruc LIKE 'X' THEN 15 
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
-- The join to punto_de_venta has been removed to avoid duplicate rows.
JOIN personas.cliente c 
  ON fa.cliente_id = c.id
JOIN personas.persona p 
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
  fa.sucursal_id
ORDER BY fa.numero_factura;