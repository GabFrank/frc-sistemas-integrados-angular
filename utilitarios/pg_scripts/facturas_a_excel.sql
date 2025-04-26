UPDATE financiero.factura_legal 
SET 
total_parcial_10=subquery.facTotal10, 
total_parcial_5=subquery.facTotal5, 
total_final=subquery.facTotal5 + subquery.facTotal10,
iva_parcial_5=subquery.facTotal5 / 21,
iva_parcial_10=subquery.facTotal10 / 11
FROM (
	select 
	sum(case when pro.iva='10' then (fli.total::numeric) else 0 end) as facTotal10,
	sum(case when pro.iva='5' then fli.total::numeric else 0 end) as facTotal5,
	f.id::numeric as fac_id
	from financiero.factura_legal f 
	join financiero.factura_legal_item fli on f.id = fli.factura_legal_id and f.sucursal_id = fli.sucursal_id
	join productos.producto pro on fli.descripcion = pro.descripcion
	where f.sucursal_id = 1 and f.creado_en > '2023-03-01 00:00:00'
	group by f.id
) AS subquery
WHERE factura_legal.id = subquery.fac_id and factura_legal.sucursal_id = 1 and factura_legal.creado_en > '2023-03-01 00:00:00';

select 
('I') as ven_tipimp	
,sum(
	CASE WHEN f.total_parcial_5 notnull THEN f.total_parcial_5 - f.total_parcial_5 / 21 else 0
    END
	) as ven_gra05	
,sum(
	CASE WHEN f.total_parcial_5 notnull THEN f.total_parcial_5 / 21 else 0
    END
	) as ven_iva05	
,('') as ven_disg05	
,('') as cta_iva05	
,('') as ven_rubgra	
,('') as ven_rubg05	
,('') as ven_disexe	
,(concat(s.codigo_establecimiento_factura, '-', td.punto_expedicion, '-', 
	case when length(cast(f.numero_factura as text)) = 1 then '000000'
		 when length(cast(f.numero_factura as text)) = 2 then '00000'
		 when length(cast(f.numero_factura as text)) = 3 then '0000'
		 when length(cast(f.numero_factura as text)) = 4 then '000'
		 when length(cast(f.numero_factura as text)) = 5 then '00'
		 when length(cast(f.numero_factura as text)) = 6 then '0' end,
f.numero_factura)) as ven_numero	
,('') as ven_imputa	
,(s.codigo_establecimiento_factura) as ven_sucurs	
,('') as generar	
,(case when f.credito = true then 'CREDITO' else 'CONTADO' end) as form_pag	
,('') as ven_centro	
,(f.ruc) as ven_provee	
,('') as ven_cuenta	
,(f.nombre) as ven_prvnom	
,('FACTURA') as ven_tipofa	
,(substring(cast(to_char(f.creado_en, 'DD-MM-YYYY') as text) from 0 for 11)) as ven_fecha	
,f.total_final as ven_totfac	
,('0') as ven_exenta	
,sum(
	CASE WHEN f.total_parcial_10 notnull THEN f.total_parcial_10 - f.total_parcial_10 / 11 else 0
    END
	)as ven_gravad  	
,sum(
	CASE WHEN f.total_parcial_10 notnull THEN f.total_parcial_10 / 11 else 0
    END
	) as ven_iva 
,('') ven_retenc	
,('') as ven_aux	
,('') as ven_ctrl	
,('') as ven_con	
,('0') as ven_cuota	
,(substring(cast(to_char(f.creado_en, 'DD-MM-YYYY') as text) from 0 for 11)) as ven_fecven	
,('') as cant_dias	
,('') as origen	
,('') as cambio	
,('') as valor	
,('') as moneda	
,('') as exen_dolar	
,('') as concepto	
,('') as cta_iva	
,('') as cta_caja	
,('') as tkdesde	
,('') as tkhasta	
,('') as caja	
,('') as ven_disgra	
,('') as forma_devo	
,('') as ven_cuense	
,('') as anular	
,('') as reproceso	
,('') as cuenta_exe	
,('') as usu_ide	
,(t.numero) as rucvennrotim	
,('') as clieasi	
,('') as ventirptip	
,('') as ventirpgra	
,('') as ventirpexe	
,('') as irpc	
,('') as ivasimplificado	
,('') as venIRPrygc	
,('') as VenBcoNom	
,('') as VenBcoCtaCte	
,('') as nofacnotcre	
,('') as notimbfacnotcre	
,('') as ventipodoc	
,('') as VentaNoIva	
,('') as IdentifClie	
,('') as GDCBIENID	
,('') as GDCTIPOBIEN	
,('') as GDCIMPCOSTO	
,('') as GDCIMPVENTAGRAV
from financiero.factura_legal f
left join financiero.timbrado_detalle td on f.timbrado_detalle_id = td.id 
left join financiero.timbrado t on td.timbrado_id = t.id 
left join empresarial.punto_de_venta pdv on td.punto_de_venta_id = pdv.id
left join empresarial.sucursal s on pdv.sucursal_id = s.id
where 
	f.creado_en between '2023-11-01 00:00:00' and '2023-12-01 00:00:00' and
	s.id = 1
group by td.punto_expedicion, s.codigo_establecimiento_factura,f.numero_factura, f.credito, f.ruc, f.nombre, f.creado_en, f.total_final, t.numero
order by f.numero_factura;

UPDATE financiero.factura_legal
SET ruc = LEFT(ruc, LENGTH(ruc) - 2)
WHERE creado_en > '2023-10-01 00:00:00'
AND ruc LIKE '%-%-%';

select distinct(fl.timbrado_detalle_id), count(fl.id), min(fl.numero_factura), max(fl.numero_factura),  max(fl.numero_factura) - min(fl.numero_factura) from financiero.factura_legal fl 
where fl.creado_en between '2023-11-01 00:00:00' and '2023-12-01 00:00:00' and fl.sucursal_id = 1 group by fl.timbrado_detalle_id;

select * from financiero.factura_legal fl 
join financiero.factura_legal fl2 on fl2.id <> fl.id and fl.timbrado_detalle_id = fl2.timbrado_detalle_id and fl.numero_factura = fl2.numero_factura
where fl.creado_en between '2023-11-01 00:00:00' and '2023-12-01 00:00:00' and fl.sucursal_id = 1;


