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
-- Name: tipo_movimiento; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.tipo_movimiento AS ENUM (
    'COMPRA',
    'VENTA',
    'DEVOLUCION',
    'DESCARTE',
    'AJUSTE',
    'TRANSFERENCIA',
    'CALCULO'
);


ALTER TYPE operaciones.tipo_movimiento OWNER TO franco;

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
    deposito_predeterminado boolean DEFAULT false
);


ALTER TABLE empresarial.sucursal OWNER TO franco;

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
    tipo_cuenta character varying,
    moneda_id bigint,
    numero character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
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
    moviemienta_caja boolean DEFAULT false,
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
    forma_pago operaciones.pedido_forma_pago,
    fecha_de_entrega timestamp without time zone,
    moneda_id bigint,
    descuento numeric DEFAULT 0,
    estado operaciones.compra_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
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
    producto_id bigint,
    codigo_id bigint,
    tipo_movimiento operaciones.tipo_movimiento,
    referencia bigint,
    cantidad numeric DEFAULT 0,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    estado boolean DEFAULT true,
    sucursal_id bigint
);


ALTER TABLE operaciones.movimiento_stock OWNER TO franco;

--
-- Name: movimientos_stock_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.movimientos_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.movimientos_stock_id_seq OWNER TO franco;

--
-- Name: movimientos_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.movimientos_stock_id_seq OWNED BY operaciones.movimiento_stock.id;


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
    forma_pago operaciones.pedido_forma_pago,
    dias_cheque integer,
    moneda_id bigint,
    descuento numeric DEFAULT 0,
    estado operaciones.pedido_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    cantidad_notas integer,
    cod_interno_proveedor character varying
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
-- Name: venta; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.venta (
    id bigint NOT NULL,
    cliente_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    tipo_venta operaciones.tipo_venta,
    estado operaciones.venta_estado
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
    producto_id bigint,
    cantidad numeric,
    principal boolean DEFAULT false,
    descripcion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    caja boolean DEFAULT false,
    variacion boolean,
    tipo_precio bigint,
    referencia_codigo_id bigint,
    activo boolean DEFAULT true
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
    codigo_id bigint,
    sucursal_id bigint,
    precio numeric,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
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
-- Name: producto; Type: TABLE; Schema: productos; Owner: franco
--

CREATE TABLE productos.producto (
    id bigint NOT NULL,
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
    dias_vencimiento numeric
);


ALTER TABLE productos.producto OWNER TO franco;

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

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido ALTER COLUMN id SET DEFAULT nextval('operaciones.motivo_diferencia_pedido_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.movimiento_stock ALTER COLUMN id SET DEFAULT nextval('operaciones.movimientos_stock_id_seq'::regclass);


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
\.


--
-- Data for Name: delta_productos_costos_por_sucursal; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_costos_por_sucursal (id, txntime) FROM stdin;
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
\.


--
-- Data for Name: delta_productos_producto; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_producto (id, txntime) FROM stdin;
\.


--
-- Data for Name: delta_productos_subfamilia; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_subfamilia (id, txntime) FROM stdin;
\.


--
-- Data for Name: delta_productos_tipo_precio; Type: TABLE DATA; Schema: bucardo; Owner: franco
--

COPY bucardo.delta_productos_tipo_precio (id, txntime) FROM stdin;
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

COPY empresarial.sucursal (id, nombre, localizacion, ciudad_id, usuario_id, creado_en, deposito, deposito_predeterminado) FROM stdin;
3	ROTONDA	\N	1	1	2021-04-19 18:55:04.097784+00	t	f
1	CENTRAL	-24.072157, -54.308287	1	1	2021-02-13 19:28:37.4107+00	t	t
4	INDUSTRIAL	\N	1	1	2021-05-04 18:42:27.039705+00	t	f
5	KM5	\N	1	1	2021-05-04 18:42:27.05715+00	t	f
6	CALLE 10	\N	1	1	2021-05-04 18:42:27.061562+00	t	f
7	KATUETE 1	\N	3	1	2021-05-04 18:45:01.995622+00	t	f
8	PALOMA 1	\N	2	1	2021-05-04 18:45:02.000441+00	t	f
2	ITAIPU	-24.051567, -54.305898	1	1	2021-02-13 19:37:47.164158+00	t	f
9	NUEVA ESPERANZA 1	\N	4	1	2021-05-04 18:45:02.004932+00	t	f
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
\.


--
-- Name: banco_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.banco_id_seq', 1, false);


--
-- Data for Name: cambio; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.cambio (id, moneda_id, valor_en_gs, activo, usuario_id, creado_en) FROM stdin;
1	1	1	t	1	2021-05-31 19:33:15.871604+00
3	3	6800	t	1	2021-05-31 19:33:15.871604+00
4	4	200	t	1	2021-05-31 19:33:15.871604+00
5	2	1100	\N	1	2021-05-31 19:34:22.887556+00
2	2	1000	t	1	2021-05-31 19:33:15.871604+00
\.


--
-- Name: cambio_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.cambio_id_seq', 5, true);


--
-- Data for Name: cuenta_bancaria; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.cuenta_bancaria (id, persona_id, banco_id, tipo_cuenta, moneda_id, numero, usuario_id, creado_en) FROM stdin;
\.


--
-- Name: cuenta_bancaria_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.cuenta_bancaria_id_seq', 1, false);


--
-- Data for Name: forma_pago; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.forma_pago (id, descripcion, activo, moviemienta_caja, cuenta_bancaria_id, autorizacion, creado_en, usuario_id) FROM stdin;
\.


--
-- Name: forma_pago_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.forma_pago_id_seq', 1, false);


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

COPY operaciones.compra (id, pedido_id, sucursal_id, proveedor_id, contacto_proveedor_id, fecha, nro_nota, forma_pago, fecha_de_entrega, moneda_id, descuento, estado, creado_en, usuario_id) FROM stdin;
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
15	\N	85000	1	1	+5958768765	\N	\N	\N	\N	1	ENTREGADO	\N	\N	26
16	\N	170000	2	\N	+5958982738	\N	\N	\N	\N	1	EN_CAMINO	4	\N	27
38	\N	85000	1	\N	+595555555	\N	\N	\N	\N	1	ABIERTO	\N	\N	49
39	\N	85000	1	\N	+595999999	\N	\N	\N	\N	1	ABIERTO	\N	\N	50
40	\N	85000	1	\N	+5950	\N	\N	\N	\N	1	ABIERTO	\N	\N	51
41	\N	85000	1	\N	+595111111	\N	\N	\N	\N	1	ABIERTO	\N	\N	52
17	\N	85000	1	\N	+595479879283	\N	\N	\N	\N	1	ENTREGADO	3	\N	28
36	\N	85000	1	\N	+595777777	\N	\N	\N	\N	1	CANCELADO	\N	\N	47
37	\N	85000	1	\N	+595666666	\N	\N	\N	\N	1	DEVOLVIDO	\N	\N	48
\.


--
-- Name: delivery_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.delivery_id_seq', 41, true);


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

COPY operaciones.movimiento_stock (id, producto_id, codigo_id, tipo_movimiento, referencia, cantidad, creado_en, usuario_id, estado, sucursal_id) FROM stdin;
1	1	\N	COMPRA	1	3400	2021-04-09 03:40:03.302578+00	1	t	1
\.


--
-- Name: movimientos_stock_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.movimientos_stock_id_seq', 10, true);


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
1	t	0	f	1	1	1200	\N	ACTIVO	2021-03-10 02:37:50.749266+00	1	t
2	t	0	f	1	1	1200	\N	ACTIVO	2021-03-10 02:39:43.447432+00	1	f
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

COPY operaciones.pedido (id, necesidad_id, proveedor_id, vendedor_id, fecha_de_entrega, forma_pago, dias_cheque, moneda_id, descuento, estado, creado_en, usuario_id, cantidad_notas, cod_interno_proveedor) FROM stdin;
50	\N	1	1	\N	CHEQUE	\N	1	\N	CONCLUIDO	2021-01-01 03:00:00+00	1	\N	\N
53	\N	1	1	\N	EFECTIVO	\N	1	\N	ACTIVO	2021-03-12 03:00:00+00	2	\N	\N
52	\N	2	2	\N	EFECTIVO	\N	1	\N	EN_VERIFICACION	2021-02-10 03:00:00+00	1	\N	\N
51	\N	1	1	\N	EFECTIVO	\N	1	\N	CANCELADO	2021-01-20 03:00:00+00	1	\N	\N
54	\N	1	1	\N	CHEQUE	\N	1	\N	ABIERTO	2021-04-20 04:00:00+00	1	\N	\N
\.


--
-- Name: pedido_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.pedido_id_seq', 54, true);


--
-- Data for Name: pedido_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.pedido_item (id, pedido_id, producto_id, precio_unitario, descuento_unitario, bonificacion, frio, observacion, estado, creado_en, usuario_id, nota_pedido_id, bonificacion_detalle, vencimiento) FROM stdin;
13	50	1	2750	\N	\N	\N	\N	ACTIVO	\N	1	\N	\N	\N
14	51	1	2750	\N	\N	\N	\N	ACTIVO	\N	1	\N	\N	\N
16	53	4	4833.33333333333	\N	\N	\N	\N	ACTIVO	\N	1	\N	\N	\N
17	54	5	9583.33333333333	\N	\N	\N	\N	ACTIVO	\N	1	\N	\N	\N
15	52	5	9166.66666666667	150	\N	\N	\N	ACTIVO	\N	1	\N	\N	\N
\.


--
-- Name: pedido_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.pedido_item_id_seq', 17, true);


--
-- Data for Name: pedido_item_sucursal; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.pedido_item_sucursal (id, pedido_item_id, sucursal_id, sucursal_entrega_id, cantidad, creado_en, usuario_id) FROM stdin;
15	13	3	3	2496	\N	1
16	14	3	3	2496	\N	1
17	14	1	1	1392	\N	1
18	15	4	4	360	\N	1
19	15	5	5	240	\N	1
20	16	1	1	120	\N	1
21	16	4	4	60	\N	1
22	17	5	5	60	\N	1
23	17	1	1	120	\N	1
24	17	6	6	60	\N	1
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
-- Data for Name: venta; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.venta (id, cliente_id, creado_en, usuario_id, tipo_venta, estado) FROM stdin;
1	1	2021-06-09 18:42:39.257333+00	1	EFECTIVO	CONCLUIDA
\.


--
-- Name: venta_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.venta_id_seq', 1, true);


--
-- Data for Name: venta_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.venta_item (id, venta_id, unidad_medida, precio_unitario, costo_unitario, existencia, producto_id, cantidad, creado_en, usuario_id, descuento_unitario) FROM stdin;
2	1	CAJA	4000	3500	80	2	2	2021-06-09 18:45:50.002193+00	1	0
3	1	UNIDAD	13000	11000	65	5	5	2021-06-09 18:47:26.886406+00	1	0
1	1	UNIDAD	3333.3334	2500	100	1	9	2021-06-09 18:45:19.415448+00	1	0
\.


--
-- Name: venta_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.venta_item_id_seq', 3, true);


--
-- Data for Name: vuelto; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.vuelto (id, autorizado_por_id, responsable_id, creado_en, usuario_id, activo) FROM stdin;
26	\N	\N	\N	\N	t
27	\N	\N	\N	\N	t
28	\N	\N	\N	\N	t
47	\N	\N	\N	\N	t
48	\N	\N	\N	\N	t
49	\N	\N	\N	\N	t
50	\N	\N	\N	\N	t
51	\N	\N	\N	\N	t
52	\N	\N	\N	\N	t
\.


--
-- Name: vuelto_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.vuelto_id_seq', 52, true);


--
-- Data for Name: vuelto_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.vuelto_item (id, vuelto_id, valor, moneda_id, creado_en, usuario_id) FROM stdin;
10	26	15000	1	\N	\N
11	27	45.4545454545455	2	\N	\N
12	28	15000	1	\N	\N
31	47	15000	1	\N	\N
32	48	15000	1	\N	\N
33	49	15000	1	\N	\N
34	50	15000	1	\N	\N
35	51	15000	1	\N	\N
36	52	15000	1	\N	\N
\.


--
-- Name: vuelto_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.vuelto_item_id_seq', 36, true);


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
\.


--
-- Name: persona_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.persona_id_seq', 5, true);


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
\.


--
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.usuario_id_seq', 2, true);


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

COPY productos.codigo (id, codigo, producto_id, cantidad, principal, descripcion, usuario_id, creado_en, caja, variacion, tipo_precio, referencia_codigo_id, activo) FROM stdin;
24	2333	2	2	f	\N	\N	2021-05-24 18:05:19.958596+00	f	\N	\N	\N	t
25	3333	2	3	f	\N	\N	2021-05-24 18:05:19.958596+00	f	\N	\N	\N	t
26	4333	2	4	f	\N	\N	2021-05-24 18:05:19.958596+00	f	\N	\N	\N	t
27	5333	2	5	f	\N	\N	2021-05-24 18:05:19.958596+00	f	\N	\N	\N	t
28	6333	2	\N	f	\N	\N	2021-05-24 18:05:19.958596+00	f	\N	\N	20	t
22	N333	2	6	f	\N	\N	2021-05-23 03:39:19.70891+00	t	\N	3	\N	t
1	123	1	1	t	\N	1	2021-03-10 01:27:29.659637+00	f	\N	1	\N	t
19	333	2	1	t	\N	\N	2021-05-23 03:36:40.198639+00	f	\N	1	\N	t
35	123123	9	1	t	\N	\N	\N	f	f	\N	\N	\N
36	6123123	9	6	f	\N	\N	\N	t	f	\N	\N	\N
9	3123	1	3	f	\N	\N	2021-05-20 20:15:20.231391+00	f	t	\N	\N	t
10	4123	1	4	f	\N	\N	2021-05-22 15:59:06.013549+00	f	t	\N	\N	t
11	5123	1	5	f	\N	\N	2021-05-22 15:59:16.962923+00	f	t	\N	\N	t
12	6123	1	6	f	\N	\N	2021-05-22 15:59:32.6493+00	f	t	\N	\N	t
13	7123	1	7	f	\N	\N	2021-05-22 15:59:40.676046+00	f	t	\N	\N	t
14	8123	1	8	f	\N	\N	2021-05-22 15:59:48.982485+00	f	t	\N	\N	t
15	9123	1	9	f	\N	\N	2021-05-22 15:59:59.710154+00	f	t	\N	\N	t
16	10123	1	10	f	\N	\N	2021-05-22 16:00:09.224312+00	f	t	\N	\N	t
17	11123	1	11	f	\N	\N	2021-05-22 16:00:20.196367+00	f	t	\N	\N	t
5	N123	1	12	f	\N	1	2021-03-10 01:30:09.251395+00	t	\N	3	\N	t
4	C123	1	12	t	\N	1	2021-03-10 01:29:38.284401+00	t	\N	2	\N	t
20	C333	2	6	t	\N	\N	2021-05-23 03:36:40.204104+00	t	\N	2	\N	t
37	2123123	9	2	f	\N	\N	\N	f	t	\N	\N	\N
23	12123	1	12	f	\N	\N	\N	f	t	\N	\N	\N
39	7840085000013	14	1	t	\N	\N	\N	f	f	1	\N	t
\.


--
-- Name: codigo_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.codigo_id_seq', 42, true);


--
-- Data for Name: costos_por_sucursal; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.costos_por_sucursal (id, producto_id, sucursal_id, ultimo_precio_compra, ultimo_precio_venta, costo_medio, usuario_id, creado_en, existencia, movimiento_stock_id, moneda_id) FROM stdin;
1	1	1	2333	3000	2333	1	2021-04-12 16:41:02.916902+00	0	1	1
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
1	BRAHMA LATA	t	1	2021-05-21 17:54:42.277821+00	2
2	BRAHMA BOTELLA	t	1	2021-05-21 17:54:55.490977+00	2
3	MILLER LATA	t	1	2021-05-21 17:55:08.254227+00	2
4	MILLER BOTELLA	t	1	2021-05-21 17:55:19.282576+00	2
5	COCA COLA	t	1	2021-05-21 17:55:49.457792+00	3
6	FANTA	t	1	2021-05-21 17:56:02.477356+00	3
\.


--
-- Name: pdv_grupo_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.pdv_grupo_id_seq', 6, true);


--
-- Data for Name: pdv_grupos_productos; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.pdv_grupos_productos (id, producto_id, grupo_id, activo, usuario_id, creado_en) FROM stdin;
1	1	1	t	1	2021-05-21 13:57:09
2	2	5	t	1	2021-05-21 13:58:01
\.


--
-- Name: pdv_grupos_productos_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.pdv_grupos_productos_id_seq', 2, true);


--
-- Data for Name: precio_por_sucursal; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.precio_por_sucursal (id, codigo_id, sucursal_id, precio, usuario_id, creado_en) FROM stdin;
1	1	1	4000	1	2021-03-10 01:31:17.072503+00
11	9	1	3333.3333333	1	2021-05-20 20:15:38.832392+00
16	12	1	3333.3333333	\N	2021-05-22 16:02:01.894662+00
19	15	1	3333.3333333	\N	2021-05-22 16:02:01.894662+00
22	19	1	5000	\N	2021-05-22 16:02:01.894662+00
24	22	1	4300	\N	2021-05-23 03:39:57.789854+00
12	4	1	3333.3333	1	2021-05-22 00:55:42.04947+00
13	5	1	3200	1	2021-05-22 00:55:53.408921+00
14	10	1	3500	\N	2021-05-22 16:02:01.894662+00
15	11	1	3600	\N	2021-05-22 16:02:01.894662+00
17	13	1	3428.5714	\N	2021-05-22 16:02:01.894662+00
18	14	1	3500	\N	2021-05-22 16:02:01.894662+00
20	16	1	3400	\N	2021-05-22 16:02:01.894662+00
21	17	1	3454.5454	\N	2021-05-22 16:02:01.894662+00
26	25	1	4000	\N	2021-05-23 03:39:57.789854+00
27	26	1	4000	\N	2021-05-23 03:39:57.789854+00
28	27	1	4000	\N	2021-05-23 03:39:57.789854+00
25	24	1	4000	\N	2021-05-23 03:39:57.789854+00
30	39	1	12000	\N	\N
\.


--
-- Name: precio_por_sucursal_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.precio_por_sucursal_id_seq', 37, true);


--
-- Data for Name: producto; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.producto (id, descripcion, descripcion_factura, iva, unidad_por_caja, balanza, combo, garantia, ingrediente, promocion, vencimiento, stock, usuario_id, tipo_conservacion, creado_en, sub_familia_id, observacion, cambiable, es_alcoholico, unidad_por_caja_secundaria, imagenes, tiempo_garantia, dias_vencimiento) FROM stdin;
2	COCA COCA 500 ML	\N	10	6	f	f	f	f	f	t	t	1	ENFRIABLE	2021-03-10 00:55:18.269164+00	1	\N	f	f	2	\N	\N	\N
4	FRUGOS NARANJA 1 L	\N	10	6	f	f	f	f	f	t	t	1	ENFRIABLE	2021-04-08 23:38:29.31564+00	\N	\N	f	f	2	\N	\N	\N
5	ESTRELLA GALICIA 650 ML	\N	10	12	f	f	f	f	f	t	t	\N	ENFRIABLE	2021-04-08 23:39:23.096148+00	1	\N	f	f	2	\N	\N	\N
6	COCA COLA 1 L RETORNABLE	\N	10	4	f	f	f	f	f	t	t	\N	ENFRIABLE	2021-04-14 17:35:44.267958+00	2	\N	f	f	2	\N	\N	\N
7	BUDWEISER 66 550 ML	\N	10	6	f	f	f	f	f	t	t	\N	ENFRIABLE	2021-04-14 17:36:40.025937+00	1	\N	f	f	2	\N	\N	\N
1	BRAHMITA CHOPP 269 ML	\N	10	12	f	f	f	f	t	t	t	1	ENFRIABLE	2021-03-10 00:51:49.518773+00	1	ESTE PRODUCTO POSEE PROMOCION 3 X 10 MIL	f	f	2	\N	\N	\N
3	TRIDENT MENTA	\N	10	10	f	f	f	f	f	t	t	1	NO_ENFRIABLE	2021-04-07 02:17:40.588483+00	\N	\N	f	f	2	\N	\N	\N
8	HEINEKEN LATA 355 ML	HEINEKEN LATA 355 ML	10	6	\N	\N	\N	\N	\N	t	\N	\N	ENFRIABLE	\N	\N	\N	\N	f	24	\N	\N	\N
9	HABANERO TIPO MEXICANA SABOR DAS INDIAS	HABANERO TIPO MEXICANA SABOR DAS INDIAS	10	6	f	\N	f	\N	\N	t	t	\N	NO_ENFRIABLE	\N	21	\N	f	f	\N	/productos	30	30
14	HECODULC TRADICIONAL 100ML	HECODULC TRADICIONAL 100ML	10	\N	\N	\N	\N	\N	\N	t	t	\N	NO_ENFRIABLE	\N	21	\N	\N	f	\N	/productos	\N	30
\.


--
-- Name: producto_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.producto_id_seq', 26, true);


--
-- Data for Name: producto_imagen; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.producto_imagen (id, producto_id, ruta, principal, usuario_id, creado_en) FROM stdin;
1	1	productos/brahmitachopp269ml.jpeg	t	1	2021-04-30 17:47:20.975235+00
2	2	productos/cocacola500ml.png	t	1	2021-05-23 03:32:10.979788+00
\.


--
-- Data for Name: producto_por_sucursal; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.producto_por_sucursal (id, producto_id, sucursal_id, cant_minima, cant_media, cant_maxima, usuario_id, creado_en) FROM stdin;
3	1	2	60	120	480	1	2021-04-09 17:33:44.448469+00
4	2	1	80	200	400	1	2021-04-09 17:35:34.536385+00
5	1	3	780	2500	4800	1	2021-04-21 17:33:11.778063+00
1	1	1	1200	4800	7200	1	2021-04-09 17:32:14.884894+00
2	2	1	520	1500	3000	1	2021-04-09 17:33:44.443373+00
\.


--
-- Data for Name: producto_proveedor; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.producto_proveedor (id, producto_id, proveedor_id, pedido_id, usuario_id, creado_en) FROM stdin;
1	1	1	\N	1	2021-04-08 19:51:08.981497+00
2	2	1	\N	1	2021-04-08 20:37:09.550842+00
3	5	2	\N	1	2021-04-08 23:44:44.921484+00
4	4	1	\N	1	2021-04-08 23:45:07.518707+00
5	5	1	\N	1	2021-04-14 17:37:08.372325+00
6	6	1	\N	1	2021-04-14 17:37:15.518858+00
7	6	1	\N	1	2021-04-14 17:37:27.571352+00
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
\.


--
-- Name: subfamilia_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.subfamilia_id_seq', 21, true);


--
-- Data for Name: tipo_precio; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.tipo_precio (id, descripcion, autorizacion, usuario_id, creado_en, activo) FROM stdin;
1	PRECIO 1	\N	1	2021-05-20 15:29:22.078455+00	t
2	PRECIO 2	\N	1	2021-05-20 15:29:22.088949+00	t
3	PRECIO 3	\N	1	2021-05-20 15:29:22.092991+00	t
4	PRECIO 4	t	1	2021-05-20 15:29:22.097274+00	t
\.


--
-- Name: tipo_precio_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.tipo_precio_id_seq', 4, true);


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
-- Name: codigo_un; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_un UNIQUE (codigo);


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
-- Name: producto_nombre_un; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto
    ADD CONSTRAINT producto_nombre_un UNIQUE (descripcion);


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
-- Name: motivo_diferencia_pedido_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido
    ADD CONSTRAINT motivo_diferencia_pedido_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: movimientos_stock_codigo_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimientos_stock_codigo_id_fkey FOREIGN KEY (codigo_id) REFERENCES productos.codigo(id);


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
-- Name: venta_cliente_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id);


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
-- Name: codigo_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: codigo_producto_id_fkey1; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_producto_id_fkey1 FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: codigo_referencia_codigo_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_referencia_codigo_id_fkey FOREIGN KEY (referencia_codigo_id) REFERENCES productos.codigo(id);


--
-- Name: codigo_tipo_precio_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_tipo_precio_fkey FOREIGN KEY (tipo_precio) REFERENCES productos.tipo_precio(id);


--
-- Name: codigo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: codigo_usuario_id_fkey1; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_usuario_id_fkey1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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
-- Name: precio_por_sucursal_codigo_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_codigo_id_fkey FOREIGN KEY (codigo_id) REFERENCES productos.codigo(id);


--
-- Name: precio_por_sucursal_codigo_id_fkey1; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_codigo_id_fkey1 FOREIGN KEY (codigo_id) REFERENCES productos.codigo(id);


--
-- Name: precio_por_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: precio_por_sucursal_sucursal_id_fkey1; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_sucursal_id_fkey1 FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: precio_por_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: precio_por_sucursal_usuario_id_fkey1; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_usuario_id_fkey1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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

