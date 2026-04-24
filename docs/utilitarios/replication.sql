-- pasos para crear replicas en base de datos
-- configurar en ambos /var/lib/pgsql/13/data/postgresql.conf

sudo echo "wal_level = logical" | sudo tee -a /var/lib/pgsql/13/data/postgresql.conf && sudo systemctl restart postgresql-13
psql -U franco -p 5551 general -c "create publication filial5_pub for all tables" && sudo systemctl restart postgresql-13
psql -U franco -p 5551 postgres -c "create database filialDev"
psql -U franco -p 5552 -h localhost filial_dev_bkp -c "create subscription filialdevsub connection 'dbname=filialdev host=localhost user=franco password=franco port=5432' publication filialdevsub"

- eliminar subscription
-- buscar la subscription
psql -U franco filial1 -p 5551 -c "SELECT * FROM pg_stat_subscription;"
psql -U franco filial_dev_bkp -p 5551 -c "ALTER SUBSCRIPTION filial4_sub DISABLE;"
psql -U franco filial_dev_bkp  -c "SELECT pg_drop_replication_slot('filial5_bkp_sub');"
psql -U franco filial_dev_bkp  -c "ALTER SUBSCRIPTION filial5_bkp_sub SET (slot_name = NONE);"
psql -U franco filial_dev_bkp -p 5551 -c "DROP SUBSCRIPTION filial5_bkp_sub;"

-- buscar publicacion 
psql -U franco general -p 5551 -c "SELECT * FROM pg_publication;"

psql -U franco -p 5554 -h localhost filialdev -c "create subscription filial_dev_sub connection 'dbname=filial_dev_bkp host=localhost user=franco password=franco port=5552' publication filial_dev_bkp_pub"
psql -U franco -h localhost -p 5552 filial_dev_bkp -c "create publication filial_dev_bkp_pub for all tables" && sudo systemctl restart postgresql-13

CREATE SUBSCRIPTION filial4_sub
CONNECTION 'dbname=filial5 host=host.docker.internal user=franco password=franco port=5553'
PUBLICATION filial4_pub WITH (copy_data = false, origin = 'none');

CREATE SUBSCRIPTION filial5_sub
CONNECTION 'dbname=filial5_bkp host=host.docker.internal user=franco password=franco port=5552'
PUBLICATION filial5_bkp_pub WITH (copy_data = false, origin = NONE);




'administrativo.marcacion, ' ||
'configuraciones.inicio_sesion, ' ||
'financiero.cambio_caja, ' ||
'financiero.conteo, ' ||
'financiero.conteo_moneda, ' ||
'financiero.factura_legal, ' ||
'financiero.factura_legal_item, ' ||
'financiero.gasto, ' ||
'financiero.gasto_detalle, ' ||
'financiero.maletin, ' ||
'financiero.movimiento_caja, ' ||
'financiero.movimiento_personas, ' ||
'financiero.pdv_caja, ' ||
'financiero.retiro, ' ||
'financiero.retiro_detalle, ' ||
'financiero.sencillo, ' ||
'financiero.sencillo_detalle, ' ||
'financiero.venta_credito, ' ||
'financiero.venta_credito_cuota, ' ||
'operaciones.cobro, ' ||
'operaciones.cobro_detalle, ' ||
'operaciones.delivery, ' ||
'operaciones.movimiento_stock, ' ||
'operaciones.venta, ' ||
'operaciones.venta_item, ' ||
'operaciones.vuelto, ' ||
'operaciones.vuelto_item'


'configuraciones.actualizacion' ||
'configuraciones.local' ||
'empresarial.cargo' ||
'empresarial.configuracion_general' ||
'empresarial.punto_de_venta' ||
'empresarial.sector' ||
'empresarial.sucursal' ||
'empresarial.zona' ||
'equipos.equipo' ||
'equipos.tipo_equipo' ||
'financiero.banco' ||
'financiero.cambio' ||
'financiero.cuenta_bancaria' ||
'financiero.documento' ||
'financiero.forma_pago' ||
'financiero.moneda' ||
'financiero.moneda_billetes' ||
'financiero.timbrado' ||
'financiero.timbrado_detalle' ||
'financiero.tipo_gasto' ||
'general.barrio' ||
'general.ciudad' ||
'general.contacto' ||
'general.pais' ||
'operaciones.compra' ||
'operaciones.compra_item' ||
'operaciones.entrada' ||
'operaciones.entrada_item' ||
'operaciones.inventario' ||
'operaciones.inventario_producto' ||
'operaciones.inventario_producto_item' ||
'operaciones.motivo_diferencia_pedido' ||
'operaciones.necesidad' ||
'operaciones.necesidad_item' ||
'operaciones.nota_pedido' ||
'operaciones.nota_recepcion' ||
'operaciones.nota_recepcion_item' ||
'operaciones.pedido' ||
'operaciones.pedido_fecha_entrega' ||
'operaciones.pedido_item' ||
'operaciones.pedido_item_sucursal' ||
'operaciones.pedido_sucursal_entrega' ||
'operaciones.pedido_sucursal_influencia' ||
'operaciones.precio_delivery' ||
'operaciones.programar_precio' ||
'operaciones.salida' ||
'operaciones.salida_item' ||
'operaciones.sesion_inventario' ||
'operaciones.transferencia' ||
'operaciones.transferencia_item' ||
'personas.cliente' ||
'personas.cliente_adicional' ||
'personas.funcionario' ||
'personas.grupo_role' ||
'personas.persona' ||
'personas.pre_registro_funcionario' ||
'personas.proveedor' ||
'personas.proveedor_dias_visita' ||
'personas.role' ||
'personas.usuario' ||
'personas.usuario_grupo' ||
'personas.usuario_role' ||
'personas.vendedor' ||
'personas.vendedor_proveedor' ||
'productos.codigo' ||
'productos.codigo_tipo_precio' ||
'productos.costo_por_producto' ||
'productos.familia' ||
'productos.pdv_categoria' ||
'productos.pdv_grupo' ||
'productos.pdv_grupos_productos' ||
'productos.precio_por_sucursal' ||
'productos.presentacion' ||
'productos.producto' ||
'productos.producto_imagen' ||
'productos.producto_por_sucursal' ||
'productos.producto_proveedor' ||
'productos.subfamilia' ||
'productos.tipo_precio' ||
'productos.tipo_presentacion' ||
'vehiculos.marca' ||
'vehiculos.modelo' ||
'vehiculos.tipo_vehiculo' ||
'vehiculos.vehiculo' ||
'vehiculos.vehiculo_sucursal'