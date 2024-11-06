DO $$
DECLARE
    v_table_name TEXT;
    v_sequence_name TEXT;
    v_schema_name TEXT;
    v_simple_table_name TEXT;
    table_list TEXT[] := ARRAY[
        'operaciones.movimiento_stock',
        'operaciones.movimiento_stock',
        'financiero.movimiento_caja',
        'operaciones.vuelto_item',
        'operaciones.vuelto',
        'financiero.factura_legal_item',
        'financiero.factura_legal',
        'financiero.gasto_detalle',
        'financiero.gasto',
        'financiero.retiro_detalle',
        'financiero.retiro',
        'financiero.sencillo_detalle',
        'financiero.sencillo',
        'financiero.venta_credito_cuota',
        'financiero.venta_credito',
        'operaciones.cobro_detalle',
        'operaciones.cobro',
        'operaciones.delivery',
        'operaciones.venta',
        'operaciones.venta_item',
        'administrativo.marcacion',
        'configuraciones.inicio_sesion',
        'financiero.cambio_caja',
        'financiero.pdv_caja',
        'financiero.conteo_moneda',
        'financiero.conteo',
        'financiero.maletin'
    ];
BEGIN
    FOREACH v_table_name IN ARRAY table_list
    LOOP
        -- Extract schema name and simple table name
        v_schema_name := split_part(v_table_name, '.', 1);
        v_simple_table_name := split_part(v_table_name, '.', 2);

        -- Check if the table exists and delete rows if it does
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = v_schema_name 
              AND table_name = v_simple_table_name
        ) THEN
            EXECUTE format('DELETE FROM %I.%I;', v_schema_name, v_simple_table_name);
        END IF;

        -- Derive the sequence name and check if it exists before restarting it
        v_sequence_name := v_simple_table_name || '_id_seq';
        IF EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relkind = 'S' 
              AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = v_schema_name)
              AND relname = v_sequence_name
        ) THEN
            EXECUTE format('ALTER SEQUENCE %I.%I RESTART WITH 1;', v_schema_name, v_sequence_name);
        END IF;
    END LOOP;
END
$$;
