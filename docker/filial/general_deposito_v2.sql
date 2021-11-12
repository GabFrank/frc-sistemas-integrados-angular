--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.25
-- Dumped by pg_dump version 9.5.25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: administrativo; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA administrativo;


ALTER SCHEMA administrativo OWNER TO franco;

--
-- Name: bucardo; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA bucardo;


ALTER SCHEMA bucardo OWNER TO franco;

--
-- Name: configuraciones; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA configuraciones;


ALTER SCHEMA configuraciones OWNER TO franco;

--
-- Name: empresarial; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA empresarial;


ALTER SCHEMA empresarial OWNER TO franco;

--
-- Name: equipos; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA equipos;


ALTER SCHEMA equipos OWNER TO franco;

--
-- Name: financiero; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA financiero;


ALTER SCHEMA financiero OWNER TO franco;

--
-- Name: general; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA general;


ALTER SCHEMA general OWNER TO franco;

--
-- Name: operaciones; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA operaciones;


ALTER SCHEMA operaciones OWNER TO franco;

--
-- Name: personas; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA personas;


ALTER SCHEMA personas OWNER TO franco;

--
-- Name: productos; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA productos;


ALTER SCHEMA productos OWNER TO franco;

--
-- Name: vehiculos; Type: SCHEMA; Schema: -; Owner: franco
--

CREATE SCHEMA vehiculos;


ALTER SCHEMA vehiculos OWNER TO franco;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: estado_autorizacion; Type: TYPE; Schema: administrativo; Owner: franco
--

CREATE TYPE administrativo.estado_autorizacion AS ENUM (
    'EN ESPERA',
    'CANCELADO',
    'AUTORIZADO',
    'NO_AUTORIZADO'
);


ALTER TYPE administrativo.estado_autorizacion OWNER TO franco;

--
-- Name: tipo_autorizacion; Type: TYPE; Schema: administrativo; Owner: franco
--

CREATE TYPE administrativo.tipo_autorizacion AS ENUM (
    'MARCACION'
);


ALTER TYPE administrativo.tipo_autorizacion OWNER TO franco;

--
-- Name: tipo_marcacion; Type: TYPE; Schema: administrativo; Owner: franco
--

CREATE TYPE administrativo.tipo_marcacion AS ENUM (
    'ENTRADA',
    'SALIDA'
);


ALTER TYPE administrativo.tipo_marcacion OWNER TO franco;

--
-- Name: tipo_cuenta; Type: TYPE; Schema: financiero; Owner: franco
--

CREATE TYPE financiero.tipo_cuenta AS ENUM (
    'CUENTA_CORRIENTE',
    'CAJA_DE_AHORRO'
);


ALTER TYPE financiero.tipo_cuenta OWNER TO franco;

--
-- Name: dias_semana; Type: TYPE; Schema: general; Owner: franco
--

CREATE TYPE general.dias_semana AS ENUM (
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JEUVES',
    'VIERNES',
    'SABADO',
    'DOMINGO'
);


ALTER TYPE general.dias_semana OWNER TO franco;

--
-- Name: meses; Type: TYPE; Schema: general; Owner: franco
--

CREATE TYPE general.meses AS ENUM (
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEMPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE'
);


ALTER TYPE general.meses OWNER TO franco;

--
-- Name: compra_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.compra_estado AS ENUM (
    'ACTIVO',
    'CANCELADO',
    'DEVILVIDO',
    'EN_OBSERVACION',
    'IRREGULAR'
);


ALTER TYPE operaciones.compra_estado OWNER TO franco;

--
-- Name: compra_tipo_boleta; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.compra_tipo_boleta AS ENUM (
    'LEGAL',
    'COMUN'
);


ALTER TYPE operaciones.compra_tipo_boleta OWNER TO franco;

--
-- Name: delivery_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.delivery_estado AS ENUM (
    'ABIERTO',
    'EN_CAMINO',
    'ENTREGADO',
    'CANCELADO',
    'DEVOLVIDO'
);


ALTER TYPE operaciones.delivery_estado OWNER TO franco;

--
-- Name: necesidad_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.necesidad_estado AS ENUM (
    'ACTIVO',
    'MODIFICADO',
    'CANCELADO',
    'EN_VERIFICACION',
    'EN_VERIFICACION_SOLICITUD_AUTORIZACION',
    'VERFICADO_SIN_MODIFICACION',
    'VERFICADO_CON_MODIFICACION',
    'CONCLUIDO'
);


ALTER TYPE operaciones.necesidad_estado OWNER TO franco;

--
-- Name: necesidad_item_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.necesidad_item_estado AS ENUM (
    'ACTIVO',
    'CANCELADO',
    'DEVOLUCION',
    'CONCLUIDO',
    'EN_FALTA'
);


ALTER TYPE operaciones.necesidad_item_estado OWNER TO franco;

--
-- Name: pedido_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.pedido_estado AS ENUM (
    'ABIERTO',
    'ACTIVO',
    'MODIFICADO',
    'CANCELADO',
    'REPROGRAMADO',
    'EN_VERIFICACION',
    'EN_VERIFICACION_SOLICITUD_AUTORIZACION',
    'VERFICADO_SIN_MODIFICACION',
    'VERFICADO_CON_MODIFICACION',
    'CONCLUIDO'
);


ALTER TYPE operaciones.pedido_estado OWNER TO franco;

--
-- Name: pedido_forma_pago; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.pedido_forma_pago AS ENUM (
    'EFECTIVO',
    'TRANSFERENCIA',
    'CHEQUE',
    'CREDITO'
);


ALTER TYPE operaciones.pedido_forma_pago OWNER TO franco;

--
-- Name: pedido_item_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.pedido_item_estado AS ENUM (
    'ACTIVO',
    'CANCELADO',
    'DEVOLUCION',
    'CONCLUIDO',
    'EN_FALTA'
);


ALTER TYPE operaciones.pedido_item_estado OWNER TO franco;

--
-- Name: tipo_entrada; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.tipo_entrada AS ENUM (
    'COMPRA',
    'SUCURSAL',
    'AJUSTE'
);


ALTER TYPE operaciones.tipo_entrada OWNER TO franco;

--
-- Name: tipo_movimiento; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.tipo_movimiento AS ENUM (
    'COMPRA',
    'VENTA',
    'DEVOLUCION',
    'DESCARTE',
    'AJUSTE',
    'TRANSFERENCIA',
    'CALCULO',
    'ENTRADA',
    'SALIDA'
);


ALTER TYPE operaciones.tipo_movimiento OWNER TO franco;

--
-- Name: tipo_salida; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.tipo_salida AS ENUM (
    'SUCURSAL',
    'VENCIDO',
    'DETERIORADO',
    'AJUSTE'
);


ALTER TYPE operaciones.tipo_salida OWNER TO franco;

--
-- Name: tipo_venta; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.tipo_venta AS ENUM (
    'EFECTIVO',
    'CREDITO',
    'TARJETA',
    'TRANSFERENCIA',
    'CONSIGNACION',
    'CORTESIA'
);


ALTER TYPE operaciones.tipo_venta OWNER TO franco;

--
-- Name: venta_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.venta_estado AS ENUM (
    'ABIERTA',
    'CONCLUIDA',
    'CANCELADA',
    'EN_VERIFICACION'
);


ALTER TYPE operaciones.venta_estado OWNER TO franco;

--
-- Name: tipo_conservacion; Type: TYPE; Schema: productos; Owner: franco
--

CREATE TYPE productos.tipo_conservacion AS ENUM (
    'ENFRIABLE',
    'NO_ENFRIABLE',
    'REFRIGERABLE',
    'CONGELABLE'
);


ALTER TYPE productos.tipo_conservacion OWNER TO franco;

--
-- Name: unidad_medida; Type: TYPE; Schema: productos; Owner: franco
--

CREATE TYPE productos.unidad_medida AS ENUM (
    'UNIDAD',
    'CAJA',
    'KILO',
    'LITROS'
);


ALTER TYPE productos.unidad_medida OWNER TO franco;

--
-- Name: estado_vehiculo; Type: TYPE; Schema: vehiculos; Owner: franco
--

CREATE TYPE vehiculos.estado_vehiculo AS ENUM (
    'FUNCIONANDO',
    'AVERIADO',
    'EN_REPARACION',
    'AGUARDANDO_REPARACION'
);


ALTER TYPE vehiculos.estado_vehiculo OWNER TO franco;

--
-- Name: bucardo_compress_delta(oid); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_compress_delta(oid) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    AS $_$ 
SELECT bucardo.bucardo_compress_delta(n.nspname, c.relname)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.oid = $1;
 $_$;


ALTER FUNCTION bucardo.bucardo_compress_delta(oid) OWNER TO franco;

--
-- Name: bucardo_compress_delta(text); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_compress_delta(text) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    AS $_$ 
SELECT bucardo.bucardo_compress_delta(n.nspname, c.relname)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE relname = $1 AND pg_table_is_visible(c.oid);
 $_$;


ALTER FUNCTION bucardo.bucardo_compress_delta(text) OWNER TO franco;

--
-- Name: bucardo_compress_delta(text, text); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_compress_delta(text, text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$ 
DECLARE
  mymode TEXT;
  myoid OID;
  myst TEXT;
  got2 bool;
  drows BIGINT = 0;
  trows BIGINT = 0;
  rnames TEXT;
  rname TEXT;
  rnamerec RECORD;
  ids_where TEXT;
  ids_sel TEXT;
  ids_grp TEXT;
  idnum TEXT;
BEGIN

  -- Are we running in a proper mode?
  SELECT INTO mymode current_setting('transaction_isolation');
  IF (mymode <> 'serializable' AND mymode <> 'repeatable read') THEN
    RAISE EXCEPTION 'This function must be run in repeatable read mode';
  END IF;

  -- Grab the oid of this schema/table combo
  SELECT INTO myoid
    c.oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE nspname = $1 AND relname = $2;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No such table: %.%', $1, $2;
  END IF;

  ids_where = 'COALESCE(rowid,''NULL'') = COALESCE(id, ''NULL'')';
  ids_sel = 'rowid AS id';
  ids_grp = 'rowid';
  FOR rnamerec IN SELECT attname FROM pg_attribute WHERE attrelid =
    (SELECT oid FROM pg_class WHERE relname = 'bucardo_delta'
     AND relnamespace =
     (SELECT oid FROM pg_namespace WHERE nspname = 'bucardo') AND attname ~ '^rowid'
    ) LOOP
    rname = rnamerec.attname;
    rnames = COALESCE(rnames || ' ', '') || rname ;
    SELECT INTO idnum SUBSTRING(rname FROM '[[:digit:]]+');
    IF idnum IS NOT NULL THEN
      ids_where = ids_where 
      || ' AND (' 
      || rname
      || ' = id'
      || idnum
      || ' OR ('
      || rname
      || ' IS NULL AND id'
      || idnum
      || ' IS NULL))';
      ids_sel = ids_sel
      || ', '
      || rname
      || ' AS id'
      || idnum;
      ids_grp = ids_grp
      || ', '
      || rname;
    END IF;
  END LOOP;

  myst = 'DELETE FROM bucardo.bucardo_delta 
    USING (SELECT MAX(txntime) AS maxt, '||ids_sel||'
    FROM bucardo.bucardo_delta
    WHERE tablename = '||myoid||'
    GROUP BY ' || ids_grp || ') AS foo
    WHERE tablename = '|| myoid || ' AND ' || ids_where ||' AND txntime <> maxt';
  RAISE DEBUG 'Running %', myst;
  EXECUTE myst;

  GET DIAGNOSTICS drows := row_count;

  myst = 'DELETE FROM bucardo.bucardo_track'
    || ' WHERE NOT EXISTS (SELECT 1 FROM bucardo.bucardo_delta d WHERE d.txntime = bucardo_track.txntime)';
  EXECUTE myst;

  GET DIAGNOSTICS trows := row_count;

  RETURN 'Compressed '||$1||'.'||$2||'. Rows deleted from bucardo_delta: '||drows||
    ' Rows deleted from bucardo_track: '||trows;
END;
 $_$;


ALTER FUNCTION bucardo.bucardo_compress_delta(text, text) OWNER TO franco;

--
-- Name: bucardo_delta_check(text, text); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_delta_check(text, text) RETURNS SETOF text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$ 
DECLARE
  myst TEXT;
  myrec RECORD;
  mycount INT;
BEGIN
  FOR myrec IN
    SELECT * FROM bucardo.bucardo_delta_names
      WHERE sync = $1 
      ORDER BY tablename
  LOOP

    RAISE DEBUG 'GOT % and %', myrec.deltaname, myrec.tablename;

    myst = $$
      SELECT  1
      FROM    bucardo.$$ || myrec.deltaname || $$ d
      WHERE   NOT EXISTS (
        SELECT 1
        FROM   bucardo.$$ || myrec.trackname || $$ t
        WHERE  d.txntime = t.txntime
        AND    (t.target = '$$ || $2 || $$'::text OR t.target ~ '^T:')
      ) LIMIT 1$$;
    EXECUTE myst;
    GET DIAGNOSTICS mycount = ROW_COUNT;

    IF mycount>=1 THEN
      RETURN NEXT '1,' || myrec.tablename;
    ELSE
      RETURN NEXT '0,' || myrec.tablename;
    END IF;

  END LOOP;
  RETURN;
END;
 $_$;


ALTER FUNCTION bucardo.bucardo_delta_check(text, text) OWNER TO franco;

--
-- Name: bucardo_delta_names_helper(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_delta_names_helper() RETURNS trigger
    LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
    AS $$ 
BEGIN
  IF NEW.deltaname IS NULL THEN
    NEW.deltaname = bucardo.bucardo_tablename_maker(NEW.tablename, 'delta_');
  END IF;
  IF NEW.trackname IS NULL THEN
    NEW.trackname = bucardo.bucardo_tablename_maker(NEW.tablename, 'track_');
  END IF;
  RETURN NEW;
END;
 $$;


ALTER FUNCTION bucardo.bucardo_delta_names_helper() OWNER TO franco;

--
-- Name: bucardo_kick_general_sync(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_kick_general_sync() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
                  BEGIN
                    EXECUTE $nn$NOTIFY bucardo, 'kick_sync_general_sync'$nn$;
                  RETURN NEW;
                  END;
                  $_$;


ALTER FUNCTION bucardo.bucardo_kick_general_sync() OWNER TO franco;

--
-- Name: bucardo_note_truncation(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_note_truncation() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
DECLARE
  mytable TEXT;
  myst TEXT;
BEGIN
  INSERT INTO bucardo.bucardo_truncate_trigger(tablename,sname,tname,sync)
    VALUES (TG_RELID, TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_ARGV[0]);

  SELECT INTO mytable
    bucardo.bucardo_tablename_maker(TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, 'delta_');
  myst = 'TRUNCATE TABLE bucardo.' || mytable;
  EXECUTE myst;

  SELECT INTO mytable
    bucardo.bucardo_tablename_maker(TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, 'track_');
  myst = 'TRUNCATE TABLE bucardo.' || mytable;
  EXECUTE myst;

  -- Not strictly necessary, but nice to have a clean slate
  SELECT INTO mytable
    bucardo.bucardo_tablename_maker(TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, 'stage_');
  myst = 'TRUNCATE TABLE bucardo.' || mytable;
  EXECUTE myst;

  RETURN NEW;
END;
 $$;


ALTER FUNCTION bucardo.bucardo_note_truncation() OWNER TO franco;

--
-- Name: bucardo_purge_delta(text); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_purge_delta(text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$ 
DECLARE
  myrec RECORD;
  myrez TEXT;
  total INTEGER = 0;
BEGIN

  SET LOCAL search_path = pg_catalog;

  -- Grab all potential tables to be vacuumed by looking at bucardo_delta_targets
  FOR myrec IN SELECT DISTINCT tablename FROM bucardo.bucardo_delta_targets LOOP
    SELECT INTO myrez
      bucardo.bucardo_purge_delta_oid($1, myrec.tablename);
    RAISE NOTICE '%', myrez;
    total = total + 1;
  END LOOP;

  RETURN 'Tables processed: ' || total;

END;
 $_$;


ALTER FUNCTION bucardo.bucardo_purge_delta(text) OWNER TO franco;

--
-- Name: bucardo_purge_delta_oid(text, oid); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_purge_delta_oid(text, oid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$ 
DECLARE
  deltatable TEXT;
  tracktable TEXT;
  dtablename TEXT;
  myst TEXT;
  drows BIGINT = 0;
  trows BIGINT = 0;
BEGIN
  -- Store the schema and table name
  SELECT INTO dtablename
    quote_ident(nspname)||'.'||quote_ident(relname)
    FROM pg_class c JOIN pg_namespace n ON (n.oid = c.relnamespace)
    WHERE c.oid = $2;

  -- See how many dbgroups are being used by this table
  SELECT INTO drows 
    COUNT(DISTINCT target)
    FROM bucardo.bucardo_delta_targets
    WHERE tablename = $2;
  RAISE DEBUG 'delta_targets rows found for %: %', dtablename, drows;

  -- If no dbgroups, no point in going on, as we will never purge anything
  IF drows < 1 THEN
    RETURN 'Nobody is using table '|| dtablename ||', according to bucardo_delta_targets';
  END IF;

  -- Figure out the names of the delta and track tables for this relation
  SELECT INTO deltatable
    bucardo.bucardo_tablename_maker(dtablename, 'delta_');
  SELECT INTO tracktable
    bucardo.bucardo_tablename_maker(dtablename, 'track_');

  -- Delete all txntimes from the delta table that:
  -- 1) Have been used by all dbgroups listed in bucardo_delta_targets
  -- 2) Have a matching txntime from the track table
  -- 3) Are older than the first argument interval
  myst = 'DELETE FROM bucardo.'
  || deltatable
  || ' USING (SELECT txntime AS tt FROM bucardo.'
  || tracktable 
  || ' GROUP BY 1 HAVING COUNT(*) = '
  || drows
  || ') AS foo'
  || ' WHERE txntime = tt'
  || ' AND txntime < now() - interval '
  || quote_literal($1);

  EXECUTE myst;

  GET DIAGNOSTICS drows := row_count;

  -- Now that we have done that, we can remove rows from the track table
  -- which have no match at all in the delta table
  myst = 'DELETE FROM bucardo.'
  || tracktable
  || ' WHERE NOT EXISTS (SELECT 1 FROM bucardo.'
  || deltatable
  || ' d WHERE d.txntime = bucardo.'
  || tracktable
  || '.txntime)';

  EXECUTE myst;

  GET DIAGNOSTICS trows := row_count;

  RETURN 'Rows deleted from '
  || deltatable
  || ': '
  || drows
  || ' Rows deleted from '
  || tracktable
  || ': '
  || trows;

END;
 $_$;


ALTER FUNCTION bucardo.bucardo_purge_delta_oid(text, oid) OWNER TO franco;

--
-- Name: bucardo_purge_sync_track(text); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_purge_sync_track(text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$ 
DECLARE
  myrec RECORD;
  myst  TEXT;
BEGIN
  PERFORM 1 FROM bucardo.bucardo_delta_names WHERE sync = $1 LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No sync found named %', $1;
  END IF;

  FOR myrec IN SELECT DISTINCT tablename, deltaname, trackname
    FROM bucardo.bucardo_delta_names WHERE sync = $1
    ORDER BY tablename LOOP

    myst = 'INSERT INTO bucardo.'
    || myrec.trackname
    || ' SELECT DISTINCT txntime, '
    || quote_literal($1)
    || ' FROM bucardo.'
    || myrec.deltaname;

    RAISE DEBUG 'Running: %', myst;

    EXECUTE myst;

  END LOOP;

  RETURN 'Complete';

END;
 $_$;


ALTER FUNCTION bucardo.bucardo_purge_sync_track(text) OWNER TO franco;

--
-- Name: bucardo_tablename_maker(text); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_tablename_maker(text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
    AS $_$ 
DECLARE
  tname TEXT;
  newname TEXT;
  hashed TEXT;
BEGIN
  -- Change the first period to an underscore
  SELECT INTO tname REPLACE($1, '.', '_');
  -- Assumes max_identifier_length is 63
  -- Because even if not, we'll still abbreviate for consistency and portability
  SELECT INTO newname SUBSTRING(tname FROM 1 FOR 57);
  IF (newname != tname) THEN
    SELECT INTO newname SUBSTRING(tname FROM 1 FOR 46)
      || '!'
      || SUBSTRING(MD5(tname) FROM 1 FOR 10);
  END IF;
  -- We let Postgres worry about the quoting details
  SELECT INTO newname quote_ident(newname);
  RETURN newname;
END;
 $_$;


ALTER FUNCTION bucardo.bucardo_tablename_maker(text) OWNER TO franco;

--
-- Name: bucardo_tablename_maker(text, text); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.bucardo_tablename_maker(text, text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
    AS $_$ 
DECLARE
  newname TEXT;
BEGIN
  SELECT INTO newname bucardo.bucardo_tablename_maker($1);

  -- If it has quotes around it, we expand the quotes to include the prefix
  IF (POSITION('"' IN newname) >= 1) THEN
    newname = REPLACE(newname, '"', '');
    newname = '"' || $2 || newname || '"';
  ELSE
    newname = $2 || newname;
  END IF;

  RETURN newname;
END;
 $_$;


ALTER FUNCTION bucardo.bucardo_tablename_maker(text, text) OWNER TO franco;

--
-- Name: delta_productos_codigo(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.delta_productos_codigo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
        BEGIN
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO bucardo.delta_productos_codigo VALUES (NEW."id");
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO bucardo.delta_productos_codigo VALUES (OLD."id");
          IF (OLD."id" <> NEW."id") THEN
            INSERT INTO bucardo.delta_productos_codigo VALUES (NEW."id");
          END IF;
        ELSE
          INSERT INTO bucardo.delta_productos_codigo VALUES (OLD."id");
        END IF;
        RETURN NULL;
        END;
        $$;


ALTER FUNCTION bucardo.delta_productos_codigo() OWNER TO franco;

--
-- Name: delta_productos_costos_por_sucursal(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.delta_productos_costos_por_sucursal() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
        BEGIN
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO bucardo.delta_productos_costos_por_sucursal VALUES (NEW."id");
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO bucardo.delta_productos_costos_por_sucursal VALUES (OLD."id");
          IF (OLD."id" <> NEW."id") THEN
            INSERT INTO bucardo.delta_productos_costos_por_sucursal VALUES (NEW."id");
          END IF;
        ELSE
          INSERT INTO bucardo.delta_productos_costos_por_sucursal VALUES (OLD."id");
        END IF;
        RETURN NULL;
        END;
        $$;


ALTER FUNCTION bucardo.delta_productos_costos_por_sucursal() OWNER TO franco;

--
-- Name: delta_productos_familia(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.delta_productos_familia() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
        BEGIN
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO bucardo.delta_productos_familia VALUES (NEW."id");
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO bucardo.delta_productos_familia VALUES (OLD."id");
          IF (OLD."id" <> NEW."id") THEN
            INSERT INTO bucardo.delta_productos_familia VALUES (NEW."id");
          END IF;
        ELSE
          INSERT INTO bucardo.delta_productos_familia VALUES (OLD."id");
        END IF;
        RETURN NULL;
        END;
        $$;


ALTER FUNCTION bucardo.delta_productos_familia() OWNER TO franco;

--
-- Name: delta_productos_precio_por_sucursal(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.delta_productos_precio_por_sucursal() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
        BEGIN
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO bucardo.delta_productos_precio_por_sucursal VALUES (NEW."id");
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO bucardo.delta_productos_precio_por_sucursal VALUES (OLD."id");
          IF (OLD."id" <> NEW."id") THEN
            INSERT INTO bucardo.delta_productos_precio_por_sucursal VALUES (NEW."id");
          END IF;
        ELSE
          INSERT INTO bucardo.delta_productos_precio_por_sucursal VALUES (OLD."id");
        END IF;
        RETURN NULL;
        END;
        $$;


ALTER FUNCTION bucardo.delta_productos_precio_por_sucursal() OWNER TO franco;

--
-- Name: delta_productos_producto(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.delta_productos_producto() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
        BEGIN
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO bucardo.delta_productos_producto VALUES (NEW."id");
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO bucardo.delta_productos_producto VALUES (OLD."id");
          IF (OLD."id" <> NEW."id") THEN
            INSERT INTO bucardo.delta_productos_producto VALUES (NEW."id");
          END IF;
        ELSE
          INSERT INTO bucardo.delta_productos_producto VALUES (OLD."id");
        END IF;
        RETURN NULL;
        END;
        $$;


ALTER FUNCTION bucardo.delta_productos_producto() OWNER TO franco;

--
-- Name: delta_productos_subfamilia(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.delta_productos_subfamilia() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
        BEGIN
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO bucardo.delta_productos_subfamilia VALUES (NEW."id");
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO bucardo.delta_productos_subfamilia VALUES (OLD."id");
          IF (OLD."id" <> NEW."id") THEN
            INSERT INTO bucardo.delta_productos_subfamilia VALUES (NEW."id");
          END IF;
        ELSE
          INSERT INTO bucardo.delta_productos_subfamilia VALUES (OLD."id");
        END IF;
        RETURN NULL;
        END;
        $$;


ALTER FUNCTION bucardo.delta_productos_subfamilia() OWNER TO franco;

--
-- Name: delta_productos_tipo_precio(); Type: FUNCTION; Schema: bucardo; Owner: franco
--

CREATE FUNCTION bucardo.delta_productos_tipo_precio() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
        BEGIN
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO bucardo.delta_productos_tipo_precio VALUES (NEW."id");
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO bucardo.delta_productos_tipo_precio VALUES (OLD."id");
          IF (OLD."id" <> NEW."id") THEN
            INSERT INTO bucardo.delta_productos_tipo_precio VALUES (NEW."id");
          END IF;
        ELSE
          INSERT INTO bucardo.delta_productos_tipo_precio VALUES (OLD."id");
        END IF;
        RETURN NULL;
        END;
        $$;


ALTER FUNCTION bucardo.delta_productos_tipo_precio() OWNER TO franco;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: autorizacion; Type: TABLE; Schema: administrativo; Owner: franco
--

CREATE TABLE administrativo.autorizacion (
    id bigint NOT NULL,
    funcionario_id bigint,
    autorizador_id bigint,
    tipo_autorizacion administrativo.tipo_autorizacion,
    estado_autorizacion administrativo.estado_autorizacion,
    observacion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE administrativo.autorizacion OWNER TO franco;

--
-- Name: autorizacion_id_seq; Type: SEQUENCE; Schema: administrativo; Owner: franco
--

CREATE SEQUENCE administrativo.autorizacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE administrativo.autorizacion_id_seq OWNER TO franco;

--
-- Name: autorizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: administrativo; Owner: franco
--

ALTER SEQUENCE administrativo.autorizacion_id_seq OWNED BY administrativo.autorizacion.id;


--
-- Name: marcacion; Type: TABLE; Schema: administrativo; Owner: franco
--

CREATE TABLE administrativo.marcacion (
    id bigint NOT NULL,
    tipo_marcacion administrativo.tipo_marcacion,
    presencial boolean,
    autorizacion bigint,
    sucursal_id bigint,
    codigo character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE administrativo.marcacion OWNER TO franco;

--
-- Name: marcacion_id_seq; Type: SEQUENCE; Schema: administrativo; Owner: franco
--

CREATE SEQUENCE administrativo.marcacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE administrativo.marcacion_id_seq OWNER TO franco;

--
-- Name: marcacion_id_seq; Type: SEQUENCE OWNED BY; Schema: administrativo; Owner: franco
--

ALTER SEQUENCE administrativo.marcacion_id_seq OWNED BY administrativo.marcacion.id;


--
-- Name: bucardo_delta_names; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.bucardo_delta_names (
    sync text,
    tablename text,
    deltaname text,
    trackname text,
    cdate timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.bucardo_delta_names OWNER TO franco;

--
-- Name: bucardo_delta_targets; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.bucardo_delta_targets (
    tablename oid NOT NULL,
    target text NOT NULL,
    cdate timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.bucardo_delta_targets OWNER TO franco;

--
-- Name: bucardo_sequences; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.bucardo_sequences (
    schemaname text NOT NULL,
    seqname text NOT NULL,
    syncname text NOT NULL,
    targetname text NOT NULL,
    last_value bigint NOT NULL,
    start_value bigint NOT NULL,
    increment_by bigint NOT NULL,
    max_value bigint NOT NULL,
    min_value bigint NOT NULL,
    is_cycled boolean NOT NULL,
    is_called boolean NOT NULL
);


ALTER TABLE bucardo.bucardo_sequences OWNER TO franco;

--
-- Name: bucardo_truncate_trigger; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.bucardo_truncate_trigger (
    tablename oid NOT NULL,
    sname text NOT NULL,
    tname text NOT NULL,
    sync text NOT NULL,
    replicated timestamp with time zone,
    cdate timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.bucardo_truncate_trigger OWNER TO franco;

--
-- Name: bucardo_truncate_trigger_log; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.bucardo_truncate_trigger_log (
    tablename oid NOT NULL,
    sname text NOT NULL,
    tname text NOT NULL,
    sync text NOT NULL,
    target text NOT NULL,
    replicated timestamp with time zone NOT NULL,
    cdate timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.bucardo_truncate_trigger_log OWNER TO franco;

--
-- Name: delta_productos_codigo; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.delta_productos_codigo (
    id bigint,
    txntime timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.delta_productos_codigo OWNER TO franco;

--
-- Name: delta_productos_costos_por_sucursal; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.delta_productos_costos_por_sucursal (
    id bigint,
    txntime timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.delta_productos_costos_por_sucursal OWNER TO franco;

--
-- Name: delta_productos_familia; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.delta_productos_familia (
    id bigint,
    txntime timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.delta_productos_familia OWNER TO franco;

--
-- Name: delta_productos_precio_por_sucursal; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.delta_productos_precio_por_sucursal (
    id bigint,
    txntime timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.delta_productos_precio_por_sucursal OWNER TO franco;

--
-- Name: delta_productos_producto; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.delta_productos_producto (
    id bigint,
    txntime timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.delta_productos_producto OWNER TO franco;

--
-- Name: delta_productos_subfamilia; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.delta_productos_subfamilia (
    id bigint,
    txntime timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.delta_productos_subfamilia OWNER TO franco;

--
-- Name: delta_productos_tipo_precio; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.delta_productos_tipo_precio (
    id bigint,
    txntime timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bucardo.delta_productos_tipo_precio OWNER TO franco;

--
-- Name: stage_productos_codigo; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE UNLOGGED TABLE bucardo.stage_productos_codigo (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.stage_productos_codigo OWNER TO franco;

--
-- Name: stage_productos_costos_por_sucursal; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE UNLOGGED TABLE bucardo.stage_productos_costos_por_sucursal (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.stage_productos_costos_por_sucursal OWNER TO franco;

--
-- Name: stage_productos_familia; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE UNLOGGED TABLE bucardo.stage_productos_familia (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.stage_productos_familia OWNER TO franco;

--
-- Name: stage_productos_precio_por_sucursal; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE UNLOGGED TABLE bucardo.stage_productos_precio_por_sucursal (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.stage_productos_precio_por_sucursal OWNER TO franco;

--
-- Name: stage_productos_producto; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE UNLOGGED TABLE bucardo.stage_productos_producto (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.stage_productos_producto OWNER TO franco;

--
-- Name: stage_productos_subfamilia; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE UNLOGGED TABLE bucardo.stage_productos_subfamilia (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.stage_productos_subfamilia OWNER TO franco;

--
-- Name: stage_productos_tipo_precio; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE UNLOGGED TABLE bucardo.stage_productos_tipo_precio (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.stage_productos_tipo_precio OWNER TO franco;

--
-- Name: track_productos_codigo; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.track_productos_codigo (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.track_productos_codigo OWNER TO franco;

--
-- Name: track_productos_costos_por_sucursal; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.track_productos_costos_por_sucursal (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.track_productos_costos_por_sucursal OWNER TO franco;

--
-- Name: track_productos_familia; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.track_productos_familia (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.track_productos_familia OWNER TO franco;

--
-- Name: track_productos_precio_por_sucursal; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.track_productos_precio_por_sucursal (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.track_productos_precio_por_sucursal OWNER TO franco;

--
-- Name: track_productos_producto; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.track_productos_producto (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.track_productos_producto OWNER TO franco;

--
-- Name: track_productos_subfamilia; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.track_productos_subfamilia (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.track_productos_subfamilia OWNER TO franco;

--
-- Name: track_productos_tipo_precio; Type: TABLE; Schema: bucardo; Owner: franco
--

CREATE TABLE bucardo.track_productos_tipo_precio (
    txntime timestamp with time zone,
    target text
);


ALTER TABLE bucardo.track_productos_tipo_precio OWNER TO franco;

--
-- Name: inicio_sesion; Type: TABLE; Schema: configuraciones; Owner: franco
--

CREATE TABLE configuraciones.inicio_sesion (
    id bigint NOT NULL,
    usuario_id bigint,
    dispositivo bigint,
    hora_inicio timestamp with time zone DEFAULT now(),
    hora_fin timestamp without time zone,
    creado_en timestamp with time zone DEFAULT now(),
    sucursal_id bigint
);


ALTER TABLE configuraciones.inicio_sesion OWNER TO franco;

--
-- Name: inicio_sesion_id_seq; Type: SEQUENCE; Schema: configuraciones; Owner: franco
--

CREATE SEQUENCE configuraciones.inicio_sesion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE configuraciones.inicio_sesion_id_seq OWNER TO franco;

--
-- Name: inicio_sesion_id_seq; Type: SEQUENCE OWNED BY; Schema: configuraciones; Owner: franco
--

ALTER SEQUENCE configuraciones.inicio_sesion_id_seq OWNED BY configuraciones.inicio_sesion.id;


--
-- Name: local; Type: TABLE; Schema: configuraciones; Owner: franco
--

CREATE TABLE configuraciones.local (
    id bigint NOT NULL,
    sucursal_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    equipo_id bigint
);


ALTER TABLE configuraciones.local OWNER TO franco;

--
-- Name: local_id_seq; Type: SEQUENCE; Schema: configuraciones; Owner: franco
--

CREATE SEQUENCE configuraciones.local_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE configuraciones.local_id_seq OWNER TO franco;

--
-- Name: local_id_seq; Type: SEQUENCE OWNED BY; Schema: configuraciones; Owner: franco
--

ALTER SEQUENCE configuraciones.local_id_seq OWNED BY configuraciones.local.id;


--
-- Name: cargo; Type: TABLE; Schema: empresarial; Owner: franco
--

CREATE TABLE empresarial.cargo (
    id bigint NOT NULL,
    nombre character varying,
    descripcion character varying,
    supervisado_por_id bigint,
    sueldo_base numeric,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE empresarial.cargo OWNER TO franco;

--
-- Name: cargo_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: franco
--

CREATE SEQUENCE empresarial.cargo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE empresarial.cargo_id_seq OWNER TO franco;

--
-- Name: cargo_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: franco
--

ALTER SEQUENCE empresarial.cargo_id_seq OWNED BY empresarial.cargo.id;


--
-- Name: sucursal; Type: TABLE; Schema: empresarial; Owner: franco
--

CREATE TABLE empresarial.sucursal (
    id bigint NOT NULL,
    nombre character varying,
    localizacion character varying,
    ciudad_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    deposito boolean DEFAULT true,
    deposito_predeterminado boolean DEFAULT false,
    direccion character varying,
    nro_delivery character varying
);


ALTER TABLE empresarial.sucursal OWNER TO franco;

--
-- Name: COLUMN sucursal.direccion; Type: COMMENT; Schema: empresarial; Owner: franco
--

COMMENT ON COLUMN empresarial.sucursal.direccion IS 'direccion referencial';


--
-- Name: sucursal_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: franco
--

CREATE SEQUENCE empresarial.sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE empresarial.sucursal_id_seq OWNER TO franco;

--
-- Name: sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: franco
--

ALTER SEQUENCE empresarial.sucursal_id_seq OWNED BY empresarial.sucursal.id;


--
-- Name: equipo; Type: TABLE; Schema: equipos; Owner: franco
--

CREATE TABLE equipos.equipo (
    id bigint NOT NULL,
    marca character varying,
    modelo character varying,
    costo numeric,
    descripcion character varying,
    imagenes character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    tipo_equipo_id bigint
);


ALTER TABLE equipos.equipo OWNER TO franco;

--
-- Name: equipo_id_seq; Type: SEQUENCE; Schema: equipos; Owner: franco
--

CREATE SEQUENCE equipos.equipo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE equipos.equipo_id_seq OWNER TO franco;

--
-- Name: equipo_id_seq; Type: SEQUENCE OWNED BY; Schema: equipos; Owner: franco
--

ALTER SEQUENCE equipos.equipo_id_seq OWNED BY equipos.equipo.id;


--
-- Name: tipo_equipo; Type: TABLE; Schema: equipos; Owner: franco
--

CREATE TABLE equipos.tipo_equipo (
    id bigint NOT NULL,
    descripcion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE equipos.tipo_equipo OWNER TO franco;

--
-- Name: tipo_equipo_id_seq; Type: SEQUENCE; Schema: equipos; Owner: franco
--

CREATE SEQUENCE equipos.tipo_equipo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE equipos.tipo_equipo_id_seq OWNER TO franco;

--
-- Name: tipo_equipo_id_seq; Type: SEQUENCE OWNED BY; Schema: equipos; Owner: franco
--

ALTER SEQUENCE equipos.tipo_equipo_id_seq OWNED BY equipos.tipo_equipo.id;


--
-- Name: banco; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.banco (
    id bigint NOT NULL,
    nombre character varying,
    codigo character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE financiero.banco OWNER TO franco;

--
-- Name: banco_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.banco_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.banco_id_seq OWNER TO franco;

--
-- Name: banco_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.banco_id_seq OWNED BY financiero.banco.id;


--
-- Name: cambio; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.cambio (
    id bigint NOT NULL,
    moneda_id bigint,
    valor_en_gs numeric,
    activo boolean,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE financiero.cambio OWNER TO franco;

--
-- Name: cambio_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.cambio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.cambio_id_seq OWNER TO franco;

--
-- Name: cambio_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.cambio_id_seq OWNED BY financiero.cambio.id;


--
-- Name: cuenta_bancaria; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.cuenta_bancaria (
    id bigint NOT NULL,
    persona_id bigint,
    banco_id bigint,
    moneda_id bigint,
    numero character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    tipo_cuenta financiero.tipo_cuenta
);


ALTER TABLE financiero.cuenta_bancaria OWNER TO franco;

--
-- Name: cuenta_bancaria_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.cuenta_bancaria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.cuenta_bancaria_id_seq OWNER TO franco;

--
-- Name: cuenta_bancaria_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.cuenta_bancaria_id_seq OWNED BY financiero.cuenta_bancaria.id;


--
-- Name: forma_pago; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.forma_pago (
    id bigint NOT NULL,
    descripcion character varying NOT NULL,
    activo boolean DEFAULT true,
    movimiento_caja boolean DEFAULT false,
    cuenta_bancaria_id bigint,
    autorizacion boolean DEFAULT false,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE financiero.forma_pago OWNER TO franco;

--
-- Name: forma_pago_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.forma_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.forma_pago_id_seq OWNER TO franco;

--
-- Name: forma_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.forma_pago_id_seq OWNED BY financiero.forma_pago.id;


--
-- Name: moneda; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.moneda (
    id bigint NOT NULL,
    denominacion character varying,
    simbolo character varying,
    pais_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE financiero.moneda OWNER TO franco;

--
-- Name: moneda_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.moneda_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.moneda_id_seq OWNER TO franco;

--
-- Name: moneda_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.moneda_id_seq OWNED BY financiero.moneda.id;


--
-- Name: barrio; Type: TABLE; Schema: general; Owner: franco
--

CREATE TABLE general.barrio (
    id bigint NOT NULL,
    descripcion character varying,
    ciudad_id bigint,
    precio_delivery_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE general.barrio OWNER TO franco;

--
-- Name: barrio_id_seq; Type: SEQUENCE; Schema: general; Owner: franco
--

CREATE SEQUENCE general.barrio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE general.barrio_id_seq OWNER TO franco;

--
-- Name: barrio_id_seq; Type: SEQUENCE OWNED BY; Schema: general; Owner: franco
--

ALTER SEQUENCE general.barrio_id_seq OWNED BY general.barrio.id;


--
-- Name: ciudad; Type: TABLE; Schema: general; Owner: franco
--

CREATE TABLE general.ciudad (
    id bigint NOT NULL,
    descripcion character varying,
    pais_id bigint,
    codigo character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE general.ciudad OWNER TO franco;

--
-- Name: ciudad_id_seq; Type: SEQUENCE; Schema: general; Owner: franco
--

CREATE SEQUENCE general.ciudad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE general.ciudad_id_seq OWNER TO franco;

--
-- Name: ciudad_id_seq; Type: SEQUENCE OWNED BY; Schema: general; Owner: franco
--

ALTER SEQUENCE general.ciudad_id_seq OWNED BY general.ciudad.id;


--
-- Name: contacto; Type: TABLE; Schema: general; Owner: franco
--

CREATE TABLE general.contacto (
    id bigint NOT NULL,
    email character varying,
    telefono character varying,
    persona_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE general.contacto OWNER TO franco;

--
-- Name: contacto_id_seq; Type: SEQUENCE; Schema: general; Owner: franco
--

CREATE SEQUENCE general.contacto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE general.contacto_id_seq OWNER TO franco;

--
-- Name: contacto_id_seq; Type: SEQUENCE OWNED BY; Schema: general; Owner: franco
--

ALTER SEQUENCE general.contacto_id_seq OWNED BY general.contacto.id;


--
-- Name: pais; Type: TABLE; Schema: general; Owner: franco
--

CREATE TABLE general.pais (
    id bigint NOT NULL,
    descripcion character varying,
    codigo character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE general.pais OWNER TO franco;

--
-- Name: pais_id_seq; Type: SEQUENCE; Schema: general; Owner: franco
--

CREATE SEQUENCE general.pais_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE general.pais_id_seq OWNER TO franco;

--
-- Name: pais_id_seq; Type: SEQUENCE OWNED BY; Schema: general; Owner: franco
--

ALTER SEQUENCE general.pais_id_seq OWNED BY general.pais.id;


--
-- Name: compra; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.compra (
    id bigint NOT NULL,
    pedido_id bigint,
    sucursal_id bigint,
    proveedor_id bigint,
    contacto_proveedor_id bigint,
    fecha timestamp with time zone DEFAULT now(),
    nro_nota character varying,
    fecha_de_entrega timestamp without time zone,
    moneda_id bigint,
    descuento numeric DEFAULT 0,
    estado operaciones.compra_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    forma_pago_id bigint
);


ALTER TABLE operaciones.compra OWNER TO franco;

--
-- Name: compra_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.compra_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.compra_id_seq OWNER TO franco;

--
-- Name: compra_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.compra_id_seq OWNED BY operaciones.compra.id;


--
-- Name: compra_item; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.compra_item (
    id bigint NOT NULL,
    compra_id bigint,
    producto_id bigint,
    cantidad numeric,
    precio_unitario numeric,
    descuento_unitario numeric,
    bonificacion boolean,
    frio boolean,
    observacion character varying,
    estado operaciones.pedido_item_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE operaciones.compra_item OWNER TO franco;

--
-- Name: compra_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.compra_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.compra_item_id_seq OWNER TO franco;

--
-- Name: compra_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.compra_item_id_seq OWNED BY operaciones.compra_item.id;


--
-- Name: delivery; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.delivery (
    id bigint NOT NULL,
    venta_id bigint,
    valor_en_gs numeric,
    precio_delivery_id bigint,
    entregador_id bigint,
    telefono character varying,
    direccion character varying,
    cliente_id bigint,
    forma_pago_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    estado operaciones.delivery_estado,
    barrio_id bigint,
    vehiculo_id bigint,
    vuelto_id bigint
);


ALTER TABLE operaciones.delivery OWNER TO franco;

--
-- Name: delivery_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.delivery_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.delivery_id_seq OWNER TO franco;

--
-- Name: delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.delivery_id_seq OWNED BY operaciones.delivery.id;


--
-- Name: entrada; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.entrada (
    id bigint NOT NULL,
    responsable_carga_id bigint,
    tipo_entrada operaciones.tipo_entrada,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint,
    activo boolean DEFAULT false NOT NULL
);


ALTER TABLE operaciones.entrada OWNER TO franco;

--
-- Name: entrada_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.entrada_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.entrada_id_seq OWNER TO franco;

--
-- Name: entrada_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.entrada_id_seq OWNED BY operaciones.entrada.id;


--
-- Name: entrada_item; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.entrada_item (
    id bigint NOT NULL,
    producto_id bigint NOT NULL,
    presentacion_id bigint NOT NULL,
    cantidad numeric NOT NULL,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id bigint,
    entrada_id bigint NOT NULL
);


ALTER TABLE operaciones.entrada_item OWNER TO franco;

--
-- Name: entrada_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.entrada_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.entrada_item_id_seq OWNER TO franco;

--
-- Name: entrada_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.entrada_item_id_seq OWNED BY operaciones.entrada_item.id;


--
-- Name: motivo_diferencia_pedido; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.motivo_diferencia_pedido (
    id bigint NOT NULL,
    tipo character varying,
    descripcion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE operaciones.motivo_diferencia_pedido OWNER TO franco;

--
-- Name: motivo_diferencia_pedido_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.motivo_diferencia_pedido_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.motivo_diferencia_pedido_id_seq OWNER TO franco;

--
-- Name: motivo_diferencia_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.motivo_diferencia_pedido_id_seq OWNED BY operaciones.motivo_diferencia_pedido.id;


--
-- Name: movimiento_stock; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.movimiento_stock (
    id bigint NOT NULL,
    producto_id bigint NOT NULL,
    tipo_movimiento operaciones.tipo_movimiento NOT NULL,
    referencia bigint NOT NULL,
    cantidad numeric DEFAULT 0 NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    estado boolean DEFAULT true,
    sucursal_id bigint
);


ALTER TABLE operaciones.movimiento_stock OWNER TO franco;

--
-- Name: movimiento_stock_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.movimiento_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.movimiento_stock_id_seq OWNER TO franco;

--
-- Name: movimiento_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.movimiento_stock_id_seq OWNED BY operaciones.movimiento_stock.id;


--
-- Name: necesidad; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.necesidad (
    id bigint NOT NULL,
    sucursal_id bigint,
    fecha timestamp with time zone DEFAULT now(),
    estado operaciones.necesidad_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE operaciones.necesidad OWNER TO franco;

--
-- Name: necesidad_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.necesidad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.necesidad_id_seq OWNER TO franco;

--
-- Name: necesidad_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.necesidad_id_seq OWNED BY operaciones.necesidad.id;


--
-- Name: necesidad_item; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.necesidad_item (
    id bigint NOT NULL,
    autogenerado boolean DEFAULT true,
    cantidad_sugerida numeric DEFAULT 0,
    modificado boolean DEFAULT false,
    necesidad_id bigint,
    producto_id bigint,
    cantidad numeric DEFAULT 0,
    observacion character varying,
    estado operaciones.necesidad_item_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    frio boolean DEFAULT false
);


ALTER TABLE operaciones.necesidad_item OWNER TO franco;

--
-- Name: necesidad_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.necesidad_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.necesidad_item_id_seq OWNER TO franco;

--
-- Name: necesidad_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.necesidad_item_id_seq OWNED BY operaciones.necesidad_item.id;


--
-- Name: nota_pedido; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.nota_pedido (
    id bigint NOT NULL,
    pedido_id bigint,
    nro_nota character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE operaciones.nota_pedido OWNER TO franco;

--
-- Name: nota_pedido_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.nota_pedido_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.nota_pedido_id_seq OWNER TO franco;

--
-- Name: nota_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.nota_pedido_id_seq OWNED BY operaciones.nota_pedido.id;


--
-- Name: pedido; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.pedido (
    id bigint NOT NULL,
    necesidad_id bigint,
    proveedor_id bigint,
    vendedor_id bigint,
    fecha_de_entrega timestamp without time zone,
    dias_cheque integer,
    moneda_id bigint,
    descuento numeric DEFAULT 0,
    estado operaciones.pedido_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    cantidad_notas integer,
    cod_interno_proveedor character varying,
    forma_pago_id bigint
);


ALTER TABLE operaciones.pedido OWNER TO franco;

--
-- Name: pedido_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.pedido_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.pedido_id_seq OWNER TO franco;

--
-- Name: pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.pedido_id_seq OWNED BY operaciones.pedido.id;


--
-- Name: pedido_item; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.pedido_item (
    id bigint NOT NULL,
    pedido_id bigint,
    producto_id bigint,
    precio_unitario numeric DEFAULT 0,
    descuento_unitario numeric DEFAULT 0,
    bonificacion boolean DEFAULT false,
    frio boolean DEFAULT false,
    observacion character varying,
    estado operaciones.pedido_item_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    nota_pedido_id bigint,
    bonificacion_detalle character varying,
    vencimiento timestamp(0) without time zone
);


ALTER TABLE operaciones.pedido_item OWNER TO franco;

--
-- Name: pedido_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.pedido_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.pedido_item_id_seq OWNER TO franco;

--
-- Name: pedido_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.pedido_item_id_seq OWNED BY operaciones.pedido_item.id;


--
-- Name: pedido_item_sucursal; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.pedido_item_sucursal (
    id bigint NOT NULL,
    pedido_item_id bigint,
    sucursal_id bigint,
    sucursal_entrega_id bigint,
    cantidad numeric DEFAULT 0,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE operaciones.pedido_item_sucursal OWNER TO franco;

--
-- Name: pedido_item_sucursal_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.pedido_item_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.pedido_item_sucursal_id_seq OWNER TO franco;

--
-- Name: pedido_item_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.pedido_item_sucursal_id_seq OWNED BY operaciones.pedido_item_sucursal.id;


--
-- Name: precio_delivery; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.precio_delivery (
    id bigint NOT NULL,
    descripcion character varying,
    valor numeric,
    activo boolean DEFAULT true,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE operaciones.precio_delivery OWNER TO franco;

--
-- Name: precio_delivery_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.precio_delivery_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.precio_delivery_id_seq OWNER TO franco;

--
-- Name: precio_delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.precio_delivery_id_seq OWNED BY operaciones.precio_delivery.id;


--
-- Name: salida; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.salida (
    id bigint NOT NULL,
    responsable_carga_id bigint,
    tipo_salida operaciones.tipo_salida,
    sucursal_id bigint,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id bigint,
    activo boolean DEFAULT false NOT NULL
);


ALTER TABLE operaciones.salida OWNER TO franco;

--
-- Name: salida_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.salida_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.salida_id_seq OWNER TO franco;

--
-- Name: salida_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.salida_id_seq OWNED BY operaciones.salida.id;


--
-- Name: salida_item; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.salida_item (
    id bigint NOT NULL,
    producto_id bigint NOT NULL,
    presentacion_id bigint NOT NULL,
    cantidad numeric NOT NULL,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id bigint,
    salida_id bigint NOT NULL
);


ALTER TABLE operaciones.salida_item OWNER TO franco;

--
-- Name: salida_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.salida_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.salida_item_id_seq OWNER TO franco;

--
-- Name: salida_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.salida_item_id_seq OWNED BY operaciones.salida_item.id;


--
-- Name: venta; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.venta (
    id bigint NOT NULL,
    cliente_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    estado operaciones.venta_estado,
    total_gs numeric,
    tota_rs numeric,
    total_ds numeric,
    forma_pago_id bigint
);


ALTER TABLE operaciones.venta OWNER TO franco;

--
-- Name: venta_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.venta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.venta_id_seq OWNER TO franco;

--
-- Name: venta_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.venta_id_seq OWNED BY operaciones.venta.id;


--
-- Name: venta_item; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.venta_item (
    id bigint NOT NULL,
    venta_id bigint,
    unidad_medida productos.unidad_medida,
    precio_unitario numeric,
    costo_unitario numeric,
    existencia numeric,
    producto_id bigint,
    cantidad numeric,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    descuento_unitario numeric DEFAULT 0
);


ALTER TABLE operaciones.venta_item OWNER TO franco;

--
-- Name: venta_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.venta_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.venta_item_id_seq OWNER TO franco;

--
-- Name: venta_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.venta_item_id_seq OWNED BY operaciones.venta_item.id;


--
-- Name: vuelto; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.vuelto (
    id bigint NOT NULL,
    autorizado_por_id bigint,
    responsable_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    activo boolean DEFAULT true
);


ALTER TABLE operaciones.vuelto OWNER TO franco;

--
-- Name: vuelto_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.vuelto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.vuelto_id_seq OWNER TO franco;

--
-- Name: vuelto_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.vuelto_id_seq OWNED BY operaciones.vuelto.id;


--
-- Name: vuelto_item; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.vuelto_item (
    id bigint NOT NULL,
    vuelto_id bigint,
    valor numeric,
    moneda_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE operaciones.vuelto_item OWNER TO franco;

--
-- Name: vuelto_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.vuelto_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.vuelto_item_id_seq OWNER TO franco;

--
-- Name: vuelto_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.vuelto_item_id_seq OWNED BY operaciones.vuelto_item.id;


--
-- Name: cliente; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.cliente (
    id bigint NOT NULL,
    persona_id bigint,
    credito numeric DEFAULT 0,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE personas.cliente OWNER TO franco;

--
-- Name: cliente_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.cliente_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.cliente_id_seq OWNER TO franco;

--
-- Name: cliente_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.cliente_id_seq OWNED BY personas.cliente.id;


--
-- Name: funcionario; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.funcionario (
    id bigint NOT NULL,
    persona_id bigint,
    cargo_id bigint,
    credito numeric DEFAULT 0,
    fecha_ingreso timestamp without time zone DEFAULT now(),
    sueldo numeric DEFAULT 0,
    sector bigint,
    supervisado_por_id bigint,
    sucursal_id bigint,
    fase_prueba boolean DEFAULT true,
    diarista boolean DEFAULT false,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE personas.funcionario OWNER TO franco;

--
-- Name: funcionario_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.funcionario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.funcionario_id_seq OWNER TO franco;

--
-- Name: funcionario_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.funcionario_id_seq OWNED BY personas.funcionario.id;


--
-- Name: persona; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.persona (
    id bigint NOT NULL,
    nombre character varying,
    apodo character varying,
    documento character varying,
    nacimiento timestamp without time zone,
    sexo character varying,
    direccion character varying,
    ciudad_id bigint,
    telefono character varying,
    social_media character varying,
    imagenes character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    email character varying
);


ALTER TABLE personas.persona OWNER TO franco;

--
-- Name: persona_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.persona_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.persona_id_seq OWNER TO franco;

--
-- Name: persona_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.persona_id_seq OWNED BY personas.persona.id;


--
-- Name: proveedor; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.proveedor (
    id bigint NOT NULL,
    persona_id bigint,
    credito boolean DEFAULT false,
    tipo_credito character varying,
    cheque_dias numeric,
    datos_bancarios_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    funcionario_encargado_id bigint
);


ALTER TABLE personas.proveedor OWNER TO franco;

--
-- Name: proveedor_dias_visita; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.proveedor_dias_visita (
    id bigint NOT NULL,
    proveedor_id bigint,
    dia general.dias_semana,
    hora integer,
    observacion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE personas.proveedor_dias_visita OWNER TO franco;

--
-- Name: proveedor_dias_visita_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.proveedor_dias_visita_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.proveedor_dias_visita_id_seq OWNER TO franco;

--
-- Name: proveedor_dias_visita_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.proveedor_dias_visita_id_seq OWNED BY personas.proveedor_dias_visita.id;


--
-- Name: proveedor_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.proveedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.proveedor_id_seq OWNER TO franco;

--
-- Name: proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.proveedor_id_seq OWNED BY personas.proveedor.id;


--
-- Name: role; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.role (
    id bigint NOT NULL,
    nombre character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE personas.role OWNER TO franco;

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.role_id_seq OWNER TO franco;

--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.role_id_seq OWNED BY personas.role.id;


--
-- Name: usuario; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.usuario (
    id bigint NOT NULL,
    persona_id bigint,
    password character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    nickname character varying,
    email character varying,
    activo boolean DEFAULT true
);


ALTER TABLE personas.usuario OWNER TO franco;

--
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.usuario_id_seq OWNER TO franco;

--
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.usuario_id_seq OWNED BY personas.usuario.id;


--
-- Name: usuario_role; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.usuario_role (
    id bigint NOT NULL,
    role_id bigint,
    user_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE personas.usuario_role OWNER TO franco;

--
-- Name: usuario_role_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.usuario_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.usuario_role_id_seq OWNER TO franco;

--
-- Name: usuario_role_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.usuario_role_id_seq OWNED BY personas.usuario_role.id;


--
-- Name: vendedor; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.vendedor (
    id bigint NOT NULL,
    persona_id bigint,
    activo boolean DEFAULT true,
    observacion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE personas.vendedor OWNER TO franco;

--
-- Name: vendedor_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.vendedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.vendedor_id_seq OWNER TO franco;

--
-- Name: vendedor_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.vendedor_id_seq OWNED BY personas.vendedor.id;


--
-- Name: vendedor_proveedor; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.vendedor_proveedor (
    id bigint NOT NULL,
    vendedor_id bigint,
    proveedor_id bigint,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE personas.vendedor_proveedor OWNER TO franco;

--
-- Name: vendedor_proveedor_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.vendedor_proveedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.vendedor_proveedor_id_seq OWNER TO franco;

--
-- Name: vendedor_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.vendedor_proveedor_id_seq OWNED BY personas.vendedor_proveedor.id;


--
-- Name: codigo; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.codigo (
    id bigint NOT NULL,
    codigo character varying,
    principal boolean,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    activo boolean,
    presentacion_id bigint NOT NULL
);


ALTER TABLE productos.codigo OWNER TO franco;

--
-- Name: codigo_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.codigo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.codigo_id_seq OWNER TO franco;

--
-- Name: codigo_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.codigo_id_seq OWNED BY productos.codigo.id;


--
-- Name: codigo_tipo_precio; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.codigo_tipo_precio (
    id bigint NOT NULL,
    codigo_id bigint NOT NULL,
    tipo_precio_id bigint NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint NOT NULL
);


ALTER TABLE productos.codigo_tipo_precio OWNER TO franco;

--
-- Name: codigo_tipo_precio_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.codigo_tipo_precio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.codigo_tipo_precio_id_seq OWNER TO franco;

--
-- Name: codigo_tipo_precio_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.codigo_tipo_precio_id_seq OWNED BY productos.codigo_tipo_precio.id;


--
-- Name: costos_por_sucursal; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.costos_por_sucursal (
    id bigint NOT NULL,
    producto_id bigint,
    sucursal_id bigint,
    ultimo_precio_compra numeric,
    ultimo_precio_venta numeric,
    costo_medio numeric,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    existencia numeric,
    movimiento_stock_id bigint,
    moneda_id bigint
);


ALTER TABLE productos.costos_por_sucursal OWNER TO franco;

--
-- Name: costos_por_sucursal_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.costos_por_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.costos_por_sucursal_id_seq OWNER TO franco;

--
-- Name: costos_por_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.costos_por_sucursal_id_seq OWNED BY productos.costos_por_sucursal.id;


--
-- Name: familia; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.familia (
    id bigint NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    icono character varying,
    nombre character varying,
    posicion numeric
);


ALTER TABLE productos.familia OWNER TO franco;

--
-- Name: familia_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.familia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.familia_id_seq OWNER TO franco;

--
-- Name: familia_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.familia_id_seq OWNED BY productos.familia.id;


--
-- Name: producto_imagen; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.producto_imagen (
    id bigint NOT NULL,
    producto_id bigint,
    ruta character varying,
    principal boolean,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE productos.producto_imagen OWNER TO franco;

--
-- Name: imagenes_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.imagenes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.imagenes_id_seq OWNER TO franco;

--
-- Name: imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.imagenes_id_seq OWNED BY productos.producto_imagen.id;


--
-- Name: pdv_categoria; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.pdv_categoria (
    id bigint NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE productos.pdv_categoria OWNER TO franco;

--
-- Name: pdv_categoria_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.pdv_categoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.pdv_categoria_id_seq OWNER TO franco;

--
-- Name: pdv_categoria_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.pdv_categoria_id_seq OWNED BY productos.pdv_categoria.id;


--
-- Name: pdv_grupo; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.pdv_grupo (
    id bigint NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    categoria_id bigint
);


ALTER TABLE productos.pdv_grupo OWNER TO franco;

--
-- Name: pdv_grupo_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.pdv_grupo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.pdv_grupo_id_seq OWNER TO franco;

--
-- Name: pdv_grupo_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.pdv_grupo_id_seq OWNED BY productos.pdv_grupo.id;


--
-- Name: pdv_grupos_productos; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.pdv_grupos_productos (
    id bigint NOT NULL,
    producto_id bigint,
    grupo_id bigint,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp(0) without time zone DEFAULT now()
);


ALTER TABLE productos.pdv_grupos_productos OWNER TO franco;

--
-- Name: pdv_grupos_productos_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.pdv_grupos_productos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.pdv_grupos_productos_id_seq OWNER TO franco;

--
-- Name: pdv_grupos_productos_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.pdv_grupos_productos_id_seq OWNED BY productos.pdv_grupos_productos.id;


--
-- Name: precio_por_sucursal; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.precio_por_sucursal (
    id bigint NOT NULL,
    sucursal_id bigint,
    precio numeric,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    presentacion_id bigint NOT NULL,
    tipo_precio_id bigint,
    principal boolean DEFAULT false,
    activo boolean DEFAULT true
);


ALTER TABLE productos.precio_por_sucursal OWNER TO franco;

--
-- Name: precio_por_sucursal_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.precio_por_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.precio_por_sucursal_id_seq OWNER TO franco;

--
-- Name: precio_por_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.precio_por_sucursal_id_seq OWNED BY productos.precio_por_sucursal.id;


--
-- Name: presentacion; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.presentacion (
    id bigint NOT NULL,
    producto_id bigint NOT NULL,
    cantidad numeric NOT NULL,
    descripcion character varying,
    principal boolean DEFAULT false,
    activo boolean DEFAULT true,
    tipo_presentacion_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE productos.presentacion OWNER TO franco;

--
-- Name: presentacion_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.presentacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.presentacion_id_seq OWNER TO franco;

--
-- Name: presentacion_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.presentacion_id_seq OWNED BY productos.presentacion.id;


--
-- Name: producto; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.producto (
    id bigint NOT NULL,
    id_central bigint,
    propagado boolean DEFAULT false,
    descripcion character varying,
    descripcion_factura character varying,
    iva character varying,
    unidad_por_caja numeric DEFAULT 1,
    balanza boolean DEFAULT false,
    combo boolean DEFAULT false,
    garantia boolean DEFAULT false,
    ingrediente boolean DEFAULT false,
    promocion boolean DEFAULT false,
    vencimiento boolean DEFAULT true,
    stock boolean DEFAULT true,
    usuario_id bigint,
    tipo_conservacion productos.tipo_conservacion,
    creado_en timestamp with time zone DEFAULT now(),
    sub_familia_id bigint,
    observacion character varying,
    cambiable boolean DEFAULT false,
    es_alcoholico boolean DEFAULT false,
    unidad_por_caja_secundaria numeric DEFAULT 2,
    imagenes character varying,
    tiempo_garantia numeric,
    dias_vencimiento numeric,
    id_sucursal_origen bigint,
    activo boolean DEFAULT true
);


ALTER TABLE productos.producto OWNER TO franco;

--
-- Name: COLUMN producto.descripcion; Type: COMMENT; Schema: productos; Owner: franco
--

COMMENT ON COLUMN productos.producto.descripcion IS 'Descripcion del producto';


--
-- Name: producto_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.producto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.producto_id_seq OWNER TO franco;

--
-- Name: producto_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.producto_id_seq OWNED BY productos.producto.id;


--
-- Name: producto_por_sucursal; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.producto_por_sucursal (
    id bigint NOT NULL,
    producto_id bigint,
    sucursal_id bigint,
    cant_minima numeric,
    cant_media numeric,
    cant_maxima numeric,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE productos.producto_por_sucursal OWNER TO franco;

--
-- Name: producto_proveedor; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.producto_proveedor (
    id bigint NOT NULL,
    producto_id bigint,
    proveedor_id bigint,
    pedido_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE productos.producto_proveedor OWNER TO franco;

--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.producto_proveedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.producto_proveedor_id_seq OWNER TO franco;

--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.producto_proveedor_id_seq OWNED BY productos.producto_proveedor.id;


--
-- Name: productos_por_sucursal_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.productos_por_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.productos_por_sucursal_id_seq OWNER TO franco;

--
-- Name: productos_por_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.productos_por_sucursal_id_seq OWNED BY productos.producto_por_sucursal.id;


--
-- Name: subfamilia; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.subfamilia (
    id bigint NOT NULL,
    familia_id bigint,
    descripcion character varying,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    sub_familia_id bigint,
    icono character varying,
    nombre character varying,
    posicion numeric
);


ALTER TABLE productos.subfamilia OWNER TO franco;

--
-- Name: subfamilia_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.subfamilia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.subfamilia_id_seq OWNER TO franco;

--
-- Name: subfamilia_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.subfamilia_id_seq OWNED BY productos.subfamilia.id;


--
-- Name: tipo_precio; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.tipo_precio (
    id bigint NOT NULL,
    descripcion character varying,
    autorizacion boolean,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    activo boolean DEFAULT true
);


ALTER TABLE productos.tipo_precio OWNER TO franco;

--
-- Name: tipo_precio_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.tipo_precio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.tipo_precio_id_seq OWNER TO franco;

--
-- Name: tipo_precio_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.tipo_precio_id_seq OWNED BY productos.tipo_precio.id;


--
-- Name: tipo_presentacion; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.tipo_presentacion (
    id bigint NOT NULL,
    descripcion character varying NOT NULL,
    unico boolean DEFAULT false,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE productos.tipo_presentacion OWNER TO franco;

--
-- Name: tipo_presentacion_id_seq; Type: SEQUENCE; Schema: productos; Owner: franco
--

CREATE SEQUENCE productos.tipo_presentacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE productos.tipo_presentacion_id_seq OWNER TO franco;

--
-- Name: tipo_presentacion_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: franco
--

ALTER SEQUENCE productos.tipo_presentacion_id_seq OWNED BY productos.tipo_presentacion.id;


--
-- Name: producto_proveedor; Type: TABLE; Schema: public; Owner: franco
--

CREATE TABLE public.producto_proveedor (
    id bigint NOT NULL,
    producto_id bigint,
    proveedor_id bigint,
    pedido_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.producto_proveedor OWNER TO franco;

--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: franco
--

CREATE SEQUENCE public.producto_proveedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.producto_proveedor_id_seq OWNER TO franco;

--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: franco
--

ALTER SEQUENCE public.producto_proveedor_id_seq OWNED BY public.producto_proveedor.id;


--
-- Name: marca; Type: TABLE; Schema: vehiculos; Owner: franco
--

CREATE TABLE vehiculos.marca (
    id bigint NOT NULL,
    descripcion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE vehiculos.marca OWNER TO franco;

--
-- Name: marca_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: franco
--

CREATE SEQUENCE vehiculos.marca_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE vehiculos.marca_id_seq OWNER TO franco;

--
-- Name: marca_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: franco
--

ALTER SEQUENCE vehiculos.marca_id_seq OWNED BY vehiculos.marca.id;


--
-- Name: modelo; Type: TABLE; Schema: vehiculos; Owner: franco
--

CREATE TABLE vehiculos.modelo (
    id bigint NOT NULL,
    descripcion character varying,
    marca_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE vehiculos.modelo OWNER TO franco;

--
-- Name: modelo_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: franco
--

CREATE SEQUENCE vehiculos.modelo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE vehiculos.modelo_id_seq OWNER TO franco;

--
-- Name: modelo_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: franco
--

ALTER SEQUENCE vehiculos.modelo_id_seq OWNED BY vehiculos.modelo.id;


--
-- Name: tipo_vehiculo; Type: TABLE; Schema: vehiculos; Owner: franco
--

CREATE TABLE vehiculos.tipo_vehiculo (
    id bigint NOT NULL,
    descripcion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE vehiculos.tipo_vehiculo OWNER TO franco;

--
-- Name: tipo_vehiculo_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: franco
--

CREATE SEQUENCE vehiculos.tipo_vehiculo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE vehiculos.tipo_vehiculo_id_seq OWNER TO franco;

--
-- Name: tipo_vehiculo_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: franco
--

ALTER SEQUENCE vehiculos.tipo_vehiculo_id_seq OWNED BY vehiculos.tipo_vehiculo.id;


--
-- Name: vehiculo; Type: TABLE; Schema: vehiculos; Owner: franco
--

CREATE TABLE vehiculos.vehiculo (
    id bigint NOT NULL,
    color character varying,
    chapa character varying,
    documentacion boolean DEFAULT false,
    refrigerado boolean DEFAULT false,
    nuevo boolean DEFAULT true,
    fecha_adquisicion timestamp without time zone,
    primer_kilometraje numeric DEFAULT 0,
    tipo_vehiculo bigint,
    imagenes_documentos character varying,
    imagenes_vehiculo character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    anho numeric,
    capacidad_kg numeric,
    capacidad_pasajeros numeric,
    modelo_id bigint
);


ALTER TABLE vehiculos.vehiculo OWNER TO franco;

--
-- Name: vehiculo_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: franco
--

CREATE SEQUENCE vehiculos.vehiculo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE vehiculos.vehiculo_id_seq OWNER TO franco;

--
-- Name: vehiculo_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: franco
--

ALTER SEQUENCE vehiculos.vehiculo_id_seq OWNED BY vehiculos.vehiculo.id;


--
-- Name: vehiculo_sucursal; Type: TABLE; Schema: vehiculos; Owner: franco
--

CREATE TABLE vehiculos.vehiculo_sucursal (
    id bigint NOT NULL,
    sucursal_id bigint,
    vehiculo_id bigint,
    responsable_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE vehiculos.vehiculo_sucursal OWNER TO franco;

--
-- Name: vehiculo_sucursal_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: franco
--

CREATE SEQUENCE vehiculos.vehiculo_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE vehiculos.vehiculo_sucursal_id_seq OWNER TO franco;

--
-- Name: vehiculo_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: franco
--

ALTER SEQUENCE vehiculos.vehiculo_sucursal_id_seq OWNED BY vehiculos.vehiculo_sucursal.id;


--
-- Name: id; Type: DEFAULT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion ALTER COLUMN id SET DEFAULT nextval('administrativo.autorizacion_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.marcacion ALTER COLUMN id SET DEFAULT nextval('administrativo.marcacion_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.inicio_sesion ALTER COLUMN id SET DEFAULT nextval('configuraciones.inicio_sesion_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.local ALTER COLUMN id SET DEFAULT nextval('configuraciones.local_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.cargo ALTER COLUMN id SET DEFAULT nextval('empresarial.cargo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sucursal ALTER COLUMN id SET DEFAULT nextval('empresarial.sucursal_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: equipos; Owner: franco
--

ALTER TABLE ONLY equipos.equipo ALTER COLUMN id SET DEFAULT nextval('equipos.equipo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: equipos; Owner: franco
--

ALTER TABLE ONLY equipos.tipo_equipo ALTER COLUMN id SET DEFAULT nextval('equipos.tipo_equipo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.banco ALTER COLUMN id SET DEFAULT nextval('financiero.banco_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio ALTER COLUMN id SET DEFAULT nextval('financiero.cambio_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cuenta_bancaria ALTER COLUMN id SET DEFAULT nextval('financiero.cuenta_bancaria_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.forma_pago ALTER COLUMN id SET DEFAULT nextval('financiero.forma_pago_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda ALTER COLUMN id SET DEFAULT nextval('financiero.moneda_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.barrio ALTER COLUMN id SET DEFAULT nextval('general.barrio_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.ciudad ALTER COLUMN id SET DEFAULT nextval('general.ciudad_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.contacto ALTER COLUMN id SET DEFAULT nextval('general.contacto_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.pais ALTER COLUMN id SET DEFAULT nextval('general.pais_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra ALTER COLUMN id SET DEFAULT nextval('operaciones.compra_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra_item ALTER COLUMN id SET DEFAULT nextval('operaciones.compra_item_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery ALTER COLUMN id SET DEFAULT nextval('operaciones.delivery_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada ALTER COLUMN id SET DEFAULT nextval('operaciones.entrada_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada_item ALTER COLUMN id SET DEFAULT nextval('operaciones.entrada_item_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido ALTER COLUMN id SET DEFAULT nextval('operaciones.motivo_diferencia_pedido_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.movimiento_stock ALTER COLUMN id SET DEFAULT nextval('operaciones.movimiento_stock_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.necesidad ALTER COLUMN id SET DEFAULT nextval('operaciones.necesidad_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.necesidad_item ALTER COLUMN id SET DEFAULT nextval('operaciones.necesidad_item_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_pedido ALTER COLUMN id SET DEFAULT nextval('operaciones.nota_pedido_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido ALTER COLUMN id SET DEFAULT nextval('operaciones.pedido_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item ALTER COLUMN id SET DEFAULT nextval('operaciones.pedido_item_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item_sucursal ALTER COLUMN id SET DEFAULT nextval('operaciones.pedido_item_sucursal_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.precio_delivery ALTER COLUMN id SET DEFAULT nextval('operaciones.precio_delivery_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida ALTER COLUMN id SET DEFAULT nextval('operaciones.salida_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida_item ALTER COLUMN id SET DEFAULT nextval('operaciones.salida_item_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta ALTER COLUMN id SET DEFAULT nextval('operaciones.venta_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta_item ALTER COLUMN id SET DEFAULT nextval('operaciones.venta_item_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto ALTER COLUMN id SET DEFAULT nextval('operaciones.vuelto_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto_item ALTER COLUMN id SET DEFAULT nextval('operaciones.vuelto_item_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.cliente ALTER COLUMN id SET DEFAULT nextval('personas.cliente_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.funcionario ALTER COLUMN id SET DEFAULT nextval('personas.funcionario_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.persona ALTER COLUMN id SET DEFAULT nextval('personas.persona_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.proveedor ALTER COLUMN id SET DEFAULT nextval('personas.proveedor_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.proveedor_dias_visita ALTER COLUMN id SET DEFAULT nextval('personas.proveedor_dias_visita_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.role ALTER COLUMN id SET DEFAULT nextval('personas.role_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario ALTER COLUMN id SET DEFAULT nextval('personas.usuario_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario_role ALTER COLUMN id SET DEFAULT nextval('personas.usuario_role_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.vendedor ALTER COLUMN id SET DEFAULT nextval('personas.vendedor_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.vendedor_proveedor ALTER COLUMN id SET DEFAULT nextval('personas.vendedor_proveedor_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo ALTER COLUMN id SET DEFAULT nextval('productos.codigo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo_tipo_precio ALTER COLUMN id SET DEFAULT nextval('productos.codigo_tipo_precio_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costos_por_sucursal ALTER COLUMN id SET DEFAULT nextval('productos.costos_por_sucursal_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.familia ALTER COLUMN id SET DEFAULT nextval('productos.familia_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_categoria ALTER COLUMN id SET DEFAULT nextval('productos.pdv_categoria_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_grupo ALTER COLUMN id SET DEFAULT nextval('productos.pdv_grupo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_grupos_productos ALTER COLUMN id SET DEFAULT nextval('productos.pdv_grupos_productos_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal ALTER COLUMN id SET DEFAULT nextval('productos.precio_por_sucursal_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.presentacion ALTER COLUMN id SET DEFAULT nextval('productos.presentacion_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto ALTER COLUMN id SET DEFAULT nextval('productos.producto_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_imagen ALTER COLUMN id SET DEFAULT nextval('productos.imagenes_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_por_sucursal ALTER COLUMN id SET DEFAULT nextval('productos.productos_por_sucursal_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_proveedor ALTER COLUMN id SET DEFAULT nextval('productos.producto_proveedor_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.subfamilia ALTER COLUMN id SET DEFAULT nextval('productos.subfamilia_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.tipo_precio ALTER COLUMN id SET DEFAULT nextval('productos.tipo_precio_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.tipo_presentacion ALTER COLUMN id SET DEFAULT nextval('productos.tipo_presentacion_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: franco
--

ALTER TABLE ONLY public.producto_proveedor ALTER COLUMN id SET DEFAULT nextval('public.producto_proveedor_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.marca ALTER COLUMN id SET DEFAULT nextval('vehiculos.marca_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.modelo ALTER COLUMN id SET DEFAULT nextval('vehiculos.modelo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.tipo_vehiculo ALTER COLUMN id SET DEFAULT nextval('vehiculos.tipo_vehiculo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo ALTER COLUMN id SET DEFAULT nextval('vehiculos.vehiculo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal ALTER COLUMN id SET DEFAULT nextval('vehiculos.vehiculo_sucursal_id_seq'::regclass);


--
-- Data for Name: autorizacion; Type: TABLE DATA; Schema: administrativo; Owner: franco
--

COPY administrativo.autorizacion (id, funcionario_id, autorizador_id, tipo_autorizacion, estado_autorizacion, observacion, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: autorizacion_id_seq; Type: SEQUENCE SET; Schema: administrativo; Owner: franco
--

SELECT pg_catalog.setval('administrativo.autorizacion_id_seq', 1, false);


--
-- Data for Name: marcacion; Type: TABLE DATA; Schema: administrativo; Owner: franco
--

COPY administrativo.marcacion (id, tipo_marcacion, presencial, autorizacion, sucursal_id, codigo, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: marcacion_id_seq; Type: SEQUENCE SET; Schema: administrativo; Owner: franco
--

SELECT pg_catalog.setval('administrativo.marcacion_id_seq', 1, false);


--
-- Data for Name: bucardo_delta_names; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.bucardo_delta_names (sync, tablename, deltaname, trackname, cdate) FROM stdin;
general_sync	productos.codigo	delta_productos_codigo	track_productos_codigo	2021-08-13 16:35:53.249233+00
general_sync	productos.costos_por_sucursal	delta_productos_costos_por_sucursal	track_productos_costos_por_sucursal	2021-08-13 16:35:53.249233+00
general_sync	productos.familia	delta_productos_familia	track_productos_familia	2021-08-13 16:35:53.249233+00
general_sync	productos.precio_por_sucursal	delta_productos_precio_por_sucursal	track_productos_precio_por_sucursal	2021-08-13 16:35:53.249233+00
general_sync	productos.producto	delta_productos_producto	track_productos_producto	2021-08-13 16:35:53.249233+00
general_sync	productos.subfamilia	delta_productos_subfamilia	track_productos_subfamilia	2021-08-13 16:35:53.249233+00
general_sync	productos.tipo_precio	delta_productos_tipo_precio	track_productos_tipo_precio	2021-08-13 16:35:53.249233+00
\.


--
-- Data for Name: bucardo_delta_targets; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.bucardo_delta_targets (tablename, target, cdate) FROM stdin;
17092	dbgroup general_relgroup	2021-08-13 15:51:33.087175+00
17016	dbgroup general_relgroup	2021-08-13 16:34:26.577886+00
17028	dbgroup general_relgroup	2021-08-13 16:34:26.577886+00
17037	dbgroup general_relgroup	2021-08-13 16:34:26.577886+00
17083	dbgroup general_relgroup	2021-08-13 16:34:26.577886+00
17127	dbgroup general_relgroup	2021-08-13 16:34:26.577886+00
17137	dbgroup general_relgroup	2021-08-13 16:34:26.577886+00
\.


--
-- Data for Name: bucardo_sequences; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.bucardo_sequences (schemaname, seqname, syncname, targetname, last_value, start_value, increment_by, max_value, min_value, is_cycled, is_called) FROM stdin;
\.


--
-- Data for Name: bucardo_truncate_trigger; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.bucardo_truncate_trigger (tablename, sname, tname, sync, replicated, cdate) FROM stdin;
\.


--
-- Data for Name: bucardo_truncate_trigger_log; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.bucardo_truncate_trigger_log (tablename, sname, tname, sync, target, replicated, cdate) FROM stdin;
\.


--
-- Data for Name: delta_productos_codigo; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_codigo (id, txntime) FROM stdin;
43	2021-08-25 20:17:48.086387+00
43	2021-08-25 20:18:03.838498+00
44	2021-08-31 18:01:43.850219+00
44	2021-08-31 18:17:09.297703+00
45	2021-08-31 18:17:37.374657+00
45	2021-08-31 18:32:18.666794+00
78	2021-08-31 18:34:43.820671+00
78	2021-08-31 18:35:42.826618+00
79	2021-08-31 18:38:23.977181+00
79	2021-08-31 18:40:37.588725+00
80	2021-08-31 18:41:03.896171+00
80	2021-08-31 18:45:02.526758+00
80	2021-08-31 18:45:36.821284+00
80	2021-08-31 18:46:15.440954+00
24	2021-09-02 15:32:18.064613+00
25	2021-09-02 15:32:18.082925+00
26	2021-09-02 15:32:18.096249+00
27	2021-09-02 15:32:18.109297+00
28	2021-09-02 15:32:18.124147+00
22	2021-09-02 15:32:18.141538+00
1	2021-09-02 15:32:18.159326+00
19	2021-09-02 15:32:18.171575+00
35	2021-09-02 15:32:18.18832+00
36	2021-09-02 15:32:18.202743+00
9	2021-09-02 15:32:18.220054+00
10	2021-09-02 15:32:18.235262+00
11	2021-09-02 15:32:18.249231+00
12	2021-09-02 15:32:18.263102+00
13	2021-09-02 15:32:18.277073+00
14	2021-09-02 15:32:18.293959+00
15	2021-09-02 15:32:18.308903+00
16	2021-09-02 15:32:18.327706+00
17	2021-09-02 15:32:18.343714+00
5	2021-09-02 15:32:18.358907+00
4	2021-09-02 15:32:18.37326+00
20	2021-09-02 15:32:18.387074+00
37	2021-09-02 15:32:18.40487+00
23	2021-09-02 15:32:18.419623+00
39	2021-09-02 15:32:18.435706+00
43	2021-09-02 15:32:18.451562+00
80	2021-09-02 15:32:18.467312+00
81	2021-09-02 15:51:31.148852+00
81	2021-09-02 16:23:28.525635+00
82	2021-09-02 17:19:58.258358+00
81	2021-09-02 17:20:47.495355+00
82	2021-09-02 17:22:23.272196+00
81	2021-09-02 17:22:23.289112+00
83	2021-09-02 17:23:08.316786+00
83	2021-09-02 17:24:41.331796+00
84	2021-09-02 17:25:49.659847+00
84	2021-09-02 17:27:10.475381+00
85	2021-09-02 17:28:10.149335+00
85	2021-09-02 17:33:40.490324+00
87	2021-09-02 18:09:03.975357+00
88	2021-09-02 18:09:36.484969+00
89	2021-09-02 18:17:24.842012+00
90	2021-09-07 18:31:38.425685+00
91	2021-09-07 18:55:38.293381+00
92	2021-09-07 19:10:20.636977+00
93	2021-09-08 18:58:27.080376+00
94	2021-09-08 19:09:45.220482+00
95	2021-09-08 19:11:33.607212+00
85	2021-09-09 13:53:40.224108+00
87	2021-09-09 13:53:40.24187+00
88	2021-09-09 13:53:40.25461+00
89	2021-09-09 13:53:40.268204+00
90	2021-09-09 13:53:40.281191+00
91	2021-09-09 13:53:40.295535+00
92	2021-09-09 13:53:40.307658+00
93	2021-09-09 13:53:40.32011+00
94	2021-09-09 13:53:40.331554+00
95	2021-09-09 13:53:40.349091+00
1	2021-09-09 14:43:48.602797+00
4	2021-09-09 14:50:39.495579+00
5	2021-09-09 14:50:39.497861+00
6	2021-09-09 14:50:39.503745+00
8	2021-09-09 14:50:39.508691+00
9	2021-09-09 14:50:39.510539+00
7	2021-09-09 14:50:39.504763+00
10	2021-09-09 14:50:39.581205+00
11	2021-09-09 14:50:39.626102+00
12	2021-09-09 14:50:39.653304+00
13	2021-09-09 14:50:39.662895+00
14	2021-09-09 14:50:39.66465+00
15	2021-09-09 14:50:39.665181+00
16	2021-09-09 14:50:39.67121+00
17	2021-09-09 14:52:20.626406+00
20	2021-09-09 14:59:42.238527+00
21	2021-09-09 15:00:06.334759+00
22	2021-09-09 17:43:45.205913+00
23	2021-09-09 17:44:00.9662+00
25	2021-09-13 18:45:02.246926+00
1	2021-09-13 18:58:58.717931+00
26	2021-09-14 15:34:33.726255+00
27	2021-09-14 15:35:03.253441+00
27	2021-09-14 15:36:33.631671+00
26	2021-09-14 17:14:18.226246+00
28	2021-09-14 17:16:24.157581+00
29	2021-09-14 17:29:06.240208+00
29	2021-09-14 17:34:43.03898+00
31	2021-09-14 17:37:12.34552+00
32	2021-09-14 20:48:30.125176+00
33	2021-09-15 14:13:27.827638+00
34	2021-09-15 14:13:59.96332+00
35	2021-09-15 15:34:41.484202+00
25	2021-09-15 15:50:44.49939+00
36	2021-09-15 15:52:18.117252+00
37	2021-09-15 15:52:25.984909+00
38	2021-09-15 15:52:35.094436+00
39	2021-09-15 16:06:41.362362+00
40	2021-09-15 16:06:58.315813+00
23	2021-09-15 16:12:08.357492+00
38	2021-09-15 16:12:16.908779+00
5	2021-09-15 16:12:26.543792+00
6	2021-09-15 16:12:29.308934+00
8	2021-09-15 16:12:31.719528+00
9	2021-09-15 16:12:33.651275+00
10	2021-09-15 16:12:35.600911+00
11	2021-09-15 16:12:37.460278+00
12	2021-09-15 16:12:39.646931+00
13	2021-09-15 16:12:41.560955+00
14	2021-09-15 16:12:43.587847+00
15	2021-09-15 16:12:44.717729+00
16	2021-09-15 16:12:45.767931+00
17	2021-09-15 16:12:46.599746+00
20	2021-09-15 16:12:47.615584+00
7	2021-09-15 16:12:51.923987+00
21	2021-09-15 16:12:52.959101+00
22	2021-09-15 16:12:53.97924+00
4	2021-09-15 16:13:06.138637+00
41	2021-09-15 16:14:23.787341+00
42	2021-09-15 16:14:34.034861+00
43	2021-09-15 16:14:48.42927+00
44	2021-09-15 16:27:38.862965+00
45	2021-09-15 16:27:49.771058+00
46	2021-09-15 16:32:17.461858+00
47	2021-09-15 16:32:26.241409+00
48	2021-09-15 16:32:32.529841+00
49	2021-09-15 16:32:42.08025+00
50	2021-09-15 16:33:13.529739+00
51	2021-09-15 17:56:42.067381+00
52	2021-09-15 17:57:03.946835+00
53	2021-09-15 17:57:26.29233+00
54	2021-09-15 18:22:06.920064+00
55	2021-09-15 18:22:15.384492+00
56	2021-09-15 19:01:26.180475+00
57	2021-09-15 19:17:50.975134+00
58	2021-09-15 19:17:58.162739+00
59	2021-09-15 19:18:10.943841+00
60	2021-09-15 19:25:10.010805+00
61	2021-09-15 19:25:23.24845+00
62	2021-09-15 19:25:32.619166+00
63	2021-09-15 19:33:06.85576+00
64	2021-09-15 19:33:13.578899+00
65	2021-09-15 19:33:40.168672+00
66	2021-09-15 19:35:24.476434+00
67	2021-09-15 19:35:33.638546+00
68	2021-09-15 19:35:47.021691+00
69	2021-09-15 19:56:10.042808+00
70	2021-09-15 19:56:17.658869+00
71	2021-09-15 19:56:29.3018+00
72	2021-09-15 20:10:42.688611+00
73	2021-09-15 20:10:52.033415+00
74	2021-09-15 20:11:07.843012+00
75	2021-09-15 20:12:34.303204+00
76	2021-09-15 20:12:44.277165+00
77	2021-09-15 20:12:57.040122+00
78	2021-09-15 20:30:00.55752+00
79	2021-09-15 20:40:19.790941+00
80	2021-09-15 20:46:29.383813+00
81	2021-09-15 20:47:15.930317+00
82	2021-09-15 20:47:41.440114+00
83	2021-09-15 20:50:12.861415+00
84	2021-09-15 20:53:44.575663+00
85	2021-09-15 21:00:13.221346+00
86	2021-09-15 21:02:56.389104+00
87	2021-09-17 18:36:51.414768+00
88	2021-09-17 18:37:08.415247+00
89	2021-09-17 18:37:23.289139+00
90	2021-09-17 18:42:52.926438+00
91	2021-09-17 18:42:59.667082+00
92	2021-09-17 18:43:15.623713+00
93	2021-09-17 18:49:17.559875+00
94	2021-09-17 18:49:24.79336+00
95	2021-09-17 18:49:36.031281+00
96	2021-09-17 18:55:05.673533+00
97	2021-09-17 18:55:16.803842+00
98	2021-09-17 19:15:16.824514+00
99	2021-09-17 19:19:26.432159+00
100	2021-09-17 19:45:17.535575+00
100	2021-09-17 19:48:58.799801+00
101	2021-09-17 19:49:07.962048+00
101	2021-09-17 19:50:09.277448+00
102	2021-09-17 19:50:16.635047+00
103	2021-09-17 19:54:05.511958+00
104	2021-09-17 19:54:14.616734+00
105	2021-09-17 20:01:34.352075+00
106	2021-09-18 17:48:09.950418+00
107	2021-09-18 17:49:05.166907+00
108	2021-09-18 17:51:29.539834+00
109	2021-09-18 17:52:10.104553+00
110	2021-09-18 17:54:14.81301+00
111	2021-09-18 17:54:23.398624+00
112	2021-09-18 17:58:06.501665+00
113	2021-09-18 17:59:50.868221+00
114	2021-09-18 18:00:27.707824+00
115	2021-09-18 18:00:47.201782+00
116	2021-09-18 18:04:28.869422+00
117	2021-09-18 18:05:58.79796+00
118	2021-09-18 18:06:30.670138+00
119	2021-09-18 18:06:58.293835+00
120	2021-09-18 18:10:24.931479+00
121	2021-09-18 18:10:50.00002+00
122	2021-09-18 18:10:58.605799+00
123	2021-09-18 18:16:26.592823+00
124	2021-09-18 18:20:40.555157+00
125	2021-09-18 18:23:10.100095+00
126	2021-09-18 18:24:51.727039+00
127	2021-09-18 18:28:43.197922+00
128	2021-09-18 18:30:37.801603+00
129	2021-09-18 18:32:43.801533+00
130	2021-09-18 18:34:46.450045+00
131	2021-09-18 18:36:45.952077+00
132	2021-09-18 18:53:19.588495+00
133	2021-09-18 18:54:09.757717+00
134	2021-09-18 18:57:54.772461+00
135	2021-09-18 19:02:59.702432+00
136	2021-09-18 19:11:17.547999+00
137	2021-09-18 19:11:27.392902+00
138	2021-09-18 19:12:47.154018+00
139	2021-09-18 19:18:28.255673+00
140	2021-09-18 19:18:44.746143+00
141	2021-09-18 19:20:51.761068+00
142	2021-09-18 19:21:00.618104+00
143	2021-09-18 19:21:20.841399+00
144	2021-09-18 19:30:38.913631+00
145	2021-09-18 19:30:52.749813+00
145	2021-09-18 19:32:50.740842+00
146	2021-09-18 19:34:58.723804+00
147	2021-09-18 19:35:12.102659+00
148	2021-09-18 19:35:51.05851+00
149	2021-09-18 19:38:49.870242+00
150	2021-09-18 19:41:07.247211+00
151	2021-09-18 19:41:32.102524+00
152	2021-09-18 19:42:10.435286+00
153	2021-09-18 19:42:21.505053+00
154	2021-09-18 19:44:51.8417+00
155	2021-09-18 19:49:34.461934+00
156	2021-09-18 19:50:24.210173+00
157	2021-09-18 19:50:41.160614+00
158	2021-09-18 19:51:02.569729+00
159	2021-09-18 19:55:29.726439+00
160	2021-09-18 19:57:09.914146+00
161	2021-09-18 19:57:16.762389+00
162	2021-09-18 19:57:56.549606+00
163	2021-09-18 20:01:43.78504+00
164	2021-09-18 20:03:28.482962+00
165	2021-09-18 20:03:47.526583+00
166	2021-09-18 20:05:05.600828+00
167	2021-09-18 20:06:22.580248+00
168	2021-09-18 20:08:20.227156+00
169	2021-09-18 20:09:19.35215+00
170	2021-09-18 20:09:20.026402+00
171	2021-09-18 20:09:43.401863+00
172	2021-09-18 20:10:07.997512+00
173	2021-09-18 20:10:44.148484+00
174	2021-09-18 20:14:07.047862+00
175	2021-09-18 20:15:33.741207+00
175	2021-09-18 20:16:02.84869+00
170	2021-09-18 20:16:12.159661+00
165	2021-09-18 20:16:42.832992+00
112	2021-09-18 20:17:07.263333+00
176	2021-09-18 20:21:40.666861+00
177	2021-09-18 20:28:53.678889+00
178	2021-09-18 20:29:20.515609+00
179	2021-09-18 20:29:43.473242+00
180	2021-09-18 20:30:17.995926+00
181	2021-09-18 20:46:30.995253+00
182	2021-09-18 20:47:59.224235+00
183	2021-09-18 20:48:05.806426+00
184	2021-09-18 20:51:53.683232+00
185	2021-09-18 20:51:58.530823+00
186	2021-09-18 20:52:03.010123+00
186	2021-09-18 20:52:16.991304+00
187	2021-09-18 20:53:01.976441+00
187	2021-09-18 20:53:36.106016+00
188	2021-09-18 20:53:42.649779+00
189	2021-09-18 20:53:56.213894+00
189	2021-09-18 20:54:06.347394+00
190	2021-09-18 20:54:19.438366+00
191	2021-09-18 20:54:44.685653+00
192	2021-09-18 20:59:50.008648+00
193	2021-09-18 21:01:48.195975+00
194	2021-09-18 21:03:35.581795+00
195	2021-09-18 21:03:55.925911+00
196	2021-09-18 21:05:12.898256+00
197	2021-09-18 21:09:31.310036+00
198	2021-09-18 21:09:49.436035+00
199	2021-09-18 21:11:25.338801+00
200	2021-09-18 21:25:33.000833+00
201	2021-09-18 21:25:44.105632+00
202	2021-09-20 20:34:57.881642+00
203	2021-09-20 20:35:17.946229+00
203	2021-09-20 20:35:29.172296+00
202	2021-09-20 20:35:31.351814+00
204	2021-09-21 13:54:40.992221+00
205	2021-09-21 13:54:55.626353+00
206	2021-09-21 13:55:29.76119+00
207	2021-09-21 13:58:33.703968+00
208	2021-09-21 13:59:04.153886+00
209	2021-09-21 14:00:08.265807+00
210	2021-09-21 14:00:42.048681+00
210	2021-09-21 14:07:42.171164+00
211	2021-09-22 13:58:26.111889+00
212	2021-09-22 13:58:47.006657+00
213	2021-09-22 13:59:14.705534+00
214	2021-09-22 14:00:16.29889+00
214	2021-09-22 14:00:28.762516+00
215	2021-09-22 14:12:54.247255+00
216	2021-09-22 14:13:13.823559+00
217	2021-09-22 14:13:31.819136+00
218	2021-09-22 14:21:10.772434+00
219	2021-09-22 14:29:41.863775+00
220	2021-09-22 14:32:35.818966+00
221	2021-09-22 14:36:29.984411+00
222	2021-09-22 14:36:46.029041+00
223	2021-09-22 14:44:08.721553+00
224	2021-09-22 14:44:20.718727+00
225	2021-09-22 14:46:54.623116+00
226	2021-09-22 14:51:00.846529+00
227	2021-09-22 14:51:11.67615+00
228	2021-09-22 14:51:40.082883+00
229	2021-09-22 14:52:16.09924+00
98	2021-09-22 15:20:24.679011+00
94	2021-09-22 15:23:11.676646+00
95	2021-09-22 15:24:07.318896+00
95	2021-09-22 15:24:50.100511+00
230	2021-09-22 15:25:00.244401+00
95	2021-09-22 15:28:50.256874+00
231	2021-09-22 15:44:25.669665+00
232	2021-09-22 15:44:45.355154+00
233	2021-09-22 15:48:43.303663+00
234	2021-09-22 15:48:56.085723+00
235	2021-09-22 17:25:26.49824+00
236	2021-09-22 17:34:56.649025+00
237	2021-09-22 17:35:19.339515+00
238	2021-09-22 17:42:41.597887+00
239	2021-09-22 17:47:07.313204+00
240	2021-09-22 18:01:34.150743+00
241	2021-09-22 18:03:32.318556+00
242	2021-09-22 18:08:57.866418+00
243	2021-09-22 18:10:57.039003+00
244	2021-09-22 18:13:50.344087+00
245	2021-09-22 18:17:30.116433+00
246	2021-09-22 18:19:53.45736+00
247	2021-09-22 18:20:09.960352+00
248	2021-09-22 18:20:29.739175+00
249	2021-09-22 18:25:32.281627+00
250	2021-09-22 18:25:53.460408+00
251	2021-09-22 18:28:20.169862+00
252	2021-09-22 18:29:58.867142+00
213	2021-09-22 18:47:11.924418+00
253	2021-09-22 18:50:02.337739+00
254	2021-09-22 18:50:21.316618+00
255	2021-09-22 19:08:45.073049+00
255	2021-09-22 19:08:47.903068+00
256	2021-09-22 19:09:01.854691+00
257	2021-09-22 19:12:28.448577+00
258	2021-09-22 19:36:27.930263+00
259	2021-09-22 19:37:01.391227+00
260	2021-09-22 19:37:31.171194+00
261	2021-09-22 19:40:07.196261+00
260	2021-09-22 19:41:05.402166+00
262	2021-09-22 19:48:08.520265+00
263	2021-09-22 19:48:40.20381+00
260	2021-09-22 19:40:20.068326+00
264	2021-09-22 19:54:46.446683+00
265	2021-09-22 20:04:01.77104+00
266	2021-09-22 20:08:57.440049+00
267	2021-09-22 20:10:25.972908+00
268	2021-09-22 20:12:55.030443+00
269	2021-09-22 20:13:12.478472+00
270	2021-09-22 20:14:51.812847+00
271	2021-09-22 20:15:03.382276+00
272	2021-09-22 20:17:14.649321+00
273	2021-09-22 20:17:23.757992+00
274	2021-09-22 20:20:26.645861+00
275	2021-09-22 20:46:54.510844+00
276	2021-09-22 20:48:59.444001+00
277	2021-09-22 20:49:16.385777+00
278	2021-09-22 20:49:27.654003+00
279	2021-09-22 20:52:21.747778+00
280	2021-09-22 20:53:52.446827+00
281	2021-09-22 20:54:14.576679+00
282	2021-09-22 20:56:20.104039+00
283	2021-09-22 20:56:33.489637+00
284	2021-09-22 20:57:59.964434+00
285	2021-09-22 20:58:22.134993+00
286	2021-09-22 20:59:04.915709+00
287	2021-09-22 21:03:58.48438+00
288	2021-09-22 21:04:07.350059+00
289	2021-09-22 21:06:30.934959+00
290	2021-09-22 21:20:09.774793+00
291	2021-09-22 21:20:22.792771+00
292	2021-09-22 21:20:46.429893+00
293	2021-09-22 21:23:48.314973+00
293	2021-09-22 21:23:53.110678+00
294	2021-09-22 21:24:05.523966+00
294	2021-09-22 21:24:08.780013+00
295	2021-09-22 21:28:02.418501+00
296	2021-09-22 21:28:14.273824+00
297	2021-09-22 21:30:08.566481+00
298	2021-09-22 21:30:20.405131+00
299	2021-09-22 21:33:13.733759+00
300	2021-09-22 21:33:21.2437+00
301	2021-09-22 21:36:25.527255+00
302	2021-09-22 21:36:34.307736+00
303	2021-09-22 21:48:07.651514+00
304	2021-09-22 21:48:17.030973+00
305	2021-09-22 21:51:11.351869+00
306	2021-09-22 21:52:17.338099+00
307	2021-09-23 15:10:15.137488+00
308	2021-09-23 15:10:31.628052+00
309	2021-09-23 15:17:08.526362+00
310	2021-09-23 15:17:40.296184+00
311	2021-09-23 15:18:03.718024+00
312	2021-09-23 15:23:07.812388+00
313	2021-09-23 15:23:28.412658+00
314	2021-09-23 15:24:24.671174+00
315	2021-09-23 15:35:00.477233+00
316	2021-09-23 15:39:03.142896+00
317	2021-09-23 15:39:46.790521+00
318	2021-09-23 15:40:03.449512+00
319	2021-09-23 15:40:35.861225+00
320	2021-09-23 15:49:24.85527+00
321	2021-09-23 15:49:34.758789+00
322	2021-09-23 15:50:02.084227+00
323	2021-09-23 15:53:46.399213+00
324	2021-09-23 15:54:26.651564+00
325	2021-09-23 15:55:00.114625+00
326	2021-09-23 16:14:58.852128+00
327	2021-09-23 16:15:07.961688+00
328	2021-09-23 16:15:34.517044+00
329	2021-09-23 18:31:03.250514+00
330	2021-09-23 18:32:55.537292+00
331	2021-09-23 19:45:20.735497+00
332	2021-09-23 19:45:49.068519+00
332	2021-09-23 19:47:01.820619+00
331	2021-09-23 19:47:38.378565+00
333	2021-09-23 19:49:21.05677+00
334	2021-09-23 19:49:55.784325+00
335	2021-09-23 19:50:20.086841+00
336	2021-09-24 13:09:02.904119+00
337	2021-09-24 13:09:26.299292+00
338	2021-09-24 13:11:53.974545+00
70	2021-09-24 15:06:01.03867+00
71	2021-09-24 15:06:01.054733+00
73	2021-09-24 15:06:01.071652+00
74	2021-09-24 15:06:01.090684+00
76	2021-09-24 15:34:31.366743+00
77	2021-09-24 15:34:31.385642+00
81	2021-09-24 15:34:31.405734+00
82	2021-09-24 15:34:31.41834+00
88	2021-09-24 15:34:31.433887+00
89	2021-09-24 15:34:31.448833+00
339	2021-09-24 15:35:58.034264+00
340	2021-09-24 15:36:46.5468+00
91	2021-09-24 15:38:19.272767+00
92	2021-09-24 15:38:19.290504+00
97	2021-09-24 15:38:19.308539+00
104	2021-09-24 15:38:19.330584+00
31	2021-09-24 15:38:19.347008+00
34	2021-09-24 15:38:19.362306+00
35	2021-09-24 15:38:19.381606+00
37	2021-09-24 15:38:19.396537+00
40	2021-09-24 15:38:19.411139+00
42	2021-09-24 15:38:19.42989+00
43	2021-09-24 15:38:19.446459+00
341	2021-09-24 15:56:14.788246+00
342	2021-09-24 15:56:39.060361+00
343	2021-09-24 15:57:05.007861+00
344	2021-09-24 16:05:06.750314+00
345	2021-09-24 16:05:41.188258+00
346	2021-09-24 16:06:11.540075+00
347	2021-09-24 18:33:24.308877+00
348	2021-09-24 18:35:22.688735+00
349	2021-09-24 18:45:17.789884+00
350	2021-09-24 18:45:41.687626+00
351	2021-09-24 18:47:01.688992+00
352	2021-09-24 18:54:09.214613+00
353	2021-09-24 18:54:54.920526+00
354	2021-09-24 18:56:13.731406+00
69	2021-09-28 20:46:14.309526+00
72	2021-09-28 20:46:14.329149+00
75	2021-09-28 20:46:14.343563+00
78	2021-09-28 20:46:14.361616+00
79	2021-09-28 20:46:14.377058+00
80	2021-09-28 20:46:14.394797+00
83	2021-09-28 20:46:14.414266+00
84	2021-09-28 20:46:14.432441+00
85	2021-09-28 20:46:14.44651+00
86	2021-09-28 20:46:14.462043+00
87	2021-09-28 20:46:14.481981+00
90	2021-09-28 20:46:14.496007+00
93	2021-09-28 20:46:14.509789+00
96	2021-09-28 20:46:14.527082+00
99	2021-09-28 20:46:14.541559+00
102	2021-09-28 20:46:14.556767+00
103	2021-09-28 20:46:14.572487+00
28	2021-09-28 20:46:14.590958+00
105	2021-09-28 20:46:14.605653+00
94	2021-09-28 20:46:14.623134+00
95	2021-09-28 20:46:14.638759+00
70	2021-09-28 20:46:14.654915+00
71	2021-09-28 20:46:14.669835+00
73	2021-09-28 20:46:14.683897+00
74	2021-09-28 20:46:14.699908+00
76	2021-09-28 20:46:14.715924+00
77	2021-09-28 20:46:14.734462+00
81	2021-09-28 20:46:14.751046+00
82	2021-09-28 20:46:14.768061+00
88	2021-09-28 20:46:14.783209+00
89	2021-09-28 20:46:14.798361+00
91	2021-09-28 20:46:14.81281+00
92	2021-09-28 20:46:14.82824+00
97	2021-09-28 20:46:14.845811+00
104	2021-09-28 20:46:14.861672+00
31	2021-09-28 20:46:14.876939+00
34	2021-09-28 20:46:14.89222+00
35	2021-09-28 20:46:14.907955+00
37	2021-09-28 20:46:14.922415+00
40	2021-09-28 20:46:14.939736+00
42	2021-09-28 20:46:14.952375+00
43	2021-09-28 20:46:14.966613+00
32	2021-09-28 20:46:14.981534+00
33	2021-09-28 20:46:14.996475+00
36	2021-09-28 20:46:15.010183+00
39	2021-09-28 20:46:15.026586+00
38	2021-09-28 20:46:15.041062+00
41	2021-09-28 20:46:15.052403+00
44	2021-09-28 20:46:15.068136+00
45	2021-09-28 20:46:15.083424+00
46	2021-09-28 20:46:15.098667+00
47	2021-09-28 20:46:15.114097+00
48	2021-09-28 20:46:15.128928+00
49	2021-09-28 20:46:15.144909+00
50	2021-09-28 20:46:15.161471+00
51	2021-09-28 20:46:15.176208+00
52	2021-09-28 20:46:15.190842+00
53	2021-09-28 20:46:15.205694+00
54	2021-09-28 20:46:15.220496+00
55	2021-09-28 20:46:15.2365+00
56	2021-09-28 20:46:15.251487+00
57	2021-09-28 20:46:15.266694+00
58	2021-09-28 20:46:15.285214+00
59	2021-09-28 20:46:15.301487+00
60	2021-09-28 20:46:15.314109+00
61	2021-09-28 20:46:15.332753+00
62	2021-09-28 20:46:15.348903+00
63	2021-09-28 20:46:15.363478+00
64	2021-09-28 20:46:15.379152+00
65	2021-09-28 20:46:15.396286+00
66	2021-09-28 20:46:15.412892+00
67	2021-09-28 20:46:15.428472+00
68	2021-09-28 20:46:15.44512+00
106	2021-09-28 20:46:15.461393+00
107	2021-09-28 20:46:15.479235+00
108	2021-09-28 20:46:15.493837+00
109	2021-09-28 20:46:15.50785+00
110	2021-09-28 20:46:15.521872+00
111	2021-09-28 20:46:15.53637+00
113	2021-09-28 20:46:15.551478+00
114	2021-09-28 20:46:15.567611+00
115	2021-09-28 20:46:15.581458+00
116	2021-09-28 20:46:15.597596+00
117	2021-09-28 20:46:15.613459+00
118	2021-09-28 20:46:15.629138+00
119	2021-09-28 20:46:15.645701+00
120	2021-09-28 20:46:15.66288+00
121	2021-09-28 20:46:15.679879+00
122	2021-09-28 20:46:15.695942+00
123	2021-09-28 20:46:15.711857+00
124	2021-09-28 20:46:15.72774+00
125	2021-09-28 20:46:15.743402+00
126	2021-09-28 20:46:15.759997+00
127	2021-09-28 20:46:15.774159+00
128	2021-09-28 20:46:15.788887+00
129	2021-09-28 20:46:15.80358+00
130	2021-09-28 20:46:15.818065+00
131	2021-09-28 20:46:15.832431+00
132	2021-09-28 20:46:15.849896+00
133	2021-09-28 20:46:15.865696+00
134	2021-09-28 20:46:15.88046+00
135	2021-09-28 20:46:15.896158+00
136	2021-09-28 20:46:15.912187+00
137	2021-09-28 20:46:15.929739+00
138	2021-09-28 20:46:15.945682+00
139	2021-09-28 20:46:15.961262+00
140	2021-09-28 20:46:15.978489+00
141	2021-09-28 20:46:15.997462+00
142	2021-09-28 20:46:16.013988+00
143	2021-09-28 20:46:16.030392+00
144	2021-09-28 20:46:16.04561+00
145	2021-09-28 20:46:16.056936+00
146	2021-09-28 20:46:16.070406+00
147	2021-09-28 20:46:16.084631+00
148	2021-09-28 20:46:16.099183+00
149	2021-09-28 20:46:16.117734+00
150	2021-09-28 20:46:16.134901+00
151	2021-09-28 20:46:16.151276+00
152	2021-09-28 20:46:16.166249+00
153	2021-09-28 20:46:16.182018+00
154	2021-09-28 20:46:16.197222+00
155	2021-09-28 20:46:16.210676+00
156	2021-09-28 20:46:16.225957+00
157	2021-09-28 20:46:16.237938+00
158	2021-09-28 20:46:16.253453+00
159	2021-09-28 20:46:16.267863+00
160	2021-09-28 20:46:16.284162+00
161	2021-09-28 20:46:16.300079+00
162	2021-09-28 20:46:16.315231+00
163	2021-09-28 20:46:16.3322+00
164	2021-09-28 20:46:16.346961+00
166	2021-09-28 20:46:16.363029+00
167	2021-09-28 20:46:16.378005+00
168	2021-09-28 20:46:16.390085+00
169	2021-09-28 20:46:16.403755+00
171	2021-09-28 20:46:16.416699+00
172	2021-09-28 20:46:16.434485+00
173	2021-09-28 20:46:16.450997+00
174	2021-09-28 20:46:16.468261+00
165	2021-09-28 20:46:16.48342+00
112	2021-09-28 20:46:16.500991+00
176	2021-09-28 20:46:16.516972+00
177	2021-09-28 20:46:16.531479+00
178	2021-09-28 20:46:16.545996+00
179	2021-09-28 20:46:16.561585+00
180	2021-09-28 20:46:16.576843+00
181	2021-09-28 20:46:16.592311+00
182	2021-09-28 20:46:16.607867+00
183	2021-09-28 20:46:16.625113+00
193	2021-09-28 20:46:16.641547+00
184	2021-09-28 20:46:16.657445+00
185	2021-09-28 20:46:16.672426+00
188	2021-09-28 20:46:16.688378+00
190	2021-09-28 20:46:16.705437+00
191	2021-09-28 20:46:16.719937+00
192	2021-09-28 20:46:16.732863+00
194	2021-09-28 20:46:16.749239+00
195	2021-09-28 20:46:16.764153+00
196	2021-09-28 20:46:16.779658+00
197	2021-09-28 20:46:16.795731+00
198	2021-09-28 20:46:16.81263+00
199	2021-09-28 20:46:16.831941+00
200	2021-09-28 20:46:16.847331+00
201	2021-09-28 20:46:16.863395+00
204	2021-09-28 20:46:16.877395+00
205	2021-09-28 20:46:16.893838+00
206	2021-09-28 20:46:16.908733+00
207	2021-09-28 20:46:16.923621+00
208	2021-09-28 20:46:16.937476+00
209	2021-09-28 20:46:16.951865+00
211	2021-09-28 20:46:16.967046+00
212	2021-09-28 20:46:16.981992+00
214	2021-09-28 20:46:16.998202+00
215	2021-09-28 20:46:17.016149+00
216	2021-09-28 20:46:17.031366+00
217	2021-09-28 20:46:17.048716+00
218	2021-09-28 20:46:17.060423+00
219	2021-09-28 20:46:17.074117+00
220	2021-09-28 20:46:17.085419+00
221	2021-09-28 20:46:17.099854+00
222	2021-09-28 20:46:17.114759+00
223	2021-09-28 20:46:17.130256+00
224	2021-09-28 20:46:17.145942+00
225	2021-09-28 20:46:17.162434+00
226	2021-09-28 20:46:17.178063+00
227	2021-09-28 20:46:17.195492+00
228	2021-09-28 20:46:17.211423+00
229	2021-09-28 20:46:17.227416+00
98	2021-09-28 20:46:17.243684+00
230	2021-09-28 20:46:17.261271+00
231	2021-09-28 20:46:17.277648+00
232	2021-09-28 20:46:17.293644+00
233	2021-09-28 20:46:17.305678+00
234	2021-09-28 20:46:17.320049+00
235	2021-09-28 20:46:17.332103+00
236	2021-09-28 20:46:17.347643+00
237	2021-09-28 20:46:17.363564+00
238	2021-09-28 20:46:17.380036+00
239	2021-09-28 20:46:17.391886+00
240	2021-09-28 20:46:17.407168+00
241	2021-09-28 20:46:17.422085+00
242	2021-09-28 20:46:17.439207+00
243	2021-09-28 20:46:17.454783+00
244	2021-09-28 20:46:17.47173+00
245	2021-09-28 20:46:17.485863+00
246	2021-09-28 20:46:17.50097+00
247	2021-09-28 20:46:17.517155+00
248	2021-09-28 20:46:17.534272+00
249	2021-09-28 20:46:17.550338+00
250	2021-09-28 20:46:17.565372+00
251	2021-09-28 20:46:17.581548+00
252	2021-09-28 20:46:17.597246+00
213	2021-09-28 20:46:17.612657+00
253	2021-09-28 20:46:17.62791+00
254	2021-09-28 20:46:17.645493+00
256	2021-09-28 20:46:17.661049+00
257	2021-09-28 20:46:17.677118+00
258	2021-09-28 20:46:17.693011+00
259	2021-09-28 20:46:17.708361+00
261	2021-09-28 20:46:17.722894+00
262	2021-09-28 20:46:17.739216+00
263	2021-09-28 20:46:17.754747+00
264	2021-09-28 20:46:17.769473+00
265	2021-09-28 20:46:17.783719+00
266	2021-09-28 20:46:17.799182+00
267	2021-09-28 20:46:17.814136+00
268	2021-09-28 20:46:17.830111+00
269	2021-09-28 20:46:17.846353+00
270	2021-09-28 20:46:17.864739+00
274	2021-09-28 20:46:17.879837+00
271	2021-09-28 20:46:17.897041+00
272	2021-09-28 20:46:17.9126+00
273	2021-09-28 20:46:17.928635+00
275	2021-09-28 20:46:17.94383+00
276	2021-09-28 20:46:17.958551+00
277	2021-09-28 20:46:17.972935+00
278	2021-09-28 20:46:17.98708+00
279	2021-09-28 20:46:18.004412+00
280	2021-09-28 20:46:18.018066+00
281	2021-09-28 20:46:18.03423+00
282	2021-09-28 20:46:18.047943+00
283	2021-09-28 20:46:18.063763+00
284	2021-09-28 20:46:18.075254+00
285	2021-09-28 20:46:18.090428+00
286	2021-09-28 20:46:18.107443+00
287	2021-09-28 20:46:18.125942+00
288	2021-09-28 20:46:18.141906+00
289	2021-09-28 20:46:18.156731+00
290	2021-09-28 20:46:18.17181+00
291	2021-09-28 20:46:18.185758+00
292	2021-09-28 20:46:18.199533+00
295	2021-09-28 20:46:18.21485+00
296	2021-09-28 20:46:18.229718+00
297	2021-09-28 20:46:18.245731+00
298	2021-09-28 20:46:18.260619+00
299	2021-09-28 20:46:18.27625+00
300	2021-09-28 20:46:18.288583+00
301	2021-09-28 20:46:18.302985+00
302	2021-09-28 20:46:18.317126+00
303	2021-09-28 20:46:18.334834+00
304	2021-09-28 20:46:18.3502+00
305	2021-09-28 20:46:18.366214+00
306	2021-09-28 20:46:18.381748+00
307	2021-09-28 20:46:18.397675+00
308	2021-09-28 20:46:18.413963+00
309	2021-09-28 20:46:18.430398+00
310	2021-09-28 20:46:18.446092+00
311	2021-09-28 20:46:18.462022+00
312	2021-09-28 20:46:18.479009+00
313	2021-09-28 20:46:18.49376+00
314	2021-09-28 20:46:18.508559+00
315	2021-09-28 20:46:18.522902+00
316	2021-09-28 20:46:18.539754+00
317	2021-09-28 20:46:18.553923+00
318	2021-09-28 20:46:18.56972+00
319	2021-09-28 20:46:18.582793+00
320	2021-09-28 20:46:18.597251+00
321	2021-09-28 20:46:18.612299+00
322	2021-09-28 20:46:18.627727+00
323	2021-09-28 20:46:18.642682+00
324	2021-09-28 20:46:18.656877+00
325	2021-09-28 20:46:18.671456+00
326	2021-09-28 20:46:18.684731+00
327	2021-09-28 20:46:18.700231+00
328	2021-09-28 20:46:18.718246+00
329	2021-09-28 20:46:18.733928+00
330	2021-09-28 20:46:18.749056+00
333	2021-09-28 20:46:18.766466+00
334	2021-09-28 20:46:18.781547+00
335	2021-09-28 20:46:18.795032+00
336	2021-09-28 20:46:18.81005+00
337	2021-09-28 20:46:18.826507+00
338	2021-09-28 20:46:18.84285+00
339	2021-09-28 20:46:18.859593+00
340	2021-09-28 20:46:18.872984+00
341	2021-09-28 20:46:18.887991+00
342	2021-09-28 20:46:18.900227+00
343	2021-09-28 20:46:18.914623+00
344	2021-09-28 20:46:18.929605+00
345	2021-09-28 20:46:18.94683+00
346	2021-09-28 20:46:18.960988+00
347	2021-09-28 20:46:18.974678+00
348	2021-09-28 20:46:18.988317+00
349	2021-09-28 20:46:19.001988+00
350	2021-09-28 20:46:19.015243+00
351	2021-09-28 20:46:19.031816+00
352	2021-09-28 20:46:19.046394+00
353	2021-09-28 20:46:19.061171+00
354	2021-09-28 20:46:19.072772+00
355	2021-10-02 21:02:35.888316+00
357	2021-10-05 13:57:29.678473+00
358	2021-10-05 14:08:24.295488+00
359	2021-10-05 14:09:32.867414+00
357	2021-10-05 14:10:10.215452+00
358	2021-10-05 14:10:10.236454+00
359	2021-10-05 14:10:10.262252+00
360	2021-10-05 14:12:05.93337+00
361	2021-10-05 14:14:26.278808+00
362	2021-10-05 14:16:33.854288+00
363	2021-10-05 14:23:23.359946+00
364	2021-10-05 14:38:49.390537+00
365	2021-10-05 14:51:51.232531+00
360	2021-10-05 14:53:19.08815+00
361	2021-10-05 14:53:19.110412+00
362	2021-10-05 14:53:19.129496+00
363	2021-10-05 14:53:19.142212+00
364	2021-10-05 14:53:19.15749+00
365	2021-10-05 14:53:19.177318+00
366	2021-10-05 14:53:35.916446+00
367	2021-10-05 14:54:40.956272+00
368	2021-10-05 14:55:42.821944+00
369	2021-10-05 14:58:07.710335+00
370	2021-10-05 15:01:50.203497+00
371	2021-10-05 15:02:31.220155+00
372	2021-10-05 15:05:58.358159+00
366	2021-10-05 15:09:58.133529+00
367	2021-10-05 15:09:58.156091+00
368	2021-10-05 15:09:58.173958+00
369	2021-10-05 15:09:58.191422+00
370	2021-10-05 15:09:58.207595+00
371	2021-10-05 15:09:58.229524+00
372	2021-10-05 15:09:58.247798+00
373	2021-10-05 15:10:25.114512+00
374	2021-10-05 15:11:57.020358+00
375	2021-10-05 15:14:40.389439+00
376	2021-10-05 15:23:06.412139+00
377	2021-10-05 15:25:12.963647+00
378	2021-10-05 15:56:51.521472+00
377	2021-10-05 16:03:14.897011+00
377	2021-10-05 16:06:04.057209+00
377	2021-10-05 16:07:09.934128+00
355	2021-10-05 16:07:16.587066+00
355	2021-10-05 17:01:53.470775+00
373	2021-10-05 17:01:58.491098+00
374	2021-10-05 17:02:02.050374+00
374	2021-10-05 17:02:18.610953+00
373	2021-10-05 21:43:05.123757+00
374	2021-10-05 21:43:05.141576+00
375	2021-10-05 21:43:05.158288+00
376	2021-10-05 21:43:05.172511+00
378	2021-10-05 21:43:05.186197+00
377	2021-10-05 21:43:05.201574+00
355	2021-10-05 21:45:53.356388+00
379	2021-10-06 00:44:12.300443+00
380	2021-10-06 00:44:21.038173+00
374	2021-10-06 01:28:07.976452+00
380	2021-10-06 01:28:12.813053+00
379	2021-10-06 01:28:14.96061+00
377	2021-10-06 01:59:02.888669+00
378	2021-10-06 02:02:14.960691+00
375	2021-10-06 02:03:39.639674+00
373	2021-10-06 02:03:45.537059+00
381	2021-10-06 02:54:56.799782+00
382	2021-10-06 02:55:34.483022+00
383	2021-10-06 02:55:58.492111+00
384	2021-10-06 02:57:42.921996+00
385	2021-10-06 02:57:57.783589+00
386	2021-10-06 02:59:38.937343+00
387	2021-10-06 03:03:51.585386+00
388	2021-10-06 03:05:35.853681+00
389	2021-10-06 03:06:12.965706+00
390	2021-10-06 03:09:31.440871+00
390	2021-10-06 03:29:23.556765+00
389	2021-10-06 03:41:05.112855+00
387	2021-10-06 03:45:23.993815+00
388	2021-10-06 03:49:24.503842+00
386	2021-10-06 03:55:59.933299+00
391	2021-10-06 04:04:45.145331+00
392	2021-10-06 13:03:37.039939+00
393	2021-10-06 13:06:17.926758+00
394	2021-10-06 13:06:28.18332+00
395	2021-10-06 13:25:39.910288+00
355	2021-10-06 14:58:24.366641+00
391	2021-10-06 16:11:14.333854+00
381	2021-10-06 16:31:52.180897+00
382	2021-10-06 16:31:52.180897+00
385	2021-10-06 16:31:52.180897+00
384	2021-10-06 16:39:06.378674+00
383	2021-10-06 16:39:11.687764+00
376	2021-10-06 16:39:22.425184+00
428	2021-10-06 19:45:31.71241+00
429	2021-10-06 19:50:37.652228+00
429	2021-10-06 19:52:34.591976+00
430	2021-10-07 18:09:04.915831+00
431	2021-10-07 18:15:11.671355+00
431	2021-10-07 18:35:44.324212+00
432	2021-10-07 18:37:53.721347+00
433	2021-10-07 18:51:06.036113+00
433	2021-10-07 18:51:49.494589+00
434	2021-10-07 19:08:56.022509+00
434	2021-10-07 19:19:23.825574+00
435	2021-10-07 19:20:01.56692+00
436	2021-10-07 19:31:12.658302+00
437	2021-10-07 19:40:04.119908+00
437	2021-10-07 19:40:18.825231+00
438	2021-10-07 19:40:47.953286+00
441	2021-10-07 19:58:42.1281+00
442	2021-10-07 20:01:05.750341+00
443	2021-10-07 20:04:39.954832+00
444	2021-10-07 20:12:16.060651+00
445	2021-10-07 20:14:51.351938+00
446	2021-10-07 20:18:24.6998+00
447	2021-10-07 20:21:15.6928+00
448	2021-10-08 18:00:17.172655+00
449	2021-10-26 14:41:14.779836+00
449	2021-10-26 14:41:27.1324+00
450	2021-10-26 14:42:25.777902+00
451	2021-10-26 14:54:09.551372+00
453	2021-10-26 16:30:09.465654+00
453	2021-10-26 16:30:37.499848+00
454	2021-10-26 17:12:51.966086+00
457	2021-10-27 12:33:10.228548+00
458	2021-10-27 12:45:38.938115+00
459	2021-10-27 12:53:32.149875+00
460	2021-10-27 13:09:46.713993+00
461	2021-10-27 13:23:33.13425+00
462	2021-10-27 13:53:41.792062+00
463	2021-10-27 13:54:22.361853+00
464	2021-10-27 13:59:20.459831+00
464	2021-10-27 13:59:33.533727+00
395	2021-10-27 18:54:21.797225+00
465	2021-10-27 14:06:53.116009+00
466	2021-10-27 14:10:21.502271+00
467	2021-10-27 14:13:01.223328+00
468	2021-10-27 14:18:09.918156+00
469	2021-10-27 14:21:19.378789+00
470	2021-10-27 14:22:18.758265+00
471	2021-10-27 14:24:49.323833+00
472	2021-10-27 14:25:05.691505+00
470	2021-10-27 14:27:44.03735+00
473	2021-10-27 14:31:09.586578+00
474	2021-10-27 14:36:18.619506+00
474	2021-10-27 14:36:22.925318+00
475	2021-10-27 14:41:02.004135+00
476	2021-10-27 14:41:31.48475+00
477	2021-10-27 15:01:55.567629+00
478	2021-10-27 15:10:38.271116+00
479	2021-10-27 15:11:02.283891+00
480	2021-10-27 15:15:18.4138+00
481	2021-10-27 17:01:44.639968+00
482	2021-10-27 17:02:18.233226+00
483	2021-10-27 17:02:51.082968+00
484	2021-10-27 17:09:21.930224+00
485	2021-10-27 17:24:33.510941+00
486	2021-10-27 17:27:31.520145+00
487	2021-10-27 17:27:55.031942+00
488	2021-10-27 17:39:47.944264+00
489	2021-10-27 17:53:38.522256+00
490	2021-10-27 18:04:28.312683+00
491	2021-10-28 12:35:44.227108+00
492	2021-10-28 12:36:28.703355+00
492	2021-10-28 12:37:29.926918+00
493	2021-10-28 13:07:40.34191+00
494	2021-10-28 13:33:30.991437+00
494	2021-10-28 13:43:39.298834+00
495	2021-10-28 13:43:49.817062+00
496	2021-10-28 14:04:18.551107+00
497	2021-10-28 14:25:26.69837+00
498	2021-10-28 15:19:06.193473+00
499	2021-10-28 17:23:26.769158+00
500	2021-10-28 17:23:53.176195+00
501	2021-10-28 17:36:06.49805+00
502	2021-10-28 17:44:27.097778+00
503	2021-10-28 17:48:02.944319+00
504	2021-10-28 18:01:42.764658+00
505	2021-10-28 18:33:42.630922+00
506	2021-10-28 18:34:32.370404+00
507	2021-10-28 18:40:57.191923+00
508	2021-10-28 18:50:54.892928+00
509	2021-10-28 18:59:30.929582+00
510	2021-10-28 19:39:04.313804+00
511	2021-10-28 19:45:03.821547+00
512	2021-10-28 19:54:38.953762+00
513	2021-10-29 18:02:07.836525+00
514	2021-10-29 18:05:20.151092+00
515	2021-10-29 18:06:59.720681+00
516	2021-10-29 18:07:24.056428+00
517	2021-10-29 18:30:57.651654+00
518	2021-10-29 18:46:16.709656+00
519	2021-10-29 19:07:06.558739+00
520	2021-10-29 19:42:44.894561+00
521	2021-10-29 19:43:45.317519+00
522	2021-10-29 20:15:28.571687+00
523	2021-10-30 18:37:03.713607+00
524	2021-10-30 18:42:31.445085+00
525	2021-10-30 18:58:05.366232+00
526	2021-10-30 19:19:48.620502+00
527	2021-10-30 19:19:56.479679+00
528	2021-10-30 19:44:15.96344+00
529	2021-10-30 19:58:46.449105+00
530	2021-10-30 20:07:10.498247+00
531	2021-11-01 15:12:47.516325+00
532	2021-11-01 15:13:33.457244+00
533	2021-11-01 15:23:57.867819+00
534	2021-11-01 15:25:01.98918+00
535	2021-11-01 18:47:37.442218+00
536	2021-11-01 19:15:15.973217+00
537	2021-11-01 19:31:00.163664+00
538	2021-11-02 17:21:42.651549+00
539	2021-11-02 17:40:11.972813+00
540	2021-11-02 17:49:19.568533+00
541	2021-11-02 17:49:32.450617+00
542	2021-11-02 19:03:51.129689+00
543	2021-11-02 20:15:23.98722+00
544	2021-11-02 20:15:48.461082+00
545	2021-11-03 13:18:49.640684+00
546	2021-11-03 13:36:39.522345+00
547	2021-11-03 14:14:56.014924+00
547	2021-11-03 17:17:42.6372+00
548	2021-11-03 17:21:34.533214+00
549	2021-11-03 17:33:48.179583+00
550	2021-11-03 17:48:28.987482+00
551	2021-11-03 18:13:14.092541+00
552	2021-11-03 18:32:44.036854+00
553	2021-11-03 19:11:40.648568+00
554	2021-11-03 19:39:53.198941+00
555	2021-11-03 19:40:20.60689+00
556	2021-11-03 19:40:56.918318+00
557	2021-11-04 13:53:04.037024+00
558	2021-11-04 13:53:37.219432+00
559	2021-11-04 14:14:10.681718+00
560	2021-11-04 14:18:23.087715+00
561	2021-11-04 14:20:37.234359+00
562	2021-11-04 14:25:00.301866+00
563	2021-11-04 14:26:16.939338+00
564	2021-11-04 14:30:14.483454+00
565	2021-11-04 14:30:34.94696+00
566	2021-11-04 14:37:51.408777+00
\.


--
-- Data for Name: delta_productos_costos_por_sucursal; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_costos_por_sucursal (id, txntime) FROM stdin;
1	2021-09-02 15:40:50.147397+00
\.


--
-- Data for Name: delta_productos_familia; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_familia (id, txntime) FROM stdin;
\.


--
-- Data for Name: delta_productos_precio_por_sucursal; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_precio_por_sucursal (id, txntime) FROM stdin;
38	2021-08-25 20:18:03.738891+00
1	2021-09-02 15:32:01.821937+00
11	2021-09-02 15:32:01.84215+00
16	2021-09-02 15:32:01.856542+00
19	2021-09-02 15:32:01.870831+00
22	2021-09-02 15:32:01.886645+00
24	2021-09-02 15:32:01.901633+00
12	2021-09-02 15:32:01.91738+00
13	2021-09-02 15:32:01.931625+00
14	2021-09-02 15:32:01.947809+00
15	2021-09-02 15:32:01.962827+00
17	2021-09-02 15:32:01.977608+00
18	2021-09-02 15:32:01.994515+00
20	2021-09-02 15:32:02.008193+00
21	2021-09-02 15:32:02.023202+00
26	2021-09-02 15:32:02.036187+00
27	2021-09-02 15:32:02.050987+00
28	2021-09-02 15:32:02.064519+00
25	2021-09-02 15:32:02.078243+00
30	2021-09-02 15:32:02.093274+00
38	2021-09-02 15:32:02.107525+00
39	2021-09-02 17:20:47.414629+00
39	2021-09-02 17:22:15.440896+00
40	2021-09-02 17:34:13.426759+00
40	2021-09-02 17:38:48.831311+00
41	2021-09-02 17:39:05.025339+00
42	2021-09-02 18:10:05.369442+00
43	2021-09-02 18:12:40.810303+00
43	2021-09-02 18:12:59.922165+00
44	2021-09-02 18:14:50.843246+00
45	2021-09-07 19:10:32.967062+00
46	2021-09-08 19:05:59.634121+00
46	2021-09-08 19:06:06.893028+00
41	2021-09-08 19:06:09.684218+00
47	2021-09-08 19:06:18.871527+00
48	2021-09-08 19:07:12.832968+00
42	2021-09-09 13:52:53.579213+00
44	2021-09-09 13:52:53.635627+00
45	2021-09-09 13:52:53.65411+00
47	2021-09-09 13:52:53.670125+00
48	2021-09-09 13:52:53.686189+00
1	2021-09-14 20:48:45.522046+00
2	2021-09-14 21:43:02.0421+00
3	2021-09-15 14:15:03.512421+00
4	2021-09-15 15:34:02.70157+00
5	2021-09-15 15:35:00.403523+00
6	2021-09-15 15:52:58.369937+00
7	2021-09-15 15:52:58.372075+00
9	2021-09-15 15:52:58.38038+00
8	2021-09-15 15:52:58.380545+00
10	2021-09-15 15:52:58.416049+00
7	2021-09-15 15:54:26.343641+00
8	2021-09-15 15:54:28.974603+00
9	2021-09-15 15:54:31.675636+00
10	2021-09-15 15:54:34.825301+00
11	2021-09-15 15:55:01.166056+00
12	2021-09-15 15:59:55.129614+00
13	2021-09-15 16:07:32.675936+00
14	2021-09-15 16:07:45.53169+00
15	2021-09-15 16:15:06.23721+00
16	2021-09-15 16:15:20.512471+00
17	2021-09-15 16:15:40.433795+00
12	2021-09-15 16:19:14.203402+00
18	2021-09-15 16:28:11.790665+00
19	2021-09-15 16:28:21.214914+00
20	2021-09-15 16:32:55.037265+00
21	2021-09-15 16:33:06.826663+00
22	2021-09-15 16:33:21.823679+00
23	2021-09-15 16:33:44.267599+00
24	2021-09-15 16:34:13.291121+00
25	2021-09-15 17:58:47.889589+00
26	2021-09-15 17:59:20.117141+00
27	2021-09-15 17:59:20.119183+00
27	2021-09-15 17:59:24.772851+00
26	2021-09-15 17:59:36.594127+00
28	2021-09-15 18:00:07.760271+00
29	2021-09-15 18:00:44.805305+00
30	2021-09-15 19:01:34.445851+00
31	2021-09-15 19:08:58.914797+00
32	2021-09-15 19:09:12.550701+00
33	2021-09-15 19:21:24.328528+00
34	2021-09-15 19:21:42.721196+00
35	2021-09-15 19:22:01.234572+00
36	2021-09-15 19:25:48.698081+00
37	2021-09-15 19:25:58.67907+00
38	2021-09-15 19:26:14.094544+00
39	2021-09-15 19:26:27.916921+00
37	2021-09-15 19:26:40.940504+00
38	2021-09-15 19:27:11.519864+00
36	2021-09-15 19:28:03.950199+00
39	2021-09-15 19:28:06.226238+00
40	2021-09-15 19:28:17.225022+00
41	2021-09-15 19:28:28.152499+00
42	2021-09-15 19:28:43.618216+00
43	2021-09-15 19:33:54.47011+00
44	2021-09-15 19:34:00.960807+00
45	2021-09-15 19:34:10.753055+00
46	2021-09-15 19:36:14.252637+00
47	2021-09-15 19:36:29.959869+00
48	2021-09-15 19:36:40.353553+00
49	2021-09-15 19:57:27.884659+00
50	2021-09-15 20:09:11.159811+00
51	2021-09-15 20:09:21.524203+00
52	2021-09-15 20:11:28.006638+00
53	2021-09-15 20:11:37.123263+00
54	2021-09-15 20:11:59.771545+00
55	2021-09-15 20:12:00.18861+00
55	2021-09-15 20:12:06.036485+00
54	2021-09-15 20:12:39.345272+00
56	2021-09-15 20:13:52.044634+00
57	2021-09-15 20:14:47.437656+00
58	2021-09-15 20:15:07.763884+00
59	2021-09-15 20:15:08.231124+00
59	2021-09-15 20:15:15.560798+00
58	2021-09-15 20:15:40.41165+00
60	2021-09-15 20:15:52.223177+00
61	2021-09-15 20:15:52.308222+00
61	2021-09-15 20:16:00.168471+00
62	2021-09-15 20:18:08.303969+00
63	2021-09-15 20:20:18.942041+00
64	2021-09-15 20:31:15.274092+00
65	2021-09-15 20:40:35.133779+00
66	2021-09-15 20:48:09.558363+00
67	2021-09-15 20:48:19.181397+00
68	2021-09-15 20:48:32.453013+00
69	2021-09-15 20:50:40.561009+00
70	2021-09-15 20:55:33.757387+00
71	2021-09-15 21:00:24.770606+00
72	2021-09-17 18:37:39.606309+00
73	2021-09-17 18:37:51.829138+00
74	2021-09-17 18:38:00.401241+00
75	2021-09-17 18:43:27.933773+00
76	2021-09-17 18:43:38.504085+00
77	2021-09-17 18:43:49.110612+00
78	2021-09-17 18:49:59.600416+00
79	2021-09-17 18:50:10.93676+00
80	2021-09-17 18:50:22.593664+00
81	2021-09-17 18:56:52.82195+00
82	2021-09-17 18:57:01.915046+00
83	2021-09-17 18:57:21.029894+00
82	2021-09-17 18:57:42.316044+00
84	2021-09-17 19:16:32.249405+00
85	2021-09-17 19:19:44.107317+00
86	2021-09-17 19:19:51.038626+00
87	2021-09-17 19:56:13.342648+00
88	2021-09-17 19:56:25.56717+00
89	2021-09-18 17:48:47.481332+00
90	2021-09-18 17:49:28.457119+00
91	2021-09-18 17:53:19.95883+00
92	2021-09-18 17:53:27.414953+00
93	2021-09-18 17:54:34.012602+00
94	2021-09-18 17:54:42.062986+00
95	2021-09-18 17:58:18.659109+00
96	2021-09-18 18:02:06.149171+00
97	2021-09-18 18:02:21.087225+00
98	2021-09-18 18:02:51.553996+00
99	2021-09-18 18:07:09.29875+00
100	2021-09-18 18:07:24.779503+00
101	2021-09-18 18:11:11.866939+00
102	2021-09-18 18:11:24.110409+00
103	2021-09-18 18:11:36.857165+00
104	2021-09-18 18:16:48.075786+00
105	2021-09-18 18:21:05.336737+00
106	2021-09-18 18:23:23.172569+00
107	2021-09-18 18:25:07.074137+00
108	2021-09-18 18:28:56.444197+00
109	2021-09-18 18:30:44.694013+00
110	2021-09-18 18:32:53.96134+00
111	2021-09-18 18:34:56.91444+00
112	2021-09-18 18:36:53.567199+00
113	2021-09-18 18:54:51.840064+00
114	2021-09-18 18:55:15.43198+00
115	2021-09-18 18:58:09.004167+00
116	2021-09-18 19:03:37.662418+00
117	2021-09-18 19:12:25.011351+00
118	2021-09-18 19:12:37.17388+00
119	2021-09-18 19:13:22.699924+00
120	2021-09-18 19:19:08.654237+00
121	2021-09-18 19:19:22.861835+00
122	2021-09-18 19:21:37.595703+00
123	2021-09-18 19:21:51.194769+00
124	2021-09-18 19:25:53.898525+00
125	2021-09-18 19:31:05.916441+00
126	2021-09-18 19:33:15.551032+00
127	2021-09-18 19:35:23.590871+00
128	2021-09-18 19:35:33.36263+00
129	2021-09-18 19:35:59.547579+00
130	2021-09-18 19:39:27.224895+00
134	2021-09-18 19:42:43.846238+00
135	2021-09-18 19:45:07.41543+00
131	2021-09-18 19:41:43.209067+00
132	2021-09-18 19:41:53.890289+00
133	2021-09-18 19:42:30.779558+00
136	2021-09-18 19:49:48.362974+00
137	2021-09-18 19:51:11.555569+00
138	2021-09-18 19:51:24.537986+00
139	2021-09-18 19:52:01.842864+00
140	2021-09-18 19:55:46.394363+00
141	2021-09-18 19:57:31.86999+00
142	2021-09-18 19:57:41.507787+00
143	2021-09-18 19:58:04.117722+00
144	2021-09-18 20:01:49.942992+00
145	2021-09-18 20:03:36.205928+00
146	2021-09-18 20:05:13.979023+00
147	2021-09-18 20:06:30.441384+00
148	2021-09-18 20:08:29.810746+00
149	2021-09-18 20:10:14.919573+00
150	2021-09-18 20:14:18.700314+00
151	2021-09-18 20:17:14.783434+00
152	2021-09-18 20:17:28.412653+00
153	2021-09-18 20:17:37.096708+00
154	2021-09-18 20:23:01.814357+00
155	2021-09-18 20:30:29.193113+00
156	2021-09-18 20:30:47.26787+00
157	2021-09-18 20:31:05.032092+00
158	2021-09-18 20:32:10.197883+00
159	2021-09-18 20:46:43.167421+00
160	2021-09-18 20:48:21.677078+00
161	2021-09-18 20:48:31.54349+00
161	2021-09-18 20:53:02.07975+00
162	2021-09-18 20:54:11.547983+00
163	2021-09-18 20:54:57.56632+00
164	2021-09-18 20:56:09.90195+00
162	2021-09-18 20:56:18.998632+00
164	2021-09-18 20:57:34.422133+00
165	2021-09-18 20:57:38.468669+00
166	2021-09-18 20:57:46.564564+00
166	2021-09-18 20:57:56.260409+00
167	2021-09-18 20:58:17.088863+00
168	2021-09-18 20:59:45.190939+00
169	2021-09-18 20:59:51.487902+00
170	2021-09-18 20:59:59.780793+00
171	2021-09-18 21:01:57.793342+00
172	2021-09-18 21:12:10.661137+00
173	2021-09-18 21:12:27.540978+00
174	2021-09-18 21:13:27.74665+00
175	2021-09-18 21:20:14.351042+00
176	2021-09-18 21:20:27.834563+00
177	2021-09-18 21:25:56.402629+00
178	2021-09-18 21:26:04.383145+00
179	2021-09-21 13:56:06.447324+00
180	2021-09-21 13:56:16.727374+00
181	2021-09-21 13:56:25.593959+00
182	2021-09-21 14:01:00.033051+00
183	2021-09-21 14:01:11.362422+00
184	2021-09-21 14:06:12.389714+00
185	2021-09-21 14:06:13.790115+00
186	2021-09-22 14:00:39.698461+00
187	2021-09-22 14:01:50.618384+00
188	2021-09-22 14:02:01.986553+00
187	2021-09-22 14:02:10.437721+00
189	2021-09-22 14:02:25.259233+00
190	2021-09-22 14:14:40.588482+00
191	2021-09-22 14:14:59.926267+00
192	2021-09-22 14:15:11.857188+00
193	2021-09-22 14:21:19.35458+00
194	2021-09-22 14:29:49.613333+00
195	2021-09-22 14:32:43.671033+00
196	2021-09-22 14:37:11.081281+00
197	2021-09-22 14:37:20.648179+00
198	2021-09-22 14:44:30.583291+00
199	2021-09-22 14:44:42.736197+00
200	2021-09-22 14:47:01.289837+00
201	2021-09-22 14:54:12.92605+00
202	2021-09-22 15:14:34.421823+00
203	2021-09-22 15:14:51.387614+00
204	2021-09-22 15:15:06.69243+00
205	2021-09-22 15:44:54.3544+00
206	2021-09-22 15:45:25.513286+00
207	2021-09-22 15:49:04.018117+00
208	2021-09-22 15:49:42.464838+00
209	2021-09-22 17:25:35.976519+00
210	2021-09-22 17:35:32.321394+00
211	2021-09-22 17:36:57.871792+00
212	2021-09-22 17:42:51.34467+00
213	2021-09-22 17:47:22.503922+00
214	2021-09-22 18:01:51.446504+00
215	2021-09-22 18:03:42.238422+00
216	2021-09-22 18:09:13.455843+00
217	2021-09-22 18:11:14.695224+00
218	2021-09-22 18:13:57.237858+00
219	2021-09-22 18:17:40.287009+00
220	2021-09-22 18:21:05.681591+00
221	2021-09-22 18:21:17.685285+00
222	2021-09-22 18:21:34.118031+00
223	2021-09-22 18:26:01.362408+00
224	2021-09-22 18:26:08.525545+00
225	2021-09-22 18:28:27.236796+00
226	2021-09-22 18:30:10.635623+00
227	2021-09-22 18:50:32.259721+00
228	2021-09-22 18:50:41.070208+00
229	2021-09-22 18:53:39.311253+00
188	2021-09-22 18:53:51.788949+00
230	2021-09-22 19:01:59.405312+00
231	2021-09-22 19:02:15.366824+00
232	2021-09-22 19:04:53.057051+00
233	2021-09-22 19:09:07.377164+00
186	2021-09-22 19:11:08.013336+00
234	2021-09-22 19:12:36.812973+00
189	2021-09-22 19:22:29.721114+00
229	2021-09-22 19:22:31.684904+00
235	2021-09-22 19:40:33.857096+00
236	2021-09-22 19:40:49.080251+00
237	2021-09-22 19:41:38.660354+00
238	2021-09-22 19:48:50.483739+00
239	2021-09-22 19:48:57.691132+00
240	2021-09-22 19:54:54.170365+00
241	2021-09-22 20:04:12.708255+00
242	2021-09-22 20:09:10.384408+00
243	2021-09-22 20:10:34.614999+00
244	2021-09-22 20:13:28.523955+00
245	2021-09-22 20:13:36.628392+00
246	2021-09-22 20:15:11.027777+00
247	2021-09-22 20:15:23.088926+00
248	2021-09-22 20:17:31.990402+00
249	2021-09-22 20:17:44.15488+00
250	2021-09-22 20:20:34.256614+00
251	2021-09-22 20:22:49.616339+00
252	2021-09-22 20:47:07.473484+00
253	2021-09-22 20:49:37.44846+00
254	2021-09-22 20:49:43.285394+00
255	2021-09-22 20:49:51.321183+00
256	2021-09-22 20:52:34.931893+00
257	2021-09-22 20:54:32.883918+00
258	2021-09-22 20:55:42.652004+00
259	2021-09-22 20:56:48.473379+00
260	2021-09-22 20:56:57.136955+00
261	2021-09-22 20:58:32.790013+00
262	2021-09-22 20:59:18.166972+00
263	2021-09-22 20:59:27.07715+00
264	2021-09-22 21:04:23.339769+00
265	2021-09-22 21:04:32.895624+00
266	2021-09-22 21:06:48.61605+00
267	2021-09-22 21:21:14.769092+00
268	2021-09-22 21:21:22.576699+00
269	2021-09-22 21:26:12.010429+00
270	2021-09-22 21:28:26.615304+00
271	2021-09-22 21:28:33.791033+00
272	2021-09-22 21:30:39.224978+00
273	2021-09-22 21:30:45.760754+00
274	2021-09-22 21:33:28.767807+00
275	2021-09-22 21:33:53.92957+00
276	2021-09-22 21:36:46.192252+00
277	2021-09-22 21:36:52.174917+00
278	2021-09-22 21:48:29.901296+00
279	2021-09-22 21:48:59.495055+00
280	2021-09-22 21:52:40.349486+00
281	2021-09-23 15:13:09.006357+00
282	2021-09-23 15:13:21.5003+00
283	2021-09-23 15:18:40.774612+00
284	2021-09-23 15:18:53.332709+00
285	2021-09-23 15:19:05.163869+00
286	2021-09-23 15:24:56.026661+00
287	2021-09-23 15:25:06.744346+00
288	2021-09-23 15:25:19.397166+00
289	2021-09-23 15:40:49.816969+00
290	2021-09-23 15:41:01.681377+00
291	2021-09-23 15:41:11.646914+00
292	2021-09-23 15:41:37.000718+00
293	2021-09-23 15:42:00.243654+00
294	2021-09-23 15:50:13.966952+00
295	2021-09-23 15:50:20.821484+00
296	2021-09-23 15:50:30.506165+00
297	2021-09-23 15:55:09.637574+00
298	2021-09-23 15:55:17.412287+00
299	2021-09-23 15:55:40.671923+00
300	2021-09-23 16:15:49.273559+00
301	2021-09-23 16:15:57.236602+00
302	2021-09-23 16:16:08.017177+00
303	2021-09-23 18:37:05.284615+00
304	2021-09-23 18:37:16.563192+00
1	2021-09-28 20:44:13.614584+00
2	2021-09-28 20:44:13.634003+00
3	2021-09-28 20:44:13.651564+00
4	2021-09-28 20:44:13.665832+00
5	2021-09-28 20:44:13.687309+00
6	2021-09-28 20:44:13.705469+00
11	2021-09-28 20:44:13.719572+00
13	2021-09-28 20:44:13.734976+00
14	2021-09-28 20:44:13.74975+00
15	2021-09-28 20:44:13.763832+00
16	2021-09-28 20:44:13.778342+00
17	2021-09-28 20:44:13.792113+00
18	2021-09-28 20:44:13.806275+00
19	2021-09-28 20:44:13.820578+00
20	2021-09-28 20:44:13.835302+00
21	2021-09-28 20:44:13.85125+00
22	2021-09-28 20:44:13.870338+00
23	2021-09-28 20:44:13.887071+00
24	2021-09-28 20:44:13.90248+00
25	2021-09-28 20:44:13.918476+00
28	2021-09-28 20:44:13.933559+00
29	2021-09-28 20:44:13.947831+00
30	2021-09-28 20:44:13.962223+00
31	2021-09-28 20:44:13.976678+00
32	2021-09-28 20:44:13.991759+00
33	2021-09-28 20:44:14.006676+00
34	2021-09-28 20:44:14.021422+00
35	2021-09-28 20:44:14.03623+00
40	2021-09-28 20:44:14.050244+00
41	2021-09-28 20:44:14.067661+00
42	2021-09-28 20:44:14.083629+00
43	2021-09-28 20:44:14.101461+00
44	2021-09-28 20:44:14.116758+00
45	2021-09-28 20:44:14.132461+00
46	2021-09-28 20:44:14.148796+00
47	2021-09-28 20:44:14.167421+00
48	2021-09-28 20:44:14.183119+00
49	2021-09-28 20:44:14.197977+00
50	2021-09-28 20:44:14.20719+00
51	2021-09-28 20:44:14.221785+00
52	2021-09-28 20:44:14.237118+00
53	2021-09-28 20:44:14.25273+00
56	2021-09-28 20:44:14.269282+00
57	2021-09-28 20:44:14.283445+00
60	2021-09-28 20:44:14.298962+00
62	2021-09-28 20:44:14.316027+00
63	2021-09-28 20:44:14.332871+00
64	2021-09-28 20:44:14.350484+00
65	2021-09-28 20:44:14.366117+00
66	2021-09-28 20:44:14.379181+00
67	2021-09-28 20:44:14.397188+00
68	2021-09-28 20:44:14.415073+00
69	2021-09-28 20:44:14.432756+00
70	2021-09-28 20:44:14.448423+00
71	2021-09-28 20:44:14.464728+00
72	2021-09-28 20:44:14.481078+00
73	2021-09-28 20:44:14.496482+00
74	2021-09-28 20:44:14.513549+00
75	2021-09-28 20:44:14.529379+00
76	2021-09-28 20:44:14.544678+00
77	2021-09-28 20:44:14.560682+00
78	2021-09-28 20:44:14.576722+00
79	2021-09-28 20:44:14.593536+00
80	2021-09-28 20:44:14.608598+00
81	2021-09-28 20:44:14.624193+00
83	2021-09-28 20:44:14.639702+00
84	2021-09-28 20:44:14.656627+00
85	2021-09-28 20:44:14.672476+00
86	2021-09-28 20:44:14.687198+00
87	2021-09-28 20:44:14.700707+00
88	2021-09-28 20:44:14.716328+00
89	2021-09-28 20:44:14.732292+00
90	2021-09-28 20:44:14.749066+00
91	2021-09-28 20:44:14.768198+00
92	2021-09-28 20:44:14.78371+00
93	2021-09-28 20:44:14.798797+00
94	2021-09-28 20:44:14.812743+00
95	2021-09-28 20:44:14.82779+00
96	2021-09-28 20:44:14.842502+00
97	2021-09-28 20:44:14.857174+00
98	2021-09-28 20:44:14.872763+00
99	2021-09-28 20:44:14.890442+00
100	2021-09-28 20:44:14.906477+00
101	2021-09-28 20:44:14.921144+00
102	2021-09-28 20:44:14.937082+00
103	2021-09-28 20:44:14.951242+00
104	2021-09-28 20:44:14.967547+00
105	2021-09-28 20:44:14.98323+00
106	2021-09-28 20:44:14.999578+00
107	2021-09-28 20:44:15.015284+00
108	2021-09-28 20:44:15.031396+00
109	2021-09-28 20:44:15.0485+00
110	2021-09-28 20:44:15.06613+00
111	2021-09-28 20:44:15.084938+00
112	2021-09-28 20:44:15.103502+00
113	2021-09-28 20:44:15.117842+00
114	2021-09-28 20:44:15.134338+00
115	2021-09-28 20:44:15.151719+00
116	2021-09-28 20:44:15.166524+00
117	2021-09-28 20:44:15.182025+00
118	2021-09-28 20:44:15.201452+00
119	2021-09-28 20:44:15.214253+00
120	2021-09-28 20:44:15.230975+00
121	2021-09-28 20:44:15.247794+00
122	2021-09-28 20:44:15.264094+00
123	2021-09-28 20:44:15.281549+00
124	2021-09-28 20:44:15.296476+00
125	2021-09-28 20:44:15.31445+00
126	2021-09-28 20:44:15.329251+00
127	2021-09-28 20:44:15.343746+00
128	2021-09-28 20:44:15.358944+00
129	2021-09-28 20:44:15.375251+00
130	2021-09-28 20:44:15.390753+00
131	2021-09-28 20:44:15.408348+00
132	2021-09-28 20:44:15.423429+00
133	2021-09-28 20:44:15.440623+00
134	2021-09-28 20:44:15.456673+00
135	2021-09-28 20:44:15.472938+00
136	2021-09-28 20:44:15.488789+00
137	2021-09-28 20:44:15.50383+00
138	2021-09-28 20:44:15.520151+00
139	2021-09-28 20:44:15.53415+00
140	2021-09-28 20:44:15.549144+00
141	2021-09-28 20:44:15.563136+00
142	2021-09-28 20:44:15.577051+00
143	2021-09-28 20:44:15.595082+00
144	2021-09-28 20:44:15.609892+00
145	2021-09-28 20:44:15.625972+00
146	2021-09-28 20:44:15.642401+00
147	2021-09-28 20:44:15.658008+00
148	2021-09-28 20:44:15.674758+00
149	2021-09-28 20:44:15.689957+00
150	2021-09-28 20:44:15.705714+00
151	2021-09-28 20:44:15.719588+00
152	2021-09-28 20:44:15.734092+00
153	2021-09-28 20:44:15.749158+00
154	2021-09-28 20:44:15.764094+00
155	2021-09-28 20:44:15.780621+00
156	2021-09-28 20:44:15.796585+00
157	2021-09-28 20:44:15.814941+00
158	2021-09-28 20:44:15.833998+00
159	2021-09-28 20:44:15.851711+00
160	2021-09-28 20:44:15.865562+00
163	2021-09-28 20:44:15.881844+00
165	2021-09-28 20:44:15.896376+00
167	2021-09-28 20:44:15.910704+00
168	2021-09-28 20:44:15.927379+00
169	2021-09-28 20:44:15.941017+00
170	2021-09-28 20:44:15.955699+00
171	2021-09-28 20:44:15.969519+00
172	2021-09-28 20:44:15.984004+00
173	2021-09-28 20:44:16.000658+00
174	2021-09-28 20:44:16.016822+00
175	2021-09-28 20:44:16.03339+00
176	2021-09-28 20:44:16.048562+00
177	2021-09-28 20:44:16.067292+00
178	2021-09-28 20:44:16.082858+00
179	2021-09-28 20:44:16.098236+00
180	2021-09-28 20:44:16.111698+00
181	2021-09-28 20:44:16.127017+00
182	2021-09-28 20:44:16.142624+00
183	2021-09-28 20:44:16.15945+00
184	2021-09-28 20:44:16.178436+00
185	2021-09-28 20:44:16.194152+00
190	2021-09-28 20:44:16.20864+00
191	2021-09-28 20:44:16.219354+00
192	2021-09-28 20:44:16.232952+00
193	2021-09-28 20:44:16.247401+00
194	2021-09-28 20:44:16.262442+00
195	2021-09-28 20:44:16.27755+00
196	2021-09-28 20:44:16.291739+00
197	2021-09-28 20:44:16.307677+00
198	2021-09-28 20:44:16.32289+00
199	2021-09-28 20:44:16.338878+00
200	2021-09-28 20:44:16.353789+00
201	2021-09-28 20:44:16.368446+00
202	2021-09-28 20:44:16.386184+00
203	2021-09-28 20:44:16.400599+00
204	2021-09-28 20:44:16.416076+00
205	2021-09-28 20:44:16.433159+00
206	2021-09-28 20:44:16.449775+00
207	2021-09-28 20:44:16.46516+00
208	2021-09-28 20:44:16.481301+00
209	2021-09-28 20:44:16.498108+00
210	2021-09-28 20:44:16.517198+00
211	2021-09-28 20:44:16.532846+00
212	2021-09-28 20:44:16.549324+00
213	2021-09-28 20:44:16.566975+00
214	2021-09-28 20:44:16.582785+00
215	2021-09-28 20:44:16.598769+00
216	2021-09-28 20:44:16.615024+00
217	2021-09-28 20:44:16.632117+00
218	2021-09-28 20:44:16.648961+00
219	2021-09-28 20:44:16.665268+00
220	2021-09-28 20:44:16.680663+00
221	2021-09-28 20:44:16.699545+00
222	2021-09-28 20:44:16.715461+00
223	2021-09-28 20:44:16.730695+00
224	2021-09-28 20:44:16.745533+00
225	2021-09-28 20:44:16.759046+00
226	2021-09-28 20:44:16.774135+00
227	2021-09-28 20:44:16.788359+00
228	2021-09-28 20:44:16.802347+00
230	2021-09-28 20:44:16.817376+00
231	2021-09-28 20:44:16.832186+00
232	2021-09-28 20:44:16.849283+00
233	2021-09-28 20:44:16.865449+00
234	2021-09-28 20:44:16.882027+00
235	2021-09-28 20:44:16.897523+00
236	2021-09-28 20:44:16.911573+00
237	2021-09-28 20:44:16.92523+00
238	2021-09-28 20:44:16.939166+00
239	2021-09-28 20:44:16.952615+00
240	2021-09-28 20:44:16.967977+00
241	2021-09-28 20:44:16.983824+00
242	2021-09-28 20:44:16.998527+00
243	2021-09-28 20:44:17.015968+00
244	2021-09-28 20:44:17.032391+00
245	2021-09-28 20:44:17.048782+00
246	2021-09-28 20:44:17.066021+00
247	2021-09-28 20:44:17.08227+00
248	2021-09-28 20:44:17.098313+00
249	2021-09-28 20:44:17.114392+00
250	2021-09-28 20:44:17.131807+00
251	2021-09-28 20:44:17.150335+00
252	2021-09-28 20:44:17.166616+00
253	2021-09-28 20:44:17.182165+00
254	2021-09-28 20:44:17.19837+00
255	2021-09-28 20:44:17.214731+00
256	2021-09-28 20:44:17.226649+00
257	2021-09-28 20:44:17.241711+00
258	2021-09-28 20:44:17.258376+00
259	2021-09-28 20:44:17.273581+00
260	2021-09-28 20:44:17.289643+00
261	2021-09-28 20:44:17.304365+00
262	2021-09-28 20:44:17.321632+00
263	2021-09-28 20:44:17.338859+00
264	2021-09-28 20:44:17.354776+00
265	2021-09-28 20:44:17.370671+00
266	2021-09-28 20:44:17.385538+00
267	2021-09-28 20:44:17.400496+00
268	2021-09-28 20:44:17.416352+00
269	2021-09-28 20:44:17.432737+00
270	2021-09-28 20:44:17.450332+00
271	2021-09-28 20:44:17.465724+00
272	2021-09-28 20:44:17.482919+00
273	2021-09-28 20:44:17.498516+00
274	2021-09-28 20:44:17.51711+00
275	2021-09-28 20:44:17.53213+00
276	2021-09-28 20:44:17.547797+00
277	2021-09-28 20:44:17.565005+00
278	2021-09-28 20:44:17.582028+00
279	2021-09-28 20:44:17.59864+00
280	2021-09-28 20:44:17.61483+00
281	2021-09-28 20:44:17.631349+00
282	2021-09-28 20:44:17.649569+00
283	2021-09-28 20:44:17.665983+00
284	2021-09-28 20:44:17.681954+00
285	2021-09-28 20:44:17.698461+00
286	2021-09-28 20:44:17.715188+00
287	2021-09-28 20:44:17.733002+00
288	2021-09-28 20:44:17.749745+00
289	2021-09-28 20:44:17.767921+00
290	2021-09-28 20:44:17.782237+00
291	2021-09-28 20:44:17.798977+00
292	2021-09-28 20:44:17.812474+00
293	2021-09-28 20:44:17.826758+00
294	2021-09-28 20:44:17.8418+00
295	2021-09-28 20:44:17.85704+00
296	2021-09-28 20:44:17.86978+00
297	2021-09-28 20:44:17.884984+00
298	2021-09-28 20:44:17.899492+00
299	2021-09-28 20:44:17.917736+00
300	2021-09-28 20:44:17.932761+00
301	2021-09-28 20:44:17.949005+00
302	2021-09-28 20:44:17.965773+00
303	2021-09-28 20:44:17.982714+00
304	2021-09-28 20:44:17.998988+00
305	2021-09-28 21:39:16.76977+00
305	2021-09-28 21:39:36.924813+00
307	2021-10-04 16:44:24.795564+00
310	2021-10-06 03:25:18.122475+00
310	2021-10-06 03:28:53.890052+00
311	2021-10-06 03:52:16.198068+00
312	2021-10-06 03:56:13.623137+00
311	2021-10-06 04:04:10.360573+00
312	2021-10-06 04:04:51.880744+00
313	2021-10-06 13:03:53.282555+00
314	2021-10-06 13:06:57.123083+00
315	2021-10-06 13:07:21.837815+00
316	2021-10-06 13:10:23.406542+00
317	2021-10-06 13:23:48.200983+00
312	2021-10-06 15:59:57.171069+00
311	2021-10-06 16:31:52.180897+00
307	2021-10-06 16:39:22.425184+00
310	2021-10-06 16:39:22.425184+00
350	2021-10-06 19:46:05.593137+00
351	2021-10-06 19:51:27.223623+00
351	2021-10-06 19:52:17.736396+00
352	2021-10-07 18:10:03.928254+00
353	2021-10-07 18:16:15.290624+00
354	2021-10-07 18:38:12.381023+00
355	2021-10-07 18:51:29.912745+00
356	2021-10-07 19:09:32.909245+00
357	2021-10-07 19:20:28.461774+00
358	2021-10-07 19:21:30.59063+00
359	2021-10-07 19:32:34.542212+00
360	2021-10-07 19:33:01.197135+00
366	2021-10-07 19:47:54.193943+00
366	2021-10-07 19:52:46.426041+00
367	2021-10-07 19:59:05.655298+00
368	2021-10-07 20:02:00.61779+00
369	2021-10-07 20:04:01.287359+00
370	2021-10-07 20:04:52.360048+00
371	2021-10-07 20:06:50.059262+00
371	2021-10-07 20:07:10.291119+00
372	2021-10-07 20:07:42.513499+00
373	2021-10-07 20:12:33.393326+00
374	2021-10-07 20:12:58.694321+00
375	2021-10-07 20:15:01.577212+00
376	2021-10-07 20:18:34.866587+00
377	2021-10-07 20:21:24.78484+00
378	2021-10-08 18:00:31.294019+00
379	2021-10-14 17:05:09.695105+00
380	2021-10-26 14:42:05.296815+00
381	2021-10-26 14:42:53.20154+00
382	2021-10-26 14:43:05.404842+00
383	2021-10-26 14:57:02.971248+00
384	2021-10-26 15:00:40.329255+00
385	2021-10-26 16:30:25.707505+00
386	2021-10-26 17:13:07.360276+00
387	2021-10-26 17:13:23.627156+00
388	2021-10-27 12:33:23.297965+00
389	2021-10-27 12:33:48.11797+00
390	2021-10-27 12:34:01.232423+00
391	2021-10-27 12:45:52.166833+00
392	2021-10-27 12:46:15.500502+00
393	2021-10-27 12:53:40.836161+00
394	2021-10-27 12:54:22.666099+00
395	2021-10-27 13:10:00.486451+00
396	2021-10-27 13:10:15.907419+00
397	2021-10-27 13:23:49.204718+00
398	2021-10-27 13:26:14.701219+00
399	2021-10-27 13:26:48.061165+00
401	2021-10-27 13:53:54.785047+00
402	2021-10-27 13:54:38.031325+00
403	2021-10-27 13:54:51.768303+00
404	2021-10-27 13:56:04.841861+00
404	2021-10-27 14:04:54.595987+00
405	2021-10-27 14:07:05.190358+00
406	2021-10-27 14:07:45.791351+00
407	2021-10-27 14:10:31.044413+00
408	2021-10-27 14:10:55.921782+00
409	2021-10-27 14:13:39.369347+00
410	2021-10-27 14:13:56.710039+00
411	2021-10-27 14:18:19.307697+00
412	2021-10-27 14:21:27.596517+00
413	2021-10-27 14:22:50.533693+00
414	2021-10-27 14:25:18.514486+00
415	2021-10-27 14:28:01.476238+00
416	2021-10-27 14:31:22.578928+00
417	2021-10-27 14:31:33.404047+00
418	2021-10-27 14:31:43.329323+00
419	2021-10-27 14:36:34.116849+00
420	2021-10-27 14:36:45.901824+00
421	2021-10-27 14:36:55.444567+00
422	2021-10-27 14:41:14.541335+00
423	2021-10-27 14:41:44.740501+00
424	2021-10-27 14:41:53.889349+00
425	2021-10-27 15:03:37.281065+00
426	2021-10-27 15:03:50.037119+00
427	2021-10-27 15:03:58.945337+00
428	2021-10-27 15:11:16.573236+00
429	2021-10-27 15:11:27.843536+00
430	2021-10-27 15:11:42.330604+00
431	2021-10-27 15:15:36.30237+00
432	2021-10-27 15:16:10.64383+00
433	2021-10-27 17:01:54.797142+00
434	2021-10-27 17:02:07.73729+00
435	2021-10-27 17:03:23.834606+00
436	2021-10-27 17:03:53.249276+00
435	2021-10-27 17:04:02.718464+00
437	2021-10-27 17:04:45.274916+00
438	2021-10-27 17:09:36.579646+00
439	2021-10-27 17:09:50.090891+00
440	2021-10-27 17:10:03.39915+00
441	2021-10-27 17:10:21.788645+00
442	2021-10-27 17:10:36.540218+00
443	2021-10-27 17:27:39.505063+00
444	2021-10-27 17:29:14.404589+00
445	2021-10-27 17:29:29.635987+00
446	2021-10-27 17:36:35.460391+00
447	2021-10-27 17:40:16.318471+00
448	2021-10-27 17:40:23.7937+00
449	2021-10-27 17:54:00.36943+00
450	2021-10-27 17:54:51.744501+00
451	2021-10-27 18:08:12.535762+00
317	2021-10-27 18:54:21.797225+00
452	2021-10-27 19:37:55.787687+00
453	2021-10-27 19:38:39.507309+00
454	2021-10-27 19:38:51.875057+00
455	2021-10-27 19:39:22.868552+00
456	2021-10-27 19:39:36.587774+00
457	2021-10-28 12:36:21.426855+00
458	2021-10-28 12:37:21.378257+00
459	2021-10-28 13:08:00.624932+00
460	2021-10-28 13:08:16.713146+00
461	2021-10-28 13:08:25.420894+00
462	2021-10-28 13:44:10.858609+00
463	2021-10-28 13:45:10.518347+00
464	2021-10-28 14:07:12.890788+00
465	2021-10-28 14:17:43.151764+00
466	2021-10-28 14:26:02.164885+00
467	2021-10-28 14:26:15.89066+00
468	2021-10-28 14:26:55.093373+00
469	2021-10-28 15:19:14.315612+00
470	2021-10-28 15:19:26.092384+00
471	2021-10-28 15:19:33.929724+00
472	2021-10-28 15:20:03.70065+00
473	2021-10-28 15:20:28.039274+00
474	2021-10-28 17:24:10.330641+00
475	2021-10-28 17:24:20.756189+00
476	2021-10-28 17:24:38.405102+00
477	2021-10-28 17:37:24.871231+00
478	2021-10-28 17:37:39.310509+00
479	2021-10-28 17:37:50.372609+00
480	2021-10-28 17:38:28.719859+00
481	2021-10-28 17:38:49.259045+00
482	2021-10-28 17:44:34.841562+00
483	2021-10-28 17:44:49.421464+00
484	2021-10-28 17:45:07.479218+00
485	2021-10-28 17:48:18.426715+00
486	2021-10-28 17:48:28.84794+00
487	2021-10-28 17:48:46.451547+00
488	2021-10-28 18:02:14.583097+00
489	2021-10-28 18:02:25.414777+00
490	2021-10-28 18:02:35.360233+00
491	2021-10-28 18:02:42.507425+00
492	2021-10-28 18:03:25.24117+00
489	2021-10-28 18:06:03.208546+00
490	2021-10-28 18:06:07.036711+00
491	2021-10-28 18:06:11.05549+00
492	2021-10-28 18:06:27.930675+00
493	2021-10-28 18:13:46.908258+00
494	2021-10-28 18:13:59.490065+00
495	2021-10-28 18:33:54.067761+00
496	2021-10-28 18:34:26.187372+00
497	2021-10-28 18:41:06.969767+00
498	2021-10-28 18:41:14.804338+00
499	2021-10-28 18:41:24.174917+00
500	2021-10-28 18:51:07.910874+00
501	2021-10-28 18:51:28.226215+00
502	2021-10-28 18:51:39.752311+00
503	2021-10-28 18:52:01.520367+00
504	2021-10-28 18:52:24.668587+00
505	2021-10-28 19:01:03.376186+00
506	2021-10-28 19:01:23.330135+00
507	2021-10-28 19:39:25.74502+00
508	2021-10-28 19:39:45.259809+00
509	2021-10-28 19:45:14.150522+00
510	2021-10-28 19:45:24.11681+00
511	2021-10-28 19:45:45.27184+00
512	2021-10-28 19:54:55.155426+00
513	2021-10-28 19:55:01.545022+00
514	2021-10-29 18:02:23.196063+00
515	2021-10-29 18:03:03.606553+00
516	2021-10-29 18:07:37.750872+00
517	2021-10-29 18:07:54.253403+00
518	2021-10-29 18:08:04.018444+00
519	2021-10-29 18:32:09.999245+00
519	2021-10-29 18:32:17.866941+00
520	2021-10-29 18:32:33.046183+00
521	2021-10-29 18:32:46.506283+00
522	2021-10-29 18:46:49.365607+00
523	2021-10-29 18:47:01.388163+00
524	2021-10-29 19:07:17.612429+00
525	2021-10-29 19:07:25.765598+00
526	2021-10-29 19:07:34.226024+00
527	2021-10-29 19:43:27.579989+00
528	2021-10-29 19:43:57.962419+00
529	2021-10-29 19:44:10.106258+00
530	2021-10-29 20:16:15.877479+00
531	2021-10-29 20:16:29.464061+00
532	2021-10-30 18:37:17.583057+00
533	2021-10-30 18:37:33.804567+00
534	2021-10-30 18:42:46.276549+00
535	2021-10-30 18:43:26.633878+00
536	2021-10-30 18:58:17.122129+00
537	2021-10-30 18:58:53.109356+00
538	2021-10-30 18:59:07.657961+00
539	2021-10-30 19:20:08.724256+00
540	2021-10-30 19:20:23.856103+00
541	2021-10-30 19:44:31.6224+00
542	2021-10-30 19:45:00.901296+00
543	2021-10-30 19:45:09.554842+00
544	2021-10-30 19:59:00.416588+00
545	2021-10-30 19:59:11.285949+00
546	2021-10-30 19:59:23.100705+00
547	2021-10-30 20:10:14.651112+00
548	2021-10-30 20:10:35.134051+00
549	2021-10-30 20:10:45.81919+00
550	2021-11-01 15:13:18.589516+00
551	2021-11-01 15:13:28.277634+00
552	2021-11-01 15:24:36.471822+00
553	2021-11-01 15:25:14.450107+00
554	2021-11-01 15:25:49.640108+00
555	2021-11-01 18:47:50.626105+00
556	2021-11-01 18:48:07.845535+00
557	2021-11-01 18:48:20.080786+00
557	2021-11-01 18:54:20.606189+00
557	2021-11-01 19:00:48.314365+00
558	2021-11-01 19:15:31.079011+00
558	2021-11-01 19:15:57.955112+00
559	2021-11-01 19:16:24.761568+00
560	2021-11-01 19:16:39.230979+00
561	2021-11-01 19:31:11.955761+00
562	2021-11-01 19:31:25.133868+00
563	2021-11-01 19:31:35.483994+00
564	2021-11-02 17:22:55.530123+00
565	2021-11-02 17:23:23.725867+00
566	2021-11-02 17:40:34.944937+00
567	2021-11-02 17:41:00.711568+00
568	2021-11-02 17:49:47.710624+00
569	2021-11-02 17:49:59.263408+00
570	2021-11-02 17:50:09.974906+00
571	2021-11-02 19:04:23.201821+00
572	2021-11-02 19:04:35.034583+00
573	2021-11-02 20:15:58.980967+00
574	2021-11-02 20:16:12.813684+00
575	2021-11-02 20:16:23.485034+00
576	2021-11-03 13:20:10.751855+00
577	2021-11-03 13:20:25.481827+00
578	2021-11-03 13:37:20.5181+00
579	2021-11-03 13:37:37.726906+00
578	2021-11-03 13:37:55.888725+00
580	2021-11-03 13:38:18.445472+00
581	2021-11-03 14:15:09.965703+00
582	2021-11-03 14:15:18.146091+00
583	2021-11-03 17:21:41.455082+00
584	2021-11-03 17:21:47.844352+00
585	2021-11-03 17:34:01.357897+00
586	2021-11-03 17:34:12.569182+00
587	2021-11-03 17:34:21.750503+00
588	2021-11-03 17:34:30.64741+00
589	2021-11-03 17:36:48.804051+00
590	2021-11-03 17:50:46.109492+00
591	2021-11-03 17:50:56.370281+00
592	2021-11-03 17:51:03.436595+00
593	2021-11-03 17:51:16.515095+00
594	2021-11-03 17:51:29.087787+00
595	2021-11-03 18:13:24.409181+00
596	2021-11-03 18:13:32.723287+00
597	2021-11-03 18:13:40.745822+00
598	2021-11-03 18:13:47.091617+00
599	2021-11-03 18:13:57.460564+00
600	2021-11-03 18:34:18.272796+00
601	2021-11-03 18:34:29.164987+00
602	2021-11-03 18:34:37.240447+00
601	2021-11-03 18:34:51.87709+00
602	2021-11-03 18:35:03.096003+00
603	2021-11-03 18:35:11.200427+00
604	2021-11-03 18:35:19.154679+00
605	2021-11-03 19:11:47.584497+00
606	2021-11-03 19:11:54.018024+00
607	2021-11-03 19:12:02.861261+00
608	2021-11-03 19:12:10.406651+00
609	2021-11-03 19:12:20.122536+00
610	2021-11-03 19:39:59.498+00
611	2021-11-03 19:41:10.087194+00
612	2021-11-03 19:41:30.073452+00
613	2021-11-04 13:53:44.589895+00
614	2021-11-04 13:54:00.701189+00
615	2021-11-04 13:54:12.242364+00
616	2021-11-04 14:14:23.29908+00
617	2021-11-04 14:14:37.223459+00
618	2021-11-04 14:18:34.574118+00
619	2021-11-04 14:19:44.75112+00
620	2021-11-04 14:19:56.883697+00
621	2021-11-04 14:26:27.534156+00
622	2021-11-04 14:26:36.95605+00
623	2021-11-04 14:26:49.37827+00
624	2021-11-04 14:30:40.683725+00
625	2021-11-04 14:30:47.530161+00
627	2021-11-04 14:37:58.521842+00
628	2021-11-04 14:38:06.41729+00
629	2021-11-04 14:38:15.93822+00
626	2021-11-04 14:30:55.108075+00
\.


--
-- Data for Name: delta_productos_producto; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_producto (id, txntime) FROM stdin;
27	2021-08-25 20:15:44.623063+00
14	2021-08-27 17:19:37.434454+00
14	2021-08-27 17:25:10.7007+00
28	2021-08-27 20:13:25.448573+00
28	2021-08-27 20:15:21.374262+00
29	2021-08-27 20:22:34.720046+00
14	2021-08-30 16:09:40.660784+00
242	2021-08-30 18:08:05.864876+00
242	2021-08-30 18:13:50.444599+00
243	2021-08-30 18:13:55.590731+00
243	2021-08-30 18:14:51.468929+00
244	2021-08-30 18:18:26.993653+00
244	2021-08-30 18:23:39.228356+00
245	2021-08-30 18:23:51.680015+00
245	2021-08-30 18:24:28.029551+00
246	2021-08-30 18:26:55.3625+00
246	2021-08-30 18:29:39.734221+00
247	2021-08-30 18:29:46.399436+00
247	2021-08-30 18:32:04.069432+00
248	2021-08-30 18:32:09.175402+00
248	2021-08-30 18:36:20.055494+00
249	2021-08-30 18:36:26.682599+00
249	2021-08-30 18:39:04.8961+00
250	2021-08-30 18:39:10.995256+00
250	2021-08-30 18:39:11.081531+00
250	2021-08-30 18:39:32.702024+00
251	2021-08-30 18:44:30.180255+00
251	2021-08-30 18:44:30.250357+00
251	2021-08-30 18:46:25.17646+00
252	2021-08-30 18:47:35.419717+00
252	2021-08-30 18:48:07.111189+00
253	2021-08-30 18:48:47.75273+00
253	2021-08-30 18:48:47.797999+00
253	2021-08-30 18:56:53.807024+00
559	2021-08-30 18:56:53.813112+00
559	2021-08-30 18:57:38.439526+00
560	2021-08-30 18:57:47.255135+00
560	2021-08-30 18:57:47.312531+00
560	2021-08-30 19:00:16.444651+00
1026	2021-08-30 19:04:47.522729+00
1026	2021-08-30 19:04:47.577417+00
1026	2021-08-30 19:05:27.185262+00
1103	2021-08-30 19:09:02.339024+00
1103	2021-08-30 19:09:02.440892+00
1103	2021-08-30 19:45:12.919851+00
1380	2021-08-30 19:47:09.78539+00
1380	2021-08-30 19:47:09.893699+00
1380	2021-08-30 19:47:10.32949+00
1103	2021-08-30 19:47:50.150178+00
1380	2021-08-30 19:47:50.168173+00
1381	2021-08-30 19:48:09.892617+00
1381	2021-08-30 19:48:09.923487+00
1381	2021-08-30 19:48:10.084244+00
1381	2021-08-30 19:48:50.617391+00
1381	2021-08-30 19:48:50.64147+00
1381	2021-08-30 19:48:50.734233+00
1381	2021-08-30 19:59:17.945418+00
1382	2021-08-30 19:59:42.654265+00
1382	2021-08-30 19:59:42.783568+00
1382	2021-08-30 20:00:31.358333+00
1382	2021-08-30 20:00:31.386464+00
1382	2021-08-30 20:05:48.23091+00
1383	2021-08-30 20:16:39.989404+00
1383	2021-08-30 20:16:40.057685+00
1383	2021-08-30 20:27:29.105428+00
4505	2021-08-30 20:27:44.217894+00
4505	2021-08-30 20:28:35.131148+00
4507	2021-08-30 20:28:46.274805+00
4507	2021-08-30 20:28:46.334979+00
4507	2021-08-30 20:29:39.340677+00
4879	2021-08-30 20:37:25.583201+00
4879	2021-08-30 20:37:41.531803+00
4880	2021-08-30 20:37:49.751283+00
4880	2021-08-30 20:37:49.80376+00
4880	2021-08-30 20:40:44.185379+00
5109	2021-08-30 20:41:56.193911+00
5109	2021-08-30 20:41:56.35646+00
5109	2021-08-30 20:46:29.42483+00
5249	2021-08-30 20:48:39.438758+00
5249	2021-08-30 20:48:39.563136+00
5249	2021-08-30 20:54:50.915724+00
5494	2021-08-30 20:55:17.056875+00
5494	2021-08-30 20:55:17.160675+00
5494	2021-08-31 02:25:02.29345+00
5894	2021-08-31 02:35:45.356993+00
5894	2021-08-31 04:24:49.725989+00
5894	2021-08-31 04:31:17.784772+00
6491	2021-08-31 13:32:52.068508+00
6491	2021-08-31 13:33:57.85146+00
6492	2021-08-31 13:35:36.687043+00
6492	2021-08-31 13:36:29.544792+00
6492	2021-08-31 13:40:03.597474+00
6492	2021-08-31 13:40:03.835198+00
6492	2021-08-31 13:41:23.217839+00
6492	2021-08-31 13:42:35.719936+00
6493	2021-08-31 14:20:17.598354+00
6493	2021-08-31 14:26:07.851763+00
6494	2021-08-31 14:26:18.844612+00
6494	2021-08-31 14:26:19.539393+00
6495	2021-08-31 16:11:36.93534+00
6495	2021-08-31 16:12:51.573101+00
6496	2021-08-31 16:14:07.797515+00
6496	2021-08-31 16:55:15.648668+00
6496	2021-08-31 17:06:19.011585+00
6497	2021-08-31 17:06:37.245217+00
6497	2021-08-31 17:06:38.361496+00
6498	2021-08-31 20:38:32.887936+00
6498	2021-08-31 20:52:01.245266+00
6499	2021-08-31 20:52:18.251017+00
6499	2021-08-31 20:55:46.29729+00
6500	2021-08-31 20:55:53.521658+00
6500	2021-08-31 21:01:22.996202+00
6501	2021-08-31 21:01:38.869247+00
6502	2021-08-31 21:05:10.250949+00
6501	2021-08-31 21:29:58.424612+00
6502	2021-08-31 21:29:58.440631+00
6504	2021-08-31 21:30:10.813671+00
6504	2021-08-31 22:04:52.667269+00
6505	2021-08-31 22:05:02.984054+00
6505	2021-08-31 22:05:44.916653+00
6506	2021-08-31 22:05:51.820693+00
6506	2021-08-31 22:13:11.067171+00
6507	2021-08-31 22:14:40.013851+00
6507	2021-08-31 22:19:43.002996+00
6508	2021-08-31 22:19:47.113525+00
6508	2021-08-31 22:20:18.595274+00
6509	2021-08-31 22:20:51.675544+00
6509	2021-09-01 15:00:54.623483+00
6510	2021-09-01 15:13:14.684734+00
6510	2021-09-01 15:27:32.770912+00
6511	2021-09-01 15:27:37.327911+00
6511	2021-09-01 15:30:20.436258+00
6512	2021-09-01 16:01:21.016036+00
6512	2021-09-01 16:06:53.291342+00
6513	2021-09-01 16:10:24.595682+00
6513	2021-09-01 17:10:38.387909+00
6514	2021-09-01 17:10:55.078717+00
6514	2021-09-01 17:13:24.432216+00
6515	2021-09-01 17:15:36.997922+00
6515	2021-09-01 17:57:37.871326+00
6516	2021-09-01 17:58:18.250806+00
6516	2021-09-01 17:59:01.415278+00
6517	2021-09-01 18:00:29.151961+00
6517	2021-09-01 18:48:28.96236+00
6518	2021-09-01 18:48:34.736759+00
6518	2021-09-01 19:05:46.999643+00
6519	2021-09-01 19:06:08.353643+00
6519	2021-09-01 19:12:47.330453+00
6520	2021-09-01 19:13:32.295629+00
6520	2021-09-01 19:16:48.588606+00
6521	2021-09-01 19:17:00.495817+00
6521	2021-09-01 19:21:12.408277+00
6522	2021-09-01 19:21:26.540538+00
6522	2021-09-01 19:22:59.344707+00
6523	2021-09-01 19:23:03.802242+00
6523	2021-09-01 19:38:37.588846+00
6524	2021-09-01 19:43:27.352117+00
6524	2021-09-01 19:49:04.920061+00
6525	2021-09-01 19:49:19.114813+00
6525	2021-09-01 19:57:15.126042+00
6526	2021-09-01 19:58:19.727162+00
6526	2021-09-01 19:59:53.882977+00
6527	2021-09-01 20:00:47.582402+00
6527	2021-09-01 20:04:17.801083+00
6528	2021-09-01 20:04:22.028112+00
6528	2021-09-01 20:08:18.968588+00
6529	2021-09-01 20:08:40.455711+00
6529	2021-09-01 20:15:19.742016+00
6531	2021-09-01 20:15:27.141412+00
6531	2021-09-01 20:19:15.364174+00
6532	2021-09-01 20:19:47.653164+00
6532	2021-09-01 20:21:19.392002+00
6600	2021-09-01 20:28:20.491305+00
6600	2021-09-01 20:28:21.665111+00
6600	2021-09-01 20:48:34.609593+00
6601	2021-09-01 20:48:52.885719+00
6601	2021-09-01 20:48:53.532223+00
6601	2021-09-01 20:57:19.42164+00
6602	2021-09-01 21:03:50.289821+00
6602	2021-09-01 21:03:51.688111+00
6602	2021-09-01 21:04:21.208697+00
6603	2021-09-01 21:40:28.616797+00
6603	2021-09-01 21:41:17.731645+00
6603	2021-09-01 21:42:47.779413+00
6604	2021-09-01 21:57:01.154086+00
6604	2021-09-01 21:57:01.561207+00
2	2021-09-02 15:37:52.704882+00
4	2021-09-02 15:37:52.737565+00
5	2021-09-02 15:37:52.753546+00
6	2021-09-02 15:37:52.769532+00
7	2021-09-02 15:37:52.784882+00
1	2021-09-02 15:40:58.777344+00
3	2021-09-02 15:40:58.79506+00
8	2021-09-02 15:40:58.810665+00
9	2021-09-02 15:40:58.825203+00
27	2021-09-02 15:40:58.840035+00
5894	2021-09-02 15:40:58.8554+00
29	2021-09-02 15:40:58.873579+00
14	2021-09-02 15:40:58.88869+00
6492	2021-09-02 15:40:58.902502+00
6494	2021-09-02 15:40:58.915501+00
6604	2021-09-02 15:40:58.929601+00
6497	2021-09-02 15:40:58.944457+00
6605	2021-09-02 15:50:51.76107+00
6606	2021-09-02 17:57:49.220226+00
6607	2021-09-07 18:31:15.284656+00
6608	2021-09-07 18:55:19.183303+00
6609	2021-09-07 19:10:12.738394+00
6605	2021-09-08 18:58:13.801309+00
6605	2021-09-08 19:05:33.54455+00
6605	2021-09-08 19:07:00.277974+00
6610	2021-09-08 19:09:29.440363+00
6609	2021-09-08 20:38:13.770303+00
6606	2021-09-09 13:53:58.366343+00
6607	2021-09-09 13:53:58.419683+00
6608	2021-09-09 13:53:58.437724+00
6605	2021-09-09 13:53:58.458928+00
6610	2021-09-09 13:53:58.474114+00
6609	2021-09-09 13:53:58.487926+00
1	2021-09-09 14:30:49.584626+00
2	2021-09-09 14:49:20.621183+00
1	2021-09-09 14:54:50.354656+00
2	2021-09-09 14:58:12.847452+00
3	2021-09-14 15:24:44.245379+00
4	2021-09-14 15:29:33.678353+00
4	2021-09-14 15:34:25.078792+00
5	2021-09-15 14:11:08.97535+00
5	2021-09-15 14:11:25.974045+00
1	2021-09-15 15:57:55.893346+00
6	2021-09-15 16:06:18.048498+00
7	2021-09-15 16:26:47.847422+00
8	2021-09-15 16:32:00.181341+00
9	2021-09-15 16:32:06.751553+00
10	2021-09-15 17:54:00.933255+00
11	2021-09-15 18:21:44.347287+00
8	2021-09-15 18:44:23.362774+00
12	2021-09-15 19:15:58.38673+00
13	2021-09-15 19:24:03.307066+00
14	2021-09-15 19:32:27.924829+00
15	2021-09-15 19:34:33.503005+00
15	2021-09-15 19:35:03.020439+00
16	2021-09-15 19:55:36.516925+00
17	2021-09-15 20:10:36.043472+00
18	2021-09-15 20:12:03.616937+00
19	2021-09-15 20:29:16.708021+00
20	2021-09-15 20:34:08.410801+00
21	2021-09-15 20:45:44.803383+00
22	2021-09-15 20:49:36.827135+00
23	2021-09-15 20:53:24.606108+00
24	2021-09-15 20:56:43.421356+00
25	2021-09-15 21:02:08.816863+00
26	2021-09-17 18:35:02.620436+00
27	2021-09-17 18:42:42.467568+00
28	2021-09-17 18:48:21.578722+00
29	2021-09-17 18:54:53.953648+00
30	2021-09-17 19:02:14.185343+00
31	2021-09-18 17:47:47.005634+00
32	2021-09-18 17:51:17.535819+00
33	2021-09-18 17:53:46.452303+00
34	2021-09-18 17:59:40.868277+00
35	2021-09-18 18:04:04.6218+00
36	2021-09-18 18:09:19.714512+00
37	2021-09-18 18:16:07.360767+00
38	2021-09-18 18:20:14.926753+00
39	2021-09-18 18:22:43.471506+00
40	2021-09-18 18:24:33.869853+00
41	2021-09-18 18:27:16.696592+00
42	2021-09-18 18:30:21.838862+00
43	2021-09-18 18:32:07.863033+00
44	2021-09-18 18:34:25.205988+00
45	2021-09-18 18:36:27.251199+00
46	2021-09-18 18:51:22.073842+00
47	2021-09-18 18:57:40.204717+00
48	2021-09-18 19:02:18.364129+00
49	2021-09-18 19:11:11.414429+00
50	2021-09-18 19:12:08.246938+00
51	2021-09-18 19:15:37.866849+00
51	2021-09-18 19:18:07.45024+00
52	2021-09-18 19:19:59.222354+00
52	2021-09-18 19:20:34.184916+00
53	2021-09-18 19:30:19.757019+00
53	2021-09-18 19:31:37.384405+00
50	2021-09-18 19:32:16.800211+00
51	2021-09-18 19:33:43.420469+00
54	2021-09-18 19:34:27.874636+00
55	2021-09-18 19:35:37.891388+00
56	2021-09-18 19:38:43.800138+00
57	2021-09-18 19:40:43.624918+00
58	2021-09-18 19:42:01.043271+00
59	2021-09-18 19:44:46.773288+00
60	2021-09-18 19:48:13.453356+00
61	2021-09-18 19:49:54.19131+00
62	2021-09-18 19:55:24.346577+00
63	2021-09-18 19:57:04.02859+00
64	2021-09-18 19:57:41.493716+00
65	2021-09-18 20:01:30.219834+00
66	2021-09-18 20:03:14.876631+00
67	2021-09-18 20:05:01.385458+00
68	2021-09-18 20:06:15.274508+00
69	2021-09-18 20:08:16.142266+00
70	2021-09-18 20:08:58.392501+00
71	2021-09-18 20:10:01.665931+00
72	2021-09-18 20:13:53.86699+00
72	2021-09-18 20:16:36.166955+00
73	2021-09-18 20:19:25.502855+00
73	2021-09-18 20:20:13.652887+00
73	2021-09-18 20:21:31.0075+00
78	2021-09-18 20:28:11.722211+00
79	2021-09-18 20:28:24.595846+00
80	2021-09-18 20:39:13.583081+00
81	2021-09-18 20:46:27.145668+00
82	2021-09-18 20:47:44.160147+00
83	2021-09-18 20:52:47.905762+00
84	2021-09-18 20:59:43.594237+00
85	2021-09-18 21:01:43.117943+00
86	2021-09-18 21:03:28.472601+00
87	2021-09-18 21:08:55.370586+00
88	2021-09-18 21:25:26.434816+00
89	2021-09-21 13:52:56.010414+00
90	2021-09-21 13:58:07.722415+00
91	2021-09-22 13:58:19.924911+00
92	2021-09-22 14:12:43.380461+00
93	2021-09-22 14:20:59.788643+00
94	2021-09-22 14:29:27.436574+00
95	2021-09-22 14:32:30.226359+00
96	2021-09-22 14:36:20.254506+00
97	2021-09-22 14:44:00.062985+00
98	2021-09-22 14:46:47.632726+00
99	2021-09-22 14:50:14.641608+00
100	2021-09-22 15:44:01.742981+00
100	2021-09-22 15:44:33.077494+00
101	2021-09-22 15:48:08.58716+00
101	2021-09-22 15:48:47.675333+00
102	2021-09-22 17:25:08.825875+00
103	2021-09-22 17:29:01.719597+00
103	2021-09-22 17:34:49.175959+00
104	2021-09-22 17:42:29.11267+00
105	2021-09-22 17:47:00.429658+00
106	2021-09-22 18:01:29.794447+00
107	2021-09-22 18:03:18.273104+00
108	2021-09-22 18:08:46.028243+00
109	2021-09-22 18:10:43.614196+00
110	2021-09-22 18:13:32.348812+00
111	2021-09-22 18:17:18.191753+00
112	2021-09-22 18:19:32.670988+00
112	2021-09-22 18:20:00.751997+00
113	2021-09-22 18:25:24.575938+00
114	2021-09-22 18:28:04.488467+00
115	2021-09-22 18:29:53.558971+00
116	2021-09-22 18:49:55.34917+00
117	2021-09-22 19:08:39.296795+00
118	2021-09-22 19:10:42.93206+00
119	2021-09-22 19:36:16.782638+00
120	2021-09-22 19:47:48.010155+00
121	2021-09-22 19:54:41.618717+00
122	2021-09-22 20:01:56.65028+00
122	2021-09-22 20:03:47.592366+00
123	2021-09-22 20:08:41.630079+00
124	2021-09-22 20:10:16.270863+00
125	2021-09-22 20:12:48.791198+00
126	2021-09-22 20:14:44.314164+00
127	2021-09-22 20:16:54.787844+00
128	2021-09-22 20:20:21.486225+00
129	2021-09-22 20:46:16.892925+00
130	2021-09-22 20:48:51.356319+00
131	2021-09-22 20:49:16.711945+00
132	2021-09-22 20:52:16.719435+00
133	2021-09-22 20:52:21.266686+00
133	2021-09-22 20:53:29.254548+00
134	2021-09-22 20:56:04.641734+00
135	2021-09-22 20:57:54.182233+00
136	2021-09-22 21:03:43.456515+00
137	2021-09-22 21:19:55.830742+00
138	2021-09-22 21:27:55.970745+00
139	2021-09-22 21:29:57.492175+00
140	2021-09-22 21:33:07.228058+00
141	2021-09-22 21:36:06.225268+00
142	2021-09-22 21:41:09.346764+00
143	2021-09-22 21:50:51.856358+00
80	2021-09-22 22:10:46.852813+00
144	2021-09-23 15:09:53.574905+00
145	2021-09-23 15:17:01.508905+00
146	2021-09-23 15:22:39.479284+00
147	2021-09-23 15:34:41.048809+00
148	2021-09-23 15:49:18.838365+00
149	2021-09-23 15:53:36.614615+00
150	2021-09-23 16:11:21.095679+00
151	2021-09-23 18:04:44.573102+00
152	2021-09-23 19:44:56.471621+00
152	2021-09-23 19:47:32.97412+00
153	2021-09-24 13:08:01.10609+00
154	2021-09-24 15:29:17.728722+00
155	2021-09-24 15:56:05.934089+00
156	2021-09-24 16:04:58.51215+00
157	2021-09-24 18:33:11.197574+00
158	2021-09-24 18:45:04.115714+00
159	2021-09-24 18:53:50.163425+00
2	2021-09-28 23:32:05.742902+00
2	2021-09-28 23:32:21.475735+00
160	2021-10-06 13:02:27.940928+00
162	2021-10-06 13:09:55.733775+00
165	2021-10-06 13:23:06.738755+00
166	2021-10-06 13:23:13.221199+00
198	2021-10-07 20:17:08.299172+00
199	2021-10-07 20:20:29.581784+00
200	2021-10-08 17:58:13.785216+00
201	2021-10-08 17:59:15.6248+00
70	2021-10-12 12:29:03.402264+00
202	2021-10-12 12:30:58.636375+00
202	2021-10-15 16:11:49.857119+00
203	2021-10-27 12:19:45.794993+00
204	2021-10-27 13:51:58.936667+00
19	2021-10-27 14:04:27.222227+00
205	2021-10-27 14:06:30.983663+00
20	2021-10-27 14:17:37.336052+00
200	2021-10-27 14:17:37.348241+00
22	2021-10-27 14:17:48.472464+00
206	2021-10-27 14:30:15.095802+00
207	2021-10-27 17:57:02.588803+00
208	2021-10-27 17:59:26.294542+00
209	2021-10-27 18:01:06.333707+00
210	2021-10-27 18:04:34.649557+00
208	2021-10-27 18:10:50.666769+00
209	2021-10-27 18:10:50.709901+00
210	2021-10-27 18:10:50.730729+00
165	2021-10-27 19:10:22.586402+00
166	2021-10-27 19:10:22.603354+00
211	2021-10-27 20:07:41.74701+00
212	2021-10-28 12:35:13.381772+00
213	2021-10-28 13:06:56.094113+00
214	2021-10-28 13:29:43.622736+00
215	2021-10-28 13:32:49.836764+00
214	2021-10-28 13:44:08.15443+00
220	2021-10-28 14:03:48.82855+00
221	2021-10-28 14:20:48.027372+00
222	2021-10-28 15:18:07.087019+00
224	2021-10-28 17:22:50.889872+00
211	2021-10-28 17:27:49.964297+00
1	2021-10-28 17:27:56.921718+00
225	2021-10-28 18:58:23.886332+00
226	2021-10-29 18:01:50.264613+00
227	2021-10-29 18:05:52.393209+00
228	2021-10-29 18:30:05.230029+00
229	2021-10-29 18:43:59.07333+00
230	2021-10-29 19:05:55.437165+00
231	2021-11-01 15:12:06.73194+00
232	2021-11-01 15:17:26.402231+00
145	2021-11-01 17:07:48.357436+00
145	2021-11-01 17:07:54.388923+00
235	2021-11-01 18:46:43.744424+00
236	2021-11-01 19:14:32.494653+00
238	2021-11-01 19:30:01.46501+00
239	2021-11-02 19:01:50.100246+00
240	2021-11-02 19:17:32.559695+00
241	2021-11-02 20:14:51.129453+00
240	2021-11-03 13:17:29.872748+00
242	2021-11-03 13:18:01.918996+00
240	2021-11-03 13:19:47.346927+00
241	2021-11-03 13:22:01.773514+00
240	2021-11-03 13:23:39.748058+00
243	2021-11-03 13:33:12.875393+00
244	2021-11-03 14:12:29.028322+00
244	2021-11-03 14:14:14.706628+00
245	2021-11-03 17:18:43.957573+00
246	2021-11-03 17:32:38.935855+00
247	2021-11-03 17:47:27.256862+00
248	2021-11-03 18:11:01.963208+00
249	2021-11-03 18:30:07.807041+00
250	2021-11-03 19:10:34.987057+00
246	2021-11-03 19:26:21.115958+00
251	2021-11-03 19:38:47.753411+00
252	2021-11-04 13:52:30.61878+00
253	2021-11-04 14:13:35.372509+00
254	2021-11-04 14:17:55.86641+00
255	2021-11-04 14:22:50.919479+00
256	2021-11-04 14:29:31.994592+00
257	2021-11-04 14:37:04.03486+00
\.


--
-- Data for Name: delta_productos_subfamilia; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_subfamilia (id, txntime) FROM stdin;
22	2021-09-18 19:25:02.837576+00
23	2021-11-04 13:48:52.060317+00
\.


--
-- Data for Name: delta_productos_tipo_precio; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_tipo_precio (id, txntime) FROM stdin;
1	2021-10-06 02:44:41.995311+00
2	2021-10-06 02:44:42.029349+00
3	2021-10-06 02:44:42.051816+00
4	2021-10-06 02:44:53.490402+00
\.


--
-- Data for Name: stage_productos_codigo; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.stage_productos_codigo (txntime, target) FROM stdin;
\.


--
-- Data for Name: stage_productos_costos_por_sucursal; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.stage_productos_costos_por_sucursal (txntime, target) FROM stdin;
\.


--
-- Data for Name: stage_productos_familia; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.stage_productos_familia (txntime, target) FROM stdin;
\.


--
-- Data for Name: stage_productos_precio_por_sucursal; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.stage_productos_precio_por_sucursal (txntime, target) FROM stdin;
\.


--
-- Data for Name: stage_productos_producto; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.stage_productos_producto (txntime, target) FROM stdin;
\.


--
-- Data for Name: stage_productos_subfamilia; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.stage_productos_subfamilia (txntime, target) FROM stdin;
\.


--
-- Data for Name: stage_productos_tipo_precio; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.stage_productos_tipo_precio (txntime, target) FROM stdin;
\.


--
-- Data for Name: track_productos_codigo; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.track_productos_codigo (txntime, target) FROM stdin;
\.


--
-- Data for Name: track_productos_costos_por_sucursal; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.track_productos_costos_por_sucursal (txntime, target) FROM stdin;
\.


--
-- Data for Name: track_productos_familia; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.track_productos_familia (txntime, target) FROM stdin;
\.


--
-- Data for Name: track_productos_precio_por_sucursal; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.track_productos_precio_por_sucursal (txntime, target) FROM stdin;
\.


--
-- Data for Name: track_productos_producto; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.track_productos_producto (txntime, target) FROM stdin;
\.


--
-- Data for Name: track_productos_subfamilia; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.track_productos_subfamilia (txntime, target) FROM stdin;
\.


--
-- Data for Name: track_productos_tipo_precio; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.track_productos_tipo_precio (txntime, target) FROM stdin;
\.


--
-- Data for Name: inicio_sesion; Type: TABLE DATA; Schema: configuraciones; Owner: franco
--

COPY configuraciones.inicio_sesion (id, usuario_id, dispositivo, hora_inicio, hora_fin, creado_en, sucursal_id) FROM stdin;
\.


--
-- Name: inicio_sesion_id_seq; Type: SEQUENCE SET; Schema: configuraciones; Owner: franco
--

SELECT pg_catalog.setval('configuraciones.inicio_sesion_id_seq', 1, false);


--
-- Data for Name: local; Type: TABLE DATA; Schema: configuraciones; Owner: franco
--

COPY configuraciones.local (id, sucursal_id, creado_en, usuario_id, equipo_id) FROM stdin;
1	3	2021-04-20 04:51:33.25005+00	1	1
\.


--
-- Name: local_id_seq; Type: SEQUENCE SET; Schema: configuraciones; Owner: franco
--

SELECT pg_catalog.setval('configuraciones.local_id_seq', 1, true);


--
-- Data for Name: cargo; Type: TABLE DATA; Schema: empresarial; Owner: franco
--

COPY empresarial.cargo (id, nombre, descripcion, supervisado_por_id, sueldo_base, usuario_id, creado_en) FROM stdin;
1	Gerente Sucursal	Gerente de una o mas sucursales	\N	2500000	1	2021-02-13 19:01:47.622029+00
2	Cajero	Cajero	1	2400000	1	2021-02-13 19:02:13.69069+00
\.


--
-- Name: cargo_id_seq; Type: SEQUENCE SET; Schema: empresarial; Owner: franco
--

SELECT pg_catalog.setval('empresarial.cargo_id_seq', 2, true);


--
-- Data for Name: sucursal; Type: TABLE DATA; Schema: empresarial; Owner: franco
--

COPY empresarial.sucursal (id, nombre, localizacion, ciudad_id, usuario_id, creado_en, deposito, deposito_predeterminado, direccion, nro_delivery) FROM stdin;
3	ROTONDA	\N	1	1	2021-04-19 18:55:04.097784+00	t	f	\N	\N
4	INDUSTRIAL	\N	1	1	2021-05-04 18:42:27.039705+00	t	f	\N	\N
5	KM5	\N	1	1	2021-05-04 18:42:27.05715+00	t	f	\N	\N
6	CALLE 10	\N	1	1	2021-05-04 18:42:27.061562+00	t	f	\N	\N
7	KATUETE 1	\N	3	1	2021-05-04 18:45:01.995622+00	t	f	\N	\N
8	PALOMA 1	\N	2	1	2021-05-04 18:45:02.000441+00	t	f	\N	\N
2	ITAIPU	-24.051567, -54.305898	1	1	2021-02-13 19:37:47.164158+00	t	f	\N	\N
9	NUEVA ESPERANZA 1	\N	4	1	2021-05-04 18:45:02.004932+00	t	f	\N	\N
1	CENTRAL	-24.072157, -54.308287	1	1	2021-02-13 19:28:37.4107+00	t	t	Av. Paraguay c/ 30 de julio	0986128000
\.


--
-- Name: sucursal_id_seq; Type: SEQUENCE SET; Schema: empresarial; Owner: franco
--

SELECT pg_catalog.setval('empresarial.sucursal_id_seq', 9, true);


--
-- Data for Name: equipo; Type: TABLE DATA; Schema: equipos; Owner: franco
--

COPY equipos.equipo (id, marca, modelo, costo, descripcion, imagenes, usuario_id, creado_en, tipo_equipo_id) FROM stdin;
1	APPLE	MACBOOK PRO 2019	10800000	LAPTOP DE GRAN DESEMPENO PARA PROGRAMACION 	\N	1	2021-04-20 04:41:31.653125+00	1
\.


--
-- Name: equipo_id_seq; Type: SEQUENCE SET; Schema: equipos; Owner: franco
--

SELECT pg_catalog.setval('equipos.equipo_id_seq', 1, true);


--
-- Data for Name: tipo_equipo; Type: TABLE DATA; Schema: equipos; Owner: franco
--

COPY equipos.tipo_equipo (id, descripcion, usuario_id, creado_en) FROM stdin;
1	INFORMATICOS	1	2021-04-20 04:40:12.498379+00
\.


--
-- Name: tipo_equipo_id_seq; Type: SEQUENCE SET; Schema: equipos; Owner: franco
--

SELECT pg_catalog.setval('equipos.tipo_equipo_id_seq', 1, true);


--
-- Data for Name: banco; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.banco (id, nombre, codigo, usuario_id, creado_en) FROM stdin;
1	VISION BANCO	001	1	2021-10-25 17:45:18.240634+00
\.


--
-- Name: banco_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.banco_id_seq', 1, true);


--
-- Data for Name: cambio; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.cambio (id, moneda_id, valor_en_gs, activo, usuario_id, creado_en) FROM stdin;
1	1	1	t	1	2021-05-31 19:33:15.871604+00
3	3	6800	t	1	2021-05-31 19:33:15.871604+00
4	4	200	t	1	2021-05-31 19:33:15.871604+00
5	2	1100	\N	1	2021-05-31 19:34:22.887556+00
2	2	1000	t	1	2021-05-31 19:33:15.871604+00
6	2	1050	\N	1	2021-10-25 17:31:48.600205+00
\.


--
-- Name: cambio_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.cambio_id_seq', 6, true);


--
-- Data for Name: cuenta_bancaria; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.cuenta_bancaria (id, persona_id, banco_id, moneda_id, numero, usuario_id, creado_en, tipo_cuenta) FROM stdin;
1	1	1	1	800379872	1	2021-10-25 17:45:49.547412+00	CUENTA_CORRIENTE
\.


--
-- Name: cuenta_bancaria_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.cuenta_bancaria_id_seq', 1, true);


--
-- Data for Name: forma_pago; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.forma_pago (id, descripcion, activo, movimiento_caja, cuenta_bancaria_id, autorizacion, creado_en, usuario_id) FROM stdin;
1	EFECTIVO	t	t	\N	f	2021-10-25 17:46:50.327752+00	1
2	TARJETA	t	f	1	f	2021-10-25 17:47:27.783142+00	1
4	TRANSFERENCIA	t	f	1	t	2021-10-25 17:49:29.495563+00	\N
3	CONVENIO	t	f	\N	t	2021-10-25 17:48:46.447436+00	1
\.


--
-- Name: forma_pago_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.forma_pago_id_seq', 4, true);


--
-- Data for Name: moneda; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.moneda (id, denominacion, simbolo, pais_id, usuario_id, creado_en) FROM stdin;
2	REAL	R$	2	1	2021-04-06 17:58:07.307344+00
3	DOLAR	US$	4	1	2021-04-06 17:58:07.312393+00
4	PESO ARG	AR$	3	1	2021-04-06 17:58:07.317816+00
1	GUARANI	Gs.	1	1	2021-04-06 17:53:28.063734+00
\.


--
-- Name: moneda_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.moneda_id_seq', 4, true);


--
-- Data for Name: barrio; Type: TABLE DATA; Schema: general; Owner: franco
--

COPY general.barrio (id, descripcion, ciudad_id, precio_delivery_id, usuario_id, creado_en) FROM stdin;
1	SAN MIGUEL	1	1	1	2021-06-27 22:52:43.875356+00
2	SANTA ROSA	1	1	1	2021-06-27 22:52:43.875356+00
3	SAN FRANCISCO	1	1	1	2021-06-27 22:52:43.875356+00
4	KAREN LUANA	1	2	1	2021-06-27 22:52:43.875356+00
5	CANINDEYU	1	3	1	2021-06-27 22:52:43.875356+00
\.


--
-- Name: barrio_id_seq; Type: SEQUENCE SET; Schema: general; Owner: franco
--

SELECT pg_catalog.setval('general.barrio_id_seq', 5, true);


--
-- Data for Name: ciudad; Type: TABLE DATA; Schema: general; Owner: franco
--

COPY general.ciudad (id, descripcion, pais_id, codigo, usuario_id, creado_en) FROM stdin;
2	PALOMA	1	PES	1	2021-05-04 18:43:32.631414+00
3	KATUETE	1	KTT	1	2021-05-04 18:43:32.646834+00
4	NUEVA ESPERANZA	1	NE	1	2021-05-04 18:43:32.651566+00
1	SALTO DEL GUAIRA	1	SDG	1	2021-02-12 18:07:38.423277+00
\.


--
-- Name: ciudad_id_seq; Type: SEQUENCE SET; Schema: general; Owner: franco
--

SELECT pg_catalog.setval('general.ciudad_id_seq', 4, true);


--
-- Data for Name: contacto; Type: TABLE DATA; Schema: general; Owner: franco
--

COPY general.contacto (id, email, telefono, persona_id, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: contacto_id_seq; Type: SEQUENCE SET; Schema: general; Owner: franco
--

SELECT pg_catalog.setval('general.contacto_id_seq', 1, false);


--
-- Data for Name: pais; Type: TABLE DATA; Schema: general; Owner: franco
--

COPY general.pais (id, descripcion, codigo, usuario_id, creado_en) FROM stdin;
1	Paraguay	PY	1	2021-02-11 02:32:00.421945+00
2	Brasil	BR	1	2021-02-11 02:32:17.712255+00
3	Argentina	ARG	1	2021-02-11 02:32:32.883486+00
4	ESTADOS UNIDOS	US	1	2021-04-06 17:54:00.999685+00
\.


--
-- Name: pais_id_seq; Type: SEQUENCE SET; Schema: general; Owner: franco
--

SELECT pg_catalog.setval('general.pais_id_seq', 4, true);


--
-- Data for Name: compra; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.compra (id, pedido_id, sucursal_id, proveedor_id, contacto_proveedor_id, fecha, nro_nota, fecha_de_entrega, moneda_id, descuento, estado, creado_en, usuario_id, forma_pago_id) FROM stdin;
\.


--
-- Name: compra_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.compra_id_seq', 1, true);


--
-- Data for Name: compra_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.compra_item (id, compra_id, producto_id, cantidad, precio_unitario, descuento_unitario, bonificacion, frio, observacion, estado, creado_en, usuario_id) FROM stdin;
\.


--
-- Name: compra_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.compra_item_id_seq', 1, false);


--
-- Data for Name: delivery; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.delivery (id, venta_id, valor_en_gs, precio_delivery_id, entregador_id, telefono, direccion, cliente_id, forma_pago_id, creado_en, usuario_id, estado, barrio_id, vehiculo_id, vuelto_id) FROM stdin;
42	\N	90000	2	\N	+59587695	\N	\N	\N	\N	1	ABIERTO	4	\N	53
\.


--
-- Name: delivery_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.delivery_id_seq', 42, true);


--
-- Data for Name: entrada; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.entrada (id, responsable_carga_id, tipo_entrada, observacion, creado_en, usuario_id, sucursal_id, activo) FROM stdin;
35	1	COMPRA	\N	2021-11-08 15:14:58.659+00	\N	\N	t
36	4	COMPRA	\N	2021-11-08 18:16:48.755+00	\N	\N	t
40	\N	COMPRA	\N	2021-11-09 03:22:30.627+00	\N	\N	t
41	1	SUCURSAL	\N	2021-11-09 16:58:14.907+00	\N	1	t
44	\N	COMPRA	\N	2021-11-11 16:58:21.353+00	\N	\N	f
45	\N	COMPRA	\N	2021-11-11 16:58:27.21+00	\N	\N	f
46	\N	COMPRA	\N	2021-11-11 16:58:31.157+00	\N	\N	f
47	\N	COMPRA	\N	2021-11-11 16:58:34.58+00	\N	\N	f
48	\N	COMPRA	\N	2021-11-11 16:58:37.795+00	\N	\N	f
49	\N	COMPRA	\N	2021-11-11 16:58:41.027+00	\N	\N	f
50	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
51	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
52	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
53	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
54	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
55	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
56	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
57	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
58	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
59	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
60	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
61	\N	COMPRA	\N	2021-11-11 16:58:43.916+00	\N	\N	f
42	\N	SUCURSAL	\N	2021-11-11 16:56:00+00	\N	1	t
\.


--
-- Name: entrada_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.entrada_id_seq', 62, true);


--
-- Data for Name: entrada_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.entrada_item (id, producto_id, presentacion_id, cantidad, observacion, creado_en, usuario_id, entrada_id) FROM stdin;
29	70	81	20	\N	2021-11-08 15:15:27.247+00	\N	35
30	221	188	10	\N	2021-11-08 18:18:03.017+00	\N	36
31	79	85	25	\N	2021-11-09 03:24:08.585+00	\N	40
34	221	188	30	\N	2021-11-09 03:58:35.944+00	\N	40
35	70	78	1200	\N	2021-11-09 16:58:25.005+00	\N	41
36	221	186	250	\N	2021-11-09 17:21:58.142+00	\N	41
37	79	85	60	\N	2021-11-09 17:25:18.593+00	\N	41
38	83	73	20	\N	2021-11-09 17:26:11.713+00	\N	41
39	18	93	6	\N	2021-11-09 17:28:38.57+00	\N	41
40	205	126	5	\N	2021-11-09 17:30:03.407+00	\N	41
41	221	186	1200	\N	2021-11-11 18:15:41.988+00	\N	42
42	70	78	1200	\N	2021-11-11 19:35:43.404+00	\N	42
43	18	93	10	\N	2021-11-11 19:35:51.764+00	\N	42
44	198	94	10	\N	2021-11-11 19:35:58.987+00	\N	42
45	199	95	10	\N	2021-11-11 19:36:06.475+00	\N	42
46	23	128	100	\N	2021-11-11 19:36:14.852+00	\N	42
\.


--
-- Name: entrada_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.entrada_item_id_seq', 46, true);


--
-- Data for Name: motivo_diferencia_pedido; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.motivo_diferencia_pedido (id, tipo, descripcion, creado_en, usuario_id) FROM stdin;
1	N	CANTIDAD INCORRECTA	2021-04-06 13:59:37.503169+00	1
2	N	PRECIO INCORRECTO	2021-04-06 13:59:52.670459+00	1
3	R	PRODUCTO CON AVERIAS	2021-04-06 14:00:15.924843+00	1
\.


--
-- Name: motivo_diferencia_pedido_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.motivo_diferencia_pedido_id_seq', 3, true);


--
-- Data for Name: movimiento_stock; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.movimiento_stock (id, producto_id, tipo_movimiento, referencia, cantidad, creado_en, usuario_id, estado, sucursal_id) FROM stdin;
32	70	ENTRADA	35	480	2021-11-08 15:15:29.105+00	\N	t	\N
33	221	ENTRADA	36	240	2021-11-08 18:18:42.153+00	\N	t	\N
34	221	SALIDA	4	-48	2021-11-08 18:32:29.515+00	\N	t	\N
35	251	SALIDA	4	-28	2021-11-08 18:32:29.712+00	\N	t	\N
36	79	ENTRADA	40	600	2021-11-09 03:58:52.707+00	\N	t	\N
37	221	ENTRADA	40	720	2021-11-09 03:58:52.744+00	\N	t	\N
38	70	SALIDA	7	-20	2021-11-09 04:03:51.911+00	\N	t	\N
39	70	ENTRADA	41	1200	2021-11-09 17:30:05.582+00	\N	t	\N
40	221	ENTRADA	41	250	2021-11-09 17:30:05.608+00	\N	t	\N
41	79	ENTRADA	41	1440	2021-11-09 17:30:05.623+00	\N	t	\N
42	83	ENTRADA	41	240	2021-11-09 17:30:05.634+00	\N	t	\N
43	18	ENTRADA	41	6	2021-11-09 17:30:05.645+00	\N	t	\N
44	205	ENTRADA	41	10	2021-11-09 17:30:05.66+00	\N	t	\N
45	221	ENTRADA	42	1200	2021-11-11 19:36:17.648+00	\N	t	\N
46	70	ENTRADA	42	1200	2021-11-11 19:36:17.68+00	\N	t	\N
47	18	ENTRADA	42	10	2021-11-11 19:36:17.689+00	\N	t	\N
48	198	ENTRADA	42	10	2021-11-11 19:36:17.697+00	\N	t	\N
49	199	ENTRADA	42	10	2021-11-11 19:36:17.705+00	\N	t	\N
50	23	ENTRADA	42	100	2021-11-11 19:36:17.716+00	\N	t	\N
\.


--
-- Name: movimiento_stock_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.movimiento_stock_id_seq', 50, true);


--
-- Data for Name: necesidad; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.necesidad (id, sucursal_id, fecha, estado, creado_en, usuario_id) FROM stdin;
1	1	2021-03-09 23:14:34.231658+00	ACTIVO	2021-03-09 23:14:34.231658+00	1
2	2	2021-03-18 04:30:50.796925+00	ACTIVO	2021-03-18 04:30:50.796925+00	1
3	1	2021-03-11 04:30:50+00	ACTIVO	2021-03-18 05:11:54.290307+00	1
\.


--
-- Name: necesidad_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.necesidad_id_seq', 3, true);


--
-- Data for Name: necesidad_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.necesidad_item (id, autogenerado, cantidad_sugerida, modificado, necesidad_id, producto_id, cantidad, observacion, estado, creado_en, usuario_id, frio) FROM stdin;
\.


--
-- Name: necesidad_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.necesidad_item_id_seq', 2, true);


--
-- Data for Name: nota_pedido; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.nota_pedido (id, pedido_id, nro_nota, creado_en, usuario_id) FROM stdin;
\.


--
-- Name: nota_pedido_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.nota_pedido_id_seq', 2, true);


--
-- Data for Name: pedido; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.pedido (id, necesidad_id, proveedor_id, vendedor_id, fecha_de_entrega, dias_cheque, moneda_id, descuento, estado, creado_en, usuario_id, cantidad_notas, cod_interno_proveedor, forma_pago_id) FROM stdin;
\.


--
-- Name: pedido_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.pedido_id_seq', 54, true);


--
-- Data for Name: pedido_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.pedido_item (id, pedido_id, producto_id, precio_unitario, descuento_unitario, bonificacion, frio, observacion, estado, creado_en, usuario_id, nota_pedido_id, bonificacion_detalle, vencimiento) FROM stdin;
\.


--
-- Name: pedido_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.pedido_item_id_seq', 17, true);


--
-- Data for Name: pedido_item_sucursal; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.pedido_item_sucursal (id, pedido_item_id, sucursal_id, sucursal_entrega_id, cantidad, creado_en, usuario_id) FROM stdin;
\.


--
-- Name: pedido_item_sucursal_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.pedido_item_sucursal_id_seq', 24, true);


--
-- Data for Name: precio_delivery; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.precio_delivery (id, descripcion, valor, activo, creado_en, usuario_id) FROM stdin;
1	CENTRO	5000	t	2021-06-27 22:51:04.086707+00	1
2	KM2	10000	t	2021-06-27 22:51:21.947807+00	1
3	KM5	15000	t	2021-06-27 22:51:21.947807+00	1
4	KM7	20000	t	2021-06-27 22:51:21.947807+00	1
\.


--
-- Name: precio_delivery_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.precio_delivery_id_seq', 4, true);


--
-- Data for Name: salida; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.salida (id, responsable_carga_id, tipo_salida, sucursal_id, observacion, creado_en, usuario_id, activo) FROM stdin;
4	1	SUCURSAL	1	\N	2021-11-08 15:20:00+00	\N	t
7	\N	SUCURSAL	\N	\N	2021-11-09 04:01:30.598+00	\N	t
10	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
11	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
12	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
13	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
14	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
15	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
16	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
17	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
18	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
19	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
20	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
21	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
22	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
23	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
24	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
25	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
26	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
27	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
28	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
29	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
30	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
31	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
32	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
33	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
34	\N	SUCURSAL	\N	\N	2021-11-11 17:33:13.69+00	\N	f
8	\N	SUCURSAL	1	\N	2021-11-11 17:33:00+00	\N	f
\.


--
-- Name: salida_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.salida_id_seq', 34, true);


--
-- Data for Name: salida_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.salida_item (id, producto_id, presentacion_id, cantidad, observacion, creado_en, usuario_id, salida_id) FROM stdin;
14	221	186	48	\N	2021-11-08 18:28:15.222+00	\N	4
13	251	367	28	\N	2021-11-08 18:20:00+00	\N	4
15	70	78	20	\N	2021-11-09 04:03:44.476+00	\N	7
\.


--
-- Name: salida_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.salida_item_id_seq', 15, true);


--
-- Data for Name: venta; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.venta (id, cliente_id, creado_en, usuario_id, estado, total_gs, tota_rs, total_ds, forma_pago_id) FROM stdin;
\.


--
-- Name: venta_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.venta_id_seq', 1, true);


--
-- Data for Name: venta_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.venta_item (id, venta_id, unidad_medida, precio_unitario, costo_unitario, existencia, producto_id, cantidad, creado_en, usuario_id, descuento_unitario) FROM stdin;
\.


--
-- Name: venta_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.venta_item_id_seq', 3, true);


--
-- Data for Name: vuelto; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.vuelto (id, autorizado_por_id, responsable_id, creado_en, usuario_id, activo) FROM stdin;
53	\N	\N	\N	\N	t
\.


--
-- Name: vuelto_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.vuelto_id_seq', 53, true);


--
-- Data for Name: vuelto_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.vuelto_item (id, vuelto_id, valor, moneda_id, creado_en, usuario_id) FROM stdin;
37	53	10000	1	\N	\N
\.


--
-- Name: vuelto_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.vuelto_item_id_seq', 37, true);


--
-- Data for Name: cliente; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.cliente (id, persona_id, credito, usuario_id, creado_en) FROM stdin;
1	3	2000000	1	2021-06-09 18:42:22.816949+00
\.


--
-- Name: cliente_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.cliente_id_seq', 1, true);


--
-- Data for Name: funcionario; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.funcionario (id, persona_id, cargo_id, credito, fecha_ingreso, sueldo, sector, supervisado_por_id, sucursal_id, fase_prueba, diarista, usuario_id, creado_en) FROM stdin;
1	1	1	1000000	2019-02-11 00:00:00	2250000	\N	1	1	t	f	1	2021-02-17 15:20:29+00
\.


--
-- Name: funcionario_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.funcionario_id_seq', 1, true);


--
-- Data for Name: persona; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.persona (id, nombre, apodo, documento, nacimiento, sexo, direccion, ciudad_id, telefono, social_media, imagenes, creado_en, usuario_id, email) FROM stdin;
3	CAMPOS S.A.	\N	800345-4	\N	\N	\N	\N	\N	\N	\N	2021-03-10 03:18:03.86199+00	1	\N
4	ANTONIO NUNES	\N	423423	\N	\N	\N	\N	\N	\N	\N	2021-03-10 03:18:27.730262+00	1	\N
5	LA CAOBA	\N	80025323	\N	\N	\N	\N	\N	\N	\N	2021-04-08 23:42:32.711355+00	1	\N
1	GABRIEL	\N	\N	\N	\N	\N	\N	\N	\N	\N	2021-02-05 03:33:37.702804+00	\N	\N
2	CAMILA	cami	2343	\N	\N	\N	\N	\N	\N	\N	\N	1	\N
6	ARTHUR	ARTHUR	\N	\N	\N	\N	\N	\N	\N	\N	2021-09-02 15:27:38.693365+00	1	\N
7	IGOR 	IGOR	\N	\N	\N	\N	\N	\N	\N	\N	2021-09-02 15:27:57.389437+00	\N	\N
\.


--
-- Name: persona_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.persona_id_seq', 7, true);


--
-- Data for Name: proveedor; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.proveedor (id, persona_id, credito, tipo_credito, cheque_dias, datos_bancarios_id, usuario_id, creado_en, funcionario_encargado_id) FROM stdin;
1	3	t	\N	7	\N	1	2021-03-10 03:19:37.645568+00	1
2	5	t	\N	30	\N	1	2021-04-08 23:43:43.015789+00	\N
\.


--
-- Data for Name: proveedor_dias_visita; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.proveedor_dias_visita (id, proveedor_id, dia, hora, observacion, usuario_id, creado_en) FROM stdin;
1	1	MARTES	\N		1	2021-03-10 15:45:41.00943+00
2	1	JEUVES	\N	\N	1	2021-03-10 15:45:50.21657+00
\.


--
-- Name: proveedor_dias_visita_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.proveedor_dias_visita_id_seq', 2, true);


--
-- Name: proveedor_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.proveedor_id_seq', 2, true);


--
-- Data for Name: role; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.role (id, nombre, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.role_id_seq', 1, false);


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.usuario (id, persona_id, password, usuario_id, creado_en, nickname, email, activo) FROM stdin;
2	2	123	1	2021-02-12 19:32:06.788069+00	cami	\N	t
1	1	123	1	2021-10-04 14:20:00+00	gabo	\N	t
3	6	123	1	2021-09-02 15:28:54.942723+00	arthur	\N	t
4	7	123	1	2021-09-02 15:29:07.905601+00	igor	\N	t
\.


--
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.usuario_id_seq', 4, true);


--
-- Data for Name: usuario_role; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.usuario_role (id, role_id, user_id, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: usuario_role_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.usuario_role_id_seq', 1, false);


--
-- Data for Name: vendedor; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.vendedor (id, persona_id, activo, observacion, usuario_id, creado_en) FROM stdin;
1	4	t	\N	1	2021-03-10 15:07:33.49465+00
2	2	t	\N	1	2021-04-08 23:43:13.583188+00
\.


--
-- Name: vendedor_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.vendedor_id_seq', 1, true);


--
-- Data for Name: vendedor_proveedor; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.vendedor_proveedor (id, vendedor_id, proveedor_id, activo, usuario_id, creado_en) FROM stdin;
1	1	1	t	1	2021-03-10 15:45:06.610113+00
3	2	2	t	1	2021-04-09 02:20:18.177178+00
4	2	1	t	1	2021-04-09 02:20:32.379631+00
\.


--
-- Name: vendedor_proveedor_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.vendedor_proveedor_id_seq', 4, true);


--
-- Data for Name: codigo; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.codigo (id, codigo, principal, usuario_id, creado_en, activo, presentacion_id) FROM stdin;
392	702345702938759345	t	1	\N	t	31
393	543523464563456	\N	1	\N	t	32
394	3423453244534	t	1	\N	t	32
428	8712000030582	t	4	\N	t	72
429	8712000030810	t	4	\N	t	73
430	8712000030599	t	4	\N	t	78
432	8712000033545	t	4	\N	t	79
433	8712000033583	t	4	\N	t	81
434	072890000224	t	4	\N	t	83
435	8712000030605	t	4	\N	t	84
436	8712000030728	t	4	\N	t	85
437	7804300120276	t	3	\N	t	68
438	7804300003227	\N	3	\N	t	68
441	7896045506040	t	4	\N	t	86
442	7896045506057	t	4	\N	t	87
443	7804300149314	t	3	\N	t	88
444	7804300149307	t	3	\N	t	91
445	7804300149994	t	3	\N	t	93
446	7804300003234	t	3	\N	t	94
447	7804300123512	t	3	\N	t	95
448	7804300121846	t	3	\N	t	98
449	7891149104932	t	4	\N	t	99
490	03402119	t	4	\N	t	162
450	7891149104949	\N	4	\N	t	100
451	7840050002561	t	4	\N	t	101
453	6543634563463546	t	2	\N	t	33
454	7840050003735	t	4	\N	t	103
457	78400030	t	4	\N	t	105
458	78410848	t	4	\N	t	107
459	7840050002493	t	4	\N	t	109
460	7891149000142	t	4	\N	t	111
461	7891991295314	t	4	\N	t	113
462	87120103	t	4	\N	t	121
463	8712000033538	t	4	\N	t	122
465	8712000025649	t	4	\N	t	125
466	7840050007399	t	4	\N	t	82
467	7840050002783	t	4	\N	t	70
468	7804300120559	t	3	\N	t	128
469	7804300120252	t	3	\N	t	129
471	7804300010263	t	3	\N	t	132
472	7804300011512	\N	3	\N	t	132
470	78409613	t	4	\N	t	130
473	7840050007511	t	4	\N	t	133
474	7840050006385	t	4	\N	t	135
475	7840025110857	t	4	\N	t	137
476	7840025110871	t	4	\N	t	138
477	7898295301437	t	4	\N	t	139
478	03456916	t	4	\N	t	141
479	034100005696	\N	4	\N	t	142
480	7804300120566	t	3	\N	t	143
481	7804300120467	t	3	\N	t	146
482	03456217	t	4	\N	t	145
483	034100175054	t	4	\N	t	148
484	034100001568	t	4	\N	t	150
485	034100005528	t	4	\N	t	153
486	7804300127312	t	3	\N	t	156
487	7804300127305	\N	3	\N	t	156
488	034100005542	t	4	\N	t	157
489	03402313	t	4	\N	t	159
491	7986045504879	t	4	\N	t	177
492	7986045505098	t	4	\N	t	178
493	7896045506255	t	4	\N	t	179
495	7840050002769	t	4	\N	t	183
496	8712000056445	t	4	\N	t	184
497	8712000055264	t	4	\N	t	186
498	8712000055400	t	4	\N	t	189
499	7896045504831	t	4	\N	t	192
500	7896045504848	t	4	\N	t	193
501	7792798006045	t	4	\N	t	194
502	5410228143376	t	4	\N	t	197
503	5410228240945	t	4	\N	t	199
504	7840050006644	t	4	\N	t	202
505	7891149103102	t	4	\N	t	204
506	7891149103119	t	4	\N	t	205
507	7891149107704	t	4	\N	t	206
508	7891149108923	t	4	\N	t	209
509	7891149104468	t	4	\N	t	213
510	78906709	t	4	\N	t	215
511	7897395040246	t	4	\N	t	217
512	7897395040307	t	4	\N	t	220
513	7898295300935	t	4	\N	t	222
514	7898295301475	t	4	\N	t	223
515	7898295300867	t	4	\N	t	224
516	7898295301338	t	4	\N	t	225
517	7898295300843	t	4	\N	t	226
518	7898295300409	t	4	\N	t	228
519	7898295300119	t	4	\N	t	230
520	7840050002523	t	4	\N	t	232
521	7840050002530	t	4	\N	t	233
522	7840050006200	t	4	\N	t	235
523	7840050003700	t	4	\N	t	238
524	7840050003087	t	4	\N	t	240
525	7891991014786	t	4	\N	t	242
526	7840050003803	t	4	\N	t	244
527	7840050003827	t	4	\N	t	245
528	78404533	t	4	\N	t	246
529	7840050002639	t	4	\N	t	248
530	78409736	t	4	\N	t	250
531	7898367983790	t	4	\N	t	252
532	7898367984018	t	4	\N	t	253
533	7898367890010	t	4	\N	t	254
534	7898367980058	t	4	\N	t	255
535	7898637983615	t	4	\N	t	257
536	789836798070	t	4	\N	t	259
537	78983667984056	t	4	\N	t	261
538	7840025110864	t	4	\N	t	263
539	7840025110994	t	4	\N	t	265
540	7840025110710	t	4	\N	t	267
541	7840025110734	t	4	\N	t	268
542	7840025110796	t	4	\N	t	269
543	8412598002304	t	4	\N	t	341
544	8412598005893	t	4	\N	t	342
545	8412598005398	t	4	\N	t	343
546	8412598001659	t	4	\N	t	345
547	7898953990140	t	4	\N	t	347
548	8412598074219	t	4	\N	t	349
549	7897736409800	t	4	\N	t	351
550	7897736409817	t	4	\N	t	354
551	7897736409824	t	4	\N	t	357
552	7897736409831	t	4	\N	t	363
553	7897736409848	t	4	\N	t	364
554	7983218000107	t	4	\N	t	367
555	7983218000251	t	4	\N	t	368
556	7983218003603	\N	4	\N	t	367
557	9002490100070	\N	4	\N	t	370
558	611269991000	\N	4	\N	t	370
559	9002490214166	t	4	\N	t	372
560	9002490240875	t	4	\N	t	374
561	9002490241179	t	4	\N	t	375
562	9002490229160	t	4	\N	t	377
563	9002490248949	\N	4	\N	t	377
564	9002490235192	t	4	\N	t	380
565	9002490235208	t	4	\N	t	381
566	9002490247379	t	4	\N	t	383
\.


--
-- Name: codigo_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.codigo_id_seq', 566, true);


--
-- Data for Name: codigo_tipo_precio; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.codigo_tipo_precio (id, codigo_id, tipo_precio_id, creado_en, usuario_id) FROM stdin;
\.


--
-- Name: codigo_tipo_precio_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.codigo_tipo_precio_id_seq', 1, false);


--
-- Data for Name: costos_por_sucursal; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.costos_por_sucursal (id, producto_id, sucursal_id, ultimo_precio_compra, ultimo_precio_venta, costo_medio, usuario_id, creado_en, existencia, movimiento_stock_id, moneda_id) FROM stdin;
\.


--
-- Name: costos_por_sucursal_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.costos_por_sucursal_id_seq', 5, true);


--
-- Data for Name: familia; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.familia (id, descripcion, activo, usuario_id, creado_en, icono, nombre, posicion) FROM stdin;
1	Cervezas, gaseosas, lacteos, jugos, aguas, energizantes, vinos, espumantes, whiskys, vodkas, cachaças, licores.	t	1	2021-03-10 00:48:20.816224+00	liquor	BEBIDAS	1
6	PRODUCTOS QUE SON ELABORADOS A PARTIR DE INSUMOS U OTROS PRODUCTOS. EJEMPLO: UNA PIZZA.	t	\N	\N	add_circle_outline	ELABORADOS	6
7	CIGARRILLOS TRADICIONALES, ELECTRICOS, NARGUILE, ESCENCIAS, CARBON PARA NARGUILE.	t	\N	\N	album	CIGARRILLOS	5
2	PRODUCTOS DE LIMPIEZA, MEDICAMENTOS, ROPAS Y ACCESORIOS, ELECTRONICOS, FERRETERIA, CASA Y CAMPING.\n	t	\N	\N	liquor	GENERAL	2
5	ALGUNA DESCRIPCION LO QUE SEA COMESTIBLE TIPO PAN JAMON QUESO CARNICOS ERE EREA	t	\N	\N	block	COMESTIBLES	3
\.


--
-- Name: familia_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.familia_id_seq', 9, true);


--
-- Name: imagenes_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.imagenes_id_seq', 2, true);


--
-- Data for Name: pdv_categoria; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.pdv_categoria (id, descripcion, activo, usuario_id, creado_en) FROM stdin;
1	TODOS	t	1	2021-05-21 17:53:11.781589+00
2	CERVEZAS	t	1	2021-05-21 17:53:23.894113+00
3	GASEOSAS	t	1	2021-05-21 17:53:33.339846+00
\.


--
-- Name: pdv_categoria_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.pdv_categoria_id_seq', 3, true);


--
-- Data for Name: pdv_grupo; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.pdv_grupo (id, descripcion, activo, usuario_id, creado_en, categoria_id) FROM stdin;
7	HEINEKEN	t	1	2021-10-07 00:55:18.733732+00	2
8	PILSEN PURO MALTE	t	1	2021-10-07 19:06:47.794427+00	2
\.


--
-- Name: pdv_grupo_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.pdv_grupo_id_seq', 8, true);


--
-- Data for Name: pdv_grupos_productos; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.pdv_grupos_productos (id, producto_id, grupo_id, activo, usuario_id, creado_en) FROM stdin;
3	83	7	t	1	2021-10-06 21:55:40
4	70	7	t	1	2021-10-06 23:15:34
5	1	8	t	1	2021-10-07 16:07:09
\.


--
-- Name: pdv_grupos_productos_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.pdv_grupos_productos_id_seq', 5, true);


--
-- Data for Name: precio_por_sucursal; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.precio_por_sucursal (id, sucursal_id, precio, usuario_id, creado_en, presentacion_id, tipo_precio_id, principal, activo) FROM stdin;
420	1	43000	4	\N	136	2	t	t
421	1	40000	4	\N	136	3	t	t
422	1	2000	4	\N	137	1	t	t
313	1	5000	1	\N	31	1	t	t
314	1	50000	1	\N	32	2	t	t
315	1	4500	1	\N	31	4	f	t
316	1	5000	1	\N	34	1	t	t
350	1	13000	4	\N	72	1	t	t
351	1	145000	4	\N	73	2	t	t
352	1	6000	4	\N	78	1	t	t
353	1	30000	4	\N	78	2	t	t
354	1	30000	4	\N	79	2	t	t
355	1	120000	4	\N	81	2	t	t
356	1	7000	4	\N	83	1	t	t
357	1	38000	4	\N	84	2	t	t
358	1	36000	4	\N	84	3	t	t
359	1	152000	4	\N	85	2	t	t
360	1	144000	4	\N	85	3	t	t
366	1	23000	3	\N	68	1	t	t
367	1	7000	4	\N	86	1	t	t
368	1	40000	4	\N	87	2	t	t
369	1	160000	4	\N	90	2	t	t
370	1	45000	3	\N	88	1	t	t
372	1	240000	3	\N	89	3	t	t
373	1	22000	3	\N	91	1	t	t
374	1	250000	3	\N	92	3	t	t
375	1	25000	3	\N	93	1	t	t
376	1	25000	3	\N	94	1	t	t
377	1	25000	3	\N	95	1	t	t
378	1	24000	3	\N	98	1	t	t
379	1	140000	2	\N	73	3	f	t
380	1	5000	4	\N	99	1	t	t
381	1	50000	4	\N	100	2	t	t
382	1	48000	4	\N	100	3	t	t
383	1	2500	4	\N	101	1	t	t
384	1	28000	4	\N	102	2	t	t
385	1	250000	2	\N	33	2	t	t
386	1	2000	4	\N	103	1	t	t
387	1	48000	4	\N	104	2	t	t
388	1	6000	4	\N	105	1	t	t
389	1	72000	4	\N	106	2	t	t
390	1	70000	4	\N	106	3	t	t
391	1	2500	4	\N	107	1	t	t
392	1	60000	4	\N	108	2	t	t
393	1	2500	4	\N	109	1	t	t
394	1	26000	4	\N	110	2	t	t
395	1	95000	4	\N	112	2	t	t
396	1	8000	4	\N	111	1	t	t
397	1	5000	4	\N	113	1	t	t
398	1	28000	4	\N	116	2	t	t
399	1	112000	4	\N	117	2	t	t
401	1	5000	4	\N	121	1	t	t
402	1	25000	4	\N	122	2	t	t
403	1	100000	4	\N	123	2	t	t
405	1	85000	4	\N	125	1	t	t
406	1	170000	4	\N	126	2	t	t
407	1	4000	4	\N	82	1	t	t
408	1	48000	4	\N	127	2	t	t
409	1	2500	4	\N	70	2	t	t
410	1	58000	4	\N	71	2	t	t
411	1	48000	3	\N	128	1	t	t
412	1	23000	3	\N	129	1	t	t
413	1	6000	4	\N	130	1	t	t
414	1	60000	3	\N	132	1	t	t
415	1	72000	4	\N	131	2	t	t
416	1	7500	4	\N	133	1	t	t
417	1	88000	4	\N	134	2	t	t
418	1	86000	4	\N	134	3	t	t
419	1	4000	4	\N	135	1	t	t
423	1	24000	4	\N	138	2	t	t
424	1	22000	4	\N	138	3	f	t
425	1	3000	4	\N	139	1	t	t
426	1	32000	4	\N	140	2	t	t
427	1	30000	4	\N	140	3	f	t
428	1	12000	4	\N	141	1	t	t
429	1	170000	4	\N	142	2	t	t
430	1	168000	4	\N	142	3	f	t
431	1	45000	3	\N	143	1	t	t
432	1	240000	3	\N	144	3	t	t
433	1	23000	3	\N	146	1	t	t
434	1	260000	3	\N	147	3	f	t
436	1	48000	4	\N	148	2	t	t
435	1	8000	4	\N	145	1	t	t
437	1	192000	4	\N	149	2	t	t
438	1	4000	4	\N	150	1	t	t
439	1	20000	4	\N	151	2	t	t
440	1	19000	4	\N	151	3	t	t
441	1	80000	4	\N	152	2	t	t
442	1	76000	4	\N	152	3	t	t
443	1	90000	3	\N	156	1	t	t
444	1	5000	4	\N	153	1	t	t
445	1	28000	4	\N	154	2	t	t
446	1	112000	4	\N	155	2	t	t
447	1	5000	4	\N	157	1	t	t
448	1	60000	4	\N	158	2	t	t
449	1	13000	4	\N	159	1	t	t
450	1	175000	4	\N	160	1	t	t
451	1	7500	4	\N	162	\N	f	t
452	1	7500	4	\N	162	\N	t	t
453	1	45000	4	\N	175	2	t	t
454	1	44000	4	\N	175	3	t	t
455	1	180000	4	\N	176	2	t	t
456	1	176000	4	\N	176	3	t	t
457	1	2500	4	\N	177	1	t	t
458	1	26000	4	\N	178	2	t	t
459	1	2000	4	\N	179	1	t	t
460	1	23000	4	\N	180	2	t	t
461	1	22000	4	\N	180	3	t	t
462	1	1500	4	\N	183	1	t	t
463	1	15000	4	\N	182	2	t	t
464	1	12000	4	\N	184	1	t	t
465	1	130000	4	\N	185	2	t	t
466	1	7000	4	\N	186	1	t	t
467	1	38000	4	\N	187	2	t	t
468	1	152000	4	\N	188	2	t	t
469	1	4000	4	\N	189	1	t	t
470	1	23000	4	\N	190	2	t	t
471	1	22000	4	\N	190	3	t	t
472	1	92000	4	\N	191	2	t	t
473	1	88000	4	\N	191	3	t	t
474	1	5000	4	\N	192	1	t	t
475	1	55000	4	\N	193	2	t	t
476	1	53000	4	\N	193	3	t	t
477	1	7000	4	\N	194	1	t	t
478	1	37000	4	\N	195	2	t	t
479	1	34000	4	\N	195	3	t	t
480	1	148000	4	\N	196	2	t	t
481	1	136000	4	\N	196	3	t	t
482	1	10000	4	\N	197	1	t	t
483	1	120000	4	\N	198	2	t	t
484	1	112000	4	\N	198	3	t	t
485	1	6000	4	\N	199	1	t	t
486	1	32000	4	\N	200	2	t	t
487	1	128000	4	\N	201	2	t	t
488	1	7500	4	\N	202	\N	t	t
493	1	88000	4	\N	203	2	t	t
494	1	86000	4	\N	203	3	t	t
495	1	4000	4	\N	204	1	t	t
496	1	50000	4	\N	205	2	t	t
497	1	5000	4	\N	206	1	t	t
498	1	30000	4	\N	207	2	t	t
499	1	120000	4	\N	208	2	t	t
500	1	5000	4	\N	209	2	t	t
501	1	28000	4	\N	210	2	t	t
502	1	26500	4	\N	210	3	t	t
503	1	112000	4	\N	211	2	t	t
504	1	106000	4	\N	211	3	t	t
505	1	4000	4	\N	213	1	t	t
506	1	48000	4	\N	214	2	t	t
507	1	6000	4	\N	215	1	t	t
508	1	140000	4	\N	216	2	t	t
509	1	3000	4	\N	217	1	t	t
510	1	17000	4	\N	218	2	t	t
511	1	68000	4	\N	219	2	t	t
512	1	30000	4	\N	221	2	t	t
513	1	3000	4	\N	220	1	t	t
514	1	3000	4	\N	222	1	t	t
515	1	33000	4	\N	223	2	t	t
516	1	3500	4	\N	224	1	t	t
517	1	38000	4	\N	225	2	t	t
518	1	36000	4	\N	225	3	t	t
520	1	5000	4	\N	226	1	t	t
521	1	115000	4	\N	227	2	t	t
522	1	2500	4	\N	228	1	t	t
523	1	25000	4	\N	229	2	t	t
524	1	6000	4	\N	230	1	t	t
525	1	130000	4	\N	231	2	t	t
526	1	125000	4	\N	231	3	t	t
527	1	7000	4	\N	232	1	t	t
528	1	40000	4	\N	233	2	t	t
529	1	160000	4	\N	234	2	t	t
530	1	10000	4	\N	235	1	t	t
531	1	60000	4	\N	236	2	t	t
532	1	4000	4	\N	238	1	t	t
533	1	46000	4	\N	239	2	t	t
534	1	3000	4	\N	240	1	t	t
535	1	65000	4	\N	241	2	t	t
536	1	6500	4	\N	242	\N	t	t
537	1	76000	4	\N	243	2	t	t
538	1	75000	4	\N	243	3	t	t
539	1	3500	4	\N	244	1	t	t
540	1	40000	4	\N	245	2	t	t
541	1	4000	4	\N	246	1	t	t
542	1	48000	4	\N	247	2	t	t
543	1	45000	4	\N	247	3	t	t
544	1	4000	4	\N	248	1	t	t
545	1	38000	4	\N	249	2	t	t
546	1	36000	4	\N	249	3	t	t
547	1	6000	4	\N	250	1	t	t
548	1	72000	4	\N	251	2	t	t
549	1	70000	4	\N	251	3	t	t
550	1	4000	4	\N	252	1	t	t
551	1	43000	4	\N	253	2	t	t
552	1	4000	4	\N	254	1	t	t
553	1	22000	4	\N	255	2	t	t
554	1	44000	4	\N	256	2	t	t
555	1	10000	4	\N	257	1	t	t
556	1	58000	4	\N	258	2	t	t
610	1	7500	4	\N	367	1	t	t
557	1	56000	2	\N	258	3	t	t
558	1	5000	4	\N	259	1	t	t
559	1	60000	4	\N	260	2	t	t
560	1	55000	4	\N	260	3	f	t
561	1	5000	4	\N	261	1	t	t
562	1	60000	4	\N	262	2	t	t
563	1	55000	4	\N	262	3	f	t
564	1	6000	4	\N	263	1	t	t
565	1	65000	4	\N	264	2	t	t
566	1	2500	4	\N	265	1	t	t
567	1	25000	4	\N	266	2	t	t
568	1	3000	4	\N	267	1	t	t
569	1	33000	4	\N	268	2	t	t
570	1	32000	4	\N	268	3	f	t
571	1	2500	4	\N	269	1	t	t
572	1	24000	4	\N	270	2	t	t
573	1	10000	4	\N	341	1	t	t
574	1	56000	4	\N	342	2	t	t
575	1	52000	4	\N	342	3	f	t
576	1	10000	4	\N	343	1	t	t
577	1	58000	4	\N	344	2	t	t
579	1	7000	4	\N	345	1	t	t
580	1	42000	4	\N	346	2	t	t
581	1	6000	4	\N	347	1	t	t
582	1	60000	4	\N	348	2	t	t
583	1	8000	4	\N	349	1	t	t
584	1	32000	4	\N	350	2	t	t
585	1	5000	4	\N	351	1	t	t
586	1	30000	4	\N	352	2	t	t
587	1	27000	4	\N	352	3	f	t
588	1	120000	4	\N	353	2	t	t
589	1	108000	4	\N	353	3	f	t
590	1	5000	4	\N	354	1	t	t
591	1	30000	4	\N	355	2	t	t
592	1	27000	4	\N	355	3	f	t
593	1	120000	4	\N	356	2	t	t
594	1	108000	4	\N	356	3	f	t
595	1	5000	4	\N	357	1	t	t
596	1	30000	4	\N	358	2	t	t
597	1	27000	4	\N	358	3	f	t
598	1	120000	4	\N	359	2	t	t
599	1	108000	4	\N	359	3	f	t
600	1	5000	4	\N	363	1	t	t
601	1	120000	4	\N	362	2	t	t
602	1	108000	4	\N	362	3	f	t
603	1	30000	4	\N	361	2	t	t
604	1	27000	4	\N	361	3	f	t
605	1	5000	4	\N	364	1	t	t
606	1	30000	4	\N	365	2	t	t
607	1	27000	4	\N	365	3	f	t
608	1	120000	4	\N	366	2	t	t
609	1	108000	4	\N	366	3	f	t
611	1	45000	4	\N	368	2	t	t
612	1	180000	4	\N	369	2	t	t
613	1	10000	4	\N	370	1	t	t
614	1	210000	4	\N	371	2	t	t
615	1	205000	4	\N	371	3	f	t
616	1	20000	4	\N	372	1	t	t
617	1	200000	4	\N	373	2	t	t
618	1	12000	4	\N	374	1	t	t
619	1	48000	4	\N	375	2	t	t
620	1	260000	4	\N	376	2	t	t
621	1	12000	4	\N	377	1	t	t
622	1	48000	4	\N	378	2	t	t
623	1	260000	4	\N	379	2	t	t
624	1	12000	4	\N	380	1	t	t
625	1	48000	4	\N	381	2	t	t
626	1	260000	4	\N	382	2	t	t
627	1	12000	4	\N	383	1	t	t
628	1	48000	4	\N	384	2	t	t
629	1	260000	4	\N	385	2	t	t
\.


--
-- Name: precio_por_sucursal_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.precio_por_sucursal_id_seq', 629, true);


--
-- Data for Name: presentacion; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.presentacion (id, producto_id, cantidad, descripcion, principal, activo, tipo_presentacion_id, usuario_id, creado_en) FROM stdin;
99	14	1	unidad	t	t	1	4	\N
100	14	12	pack x 12 unidad	f	t	4	4	\N
101	7	1	unidad	t	t	1	4	\N
102	7	12	pack x 12 unidad	f	t	4	4	\N
103	9	1	unidad	t	t	1	4	\N
104	9	24	caja x 24 unidad	f	t	2	4	\N
105	153	1	unidad	t	t	1	4	\N
106	153	12	CAJA X 12 UNIDAD	f	t	2	4	\N
107	12	1	unidad	t	t	1	4	\N
108	12	24	caja x 24 unidad	f	t	2	4	\N
109	11	1	unidad	t	t	1	4	\N
110	11	12	caja x 12 unidad	f	t	4	4	\N
111	21	1	unidad	t	t	1	4	\N
112	21	12	caja x 12 unidad	f	t	2	4	\N
113	17	1	unidad	t	t	1	4	\N
115	80	1	test presentacion	t	t	1	2	\N
116	17	6	pack x 6 unidad	f	t	4	4	\N
117	17	24	caja x 24 unidad	f	t	2	4	\N
118	80	12	test 2	f	t	2	2	\N
119	80	24	test 3	f	t	3	2	\N
31	160	1	unidad	t	t	1	1	\N
32	160	6	caja x 6	f	t	2	1	\N
33	160	24	CAJA X 24	f	t	2	1	\N
34	162	1	1	t	t	1	1	\N
68	13	1	unidad	t	t	1	3	\N
70	26	1	unidad	t	t	1	4	\N
71	26	24	caja x 24 unidad	f	t	2	4	\N
72	83	1	unidad	t	t	1	4	\N
73	83	12	caja x 12 unidad	f	t	2	4	\N
78	70	1	unidad	t	t	1	1	\N
79	70	6	pack x 6 unidad	f	t	4	4	\N
81	70	24	caja x 24 unidad	f	t	2	4	\N
82	1	1	unidad	t	t	1	1	\N
83	79	1	unidAD	t	t	1	4	\N
84	79	6	pack x 6 unidad	f	t	4	4	\N
85	79	24	caja x 24 unidad	f	t	2	4	\N
86	87	1	unidad	t	t	1	4	\N
87	87	6	pack x 6 unidad	f	t	4	4	\N
88	15	1	unitario	t	t	1	3	\N
89	15	6	caja x 6 unid	f	t	2	3	\N
90	87	24	CAJA X 24 UNIDAD	f	t	2	4	\N
91	16	1	unitario	t	t	1	3	\N
92	16	12	caja x 12 unid	f	t	2	3	\N
93	18	1	unitario	t	t	1	3	\N
94	198	1	unitario	t	t	1	3	\N
95	199	1	unitario	t	t	1	3	\N
98	201	1	unitario	t	t	1	3	\N
120	80	10	test 4	f	t	4	2	\N
121	204	1	unidad	t	t	1	4	\N
122	204	6	pack x 6 unidad	f	t	4	4	\N
123	204	24	caja x 24 unidad	f	t	2	4	\N
125	205	1	unidad	t	t	1	4	\N
126	205	2	pack x 2 unidad	f	t	2	4	\N
127	1	12	pack x 12 unidad	f	t	4	4	\N
128	23	1	unitario	t	t	1	3	\N
129	24	1	unitario	t	t	1	3	\N
130	27	1	unidad	t	t	1	4	\N
131	27	12	caja x 12 unidad	f	t	2	4	\N
132	25	1	unitario	t	t	1	3	\N
133	206	1	unidad	t	t	1	4	\N
134	206	12	caja x 12 unidad	f	t	2	4	\N
135	2	1	unidad	t	t	1	4	\N
136	2	12	pack x 12 unidad	f	t	4	4	\N
137	155	1	unidad 	t	t	1	4	\N
138	155	12	pack x 12 unidad	f	t	4	4	\N
139	156	1	unidad	t	t	1	4	\N
140	156	12	pack x 12 unidad	f	t	4	4	\N
141	89	1	unidad	t	t	1	4	\N
142	89	15	caja x 15 unidad	f	t	2	4	\N
143	31	1	UNIDAD	t	t	1	3	\N
144	31	6	CAJA X 6 UNID	f	t	2	3	\N
145	90	1	unidad	t	t	1	4	\N
146	33	1	unidad	t	t	1	3	\N
147	33	12	caja x 12 unid	f	t	2	3	\N
148	90	6	pack x 6 unidad	f	t	4	4	\N
149	90	24	caja x 24 unidad	f	t	2	4	\N
150	91	1	unidad	t	t	1	4	\N
151	91	6	pack x 6 unidad	f	t	4	4	\N
152	91	24	caja x 24 unidad	f	t	2	4	\N
153	119	1	unidad	t	t	1	4	\N
154	119	6	pack x 6 unidad	f	t	4	4	\N
155	119	24	caja x 24 unidad	f	t	2	4	\N
156	35	1	UNIDAD	t	t	1	3	\N
157	120	1	unidad	t	t	1	4	\N
158	120	12	pack x 12 unidad	f	t	4	4	\N
159	130	1	unidad	t	t	1	4	\N
160	130	15	caja x 15 unidad	f	t	2	4	\N
162	207	1	unidad	t	t	1	4	\N
175	207	6	pack x 6	f	t	4	2	\N
176	207	24	caja x 24 unidad	f	t	2	4	\N
177	212	1	UNIDAD	t	t	1	4	\N
178	212	12	PACK X 12 UNIDAD	f	t	4	4	\N
179	213	1	UNIDAD	t	t	1	4	\N
180	213	12	PACK X 12 UNIDAD	f	t	4	4	\N
182	215	12	PACK X 12 UNIDAD	f	t	4	4	\N
183	215	1	UNIDAD	t	t	1	4	\N
184	220	1	UNIDAD	t	t	1	4	\N
185	220	12	CAJA X 12 UNIDAD	f	t	2	4	\N
186	221	1	UNIDAD	t	t	1	4	\N
187	221	6	PACK X 6 UNIDAD	f	t	4	4	\N
188	221	24	CAJA X 24 UNIDAD	f	t	2	4	\N
189	222	1	UNIDAD	t	t	1	4	\N
190	222	6	PACK X 6 UNIDAD	f	t	4	4	\N
191	222	24	CAJA X 24 UNIDAD	f	t	2	4	\N
192	224	1	unidad	t	t	1	4	\N
193	224	12	pack x 12 unidad	f	t	4	4	\N
194	147	1	unidad	t	t	1	4	\N
195	147	6	pack x 6 unidad	f	t	4	4	\N
196	147	24	caja x 24 unidad	f	t	2	4	\N
197	148	1	UNIDAD	t	t	1	4	\N
198	148	12	CAJA X 12 UNIDAD	f	t	2	4	\N
199	149	1	UNIDAD	t	t	1	4	\N
200	149	6	PACK X 6 UNIDAD	f	t	4	4	\N
201	149	24	CAJA X 24 UNIDAD	f	t	2	4	\N
202	5	1	unidad	t	t	1	4	\N
203	5	12	caja x 12 unidad	f	t	2	4	\N
204	28	1	unidad	t	t	1	4	\N
205	28	15	pack x 15 unidad	f	t	4	4	\N
206	29	1	unidad	t	t	1	4	\N
207	29	6	pack x 6 unidad	f	t	4	4	\N
208	29	24	caja x 24 unidad	f	t	2	4	\N
209	30	1	unidad	t	t	1	4	\N
210	30	6	pack x 6 unidad	f	t	4	4	\N
211	30	24	caja x 24 unidad	f	t	2	4	\N
213	225	1	unidad	t	t	1	4	\N
214	225	12	caja x 12 unidad	f	t	2	4	\N
215	151	1	unidad	t	t	1	4	\N
216	151	24	caja x 24 unidad	f	t	2	4	\N
217	152	1	unidad	t	t	1	4	\N
218	152	6	pack x 6 unidad	f	t	4	4	\N
219	152	24	caja x 24 unidad	f	t	2	4	\N
220	154	1	unidad	t	t	1	4	\N
221	154	12	pack x 12 unidad	f	t	4	4	\N
222	226	1	unidad	t	t	1	4	\N
223	226	12	pack x 12 unidad	f	t	4	4	\N
224	227	1	unidad 	t	t	1	4	\N
225	227	12	caja x 12 unidad	f	t	2	4	\N
226	228	1	unidad	t	t	1	4	\N
227	228	24	caja x 24 unidad	f	t	2	4	\N
228	229	1	unidad	t	t	1	4	\N
229	229	12	caja x 12 unidad	f	t	4	4	\N
230	230	1	unidad	t	t	1	4	\N
231	230	24	caja x 24 unidad	f	t	2	4	\N
232	52	1	unidad	t	t	1	4	\N
233	52	6	pack x 6 unidad	f	t	4	4	\N
234	52	24	caja x 24 unidad	f	t	2	4	\N
235	53	1	unidad	t	t	1	4	\N
236	53	6	caja x 6 unidad	f	t	2	4	\N
237	53	12	caja x 12 unidad	f	t	3	4	\N
238	54	1	unidad	t	t	1	4	\N
239	54	12	pack x 12 unidad	f	t	4	4	\N
240	57	1	unidad	t	t	1	4	\N
241	57	24	caja x 24 unidad	f	t	2	4	\N
242	61	1	unidad	t	t	1	4	\N
243	61	12	caja x 12 unidad	f	t	2	4	\N
244	63	1	unidad 	t	t	1	4	\N
245	63	12	pack x 12 unidad	f	t	4	4	\N
246	145	1	unidad	t	t	1	4	\N
247	145	12	pack x 12 unidad	f	t	4	4	\N
248	146	1	unidad	t	t	1	4	\N
249	146	12	pack x 12 unidad	f	t	4	4	\N
250	150	1	unidad	t	t	1	4	\N
251	150	12	CAJA X 12 UNIDAD	f	t	2	4	\N
252	231	1	unidad 	t	t	1	4	\N
253	231	12	pack x 12 unidad	f	t	4	4	\N
254	232	1	unidad	t	t	1	4	\N
255	232	6	pack x 6 unidad	f	t	4	4	\N
256	232	12	caja x 12 unidad	f	t	2	4	\N
257	235	1	unidad	t	t	1	4	\N
258	235	6	caja x 6 unidad	f	t	2	4	\N
259	236	1	unidad	t	t	1	4	\N
260	236	12	pack x 12 unidad	f	t	4	4	\N
261	238	1	unidad	t	t	1	4	\N
262	238	11	pack x 12 unidad	f	t	4	4	\N
263	157	1	unidad	t	t	1	4	\N
264	157	24	caja x 12 unidad	f	t	2	4	\N
265	158	1	unidad	t	t	1	4	\N
266	158	12	pack x 12 uniDAD	f	t	4	4	\N
267	159	1	unidad 	t	t	1	4	\N
268	159	12	pack x 12 unidad	f	t	4	4	\N
269	239	1	unidad	t	t	1	4	\N
270	239	12	pack x 12 unidad	f	t	4	4	\N
341	241	1	UNIDAD	t	t	1	4	\N
342	241	6	PACK X 6 UNIDAD	f	t	4	4	\N
343	242	1	UNIDAD	t	t	1	4	\N
344	242	6	PACK X 6 UNIDAD	f	t	4	4	\N
345	243	1	unidad	t	t	1	4	\N
346	243	6	pack x 6 unidad	f	t	4	4	\N
347	244	1	unidad 	t	t	1	4	\N
348	244	12	pack x 12 unidad	f	t	1	4	\N
349	245	1	unidad	t	t	1	4	\N
350	245	4	pack x 4 unidad	f	t	4	4	\N
351	246	1	unidad	t	t	1	4	\N
352	246	6	pack x 6 unidad	f	t	4	4	\N
353	246	24	caja x 24 unidad	f	t	2	4	\N
354	247	1	unidad	t	t	1	4	\N
355	247	6	pack x 6 unidad	f	t	4	4	\N
356	247	24	caja x 24 unidad	f	t	2	4	\N
357	248	1	UNIDAD	t	t	1	4	\N
358	248	6	PACK X 6 UNIDAD	f	t	4	4	\N
359	248	24	CAJA X 24 UNIDAD	f	t	2	4	\N
361	249	6	PACK X 6 UNIDAD	f	t	4	4	\N
362	249	24	CAJA X 24 UNIDAD	f	t	2	4	\N
363	249	1	UNIDAD 	t	t	1	4	\N
364	250	1	UNIDAD	t	t	1	4	\N
365	250	6	PACK X 6 UNIDAD	f	t	4	4	\N
366	250	24	CAJA X 24 UNIDAD	f	t	2	4	\N
367	251	1	unidad	t	t	1	4	\N
368	251	6	pack x 6 unidad	f	t	4	4	\N
369	251	24	caja x 24 unidad	f	t	2	4	\N
370	252	1	unidad	t	t	1	4	\N
371	252	24	caja x 24 unidad	f	t	2	4	\N
372	253	1	UNIDAD	t	t	1	4	\N
373	253	12	PACK X 12 UNIDAD	f	t	4	4	\N
374	254	1	unidad	t	t	1	4	\N
375	254	4	pack x 4 unidad	f	t	4	4	\N
376	254	24	caja x 24 unidad	f	t	2	4	\N
377	255	1	unidad	t	t	1	4	\N
378	255	4	PACK X 4 UNIDAD	f	t	4	4	\N
379	255	24	CAJA X 24 UNIDAD	f	t	2	4	\N
380	256	1	unidad	t	t	1	4	\N
381	256	4	pack x 4 unidad	f	t	4	4	\N
382	256	24	caja x 24 unidad	f	t	2	4	\N
383	257	1	unidad	t	t	1	4	\N
384	257	4	pack x 4 unidad	f	t	4	4	\N
385	257	24	caja x 24 unidad	f	t	2	4	\N
\.


--
-- Name: presentacion_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.presentacion_id_seq', 385, true);


--
-- Data for Name: producto; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.producto (id, id_central, propagado, descripcion, descripcion_factura, iva, unidad_por_caja, balanza, combo, garantia, ingrediente, promocion, vencimiento, stock, usuario_id, tipo_conservacion, creado_en, sub_familia_id, observacion, cambiable, es_alcoholico, unidad_por_caja_secundaria, imagenes, tiempo_garantia, dias_vencimiento, id_sucursal_origen, activo) FROM stdin;
13	\N	\N	SANTA HELENA VINO BLANCO 750 ML	SANTA HELENA VINO BLANCO 750 ML	10	12	\N	\N	\N	\N	\N	t	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
14	\N	\N	BRAHMA ZERO ALCOHOL 0.0 LATA 350 ML	BRAHMA ZERO ALCOHOL 0.0 LATA 350 ML	10	12	\N	\N	\N	\N	\N	t	t	4	REFRIGERABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	t
15	\N	\N	SANTA HELENA VINO DULCE 1.5 LT	SANTA HELENA VINO DULCE 1.5 LT	10	6	\N	\N	\N	\N	\N	t	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
16	\N	\N	SANTA HELENA VINO DULCE 750 ML	SANTA HELENA VINO DULCE 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
17	\N	\N	BRAHMA DUPLO MALTE BOT 330 ML 	BRAHMA DUPLO MALTE BOT 330 ML 	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
18	\N	\N	SANTA HELENA REFRESCANTE ROSE 750 ML	SANTA HELENA REFRESCANTE ROSE 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
21	\N	\N	BRAHMA DUPLO MALTE BOT 600 ML 	BRAHMA DUPLO MALTE BOT 600 ML 	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
3	\N	\N	DON FRANCO SALTO LAGER 330 ML	DON FRANCO SALTO LAGER 330 ML	10	\N	\N	\N	\N	\N	\N	t	t	1	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	t
4	\N	\N	DON FRANCO IPA HAPPE 330 ML	DON FRANCO IPA HAPPE 330 ML	10	6	\N	\N	\N	\N	\N	t	t	1	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	t
5	\N	\N	SKOL LITRO RETORNABLE	SKOL LITRO RETORNABLE	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	t
6	\N	\N	7 COLINAS VINO TINTO 3 L	7 COLINAS VINO TINTO 3 L	10	6	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
7	\N	\N	BRAHMA SUB ZERO LATA 269 ML 	BRAHMA SUB ZERO LATA 269 ML 	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
9	\N	\N	BRAHMA SUB ZERO BOT 340 ML RETORNABLE	BRAHMA SUB ZERO BOT 340 ML RETORNABLE	10	24	\N	\N	f	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
10	\N	\N	7 COLINAS VINO TINTO 2 L	7 COLINAS VINO TINTO 2 L	10	6	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
11	\N	\N	BRAHMA CHOPP LATA 269 ML 	BRAHMA CHOPP LATA 269 ML 	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
8	\N	\N	7 COLINAS VINO TINTO 880 ML	7 COLINAS VINO TINTO 880 ML	10	12	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
12	\N	\N	BRAHMA CHOPP BOT 340 ML RETORNABLE	BRAHMA CHOPP BOT 340 ML RETORNABLE	10	24	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
23	\N	\N	SANTA HELENA ROSADO 1.5 L	SANTA HELENA ROSADO 1.5 L	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
24	\N	\N	SANTA HELENA ROSE 750 ML	SANTA HELENA ROSE 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
25	\N	\N	SANTA HELENA SELECCION DEL DIRECTORIO 750 ML	SANTA HELENA SELECCION DEL DIRECTORIO 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
26	\N	\N	PILSEN BOT 340 NL RETORNABLE	PILSEN BOT 340 NL RETORNABLE	10	24	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
27	\N	\N	PILSEN LITRO RETORNABLE	PILSEN LITRO RETORNABLE	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
28	\N	\N	SKOL LATA 269 ML	SKOL LATA 269 ML	10	15	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
29	\N	\N	SKOL BOT ABRE FACIL 275 ML 	SKOL BOT ABRE FACIL 275 ML 	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
30	\N	\N	SKOL BOT PURO MALTE ABRE FACIL 275 ML	SKOL BOT PURO MALTE ABRE FACIL 275 ML	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
31	\N	\N	SANTA HELENA TINTO 1.5 ML	SANTA HELENA TINTO 1.5 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
32	\N	\N	CORONITA EXTRA 7FL. OZ. 210 ML	CORONITA EXTRA 7FL. OZ. 210 ML	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
33	\N	\N	SANTA HELENA TINTO 750 ML	SANTA HELENA TINTO 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
34	\N	\N	CORONA BOT 355 ML	CORONA BOT 355 ML	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
35	\N	\N	SANTA HELENA VERNUS 750 ML	SANTA HELENA VERNUS 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
36	\N	\N	CORONA BOT 710 ML 	CORONA BOT 710 ML 	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
37	\N	\N	SANTA HELENA TINTO PACK 2 BOTELLA 750ML + 1 COPA	SANTA HELENA TINTO PACK 2 BOTELLA 750ML + 1 COPA	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
38	\N	\N	CONCHA Y TORO CASILLERO DEL DIABLO RESERVA PRIVADA 750ML	CONCHA Y TORO CASILLERO DEL DIABLO RESERVA PRIVADA 750ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
39	\N	\N	CONCHA Y TORO CASILLERO DEL DIABLO RVA CAB SAUV 750ML	CONCHA Y TORO CASILLERO DEL DIABLO RVA CAB SAUV 750ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
40	\N	\N	CONCHA Y TORO EXPORTACION CAB SAUV 750 ML	CONCHA Y TORO EXPORTACION CAB SAUV 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
41	\N	\N	CONCHA Y TORO EXPORTACION CABERNET SAUVIGNON 1.5 L	CONCHA Y TORO EXPORTACION CABERNET SAUVIGNON 1.5 L	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
42	\N	\N	CONCHA Y TORO FRONTERA CAB. SAU. 750 ML	CONCHA Y TORO FRONTERA CAB. SAU. 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
43	\N	\N	CONCHA Y TORO FRONTERA SAUV. BLANC 750 ML	CONCHA Y TORO FRONTERA SAUV. BLANC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
44	\N	\N	CONCHA Y TORO GRAN RESERVA BLANC 750 ML	CONCHA Y TORO GRAN RESERVA BLANC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
45	\N	\N	CONCHA Y TORO GRAN RESERVA RIBERAS CAB SAUV 750ML	CONCHA Y TORO GRAN RESERVA RIBERAS CAB SAUV 750ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
46	\N	\N	CONCHA Y TORO RESERVADO CAB. SAUV.750 ML	CONCHA Y TORO RESERVADO CAB. SAUV.750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
47	\N	\N	CONCHA Y TORO RESERVADO MERLOT 750 ML	CONCHA Y TORO RESERVADO MERLOT 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
48	\N	\N	CONCHA Y TORO RESERVADO SAUV BLANCO 750 ML	CONCHA Y TORO RESERVADO SAUV BLANCO 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
49	\N	\N	CORONA LATA 269 ML	CORONA LATA 269 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
83	\N	\N	HEINEKEN BOT 650 ML	HEINEKEN BOT 650 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
1	\N	\N	PILSEN EXTRA PURA MALTA LATA 310 ML 	PILSEN PURA MALTA LATA 310 ML 	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
52	\N	\N	BUDWEISER 66 BOT 330 ML	BUDWEISER 66 BOT 330 ML	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
53	\N	\N	BUDWEISER 66 CADILLAC BOT 550 ML 	BUDWEISER 66 CADILLAC BOT 550 ML 	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	12	/productos	\N	30	\N	t
50	\N	\N	AURORA VINO MOSCATEL ESPUMANTE 750 ML	AURORA VINO MOSCATEL ESPUMANTE 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	16	\N	\N	f	\N	/productos	\N	\N	\N	t
51	\N	\N	AURORA ESPUMANTE BRUT 750 ML	AURORA ESPUMANTE BRUT 750 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	16	\N	\N	f	\N	/productos	\N	\N	\N	t
54	\N	\N	BUDWEISER 66 LATA 269 ML	BUDWEISER 66 LATA 269 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
55	\N	\N	AURORA JUGO DE UVA TINTO INTEGRAL 300 ML	AURORA JUGO DE UVA TINTO INTEGRAL 300 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	22	\N	\N	f	\N	/productos	\N	\N	\N	t
56	\N	\N	AURORA JUGO DE UVA TINTO INTEGRAL 1 L	AURORA JUGO DE UVA TINTO INTEGRAL 1 L	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	22	\N	\N	f	\N	/productos	\N	\N	\N	t
57	\N	\N	BUDWEISER BOT 340 ML RETORNABLE	BUDWEISER BOT 340 ML RETORNABLE	10	24	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
58	\N	\N	AURORA JUGO DE UVA TINTO INTEGRAL 1.5 L	AURORA JUGO DE UVA TINTO INTEGRAL 1.5 L	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	22	\N	\N	f	\N	/productos	\N	\N	\N	t
59	\N	\N	SANTA CAROLINA ESTRELLAS CAB SAUV 750ML	SANTA CAROLINA ESTRELLAS CAB SAUV 750ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
60	\N	\N	SANTA CAROLINA ESTRELLAS CARMENERE 750 ML	SANTA CAROLINA ESTRELLAS CARMENERE 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
61	\N	\N	BUDWEISER CADILLAC BOT 550 ML	BUDWEISER CADILLAC BOT 550 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
62	\N	\N	SANTA CAROLINA PREMIO BLANCO 750 ML	SANTA CAROLINA PREMIO BLANCO 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
63	\N	\N	BUDWEISER LATA 269 ML	BUDWEISER LATA 269 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
64	\N	\N	SANTA CAROLINA PREMIO TINTO 1.5 L	SANTA CAROLINA PREMIO TINTO 1.5 L	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
65	\N	\N	SANTA CAROLINA PREMIO TINTO 750 ML	SANTA CAROLINA PREMIO TINTO 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
66	\N	\N	SANTA CAROLINA PREMIO TINTO DULCE 750 ML	SANTA CAROLINA PREMIO TINTO DULCE 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
67	\N	\N	SANTA CAROLINA RESERVA CABERNET SAUVIGNON 750 ML	SANTA CAROLINA RESERVA CABERNET SAUVIGNON 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
68	\N	\N	SANTA CAROLINA RESERVA DE FAMILIA CABERNT SAUV 750 ML	SANTA CAROLINA RESERVA DE FAMILIA CABERNT SAUV 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
69	\N	\N	SANTA CAROLINA RESERVA SAUVIGNON BLANC 750 ML	SANTA CAROLINA RESERVA SAUVIGNON BLANC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
71	\N	\N	SANTA CAROLINA RESERVADO CABER SAUV CARM EDIC LTDA 750 ML	SANTA CAROLINA RESERVADO CABER SAUV CARM EDIC LTDA 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
72	\N	\N	SANTA CAROLINA RESERVADO CABERNET SAUVIGNON 1.5 L	SANTA CAROLINA RESERVADO CABERNET SAUVIGNON 1.5 L	10	1	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
84	\N	\N	QUINTA DO MORGADO BORDO TINTO SUAVE 1 L	QUINTA DO MORGADO BORDO TINTO SUAVE 1 L	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
73	\N	\N	SANTA CAROLINA RESERVADO CABERNET SAUVIGNON 750 ML	SANTA CAROLINA RESERVADO CABERNET SAUVIGNON 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
78	\N	\N	SANTA CAROLINA RESERVADO CARMENERE 750 ML	SANTA CAROLINA RESERVADO CARMENERE 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
79	\N	\N	HEINEKEN BOT 330 ML 	HEINEKEN BOT 330 ML 	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
81	\N	\N	QUINTA DO MORGADO BLANCO SUAVE 750 ML	QUINTA DO MORGADO BLANCO SUAVE 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
82	\N	\N	QUINTA DO MORGADO BORDO SUAVE 750 ML	QUINTA DO MORGADO BORDO SUAVE 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
85	\N	\N	QUINTA DO MORGADO ESPUMANTE DEMI SEC 660 ML	QUINTA DO MORGADO ESPUMANTE DEMI SEC 660 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	16	\N	\N	f	\N	/productos	\N	\N	\N	t
86	\N	\N	QUINTA DO MORGADO ESPUMANTE MOSCATEL 660ML	QUINTA DO MORGADO ESPUMANTE MOSCATEL 660ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	16	\N	\N	f	\N	/productos	\N	\N	\N	t
87	\N	\N	HEINEKEN PURO MALTE 0,0 ALCOHOL BOT 330 ML	HEINEKEN PURO MALTE 0,0 ALCOHOL BOT 330 ML	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
88	\N	\N	QUINTA DO MORGADO ROSADO SUAVE 750 ML	QUINTA DO MORGADO ROSADO SUAVE 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
89	\N	\N	MILLER BOT 650 ML	MILLER BOT 650 ML	10	15	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
90	\N	\N	MILLER BOT 355 ML	MILLER BOT 355 ML	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
91	\N	\N	MILLER LATA 237 ML 8OZ	MILLER LATA 237 ML 8OZ	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
92	\N	\N	QUINTA DO MORGADO SUAVE LATA 269 ML	QUINTA DO MORGADO SUAVE LATA 269 ML	10	12	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
93	\N	\N	QUINTA DO MORGADO JUGO DE UVA INTEGRAL 300 ML	QUINTA DO MORGADO JUGO DE UVA INTEGRAL 300 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
94	\N	\N	QUINTA DO MORGADO JUGO DE UVA INTEGRAL 1 L	QUINTA DO MORGADO JUGO DE UVA INTEGRAL 1 L	10	\N	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	22	\N	\N	f	\N	/productos	\N	\N	\N	t
95	\N	\N	QUINTA DO MORGADO SUCO DE UVA TINTO 330 ML	QUINTA DO MORGADO SUCO DE UVA TINTO 330 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	22	\N	\N	f	\N	/productos	\N	\N	\N	t
96	\N	\N	QUINTA DO MORGADO TINTO SUAVE 1 L	QUINTA DO MORGADO TINTO SUAVE 1 L	10	12	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
97	\N	\N	QUINTA DO MORGADO TINTO SUAVE 2 LT	QUINTA DO MORGADO TINTO SUAVE 2 LT	10	6	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
98	\N	\N	QUINTA DO MORGADO TINTO SUAVE 245 ML	QUINTA DO MORGADO TINTO SUAVE 245 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
80	\N	\N	TEST PRODUCTO IMAGEN 2	TEST PRODUCTO IMAGEN 2	10	\N	\N	\N	\N	\N	\N	t	t	1	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	t
99	\N	\N	QUINTA DO MORGADO TINTO SUAVE 750 ML	QUINTA DO MORGADO TINTO SUAVE 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
100	\N	\N	SAN PEDRO GATO NEGRO CABERNET SAUVIGNON 750 ML	SAN PEDRO GATO NEGRO CABERNET SAUVIGNON 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
101	\N	\N	CANCAO VINO SUAVE 750 ML	CANCAO VINO SUAVE 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
102	\N	\N	CANCAO VINO SUAVE 1 L	CANCAO VINO SUAVE 1 L	10	\N	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
103	\N	\N	VINO CANCAO 1.5L	VINO CANCAO 1.5L	10	6	\N	\N	\N	\N	\N	f	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
104	\N	\N	VALLE DE UCO LA CELIA PIONNER MALBEC 750ML	VALLE DE UCO LA CELIA PIONNER MALBEC 750ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
105	\N	\N	LA CELIA EUGENIO BUSTOS CABERNET SAUVIGNON 750 ML	LA CELIA EUGENIO BUSTOS CABERNET SAUVIGNON 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
106	\N	\N	LUIGI BOSCA CABERNET SAUVIGNON 750 ML	LUIGI BOSCA CABERNET SAUVIGNON 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
107	\N	\N	LUIGI BOSCA CABERNET - MALBEC 750 ML	LUIGI BOSCA CABERNET - MALBEC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
108	\N	\N	LUIGI BOSCA MALBEC 750 ML	LUIGI BOSCA MALBEC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
109	\N	\N	LATITUD 33 CABERNET SAUVIGNON 750 ML	LATITUD 33 CABERNET SAUVIGNON 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
110	\N	\N	LATITUD 33 MALBEC 750 ML	LATITUD 33 MALBEC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
111	\N	\N	NAVARRO CORREA RESERVA CABERNET SAUVIGNON 750 ML	NAVARRO CORREA RESERVA CABERNET SAUVIGNON 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
112	\N	\N	NAVARRO CORREAS COLECCION PRIVADA CAB SAU 750 ML	NAVARRO CORREAS COLECCION PRIVADA CAB SAU 750 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
113	\N	\N	NAVARRO CORREAS COLECCION PRIVADA MALBEC 750 ML	NAVARRO CORREAS COLECCION PRIVADA MALBEC 750 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
114	\N	\N	NAVARRO CORREAS ESPUMANTE EXTRA BRUT 750 ML	NAVARRO CORREAS ESPUMANTE EXTRA BRUT 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	16	\N	\N	f	\N	/productos	\N	\N	\N	t
115	\N	\N	NAVARRO CORREAS GRAN LOS ARBOLES MALBEC 750 ML	NAVARRO CORREAS GRAN LOS ARBOLES MALBEC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
116	\N	\N	NAVARRO CORREAS LOS ARBOLES CAB SAUV 750 ML	NAVARRO CORREAS LOS ARBOLES CAB SAUV 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
117	\N	\N	NAVARRO CORREAS LOS ARBOLES CAB. MALBEC 750 ML	NAVARRO CORREAS LOS ARBOLES CAB. MALBEC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
118	\N	\N	NAVARRO CORREAS LOS ARBOLES MALBEC 750 ML	NAVARRO CORREAS LOS ARBOLES MALBEC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
119	\N	\N	MILLER LATA 296 ML 	MILLER LATA 296 ML 	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
120	\N	\N	MILLER LATA 355 ML	MILLER LATA 355 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
121	\N	\N	FINCA LA LINDA CABERNET SAUVIGNON 750 ML	FINCA LA LINDA CABERNET SAUVIGNON 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
122	\N	\N	FINCA LA LINDA MALBEC 750 ML	FINCA LA LINDA MALBEC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
123	\N	\N	TRAPICHE VINEYARD CABERNET SAUVIGNON 750 ML	TRAPICHE VINEYARD CABERNET SAUVIGNON 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
124	\N	\N	TRAPICHE VINEYARD MALBEC 750 ML	TRAPICHE VINEYARD MALBEC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
125	\N	\N	FINCA DO CARVALHO TINTO SUAVE 1 LT	FINCA DO CARVALHO TINTO SUAVE 1 LT	10	12	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
126	\N	\N	FINCA DO CARVALHO TINTO SUAVE 2 LT	FINCA DO CARVALHO TINTO SUAVE 2 LT	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
127	\N	\N	FINCA DO CARVALHO TINTO SUAVE 750 ML	FINCA DO CARVALHO TINTO SUAVE 750 ML	10	12	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
128	\N	\N	BODEGA PRIVADA CABERNET SAUVIGNON 750ML	BODEGA PRIVADA CABERNET SAUVIGNON 750ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
129	\N	\N	BODEGA PRIVADA TINTO MALBEC 750 ML	BODEGA PRIVADA TINTO MALBEC 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
130	\N	\N	MILLER HIGH LIFE BOT 710 ML	MILLER HIGH LIFE BOT 710 ML	10	15	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
131	\N	\N	BODEGA PRIVADA VINO BLEND RED 750 ML	BODEGA PRIVADA VINO BLEND RED 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
132	\N	\N	TORO CENTENARIO CABERNET SAUVIGNON 750 ML	TORO CENTENARIO CABERNET SAUVIGNON 750 ML	10	\N	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
133	\N	\N	ANTARCTICA ORIGINAL LATA 269 ML	ANTARCTICA ORIGINAL LATA 269 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
134	\N	\N	TORO VIEJO BIVARIETAL BONARDA SIRAH 1.125 L	TORO VIEJO BIVARIETAL BONARDA SIRAH 1.125 L	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
135	\N	\N	ANTARCTICA ORIGINAL BOT 300 ML	ANTARCTICA ORIGINAL BOT 300 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
136	\N	\N	TORO CENTENARIO VINO TINTO 750 ML	TORO CENTENARIO VINO TINTO 750 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
137	\N	\N	TORO VIEJO BIVARIETAL BONARDA SIRAH 750 ML	TORO VIEJO BIVARIETAL BONARDA SIRAH 750 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
138	\N	\N	TORO VIEJO CHENIN TORRONTES BLANCO 750 ML	TORO VIEJO CHENIN TORRONTES BLANCO 750 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
139	\N	\N	TORO VIEJO CLASICO 1.125 ML	TORO VIEJO CLASICO 1.125 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
140	\N	\N	TORO VIEJO CLASICO BLANCO 700 ML	TORO VIEJO CLASICO BLANCO 700 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
141	\N	\N	TORO VIEJO TINTO CLASICO 700 ML	TORO VIEJO TINTO CLASICO 700 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
142	\N	\N	TORO VIEJO VINO ROSADO 700 ML	TORO VIEJO VINO ROSADO 700 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
143	\N	\N	TORO CENTENARIO MALBEC 750 ML	TORO CENTENARIO MALBEC 750 ML	10	6	\N	\N	\N	\N	\N	f	t	3	NO_ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
144	\N	\N	ANTARCTICA ORIGINAL BOT 600 ML	ANTARCTICA ORIGINAL BOT 600 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
146	\N	\N	OURO FINO LATA 269 ML	OURO FINO LATA 269 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
147	\N	\N	STELLA ARTOIS BOT 330 ML 	STELLA ARTOIS BOT 330 ML 	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
148	\N	\N	STELLA ARTOIS BOT 660 ML 	STELLA ARTOIS BOT 660 ML 	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
149	\N	\N	STELLA ARTOIS LATA 250 ML	STELLA ARTOIS LATA 250 ML	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
150	\N	\N	OURO FINO LITRO RETORNABLE	OURO FINO LITRO RETORNABLE	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
151	\N	\N	ITAIPAVA BOT 600 ML RETORNABLE	ITAIPAVA BOT 600 ML RETORNABLE	10	24	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
152	\N	\N	ITAIPAVA BOT 250 ML	ITAIPAVA BOT 250 ML	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	12	/productos	\N	30	\N	t
153	\N	\N	BRAHMA LITRO RETORNABLE	BRAHMA LITRO RETORNABLE	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
154	\N	\N	ITAIPAVA LATA 269 ML	ITAIPAVA LATA 269 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
155	\N	\N	POLAR ICE LATA 269 ML	POLAR ICE LATA 269 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
156	\N	\N	BURGUESA LATA 269 ML	BURGUESA LATA 269 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
157	\N	\N	MUNICH ORIGINAL BOT LITRO RETORNABLE	MUNICH ORIGINAL BOT LITRO RETORNABLE	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
158	\N	\N	MUNICH ORIGINAL LATA 269 ML	MUNICH ORIGINAL LATA 269 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
159	\N	\N	MUNICH ROYAL BOT 350 ML	MUNICH ROYAL BOT 350 ML	10	12	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
2	\N	\N	PILSEN CLASICA LATA 269 ML	PILSEN CLASICA LATA 269 ML	10	\N	f	\N	\N	\N	\N	t	t	1	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
160	\N	\N	PRUEBA PRODUCTO 5	PRUEBA PRODUCTO 5	10	\N	\N	\N	\N	\N	\N	t	t	1	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	t
162	\N	\N	PRUDUCTO SIN CODIGO	PRUDUCTO SIN CODIGO	\N	\N	\N	\N	\N	\N	\N	t	t	1	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	t
198	\N	\N	SANTA HELENA RESERVADO CABERNET SAUV 750 ML	SANTA HELENA RESERVADO CABERNET SAUV 750 ML	10	\N	\N	\N	\N	\N	\N	t	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
199	\N	\N	SANTA HELENA RESERVADO CARMENERE 750 ML	SANTA HELENA RESERVADO CARMENERE 750 ML	10	\N	\N	\N	\N	\N	\N	t	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
201	\N	\N	SANTA HELENA RESERVADO MERLOT 750 ML	SANTA HELENA RESERVADO MERLOT 750 ML	10	\N	\N	\N	\N	\N	\N	t	t	3	ENFRIABLE	\N	15	\N	\N	f	\N	/productos	\N	\N	\N	t
70	\N	\N	HEINEKEN BOT 250 MLL	HEINEKEN BOT 250 ML	10	6	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	24	/productos	\N	30	\N	t
203	\N	\N	PRUEBA PRODUCTO 6	PRUEBA PRODUCTO 6	10	\N	t	\N	\N	\N	\N	t	t	2	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	t
204	\N	\N	HEINEKEN LATA 250 ML 	HEINEKEN LATA 250 ML 	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
205	\N	\N	HEINEKEN DRAUGHTKET 5L	HEINEKEN DRAUGHTKET 5L	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
206	\N	\N	PILSEN PURA MALTA LITRO RETORNABLE	PILSEN PURA MALTA LITRO RETORNABLE	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
207	\N	\N	MILLER HIGH LIFE BOT 355ML	MILLER HIGH LIFE BOT 355ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
165	\N	\N	TEST PRODUCTO VALUE	TEST PRODUCTO VALUE	\N	\N	\N	\N	\N	\N	\N	t	t	1	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	f
166	\N	\N	TEST PRODUCTO VALUE 2	TEST PRODUCTO VALUE	\N	\N	\N	\N	\N	\N	\N	t	t	1	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	\N	\N	f
212	\N	\N	KAISER LATA 269ML	KAISER LATA 269ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
213	\N	\N	KAISER ULTRA CERO LATA 269ML	KAISER ULTRA CERO LATA 269ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
215	\N	\N	NORTE BLANCA CERVEZA LATA 269ML	NORTE BLANCA CERVEZA LATA 269ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
220	\N	\N	AMSTEL BIER BOT 650ML	AMSTEL BIER BOT 650ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
221	\N	\N	AMSTEL BIER BOT 355ML	AMSTEL BIER BOT 355ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
222	\N	\N	AMSTEL BIER LATA 250ML	AMSTEL BIER LATA 250ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
224	\N	\N	AMSTEL LAGER LATA 350ML	AMSTEL LAGER LATA 350ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
225	\N	\N	SKOL PROFISA BOT 330ML	SKOL PROFISA BOT 330ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
226	\N	\N	CONTI ZERO GRAU LATA 269ML	CONTI ZERO GRAU LATA 269ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
227	\N	\N	CONTI ZERO GRAU BOT 330ML	CONTI ZERO GRAU BOT 330ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
228	\N	\N	CONTI ZERO GRAU BOT 660ML	CONTI ZERO GRAU BOT 660ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
229	\N	\N	CONTI BIER LATA 269ML	CONTI BIER LATA 269ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
230	\N	\N	CONTI BIER BOT 600ML	CONTI BIER BOT 600ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	600	\N	t
231	\N	\N	EISENBAHN PILSEN LATA 350ML	EISENBAHN PILSEN LATA 350ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
232	\N	\N	EISENBAHN PILSEN BOT 355ML	EISENBAHN PILSEN BOT 355ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
145	\N	\N	OURO FINO LATA 354 ML	OURO FINO LATA 354 ML	10	\N	f	\N	\N	\N	\N	t	t	2	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
235	\N	\N	EISENBAHN PILSEN BOT 600ML	EISENBAHN PILSEN BOT 600ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
236	\N	\N	EISENBAHN PALE ALE LATA 350ML	EISENBAHN PALE ALE LATA 350ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
238	\N	\N	EISENBAHN AMERICAN IPA LATA 350ML	EISENBAHN AMERICAN IPA LATA 350ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
239	\N	\N	MUNICH ROYAL LATA 269ML	MUNICH ROYAL LATA 269ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
242	\N	\N	ESTRELLA GALICIA NEGRA 0.0 ALCOHOL BOT 250 ML	ESTRELLA GALICIA NEGRA 0.0 ALCOHOL BOT 250 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
241	\N	\N	ESTRELLA GALICIA SIN GLUTEN BOT 330 ML	ESTRELLA GALICIA SIN GLUTEN BOT 330 ML	10	\N	\N	\N	\N	\N	\N	t	t	2	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
243	\N	\N	ESTRELLA GALICIA 0.0 ALCOHOL 250 ML	ESTRELLA GALICIA 0.0 ALCOHOL 250 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
244	\N	\N	ESTRELLA GALICIA PREMIUM LAGER BOT 355 ML	ESTRELLA GALICIA PREMIUM LAGER BOT 355 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
245	\N	\N	ESTRELLA GALICIA WORLD LAGER 355ML 	ESTRELLA GALICIA WORLD LAGER 355ML 	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	1	\N	\N	f	\N	/productos	\N	30	\N	t
247	\N	\N	MIKS Nº 2 DURAZNO BOT 275ML	MIKS Nº 2 DURAZNO BOT 275ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	17	\N	\N	f	\N	/productos	\N	30	\N	t
248	\N	\N	MIKS Nº 3 FRUTAS VERDES BOT 275 ML	MIKS Nº 3 FRUTAS VERDES BOT 275 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	17	\N	\N	f	\N	/productos	\N	30	\N	t
249	\N	\N	MIKS Nº 4 CITRUS BOT 275 ML	MIKS Nº 4 CITRUS BOT 275 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	17	\N	\N	f	\N	/productos	\N	30	\N	t
250	\N	\N	MIKS Nº5 LIMON BOT 275 ML	MIKS Nº5 LIMON BOT 275 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	17	\N	\N	f	\N	/productos	\N	30	\N	t
246	\N	\N	MIKS  Nº 1 FRUTILLA BOT 275ML	MIKS  Nº 1 FRUTILLA BOT 275ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	17	\N	\N	f	\N	/productos	\N	30	\N	t
251	\N	\N	SMIRNOFF ICE BOT 275 ML	SMIRNOFF ICE BOT 275 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	17	\N	\N	f	\N	/productos	\N	30	\N	t
252	\N	\N	RED BULL ENERGY DRINK LATA 250 ML	RED BULL ENERGY DRINK LATA 250 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	23	\N	\N	f	\N	/productos	\N	30	\N	t
253	\N	\N	RED BULL ENERGY DRINK LATA 473 ML	RED BULL ENERGY DRINK LATA 473 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	23	\N	\N	f	\N	/productos	\N	30	\N	t
254	\N	\N	RED BULL THE COCO EDITION LATA 250 ML	RED BULL THE COCO EDITION LATA 250 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	23	\N	\N	f	\N	/productos	\N	30	\N	t
255	\N	\N	RED BULL THE TROPICAL EDITION LATA 250 ML	RED BULL THE TROPICAL EDITION LATA 250 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	23	\N	\N	f	\N	/productos	\N	30	\N	t
256	\N	\N	RED BULL THE ACAI EDITION LATA 250 ML	RED BULL THE ACAI EDITION LATA 250 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	23	\N	\N	f	\N	/productos	\N	30	\N	t
257	\N	\N	RED BULL THE RED / MELANCIA EDITION LATA 250 ML	RED BULL THE RED / MELANCIA EDITION LATA 250 ML	10	\N	\N	\N	\N	\N	\N	t	t	4	ENFRIABLE	\N	23	\N	\N	f	\N	/productos	\N	30	\N	t
\.


--
-- Name: producto_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.producto_id_seq', 257, true);


--
-- Data for Name: producto_imagen; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.producto_imagen (id, producto_id, ruta, principal, usuario_id, creado_en) FROM stdin;
\.


--
-- Data for Name: producto_por_sucursal; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.producto_por_sucursal (id, producto_id, sucursal_id, cant_minima, cant_media, cant_maxima, usuario_id, creado_en) FROM stdin;
\.


--
-- Data for Name: producto_proveedor; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.producto_proveedor (id, producto_id, proveedor_id, pedido_id, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.producto_proveedor_id_seq', 7, true);


--
-- Name: productos_por_sucursal_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.productos_por_sucursal_id_seq', 5, true);


--
-- Data for Name: subfamilia; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.subfamilia (id, familia_id, descripcion, activo, usuario_id, creado_en, sub_familia_id, icono, nombre, posicion) FROM stdin;
1	1		t	1	2021-03-10 00:48:55.834157+00	\N	sports_bar	CERVEZAS	1
2	1		t	1	2021-03-10 00:54:39.737305+00	\N	local_drink	GASEOSAS	2
3	\N		t	1	2021-07-27 23:36:24.250632+00	1	\N	CON ALCOHOL	3
4	\N		t	1	2021-07-27 23:36:57.516332+00	1	\N	SIN ALCOHOL	4
5	1	AGUAS MINERALES, CON GAS, SIN GAS, TONICAS, AGUAS SABORIZADAS	t	\N	\N	\N	local_drink	AGUAS	6
6	2	JABON, DETERGENTE, PAPEL HIGIENICO, SHAMPOO, ETC	t	\N	\N	\N	block	PRODUCTOS DE BAÑO Y COCINA	7
7	5	\N	t	\N	\N	\N	block	PANIFICADOS	8
8	5	\N	t	\N	\N	\N	block	CARNICOS	9
9	5	CHORIZOS, JAMON, PATE	t	\N	\N	\N	block	EMBUTIDOS	10
10	2	PASTILLAS, JARABES	t	\N	\N	\N	block	MEDICAMENTOS	11
11	7	\N	t	\N	\N	\N	block	TRADICIONALES	12
14	2	\N	t	\N	\N	\N	block	ACCESORIOS	13
15	1	\N	t	\N	\N	\N	block	VINOS	14
16	1	\N	t	\N	\N	\N	block	ESPUMANTES	15
17	1	\N	t	\N	\N	\N	block	WHISKYS	16
18	5	\N	t	\N	\N	\N	block	SNACKS Y GALLETITAS	17
19	5	\N	t	\N	\N	\N	block	ENLATADOS	18
21	5	\N	t	\N	\N	\N	block	ENVASADOS	18
22	1	NATURALES  Y EXTRACTOS	t	3	\N	\N	arrow_drop_up	JUGOS	20
23	1	ENERGETICOS	t	4	\N	\N	block	ENERGIZANTES	21
\.


--
-- Name: subfamilia_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.subfamilia_id_seq', 23, true);


--
-- Data for Name: tipo_precio; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.tipo_precio (id, descripcion, autorizacion, usuario_id, creado_en, activo) FROM stdin;
1	UNITARIO	\N	1	2021-05-20 15:29:22.078455+00	t
2	FRIO	\N	1	2021-05-20 15:29:22.088949+00	t
3	NATURAL	\N	1	2021-05-20 15:29:22.092991+00	t
4	FUNCIONARIOS	t	1	2021-05-20 15:29:22.097274+00	t
\.


--
-- Name: tipo_precio_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.tipo_precio_id_seq', 4, true);


--
-- Data for Name: tipo_presentacion; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.tipo_presentacion (id, descripcion, unico, usuario_id, creado_en) FROM stdin;
2	CAJA	f	1	2021-09-28 21:59:22.327764+00
3	CAJA SECUNDARIA	f	1	2021-09-28 21:59:39.359847+00
4	PACK	f	\N	2021-10-06 13:08:52.7888+00
1	UNIDAD	f	1	2021-09-28 21:59:02.524539+00
\.


--
-- Name: tipo_presentacion_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.tipo_presentacion_id_seq', 4, true);


--
-- Data for Name: producto_proveedor; Type: TABLE DATA; Schema: public; Owner: franco
--

COPY public.producto_proveedor (id, producto_id, proveedor_id, pedido_id, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: franco
--

SELECT pg_catalog.setval('public.producto_proveedor_id_seq', 1, false);


--
-- Data for Name: marca; Type: TABLE DATA; Schema: vehiculos; Owner: franco
--

COPY vehiculos.marca (id, descripcion, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: marca_id_seq; Type: SEQUENCE SET; Schema: vehiculos; Owner: franco
--

SELECT pg_catalog.setval('vehiculos.marca_id_seq', 1, false);


--
-- Data for Name: modelo; Type: TABLE DATA; Schema: vehiculos; Owner: franco
--

COPY vehiculos.modelo (id, descripcion, marca_id, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: modelo_id_seq; Type: SEQUENCE SET; Schema: vehiculos; Owner: franco
--

SELECT pg_catalog.setval('vehiculos.modelo_id_seq', 1, false);


--
-- Data for Name: tipo_vehiculo; Type: TABLE DATA; Schema: vehiculos; Owner: franco
--

COPY vehiculos.tipo_vehiculo (id, descripcion, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: tipo_vehiculo_id_seq; Type: SEQUENCE SET; Schema: vehiculos; Owner: franco
--

SELECT pg_catalog.setval('vehiculos.tipo_vehiculo_id_seq', 1, false);


--
-- Data for Name: vehiculo; Type: TABLE DATA; Schema: vehiculos; Owner: franco
--

COPY vehiculos.vehiculo (id, color, chapa, documentacion, refrigerado, nuevo, fecha_adquisicion, primer_kilometraje, tipo_vehiculo, imagenes_documentos, imagenes_vehiculo, usuario_id, creado_en, anho, capacidad_kg, capacidad_pasajeros, modelo_id) FROM stdin;
\.


--
-- Name: vehiculo_id_seq; Type: SEQUENCE SET; Schema: vehiculos; Owner: franco
--

SELECT pg_catalog.setval('vehiculos.vehiculo_id_seq', 1, false);


--
-- Data for Name: vehiculo_sucursal; Type: TABLE DATA; Schema: vehiculos; Owner: franco
--

COPY vehiculos.vehiculo_sucursal (id, sucursal_id, vehiculo_id, responsable_id, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: vehiculo_sucursal_id_seq; Type: SEQUENCE SET; Schema: vehiculos; Owner: franco
--

SELECT pg_catalog.setval('vehiculos.vehiculo_sucursal_id_seq', 1, false);


--
-- Name: autorizacion_pkey; Type: CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_pkey PRIMARY KEY (id);


--
-- Name: marcacion_pkey; Type: CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.marcacion
    ADD CONSTRAINT marcacion_pkey PRIMARY KEY (id);


--
-- Name: inicio_sesion_pkey; Type: CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.inicio_sesion
    ADD CONSTRAINT inicio_sesion_pkey PRIMARY KEY (id);


--
-- Name: local_pkey; Type: CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_pkey PRIMARY KEY (id);


--
-- Name: cargo_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.cargo
    ADD CONSTRAINT cargo_pkey PRIMARY KEY (id);


--
-- Name: sucursal_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sucursal
    ADD CONSTRAINT sucursal_pkey PRIMARY KEY (id);


--
-- Name: equipo_pkey; Type: CONSTRAINT; Schema: equipos; Owner: franco
--

ALTER TABLE ONLY equipos.equipo
    ADD CONSTRAINT equipo_pkey PRIMARY KEY (id);


--
-- Name: tipo_equipo_pkey; Type: CONSTRAINT; Schema: equipos; Owner: franco
--

ALTER TABLE ONLY equipos.tipo_equipo
    ADD CONSTRAINT tipo_equipo_pkey PRIMARY KEY (id);


--
-- Name: banco_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.banco
    ADD CONSTRAINT banco_pkey PRIMARY KEY (id);


--
-- Name: cambio_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio
    ADD CONSTRAINT cambio_pkey PRIMARY KEY (id);


--
-- Name: cuenta_bancaria_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_pkey PRIMARY KEY (id);


--
-- Name: forma_pago_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.forma_pago
    ADD CONSTRAINT forma_pago_pkey PRIMARY KEY (id);


--
-- Name: moneda_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda
    ADD CONSTRAINT moneda_pkey PRIMARY KEY (id);


--
-- Name: barrio_pkey; Type: CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.barrio
    ADD CONSTRAINT barrio_pkey PRIMARY KEY (id);


--
-- Name: ciudad_pkey; Type: CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.ciudad
    ADD CONSTRAINT ciudad_pkey PRIMARY KEY (id);


--
-- Name: contacto_pkey; Type: CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_pkey PRIMARY KEY (id);


--
-- Name: pais_pkey; Type: CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.pais
    ADD CONSTRAINT pais_pkey PRIMARY KEY (id);


--
-- Name: compra_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_pkey PRIMARY KEY (id);


--
-- Name: compra_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_pkey PRIMARY KEY (id);


--
-- Name: delivery_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_pkey PRIMARY KEY (id);


--
-- Name: entrada_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_pkey PRIMARY KEY (id);


--
-- Name: entrada_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada
    ADD CONSTRAINT entrada_pkey PRIMARY KEY (id);


--
-- Name: motivo_diferencia_pedido_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido
    ADD CONSTRAINT motivo_diferencia_pedido_pkey PRIMARY KEY (id);


--
-- Name: movimientos_stock_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimientos_stock_pkey PRIMARY KEY (id);


--
-- Name: necesidad_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.necesidad_item
    ADD CONSTRAINT necesidad_item_pkey PRIMARY KEY (id);


--
-- Name: necesidad_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.necesidad
    ADD CONSTRAINT necesidad_pkey PRIMARY KEY (id);


--
-- Name: nota_pedido_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_pedido
    ADD CONSTRAINT nota_pedido_pkey PRIMARY KEY (id);


--
-- Name: pedido_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_pkey PRIMARY KEY (id);


--
-- Name: pedido_item_sucursal_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item_sucursal
    ADD CONSTRAINT pedido_item_sucursal_pkey PRIMARY KEY (id);


--
-- Name: pedido_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_pkey PRIMARY KEY (id);


--
-- Name: precio_delivery_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.precio_delivery
    ADD CONSTRAINT precio_delivery_pkey PRIMARY KEY (id);


--
-- Name: salida_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_pkey PRIMARY KEY (id);


--
-- Name: salida_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida
    ADD CONSTRAINT salida_pkey PRIMARY KEY (id);


--
-- Name: venta_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_pkey PRIMARY KEY (id);


--
-- Name: venta_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_pkey PRIMARY KEY (id);


--
-- Name: vuelto_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto_item
    ADD CONSTRAINT vuelto_item_pkey PRIMARY KEY (id);


--
-- Name: vuelto_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto
    ADD CONSTRAINT vuelto_pkey PRIMARY KEY (id);


--
-- Name: cliente_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id);


--
-- Name: funcionario_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_pkey PRIMARY KEY (id);


--
-- Name: persona_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.persona
    ADD CONSTRAINT persona_pkey PRIMARY KEY (id);


--
-- Name: proveedor_dias_visita_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.proveedor_dias_visita
    ADD CONSTRAINT proveedor_dias_visita_pkey PRIMARY KEY (id);


--
-- Name: proveedor_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.proveedor
    ADD CONSTRAINT proveedor_pkey PRIMARY KEY (id);


--
-- Name: role_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: usuario_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: usuario_role_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario_role
    ADD CONSTRAINT usuario_role_pkey PRIMARY KEY (id);


--
-- Name: vendedor_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.vendedor
    ADD CONSTRAINT vendedor_pkey PRIMARY KEY (id);


--
-- Name: vendedor_proveedor_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.vendedor_proveedor
    ADD CONSTRAINT vendedor_proveedor_pkey PRIMARY KEY (id);


--
-- Name: codigo_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_pkey PRIMARY KEY (id);


--
-- Name: codigo_tipo_precio_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo_tipo_precio
    ADD CONSTRAINT codigo_tipo_precio_pkey PRIMARY KEY (id);


--
-- Name: codigo_un; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_un UNIQUE (codigo);


--
-- Name: codigo_un_presentacion_principal; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_un_presentacion_principal UNIQUE (principal, presentacion_id);


--
-- Name: costos_por_sucursal_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costos_por_sucursal
    ADD CONSTRAINT costos_por_sucursal_pkey PRIMARY KEY (id);


--
-- Name: familia_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.familia
    ADD CONSTRAINT familia_pkey PRIMARY KEY (id);


--
-- Name: familia_un; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.familia
    ADD CONSTRAINT familia_un UNIQUE (posicion);


--
-- Name: imagenes_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_imagen
    ADD CONSTRAINT imagenes_pkey PRIMARY KEY (id);


--
-- Name: pdv_categoria_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_categoria
    ADD CONSTRAINT pdv_categoria_pkey PRIMARY KEY (id);


--
-- Name: pdv_grupo_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_grupo
    ADD CONSTRAINT pdv_grupo_pkey PRIMARY KEY (id);


--
-- Name: pdv_grupos_productos_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_grupos_productos
    ADD CONSTRAINT pdv_grupos_productos_pkey PRIMARY KEY (id);


--
-- Name: precio_por_sucursal_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_pkey PRIMARY KEY (id);


--
-- Name: precio_por_sucursal_un_presentacion_tipo_precio; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_un_presentacion_tipo_precio UNIQUE (presentacion_id, tipo_precio_id);


--
-- Name: presentacion_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.presentacion
    ADD CONSTRAINT presentacion_pkey PRIMARY KEY (id);


--
-- Name: producto_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id);


--
-- Name: producto_por_sucursal_pk; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_por_sucursal
    ADD CONSTRAINT producto_por_sucursal_pk PRIMARY KEY (id);


--
-- Name: producto_proveedor_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_proveedor
    ADD CONSTRAINT producto_proveedor_pkey PRIMARY KEY (id);


--
-- Name: producto_un_producto; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto
    ADD CONSTRAINT producto_un_producto UNIQUE (descripcion);


--
-- Name: subfamilia_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.subfamilia
    ADD CONSTRAINT subfamilia_pkey PRIMARY KEY (id);


--
-- Name: tipo_precio_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.tipo_precio
    ADD CONSTRAINT tipo_precio_pkey PRIMARY KEY (id);


--
-- Name: tipo_presentacion_pkey; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.tipo_presentacion
    ADD CONSTRAINT tipo_presentacion_pkey PRIMARY KEY (id);


--
-- Name: producto_proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: franco
--

ALTER TABLE ONLY public.producto_proveedor
    ADD CONSTRAINT producto_proveedor_pkey PRIMARY KEY (id);


--
-- Name: marca_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.marca
    ADD CONSTRAINT marca_pkey PRIMARY KEY (id);


--
-- Name: modelo_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.modelo
    ADD CONSTRAINT modelo_pkey PRIMARY KEY (id);


--
-- Name: tipo_vehiculo_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.tipo_vehiculo
    ADD CONSTRAINT tipo_vehiculo_pkey PRIMARY KEY (id);


--
-- Name: vehiculo_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo
    ADD CONSTRAINT vehiculo_pkey PRIMARY KEY (id);


--
-- Name: vehiculo_sucursal_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal
    ADD CONSTRAINT vehiculo_sucursal_pkey PRIMARY KEY (id);


--
-- Name: bucardo_delta_names_unique; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE UNIQUE INDEX bucardo_delta_names_unique ON bucardo.bucardo_delta_names USING btree (sync, tablename);


--
-- Name: bucardo_delta_target_unique; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX bucardo_delta_target_unique ON bucardo.bucardo_delta_targets USING btree (tablename, target);


--
-- Name: bucardo_sequences_tablename; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE UNIQUE INDEX bucardo_sequences_tablename ON bucardo.bucardo_sequences USING btree (schemaname, seqname, syncname, targetname);


--
-- Name: bucardo_truncate_trigger_index; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX bucardo_truncate_trigger_index ON bucardo.bucardo_truncate_trigger USING btree (sync, tablename) WHERE (replicated IS NULL);


--
-- Name: dex1_productos_codigo; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex1_productos_codigo ON bucardo.delta_productos_codigo USING btree (txntime);


--
-- Name: dex1_productos_costos_por_sucursal; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex1_productos_costos_por_sucursal ON bucardo.delta_productos_costos_por_sucursal USING btree (txntime);


--
-- Name: dex1_productos_familia; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex1_productos_familia ON bucardo.delta_productos_familia USING btree (txntime);


--
-- Name: dex1_productos_precio_por_sucursal; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex1_productos_precio_por_sucursal ON bucardo.delta_productos_precio_por_sucursal USING btree (txntime);


--
-- Name: dex1_productos_producto; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex1_productos_producto ON bucardo.delta_productos_producto USING btree (txntime);


--
-- Name: dex1_productos_subfamilia; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex1_productos_subfamilia ON bucardo.delta_productos_subfamilia USING btree (txntime);


--
-- Name: dex1_productos_tipo_precio; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex1_productos_tipo_precio ON bucardo.delta_productos_tipo_precio USING btree (txntime);


--
-- Name: dex2_productos_codigo; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex2_productos_codigo ON bucardo.delta_productos_codigo USING btree (id);


--
-- Name: dex2_productos_costos_por_sucursal; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex2_productos_costos_por_sucursal ON bucardo.delta_productos_costos_por_sucursal USING btree (id);


--
-- Name: dex2_productos_familia; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex2_productos_familia ON bucardo.delta_productos_familia USING btree (id);


--
-- Name: dex2_productos_precio_por_sucursal; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex2_productos_precio_por_sucursal ON bucardo.delta_productos_precio_por_sucursal USING btree (id);


--
-- Name: dex2_productos_producto; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex2_productos_producto ON bucardo.delta_productos_producto USING btree (id);


--
-- Name: dex2_productos_subfamilia; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex2_productos_subfamilia ON bucardo.delta_productos_subfamilia USING btree (id);


--
-- Name: dex2_productos_tipo_precio; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex2_productos_tipo_precio ON bucardo.delta_productos_tipo_precio USING btree (id);


--
-- Name: dex3_productos_codigo; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex3_productos_codigo ON bucardo.track_productos_codigo USING btree (target text_pattern_ops, txntime);


--
-- Name: dex3_productos_costos_por_sucursal; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex3_productos_costos_por_sucursal ON bucardo.track_productos_costos_por_sucursal USING btree (target text_pattern_ops, txntime);


--
-- Name: dex3_productos_familia; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex3_productos_familia ON bucardo.track_productos_familia USING btree (target text_pattern_ops, txntime);


--
-- Name: dex3_productos_precio_por_sucursal; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex3_productos_precio_por_sucursal ON bucardo.track_productos_precio_por_sucursal USING btree (target text_pattern_ops, txntime);


--
-- Name: dex3_productos_producto; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex3_productos_producto ON bucardo.track_productos_producto USING btree (target text_pattern_ops, txntime);


--
-- Name: dex3_productos_subfamilia; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex3_productos_subfamilia ON bucardo.track_productos_subfamilia USING btree (target text_pattern_ops, txntime);


--
-- Name: dex3_productos_tipo_precio; Type: INDEX; Schema: bucardo; Owner: franco
--

CREATE INDEX dex3_productos_tipo_precio ON bucardo.track_productos_tipo_precio USING btree (target text_pattern_ops, txntime);


--
-- Name: bucardo_delta_namemaker; Type: TRIGGER; Schema: bucardo; Owner: franco
--

CREATE TRIGGER bucardo_delta_namemaker BEFORE INSERT OR UPDATE ON bucardo.bucardo_delta_names FOR EACH ROW EXECUTE PROCEDURE bucardo.bucardo_delta_names_helper();


--
-- Name: bucardo_delta; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_delta AFTER INSERT OR DELETE OR UPDATE ON productos.codigo FOR EACH ROW EXECUTE PROCEDURE bucardo.delta_productos_codigo();


--
-- Name: bucardo_delta; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_delta AFTER INSERT OR DELETE OR UPDATE ON productos.costos_por_sucursal FOR EACH ROW EXECUTE PROCEDURE bucardo.delta_productos_costos_por_sucursal();


--
-- Name: bucardo_delta; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_delta AFTER INSERT OR DELETE OR UPDATE ON productos.familia FOR EACH ROW EXECUTE PROCEDURE bucardo.delta_productos_familia();


--
-- Name: bucardo_delta; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_delta AFTER INSERT OR DELETE OR UPDATE ON productos.precio_por_sucursal FOR EACH ROW EXECUTE PROCEDURE bucardo.delta_productos_precio_por_sucursal();


--
-- Name: bucardo_delta; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_delta AFTER INSERT OR DELETE OR UPDATE ON productos.producto FOR EACH ROW EXECUTE PROCEDURE bucardo.delta_productos_producto();


--
-- Name: bucardo_delta; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_delta AFTER INSERT OR DELETE OR UPDATE ON productos.subfamilia FOR EACH ROW EXECUTE PROCEDURE bucardo.delta_productos_subfamilia();


--
-- Name: bucardo_delta; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_delta AFTER INSERT OR DELETE OR UPDATE ON productos.tipo_precio FOR EACH ROW EXECUTE PROCEDURE bucardo.delta_productos_tipo_precio();


--
-- Name: bucardo_kick_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_kick_general_sync AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON productos.codigo FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_kick_general_sync();


--
-- Name: bucardo_kick_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_kick_general_sync AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON productos.costos_por_sucursal FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_kick_general_sync();


--
-- Name: bucardo_kick_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_kick_general_sync AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON productos.familia FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_kick_general_sync();


--
-- Name: bucardo_kick_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_kick_general_sync AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON productos.precio_por_sucursal FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_kick_general_sync();


--
-- Name: bucardo_kick_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_kick_general_sync AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON productos.producto FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_kick_general_sync();


--
-- Name: bucardo_kick_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_kick_general_sync AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON productos.subfamilia FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_kick_general_sync();


--
-- Name: bucardo_kick_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_kick_general_sync AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON productos.tipo_precio FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_kick_general_sync();


--
-- Name: bucardo_note_trunc_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_note_trunc_general_sync AFTER TRUNCATE ON productos.codigo FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_note_truncation('general_sync');


--
-- Name: bucardo_note_trunc_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_note_trunc_general_sync AFTER TRUNCATE ON productos.costos_por_sucursal FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_note_truncation('general_sync');


--
-- Name: bucardo_note_trunc_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_note_trunc_general_sync AFTER TRUNCATE ON productos.familia FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_note_truncation('general_sync');


--
-- Name: bucardo_note_trunc_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_note_trunc_general_sync AFTER TRUNCATE ON productos.precio_por_sucursal FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_note_truncation('general_sync');


--
-- Name: bucardo_note_trunc_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_note_trunc_general_sync AFTER TRUNCATE ON productos.producto FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_note_truncation('general_sync');


--
-- Name: bucardo_note_trunc_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_note_trunc_general_sync AFTER TRUNCATE ON productos.subfamilia FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_note_truncation('general_sync');


--
-- Name: bucardo_note_trunc_general_sync; Type: TRIGGER; Schema: productos; Owner: franco
--

CREATE TRIGGER bucardo_note_trunc_general_sync AFTER TRUNCATE ON productos.tipo_precio FOR EACH STATEMENT EXECUTE PROCEDURE bucardo.bucardo_note_truncation('general_sync');


--
-- Name: autorizacion_autorizador_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_autorizador_id_fkey FOREIGN KEY (autorizador_id) REFERENCES personas.funcionario(id);


--
-- Name: autorizacion_autorizador_id_fkey1; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_autorizador_id_fkey1 FOREIGN KEY (autorizador_id) REFERENCES personas.funcionario(id);


--
-- Name: autorizacion_autorizador_id_fkey2; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_autorizador_id_fkey2 FOREIGN KEY (autorizador_id) REFERENCES personas.funcionario(id);


--
-- Name: autorizacion_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES personas.funcionario(id);


--
-- Name: autorizacion_funcionario_id_fkey1; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_funcionario_id_fkey1 FOREIGN KEY (funcionario_id) REFERENCES personas.funcionario(id);


--
-- Name: autorizacion_funcionario_id_fkey2; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_funcionario_id_fkey2 FOREIGN KEY (funcionario_id) REFERENCES personas.funcionario(id);


--
-- Name: autorizacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: autorizacion_usuario_id_fkey1; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_usuario_id_fkey1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: autorizacion_usuario_id_fkey2; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_usuario_id_fkey2 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: marcacion_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.marcacion
    ADD CONSTRAINT marcacion_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: marcacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.marcacion
    ADD CONSTRAINT marcacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: marcacion_usuario_id_fkey1; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.marcacion
    ADD CONSTRAINT marcacion_usuario_id_fkey1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: marcacion_usuario_id_fkey2; Type: FK CONSTRAINT; Schema: administrativo; Owner: franco
--

ALTER TABLE ONLY administrativo.marcacion
    ADD CONSTRAINT marcacion_usuario_id_fkey2 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: inicio_sesion_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.inicio_sesion
    ADD CONSTRAINT inicio_sesion_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: local_equipo_id_fkey; Type: FK CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES equipos.equipo(id);


--
-- Name: local_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: local_usuario_id_fkey; Type: FK CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: local_usuario_id_fkey1; Type: FK CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_usuario_id_fkey1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: cargo_supervisado_por_id_fkey; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.cargo
    ADD CONSTRAINT cargo_supervisado_por_id_fkey FOREIGN KEY (supervisado_por_id) REFERENCES empresarial.cargo(id);


--
-- Name: cargo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.cargo
    ADD CONSTRAINT cargo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: sucursal_ciudad_id_fkey; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sucursal
    ADD CONSTRAINT sucursal_ciudad_id_fkey FOREIGN KEY (ciudad_id) REFERENCES general.ciudad(id);


--
-- Name: sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sucursal
    ADD CONSTRAINT sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: equipo_tipo_equipo_id_fkey; Type: FK CONSTRAINT; Schema: equipos; Owner: franco
--

ALTER TABLE ONLY equipos.equipo
    ADD CONSTRAINT equipo_tipo_equipo_id_fkey FOREIGN KEY (tipo_equipo_id) REFERENCES equipos.equipo(id);


--
-- Name: equipo_tipo_equipo_id_fkey1; Type: FK CONSTRAINT; Schema: equipos; Owner: franco
--

ALTER TABLE ONLY equipos.equipo
    ADD CONSTRAINT equipo_tipo_equipo_id_fkey1 FOREIGN KEY (tipo_equipo_id) REFERENCES equipos.tipo_equipo(id);


--
-- Name: equipo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: equipos; Owner: franco
--

ALTER TABLE ONLY equipos.equipo
    ADD CONSTRAINT equipo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: cambio_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio
    ADD CONSTRAINT cambio_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: cambio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio
    ADD CONSTRAINT cambio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: cuenta_bancaria_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_fk FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: cuenta_bancaria_fk__persona; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_fk__persona FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: cuenta_bancaria_fk_banco; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_fk_banco FOREIGN KEY (banco_id) REFERENCES financiero.banco(id);


--
-- Name: cuenta_bancaria_fk_usuario; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: forma_pago_cuenta_bancaria_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.forma_pago
    ADD CONSTRAINT forma_pago_cuenta_bancaria_id_fkey FOREIGN KEY (cuenta_bancaria_id) REFERENCES financiero.cuenta_bancaria(id);


--
-- Name: forma_pago_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.forma_pago
    ADD CONSTRAINT forma_pago_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: moneda_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda
    ADD CONSTRAINT moneda_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: moneda_pais_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda
    ADD CONSTRAINT moneda_pais_id_fkey FOREIGN KEY (pais_id) REFERENCES general.pais(id);


--
-- Name: barrio_ciudad_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.barrio
    ADD CONSTRAINT barrio_ciudad_id_fkey FOREIGN KEY (ciudad_id) REFERENCES general.ciudad(id);


--
-- Name: barrio_precio_delivery_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.barrio
    ADD CONSTRAINT barrio_precio_delivery_id_fkey FOREIGN KEY (precio_delivery_id) REFERENCES operaciones.precio_delivery(id);


--
-- Name: barrio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.barrio
    ADD CONSTRAINT barrio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: ciudad_pais_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.ciudad
    ADD CONSTRAINT ciudad_pais_id_fkey FOREIGN KEY (pais_id) REFERENCES general.pais(id);


--
-- Name: ciudad_usuario_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.ciudad
    ADD CONSTRAINT ciudad_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: contacto_persona_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: contacto_persona_id_fkey1; Type: FK CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_persona_id_fkey1 FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: contacto_usuario_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: contacto_usuario_id_fkey1; Type: FK CONSTRAINT; Schema: general; Owner: franco
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_usuario_id_fkey1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: compra_contacto_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_contacto_proveedor_id_fkey FOREIGN KEY (contacto_proveedor_id) REFERENCES personas.persona(id);


--
-- Name: compra_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_fk FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id);


--
-- Name: compra_item_compra_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES operaciones.compra(id);


--
-- Name: compra_item_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: compra_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: compra_moneda_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: compra_pedido_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id);


--
-- Name: compra_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id);


--
-- Name: compra_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: compra_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: delivery_cliente_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id);


--
-- Name: delivery_entregador_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_entregador_id_fkey FOREIGN KEY (entregador_id) REFERENCES personas.funcionario(id);


--
-- Name: delivery_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_fk FOREIGN KEY (barrio_id) REFERENCES general.barrio(id);


--
-- Name: delivery_forma_pago_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_forma_pago_id_fkey FOREIGN KEY (forma_pago_id) REFERENCES operaciones.precio_delivery(id);


--
-- Name: delivery_forma_pago_id_fkey1; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_forma_pago_id_fkey1 FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id);


--
-- Name: delivery_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: delivery_venta_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES operaciones.venta(id);


--
-- Name: delivery_vuelto_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_vuelto_fk FOREIGN KEY (vuelto_id) REFERENCES operaciones.vuelto(id);


--
-- Name: entrada_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada
    ADD CONSTRAINT entrada_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: entrada_fk_responsable; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada
    ADD CONSTRAINT entrada_fk_responsable FOREIGN KEY (responsable_carga_id) REFERENCES personas.usuario(id);


--
-- Name: entrada_fk_usuario; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada
    ADD CONSTRAINT entrada_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: entrada_item_fk_entrada; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_fk_entrada FOREIGN KEY (entrada_id) REFERENCES operaciones.entrada(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: entrada_item_fk_presentacion; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_fk_presentacion FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


--
-- Name: entrada_item_fk_producto; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_fk_producto FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: entrada_item_fk_usuario; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: motivo_diferencia_pedido_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido
    ADD CONSTRAINT motivo_diferencia_pedido_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: movimientos_stock_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimientos_stock_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: movimientos_stock_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimientos_stock_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: movimientos_stock_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimientos_stock_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: necesidad_item_necesidad_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.necesidad_item
    ADD CONSTRAINT necesidad_item_necesidad_id_fkey FOREIGN KEY (necesidad_id) REFERENCES operaciones.necesidad(id);


--
-- Name: necesidad_item_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.necesidad_item
    ADD CONSTRAINT necesidad_item_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: necesidad_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.necesidad_item
    ADD CONSTRAINT necesidad_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: necesidad_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.necesidad
    ADD CONSTRAINT necesidad_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: necesidad_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.necesidad
    ADD CONSTRAINT necesidad_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: nota_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_pedido
    ADD CONSTRAINT nota_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id);


--
-- Name: nota_pedido_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_pedido
    ADD CONSTRAINT nota_pedido_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pedido_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_fk FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id);


--
-- Name: pedido_item_nota_pedido_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_nota_pedido_fkey FOREIGN KEY (nota_pedido_id) REFERENCES operaciones.nota_pedido(id);


--
-- Name: pedido_item_pedido_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id);


--
-- Name: pedido_item_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: pedido_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pedido_moneda_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: pedido_necesidad_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_necesidad_id_fkey FOREIGN KEY (necesidad_id) REFERENCES operaciones.necesidad(id);


--
-- Name: pedido_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id);


--
-- Name: pedido_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pedido_vendedor_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_vendedor_fk FOREIGN KEY (vendedor_id) REFERENCES personas.vendedor(id);


--
-- Name: precio_delivery_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.precio_delivery
    ADD CONSTRAINT precio_delivery_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: salida_fk_responsable; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida
    ADD CONSTRAINT salida_fk_responsable FOREIGN KEY (responsable_carga_id) REFERENCES personas.usuario(id);


--
-- Name: salida_fk_sucursal; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida
    ADD CONSTRAINT salida_fk_sucursal FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: salida_fk_usuario; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida
    ADD CONSTRAINT salida_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: salida_item_fk_1_producto; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_fk_1_producto FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: salida_item_fk_presentacion; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_fk_presentacion FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


--
-- Name: salida_item_fk_salida; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_fk_salida FOREIGN KEY (salida_id) REFERENCES operaciones.salida(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: salida_item_fk_usuario; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: venta_cliente_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id);


--
-- Name: venta_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_fk FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id);


--
-- Name: venta_item_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: venta_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: venta_item_venta_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES operaciones.venta(id);


--
-- Name: venta_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: vuelto_autorizado_por_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto
    ADD CONSTRAINT vuelto_autorizado_por_id_fkey FOREIGN KEY (autorizado_por_id) REFERENCES personas.funcionario(id);


--
-- Name: vuelto_item_moneda_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto_item
    ADD CONSTRAINT vuelto_item_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: vuelto_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto_item
    ADD CONSTRAINT vuelto_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: vuelto_item_vuelto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto_item
    ADD CONSTRAINT vuelto_item_vuelto_id_fkey FOREIGN KEY (vuelto_id) REFERENCES operaciones.vuelto(id);


--
-- Name: vuelto_responsable_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto
    ADD CONSTRAINT vuelto_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id);


--
-- Name: vuelto_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.vuelto
    ADD CONSTRAINT vuelto_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: cliente_persona_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.cliente
    ADD CONSTRAINT cliente_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: cliente_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.cliente
    ADD CONSTRAINT cliente_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: funcionario_cargo_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES empresarial.cargo(id);


--
-- Name: funcionario_persona_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: funcionario_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: funcionario_supervisado_por_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_supervisado_por_id_fkey FOREIGN KEY (supervisado_por_id) REFERENCES personas.funcionario(id);


--
-- Name: funcionario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: persona_ciudad_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.persona
    ADD CONSTRAINT persona_ciudad_id_fkey FOREIGN KEY (ciudad_id) REFERENCES general.ciudad(id);


--
-- Name: persona_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.persona
    ADD CONSTRAINT persona_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: proveedor_dias_visita_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.proveedor_dias_visita
    ADD CONSTRAINT proveedor_dias_visita_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id);


--
-- Name: proveedor_dias_visita_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.proveedor_dias_visita
    ADD CONSTRAINT proveedor_dias_visita_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: proveedor_funcionario_encargado_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.proveedor
    ADD CONSTRAINT proveedor_funcionario_encargado_id_fkey FOREIGN KEY (funcionario_encargado_id) REFERENCES personas.funcionario(id);


--
-- Name: proveedor_persona_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.proveedor
    ADD CONSTRAINT proveedor_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: proveedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.proveedor
    ADD CONSTRAINT proveedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: role_fk; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: usuario_persona_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: usuario_role_fk; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario_role
    ADD CONSTRAINT usuario_role_fk FOREIGN KEY (role_id) REFERENCES personas.role(id);


--
-- Name: usuario_role_fk_1; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario_role
    ADD CONSTRAINT usuario_role_fk_1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: usuario_role_fk_2; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario_role
    ADD CONSTRAINT usuario_role_fk_2 FOREIGN KEY (user_id) REFERENCES personas.usuario(id);


--
-- Name: usuario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: vendedor_persona_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.vendedor
    ADD CONSTRAINT vendedor_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: vendedor_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.vendedor_proveedor
    ADD CONSTRAINT vendedor_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id);


--
-- Name: vendedor_proveedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.vendedor_proveedor
    ADD CONSTRAINT vendedor_proveedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: vendedor_proveedor_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.vendedor_proveedor
    ADD CONSTRAINT vendedor_proveedor_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES personas.vendedor(id);


--
-- Name: vendedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.vendedor
    ADD CONSTRAINT vendedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: codigo_fk; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: codigo_tipo_precio_fk; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo_tipo_precio
    ADD CONSTRAINT codigo_tipo_precio_fk FOREIGN KEY (codigo_id) REFERENCES productos.codigo(id);


--
-- Name: codigo_tipo_precio_fk_1; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo_tipo_precio
    ADD CONSTRAINT codigo_tipo_precio_fk_1 FOREIGN KEY (id) REFERENCES productos.tipo_precio(id);


--
-- Name: codigo_tipo_precio_fk_2; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo_tipo_precio
    ADD CONSTRAINT codigo_tipo_precio_fk_2 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: codigo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: costos_por_sucursal_moneda_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costos_por_sucursal
    ADD CONSTRAINT costos_por_sucursal_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: costos_por_sucursal_movimiento_stock_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costos_por_sucursal
    ADD CONSTRAINT costos_por_sucursal_movimiento_stock_id_fkey FOREIGN KEY (movimiento_stock_id) REFERENCES operaciones.movimiento_stock(id);


--
-- Name: costos_por_sucursal_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costos_por_sucursal
    ADD CONSTRAINT costos_por_sucursal_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: costos_por_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costos_por_sucursal
    ADD CONSTRAINT costos_por_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: costos_por_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costos_por_sucursal
    ADD CONSTRAINT costos_por_sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: familia_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.familia
    ADD CONSTRAINT familia_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pdv_categoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_categoria
    ADD CONSTRAINT pdv_categoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pdv_grupo_categoria_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_grupo
    ADD CONSTRAINT pdv_grupo_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES productos.pdv_categoria(id);


--
-- Name: pdv_grupo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_grupo
    ADD CONSTRAINT pdv_grupo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pdv_grupos_productos_grupo_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_grupos_productos
    ADD CONSTRAINT pdv_grupos_productos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES productos.pdv_grupo(id);


--
-- Name: pdv_grupos_productos_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_grupos_productos
    ADD CONSTRAINT pdv_grupos_productos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: pdv_grupos_productos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.pdv_grupos_productos
    ADD CONSTRAINT pdv_grupos_productos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: precio_por_sucursal_fk; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: precio_por_sucursal_fk_1; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_fk_1 FOREIGN KEY (tipo_precio_id) REFERENCES productos.tipo_precio(id);


--
-- Name: precio_por_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: precio_por_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: presentacion_fk; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.presentacion
    ADD CONSTRAINT presentacion_fk FOREIGN KEY (tipo_presentacion_id) REFERENCES productos.tipo_presentacion(id);


--
-- Name: presentacion_fk_1; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.presentacion
    ADD CONSTRAINT presentacion_fk_1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: presentacion_fk_producto; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.presentacion
    ADD CONSTRAINT presentacion_fk_producto FOREIGN KEY (producto_id) REFERENCES productos.producto(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: producto_imagen_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_imagen
    ADD CONSTRAINT producto_imagen_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: producto_imagen_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_imagen
    ADD CONSTRAINT producto_imagen_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: producto_proveedor_pedido_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_proveedor
    ADD CONSTRAINT producto_proveedor_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id);


--
-- Name: producto_proveedor_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_proveedor
    ADD CONSTRAINT producto_proveedor_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: producto_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_proveedor
    ADD CONSTRAINT producto_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id);


--
-- Name: producto_proveedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_proveedor
    ADD CONSTRAINT producto_proveedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: producto_sub_familia_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto
    ADD CONSTRAINT producto_sub_familia_id_fkey FOREIGN KEY (sub_familia_id) REFERENCES productos.subfamilia(id);


--
-- Name: productos_por_sucursal_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_por_sucursal
    ADD CONSTRAINT productos_por_sucursal_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: productos_por_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_por_sucursal
    ADD CONSTRAINT productos_por_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: productos_por_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto_por_sucursal
    ADD CONSTRAINT productos_por_sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: subfamilia_familia_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.subfamilia
    ADD CONSTRAINT subfamilia_familia_id_fkey FOREIGN KEY (familia_id) REFERENCES productos.familia(id);


--
-- Name: subfamilia_subfamilia_fk; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.subfamilia
    ADD CONSTRAINT subfamilia_subfamilia_fk FOREIGN KEY (sub_familia_id) REFERENCES productos.subfamilia(id);


--
-- Name: subfamilia_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.subfamilia
    ADD CONSTRAINT subfamilia_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: tipo_precio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.tipo_precio
    ADD CONSTRAINT tipo_precio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: tipo_presentacion_fk; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.tipo_presentacion
    ADD CONSTRAINT tipo_presentacion_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: marca_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.marca
    ADD CONSTRAINT marca_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: modelo_marca_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.modelo
    ADD CONSTRAINT modelo_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES vehiculos.marca(id);


--
-- Name: modelo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.modelo
    ADD CONSTRAINT modelo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: tipo_vehiculo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.tipo_vehiculo
    ADD CONSTRAINT tipo_vehiculo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: vehiculo_modelo_fk; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo
    ADD CONSTRAINT vehiculo_modelo_fk FOREIGN KEY (modelo_id) REFERENCES vehiculos.modelo(id);


--
-- Name: vehiculo_sucursal_responsable_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal
    ADD CONSTRAINT vehiculo_sucursal_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id);


--
-- Name: vehiculo_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal
    ADD CONSTRAINT vehiculo_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: vehiculo_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal
    ADD CONSTRAINT vehiculo_sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: vehiculo_tipo_vehiculo_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo
    ADD CONSTRAINT vehiculo_tipo_vehiculo_fkey FOREIGN KEY (tipo_vehiculo) REFERENCES vehiculos.vehiculo(id);


--
-- Name: vehiculo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: franco
--

ALTER TABLE ONLY vehiculos.vehiculo
    ADD CONSTRAINT vehiculo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: franco
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM franco;
GRANT ALL ON SCHEMA public TO franco;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

