
-- 1. Queries Related to Publications

-- Create a Publication
CREATE PUBLICATION publication_name
FOR TABLE table1, table2;

-- Create a publication with row filtering
CREATE PUBLICATION publication_name
FOR TABLE table1 WHERE condition;

-- Select Information About Publications
SELECT * FROM pg_publication;

-- View specific publication details
SELECT * FROM pg_publication WHERE pubname = 'publication_name';

-- Alter a Publication
ALTER PUBLICATION publication_name ADD TABLE table3;
ALTER PUBLICATION publication_name DROP TABLE table1;
ALTER PUBLICATION publication_name SET TABLE table1 WHERE new_condition;

-- Drop a Publication
DROP PUBLICATION publication_name;


-- 2. Queries Related to Subscriptions

-- Create a Subscription
CREATE SUBSCRIPTION subscription_name
CONNECTION 'host=cloud_server_ip dbname=cloud_db user=replication_user password=your_password'
PUBLICATION publication_name;

-- Select Information About Subscriptions
SELECT * FROM pg_subscription;
SELECT * FROM pg_subscription WHERE subname = 'subscription_name';

-- View subscription status and statistics
SELECT * FROM pg_stat_subscription;

-- Alter a Subscription
ALTER SUBSCRIPTION subscription_name ADD PUBLICATION another_publication_name;
ALTER SUBSCRIPTION subscription_name DROP PUBLICATION publication_name;
ALTER SUBSCRIPTION subscription_name CONNECTION 'host=new_host dbname=new_db user=new_user password=new_password';
ALTER SUBSCRIPTION central1_sub ENABLE;
ALTER SUBSCRIPTION central1_sub DISABLE;
ALTER SUBSCRIPTION central_filial4_sub REFRESH PUBLICATION;

-- Drop a Subscription
DROP SUBSCRIPTION subscription_name;

-- reset subscriber
-- disable subscription
ALTER SUBSCRIPTION filial25_sub disable;
-- set replication slot none on subscriber
ALTER SUBSCRIPTION filial25_sub SET (slot_name = 'filial25_sub');
-- delete replication slot on publisher
SELECT pg_drop_replication_slot('filial25_sub');
-- recreate replication slot on publisher
SELECT * FROM pg_create_logical_replication_slot('filial25_sub', 'pgoutput');
-- enable subscription on subscriber
ALTER SUBSCRIPTION filial25_sub enable;



-- 3. Additional Queries

-- View replication slots
SELECT * FROM pg_replication_slots;

-- Drop a replication slot (use carefully)
SELECT pg_drop_replication_slot('subscription_slot_name');

-- View replication lag for subscriptions
SELECT subname, pid, received_lsn - replay_lsn AS replication_lag
FROM pg_stat_subscription;

-- script para crear subscription para el servidor
CREATE SUBSCRIPTION filial24_sub
CONNECTION 'dbname=general host=localhost user=franco password=franco port=5552'
PUBLICATION filial24_pub WITH (copy_data = false, origin = 'none');

-- script para crear subscription para la filial
CREATE SUBSCRIPTION central_filial25_sub
CONNECTION 'dbname=bodega host=172.25.1.200 user=franco password=franco port=5551'
PUBLICATION central_filial25_pub WITH (copy_data = false, origin = 'none');

CREATE SUBSCRIPTION filial25_central_sub
CONNECTION 'dbname=bodega host=172.25.1.200 user=franco password=franco port=5551'
PUBLICATION central_pub WITH (copy_data = false, origin = 'none');

--end script

-- alterar una publicacion
ALTER PUBLICATION central_filial4_pub ADD TABLE operaciones.stock_por_producto_sucursal WHERE (sucursal_id = 24);


-- creat publicacion simples para filiales
CREATE PUBLICATION filial25_pub FOR TABLE 
    administrativo.marcacion, 
    configuraciones.inicio_sesion, 
    financiero.cambio_caja, 
    financiero.conteo, 
    financiero.conteo_moneda, 
    financiero.factura_legal, 
    financiero.factura_legal_item, 
    financiero.gasto, 
    financiero.gasto_detalle, 
    financiero.maletin, 
    financiero.movimiento_caja, 
    financiero.movimiento_personas, 
    financiero.pdv_caja, 
    financiero.retiro, 
    financiero.retiro_detalle, 
    financiero.sencillo, 
    financiero.sencillo_detalle, 
    financiero.venta_credito, 
    financiero.venta_credito_cuota, 
    operaciones.cobro, 
    operaciones.cobro_detalle, 
    operaciones.delivery, 
    operaciones.movimiento_stock,
    operaciones.venta, 
    operaciones.venta_item, 
    operaciones.vuelto, 
    operaciones.vuelto_item;

-- script para crear la publicacion bidireccional en el servidor
    CREATE PUBLICATION central_filial24_pub FOR TABLE 
    administrativo.marcacion WHERE (sucursal_id = 24), 
    configuraciones.inicio_sesion WHERE (sucursal_id = 24), 
    financiero.cambio_caja WHERE (sucursal_id = 24), 
    financiero.conteo WHERE (sucursal_id = 24), 
    financiero.conteo_moneda WHERE (sucursal_id = 24), 
    financiero.factura_legal WHERE (sucursal_id = 24), 
    financiero.factura_legal_item WHERE (sucursal_id = 24), 
    financiero.gasto WHERE (sucursal_id = 24), 
    financiero.gasto_detalle WHERE (sucursal_id = 24), 
    financiero.maletin WHERE (sucursal_id = 24), 
    financiero.movimiento_caja WHERE (sucursal_id = 24), 
    financiero.pdv_caja WHERE (sucursal_id = 24), 
    financiero.retiro WHERE (sucursal_id = 24), 
    financiero.retiro_detalle WHERE (sucursal_id = 24), 
    financiero.sencillo WHERE (sucursal_id = 24), 
    financiero.sencillo_detalle WHERE (sucursal_id = 24), 
    financiero.venta_credito WHERE (sucursal_id = 24), 
    financiero.venta_credito_cuota WHERE (sucursal_id = 24), 
    operaciones.cobro WHERE (sucursal_id = 24), 
    operaciones.cobro_detalle WHERE (sucursal_id = 24), 
    operaciones.delivery WHERE (sucursal_id = 24), 
    operaciones.movimiento_stock WHERE (sucursal_id = 24), 
    operaciones.venta WHERE (sucursal_id = 24), 
    operaciones.venta_item WHERE (sucursal_id = 24), 
    operaciones.vuelto WHERE (sucursal_id = 24), 
    operaciones.vuelto_item WHERE (sucursal_id = 24);

    -- script para crear publicacion del servidor a filiales
    CREATE PUBLICATION central_pub FOR TABLE
    configuraciones.actualizacion,
    configuraciones.local,
    empresarial.cargo,
    empresarial.configuracion_general,
    empresarial.punto_de_venta,
    empresarial.sector,
    empresarial.sucursal,
    empresarial.zona,
    equipos.equipo,
    equipos.tipo_equipo,
    financiero.banco,
    financiero.cambio,
    financiero.cuenta_bancaria,
    financiero.documento,
    financiero.forma_pago,
    financiero.moneda,
    financiero.moneda_billetes,
    financiero.timbrado,
    financiero.timbrado_detalle,
    financiero.tipo_gasto,
    general.barrio,
    general.ciudad,
    general.contacto,
    general.pais,
    operaciones.precio_delivery,
    personas.cliente,
    personas.funcionario,
    personas.grupo_role,
    personas.persona,
    personas.role,
    personas.usuario,
    personas.usuario_grupo,
    personas.usuario_role,
    productos.codigo,
    productos.codigo_tipo_precio,
    productos.costo_por_producto,
    productos.familia,
    productos.pdv_categoria,
    productos.pdv_grupo,
    productos.pdv_grupos_productos,
    productos.precio_por_sucursal,
    productos.presentacion,
    productos.producto,
    productos.producto_imagen,
    productos.producto_por_sucursal,
    productos.subfamilia,
    productos.tipo_precio,
    productos.tipo_presentacion,
    vehiculos.marca,
    vehiculos.modelo,
    vehiculos.tipo_vehiculo,
    vehiculos.vehiculo,
    vehiculos.vehiculo_sucursal;

-- script para crear los slots en el servidor
SELECT * FROM pg_create_logical_replication_slot('central_filial4_slot', 'pgoutput');

-- funciones para modificar la sequence de movimiento stock 
-- para filiales
DO $$
DECLARE
    last_id BIGINT;
    new_start BIGINT;
BEGIN
    -- Get the last ID value from the table
    SELECT COALESCE(MAX(id), 0) INTO last_id FROM operaciones.movimiento_stock;

    -- Debug output to verify the last_id
    RAISE NOTICE 'Last ID from table: %', last_id;

    -- Determine if the last ID is odd or even
    IF mod(last_id, 2) = 0 THEN
        -- It's even, so add 1 to make it odd
       new_start := last_id;
    ELSE
        -- It's already odd, so use it as the starting point
        new_start := last_id + 1;
    END IF;

    -- Debug output to verify the new_start
    RAISE NOTICE 'New start value for sequence: %', new_start;

    -- Set the sequence to the new value and set increment by 2
    PERFORM setval('operaciones.movimiento_stock_id_seq', new_start, true);
    EXECUTE 'ALTER SEQUENCE operaciones.movimiento_stock_id_seq INCREMENT BY 2;';
END $$;

-- para servidor
DO $$
DECLARE
    last_id BIGINT;
    new_start BIGINT;
BEGIN
    -- Get the last ID value from the table
    SELECT COALESCE(MAX(id), 0) INTO last_id FROM operaciones.movimiento_stock;

    -- Debug output to verify the last_id
    RAISE NOTICE 'Last ID from table: %', last_id;

    -- Determine if the last ID is odd or even
    IF mod(last_id, 2) = 0 THEN
        -- It's even, so add 1 to make it odd
           new_start := last_id + 1;
    ELSE
        -- It's already odd, so use it as the starting point
           new_start := last_id;
    END IF;

    -- Debug output to verify the new_start
    RAISE NOTICE 'New start value for sequence: %', new_start;

    -- Set the sequence to the new value and set increment by 2
    PERFORM setval('operaciones.movimiento_stock_id_seq', new_start, true);
    EXECUTE 'ALTER SEQUENCE operaciones.movimiento_stock_id_seq INCREMENT BY 2;';
END $$;
