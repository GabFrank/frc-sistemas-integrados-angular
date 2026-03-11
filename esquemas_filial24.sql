--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: administrativo; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA administrativo;


--
-- Name: configuraciones; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA configuraciones;


--
-- Name: empresarial; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA empresarial;


--
-- Name: equipos; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA equipos;


--
-- Name: financiero; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA financiero;


--
-- Name: general; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA general;


--
-- Name: operaciones; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA operaciones;


--
-- Name: personas; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA personas;


--
-- Name: productos; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA productos;


--
-- Name: vehiculos; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vehiculos;


--
-- Name: dblink; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dblink WITH SCHEMA public;


--
-- Name: EXTENSION dblink; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION dblink IS 'connect to other PostgreSQL databases from within a database';


--
-- Name: estado_autorizacion; Type: TYPE; Schema: administrativo; Owner: -
--

CREATE TYPE administrativo.estado_autorizacion AS ENUM (
    'EN ESPERA',
    'CANCELADO',
    'AUTORIZADO',
    'NO_AUTORIZADO'
);


--
-- Name: tipo_autorizacion; Type: TYPE; Schema: administrativo; Owner: -
--

CREATE TYPE administrativo.tipo_autorizacion AS ENUM (
    'MARCACION'
);


--
-- Name: tipo_marcacion; Type: TYPE; Schema: administrativo; Owner: -
--

CREATE TYPE administrativo.tipo_marcacion AS ENUM (
    'ENTRADA',
    'SALIDA'
);


--
-- Name: nivel_actualizacion; Type: TYPE; Schema: configuraciones; Owner: -
--

CREATE TYPE configuraciones.nivel_actualizacion AS ENUM (
    'CRITICO',
    'MODERADO',
    'MANTENIMIENTO'
);


--
-- Name: tipo_actualizacion; Type: TYPE; Schema: configuraciones; Owner: -
--

CREATE TYPE configuraciones.tipo_actualizacion AS ENUM (
    'MOBILE',
    'DESKTOP',
    'SERVIDOR_FILIAL',
    'SERVIDOR_CENTRAL'
);


--
-- Name: tipo_dispositivo; Type: TYPE; Schema: configuraciones; Owner: -
--

CREATE TYPE configuraciones.tipo_dispositivo AS ENUM (
    'ANDROID',
    'IOS',
    'DESKTOP_WIN',
    'DESKTOP_LIN',
    'DESKTOP_MAC',
    'WEBWEB_MOBILE'
);


--
-- Name: estado_retiro; Type: TYPE; Schema: financiero; Owner: -
--

CREATE TYPE financiero.estado_retiro AS ENUM (
    'EN_PROCESO',
    'CONCLUIDO',
    'NECESITA_VERIFICACION',
    'EN_VERIFICACION',
    'VERIFICADO_CONCLUIDO_SIN_PROBLEMA',
    'VERIFICADO_CONCLUIDO_CON_PROBLEMA'
);


--
-- Name: estado_venta_credito; Type: TYPE; Schema: financiero; Owner: -
--

CREATE TYPE financiero.estado_venta_credito AS ENUM (
    'ABIERTO',
    'FINALIZADO',
    'EN_MORA',
    'INCOBRABLE',
    'CANCELADO'
);


--
-- Name: pdv_caja_estado; Type: TYPE; Schema: financiero; Owner: -
--

CREATE TYPE financiero.pdv_caja_estado AS ENUM (
    'EN_PROCESO',
    'CONCLUIDO',
    'NECESITA_VERIFICACION',
    'EN_VERIFICACION',
    'VERIFICADO_CONCLUIDO_SIN_PROBLEMA',
    'VERIFICADO_CONCLUIDO_CON_PROBLEMA'
);


--
-- Name: pdv_caja_tipo_movimiento; Type: TYPE; Schema: financiero; Owner: -
--

CREATE TYPE financiero.pdv_caja_tipo_movimiento AS ENUM (
    'CAJA_INICIAL',
    'VENTA',
    'GASTO',
    'VALE',
    'RETIRO',
    'DEVOLUCION',
    'SALIDA_SENCILLO',
    'CAMBIO',
    'AJUSTE',
    'ENTRADA_SENCILLO',
    'CAJA_FINAL'
);


--
-- Name: tipo_confirmacion; Type: TYPE; Schema: financiero; Owner: -
--

CREATE TYPE financiero.tipo_confirmacion AS ENUM (
    'CONTRASENA',
    'PASSWORD',
    'QR',
    'LECTOR_HUELLAS',
    'FIRMA',
    'APP'
);


--
-- Name: tipo_cuenta; Type: TYPE; Schema: financiero; Owner: -
--

CREATE TYPE financiero.tipo_cuenta AS ENUM (
    'CUENTA_CORRIENTE',
    'CAJA_DE_AHORRO'
);


--
-- Name: tipo_movimiento_personas; Type: TYPE; Schema: financiero; Owner: -
--

CREATE TYPE financiero.tipo_movimiento_personas AS ENUM (
    'ANTICIPO',
    'AGUINALDO',
    'BONO',
    'VENTA_CREDITO',
    'MULTA',
    'PRESTAMO',
    'VACACIONES',
    'NO_DEVOLVIDOS',
    'COBRO',
    'SALARIO',
    'PAGO_SALARIO'
);


--
-- Name: dias_semana; Type: TYPE; Schema: general; Owner: -
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


--
-- Name: meses; Type: TYPE; Schema: general; Owner: -
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


--
-- Name: cambio_precio_momento; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.cambio_precio_momento AS ENUM (
    'INMEDIATO',
    'EN_FECHA_INDICADA',
    'AL_RECIBIR_COMPRA',
    'AL_AUTORIZAR',
    'AL_ALCANZAR_CANTIDAD'
);


--
-- Name: compra_estado; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.compra_estado AS ENUM (
    'ACTIVO',
    'CANCELADO',
    'DEVILVIDO',
    'EN_OBSERVACION',
    'IRREGULAR',
    'PRE_COMPRA'
);


--
-- Name: compra_item_estado; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.compra_item_estado AS ENUM (
    'SIN_MODIFICACION',
    'MODIFICADO'
);


--
-- Name: compra_tipo_boleta; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.compra_tipo_boleta AS ENUM (
    'LEGAL',
    'COMUN'
);


--
-- Name: delivery_estado; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.delivery_estado AS ENUM (
    'ABIERTO',
    'EN_CAMINO',
    'ENTREGADO',
    'CANCELADO',
    'DEVOLVIDO',
    'PARA_ENTREGA',
    'CONCLUIDO'
);


--
-- Name: etapa_transferencia; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.etapa_transferencia AS ENUM (
    'PRE_TRANSFERENCIA_CREACION',
    'PRE_TRANSFERENCIA_ORIGEN',
    'PREPARACION_MERCADERIA',
    'PREPARACION_MERCADERIA_CONCLUIDA',
    'TRANSPORTE_VERIFICACION',
    'TRANSPORTE_EN_CAMINO',
    'TRANSPORTE_EN_DESTINO',
    'RECEPCION_EN_VERIFICACION',
    'RECEPCION_CONCLUIDA'
);


--
-- Name: inventario_estado; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.inventario_estado AS ENUM (
    'ABIERTO',
    'CANCELADO',
    'CONCLUIDO'
);


--
-- Name: inventario_producto_estado; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.inventario_producto_estado AS ENUM (
    'BUENO',
    'AVERIADO',
    'VENCIDO'
);


--
-- Name: necesidad_estado; Type: TYPE; Schema: operaciones; Owner: -
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


--
-- Name: necesidad_item_estado; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.necesidad_item_estado AS ENUM (
    'ACTIVO',
    'CANCELADO',
    'DEVOLUCION',
    'CONCLUIDO',
    'EN_FALTA'
);


--
-- Name: pedido_estado; Type: TYPE; Schema: operaciones; Owner: -
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
    'CONCLUIDO',
    'EN_RECEPCION_NOTA',
    'EN_RECEPCION_MERCADERIA'
);


--
-- Name: pedido_forma_pago; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.pedido_forma_pago AS ENUM (
    'EFECTIVO',
    'TRANSFERENCIA',
    'CHEQUE',
    'CREDITO'
);


--
-- Name: pedido_item_estado; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.pedido_item_estado AS ENUM (
    'ACTIVO',
    'CANCELADO',
    'DEVOLUCION',
    'CONCLUIDO',
    'EN_FALTA'
);


--
-- Name: tipo_entrada; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.tipo_entrada AS ENUM (
    'COMPRA',
    'SUCURSAL',
    'AJUSTE'
);


--
-- Name: tipo_inventario; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.tipo_inventario AS ENUM (
    'ABC',
    'ZONA',
    'PRODUCTO',
    'CATEGORIA'
);


--
-- Name: tipo_movimiento; Type: TYPE; Schema: operaciones; Owner: -
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


--
-- Name: tipo_salida; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.tipo_salida AS ENUM (
    'SUCURSAL',
    'VENCIDO',
    'DETERIORADO',
    'AJUSTE'
);


--
-- Name: tipo_transferencia; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.tipo_transferencia AS ENUM (
    'MANUAL',
    'AUTOMATICA',
    'MIXTA'
);


--
-- Name: tipo_venta; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.tipo_venta AS ENUM (
    'EFECTIVO',
    'CREDITO',
    'TARJETA',
    'TRANSFERENCIA',
    'CONSIGNACION',
    'CORTESIA'
);


--
-- Name: transferencia_estado; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.transferencia_estado AS ENUM (
    'ABIERTA',
    'EN_ORIGEN',
    'EN_TRANSITO',
    'EN_DESTINO',
    'FALTA_REVISION_EN_ORIGEN',
    'FALTA_REVISION_EN_DESTINO',
    'CONLCUIDA',
    'CANCELADA'
);


--
-- Name: transferencia_item_motivo_modificacion; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.transferencia_item_motivo_modificacion AS ENUM (
    'CANTIDAD_INCORRECTA',
    'VENCIMIENTO_INCORRECTO',
    'PRESENTACION_INCORRECTA'
);


--
-- Name: transferencia_item_motivo_rechazo; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.transferencia_item_motivo_rechazo AS ENUM (
    'FALTA_PRODUCTO',
    'PRODUCTO_AVERIADO',
    'PRODUCTO_VENCIDO',
    'PRODUCTO_EQUIVOCADO'
);


--
-- Name: venta_estado; Type: TYPE; Schema: operaciones; Owner: -
--

CREATE TYPE operaciones.venta_estado AS ENUM (
    'ABIERTA',
    'CONCLUIDA',
    'CANCELADA',
    'EN_VERIFICACION'
);


--
-- Name: tipo_cliente; Type: TYPE; Schema: personas; Owner: -
--

CREATE TYPE personas.tipo_cliente AS ENUM (
    'NORMAL',
    'ASOCIADO',
    'CONVENIADO',
    'FUNCIONARIO',
    'VIP'
);


--
-- Name: tipo_conservacion; Type: TYPE; Schema: productos; Owner: -
--

CREATE TYPE productos.tipo_conservacion AS ENUM (
    'ENFRIABLE',
    'NO_ENFRIABLE',
    'REFRIGERABLE',
    'CONGELABLE'
);


--
-- Name: unidad_medida; Type: TYPE; Schema: productos; Owner: -
--

CREATE TYPE productos.unidad_medida AS ENUM (
    'UNIDAD',
    'CAJA',
    'KILO',
    'LITROS'
);


--
-- Name: estado_vehiculo; Type: TYPE; Schema: vehiculos; Owner: -
--

CREATE TYPE vehiculos.estado_vehiculo AS ENUM (
    'FUNCIONANDO',
    'AVERIADO',
    'EN_REPARACION',
    'AGUARDANDO_REPARACION'
);


--
-- Name: delete_new_record(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_new_record() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Simply delete the new row before it is committed
  DELETE FROM operaciones.stock_por_producto_sucursal WHERE producto_id = NEW.producto_id;
  RETURN NULL; -- Returning NULL prevents the row from being inserted
END;
$$;


--
-- Name: eliminartablasporschema(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.eliminartablasporschema(schmname character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    statements CURSOR FOR
        SELECT tablename FROM pg_tables
        WHERE schemaname = schmname;
BEGIN
    FOR stmt IN statements LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
    END LOOP;
END;
$$;


--
-- Name: getallsequences(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.getallsequences() RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
   execute (
select
	pg_get_serial_sequence(t.schemaname || '.' || t.tablename,
	c.column_name)
from
	pg_tables t
join information_schema.columns c on
	c.table_schema = t.schemaname
	and c.table_name = t.tablename
where
	t.schemaname <> 'pg_catalog'
	and t.schemaname <> 'information_schema'
	and pg_get_serial_sequence(t.schemaname || '.' || t.tablename,
	c.column_name) is not null

);
end
$$;


--
-- Name: reiniciardb(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reiniciardb() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
   execute (select *
   FROM   pg_tables
   WHERE  tableowner = _username
   );
END
$$;


--
-- Name: reiniciardb(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reiniciardb(_username text) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
   execute (select 'reiniciarDB(franco,' || quote_ident(schemaname) || ');'
from
	pg_tables
where
	tableowner = _username
   );
end
$$;


--
-- Name: reiniciarsecuencias(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reiniciarsecuencias(_username text, _schemaname text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
   EXECUTE 'SELECT setval('|| string_agg(quote_ident(_schemaname) || '.' || quote_ident(tablename), ', ')
       ||  '_id_seq ,1, true);'
   FROM   pg_tables
   WHERE  tableowner = _username
   AND    schemaname = _schemaname
   ;
END
$$;


--
-- Name: reiniciartablas(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reiniciartablas(_username text, _schemaname text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
   execute (SELECT 'TRUNCATE '
       || string_agg(quote_ident(schemaname) || '.' || quote_ident(tablename), ', ')
       || ' RESTART IDENTITY CASCADE ;'
   FROM   pg_tables
   WHERE  tableowner = _username
   AND    schemaname = _schemaname
   );
END
$$;


--
-- Name: truncate_tables(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.truncate_tables(username character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    statements CURSOR FOR
        SELECT tablename FROM pg_tables
        WHERE tableowner = username AND schemaname = 'public';
BEGIN
    FOR stmt IN statements LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
    END LOOP;
END;
$$;


--
-- Name: truncate_tables(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.truncate_tables(username character varying, schemaname character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    statements CURSOR FOR
        SELECT tablename FROM pg_tables
        WHERE tableowner = username AND schemaname = schemaname;
BEGIN
    FOR stmt IN statements LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
    END LOOP;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: autorizacion; Type: TABLE; Schema: administrativo; Owner: -
--

CREATE TABLE administrativo.autorizacion (
    id bigint NOT NULL,
    funcionario_id bigint,
    autorizador_id bigint,
    tipo_autorizacion administrativo.tipo_autorizacion,
    estado_autorizacion administrativo.estado_autorizacion,
    observacion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    sucursal_id bigint DEFAULT 0 NOT NULL
);


--
-- Name: autorizacion_id_seq; Type: SEQUENCE; Schema: administrativo; Owner: -
--

CREATE SEQUENCE administrativo.autorizacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: autorizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: administrativo; Owner: -
--

ALTER SEQUENCE administrativo.autorizacion_id_seq OWNED BY administrativo.autorizacion.id;


--
-- Name: marcacion; Type: TABLE; Schema: administrativo; Owner: -
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

ALTER TABLE ONLY administrativo.marcacion REPLICA IDENTITY FULL;


--
-- Name: marcacion_id_seq; Type: SEQUENCE; Schema: administrativo; Owner: -
--

CREATE SEQUENCE administrativo.marcacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: marcacion_id_seq; Type: SEQUENCE OWNED BY; Schema: administrativo; Owner: -
--

ALTER SEQUENCE administrativo.marcacion_id_seq OWNED BY administrativo.marcacion.id;


--
-- Name: actualizacion; Type: TABLE; Schema: configuraciones; Owner: -
--

CREATE TABLE configuraciones.actualizacion (
    id bigint NOT NULL,
    current_version character varying,
    enabled boolean,
    tipo configuraciones.tipo_actualizacion,
    nivel configuraciones.nivel_actualizacion,
    title character varying,
    msg character varying,
    btn character varying,
    usuario_id bigint,
    creado_en timestamp without time zone
);

ALTER TABLE ONLY configuraciones.actualizacion REPLICA IDENTITY FULL;


--
-- Name: actualizacion_id_seq; Type: SEQUENCE; Schema: configuraciones; Owner: -
--

CREATE SEQUENCE configuraciones.actualizacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: actualizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: configuraciones; Owner: -
--

ALTER SEQUENCE configuraciones.actualizacion_id_seq OWNED BY configuraciones.actualizacion.id;


--
-- Name: inicio_sesion; Type: TABLE; Schema: configuraciones; Owner: -
--

CREATE TABLE configuraciones.inicio_sesion (
    id bigint NOT NULL,
    usuario_id bigint,
    id_dispositivo text,
    hora_inicio timestamp with time zone DEFAULT now(),
    hora_fin timestamp without time zone,
    creado_en timestamp with time zone DEFAULT now(),
    sucursal_id bigint NOT NULL,
    token text,
    tipo_dispositivo configuraciones.tipo_dispositivo
);

ALTER TABLE ONLY configuraciones.inicio_sesion REPLICA IDENTITY FULL;


--
-- Name: inicio_sesion_id_seq; Type: SEQUENCE; Schema: configuraciones; Owner: -
--

CREATE SEQUENCE configuraciones.inicio_sesion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inicio_sesion_id_seq; Type: SEQUENCE OWNED BY; Schema: configuraciones; Owner: -
--

ALTER SEQUENCE configuraciones.inicio_sesion_id_seq OWNED BY configuraciones.inicio_sesion.id;


--
-- Name: local; Type: TABLE; Schema: configuraciones; Owner: -
--

CREATE TABLE configuraciones.local (
    id bigint NOT NULL,
    sucursal_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    equipo_id bigint,
    is_servidor boolean
);

ALTER TABLE ONLY configuraciones.local REPLICA IDENTITY FULL;


--
-- Name: local_id_seq; Type: SEQUENCE; Schema: configuraciones; Owner: -
--

CREATE SEQUENCE configuraciones.local_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: local_id_seq; Type: SEQUENCE OWNED BY; Schema: configuraciones; Owner: -
--

ALTER SEQUENCE configuraciones.local_id_seq OWNED BY configuraciones.local.id;


--
-- Name: rabbitmq_msg; Type: TABLE; Schema: configuraciones; Owner: -
--

CREATE TABLE configuraciones.rabbitmq_msg (
    id bigint NOT NULL,
    tipo_accion text,
    tipo_entidad text,
    entidad jsonb,
    id_sucursal_origen numeric,
    data text,
    recibido_en_servidor boolean,
    recibido_en_filial boolean,
    exchange text,
    key text,
    class_type text
);


--
-- Name: rabbitmq_msg_id_seq; Type: SEQUENCE; Schema: configuraciones; Owner: -
--

CREATE SEQUENCE configuraciones.rabbitmq_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rabbitmq_msg_id_seq; Type: SEQUENCE OWNED BY; Schema: configuraciones; Owner: -
--

ALTER SEQUENCE configuraciones.rabbitmq_msg_id_seq OWNED BY configuraciones.rabbitmq_msg.id;


--
-- Name: cargo; Type: TABLE; Schema: empresarial; Owner: -
--

CREATE TABLE empresarial.cargo (
    id bigint NOT NULL,
    nombre character varying,
    descripcion character varying,
    supervisado_por_id bigint,
    sueldo_base numeric,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    id_central bigint
);

ALTER TABLE ONLY empresarial.cargo REPLICA IDENTITY FULL;


--
-- Name: cargo_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: -
--

CREATE SEQUENCE empresarial.cargo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cargo_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: -
--

ALTER SEQUENCE empresarial.cargo_id_seq OWNED BY empresarial.cargo.id;


--
-- Name: configuracion_general; Type: TABLE; Schema: empresarial; Owner: -
--

CREATE TABLE empresarial.configuracion_general (
    id bigint NOT NULL,
    nombre_empresa character varying NOT NULL,
    razon_social character varying NOT NULL,
    ruc character varying,
    creado_en timestamp without time zone,
    usuario_id bigint
);

ALTER TABLE ONLY empresarial.configuracion_general REPLICA IDENTITY FULL;


--
-- Name: configuracion_general_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: -
--

CREATE SEQUENCE empresarial.configuracion_general_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: configuracion_general_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: -
--

ALTER SEQUENCE empresarial.configuracion_general_id_seq OWNED BY empresarial.configuracion_general.id;


--
-- Name: punto_de_venta; Type: TABLE; Schema: empresarial; Owner: -
--

CREATE TABLE empresarial.punto_de_venta (
    id bigint NOT NULL,
    sucursal_id bigint NOT NULL,
    nombre character varying NOT NULL,
    nombre_impresora_ticket character varying,
    tamanho_impresora_ticket numeric,
    nombre_impresora_reportes character varying,
    creado_en timestamp without time zone,
    usuario_id bigint
);

ALTER TABLE ONLY empresarial.punto_de_venta REPLICA IDENTITY FULL;


--
-- Name: punto_de_venta_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: -
--

CREATE SEQUENCE empresarial.punto_de_venta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: punto_de_venta_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: -
--

ALTER SEQUENCE empresarial.punto_de_venta_id_seq OWNED BY empresarial.punto_de_venta.id;


--
-- Name: sector; Type: TABLE; Schema: empresarial; Owner: -
--

CREATE TABLE empresarial.sector (
    id bigint NOT NULL,
    sucursal_id bigint,
    descripcion character varying,
    activo boolean,
    usuario_id bigint,
    creado_en timestamp without time zone
);

ALTER TABLE ONLY empresarial.sector REPLICA IDENTITY FULL;


--
-- Name: sector_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: -
--

CREATE SEQUENCE empresarial.sector_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sector_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: -
--

ALTER SEQUENCE empresarial.sector_id_seq OWNED BY empresarial.sector.id;


--
-- Name: sucursal; Type: TABLE; Schema: empresarial; Owner: -
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
    nro_delivery character varying,
    is_configured boolean DEFAULT true,
    codigo_establecimiento_factura character varying,
    ip character varying,
    puerto integer
);

ALTER TABLE ONLY empresarial.sucursal REPLICA IDENTITY FULL;


--
-- Name: COLUMN sucursal.direccion; Type: COMMENT; Schema: empresarial; Owner: -
--

COMMENT ON COLUMN empresarial.sucursal.direccion IS 'direccion referencial';


--
-- Name: sucursal_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: -
--

CREATE SEQUENCE empresarial.sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: -
--

ALTER SEQUENCE empresarial.sucursal_id_seq OWNED BY empresarial.sucursal.id;


--
-- Name: zona; Type: TABLE; Schema: empresarial; Owner: -
--

CREATE TABLE empresarial.zona (
    id bigint NOT NULL,
    sector_id bigint,
    descripcion character varying,
    activo boolean,
    usuario_id bigint,
    creado_en timestamp without time zone
);

ALTER TABLE ONLY empresarial.zona REPLICA IDENTITY FULL;


--
-- Name: zona_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: -
--

CREATE SEQUENCE empresarial.zona_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: zona_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: -
--

ALTER SEQUENCE empresarial.zona_id_seq OWNED BY empresarial.zona.id;


--
-- Name: equipo; Type: TABLE; Schema: equipos; Owner: -
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

ALTER TABLE ONLY equipos.equipo REPLICA IDENTITY FULL;


--
-- Name: equipo_id_seq; Type: SEQUENCE; Schema: equipos; Owner: -
--

CREATE SEQUENCE equipos.equipo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipo_id_seq; Type: SEQUENCE OWNED BY; Schema: equipos; Owner: -
--

ALTER SEQUENCE equipos.equipo_id_seq OWNED BY equipos.equipo.id;


--
-- Name: equipo_sucursal; Type: TABLE; Schema: equipos; Owner: -
--

CREATE TABLE equipos.equipo_sucursal (
    id bigint NOT NULL,
    equipo_id bigint NOT NULL,
    sucursal_id bigint NOT NULL,
    responsable_id bigint NOT NULL,
    autorizado_por bigint NOT NULL,
    creado_en timestamp without time zone
);


--
-- Name: equipo_sucursal_id_seq; Type: SEQUENCE; Schema: equipos; Owner: -
--

CREATE SEQUENCE equipos.equipo_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipo_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: equipos; Owner: -
--

ALTER SEQUENCE equipos.equipo_sucursal_id_seq OWNED BY equipos.equipo_sucursal.id;


--
-- Name: tipo_equipo; Type: TABLE; Schema: equipos; Owner: -
--

CREATE TABLE equipos.tipo_equipo (
    id bigint NOT NULL,
    descripcion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY equipos.tipo_equipo REPLICA IDENTITY FULL;


--
-- Name: tipo_equipo_id_seq; Type: SEQUENCE; Schema: equipos; Owner: -
--

CREATE SEQUENCE equipos.tipo_equipo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_equipo_id_seq; Type: SEQUENCE OWNED BY; Schema: equipos; Owner: -
--

ALTER SEQUENCE equipos.tipo_equipo_id_seq OWNED BY equipos.tipo_equipo.id;


--
-- Name: banco; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.banco (
    id bigint NOT NULL,
    nombre character varying,
    codigo character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY financiero.banco REPLICA IDENTITY FULL;


--
-- Name: banco_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.banco_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: banco_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.banco_id_seq OWNED BY financiero.banco.id;


--
-- Name: cambio; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.cambio (
    id bigint NOT NULL,
    moneda_id bigint,
    valor_en_gs numeric,
    activo boolean,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    id_central bigint,
    valor_en_gs_cambio numeric
);

ALTER TABLE ONLY financiero.cambio REPLICA IDENTITY FULL;


--
-- Name: cambio_caja; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.cambio_caja (
    id bigint NOT NULL,
    cliente_id bigint,
    autorizado_por_id bigint,
    moneda_venta_id bigint,
    moneda_compra_id bigint,
    cotizacion numeric,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint,
    caja_id bigint
);

ALTER TABLE ONLY financiero.cambio_caja REPLICA IDENTITY FULL;


--
-- Name: cambio_caja_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.cambio_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cambio_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.cambio_caja_id_seq OWNED BY financiero.cambio_caja.id;


--
-- Name: cambio_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.cambio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cambio_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.cambio_id_seq OWNED BY financiero.cambio.id;


--
-- Name: conteo; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.conteo (
    id bigint NOT NULL,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint NOT NULL
);

ALTER TABLE ONLY financiero.conteo REPLICA IDENTITY FULL;


--
-- Name: conteo_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.conteo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conteo_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.conteo_id_seq OWNED BY financiero.conteo.id;


--
-- Name: conteo_moneda; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.conteo_moneda (
    id bigint NOT NULL,
    conteo_id bigint,
    moneda_billetes_id bigint,
    cantidad numeric,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint NOT NULL
);

ALTER TABLE ONLY financiero.conteo_moneda REPLICA IDENTITY FULL;


--
-- Name: conteo_moneda_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.conteo_moneda_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conteo_moneda_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.conteo_moneda_id_seq OWNED BY financiero.conteo_moneda.id;


--
-- Name: cuenta_bancaria; Type: TABLE; Schema: financiero; Owner: -
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

ALTER TABLE ONLY financiero.cuenta_bancaria REPLICA IDENTITY FULL;


--
-- Name: cuenta_bancaria_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.cuenta_bancaria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cuenta_bancaria_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.cuenta_bancaria_id_seq OWNED BY financiero.cuenta_bancaria.id;


--
-- Name: documento; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.documento (
    id bigint NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone,
    usuario_id bigint
);

ALTER TABLE ONLY financiero.documento REPLICA IDENTITY FULL;


--
-- Name: documento_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.documento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documento_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.documento_id_seq OWNED BY financiero.documento.id;


--
-- Name: factura_legal; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.factura_legal (
    id bigint NOT NULL,
    timbrado_detalle_id bigint NOT NULL,
    numero_factura numeric NOT NULL,
    autoimpreso boolean DEFAULT true,
    cliente_id bigint,
    venta_id integer,
    fecha timestamp without time zone,
    credito boolean,
    nombre character varying,
    ruc character varying,
    direccion character varying,
    iva_parcial_0 numeric,
    iva_parcial_5 numeric,
    iva_parcial_10 numeric,
    total_parcial_0 numeric,
    total_parcial_5 numeric,
    total_parcial_10 numeric,
    total_final numeric,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone,
    usuario_id bigint,
    via_tributaria boolean DEFAULT false,
    caja_id bigint,
    sucursal_id bigint,
    descuento numeric DEFAULT 0
);

ALTER TABLE ONLY financiero.factura_legal REPLICA IDENTITY FULL;


--
-- Name: factura_legal_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.factura_legal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: factura_legal_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.factura_legal_id_seq OWNED BY financiero.factura_legal.id;


--
-- Name: factura_legal_item; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.factura_legal_item (
    id bigint NOT NULL,
    factura_legal_id bigint NOT NULL,
    venta_item_id integer,
    presentacion_id bigint,
    cantidad numeric,
    descripcion character varying,
    precio_unitario numeric,
    total numeric,
    creado_en timestamp without time zone,
    usuario_id bigint,
    sucursal_id bigint
);

ALTER TABLE ONLY financiero.factura_legal_item REPLICA IDENTITY FULL;


--
-- Name: factura_legal_item_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.factura_legal_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: factura_legal_item_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.factura_legal_item_id_seq OWNED BY financiero.factura_legal_item.id;


--
-- Name: forma_pago; Type: TABLE; Schema: financiero; Owner: -
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

ALTER TABLE ONLY financiero.forma_pago REPLICA IDENTITY FULL;


--
-- Name: forma_pago_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.forma_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forma_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.forma_pago_id_seq OWNED BY financiero.forma_pago.id;


--
-- Name: gasto; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.gasto (
    id bigint NOT NULL,
    responsable_id bigint,
    tipo_gasto_id bigint,
    autorizado_por_id bigint,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    caja_id bigint,
    activo boolean DEFAULT true,
    finalizado boolean DEFAULT false,
    retiro_gs numeric DEFAULT 0,
    retiro_rs numeric DEFAULT 0,
    retiro_ds numeric DEFAULT 0,
    vuelto_gs numeric DEFAULT 0,
    vuelto_rs numeric DEFAULT 0,
    vuelto_ds numeric DEFAULT 0,
    sucursal_id bigint,
    sucursal_vuelto_id bigint
);

ALTER TABLE ONLY financiero.gasto REPLICA IDENTITY FULL;


--
-- Name: gasto_detalle; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.gasto_detalle (
    id bigint NOT NULL,
    gasto_id bigint,
    moneda_id bigint NOT NULL,
    cambio numeric(19,0),
    cantidad numeric NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    vuelto boolean DEFAULT false,
    sucursal_id bigint
);

ALTER TABLE ONLY financiero.gasto_detalle REPLICA IDENTITY FULL;


--
-- Name: gasto_detalle_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.gasto_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gasto_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.gasto_detalle_id_seq OWNED BY financiero.gasto_detalle.id;


--
-- Name: gasto_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.gasto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gasto_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.gasto_id_seq OWNED BY financiero.gasto.id;


--
-- Name: maletin_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.maletin_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maletin; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.maletin (
    id bigint DEFAULT nextval('financiero.maletin_id_seq'::regclass) NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    abierto boolean DEFAULT false,
    sucursal_id bigint DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY financiero.maletin REPLICA IDENTITY FULL;


--
-- Name: moneda; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.moneda (
    id bigint NOT NULL,
    denominacion character varying,
    simbolo character varying,
    pais_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY financiero.moneda REPLICA IDENTITY FULL;


--
-- Name: moneda_billetes; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.moneda_billetes (
    id bigint NOT NULL,
    moneda_id bigint NOT NULL,
    flotante boolean DEFAULT false,
    papel boolean DEFAULT true,
    valor numeric,
    activo boolean DEFAULT true,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);

ALTER TABLE ONLY financiero.moneda_billetes REPLICA IDENTITY FULL;


--
-- Name: moneda_billetes_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.moneda_billetes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: moneda_billetes_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.moneda_billetes_id_seq OWNED BY financiero.moneda_billetes.id;


--
-- Name: moneda_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.moneda_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: moneda_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.moneda_id_seq OWNED BY financiero.moneda.id;


--
-- Name: movimiento_caja; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.movimiento_caja (
    id bigint NOT NULL,
    caja_id bigint NOT NULL,
    moneda_id bigint NOT NULL,
    referencia_id bigint NOT NULL,
    cambio_id bigint,
    cantidad numeric NOT NULL,
    tipo_movimiento financiero.pdv_caja_tipo_movimiento NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    activo boolean DEFAULT true,
    sucursal_id bigint
);

ALTER TABLE ONLY financiero.movimiento_caja REPLICA IDENTITY FULL;


--
-- Name: movimiento_caja_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.movimiento_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimiento_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.movimiento_caja_id_seq OWNED BY financiero.movimiento_caja.id;


--
-- Name: movimiento_personas; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.movimiento_personas (
    id bigint NOT NULL,
    observacion character varying,
    persona_id bigint NOT NULL,
    tipo financiero.tipo_movimiento_personas,
    referencia_id bigint,
    valor_total numeric,
    activo boolean,
    vencimiento timestamp without time zone,
    usuario_id bigint,
    creado_en timestamp without time zone
);

ALTER TABLE ONLY financiero.movimiento_personas REPLICA IDENTITY FULL;


--
-- Name: movimiento_personas_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.movimiento_personas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimiento_personas_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.movimiento_personas_id_seq OWNED BY financiero.movimiento_personas.id;


--
-- Name: pdv_caja; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.pdv_caja (
    id bigint NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    estado financiero.pdv_caja_estado,
    tuvo_problema boolean DEFAULT false,
    fecha_apertura timestamp with time zone DEFAULT now(),
    fecha_cierre timestamp with time zone,
    observacion character varying,
    creado_en timestamp with time zone,
    maletin_id bigint,
    usuario_id bigint,
    conteo_apertura_id bigint,
    conteo_cierre_id bigint,
    sucursal_id bigint NOT NULL,
    verificado boolean DEFAULT false,
    verificado_por_id bigint
);

ALTER TABLE ONLY financiero.pdv_caja REPLICA IDENTITY FULL;


--
-- Name: pdv_caja_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.pdv_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pdv_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.pdv_caja_id_seq OWNED BY financiero.pdv_caja.id;


--
-- Name: retiro; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.retiro (
    id bigint NOT NULL,
    responsable_id bigint,
    estado financiero.estado_retiro,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    caja_salida_id bigint,
    caja_entrada_id bigint,
    sucursal_id bigint
);

ALTER TABLE ONLY financiero.retiro REPLICA IDENTITY FULL;


--
-- Name: retiro_detalle; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.retiro_detalle (
    id bigint NOT NULL,
    retiro_id bigint NOT NULL,
    moneda_id bigint NOT NULL,
    cambio numeric(19,0),
    cantidad numeric NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint
);

ALTER TABLE ONLY financiero.retiro_detalle REPLICA IDENTITY FULL;


--
-- Name: retiro_detalle_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.retiro_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: retiro_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.retiro_detalle_id_seq OWNED BY financiero.retiro_detalle.id;


--
-- Name: retiro_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.retiro_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: retiro_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.retiro_id_seq OWNED BY financiero.retiro.id;


--
-- Name: sencillo; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.sencillo (
    id bigint NOT NULL,
    responsable_id bigint,
    entrada boolean,
    autorizado_por_id bigint,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint,
    caja_entrada_id bigint,
    caja_salida_id bigint
);

ALTER TABLE ONLY financiero.sencillo REPLICA IDENTITY FULL;


--
-- Name: sencillo_detalle; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.sencillo_detalle (
    id bigint NOT NULL,
    sencillo_id bigint,
    moneda_id bigint NOT NULL,
    cambio_id bigint,
    cantidad numeric NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint
);

ALTER TABLE ONLY financiero.sencillo_detalle REPLICA IDENTITY FULL;


--
-- Name: sencillo_detalle_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.sencillo_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sencillo_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.sencillo_detalle_id_seq OWNED BY financiero.sencillo_detalle.id;


--
-- Name: sencillo_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.sencillo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sencillo_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.sencillo_id_seq OWNED BY financiero.sencillo.id;


--
-- Name: timbrado; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.timbrado (
    id bigint NOT NULL,
    razon_social character varying NOT NULL,
    ruc character varying NOT NULL,
    numero character varying NOT NULL,
    fecha_inicio timestamp without time zone NOT NULL,
    fecha_fin timestamp without time zone NOT NULL,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone,
    usuario_id bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY financiero.timbrado REPLICA IDENTITY FULL;


--
-- Name: timbrado_detalle; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.timbrado_detalle (
    id bigint NOT NULL,
    timbrado_id bigint NOT NULL,
    punto_de_venta_id bigint,
    punto_expedicion character varying NOT NULL,
    cantidad numeric NOT NULL,
    rango_desde numeric NOT NULL,
    rango_hasta numeric NOT NULL,
    numero_actual numeric NOT NULL,
    activo boolean,
    creado_en timestamp without time zone,
    usuario_id bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY financiero.timbrado_detalle REPLICA IDENTITY FULL;


--
-- Name: timbrado_detalle_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.timbrado_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: timbrado_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.timbrado_detalle_id_seq OWNED BY financiero.timbrado_detalle.id;


--
-- Name: timbrado_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.timbrado_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: timbrado_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.timbrado_id_seq OWNED BY financiero.timbrado.id;


--
-- Name: tipo_gasto; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.tipo_gasto (
    id bigint NOT NULL,
    is_clasificacion boolean,
    clasificacion_gasto_id bigint,
    descripcion character varying,
    activo boolean DEFAULT true,
    autorizacion boolean,
    cargo_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);

ALTER TABLE ONLY financiero.tipo_gasto REPLICA IDENTITY FULL;


--
-- Name: tipo_gasto_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.tipo_gasto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_gasto_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.tipo_gasto_id_seq OWNED BY financiero.tipo_gasto.id;


--
-- Name: venta_credito; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.venta_credito (
    id bigint NOT NULL,
    sucursal_id bigint,
    venta_id bigint,
    cliente_id bigint,
    tipo_confirmacion financiero.tipo_confirmacion,
    cantidad_cuotas integer,
    valor_total numeric,
    saldo_total numeric,
    plazo_en_dias numeric,
    interes_por_dia numeric,
    interes_mora_dia numeric,
    estado financiero.estado_venta_credito,
    usuario_id bigint,
    creado_en timestamp without time zone,
    sucursal_cobro_id bigint,
    cobro_id bigint,
    fecha_cobro timestamp without time zone
);

ALTER TABLE ONLY financiero.venta_credito REPLICA IDENTITY FULL;


--
-- Name: venta_credito_cuota; Type: TABLE; Schema: financiero; Owner: -
--

CREATE TABLE financiero.venta_credito_cuota (
    id bigint NOT NULL,
    venta_credito_id bigint NOT NULL,
    cobro_id bigint,
    valor numeric,
    parcial boolean,
    activo boolean,
    vencimiento timestamp without time zone,
    usuario_id bigint,
    creado_en timestamp without time zone,
    sucursal_id bigint,
    sucursal_cobro_id bigint
);

ALTER TABLE ONLY financiero.venta_credito_cuota REPLICA IDENTITY FULL;


--
-- Name: venta_credito_cuota_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.venta_credito_cuota_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: venta_credito_cuota_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.venta_credito_cuota_id_seq OWNED BY financiero.venta_credito_cuota.id;


--
-- Name: venta_credito_id_seq; Type: SEQUENCE; Schema: financiero; Owner: -
--

CREATE SEQUENCE financiero.venta_credito_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: venta_credito_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: -
--

ALTER SEQUENCE financiero.venta_credito_id_seq OWNED BY financiero.venta_credito.id;


--
-- Name: barrio; Type: TABLE; Schema: general; Owner: -
--

CREATE TABLE general.barrio (
    id bigint NOT NULL,
    descripcion character varying,
    ciudad_id bigint,
    precio_delivery_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY general.barrio REPLICA IDENTITY FULL;


--
-- Name: barrio_id_seq; Type: SEQUENCE; Schema: general; Owner: -
--

CREATE SEQUENCE general.barrio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: barrio_id_seq; Type: SEQUENCE OWNED BY; Schema: general; Owner: -
--

ALTER SEQUENCE general.barrio_id_seq OWNED BY general.barrio.id;


--
-- Name: ciudad; Type: TABLE; Schema: general; Owner: -
--

CREATE TABLE general.ciudad (
    id bigint NOT NULL,
    descripcion character varying,
    pais_id bigint,
    codigo character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY general.ciudad REPLICA IDENTITY FULL;


--
-- Name: ciudad_id_seq; Type: SEQUENCE; Schema: general; Owner: -
--

CREATE SEQUENCE general.ciudad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ciudad_id_seq; Type: SEQUENCE OWNED BY; Schema: general; Owner: -
--

ALTER SEQUENCE general.ciudad_id_seq OWNED BY general.ciudad.id;


--
-- Name: contacto; Type: TABLE; Schema: general; Owner: -
--

CREATE TABLE general.contacto (
    id bigint NOT NULL,
    email character varying,
    telefono character varying,
    persona_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY general.contacto REPLICA IDENTITY FULL;


--
-- Name: contacto_id_seq; Type: SEQUENCE; Schema: general; Owner: -
--

CREATE SEQUENCE general.contacto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacto_id_seq; Type: SEQUENCE OWNED BY; Schema: general; Owner: -
--

ALTER SEQUENCE general.contacto_id_seq OWNED BY general.contacto.id;


--
-- Name: pais; Type: TABLE; Schema: general; Owner: -
--

CREATE TABLE general.pais (
    id bigint NOT NULL,
    descripcion character varying,
    codigo character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY general.pais REPLICA IDENTITY FULL;


--
-- Name: pais_id_seq; Type: SEQUENCE; Schema: general; Owner: -
--

CREATE SEQUENCE general.pais_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pais_id_seq; Type: SEQUENCE OWNED BY; Schema: general; Owner: -
--

ALTER SEQUENCE general.pais_id_seq OWNED BY general.pais.id;


--
-- Name: cobro; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.cobro (
    id bigint NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    total_gs numeric,
    sucursal_id bigint
);

ALTER TABLE ONLY operaciones.cobro REPLICA IDENTITY FULL;


--
-- Name: cobro_detalle; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.cobro_detalle (
    id bigint NOT NULL,
    cobro_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    moneda_id bigint,
    forma_pago_id bigint,
    valor numeric,
    cambio numeric(19,0),
    vuelto boolean DEFAULT false,
    descuento boolean DEFAULT false,
    pago boolean DEFAULT true,
    aumento boolean DEFAULT false,
    sucursal_id bigint,
    identificador_transaccion character varying
);

ALTER TABLE ONLY operaciones.cobro_detalle REPLICA IDENTITY FULL;


--
-- Name: COLUMN cobro_detalle.identificador_transaccion; Type: COMMENT; Schema: operaciones; Owner: -
--

COMMENT ON COLUMN operaciones.cobro_detalle.identificador_transaccion IS 'ej: numero de comprobante transferencia, tarjeta';


--
-- Name: cobro_detalle_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.cobro_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cobro_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.cobro_detalle_id_seq OWNED BY operaciones.cobro_detalle.id;


--
-- Name: cobro_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.cobro_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cobro_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.cobro_id_seq OWNED BY operaciones.cobro.id;


--
-- Name: compra; Type: TABLE; Schema: operaciones; Owner: -
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

ALTER TABLE ONLY operaciones.compra REPLICA IDENTITY FULL;


--
-- Name: compra_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.compra_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compra_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.compra_id_seq OWNED BY operaciones.compra.id;


--
-- Name: compra_item; Type: TABLE; Schema: operaciones; Owner: -
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
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    lote character varying,
    valor_total numeric,
    vencimiento timestamp(0) with time zone,
    presentacion_id bigint,
    pedido_item_id bigint,
    estado operaciones.compra_item_estado,
    verificado boolean DEFAULT false,
    programar_precio_id bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.compra_item REPLICA IDENTITY FULL;


--
-- Name: compra_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.compra_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compra_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.compra_item_id_seq OWNED BY operaciones.compra_item.id;


--
-- Name: delivery; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.delivery (
    id bigint NOT NULL,
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
    vuelto_id bigint,
    sucursal_id bigint,
    fecha_concluido timestamp without time zone
);

ALTER TABLE ONLY operaciones.delivery REPLICA IDENTITY FULL;


--
-- Name: delivery_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.delivery_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.delivery_id_seq OWNED BY operaciones.delivery.id;


--
-- Name: entrada; Type: TABLE; Schema: operaciones; Owner: -
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

ALTER TABLE ONLY operaciones.entrada REPLICA IDENTITY FULL;


--
-- Name: entrada_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.entrada_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entrada_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.entrada_id_seq OWNED BY operaciones.entrada.id;


--
-- Name: entrada_item; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.entrada_item (
    id bigint NOT NULL,
    producto_id bigint NOT NULL,
    presentacion_id bigint NOT NULL,
    cantidad numeric NOT NULL,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id bigint,
    entrada_id bigint NOT NULL,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.entrada_item REPLICA IDENTITY FULL;


--
-- Name: entrada_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.entrada_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entrada_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.entrada_item_id_seq OWNED BY operaciones.entrada_item.id;


--
-- Name: inventario; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.inventario (
    id bigint NOT NULL,
    id_central bigint,
    id_origen bigint,
    sucursal_id bigint,
    fecha_inicio timestamp without time zone,
    fecha_fin timestamp without time zone,
    abierto boolean,
    tipo operaciones.tipo_inventario,
    estado operaciones.inventario_estado,
    usuario_id bigint,
    observacion character varying
);

ALTER TABLE ONLY operaciones.inventario REPLICA IDENTITY FULL;


--
-- Name: inventario_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.inventario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.inventario_id_seq OWNED BY operaciones.inventario.id;


--
-- Name: inventario_producto; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.inventario_producto (
    id bigint NOT NULL,
    id_central bigint,
    id_origen bigint,
    inventario_id bigint NOT NULL,
    producto_id bigint,
    zona_id bigint,
    concluido boolean,
    usuario_id bigint,
    creado_en timestamp without time zone,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.inventario_producto REPLICA IDENTITY FULL;


--
-- Name: inventario_producto_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.inventario_producto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventario_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.inventario_producto_id_seq OWNED BY operaciones.inventario_producto.id;


--
-- Name: inventario_producto_item; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.inventario_producto_item (
    id bigint NOT NULL,
    id_central bigint,
    id_origen bigint,
    inventario_producto_id bigint NOT NULL,
    presentacion_id bigint NOT NULL,
    zona_id bigint,
    cantidad numeric,
    vencimiento timestamp without time zone,
    estado operaciones.inventario_producto_estado,
    usuario_id bigint,
    creado_en timestamp without time zone,
    cantidad_fisica numeric,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.inventario_producto_item REPLICA IDENTITY FULL;


--
-- Name: inventario_producto_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.inventario_producto_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventario_producto_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.inventario_producto_item_id_seq OWNED BY operaciones.inventario_producto_item.id;


--
-- Name: motivo_diferencia_pedido; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.motivo_diferencia_pedido (
    id bigint NOT NULL,
    tipo character varying,
    descripcion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido REPLICA IDENTITY FULL;


--
-- Name: motivo_diferencia_pedido_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.motivo_diferencia_pedido_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: motivo_diferencia_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.motivo_diferencia_pedido_id_seq OWNED BY operaciones.motivo_diferencia_pedido.id;


--
-- Name: movimiento_stock; Type: TABLE; Schema: operaciones; Owner: -
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

ALTER TABLE ONLY operaciones.movimiento_stock REPLICA IDENTITY FULL;


--
-- Name: movimiento_stock_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.movimiento_stock_id_seq
    START WITH 1
    INCREMENT BY 2
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimiento_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.movimiento_stock_id_seq OWNED BY operaciones.movimiento_stock.id;


--
-- Name: necesidad; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.necesidad (
    id bigint NOT NULL,
    sucursal_id bigint,
    fecha timestamp with time zone DEFAULT now(),
    estado operaciones.necesidad_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);

ALTER TABLE ONLY operaciones.necesidad REPLICA IDENTITY FULL;


--
-- Name: necesidad_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.necesidad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: necesidad_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.necesidad_id_seq OWNED BY operaciones.necesidad.id;


--
-- Name: necesidad_item; Type: TABLE; Schema: operaciones; Owner: -
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
    frio boolean DEFAULT false,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.necesidad_item REPLICA IDENTITY FULL;


--
-- Name: necesidad_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.necesidad_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: necesidad_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.necesidad_item_id_seq OWNED BY operaciones.necesidad_item.id;


--
-- Name: nota_pedido; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.nota_pedido (
    id bigint NOT NULL,
    pedido_id bigint,
    nro_nota character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.nota_pedido REPLICA IDENTITY FULL;


--
-- Name: nota_pedido_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.nota_pedido_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nota_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.nota_pedido_id_seq OWNED BY operaciones.nota_pedido.id;


--
-- Name: nota_recepcion; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.nota_recepcion (
    id bigint NOT NULL,
    pedido_id bigint,
    compra_id bigint,
    documento_id bigint,
    valor numeric,
    descuento numeric,
    pagado boolean,
    numero numeric,
    timbrado numeric,
    creado_en timestamp without time zone,
    usuario_id bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.nota_recepcion REPLICA IDENTITY FULL;


--
-- Name: nota_recepcion_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.nota_recepcion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nota_recepcion_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.nota_recepcion_id_seq OWNED BY operaciones.nota_recepcion.id;


--
-- Name: nota_recepcion_item; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.nota_recepcion_item (
    id bigint NOT NULL,
    nota_recepcion_id bigint,
    pedido_item_id bigint,
    creado_en timestamp without time zone,
    usuario_id bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.nota_recepcion_item REPLICA IDENTITY FULL;


--
-- Name: nota_recepcion_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.nota_recepcion_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nota_recepcion_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.nota_recepcion_item_id_seq OWNED BY operaciones.nota_recepcion_item.id;


--
-- Name: pedido; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.pedido (
    id bigint NOT NULL,
    necesidad_id bigint,
    proveedor_id bigint,
    vendedor_id bigint,
    fecha_de_entrega timestamp without time zone,
    plazo_credito integer,
    moneda_id bigint,
    descuento numeric DEFAULT 0,
    estado operaciones.pedido_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    cantidad_notas integer,
    cod_interno_proveedor character varying,
    forma_pago_id bigint,
    sucursal_id bigint
);

ALTER TABLE ONLY operaciones.pedido REPLICA IDENTITY FULL;


--
-- Name: pedido_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.pedido_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.pedido_id_seq OWNED BY operaciones.pedido.id;


--
-- Name: pedido_item; Type: TABLE; Schema: operaciones; Owner: -
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
    vencimiento timestamp(0) without time zone,
    presentacion_id bigint,
    cantidad numeric,
    nota_recepcion_id bigint,
    sucursal_id bigint
);

ALTER TABLE ONLY operaciones.pedido_item REPLICA IDENTITY FULL;


--
-- Name: pedido_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.pedido_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pedido_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.pedido_item_id_seq OWNED BY operaciones.pedido_item.id;


--
-- Name: pedido_item_sucursal; Type: TABLE; Schema: operaciones; Owner: -
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

ALTER TABLE ONLY operaciones.pedido_item_sucursal REPLICA IDENTITY FULL;


--
-- Name: pedido_item_sucursal_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.pedido_item_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pedido_item_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.pedido_item_sucursal_id_seq OWNED BY operaciones.pedido_item_sucursal.id;


--
-- Name: precio_delivery; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.precio_delivery (
    id bigint NOT NULL,
    descripcion character varying,
    valor numeric,
    activo boolean DEFAULT true,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.precio_delivery REPLICA IDENTITY FULL;


--
-- Name: precio_delivery_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.precio_delivery_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: precio_delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.precio_delivery_id_seq OWNED BY operaciones.precio_delivery.id;


--
-- Name: programar_precio; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.programar_precio (
    id bigint NOT NULL,
    precio_id bigint NOT NULL,
    momento_cambio operaciones.cambio_precio_momento DEFAULT 'INMEDIATO'::operaciones.cambio_precio_momento,
    nuevo_precio numeric NOT NULL,
    fecha_cambio timestamp without time zone NOT NULL,
    cantidad numeric,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.programar_precio REPLICA IDENTITY FULL;


--
-- Name: programar_precio_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.programar_precio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: programar_precio_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.programar_precio_id_seq OWNED BY operaciones.programar_precio.id;


--
-- Name: salida; Type: TABLE; Schema: operaciones; Owner: -
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

ALTER TABLE ONLY operaciones.salida REPLICA IDENTITY FULL;


--
-- Name: salida_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.salida_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salida_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.salida_id_seq OWNED BY operaciones.salida.id;


--
-- Name: salida_item; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.salida_item (
    id bigint NOT NULL,
    producto_id bigint NOT NULL,
    presentacion_id bigint NOT NULL,
    cantidad numeric NOT NULL,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id bigint,
    salida_id bigint NOT NULL,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY operaciones.salida_item REPLICA IDENTITY FULL;


--
-- Name: salida_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.salida_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salida_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.salida_item_id_seq OWNED BY operaciones.salida_item.id;


--
-- Name: stock_por_producto_sucursal; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.stock_por_producto_sucursal (
    producto_id bigint NOT NULL,
    last_movimiento_stock_id bigint NOT NULL,
    sucursal_id bigint NOT NULL,
    cantidad numeric DEFAULT 0 NOT NULL
);


--
-- Name: transferencia; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.transferencia (
    id bigint NOT NULL,
    sucursal_origen_id bigint NOT NULL,
    sucursal_destino_id bigint NOT NULL,
    estado operaciones.transferencia_estado,
    tipo operaciones.tipo_transferencia,
    etapa operaciones.etapa_transferencia,
    observacion text,
    is_origen boolean,
    is_destino boolean,
    usuario_pre_transferencia_id bigint NOT NULL,
    usuario_preparacion_id bigint,
    usuario_transporte_id bigint,
    usuario_recepcion_id bigint,
    creado_en timestamp without time zone
);

ALTER TABLE ONLY operaciones.transferencia REPLICA IDENTITY FULL;


--
-- Name: transferencia_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.transferencia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transferencia_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.transferencia_id_seq OWNED BY operaciones.transferencia.id;


--
-- Name: transferencia_item; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.transferencia_item (
    id bigint NOT NULL,
    transferencia_id bigint NOT NULL,
    presentacion_pre_transferencia_id bigint NOT NULL,
    presentacion_preparacion_id bigint,
    presentacion_transporte_id bigint,
    presentacion_recepcion_id bigint,
    cantidad_pre_transferencia numeric,
    cantidad_preparacion numeric,
    cantidad_transporte numeric,
    cantidad_recepcion numeric,
    observacion_pre_transferencia character varying,
    observacion_preparacion character varying,
    observacion_transporte character varying,
    observacion_recepcion character varying,
    vencimiento_pre_transferencia timestamp without time zone,
    vencimiento_preparacion timestamp without time zone,
    vencimiento_transporte timestamp without time zone,
    vencimiento_recepcion timestamp without time zone,
    motivo_modificacion_pre_transferencia operaciones.transferencia_item_motivo_modificacion,
    motivo_modificacion_preparacion operaciones.transferencia_item_motivo_modificacion,
    motivo_modificacion_transporte operaciones.transferencia_item_motivo_modificacion,
    motivo_modificacion_recepcion operaciones.transferencia_item_motivo_modificacion,
    motivo_rechazo_pre_transferencia operaciones.transferencia_item_motivo_rechazo,
    motivo_rechazo_preparacion operaciones.transferencia_item_motivo_rechazo,
    motivo_rechazo_transporte operaciones.transferencia_item_motivo_rechazo,
    motivo_rechazo_recepcion operaciones.transferencia_item_motivo_rechazo,
    activo boolean DEFAULT true,
    posee_vencimiento boolean DEFAULT true NOT NULL,
    usuario_id bigint NOT NULL,
    creado_en timestamp without time zone
);

ALTER TABLE ONLY operaciones.transferencia_item REPLICA IDENTITY FULL;


--
-- Name: transferencia_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.transferencia_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transferencia_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.transferencia_item_id_seq OWNED BY operaciones.transferencia_item.id;


--
-- Name: venta; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.venta (
    id bigint NOT NULL,
    cliente_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    estado operaciones.venta_estado,
    total_gs numeric,
    total_rs numeric,
    total_ds numeric,
    forma_pago_id bigint,
    cobro_id bigint,
    caja_id bigint,
    sucursal_id bigint NOT NULL,
    delivery_id bigint
);

ALTER TABLE ONLY operaciones.venta REPLICA IDENTITY FULL;


--
-- Name: venta_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.venta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: venta_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.venta_id_seq OWNED BY operaciones.venta.id;


--
-- Name: venta_item; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.venta_item (
    id bigint NOT NULL,
    venta_id bigint,
    unidad_medida productos.unidad_medida,
    costo_unitario numeric,
    existencia numeric,
    producto_id bigint,
    cantidad numeric,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    descuento_unitario numeric DEFAULT 0,
    presentacion_id bigint,
    activo boolean DEFAULT true,
    id_central bigint,
    sucursal_id bigint NOT NULL,
    precio numeric,
    precio_id bigint
);

ALTER TABLE ONLY operaciones.venta_item REPLICA IDENTITY FULL;


--
-- Name: venta_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.venta_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: venta_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.venta_item_id_seq OWNED BY operaciones.venta_item.id;


--
-- Name: vuelto; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.vuelto (
    id bigint NOT NULL,
    autorizado_por_id bigint,
    responsable_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    activo boolean DEFAULT true,
    sucursal_id bigint
);

ALTER TABLE ONLY operaciones.vuelto REPLICA IDENTITY FULL;


--
-- Name: vuelto_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.vuelto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vuelto_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.vuelto_id_seq OWNED BY operaciones.vuelto.id;


--
-- Name: vuelto_item; Type: TABLE; Schema: operaciones; Owner: -
--

CREATE TABLE operaciones.vuelto_item (
    id bigint NOT NULL,
    vuelto_id bigint,
    valor numeric,
    moneda_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    sucursal_id bigint
);

ALTER TABLE ONLY operaciones.vuelto_item REPLICA IDENTITY FULL;


--
-- Name: vuelto_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: -
--

CREATE SEQUENCE operaciones.vuelto_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vuelto_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: -
--

ALTER SEQUENCE operaciones.vuelto_item_id_seq OWNED BY operaciones.vuelto_item.id;


--
-- Name: cliente; Type: TABLE; Schema: personas; Owner: -
--

CREATE TABLE personas.cliente (
    id bigint NOT NULL,
    persona_id bigint,
    credito numeric DEFAULT 0,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    tipo personas.tipo_cliente DEFAULT 'NORMAL'::personas.tipo_cliente,
    codigo character varying,
    sucursal_id bigint,
    tributa boolean,
    verificado_set boolean DEFAULT false,
    activo boolean DEFAULT true,
    razon_social character varying,
    ruc character varying
);

ALTER TABLE ONLY personas.cliente REPLICA IDENTITY FULL;


--
-- Name: cliente_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.cliente_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cliente_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.cliente_id_seq OWNED BY personas.cliente.id;


--
-- Name: funcionario; Type: TABLE; Schema: personas; Owner: -
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
    creado_en timestamp with time zone DEFAULT now(),
    activo boolean DEFAULT true NOT NULL
);

ALTER TABLE ONLY personas.funcionario REPLICA IDENTITY FULL;


--
-- Name: funcionario_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.funcionario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: funcionario_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.funcionario_id_seq OWNED BY personas.funcionario.id;


--
-- Name: grupo_role; Type: TABLE; Schema: personas; Owner: -
--

CREATE TABLE personas.grupo_role (
    id bigint NOT NULL,
    descripcion character varying NOT NULL,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY personas.grupo_role REPLICA IDENTITY FULL;


--
-- Name: grupo_privilegio_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.grupo_privilegio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grupo_privilegio_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.grupo_privilegio_id_seq OWNED BY personas.grupo_role.id;


--
-- Name: grupo_role_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.grupo_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: persona; Type: TABLE; Schema: personas; Owner: -
--

CREATE TABLE personas.persona (
    id bigint NOT NULL,
    nombre character varying,
    apodo character varying,
    documento character varying,
    nacimiento timestamp with time zone,
    sexo character varying,
    direccion character varying,
    ciudad_id bigint,
    telefono character varying,
    social_media character varying,
    imagenes character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    email character varying,
    activo boolean DEFAULT true
);

ALTER TABLE ONLY personas.persona REPLICA IDENTITY FULL;


--
-- Name: persona_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.persona_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: persona_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.persona_id_seq OWNED BY personas.persona.id;


--
-- Name: proveedor; Type: TABLE; Schema: personas; Owner: -
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

ALTER TABLE ONLY personas.proveedor REPLICA IDENTITY FULL;


--
-- Name: proveedor_dias_visita; Type: TABLE; Schema: personas; Owner: -
--

CREATE TABLE personas.proveedor_dias_visita (
    id bigint NOT NULL,
    proveedor_id bigint,
    dia general.dias_semana,
    hora integer,
    observacion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY personas.proveedor_dias_visita REPLICA IDENTITY FULL;


--
-- Name: proveedor_dias_visita_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.proveedor_dias_visita_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedor_dias_visita_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.proveedor_dias_visita_id_seq OWNED BY personas.proveedor_dias_visita.id;


--
-- Name: proveedor_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.proveedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.proveedor_id_seq OWNED BY personas.proveedor.id;


--
-- Name: role; Type: TABLE; Schema: personas; Owner: -
--

CREATE TABLE personas.role (
    id bigint NOT NULL,
    nombre character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    grupo_role_id bigint
);

ALTER TABLE ONLY personas.role REPLICA IDENTITY FULL;


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.role_id_seq OWNED BY personas.role.id;


--
-- Name: usuario; Type: TABLE; Schema: personas; Owner: -
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

ALTER TABLE ONLY personas.usuario REPLICA IDENTITY FULL;


--
-- Name: usuario_grupo; Type: TABLE; Schema: personas; Owner: -
--

CREATE TABLE personas.usuario_grupo (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    grupo_privilegio_id bigint NOT NULL,
    modificado boolean DEFAULT false,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY personas.usuario_grupo REPLICA IDENTITY FULL;


--
-- Name: usuario_grupo_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.usuario_grupo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuario_grupo_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.usuario_grupo_id_seq OWNED BY personas.usuario_grupo.id;


--
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.usuario_id_seq OWNED BY personas.usuario.id;


--
-- Name: usuario_role; Type: TABLE; Schema: personas; Owner: -
--

CREATE TABLE personas.usuario_role (
    id bigint NOT NULL,
    role_id bigint,
    user_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY personas.usuario_role REPLICA IDENTITY FULL;


--
-- Name: usuario_role_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.usuario_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuario_role_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.usuario_role_id_seq OWNED BY personas.usuario_role.id;


--
-- Name: vendedor; Type: TABLE; Schema: personas; Owner: -
--

CREATE TABLE personas.vendedor (
    id bigint NOT NULL,
    persona_id bigint,
    activo boolean DEFAULT true,
    observacion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY personas.vendedor REPLICA IDENTITY FULL;


--
-- Name: vendedor_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.vendedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendedor_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.vendedor_id_seq OWNED BY personas.vendedor.id;


--
-- Name: vendedor_proveedor; Type: TABLE; Schema: personas; Owner: -
--

CREATE TABLE personas.vendedor_proveedor (
    id bigint NOT NULL,
    vendedor_id bigint,
    proveedor_id bigint,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    id_central bigint,
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY personas.vendedor_proveedor REPLICA IDENTITY FULL;


--
-- Name: vendedor_proveedor_id_seq; Type: SEQUENCE; Schema: personas; Owner: -
--

CREATE SEQUENCE personas.vendedor_proveedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendedor_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: -
--

ALTER SEQUENCE personas.vendedor_proveedor_id_seq OWNED BY personas.vendedor_proveedor.id;


--
-- Name: codigo; Type: TABLE; Schema: productos; Owner: -
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

ALTER TABLE ONLY productos.codigo REPLICA IDENTITY FULL;


--
-- Name: codigo_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.codigo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: codigo_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.codigo_id_seq OWNED BY productos.codigo.id;


--
-- Name: codigo_tipo_precio; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.codigo_tipo_precio (
    id bigint NOT NULL,
    codigo_id bigint NOT NULL,
    tipo_precio_id bigint NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint NOT NULL
);

ALTER TABLE ONLY productos.codigo_tipo_precio REPLICA IDENTITY FULL;


--
-- Name: codigo_tipo_precio_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.codigo_tipo_precio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: codigo_tipo_precio_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.codigo_tipo_precio_id_seq OWNED BY productos.codigo_tipo_precio.id;


--
-- Name: costo_por_producto; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.costo_por_producto (
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
    moneda_id bigint,
    cotizacion numeric
);

ALTER TABLE ONLY productos.costo_por_producto REPLICA IDENTITY FULL;


--
-- Name: costo_por_producto_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.costo_por_producto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: costo_por_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.costo_por_producto_id_seq OWNED BY productos.costo_por_producto.id;


--
-- Name: familia; Type: TABLE; Schema: productos; Owner: -
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

ALTER TABLE ONLY productos.familia REPLICA IDENTITY FULL;


--
-- Name: familia_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.familia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: familia_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.familia_id_seq OWNED BY productos.familia.id;


--
-- Name: producto_imagen; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.producto_imagen (
    id bigint NOT NULL,
    producto_id bigint,
    ruta character varying,
    principal boolean,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    sucursal_id bigint DEFAULT 0
);

ALTER TABLE ONLY productos.producto_imagen REPLICA IDENTITY FULL;


--
-- Name: imagenes_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.imagenes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.imagenes_id_seq OWNED BY productos.producto_imagen.id;


--
-- Name: pdv_categoria; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.pdv_categoria (
    id bigint NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    posicion numeric
);

ALTER TABLE ONLY productos.pdv_categoria REPLICA IDENTITY FULL;


--
-- Name: pdv_categoria_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.pdv_categoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pdv_categoria_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.pdv_categoria_id_seq OWNED BY productos.pdv_categoria.id;


--
-- Name: pdv_grupo; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.pdv_grupo (
    id bigint NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    categoria_id bigint
);

ALTER TABLE ONLY productos.pdv_grupo REPLICA IDENTITY FULL;


--
-- Name: pdv_grupo_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.pdv_grupo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pdv_grupo_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.pdv_grupo_id_seq OWNED BY productos.pdv_grupo.id;


--
-- Name: pdv_grupos_productos; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.pdv_grupos_productos (
    id bigint NOT NULL,
    producto_id bigint,
    grupo_id bigint,
    activo boolean DEFAULT true,
    usuario_id bigint,
    creado_en timestamp(0) without time zone DEFAULT now()
);

ALTER TABLE ONLY productos.pdv_grupos_productos REPLICA IDENTITY FULL;


--
-- Name: pdv_grupos_productos_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.pdv_grupos_productos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pdv_grupos_productos_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.pdv_grupos_productos_id_seq OWNED BY productos.pdv_grupos_productos.id;


--
-- Name: precio_por_sucursal; Type: TABLE; Schema: productos; Owner: -
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

ALTER TABLE ONLY productos.precio_por_sucursal REPLICA IDENTITY FULL;


--
-- Name: precio_por_sucursal_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.precio_por_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: precio_por_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.precio_por_sucursal_id_seq OWNED BY productos.precio_por_sucursal.id;


--
-- Name: presentacion; Type: TABLE; Schema: productos; Owner: -
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

ALTER TABLE ONLY productos.presentacion REPLICA IDENTITY FULL;


--
-- Name: presentacion_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.presentacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: presentacion_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.presentacion_id_seq OWNED BY productos.presentacion.id;


--
-- Name: producto; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.producto (
    id bigint NOT NULL,
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
    tipo_conservacion productos.tipo_conservacion DEFAULT 'ENFRIABLE'::productos.tipo_conservacion,
    creado_en timestamp with time zone DEFAULT now(),
    sub_familia_id bigint,
    observacion character varying,
    cambiable boolean DEFAULT false,
    es_alcoholico boolean DEFAULT false,
    unidad_por_caja_secundaria numeric DEFAULT 2,
    imagenes character varying,
    tiempo_garantia numeric,
    dias_vencimiento numeric,
    activo boolean DEFAULT true,
    is_envase boolean DEFAULT false,
    envase_id bigint
);

ALTER TABLE ONLY productos.producto REPLICA IDENTITY FULL;


--
-- Name: COLUMN producto.descripcion; Type: COMMENT; Schema: productos; Owner: -
--

COMMENT ON COLUMN productos.producto.descripcion IS 'Descripcion del producto';


--
-- Name: producto_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.producto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: producto_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.producto_id_seq OWNED BY productos.producto.id;


--
-- Name: producto_por_sucursal; Type: TABLE; Schema: productos; Owner: -
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

ALTER TABLE ONLY productos.producto_por_sucursal REPLICA IDENTITY FULL;


--
-- Name: producto_proveedor; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.producto_proveedor (
    id bigint NOT NULL,
    producto_id bigint,
    proveedor_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    ultimo_pedido_id bigint
);

ALTER TABLE ONLY productos.producto_proveedor REPLICA IDENTITY FULL;


--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.producto_proveedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.producto_proveedor_id_seq OWNED BY productos.producto_proveedor.id;


--
-- Name: productos_por_sucursal_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.productos_por_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: productos_por_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.productos_por_sucursal_id_seq OWNED BY productos.producto_por_sucursal.id;


--
-- Name: subfamilia; Type: TABLE; Schema: productos; Owner: -
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

ALTER TABLE ONLY productos.subfamilia REPLICA IDENTITY FULL;


--
-- Name: subfamilia_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.subfamilia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subfamilia_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.subfamilia_id_seq OWNED BY productos.subfamilia.id;


--
-- Name: tipo_precio; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.tipo_precio (
    id bigint NOT NULL,
    descripcion character varying,
    autorizacion boolean,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now(),
    activo boolean DEFAULT true
);

ALTER TABLE ONLY productos.tipo_precio REPLICA IDENTITY FULL;


--
-- Name: tipo_precio_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.tipo_precio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_precio_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.tipo_precio_id_seq OWNED BY productos.tipo_precio.id;


--
-- Name: tipo_presentacion; Type: TABLE; Schema: productos; Owner: -
--

CREATE TABLE productos.tipo_presentacion (
    id bigint NOT NULL,
    descripcion character varying NOT NULL,
    unico boolean DEFAULT false,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY productos.tipo_presentacion REPLICA IDENTITY FULL;


--
-- Name: tipo_presentacion_id_seq; Type: SEQUENCE; Schema: productos; Owner: -
--

CREATE SEQUENCE productos.tipo_presentacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_presentacion_id_seq; Type: SEQUENCE OWNED BY; Schema: productos; Owner: -
--

ALTER SEQUENCE productos.tipo_presentacion_id_seq OWNED BY productos.tipo_presentacion.id;


--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


--
-- Name: producto_proveedor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.producto_proveedor (
    id bigint NOT NULL,
    producto_id bigint,
    proveedor_id bigint,
    pedido_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.producto_proveedor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.producto_proveedor_id_seq OWNED BY public.producto_proveedor.id;


--
-- Name: test; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test (
    id bigint NOT NULL,
    name character varying(50) NOT NULL
);


--
-- Name: test_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_id_seq OWNED BY public.test.id;


--
-- Name: marca; Type: TABLE; Schema: vehiculos; Owner: -
--

CREATE TABLE vehiculos.marca (
    id bigint NOT NULL,
    descripcion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY vehiculos.marca REPLICA IDENTITY FULL;


--
-- Name: marca_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: -
--

CREATE SEQUENCE vehiculos.marca_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: marca_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: -
--

ALTER SEQUENCE vehiculos.marca_id_seq OWNED BY vehiculos.marca.id;


--
-- Name: modelo; Type: TABLE; Schema: vehiculos; Owner: -
--

CREATE TABLE vehiculos.modelo (
    id bigint NOT NULL,
    descripcion character varying,
    marca_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY vehiculos.modelo REPLICA IDENTITY FULL;


--
-- Name: modelo_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: -
--

CREATE SEQUENCE vehiculos.modelo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modelo_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: -
--

ALTER SEQUENCE vehiculos.modelo_id_seq OWNED BY vehiculos.modelo.id;


--
-- Name: tipo_vehiculo; Type: TABLE; Schema: vehiculos; Owner: -
--

CREATE TABLE vehiculos.tipo_vehiculo (
    id bigint NOT NULL,
    descripcion character varying,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY vehiculos.tipo_vehiculo REPLICA IDENTITY FULL;


--
-- Name: tipo_vehiculo_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: -
--

CREATE SEQUENCE vehiculos.tipo_vehiculo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_vehiculo_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: -
--

ALTER SEQUENCE vehiculos.tipo_vehiculo_id_seq OWNED BY vehiculos.tipo_vehiculo.id;


--
-- Name: vehiculo; Type: TABLE; Schema: vehiculos; Owner: -
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

ALTER TABLE ONLY vehiculos.vehiculo REPLICA IDENTITY FULL;


--
-- Name: vehiculo_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: -
--

CREATE SEQUENCE vehiculos.vehiculo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehiculo_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: -
--

ALTER SEQUENCE vehiculos.vehiculo_id_seq OWNED BY vehiculos.vehiculo.id;


--
-- Name: vehiculo_sucursal; Type: TABLE; Schema: vehiculos; Owner: -
--

CREATE TABLE vehiculos.vehiculo_sucursal (
    id bigint NOT NULL,
    sucursal_id bigint,
    vehiculo_id bigint,
    responsable_id bigint,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY vehiculos.vehiculo_sucursal REPLICA IDENTITY FULL;


--
-- Name: vehiculo_sucursal_id_seq; Type: SEQUENCE; Schema: vehiculos; Owner: -
--

CREATE SEQUENCE vehiculos.vehiculo_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehiculo_sucursal_id_seq; Type: SEQUENCE OWNED BY; Schema: vehiculos; Owner: -
--

ALTER SEQUENCE vehiculos.vehiculo_sucursal_id_seq OWNED BY vehiculos.vehiculo_sucursal.id;


--
-- Name: autorizacion id; Type: DEFAULT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.autorizacion ALTER COLUMN id SET DEFAULT nextval('administrativo.autorizacion_id_seq'::regclass);


--
-- Name: marcacion id; Type: DEFAULT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.marcacion ALTER COLUMN id SET DEFAULT nextval('administrativo.marcacion_id_seq'::regclass);


--
-- Name: actualizacion id; Type: DEFAULT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.actualizacion ALTER COLUMN id SET DEFAULT nextval('configuraciones.actualizacion_id_seq'::regclass);


--
-- Name: inicio_sesion id; Type: DEFAULT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.inicio_sesion ALTER COLUMN id SET DEFAULT nextval('configuraciones.inicio_sesion_id_seq'::regclass);


--
-- Name: local id; Type: DEFAULT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.local ALTER COLUMN id SET DEFAULT nextval('configuraciones.local_id_seq'::regclass);


--
-- Name: rabbitmq_msg id; Type: DEFAULT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.rabbitmq_msg ALTER COLUMN id SET DEFAULT nextval('configuraciones.rabbitmq_msg_id_seq'::regclass);


--
-- Name: cargo id; Type: DEFAULT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.cargo ALTER COLUMN id SET DEFAULT nextval('empresarial.cargo_id_seq'::regclass);


--
-- Name: configuracion_general id; Type: DEFAULT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.configuracion_general ALTER COLUMN id SET DEFAULT nextval('empresarial.configuracion_general_id_seq'::regclass);


--
-- Name: punto_de_venta id; Type: DEFAULT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.punto_de_venta ALTER COLUMN id SET DEFAULT nextval('empresarial.punto_de_venta_id_seq'::regclass);


--
-- Name: sector id; Type: DEFAULT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sector ALTER COLUMN id SET DEFAULT nextval('empresarial.sector_id_seq'::regclass);


--
-- Name: sucursal id; Type: DEFAULT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sucursal ALTER COLUMN id SET DEFAULT nextval('empresarial.sucursal_id_seq'::regclass);


--
-- Name: zona id; Type: DEFAULT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.zona ALTER COLUMN id SET DEFAULT nextval('empresarial.zona_id_seq'::regclass);


--
-- Name: equipo id; Type: DEFAULT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo ALTER COLUMN id SET DEFAULT nextval('equipos.equipo_id_seq'::regclass);


--
-- Name: equipo_sucursal id; Type: DEFAULT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo_sucursal ALTER COLUMN id SET DEFAULT nextval('equipos.equipo_sucursal_id_seq'::regclass);


--
-- Name: tipo_equipo id; Type: DEFAULT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.tipo_equipo ALTER COLUMN id SET DEFAULT nextval('equipos.tipo_equipo_id_seq'::regclass);


--
-- Name: banco id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.banco ALTER COLUMN id SET DEFAULT nextval('financiero.banco_id_seq'::regclass);


--
-- Name: cambio id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio ALTER COLUMN id SET DEFAULT nextval('financiero.cambio_id_seq'::regclass);


--
-- Name: cambio_caja id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio_caja ALTER COLUMN id SET DEFAULT nextval('financiero.cambio_caja_id_seq'::regclass);


--
-- Name: conteo id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo ALTER COLUMN id SET DEFAULT nextval('financiero.conteo_id_seq'::regclass);


--
-- Name: conteo_moneda id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo_moneda ALTER COLUMN id SET DEFAULT nextval('financiero.conteo_moneda_id_seq'::regclass);


--
-- Name: cuenta_bancaria id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cuenta_bancaria ALTER COLUMN id SET DEFAULT nextval('financiero.cuenta_bancaria_id_seq'::regclass);


--
-- Name: documento id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.documento ALTER COLUMN id SET DEFAULT nextval('financiero.documento_id_seq'::regclass);


--
-- Name: factura_legal id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal ALTER COLUMN id SET DEFAULT nextval('financiero.factura_legal_id_seq'::regclass);


--
-- Name: factura_legal_item id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal_item ALTER COLUMN id SET DEFAULT nextval('financiero.factura_legal_item_id_seq'::regclass);


--
-- Name: forma_pago id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.forma_pago ALTER COLUMN id SET DEFAULT nextval('financiero.forma_pago_id_seq'::regclass);


--
-- Name: gasto id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto ALTER COLUMN id SET DEFAULT nextval('financiero.gasto_id_seq'::regclass);


--
-- Name: gasto_detalle id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto_detalle ALTER COLUMN id SET DEFAULT nextval('financiero.gasto_detalle_id_seq'::regclass);


--
-- Name: moneda id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.moneda ALTER COLUMN id SET DEFAULT nextval('financiero.moneda_id_seq'::regclass);


--
-- Name: moneda_billetes id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.moneda_billetes ALTER COLUMN id SET DEFAULT nextval('financiero.moneda_billetes_id_seq'::regclass);


--
-- Name: movimiento_caja id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_caja ALTER COLUMN id SET DEFAULT nextval('financiero.movimiento_caja_id_seq'::regclass);


--
-- Name: movimiento_personas id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_personas ALTER COLUMN id SET DEFAULT nextval('financiero.movimiento_personas_id_seq'::regclass);


--
-- Name: pdv_caja id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.pdv_caja ALTER COLUMN id SET DEFAULT nextval('financiero.pdv_caja_id_seq'::regclass);


--
-- Name: retiro id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro ALTER COLUMN id SET DEFAULT nextval('financiero.retiro_id_seq'::regclass);


--
-- Name: retiro_detalle id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro_detalle ALTER COLUMN id SET DEFAULT nextval('financiero.retiro_detalle_id_seq'::regclass);


--
-- Name: sencillo id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo ALTER COLUMN id SET DEFAULT nextval('financiero.sencillo_id_seq'::regclass);


--
-- Name: sencillo_detalle id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo_detalle ALTER COLUMN id SET DEFAULT nextval('financiero.sencillo_detalle_id_seq'::regclass);


--
-- Name: timbrado id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.timbrado ALTER COLUMN id SET DEFAULT nextval('financiero.timbrado_id_seq'::regclass);


--
-- Name: timbrado_detalle id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.timbrado_detalle ALTER COLUMN id SET DEFAULT nextval('financiero.timbrado_detalle_id_seq'::regclass);


--
-- Name: tipo_gasto id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.tipo_gasto ALTER COLUMN id SET DEFAULT nextval('financiero.tipo_gasto_id_seq'::regclass);


--
-- Name: venta_credito id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito ALTER COLUMN id SET DEFAULT nextval('financiero.venta_credito_id_seq'::regclass);


--
-- Name: venta_credito_cuota id; Type: DEFAULT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito_cuota ALTER COLUMN id SET DEFAULT nextval('financiero.venta_credito_cuota_id_seq'::regclass);


--
-- Name: barrio id; Type: DEFAULT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.barrio ALTER COLUMN id SET DEFAULT nextval('general.barrio_id_seq'::regclass);


--
-- Name: ciudad id; Type: DEFAULT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.ciudad ALTER COLUMN id SET DEFAULT nextval('general.ciudad_id_seq'::regclass);


--
-- Name: contacto id; Type: DEFAULT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.contacto ALTER COLUMN id SET DEFAULT nextval('general.contacto_id_seq'::regclass);


--
-- Name: pais id; Type: DEFAULT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.pais ALTER COLUMN id SET DEFAULT nextval('general.pais_id_seq'::regclass);


--
-- Name: cobro id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro ALTER COLUMN id SET DEFAULT nextval('operaciones.cobro_id_seq'::regclass);


--
-- Name: cobro_detalle id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro_detalle ALTER COLUMN id SET DEFAULT nextval('operaciones.cobro_detalle_id_seq'::regclass);


--
-- Name: compra id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra ALTER COLUMN id SET DEFAULT nextval('operaciones.compra_id_seq'::regclass);


--
-- Name: compra_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra_item ALTER COLUMN id SET DEFAULT nextval('operaciones.compra_item_id_seq'::regclass);


--
-- Name: delivery id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery ALTER COLUMN id SET DEFAULT nextval('operaciones.delivery_id_seq'::regclass);


--
-- Name: entrada id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada ALTER COLUMN id SET DEFAULT nextval('operaciones.entrada_id_seq'::regclass);


--
-- Name: entrada_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada_item ALTER COLUMN id SET DEFAULT nextval('operaciones.entrada_item_id_seq'::regclass);


--
-- Name: inventario id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario ALTER COLUMN id SET DEFAULT nextval('operaciones.inventario_id_seq'::regclass);


--
-- Name: inventario_producto id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto ALTER COLUMN id SET DEFAULT nextval('operaciones.inventario_producto_id_seq'::regclass);


--
-- Name: inventario_producto_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto_item ALTER COLUMN id SET DEFAULT nextval('operaciones.inventario_producto_item_id_seq'::regclass);


--
-- Name: motivo_diferencia_pedido id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido ALTER COLUMN id SET DEFAULT nextval('operaciones.motivo_diferencia_pedido_id_seq'::regclass);


--
-- Name: movimiento_stock id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.movimiento_stock ALTER COLUMN id SET DEFAULT nextval('operaciones.movimiento_stock_id_seq'::regclass);


--
-- Name: necesidad id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.necesidad ALTER COLUMN id SET DEFAULT nextval('operaciones.necesidad_id_seq'::regclass);


--
-- Name: necesidad_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.necesidad_item ALTER COLUMN id SET DEFAULT nextval('operaciones.necesidad_item_id_seq'::regclass);


--
-- Name: nota_pedido id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_pedido ALTER COLUMN id SET DEFAULT nextval('operaciones.nota_pedido_id_seq'::regclass);


--
-- Name: nota_recepcion id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion ALTER COLUMN id SET DEFAULT nextval('operaciones.nota_recepcion_id_seq'::regclass);


--
-- Name: nota_recepcion_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion_item ALTER COLUMN id SET DEFAULT nextval('operaciones.nota_recepcion_item_id_seq'::regclass);


--
-- Name: pedido id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido ALTER COLUMN id SET DEFAULT nextval('operaciones.pedido_id_seq'::regclass);


--
-- Name: pedido_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido_item ALTER COLUMN id SET DEFAULT nextval('operaciones.pedido_item_id_seq'::regclass);


--
-- Name: pedido_item_sucursal id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido_item_sucursal ALTER COLUMN id SET DEFAULT nextval('operaciones.pedido_item_sucursal_id_seq'::regclass);


--
-- Name: precio_delivery id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.precio_delivery ALTER COLUMN id SET DEFAULT nextval('operaciones.precio_delivery_id_seq'::regclass);


--
-- Name: programar_precio id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.programar_precio ALTER COLUMN id SET DEFAULT nextval('operaciones.programar_precio_id_seq'::regclass);


--
-- Name: salida id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida ALTER COLUMN id SET DEFAULT nextval('operaciones.salida_id_seq'::regclass);


--
-- Name: salida_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida_item ALTER COLUMN id SET DEFAULT nextval('operaciones.salida_item_id_seq'::regclass);


--
-- Name: transferencia id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia ALTER COLUMN id SET DEFAULT nextval('operaciones.transferencia_id_seq'::regclass);


--
-- Name: transferencia_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia_item ALTER COLUMN id SET DEFAULT nextval('operaciones.transferencia_item_id_seq'::regclass);


--
-- Name: venta id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta ALTER COLUMN id SET DEFAULT nextval('operaciones.venta_id_seq'::regclass);


--
-- Name: venta_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta_item ALTER COLUMN id SET DEFAULT nextval('operaciones.venta_item_id_seq'::regclass);


--
-- Name: vuelto id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto ALTER COLUMN id SET DEFAULT nextval('operaciones.vuelto_id_seq'::regclass);


--
-- Name: vuelto_item id; Type: DEFAULT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto_item ALTER COLUMN id SET DEFAULT nextval('operaciones.vuelto_item_id_seq'::regclass);


--
-- Name: cliente id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.cliente ALTER COLUMN id SET DEFAULT nextval('personas.cliente_id_seq'::regclass);


--
-- Name: funcionario id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.funcionario ALTER COLUMN id SET DEFAULT nextval('personas.funcionario_id_seq'::regclass);


--
-- Name: grupo_role id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.grupo_role ALTER COLUMN id SET DEFAULT nextval('personas.grupo_privilegio_id_seq'::regclass);


--
-- Name: persona id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.persona ALTER COLUMN id SET DEFAULT nextval('personas.persona_id_seq'::regclass);


--
-- Name: proveedor id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.proveedor ALTER COLUMN id SET DEFAULT nextval('personas.proveedor_id_seq'::regclass);


--
-- Name: proveedor_dias_visita id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.proveedor_dias_visita ALTER COLUMN id SET DEFAULT nextval('personas.proveedor_dias_visita_id_seq'::regclass);


--
-- Name: role id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.role ALTER COLUMN id SET DEFAULT nextval('personas.role_id_seq'::regclass);


--
-- Name: usuario id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario ALTER COLUMN id SET DEFAULT nextval('personas.usuario_id_seq'::regclass);


--
-- Name: usuario_grupo id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario_grupo ALTER COLUMN id SET DEFAULT nextval('personas.usuario_grupo_id_seq'::regclass);


--
-- Name: usuario_role id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario_role ALTER COLUMN id SET DEFAULT nextval('personas.usuario_role_id_seq'::regclass);


--
-- Name: vendedor id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor ALTER COLUMN id SET DEFAULT nextval('personas.vendedor_id_seq'::regclass);


--
-- Name: vendedor_proveedor id; Type: DEFAULT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor_proveedor ALTER COLUMN id SET DEFAULT nextval('personas.vendedor_proveedor_id_seq'::regclass);


--
-- Name: codigo id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo ALTER COLUMN id SET DEFAULT nextval('productos.codigo_id_seq'::regclass);


--
-- Name: codigo_tipo_precio id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo_tipo_precio ALTER COLUMN id SET DEFAULT nextval('productos.codigo_tipo_precio_id_seq'::regclass);


--
-- Name: costo_por_producto id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.costo_por_producto ALTER COLUMN id SET DEFAULT nextval('productos.costo_por_producto_id_seq'::regclass);


--
-- Name: familia id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.familia ALTER COLUMN id SET DEFAULT nextval('productos.familia_id_seq'::regclass);


--
-- Name: pdv_categoria id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_categoria ALTER COLUMN id SET DEFAULT nextval('productos.pdv_categoria_id_seq'::regclass);


--
-- Name: pdv_grupo id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_grupo ALTER COLUMN id SET DEFAULT nextval('productos.pdv_grupo_id_seq'::regclass);


--
-- Name: pdv_grupos_productos id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_grupos_productos ALTER COLUMN id SET DEFAULT nextval('productos.pdv_grupos_productos_id_seq'::regclass);


--
-- Name: precio_por_sucursal id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.precio_por_sucursal ALTER COLUMN id SET DEFAULT nextval('productos.precio_por_sucursal_id_seq'::regclass);


--
-- Name: presentacion id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.presentacion ALTER COLUMN id SET DEFAULT nextval('productos.presentacion_id_seq'::regclass);


--
-- Name: producto id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto ALTER COLUMN id SET DEFAULT nextval('productos.producto_id_seq'::regclass);


--
-- Name: producto_imagen id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_imagen ALTER COLUMN id SET DEFAULT nextval('productos.imagenes_id_seq'::regclass);


--
-- Name: producto_por_sucursal id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_por_sucursal ALTER COLUMN id SET DEFAULT nextval('productos.productos_por_sucursal_id_seq'::regclass);


--
-- Name: producto_proveedor id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_proveedor ALTER COLUMN id SET DEFAULT nextval('productos.producto_proveedor_id_seq'::regclass);


--
-- Name: subfamilia id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.subfamilia ALTER COLUMN id SET DEFAULT nextval('productos.subfamilia_id_seq'::regclass);


--
-- Name: tipo_precio id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.tipo_precio ALTER COLUMN id SET DEFAULT nextval('productos.tipo_precio_id_seq'::regclass);


--
-- Name: tipo_presentacion id; Type: DEFAULT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.tipo_presentacion ALTER COLUMN id SET DEFAULT nextval('productos.tipo_presentacion_id_seq'::regclass);


--
-- Name: producto_proveedor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_proveedor ALTER COLUMN id SET DEFAULT nextval('public.producto_proveedor_id_seq'::regclass);


--
-- Name: test id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test ALTER COLUMN id SET DEFAULT nextval('public.test_id_seq'::regclass);


--
-- Name: marca id; Type: DEFAULT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.marca ALTER COLUMN id SET DEFAULT nextval('vehiculos.marca_id_seq'::regclass);


--
-- Name: modelo id; Type: DEFAULT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.modelo ALTER COLUMN id SET DEFAULT nextval('vehiculos.modelo_id_seq'::regclass);


--
-- Name: tipo_vehiculo id; Type: DEFAULT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.tipo_vehiculo ALTER COLUMN id SET DEFAULT nextval('vehiculos.tipo_vehiculo_id_seq'::regclass);


--
-- Name: vehiculo id; Type: DEFAULT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo ALTER COLUMN id SET DEFAULT nextval('vehiculos.vehiculo_id_seq'::regclass);


--
-- Name: vehiculo_sucursal id; Type: DEFAULT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal ALTER COLUMN id SET DEFAULT nextval('vehiculos.vehiculo_sucursal_id_seq'::regclass);


--
-- Name: autorizacion autorizacion_pk; Type: CONSTRAINT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_pk PRIMARY KEY (id, sucursal_id);


--
-- Name: marcacion marcacion_pkey; Type: CONSTRAINT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.marcacion
    ADD CONSTRAINT marcacion_pkey PRIMARY KEY (id);


--
-- Name: actualizacion actualizacion_current_version_key; Type: CONSTRAINT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.actualizacion
    ADD CONSTRAINT actualizacion_current_version_key UNIQUE (current_version);


--
-- Name: inicio_sesion inicio_sesion_pk; Type: CONSTRAINT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.inicio_sesion
    ADD CONSTRAINT inicio_sesion_pk PRIMARY KEY (id, sucursal_id);


--
-- Name: local local_pkey; Type: CONSTRAINT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_pkey PRIMARY KEY (id);


--
-- Name: local local_un; Type: CONSTRAINT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_un UNIQUE (sucursal_id);


--
-- Name: rabbitmq_msg rabbitmq_msg_pkey; Type: CONSTRAINT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.rabbitmq_msg
    ADD CONSTRAINT rabbitmq_msg_pkey PRIMARY KEY (id);


--
-- Name: cargo cargo_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.cargo
    ADD CONSTRAINT cargo_pkey PRIMARY KEY (id);


--
-- Name: cargo cargo_un_id_central; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.cargo
    ADD CONSTRAINT cargo_un_id_central UNIQUE (id_central);


--
-- Name: configuracion_general configuracion_general_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.configuracion_general
    ADD CONSTRAINT configuracion_general_pkey PRIMARY KEY (id);


--
-- Name: punto_de_venta punto_de_venta_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.punto_de_venta
    ADD CONSTRAINT punto_de_venta_pkey PRIMARY KEY (id);


--
-- Name: sector sector_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sector
    ADD CONSTRAINT sector_pkey PRIMARY KEY (id);


--
-- Name: sector sector_unique; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sector
    ADD CONSTRAINT sector_unique UNIQUE (sucursal_id, descripcion);


--
-- Name: sucursal sucursal_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sucursal
    ADD CONSTRAINT sucursal_pkey PRIMARY KEY (id);


--
-- Name: sucursal sucursal_un; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sucursal
    ADD CONSTRAINT sucursal_un UNIQUE (nombre);


--
-- Name: zona zona_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.zona
    ADD CONSTRAINT zona_pkey PRIMARY KEY (id);


--
-- Name: zona zona_unique; Type: CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.zona
    ADD CONSTRAINT zona_unique UNIQUE (sector_id, descripcion);


--
-- Name: equipo equipo_pkey; Type: CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo
    ADD CONSTRAINT equipo_pkey PRIMARY KEY (id);


--
-- Name: equipo_sucursal equipo_sucursal_pkey; Type: CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo_sucursal
    ADD CONSTRAINT equipo_sucursal_pkey PRIMARY KEY (id);


--
-- Name: equipo equipo_un; Type: CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo
    ADD CONSTRAINT equipo_un UNIQUE (descripcion);


--
-- Name: tipo_equipo tipo_equipo_pkey; Type: CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.tipo_equipo
    ADD CONSTRAINT tipo_equipo_pkey PRIMARY KEY (id);


--
-- Name: banco banco_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.banco
    ADD CONSTRAINT banco_pkey PRIMARY KEY (id);


--
-- Name: banco banco_un; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.banco
    ADD CONSTRAINT banco_un UNIQUE (nombre);


--
-- Name: cambio cambio_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio
    ADD CONSTRAINT cambio_pkey PRIMARY KEY (id);


--
-- Name: cambio cambio_un_id_central; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio
    ADD CONSTRAINT cambio_un_id_central UNIQUE (id_central);


--
-- Name: conteo_moneda conteo_moneda_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo_moneda
    ADD CONSTRAINT conteo_moneda_pkey PRIMARY KEY (id);


--
-- Name: conteo conteo_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo
    ADD CONSTRAINT conteo_pkey PRIMARY KEY (id);


--
-- Name: cuenta_bancaria cuenta_bancaria_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_pkey PRIMARY KEY (id);


--
-- Name: documento documento_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.documento
    ADD CONSTRAINT documento_pkey PRIMARY KEY (id);


--
-- Name: documento documento_un; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.documento
    ADD CONSTRAINT documento_un UNIQUE (descripcion);


--
-- Name: factura_legal_item factura_legal_item_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal_item
    ADD CONSTRAINT factura_legal_item_pkey PRIMARY KEY (id);


--
-- Name: factura_legal factura_legal_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_pkey PRIMARY KEY (id);


--
-- Name: forma_pago forma_pago_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.forma_pago
    ADD CONSTRAINT forma_pago_pkey PRIMARY KEY (id);


--
-- Name: forma_pago forma_pago_un; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.forma_pago
    ADD CONSTRAINT forma_pago_un UNIQUE (descripcion);


--
-- Name: gasto_detalle gasto_detalle_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto_detalle
    ADD CONSTRAINT gasto_detalle_pkey PRIMARY KEY (id);


--
-- Name: gasto gasto_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT gasto_pkey PRIMARY KEY (id);


--
-- Name: maletin maletin_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.maletin
    ADD CONSTRAINT maletin_pkey PRIMARY KEY (id);


--
-- Name: maletin maletin_un_descripcion; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.maletin
    ADD CONSTRAINT maletin_un_descripcion UNIQUE (descripcion);


--
-- Name: moneda_billetes moneda_billetes_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.moneda_billetes
    ADD CONSTRAINT moneda_billetes_pkey PRIMARY KEY (id);


--
-- Name: moneda moneda_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.moneda
    ADD CONSTRAINT moneda_pkey PRIMARY KEY (id);


--
-- Name: moneda moneda_un; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.moneda
    ADD CONSTRAINT moneda_un UNIQUE (denominacion);


--
-- Name: cambio_caja mov_cambio_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_pkey PRIMARY KEY (id);


--
-- Name: movimiento_caja movimiento_caja_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_pkey PRIMARY KEY (id);


--
-- Name: movimiento_personas movimiento_personas_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_personas
    ADD CONSTRAINT movimiento_personas_pkey PRIMARY KEY (id);


--
-- Name: pdv_caja pdv_caja_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_pkey PRIMARY KEY (id);


--
-- Name: retiro_detalle retiro_detalle_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro_detalle
    ADD CONSTRAINT retiro_detalle_pkey PRIMARY KEY (id);


--
-- Name: retiro retiro_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_pkey PRIMARY KEY (id);


--
-- Name: sencillo_detalle sencillo_detalle_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_pkey PRIMARY KEY (id);


--
-- Name: sencillo sencillo_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_pkey PRIMARY KEY (id);


--
-- Name: timbrado_detalle timbrado_detalle_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.timbrado_detalle
    ADD CONSTRAINT timbrado_detalle_pkey PRIMARY KEY (id);


--
-- Name: timbrado timbrado_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.timbrado
    ADD CONSTRAINT timbrado_pkey PRIMARY KEY (id);


--
-- Name: tipo_gasto tipo_gasto_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.tipo_gasto
    ADD CONSTRAINT tipo_gasto_pkey PRIMARY KEY (id);


--
-- Name: venta_credito_cuota venta_credito_cuota_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito_cuota
    ADD CONSTRAINT venta_credito_cuota_pkey PRIMARY KEY (id);


--
-- Name: venta_credito venta_credito_pkey; Type: CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito
    ADD CONSTRAINT venta_credito_pkey PRIMARY KEY (id);


--
-- Name: barrio barrio_pkey; Type: CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.barrio
    ADD CONSTRAINT barrio_pkey PRIMARY KEY (id);


--
-- Name: barrio barrio_un; Type: CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.barrio
    ADD CONSTRAINT barrio_un UNIQUE (descripcion);


--
-- Name: ciudad ciudad_pkey; Type: CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.ciudad
    ADD CONSTRAINT ciudad_pkey PRIMARY KEY (id);


--
-- Name: ciudad ciudad_un; Type: CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.ciudad
    ADD CONSTRAINT ciudad_un UNIQUE (descripcion);


--
-- Name: contacto contacto_email_un; Type: CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_email_un UNIQUE (email);


--
-- Name: contacto contacto_pkey; Type: CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_pkey PRIMARY KEY (id);


--
-- Name: pais pais_pkey; Type: CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.pais
    ADD CONSTRAINT pais_pkey PRIMARY KEY (id);


--
-- Name: pais pais_un; Type: CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.pais
    ADD CONSTRAINT pais_un UNIQUE (descripcion);


--
-- Name: cobro_detalle cobro_detalle_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_pkey PRIMARY KEY (id);


--
-- Name: cobro cobro_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro
    ADD CONSTRAINT cobro_pkey PRIMARY KEY (id);


--
-- Name: compra_item compra_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_pkey PRIMARY KEY (id);


--
-- Name: compra compra_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_pkey PRIMARY KEY (id);


--
-- Name: delivery delivery_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_pkey PRIMARY KEY (id);


--
-- Name: entrada_item entrada_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_pkey PRIMARY KEY (id);


--
-- Name: entrada entrada_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada
    ADD CONSTRAINT entrada_pkey PRIMARY KEY (id);


--
-- Name: inventario inventario_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario
    ADD CONSTRAINT inventario_pkey PRIMARY KEY (id);


--
-- Name: inventario_producto_item inventario_producto_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_item_pkey PRIMARY KEY (id);


--
-- Name: inventario_producto inventario_producto_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_pkey PRIMARY KEY (id);


--
-- Name: inventario_producto inventario_producto_un; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_un UNIQUE (inventario_id, zona_id);


--
-- Name: motivo_diferencia_pedido motivo_diferencia_pedido_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido
    ADD CONSTRAINT motivo_diferencia_pedido_pkey PRIMARY KEY (id);


--
-- Name: movimiento_stock movimientos_stock_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimientos_stock_pkey PRIMARY KEY (id);


--
-- Name: necesidad_item necesidad_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.necesidad_item
    ADD CONSTRAINT necesidad_item_pkey PRIMARY KEY (id);


--
-- Name: necesidad necesidad_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.necesidad
    ADD CONSTRAINT necesidad_pkey PRIMARY KEY (id);


--
-- Name: nota_pedido nota_pedido_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_pedido
    ADD CONSTRAINT nota_pedido_pkey PRIMARY KEY (id);


--
-- Name: nota_recepcion_item nota_recepcion_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion_item
    ADD CONSTRAINT nota_recepcion_item_pkey PRIMARY KEY (id);


--
-- Name: nota_recepcion nota_recepcion_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_pkey PRIMARY KEY (id);


--
-- Name: pedido_item pedido_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_pkey PRIMARY KEY (id);


--
-- Name: pedido_item_sucursal pedido_item_sucursal_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido_item_sucursal
    ADD CONSTRAINT pedido_item_sucursal_pkey PRIMARY KEY (id);


--
-- Name: pedido pedido_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_pkey PRIMARY KEY (id);


--
-- Name: precio_delivery precio_delivery_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.precio_delivery
    ADD CONSTRAINT precio_delivery_pkey PRIMARY KEY (id);

ALTER TABLE operaciones.precio_delivery CLUSTER ON precio_delivery_pkey;


--
-- Name: programar_precio programar_precio_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.programar_precio
    ADD CONSTRAINT programar_precio_pkey PRIMARY KEY (id);


--
-- Name: salida_item salida_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_pkey PRIMARY KEY (id);


--
-- Name: salida salida_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida
    ADD CONSTRAINT salida_pkey PRIMARY KEY (id);


--
-- Name: stock_por_producto_sucursal stock_por_producto_sucursal_pk; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.stock_por_producto_sucursal
    ADD CONSTRAINT stock_por_producto_sucursal_pk PRIMARY KEY (producto_id, sucursal_id);


--
-- Name: transferencia_item transferencia_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_pkey PRIMARY KEY (id);


--
-- Name: transferencia transferencia_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_pkey PRIMARY KEY (id);


--
-- Name: venta_item venta_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_pkey PRIMARY KEY (id);


--
-- Name: venta venta_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_pkey PRIMARY KEY (id);


--
-- Name: venta venta_unique; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_unique UNIQUE (delivery_id, sucursal_id);


--
-- Name: vuelto_item vuelto_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto_item
    ADD CONSTRAINT vuelto_item_pkey PRIMARY KEY (id);


--
-- Name: vuelto vuelto_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto
    ADD CONSTRAINT vuelto_pkey PRIMARY KEY (id);


--
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id);


--
-- Name: cliente cliente_un; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.cliente
    ADD CONSTRAINT cliente_un UNIQUE (persona_id);


--
-- Name: funcionario funcionario_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_pkey PRIMARY KEY (id);


--
-- Name: funcionario funcionario_un_persona; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_un_persona UNIQUE (persona_id);


--
-- Name: grupo_role grupo_privilegio_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.grupo_role
    ADD CONSTRAINT grupo_privilegio_pkey PRIMARY KEY (id);


--
-- Name: grupo_role grupo_role_un; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.grupo_role
    ADD CONSTRAINT grupo_role_un UNIQUE (descripcion);


--
-- Name: persona persona_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.persona
    ADD CONSTRAINT persona_pkey PRIMARY KEY (id);


--
-- Name: persona persona_un_documento; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.persona
    ADD CONSTRAINT persona_un_documento UNIQUE (documento);


--
-- Name: proveedor_dias_visita proveedor_dias_visita_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.proveedor_dias_visita
    ADD CONSTRAINT proveedor_dias_visita_pkey PRIMARY KEY (id);


--
-- Name: proveedor proveedor_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.proveedor
    ADD CONSTRAINT proveedor_pkey PRIMARY KEY (id);


--
-- Name: role role_nombre_un; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_nombre_un UNIQUE (nombre);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: usuario_grupo usuario_grupo_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario_grupo
    ADD CONSTRAINT usuario_grupo_pkey PRIMARY KEY (id);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: usuario_role usuario_role_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario_role
    ADD CONSTRAINT usuario_role_pkey PRIMARY KEY (id);


--
-- Name: usuario_role usuario_role_un; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario_role
    ADD CONSTRAINT usuario_role_un UNIQUE (role_id, user_id);


--
-- Name: usuario usuario_un_nickname; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_un_nickname UNIQUE (nickname);


--
-- Name: usuario usuario_un_persona; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_un_persona UNIQUE (persona_id);


--
-- Name: vendedor vendedor_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor
    ADD CONSTRAINT vendedor_pkey PRIMARY KEY (id);


--
-- Name: vendedor_proveedor vendedor_proveedor_pkey; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor_proveedor
    ADD CONSTRAINT vendedor_proveedor_pkey PRIMARY KEY (id);


--
-- Name: vendedor_proveedor vendedor_proveedor_un_id_central; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor_proveedor
    ADD CONSTRAINT vendedor_proveedor_un_id_central UNIQUE (id_central);


--
-- Name: vendedor vendedor_un; Type: CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor
    ADD CONSTRAINT vendedor_un UNIQUE (persona_id);


--
-- Name: codigo codigo_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_pkey PRIMARY KEY (id);


--
-- Name: codigo_tipo_precio codigo_tipo_precio_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo_tipo_precio
    ADD CONSTRAINT codigo_tipo_precio_pkey PRIMARY KEY (id);


--
-- Name: codigo codigo_un; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_un UNIQUE (codigo);


--
-- Name: codigo codigo_un_presentacion_principal; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_un_presentacion_principal UNIQUE (principal, presentacion_id);


--
-- Name: costo_por_producto costos_por_sucursal_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.costo_por_producto
    ADD CONSTRAINT costos_por_sucursal_pkey PRIMARY KEY (id);


--
-- Name: familia familia_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.familia
    ADD CONSTRAINT familia_pkey PRIMARY KEY (id);


--
-- Name: familia familia_unique; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.familia
    ADD CONSTRAINT familia_unique UNIQUE (nombre);


--
-- Name: producto_imagen imagenes_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_imagen
    ADD CONSTRAINT imagenes_pkey PRIMARY KEY (id);


--
-- Name: pdv_categoria pdv_categoria_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_categoria
    ADD CONSTRAINT pdv_categoria_pkey PRIMARY KEY (id);


--
-- Name: pdv_grupo pdv_grupo_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_grupo
    ADD CONSTRAINT pdv_grupo_pkey PRIMARY KEY (id);


--
-- Name: pdv_grupos_productos pdv_grupos_productos_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_grupos_productos
    ADD CONSTRAINT pdv_grupos_productos_pkey PRIMARY KEY (id);


--
-- Name: precio_por_sucursal precio_por_sucursal_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_pkey PRIMARY KEY (id);


--
-- Name: precio_por_sucursal precio_por_sucursal_un_presentacion_tipo_precio; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_un_presentacion_tipo_precio UNIQUE (presentacion_id, tipo_precio_id);


--
-- Name: presentacion presentacion_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.presentacion
    ADD CONSTRAINT presentacion_pkey PRIMARY KEY (id);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id);


--
-- Name: producto_por_sucursal producto_por_sucursal_pk; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_por_sucursal
    ADD CONSTRAINT producto_por_sucursal_pk PRIMARY KEY (id);


--
-- Name: producto_proveedor producto_proveedor_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_proveedor
    ADD CONSTRAINT producto_proveedor_pkey PRIMARY KEY (id);


--
-- Name: producto producto_un_producto; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto
    ADD CONSTRAINT producto_un_producto UNIQUE (descripcion);


--
-- Name: subfamilia subfamilia_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.subfamilia
    ADD CONSTRAINT subfamilia_pkey PRIMARY KEY (id);


--
-- Name: tipo_precio tipo_precio_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.tipo_precio
    ADD CONSTRAINT tipo_precio_pkey PRIMARY KEY (id);


--
-- Name: tipo_precio tipo_precio_un; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.tipo_precio
    ADD CONSTRAINT tipo_precio_un UNIQUE (descripcion);


--
-- Name: tipo_presentacion tipo_presentacion_pkey; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.tipo_presentacion
    ADD CONSTRAINT tipo_presentacion_pkey PRIMARY KEY (id);


--
-- Name: tipo_presentacion tipo_presentacion_un; Type: CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.tipo_presentacion
    ADD CONSTRAINT tipo_presentacion_un UNIQUE (descripcion);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: producto_proveedor producto_proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_proveedor
    ADD CONSTRAINT producto_proveedor_pkey PRIMARY KEY (id);


--
-- Name: test test_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test
    ADD CONSTRAINT test_pkey PRIMARY KEY (id);


--
-- Name: marca marca_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.marca
    ADD CONSTRAINT marca_pkey PRIMARY KEY (id);


--
-- Name: modelo modelo_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.modelo
    ADD CONSTRAINT modelo_pkey PRIMARY KEY (id);


--
-- Name: tipo_vehiculo tipo_vehiculo_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.tipo_vehiculo
    ADD CONSTRAINT tipo_vehiculo_pkey PRIMARY KEY (id);


--
-- Name: vehiculo vehiculo_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo
    ADD CONSTRAINT vehiculo_pkey PRIMARY KEY (id);


--
-- Name: vehiculo_sucursal vehiculo_sucursal_pkey; Type: CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal
    ADD CONSTRAINT vehiculo_sucursal_pkey PRIMARY KEY (id);


--
-- Name: conteo_moneda_conteo_id_idx; Type: INDEX; Schema: financiero; Owner: -
--

CREATE INDEX conteo_moneda_conteo_id_idx ON financiero.conteo_moneda USING btree (conteo_id, sucursal_id);


--
-- Name: cobro_detalle_cobro_id_idx; Type: INDEX; Schema: operaciones; Owner: -
--

CREATE INDEX cobro_detalle_cobro_id_idx ON operaciones.cobro_detalle USING btree (cobro_id, sucursal_id);


--
-- Name: movimiento_stock_producto_id_idx; Type: INDEX; Schema: operaciones; Owner: -
--

CREATE INDEX movimiento_stock_producto_id_idx ON operaciones.movimiento_stock USING btree (producto_id, sucursal_id);


--
-- Name: transferencia_item_transferencia_id_idx; Type: INDEX; Schema: operaciones; Owner: -
--

CREATE INDEX transferencia_item_transferencia_id_idx ON operaciones.transferencia_item USING btree (transferencia_id);


--
-- Name: venta_caja_id_idx; Type: INDEX; Schema: operaciones; Owner: -
--

CREATE INDEX venta_caja_id_idx ON operaciones.venta USING btree (caja_id, sucursal_id);


--
-- Name: costo_por_producto_producto_id_idx; Type: INDEX; Schema: productos; Owner: -
--

CREATE INDEX costo_por_producto_producto_id_idx ON productos.costo_por_producto USING btree (producto_id);


--
-- Name: precio_por_sucursal_presentacion_id_idx; Type: INDEX; Schema: productos; Owner: -
--

CREATE INDEX precio_por_sucursal_presentacion_id_idx ON productos.precio_por_sucursal USING btree (presentacion_id);


--
-- Name: presentacion_producto_id_idx; Type: INDEX; Schema: productos; Owner: -
--

CREATE INDEX presentacion_producto_id_idx ON productos.presentacion USING btree (producto_id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: stock_por_producto_sucursal keep_table_clean; Type: TRIGGER; Schema: operaciones; Owner: -
--

CREATE TRIGGER keep_table_clean AFTER INSERT ON operaciones.stock_por_producto_sucursal FOR EACH ROW EXECUTE FUNCTION public.delete_new_record();


--
-- Name: autorizacion autorizacion_autorizador_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_autorizador_id_fkey FOREIGN KEY (autorizador_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: autorizacion autorizacion_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: autorizacion autorizacion_sucursal_id_fk; Type: FK CONSTRAINT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_sucursal_id_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: autorizacion autorizacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.autorizacion
    ADD CONSTRAINT autorizacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: marcacion marcacion_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.marcacion
    ADD CONSTRAINT marcacion_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: marcacion marcacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: administrativo; Owner: -
--

ALTER TABLE ONLY administrativo.marcacion
    ADD CONSTRAINT marcacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inicio_sesion inicio_sesion_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.inicio_sesion
    ADD CONSTRAINT inicio_sesion_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: local local_equipo_id_fkey; Type: FK CONSTRAINT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES equipos.equipo(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: local local_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: local local_usuario_id_fkey; Type: FK CONSTRAINT; Schema: configuraciones; Owner: -
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cargo cargo_supervisado_por_id_fkey; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.cargo
    ADD CONSTRAINT cargo_supervisado_por_id_fkey FOREIGN KEY (supervisado_por_id) REFERENCES empresarial.cargo(id);


--
-- Name: cargo cargo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.cargo
    ADD CONSTRAINT cargo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: punto_de_venta punto_de_venta_sucursal_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.punto_de_venta
    ADD CONSTRAINT punto_de_venta_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: configuracion_general punto_de_venta_usuario_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.configuracion_general
    ADD CONSTRAINT punto_de_venta_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON DELETE SET NULL;


--
-- Name: punto_de_venta punto_de_venta_usuario_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.punto_de_venta
    ADD CONSTRAINT punto_de_venta_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sector sector_sucursal_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sector
    ADD CONSTRAINT sector_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sector sector_usuario_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sector
    ADD CONSTRAINT sector_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: zona sector_usuario_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.zona
    ADD CONSTRAINT sector_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sucursal sucursal_ciudad_id_fkey; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sucursal
    ADD CONSTRAINT sucursal_ciudad_id_fkey FOREIGN KEY (ciudad_id) REFERENCES general.ciudad(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sucursal sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.sucursal
    ADD CONSTRAINT sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: zona zona_sector_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: -
--

ALTER TABLE ONLY empresarial.zona
    ADD CONSTRAINT zona_sector_fk FOREIGN KEY (sector_id) REFERENCES empresarial.sector(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: equipo_sucursal equipo_sucursal_autorizado_por_id_fk; Type: FK CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo_sucursal
    ADD CONSTRAINT equipo_sucursal_autorizado_por_id_fk FOREIGN KEY (autorizado_por) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: equipo_sucursal equipo_sucursal_equipo_id_fk; Type: FK CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo_sucursal
    ADD CONSTRAINT equipo_sucursal_equipo_id_fk FOREIGN KEY (equipo_id) REFERENCES equipos.equipo(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: equipo_sucursal equipo_sucursal_responsable_id_fk; Type: FK CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo_sucursal
    ADD CONSTRAINT equipo_sucursal_responsable_id_fk FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: equipo_sucursal equipo_sucursal_sucursal_id_fk; Type: FK CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo_sucursal
    ADD CONSTRAINT equipo_sucursal_sucursal_id_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: equipo equipo_tipo_equipo_id_fkey1; Type: FK CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo
    ADD CONSTRAINT equipo_tipo_equipo_id_fkey1 FOREIGN KEY (tipo_equipo_id) REFERENCES equipos.tipo_equipo(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: equipo equipo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: equipos; Owner: -
--

ALTER TABLE ONLY equipos.equipo
    ADD CONSTRAINT equipo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: banco banco_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.banco
    ADD CONSTRAINT banco_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: gasto cambio_autorizado_por_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT cambio_autorizado_por_id_fkey FOREIGN KEY (autorizado_por_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cambio_caja cambio_caja_pdv_caja_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT cambio_caja_pdv_caja_fk FOREIGN KEY (caja_id) REFERENCES financiero.pdv_caja(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cambio cambio_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio
    ADD CONSTRAINT cambio_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gasto cambio_responsable_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT cambio_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cambio cambio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio
    ADD CONSTRAINT cambio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: gasto cambio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT cambio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conteo_moneda conteo_moneda_conteo_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo_moneda
    ADD CONSTRAINT conteo_moneda_conteo_id_fkey FOREIGN KEY (conteo_id) REFERENCES financiero.conteo(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conteo_moneda conteo_moneda_moneda_billetes_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo_moneda
    ADD CONSTRAINT conteo_moneda_moneda_billetes_id_fkey FOREIGN KEY (moneda_billetes_id) REFERENCES financiero.moneda_billetes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conteo_moneda conteo_moneda_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo_moneda
    ADD CONSTRAINT conteo_moneda_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conteo_moneda conteo_moneda_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo_moneda
    ADD CONSTRAINT conteo_moneda_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conteo conteo_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo
    ADD CONSTRAINT conteo_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cuenta_bancaria cuenta_bancaria_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_fk FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cuenta_bancaria cuenta_bancaria_fk__persona; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_fk__persona FOREIGN KEY (persona_id) REFERENCES personas.persona(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cuenta_bancaria cuenta_bancaria_fk_banco; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_fk_banco FOREIGN KEY (banco_id) REFERENCES financiero.banco(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cuenta_bancaria cuenta_bancaria_fk_usuario; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documento documento_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.documento
    ADD CONSTRAINT documento_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: factura_legal factura_legal_caja_id_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_caja_id_fk FOREIGN KEY (caja_id) REFERENCES financiero.pdv_caja(id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: factura_legal factura_legal_cliente_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_cliente_fk FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id);


--
-- Name: factura_legal_item factura_legal_item_presentacion_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal_item
    ADD CONSTRAINT factura_legal_item_presentacion_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id) ON DELETE SET NULL;


--
-- Name: factura_legal_item factura_legal_item_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal_item
    ADD CONSTRAINT factura_legal_item_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: factura_legal_item factura_legal_item_venta_item_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal_item
    ADD CONSTRAINT factura_legal_item_venta_item_fk FOREIGN KEY (venta_item_id) REFERENCES operaciones.venta_item(id) ON DELETE SET NULL;


--
-- Name: factura_legal factura_legal_timbrado_detalle_id_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_timbrado_detalle_id_fk FOREIGN KEY (timbrado_detalle_id) REFERENCES financiero.timbrado_detalle(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: factura_legal factura_legal_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: factura_legal factura_legal_venta_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_venta_fk FOREIGN KEY (venta_id) REFERENCES operaciones.venta(id);


--
-- Name: forma_pago forma_pago_cuenta_bancaria_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.forma_pago
    ADD CONSTRAINT forma_pago_cuenta_bancaria_id_fkey FOREIGN KEY (cuenta_bancaria_id) REFERENCES financiero.cuenta_bancaria(id);


--
-- Name: forma_pago forma_pago_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.forma_pago
    ADD CONSTRAINT forma_pago_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: gasto_detalle gasto_detalle_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto_detalle
    ADD CONSTRAINT gasto_detalle_fk FOREIGN KEY (gasto_id) REFERENCES financiero.gasto(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gasto_detalle gasto_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto_detalle
    ADD CONSTRAINT gasto_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gasto_detalle gasto_detalle_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto_detalle
    ADD CONSTRAINT gasto_detalle_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gasto_detalle gasto_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto_detalle
    ADD CONSTRAINT gasto_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: gasto gasto_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT gasto_fk FOREIGN KEY (caja_id) REFERENCES financiero.pdv_caja(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gasto gasto_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT gasto_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gasto gasto_sucursal_vuelto_id_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT gasto_sucursal_vuelto_id_fk FOREIGN KEY (sucursal_vuelto_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tipo_gasto maletin_cargo_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.tipo_gasto
    ADD CONSTRAINT maletin_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES empresarial.cargo(id);


--
-- Name: maletin maletin_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.maletin
    ADD CONSTRAINT maletin_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tipo_gasto maletin_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.tipo_gasto
    ADD CONSTRAINT maletin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: conteo maletin_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.conteo
    ADD CONSTRAINT maletin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: maletin maletin_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.maletin
    ADD CONSTRAINT maletin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: moneda_billetes moneda_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.moneda_billetes
    ADD CONSTRAINT moneda_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: moneda_billetes moneda_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.moneda_billetes
    ADD CONSTRAINT moneda_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: moneda moneda_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.moneda
    ADD CONSTRAINT moneda_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: moneda moneda_pais_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.moneda
    ADD CONSTRAINT moneda_pais_id_fkey FOREIGN KEY (pais_id) REFERENCES general.pais(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cambio_caja mov_cambio_autorizado_por_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_autorizado_por_id_fkey FOREIGN KEY (autorizado_por_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cambio_caja mov_cambio_cliente_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cambio_caja mov_cambio_moneda_compra_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_moneda_compra_id_fkey FOREIGN KEY (moneda_compra_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cambio_caja mov_cambio_moneda_venta_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_moneda_venta_id_fkey FOREIGN KEY (moneda_venta_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cambio_caja mov_cambio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: movimiento_caja movimiento_caja_cambio_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_cambio_id_fkey FOREIGN KEY (cambio_id) REFERENCES financiero.cambio(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movimiento_caja movimiento_caja_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_fk FOREIGN KEY (caja_id) REFERENCES financiero.pdv_caja(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimiento_caja movimiento_caja_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movimiento_caja movimiento_caja_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: movimiento_personas movimiento_personas_persona_id_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_personas
    ADD CONSTRAINT movimiento_personas_persona_id_fk FOREIGN KEY (persona_id) REFERENCES personas.persona(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movimiento_personas movimiento_personas_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.movimiento_personas
    ADD CONSTRAINT movimiento_personas_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pdv_caja pdv_caja_conteo_apertura_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_conteo_apertura_fk FOREIGN KEY (conteo_apertura_id) REFERENCES financiero.conteo(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pdv_caja pdv_caja_conteo_cierre_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_conteo_cierre_fk FOREIGN KEY (conteo_cierre_id) REFERENCES financiero.conteo(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pdv_caja pdv_caja_maletin_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_maletin_id_fkey FOREIGN KEY (maletin_id) REFERENCES financiero.maletin(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pdv_caja pdv_caja_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pdv_caja pdv_caja_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: retiro retiro_caja_entrada_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_caja_entrada_fk FOREIGN KEY (caja_salida_id) REFERENCES financiero.pdv_caja(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: retiro retiro_caja_salida_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_caja_salida_fk FOREIGN KEY (caja_entrada_id) REFERENCES financiero.pdv_caja(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: retiro_detalle retiro_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro_detalle
    ADD CONSTRAINT retiro_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: retiro_detalle retiro_detalle_retiro_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro_detalle
    ADD CONSTRAINT retiro_detalle_retiro_id_fkey FOREIGN KEY (retiro_id) REFERENCES financiero.retiro(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: retiro_detalle retiro_detalle_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro_detalle
    ADD CONSTRAINT retiro_detalle_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: retiro_detalle retiro_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro_detalle
    ADD CONSTRAINT retiro_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: retiro retiro_responsable_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: retiro retiro_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: retiro retiro_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sencillo sencillo_autorizado_por_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_autorizado_por_id_fkey FOREIGN KEY (autorizado_por_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sencillo sencillo_caja_entrada_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_caja_entrada_fk FOREIGN KEY (caja_entrada_id) REFERENCES financiero.pdv_caja(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sencillo sencillo_caja_salida_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_caja_salida_fk FOREIGN KEY (caja_salida_id) REFERENCES financiero.pdv_caja(id);


--
-- Name: sencillo_detalle sencillo_detalle_cambio_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_cambio_id_fkey FOREIGN KEY (cambio_id) REFERENCES financiero.cambio(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sencillo_detalle sencillo_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sencillo_detalle sencillo_detalle_sencillo_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_sencillo_id_fkey FOREIGN KEY (sencillo_id) REFERENCES financiero.sencillo(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sencillo_detalle sencillo_detalle_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sencillo_detalle sencillo_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sencillo sencillo_responsable_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sencillo sencillo_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sencillo sencillo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: timbrado_detalle timbrado_detalle_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.timbrado_detalle
    ADD CONSTRAINT timbrado_detalle_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: timbrado_detalle timbrado_detalle_timbrado_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.timbrado_detalle
    ADD CONSTRAINT timbrado_detalle_timbrado_fk FOREIGN KEY (timbrado_id) REFERENCES financiero.timbrado(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: timbrado_detalle timbrado_detalle_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.timbrado_detalle
    ADD CONSTRAINT timbrado_detalle_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: timbrado timbrado_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.timbrado
    ADD CONSTRAINT timbrado_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: timbrado timbrado_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.timbrado
    ADD CONSTRAINT timbrado_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tipo_gasto tipo_gasto_clasificacion_gasto_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.tipo_gasto
    ADD CONSTRAINT tipo_gasto_clasificacion_gasto_id_fkey FOREIGN KEY (clasificacion_gasto_id) REFERENCES financiero.tipo_gasto(id) ON DELETE CASCADE;


--
-- Name: venta_credito venta_credito_cliente_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito
    ADD CONSTRAINT venta_credito_cliente_fk FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: venta_credito_cuota venta_credito_cuota_cobro_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito_cuota
    ADD CONSTRAINT venta_credito_cuota_cobro_fk FOREIGN KEY (cobro_id) REFERENCES operaciones.cobro(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: venta_credito_cuota venta_credito_cuota_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito_cuota
    ADD CONSTRAINT venta_credito_cuota_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: venta_credito_cuota venta_credito_cuota_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito_cuota
    ADD CONSTRAINT venta_credito_cuota_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venta_credito_cuota venta_credito_cuota_venta_credito_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito_cuota
    ADD CONSTRAINT venta_credito_cuota_venta_credito_fk FOREIGN KEY (venta_credito_id) REFERENCES financiero.venta_credito(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: venta_credito venta_credito_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito
    ADD CONSTRAINT venta_credito_fk FOREIGN KEY (cobro_id) REFERENCES operaciones.cobro(id);


--
-- Name: venta_credito venta_credito_sucursal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito
    ADD CONSTRAINT venta_credito_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venta_credito venta_credito_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito
    ADD CONSTRAINT venta_credito_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venta_credito venta_credito_venta_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: -
--

ALTER TABLE ONLY financiero.venta_credito
    ADD CONSTRAINT venta_credito_venta_fk FOREIGN KEY (venta_id) REFERENCES operaciones.venta(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: barrio barrio_ciudad_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.barrio
    ADD CONSTRAINT barrio_ciudad_id_fkey FOREIGN KEY (ciudad_id) REFERENCES general.ciudad(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: barrio barrio_precio_delivery_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.barrio
    ADD CONSTRAINT barrio_precio_delivery_id_fkey FOREIGN KEY (precio_delivery_id) REFERENCES operaciones.precio_delivery(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: barrio barrio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.barrio
    ADD CONSTRAINT barrio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ciudad ciudad_pais_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.ciudad
    ADD CONSTRAINT ciudad_pais_id_fkey FOREIGN KEY (pais_id) REFERENCES general.pais(id);


--
-- Name: ciudad ciudad_usuario_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.ciudad
    ADD CONSTRAINT ciudad_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: contacto contacto_persona_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: contacto contacto_persona_id_fkey1; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_persona_id_fkey1 FOREIGN KEY (persona_id) REFERENCES personas.persona(id);


--
-- Name: contacto contacto_usuario_id_fkey; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: contacto contacto_usuario_id_fkey1; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.contacto
    ADD CONSTRAINT contacto_usuario_id_fkey1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pais pais_fk; Type: FK CONSTRAINT; Schema: general; Owner: -
--

ALTER TABLE ONLY general.pais
    ADD CONSTRAINT pais_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cobro_detalle cobro_detalle_cobro_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_cobro_id_fkey FOREIGN KEY (cobro_id) REFERENCES operaciones.cobro(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cobro_detalle cobro_detalle_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cobro_detalle cobro_detalle_fk_forma_pago; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_fk_forma_pago FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cobro_detalle cobro_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cobro_detalle cobro_detalle_sucursal_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cobro_detalle cobro_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cobro cobro_sucursal_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro
    ADD CONSTRAINT cobro_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cobro cobro_usuario_id_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.cobro
    ADD CONSTRAINT cobro_usuario_id_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: compra compra_contacto_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_contacto_proveedor_id_fkey FOREIGN KEY (contacto_proveedor_id) REFERENCES personas.persona(id);


--
-- Name: compra compra_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_fk FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id);


--
-- Name: compra_item compra_item_compra_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES operaciones.compra(id);


--
-- Name: compra_item compra_item_pedido_item_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_pedido_item_fk FOREIGN KEY (pedido_item_id) REFERENCES operaciones.pedido_item(id);


--
-- Name: compra_item compra_item_presentacion_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_presentacion_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


--
-- Name: compra_item compra_item_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: compra_item compra_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: compra compra_moneda_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: compra compra_pedido_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id);


--
-- Name: compra compra_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id);


--
-- Name: compra compra_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: compra compra_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.compra
    ADD CONSTRAINT compra_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: delivery delivery_cliente_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: delivery delivery_entregador_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_entregador_id_fkey FOREIGN KEY (entregador_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: delivery delivery_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_fk FOREIGN KEY (barrio_id) REFERENCES general.barrio(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: delivery delivery_forma_pago_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_forma_pago_id_fkey FOREIGN KEY (forma_pago_id) REFERENCES operaciones.precio_delivery(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: delivery delivery_forma_pago_id_fkey1; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_forma_pago_id_fkey1 FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: delivery delivery_sucursal_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: delivery delivery_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: delivery delivery_vuelto_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.delivery
    ADD CONSTRAINT delivery_vuelto_fk FOREIGN KEY (vuelto_id) REFERENCES operaciones.vuelto(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: entrada entrada_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada
    ADD CONSTRAINT entrada_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: entrada entrada_fk_responsable; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada
    ADD CONSTRAINT entrada_fk_responsable FOREIGN KEY (responsable_carga_id) REFERENCES personas.usuario(id);


--
-- Name: entrada entrada_fk_usuario; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada
    ADD CONSTRAINT entrada_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: entrada_item entrada_item_fk_entrada; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_fk_entrada FOREIGN KEY (entrada_id) REFERENCES operaciones.entrada(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: entrada_item entrada_item_fk_presentacion; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_fk_presentacion FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


--
-- Name: entrada_item entrada_item_fk_producto; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_fk_producto FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: entrada_item entrada_item_fk_usuario; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.entrada_item
    ADD CONSTRAINT entrada_item_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: venta fk_venta_delivery; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT fk_venta_delivery FOREIGN KEY (delivery_id) REFERENCES operaciones.delivery(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventario_producto inventario_producto_inventario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_inventario_fk FOREIGN KEY (inventario_id) REFERENCES operaciones.inventario(id) ON DELETE CASCADE;


--
-- Name: inventario_producto_item inventario_producto_inventario_producto_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_inventario_producto_fk FOREIGN KEY (inventario_producto_id) REFERENCES operaciones.inventario_producto(id) ON DELETE CASCADE;


--
-- Name: inventario_producto_item inventario_producto_presentacion_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_presentacion_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


--
-- Name: inventario_producto inventario_producto_producto_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_producto_fk FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: inventario_producto inventario_producto_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: inventario_producto_item inventario_producto_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: inventario_producto_item inventario_producto_zona_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_zona_fk FOREIGN KEY (zona_id) REFERENCES empresarial.zona(id);


--
-- Name: inventario inventario_sucursal_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario
    ADD CONSTRAINT inventario_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: inventario inventario_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.inventario
    ADD CONSTRAINT inventario_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: motivo_diferencia_pedido motivo_diferencia_pedido_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido
    ADD CONSTRAINT motivo_diferencia_pedido_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: movimiento_stock movimientos_stock_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimientos_stock_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimiento_stock movimientos_stock_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimientos_stock_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimiento_stock movimientos_stock_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimientos_stock_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: necesidad_item necesidad_item_necesidad_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.necesidad_item
    ADD CONSTRAINT necesidad_item_necesidad_id_fkey FOREIGN KEY (necesidad_id) REFERENCES operaciones.necesidad(id);


--
-- Name: necesidad_item necesidad_item_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.necesidad_item
    ADD CONSTRAINT necesidad_item_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: necesidad_item necesidad_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.necesidad_item
    ADD CONSTRAINT necesidad_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: necesidad necesidad_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.necesidad
    ADD CONSTRAINT necesidad_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: necesidad necesidad_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.necesidad
    ADD CONSTRAINT necesidad_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: nota_pedido nota_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_pedido
    ADD CONSTRAINT nota_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id);


--
-- Name: nota_pedido nota_pedido_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_pedido
    ADD CONSTRAINT nota_pedido_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: nota_recepcion nota_recepcion_compra_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_compra_fk FOREIGN KEY (compra_id) REFERENCES operaciones.nota_recepcion_item(id);


--
-- Name: nota_recepcion nota_recepcion_documento_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_documento_fk FOREIGN KEY (documento_id) REFERENCES financiero.documento(id);


--
-- Name: nota_recepcion_item nota_recepcion_item_nota_recepcion_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion_item
    ADD CONSTRAINT nota_recepcion_item_nota_recepcion_fk FOREIGN KEY (nota_recepcion_id) REFERENCES operaciones.nota_recepcion(id) ON DELETE CASCADE;


--
-- Name: nota_recepcion_item nota_recepcion_item_pedido_item_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion_item
    ADD CONSTRAINT nota_recepcion_item_pedido_item_fk FOREIGN KEY (pedido_item_id) REFERENCES operaciones.pedido_item(id) ON DELETE CASCADE;


--
-- Name: nota_recepcion_item nota_recepcion_item_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion_item
    ADD CONSTRAINT nota_recepcion_item_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: nota_recepcion nota_recepcion_pedido_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_pedido_fk FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id) ON DELETE CASCADE;


--
-- Name: nota_recepcion nota_recepcion_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pedido pedido_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_fk FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id);


--
-- Name: pedido_item pedido_item_nota_recepcion_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_nota_recepcion_fk FOREIGN KEY (nota_recepcion_id) REFERENCES operaciones.nota_recepcion(id);


--
-- Name: pedido_item pedido_item_pedido_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_pedido_fk FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id) ON DELETE CASCADE;


--
-- Name: pedido_item pedido_item_presentacion_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_presentacion_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


--
-- Name: pedido_item pedido_item_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: pedido_item pedido_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pedido pedido_moneda_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: pedido pedido_necesidad_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_necesidad_id_fkey FOREIGN KEY (necesidad_id) REFERENCES operaciones.necesidad(id);


--
-- Name: pedido pedido_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id);


--
-- Name: pedido pedido_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pedido pedido_vendedor_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.pedido
    ADD CONSTRAINT pedido_vendedor_fk FOREIGN KEY (vendedor_id) REFERENCES personas.vendedor(id);


--
-- Name: precio_delivery precio_delivery_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.precio_delivery
    ADD CONSTRAINT precio_delivery_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: programar_precio programar_precio_precio_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.programar_precio
    ADD CONSTRAINT programar_precio_precio_fk FOREIGN KEY (precio_id) REFERENCES productos.precio_por_sucursal(id) ON DELETE CASCADE;


--
-- Name: programar_precio programar_precio_usuairo_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.programar_precio
    ADD CONSTRAINT programar_precio_usuairo_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: salida salida_fk_responsable; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida
    ADD CONSTRAINT salida_fk_responsable FOREIGN KEY (responsable_carga_id) REFERENCES personas.usuario(id);


--
-- Name: salida salida_fk_sucursal; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida
    ADD CONSTRAINT salida_fk_sucursal FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: salida salida_fk_usuario; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida
    ADD CONSTRAINT salida_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: salida_item salida_item_fk_1_producto; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_fk_1_producto FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: salida_item salida_item_fk_presentacion; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_fk_presentacion FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


--
-- Name: salida_item salida_item_fk_salida; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_fk_salida FOREIGN KEY (salida_id) REFERENCES operaciones.salida(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: salida_item salida_item_fk_usuario; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.salida_item
    ADD CONSTRAINT salida_item_fk_usuario FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: stock_por_producto_sucursal stock_por_producto_sucursal_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.stock_por_producto_sucursal
    ADD CONSTRAINT stock_por_producto_sucursal_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id) ON DELETE CASCADE;


--
-- Name: stock_por_producto_sucursal stock_por_producto_sucursal_sucursal_id_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.stock_por_producto_sucursal
    ADD CONSTRAINT stock_por_producto_sucursal_sucursal_id_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON DELETE CASCADE;


--
-- Name: transferencia_item transferencia_item_presentacion_1_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_presentacion_1_fk FOREIGN KEY (presentacion_pre_transferencia_id) REFERENCES productos.presentacion(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transferencia_item transferencia_item_presentacion_2_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_presentacion_2_fk FOREIGN KEY (presentacion_preparacion_id) REFERENCES productos.presentacion(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transferencia_item transferencia_item_presentacion_3_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_presentacion_3_fk FOREIGN KEY (presentacion_transporte_id) REFERENCES productos.presentacion(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transferencia_item transferencia_item_presentacion_4_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_presentacion_4_fk FOREIGN KEY (presentacion_recepcion_id) REFERENCES productos.presentacion(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transferencia_item transferencia_item_transferencia_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_transferencia_fk FOREIGN KEY (transferencia_id) REFERENCES operaciones.transferencia(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transferencia_item transferencia_item_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transferencia transferencia_suc_destino_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_suc_destino_fk FOREIGN KEY (sucursal_destino_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transferencia transferencia_suc_origen_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_suc_origen_fk FOREIGN KEY (sucursal_origen_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transferencia transferencia_usuario_1_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_usuario_1_fk FOREIGN KEY (usuario_pre_transferencia_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transferencia transferencia_usuario_2_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_usuario_2_fk FOREIGN KEY (usuario_preparacion_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transferencia transferencia_usuario_3_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_usuario_3_fk FOREIGN KEY (usuario_transporte_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transferencia transferencia_usuario_4_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_usuario_4_fk FOREIGN KEY (usuario_recepcion_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venta venta_cliente_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venta venta_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_fk FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: venta venta_fk_cobro; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_fk_cobro FOREIGN KEY (cobro_id) REFERENCES operaciones.cobro(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venta_item venta_item_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venta_item venta_item_fk_venta; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_fk_venta FOREIGN KEY (venta_id) REFERENCES operaciones.venta(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: venta_item venta_item_producto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venta_item venta_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: venta venta_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vuelto vuelto_autorizado_por_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto
    ADD CONSTRAINT vuelto_autorizado_por_id_fkey FOREIGN KEY (autorizado_por_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vuelto_item vuelto_item_moneda_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto_item
    ADD CONSTRAINT vuelto_item_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vuelto_item vuelto_item_sucursal_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto_item
    ADD CONSTRAINT vuelto_item_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vuelto_item vuelto_item_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto_item
    ADD CONSTRAINT vuelto_item_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vuelto_item vuelto_item_vuelto_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto_item
    ADD CONSTRAINT vuelto_item_vuelto_id_fkey FOREIGN KEY (vuelto_id) REFERENCES operaciones.vuelto(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vuelto vuelto_responsable_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto
    ADD CONSTRAINT vuelto_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vuelto vuelto_sucursal_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto
    ADD CONSTRAINT vuelto_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vuelto vuelto_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: -
--

ALTER TABLE ONLY operaciones.vuelto
    ADD CONSTRAINT vuelto_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cliente cliente_fk; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.cliente
    ADD CONSTRAINT cliente_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cliente cliente_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.cliente
    ADD CONSTRAINT cliente_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: funcionario funcionario_cargo_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES empresarial.cargo(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: funcionario funcionario_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: funcionario funcionario_supervisado_por_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_supervisado_por_id_fkey FOREIGN KEY (supervisado_por_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: funcionario funcionario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: usuario_grupo grupo_privilegio_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario_grupo
    ADD CONSTRAINT grupo_privilegio_id_fkey FOREIGN KEY (grupo_privilegio_id) REFERENCES personas.grupo_role(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: persona persona_ciudad_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.persona
    ADD CONSTRAINT persona_ciudad_id_fkey FOREIGN KEY (ciudad_id) REFERENCES general.ciudad(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: persona persona_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.persona
    ADD CONSTRAINT persona_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: proveedor_dias_visita proveedor_dias_visita_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.proveedor_dias_visita
    ADD CONSTRAINT proveedor_dias_visita_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id);


--
-- Name: proveedor_dias_visita proveedor_dias_visita_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.proveedor_dias_visita
    ADD CONSTRAINT proveedor_dias_visita_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: proveedor proveedor_funcionario_encargado_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.proveedor
    ADD CONSTRAINT proveedor_funcionario_encargado_id_fkey FOREIGN KEY (funcionario_encargado_id) REFERENCES personas.funcionario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: proveedor proveedor_persona_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.proveedor
    ADD CONSTRAINT proveedor_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proveedor proveedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.proveedor
    ADD CONSTRAINT proveedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: role role_fk; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: role role_grupo_role_fk; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_grupo_role_fk FOREIGN KEY (grupo_role_id) REFERENCES personas.grupo_role(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: grupo_role usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.grupo_role
    ADD CONSTRAINT usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: usuario_grupo usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario_grupo
    ADD CONSTRAINT usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: usuario_role usuario_role_fk; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario_role
    ADD CONSTRAINT usuario_role_fk FOREIGN KEY (role_id) REFERENCES personas.role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usuario_role usuario_role_fk_1; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario_role
    ADD CONSTRAINT usuario_role_fk_1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usuario usuario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vendedor vendedor_persona_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor
    ADD CONSTRAINT vendedor_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vendedor_proveedor vendedor_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor_proveedor
    ADD CONSTRAINT vendedor_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id);


--
-- Name: vendedor_proveedor vendedor_proveedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor_proveedor
    ADD CONSTRAINT vendedor_proveedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: vendedor_proveedor vendedor_proveedor_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor_proveedor
    ADD CONSTRAINT vendedor_proveedor_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES personas.vendedor(id);


--
-- Name: vendedor vendedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: -
--

ALTER TABLE ONLY personas.vendedor
    ADD CONSTRAINT vendedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: codigo codigo_fk; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: codigo_tipo_precio codigo_tipo_precio_fk; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo_tipo_precio
    ADD CONSTRAINT codigo_tipo_precio_fk FOREIGN KEY (codigo_id) REFERENCES productos.codigo(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: codigo_tipo_precio codigo_tipo_precio_fk_1; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo_tipo_precio
    ADD CONSTRAINT codigo_tipo_precio_fk_1 FOREIGN KEY (id) REFERENCES productos.tipo_precio(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: codigo_tipo_precio codigo_tipo_precio_fk_2; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo_tipo_precio
    ADD CONSTRAINT codigo_tipo_precio_fk_2 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: codigo codigo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.codigo
    ADD CONSTRAINT codigo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: costo_por_producto costos_por_sucursal_moneda_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.costo_por_producto
    ADD CONSTRAINT costos_por_sucursal_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: costo_por_producto costos_por_sucursal_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.costo_por_producto
    ADD CONSTRAINT costos_por_sucursal_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: costo_por_producto costos_por_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.costo_por_producto
    ADD CONSTRAINT costos_por_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: costo_por_producto costos_por_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.costo_por_producto
    ADD CONSTRAINT costos_por_sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: familia familia_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.familia
    ADD CONSTRAINT familia_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pdv_categoria pdv_categoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_categoria
    ADD CONSTRAINT pdv_categoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pdv_grupo pdv_grupo_categoria_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_grupo
    ADD CONSTRAINT pdv_grupo_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES productos.pdv_categoria(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pdv_grupo pdv_grupo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_grupo
    ADD CONSTRAINT pdv_grupo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pdv_grupos_productos pdv_grupos_productos_grupo_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_grupos_productos
    ADD CONSTRAINT pdv_grupos_productos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES productos.pdv_grupo(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pdv_grupos_productos pdv_grupos_productos_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_grupos_productos
    ADD CONSTRAINT pdv_grupos_productos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pdv_grupos_productos pdv_grupos_productos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.pdv_grupos_productos
    ADD CONSTRAINT pdv_grupos_productos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: precio_por_sucursal precio_por_sucursal_fk; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: precio_por_sucursal precio_por_sucursal_fk_1; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_fk_1 FOREIGN KEY (tipo_precio_id) REFERENCES productos.tipo_precio(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: precio_por_sucursal precio_por_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: precio_por_sucursal precio_por_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.precio_por_sucursal
    ADD CONSTRAINT precio_por_sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: presentacion presentacion_fk; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.presentacion
    ADD CONSTRAINT presentacion_fk FOREIGN KEY (tipo_presentacion_id) REFERENCES productos.tipo_presentacion(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: presentacion presentacion_fk_1; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.presentacion
    ADD CONSTRAINT presentacion_fk_1 FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: presentacion presentacion_fk_producto; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.presentacion
    ADD CONSTRAINT presentacion_fk_producto FOREIGN KEY (producto_id) REFERENCES productos.producto(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: producto producto_fk; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto
    ADD CONSTRAINT producto_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: producto_imagen producto_imagen_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_imagen
    ADD CONSTRAINT producto_imagen_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: producto_imagen producto_imagen_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_imagen
    ADD CONSTRAINT producto_imagen_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: producto_proveedor producto_proveedor_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_proveedor
    ADD CONSTRAINT producto_proveedor_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: producto_proveedor producto_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_proveedor
    ADD CONSTRAINT producto_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES personas.proveedor(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: producto_proveedor producto_proveedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_proveedor
    ADD CONSTRAINT producto_proveedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: producto producto_sub_familia_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto
    ADD CONSTRAINT producto_sub_familia_id_fkey FOREIGN KEY (sub_familia_id) REFERENCES productos.subfamilia(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: producto_por_sucursal productos_por_sucursal_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_por_sucursal
    ADD CONSTRAINT productos_por_sucursal_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: producto_por_sucursal productos_por_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_por_sucursal
    ADD CONSTRAINT productos_por_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: producto_por_sucursal productos_por_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.producto_por_sucursal
    ADD CONSTRAINT productos_por_sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: subfamilia subfamilia_familia_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.subfamilia
    ADD CONSTRAINT subfamilia_familia_id_fkey FOREIGN KEY (familia_id) REFERENCES productos.familia(id);


--
-- Name: subfamilia subfamilia_subfamiliafk; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.subfamilia
    ADD CONSTRAINT subfamilia_subfamiliafk FOREIGN KEY (sub_familia_id) REFERENCES productos.subfamilia(id) ON DELETE CASCADE;


--
-- Name: subfamilia subfamilia_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.subfamilia
    ADD CONSTRAINT subfamilia_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: tipo_precio tipo_precio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.tipo_precio
    ADD CONSTRAINT tipo_precio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: tipo_presentacion tipo_presentacion_fk; Type: FK CONSTRAINT; Schema: productos; Owner: -
--

ALTER TABLE ONLY productos.tipo_presentacion
    ADD CONSTRAINT tipo_presentacion_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: marca marca_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.marca
    ADD CONSTRAINT marca_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: modelo modelo_marca_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.modelo
    ADD CONSTRAINT modelo_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES vehiculos.marca(id);


--
-- Name: modelo modelo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.modelo
    ADD CONSTRAINT modelo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: tipo_vehiculo tipo_vehiculo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.tipo_vehiculo
    ADD CONSTRAINT tipo_vehiculo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: vehiculo vehiculo_modelo_fk; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo
    ADD CONSTRAINT vehiculo_modelo_fk FOREIGN KEY (modelo_id) REFERENCES vehiculos.modelo(id);


--
-- Name: vehiculo_sucursal vehiculo_sucursal_responsable_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal
    ADD CONSTRAINT vehiculo_sucursal_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id);


--
-- Name: vehiculo_sucursal vehiculo_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal
    ADD CONSTRAINT vehiculo_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: vehiculo_sucursal vehiculo_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo_sucursal
    ADD CONSTRAINT vehiculo_sucursal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: vehiculo vehiculo_tipo_vehiculo_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo
    ADD CONSTRAINT vehiculo_tipo_vehiculo_fkey FOREIGN KEY (tipo_vehiculo) REFERENCES vehiculos.vehiculo(id);


--
-- Name: vehiculo vehiculo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: vehiculos; Owner: -
--

ALTER TABLE ONLY vehiculos.vehiculo
    ADD CONSTRAINT vehiculo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: filial24_pub; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION filial24_pub WITH (publish = 'insert, update, delete, truncate');


--
-- Name: filial24_pub marcacion; Type: PUBLICATION TABLE; Schema: administrativo; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY administrativo.marcacion;


--
-- Name: filial24_pub inicio_sesion; Type: PUBLICATION TABLE; Schema: configuraciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY configuraciones.inicio_sesion;


--
-- Name: filial24_pub cambio_caja; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.cambio_caja;


--
-- Name: filial24_pub conteo; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.conteo;


--
-- Name: filial24_pub conteo_moneda; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.conteo_moneda;


--
-- Name: filial24_pub factura_legal; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.factura_legal;


--
-- Name: filial24_pub factura_legal_item; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.factura_legal_item;


--
-- Name: filial24_pub gasto; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.gasto;


--
-- Name: filial24_pub gasto_detalle; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.gasto_detalle;


--
-- Name: filial24_pub maletin; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.maletin;


--
-- Name: filial24_pub movimiento_caja; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.movimiento_caja;


--
-- Name: filial24_pub movimiento_personas; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.movimiento_personas;


--
-- Name: filial24_pub pdv_caja; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.pdv_caja;


--
-- Name: filial24_pub retiro; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.retiro;


--
-- Name: filial24_pub retiro_detalle; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.retiro_detalle;


--
-- Name: filial24_pub sencillo; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.sencillo;


--
-- Name: filial24_pub sencillo_detalle; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.sencillo_detalle;


--
-- Name: filial24_pub venta_credito; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.venta_credito;


--
-- Name: filial24_pub venta_credito_cuota; Type: PUBLICATION TABLE; Schema: financiero; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY financiero.venta_credito_cuota;


--
-- Name: filial24_pub cobro; Type: PUBLICATION TABLE; Schema: operaciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY operaciones.cobro;


--
-- Name: filial24_pub cobro_detalle; Type: PUBLICATION TABLE; Schema: operaciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY operaciones.cobro_detalle;


--
-- Name: filial24_pub delivery; Type: PUBLICATION TABLE; Schema: operaciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY operaciones.delivery;


--
-- Name: filial24_pub movimiento_stock; Type: PUBLICATION TABLE; Schema: operaciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY operaciones.movimiento_stock;


--
-- Name: filial24_pub stock_por_producto_sucursal; Type: PUBLICATION TABLE; Schema: operaciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY operaciones.stock_por_producto_sucursal;


--
-- Name: filial24_pub venta; Type: PUBLICATION TABLE; Schema: operaciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY operaciones.venta;


--
-- Name: filial24_pub venta_item; Type: PUBLICATION TABLE; Schema: operaciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY operaciones.venta_item;


--
-- Name: filial24_pub vuelto; Type: PUBLICATION TABLE; Schema: operaciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY operaciones.vuelto;


--
-- Name: filial24_pub vuelto_item; Type: PUBLICATION TABLE; Schema: operaciones; Owner: -
--

ALTER PUBLICATION filial24_pub ADD TABLE ONLY operaciones.vuelto_item;


--
-- Name: central_filial24_sub; Type: SUBSCRIPTION; Schema: -; Owner: -
--

CREATE SUBSCRIPTION central_filial24_sub CONNECTION 'dbname=bodega host=172.25.1.200 user=franco password=franco port=5551' PUBLICATION central_filial24_pub WITH (connect = false, slot_name = 'central_filial24_sub', origin = none);


--
-- Name: filial24_central_sub; Type: SUBSCRIPTION; Schema: -; Owner: -
--

CREATE SUBSCRIPTION filial24_central_sub CONNECTION 'dbname=bodega host=172.25.1.200 user=franco password=franco port=5551' PUBLICATION central_pub WITH (connect = false, slot_name = 'central24_sub', origin = none);


--
-- PostgreSQL database dump complete
--

