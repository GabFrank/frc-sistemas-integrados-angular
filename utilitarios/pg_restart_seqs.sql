TRUNCATE TABLE ONLY empresarial.punto_de_venta RESTART IDENTITY CASCADE;
TRUNCATE TABLE ONLY empresarial.sector RESTART IDENTITY CASCADE;
TRUNCATE TABLE ONLY financiero.conteo RESTART IDENTITY CASCADE;
TRUNCATE TABLE ONLY financiero.venta_credito RESTART IDENTITY CASCADE;
TRUNCATE TABLE ONLY operaciones.inventario RESTART IDENTITY CASCADE;
TRUNCATE TABLE ONLY operaciones.movimiento_stock RESTART IDENTITY CASCADE;
TRUNCATE TABLE ONLY operaciones.transferencia RESTART IDENTITY CASCADE;

ALTER SEQUENCE financiero.conteo_id_seq
	RESTART 1;
ALTER SEQUENCE empresarial.sector_id_seq
	RESTART 1;
ALTER SEQUENCE empresarial.zona_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.cambio_caja_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.conteo_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.conteo_moneda_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.factura_legal_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.factura_legal_item_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.gasto_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.gasto_detalle_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.movimiento_caja_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.movimiento_personas_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.pdv_caja_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.retiro_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.retiro_detalle_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.venta_credito_id_seq
	RESTART 1;
ALTER SEQUENCE financiero.venta_credito_cuota_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.cobro_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.cobro_detalle_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.delivery_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.entrada_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.entrada_item_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.inventario_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.inventario_producto_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.inventario_producto_item_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.movimiento_stock_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.necesidad_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.necesidad_item_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.nota_pedido_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.nota_recepcion_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.nota_recepcion_item_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.pedido_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.pedido_item_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.pedido_item_sucursal_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.salida_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.salida_item_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.transferencia_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.transferencia_item_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.venta_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.venta_item_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.vuelto_id_seq
	RESTART 1;
ALTER SEQUENCE operaciones.vuelto_item_id_seq
	RESTART 1;