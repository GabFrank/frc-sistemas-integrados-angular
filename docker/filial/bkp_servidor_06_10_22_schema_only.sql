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
-- Name: EXTENSION plpgsql; Type: -- COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: btree_gin; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA productos;


--
-- Name: EXTENSION btree_gin; Type: -- COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION btree_gin IS 'support for indexing common datatypes in GIN';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA productos;


--
-- Name: EXTENSION pg_trgm; Type: -- COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


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
-- Name: nivel_actualizacion; Type: TYPE; Schema: configuraciones; Owner: franco
--

CREATE TYPE configuraciones.nivel_actualizacion AS ENUM (
    'CRITICO',
    'MODERADO',
    'MANTENIMIENTO'
);


ALTER TYPE configuraciones.nivel_actualizacion OWNER TO franco;

--
-- Name: tipo_actualizacion; Type: TYPE; Schema: configuraciones; Owner: franco
--

CREATE TYPE configuraciones.tipo_actualizacion AS ENUM (
    'MOBILE',
    'DESKTOP',
    'SERVIDOR_FILIAL',
    'SERVIDOR_CENTRAL'
);


ALTER TYPE configuraciones.tipo_actualizacion OWNER TO franco;

--
-- Name: estado_retiro; Type: TYPE; Schema: financiero; Owner: franco
--

CREATE TYPE financiero.estado_retiro AS ENUM (
    'EN_PROCESO',
    'CONCLUIDO',
    'NECESITA_VERIFICACION',
    'EN_VERIFICACION',
    'VERIFICADO_CONCLUIDO_SIN_PROBLEMA',
    'VERIFICADO_CONCLUIDO_CON_PROBLEMA'
);


ALTER TYPE financiero.estado_retiro OWNER TO franco;

--
-- Name: pdv_caja_estado; Type: TYPE; Schema: financiero; Owner: franco
--

CREATE TYPE financiero.pdv_caja_estado AS ENUM (
    'EN_PROCESO',
    'CONCLUIDO',
    'NECESITA_VERIFICACION',
    'EN_VERIFICACION',
    'VERIFICADO_CONCLUIDO_SIN_PROBLEMA',
    'VERIFICADO_CONCLUIDO_CON_PROBLEMA'
);


ALTER TYPE financiero.pdv_caja_estado OWNER TO franco;

--
-- Name: pdv_caja_tipo_movimiento; Type: TYPE; Schema: financiero; Owner: franco
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
    'ENTRADA_SENCILLO'
);


ALTER TYPE financiero.pdv_caja_tipo_movimiento OWNER TO franco;

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
-- Name: cambio_precio_momento; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.cambio_precio_momento AS ENUM (
    'INMEDIATO',
    'EN_FECHA_INDICADA',
    'AL_RECIBIR_COMPRA',
    'AL_AUTORIZAR',
    'AL_ALCANZAR_CANTIDAD'
);


ALTER TYPE operaciones.cambio_precio_momento OWNER TO franco;

--
-- Name: compra_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.compra_estado AS ENUM (
    'ACTIVO',
    'CANCELADO',
    'DEVILVIDO',
    'EN_OBSERVACION',
    'IRREGULAR',
    'PRE_COMPRA'
);


ALTER TYPE operaciones.compra_estado OWNER TO franco;

--
-- Name: compra_item_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.compra_item_estado AS ENUM (
    'SIN_MODIFICACION',
    'MODIFICADO'
);


ALTER TYPE operaciones.compra_item_estado OWNER TO franco;

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
-- Name: etapa_transferencia; Type: TYPE; Schema: operaciones; Owner: franco
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


ALTER TYPE operaciones.etapa_transferencia OWNER TO franco;

--
-- Name: inventario_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.inventario_estado AS ENUM (
    'ABIERTO',
    'CANCELADO',
    'CONCLUIDO'
);


ALTER TYPE operaciones.inventario_estado OWNER TO franco;

--
-- Name: inventario_producto_estado; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.inventario_producto_estado AS ENUM (
    'BUENO',
    'AVERIADO',
    'VENCIDO'
);


ALTER TYPE operaciones.inventario_producto_estado OWNER TO franco;

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
    'CONCLUIDO',
    'EN_RECEPCION_NOTA',
    'EN_RECEPCION_MERCADERIA'
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
-- Name: tipo_inventario; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.tipo_inventario AS ENUM (
    'ABC',
    'ZONA',
    'PRODUCTO',
    'CATEGORIA'
);


ALTER TYPE operaciones.tipo_inventario OWNER TO franco;

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
-- Name: tipo_transferencia; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.tipo_transferencia AS ENUM (
    'MANUAL',
    'AUTOMATICA',
    'MIXTA'
);


ALTER TYPE operaciones.tipo_transferencia OWNER TO franco;

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
-- Name: transferencia_estado; Type: TYPE; Schema: operaciones; Owner: franco
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


ALTER TYPE operaciones.transferencia_estado OWNER TO franco;

--
-- Name: transferencia_item_motivo_modificacion; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.transferencia_item_motivo_modificacion AS ENUM (
    'CANTIDAD_INCORRECTA',
    'VENCIMIENTO_INCORRECTO',
    'PRESENTACION_INCORRECTA'
);


ALTER TYPE operaciones.transferencia_item_motivo_modificacion OWNER TO franco;

--
-- Name: transferencia_item_motivo_rechazo; Type: TYPE; Schema: operaciones; Owner: franco
--

CREATE TYPE operaciones.transferencia_item_motivo_rechazo AS ENUM (
    'FALTA_PRODUCTO',
    'PRODUCTO_AVERIADO',
    'PRODUCTO_VENCIDO',
    'PRODUCTO_EQUIVOCADO'
);


ALTER TYPE operaciones.transferencia_item_motivo_rechazo OWNER TO franco;

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
-- Name: reiniciartablas(text, text); Type: FUNCTION; Schema: public; Owner: franco
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


ALTER FUNCTION public.reiniciartablas(_username text, _schemaname text) OWNER TO franco;

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
-- Name: actualizacion; Type: TABLE; Schema: configuraciones; Owner: franco
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


ALTER TABLE configuraciones.actualizacion OWNER TO franco;

--
-- Name: actualizacion_id_seq; Type: SEQUENCE; Schema: configuraciones; Owner: franco
--

CREATE SEQUENCE configuraciones.actualizacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE configuraciones.actualizacion_id_seq OWNER TO franco;

--
-- Name: actualizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: configuraciones; Owner: franco
--

ALTER SEQUENCE configuraciones.actualizacion_id_seq OWNED BY configuraciones.actualizacion.id;


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
    equipo_id bigint,
    is_servidor boolean
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
-- Name: configuracion_general; Type: TABLE; Schema: empresarial; Owner: franco
--

CREATE TABLE empresarial.configuracion_general (
    id bigint NOT NULL,
    nombre_empresa character varying NOT NULL,
    razon_social character varying NOT NULL,
    ruc character varying,
    creado_en timestamp without time zone,
    usuario_id bigint
);


ALTER TABLE empresarial.configuracion_general OWNER TO franco;

--
-- Name: configuracion_general_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: franco
--

CREATE SEQUENCE empresarial.configuracion_general_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE empresarial.configuracion_general_id_seq OWNER TO franco;

--
-- Name: configuracion_general_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: franco
--

ALTER SEQUENCE empresarial.configuracion_general_id_seq OWNED BY empresarial.configuracion_general.id;


--
-- Name: punto_de_venta; Type: TABLE; Schema: empresarial; Owner: franco
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


ALTER TABLE empresarial.punto_de_venta OWNER TO franco;

--
-- Name: punto_de_venta_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: franco
--

CREATE SEQUENCE empresarial.punto_de_venta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE empresarial.punto_de_venta_id_seq OWNER TO franco;

--
-- Name: punto_de_venta_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: franco
--

ALTER SEQUENCE empresarial.punto_de_venta_id_seq OWNED BY empresarial.punto_de_venta.id;


--
-- Name: sector; Type: TABLE; Schema: empresarial; Owner: franco
--

CREATE TABLE empresarial.sector (
    id bigint NOT NULL,
    sucursal_id bigint,
    descripcion character varying,
    activo boolean,
    usuario_id bigint,
    creado_en timestamp without time zone
);


ALTER TABLE empresarial.sector OWNER TO franco;

--
-- Name: sector_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: franco
--

CREATE SEQUENCE empresarial.sector_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE empresarial.sector_id_seq OWNER TO franco;

--
-- Name: sector_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: franco
--

ALTER SEQUENCE empresarial.sector_id_seq OWNED BY empresarial.sector.id;


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
    nro_delivery character varying,
    is_configured boolean DEFAULT true,
    codigo_establecimiento_factura character varying
);


ALTER TABLE empresarial.sucursal OWNER TO franco;

--
-- Name: COLUMN sucursal.direccion; Type: -- COMMENT; Schema: empresarial; Owner: franco
--

-- COMMENT ON COLUMN empresarial.sucursal.direccion IS 'direccion referencial';


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
-- Name: zona; Type: TABLE; Schema: empresarial; Owner: franco
--

CREATE TABLE empresarial.zona (
    id bigint NOT NULL,
    sector_id bigint,
    descripcion character varying,
    activo boolean,
    usuario_id bigint,
    creado_en timestamp without time zone
);


ALTER TABLE empresarial.zona OWNER TO franco;

--
-- Name: zona_id_seq; Type: SEQUENCE; Schema: empresarial; Owner: franco
--

CREATE SEQUENCE empresarial.zona_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE empresarial.zona_id_seq OWNER TO franco;

--
-- Name: zona_id_seq; Type: SEQUENCE OWNED BY; Schema: empresarial; Owner: franco
--

ALTER SEQUENCE empresarial.zona_id_seq OWNED BY empresarial.zona.id;


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
    creado_en timestamp with time zone DEFAULT now(),
    valor_en_gs_cambio numeric
);


ALTER TABLE financiero.cambio OWNER TO franco;

--
-- Name: cambio_caja; Type: TABLE; Schema: financiero; Owner: franco
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
    usuario_id bigint
);


ALTER TABLE financiero.cambio_caja OWNER TO franco;

--
-- Name: cambio_caja_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.cambio_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.cambio_caja_id_seq OWNER TO franco;

--
-- Name: cambio_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.cambio_caja_id_seq OWNED BY financiero.cambio_caja.id;


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
-- Name: conteo; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.conteo (
    id bigint NOT NULL,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE financiero.conteo OWNER TO franco;

--
-- Name: conteo_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.conteo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.conteo_id_seq OWNER TO franco;

--
-- Name: conteo_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.conteo_id_seq OWNED BY financiero.conteo.id;


--
-- Name: conteo_moneda; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.conteo_moneda (
    id bigint NOT NULL,
    conteo_id bigint,
    moneda_billetes_id bigint,
    cantidad numeric,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE financiero.conteo_moneda OWNER TO franco;

--
-- Name: conteo_moneda_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.conteo_moneda_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.conteo_moneda_id_seq OWNER TO franco;

--
-- Name: conteo_moneda_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.conteo_moneda_id_seq OWNED BY financiero.conteo_moneda.id;


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
-- Name: documento; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.documento (
    id bigint NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone,
    usuario_id bigint
);


ALTER TABLE financiero.documento OWNER TO franco;

--
-- Name: documento_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.documento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.documento_id_seq OWNER TO franco;

--
-- Name: documento_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.documento_id_seq OWNED BY financiero.documento.id;


--
-- Name: factura_legal; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.factura_legal (
    id bigint NOT NULL,
    timbrado_detalle_id bigint NOT NULL,
    numero_factura numeric NOT NULL,
    autoimpreso boolean,
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
    caja_id bigint,
    via_tributaria boolean DEFAULT false
);


ALTER TABLE financiero.factura_legal OWNER TO franco;

--
-- Name: factura_legal_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.factura_legal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.factura_legal_id_seq OWNER TO franco;

--
-- Name: factura_legal_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.factura_legal_id_seq OWNED BY financiero.factura_legal.id;


--
-- Name: factura_legal_item; Type: TABLE; Schema: financiero; Owner: franco
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
    usuario_id bigint
);


ALTER TABLE financiero.factura_legal_item OWNER TO franco;

--
-- Name: factura_legal_item_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.factura_legal_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.factura_legal_item_id_seq OWNER TO franco;

--
-- Name: factura_legal_item_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.factura_legal_item_id_seq OWNED BY financiero.factura_legal_item.id;


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
-- Name: gasto; Type: TABLE; Schema: financiero; Owner: franco
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
    vuelto_ds numeric DEFAULT 0
);


ALTER TABLE financiero.gasto OWNER TO franco;

--
-- Name: gasto_detalle; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.gasto_detalle (
    id bigint NOT NULL,
    gasto_id bigint,
    moneda_id bigint NOT NULL,
    cambio numeric(19,0),
    cantidad numeric NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    vuelto boolean DEFAULT false
);


ALTER TABLE financiero.gasto_detalle OWNER TO franco;

--
-- Name: gasto_detalle_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.gasto_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.gasto_detalle_id_seq OWNER TO franco;

--
-- Name: gasto_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.gasto_detalle_id_seq OWNED BY financiero.gasto_detalle.id;


--
-- Name: gasto_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.gasto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.gasto_id_seq OWNER TO franco;

--
-- Name: gasto_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.gasto_id_seq OWNED BY financiero.gasto.id;


--
-- Name: maletin_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.maletin_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.maletin_id_seq OWNER TO franco;

--
-- Name: maletin; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.maletin (
    id bigint DEFAULT nextval('financiero.maletin_id_seq'::regclass) NOT NULL,
    descripcion character varying,
    activo boolean DEFAULT true,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    abierto boolean DEFAULT false
);


ALTER TABLE financiero.maletin OWNER TO franco;

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
-- Name: moneda_billetes; Type: TABLE; Schema: financiero; Owner: franco
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


ALTER TABLE financiero.moneda_billetes OWNER TO franco;

--
-- Name: moneda_billetes_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.moneda_billetes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.moneda_billetes_id_seq OWNER TO franco;

--
-- Name: moneda_billetes_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.moneda_billetes_id_seq OWNED BY financiero.moneda_billetes.id;


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
-- Name: movimiento_caja; Type: TABLE; Schema: financiero; Owner: franco
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
    activo boolean DEFAULT true
);


ALTER TABLE financiero.movimiento_caja OWNER TO franco;

--
-- Name: movimiento_caja_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.movimiento_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.movimiento_caja_id_seq OWNER TO franco;

--
-- Name: movimiento_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.movimiento_caja_id_seq OWNED BY financiero.movimiento_caja.id;


--
-- Name: pdv_caja; Type: TABLE; Schema: financiero; Owner: franco
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
    conteo_cierre_id bigint
);


ALTER TABLE financiero.pdv_caja OWNER TO franco;

--
-- Name: pdv_caja_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.pdv_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.pdv_caja_id_seq OWNER TO franco;

--
-- Name: pdv_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.pdv_caja_id_seq OWNED BY financiero.pdv_caja.id;


--
-- Name: retiro; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.retiro (
    id bigint NOT NULL,
    responsable_id bigint,
    estado financiero.estado_retiro,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    caja_salida_id bigint,
    caja_entrada_id bigint
);


ALTER TABLE financiero.retiro OWNER TO franco;

--
-- Name: retiro_detalle; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.retiro_detalle (
    id bigint NOT NULL,
    retiro_id bigint NOT NULL,
    moneda_id bigint NOT NULL,
    cambio numeric(19,0),
    cantidad numeric NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE financiero.retiro_detalle OWNER TO franco;

--
-- Name: retiro_detalle_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.retiro_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.retiro_detalle_id_seq OWNER TO franco;

--
-- Name: retiro_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.retiro_detalle_id_seq OWNED BY financiero.retiro_detalle.id;


--
-- Name: retiro_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.retiro_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.retiro_id_seq OWNER TO franco;

--
-- Name: retiro_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.retiro_id_seq OWNED BY financiero.retiro.id;


--
-- Name: sencillo; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.sencillo (
    id bigint NOT NULL,
    responsable_id bigint,
    entrada boolean,
    autorizado_por_id bigint,
    observacion character varying,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE financiero.sencillo OWNER TO franco;

--
-- Name: sencillo_detalle; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.sencillo_detalle (
    id bigint NOT NULL,
    sencillo_id bigint,
    moneda_id bigint NOT NULL,
    cambio_id bigint,
    cantidad numeric NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE financiero.sencillo_detalle OWNER TO franco;

--
-- Name: sencillo_detalle_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.sencillo_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.sencillo_detalle_id_seq OWNER TO franco;

--
-- Name: sencillo_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.sencillo_detalle_id_seq OWNED BY financiero.sencillo_detalle.id;


--
-- Name: sencillo_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.sencillo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.sencillo_id_seq OWNER TO franco;

--
-- Name: sencillo_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.sencillo_id_seq OWNED BY financiero.sencillo.id;


--
-- Name: timbrado; Type: TABLE; Schema: financiero; Owner: franco
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
    usuario_id bigint
);


ALTER TABLE financiero.timbrado OWNER TO franco;

--
-- Name: timbrado_detalle; Type: TABLE; Schema: financiero; Owner: franco
--

CREATE TABLE financiero.timbrado_detalle (
    id bigint NOT NULL,
    timbrado_id bigint NOT NULL,
    punto_de_venta_id bigint NOT NULL,
    punto_expedicion character varying NOT NULL,
    cantidad numeric NOT NULL,
    rango_desde numeric NOT NULL,
    rango_hasta numeric NOT NULL,
    numero_actual numeric NOT NULL,
    activo boolean,
    creado_en timestamp without time zone,
    usuario_id bigint
);


ALTER TABLE financiero.timbrado_detalle OWNER TO franco;

--
-- Name: timbrado_detalle_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.timbrado_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.timbrado_detalle_id_seq OWNER TO franco;

--
-- Name: timbrado_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.timbrado_detalle_id_seq OWNED BY financiero.timbrado_detalle.id;


--
-- Name: timbrado_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.timbrado_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.timbrado_id_seq OWNER TO franco;

--
-- Name: timbrado_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.timbrado_id_seq OWNED BY financiero.timbrado.id;


--
-- Name: tipo_gasto; Type: TABLE; Schema: financiero; Owner: franco
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


ALTER TABLE financiero.tipo_gasto OWNER TO franco;

--
-- Name: tipo_gasto_id_seq; Type: SEQUENCE; Schema: financiero; Owner: franco
--

CREATE SEQUENCE financiero.tipo_gasto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE financiero.tipo_gasto_id_seq OWNER TO franco;

--
-- Name: tipo_gasto_id_seq; Type: SEQUENCE OWNED BY; Schema: financiero; Owner: franco
--

ALTER SEQUENCE financiero.tipo_gasto_id_seq OWNED BY financiero.tipo_gasto.id;


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
-- Name: cobro; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.cobro (
    id bigint NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    total_gs numeric
);


ALTER TABLE operaciones.cobro OWNER TO franco;

--
-- Name: cobro_detalle; Type: TABLE; Schema: operaciones; Owner: franco
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
    aumento boolean DEFAULT false
);


ALTER TABLE operaciones.cobro_detalle OWNER TO franco;

--
-- Name: cobro_detalle_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.cobro_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.cobro_detalle_id_seq OWNER TO franco;

--
-- Name: cobro_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.cobro_detalle_id_seq OWNED BY operaciones.cobro_detalle.id;


--
-- Name: cobro_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.cobro_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.cobro_id_seq OWNER TO franco;

--
-- Name: cobro_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.cobro_id_seq OWNED BY operaciones.cobro.id;


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
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    lote character varying,
    valor_total numeric,
    vencimiento timestamp(0) with time zone,
    presentacion_id bigint,
    pedido_item_id bigint,
    estado operaciones.compra_item_estado,
    verificado boolean DEFAULT false,
    programar_precio_id bigint
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
-- Name: inventario; Type: TABLE; Schema: operaciones; Owner: franco
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


ALTER TABLE operaciones.inventario OWNER TO franco;

--
-- Name: inventario_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.inventario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.inventario_id_seq OWNER TO franco;

--
-- Name: inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.inventario_id_seq OWNED BY operaciones.inventario.id;


--
-- Name: inventario_producto; Type: TABLE; Schema: operaciones; Owner: franco
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
    creado_en timestamp without time zone
);


ALTER TABLE operaciones.inventario_producto OWNER TO franco;

--
-- Name: inventario_producto_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.inventario_producto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.inventario_producto_id_seq OWNER TO franco;

--
-- Name: inventario_producto_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.inventario_producto_id_seq OWNED BY operaciones.inventario_producto.id;


--
-- Name: inventario_producto_item; Type: TABLE; Schema: operaciones; Owner: franco
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
    cantidad_fisica numeric
);


ALTER TABLE operaciones.inventario_producto_item OWNER TO franco;

--
-- Name: inventario_producto_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.inventario_producto_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.inventario_producto_item_id_seq OWNER TO franco;

--
-- Name: inventario_producto_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.inventario_producto_item_id_seq OWNED BY operaciones.inventario_producto_item.id;


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
-- Name: nota_recepcion; Type: TABLE; Schema: operaciones; Owner: franco
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
    usuario_id bigint
);


ALTER TABLE operaciones.nota_recepcion OWNER TO franco;

--
-- Name: nota_recepcion_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.nota_recepcion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.nota_recepcion_id_seq OWNER TO franco;

--
-- Name: nota_recepcion_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.nota_recepcion_id_seq OWNED BY operaciones.nota_recepcion.id;


--
-- Name: nota_recepcion_item; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.nota_recepcion_item (
    id bigint NOT NULL,
    nota_recepcion_id bigint,
    pedido_item_id bigint,
    creado_en timestamp without time zone,
    usuario_id bigint
);


ALTER TABLE operaciones.nota_recepcion_item OWNER TO franco;

--
-- Name: nota_recepcion_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.nota_recepcion_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.nota_recepcion_item_id_seq OWNER TO franco;

--
-- Name: nota_recepcion_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.nota_recepcion_item_id_seq OWNED BY operaciones.nota_recepcion_item.id;


--
-- Name: pedido; Type: TABLE; Schema: operaciones; Owner: franco
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
    vencimiento timestamp(0) without time zone,
    presentacion_id bigint,
    cantidad numeric
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
-- Name: programar_precio; Type: TABLE; Schema: operaciones; Owner: franco
--

CREATE TABLE operaciones.programar_precio (
    id bigint NOT NULL,
    precio_id bigint NOT NULL,
    momento_cambio operaciones.cambio_precio_momento DEFAULT 'INMEDIATO'::operaciones.cambio_precio_momento,
    nuevo_precio numeric NOT NULL,
    fecha_cambio timestamp without time zone NOT NULL,
    cantidad numeric,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint
);


ALTER TABLE operaciones.programar_precio OWNER TO franco;

--
-- Name: programar_precio_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.programar_precio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.programar_precio_id_seq OWNER TO franco;

--
-- Name: programar_precio_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.programar_precio_id_seq OWNED BY operaciones.programar_precio.id;


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
-- Name: transferencia; Type: TABLE; Schema: operaciones; Owner: franco
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


ALTER TABLE operaciones.transferencia OWNER TO franco;

--
-- Name: transferencia_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.transferencia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.transferencia_id_seq OWNER TO franco;

--
-- Name: transferencia_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.transferencia_id_seq OWNED BY operaciones.transferencia.id;


--
-- Name: transferencia_item; Type: TABLE; Schema: operaciones; Owner: franco
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


ALTER TABLE operaciones.transferencia_item OWNER TO franco;

--
-- Name: transferencia_item_id_seq; Type: SEQUENCE; Schema: operaciones; Owner: franco
--

CREATE SEQUENCE operaciones.transferencia_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE operaciones.transferencia_item_id_seq OWNER TO franco;

--
-- Name: transferencia_item_id_seq; Type: SEQUENCE OWNED BY; Schema: operaciones; Owner: franco
--

ALTER SEQUENCE operaciones.transferencia_item_id_seq OWNED BY operaciones.transferencia_item.id;


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
    total_rs numeric,
    total_ds numeric,
    forma_pago_id bigint,
    cobro_id bigint,
    caja_id bigint
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
    precio_id bigint,
    costo_unitario numeric,
    existencia numeric,
    producto_id bigint,
    cantidad numeric,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    descuento_unitario numeric DEFAULT 0,
    presentacion_id bigint,
    activo boolean DEFAULT true
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
    creado_en timestamp with time zone DEFAULT now(),
    activo boolean DEFAULT true NOT NULL
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
-- Name: grupo_role; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.grupo_role (
    id bigint NOT NULL,
    descripcion character varying NOT NULL,
    usuario_id bigint,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE personas.grupo_role OWNER TO franco;

--
-- Name: grupo_privilegio_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.grupo_privilegio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.grupo_privilegio_id_seq OWNER TO franco;

--
-- Name: grupo_privilegio_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.grupo_privilegio_id_seq OWNED BY personas.grupo_role.id;


--
-- Name: persona; Type: TABLE; Schema: personas; Owner: franco
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
-- Name: pre_registro_funcionario; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.pre_registro_funcionario (
    id bigint NOT NULL,
    funcionario_id bigint,
    nombre_completo character varying,
    apodo character varying,
    documento character varying,
    telefono_personal character varying,
    telefono_emergencia character varying,
    nombre_contacto_emergencia character varying,
    email character varying,
    ciudad character varying,
    direccion character varying,
    sucursal character varying,
    fecha_nacimiento timestamp without time zone,
    fecha_ingreso timestamp without time zone,
    habilidades character varying,
    registro_conducir boolean,
    nivel_educacion character varying,
    observacion character varying,
    verificado boolean,
    creado_en timestamp without time zone
);


ALTER TABLE personas.pre_registro_funcionario OWNER TO franco;

--
-- Name: pre_registro_funcionario_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.pre_registro_funcionario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.pre_registro_funcionario_id_seq OWNER TO franco;

--
-- Name: pre_registro_funcionario_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.pre_registro_funcionario_id_seq OWNED BY personas.pre_registro_funcionario.id;


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
    creado_en timestamp with time zone DEFAULT now(),
    grupo_role_id bigint
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
-- Name: usuario_grupo; Type: TABLE; Schema: personas; Owner: franco
--

CREATE TABLE personas.usuario_grupo (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    grupo_privilegio_id bigint NOT NULL,
    modificado boolean DEFAULT false,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE personas.usuario_grupo OWNER TO franco;

--
-- Name: usuario_grupo_id_seq; Type: SEQUENCE; Schema: personas; Owner: franco
--

CREATE SEQUENCE personas.usuario_grupo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE personas.usuario_grupo_id_seq OWNER TO franco;

--
-- Name: usuario_grupo_id_seq; Type: SEQUENCE OWNED BY; Schema: personas; Owner: franco
--

ALTER SEQUENCE personas.usuario_grupo_id_seq OWNED BY personas.usuario_grupo.id;


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
-- Name: costo_por_producto; Type: TABLE; Schema: productos; Owner: franco
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


ALTER TABLE productos.costo_por_producto OWNER TO franco;

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

ALTER SEQUENCE productos.costos_por_sucursal_id_seq OWNED BY productos.costo_por_producto.id;


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
    creado_en timestamp with time zone DEFAULT now(),
    posicion numeric
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
    id_sucursal_origen bigint,
    activo boolean DEFAULT true,
    is_envase boolean DEFAULT false,
    envase_id bigint
);


ALTER TABLE productos.producto OWNER TO franco;

--
-- Name: COLUMN producto.descripcion; Type: -- COMMENT; Schema: productos; Owner: franco
--

-- COMMENT ON COLUMN productos.producto.descripcion IS 'Descripcion del producto';


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

ALTER TABLE ONLY configuraciones.actualizacion ALTER COLUMN id SET DEFAULT nextval('configuraciones.actualizacion_id_seq'::regclass);


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

ALTER TABLE ONLY empresarial.configuracion_general ALTER COLUMN id SET DEFAULT nextval('empresarial.configuracion_general_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.punto_de_venta ALTER COLUMN id SET DEFAULT nextval('empresarial.punto_de_venta_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sector ALTER COLUMN id SET DEFAULT nextval('empresarial.sector_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sucursal ALTER COLUMN id SET DEFAULT nextval('empresarial.sucursal_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.zona ALTER COLUMN id SET DEFAULT nextval('empresarial.zona_id_seq'::regclass);


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

ALTER TABLE ONLY financiero.cambio_caja ALTER COLUMN id SET DEFAULT nextval('financiero.cambio_caja_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.conteo ALTER COLUMN id SET DEFAULT nextval('financiero.conteo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.conteo_moneda ALTER COLUMN id SET DEFAULT nextval('financiero.conteo_moneda_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cuenta_bancaria ALTER COLUMN id SET DEFAULT nextval('financiero.cuenta_bancaria_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.documento ALTER COLUMN id SET DEFAULT nextval('financiero.documento_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal ALTER COLUMN id SET DEFAULT nextval('financiero.factura_legal_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal_item ALTER COLUMN id SET DEFAULT nextval('financiero.factura_legal_item_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.forma_pago ALTER COLUMN id SET DEFAULT nextval('financiero.forma_pago_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto ALTER COLUMN id SET DEFAULT nextval('financiero.gasto_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto_detalle ALTER COLUMN id SET DEFAULT nextval('financiero.gasto_detalle_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda ALTER COLUMN id SET DEFAULT nextval('financiero.moneda_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda_billetes ALTER COLUMN id SET DEFAULT nextval('financiero.moneda_billetes_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.movimiento_caja ALTER COLUMN id SET DEFAULT nextval('financiero.movimiento_caja_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.pdv_caja ALTER COLUMN id SET DEFAULT nextval('financiero.pdv_caja_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro ALTER COLUMN id SET DEFAULT nextval('financiero.retiro_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro_detalle ALTER COLUMN id SET DEFAULT nextval('financiero.retiro_detalle_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo ALTER COLUMN id SET DEFAULT nextval('financiero.sencillo_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo_detalle ALTER COLUMN id SET DEFAULT nextval('financiero.sencillo_detalle_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.timbrado ALTER COLUMN id SET DEFAULT nextval('financiero.timbrado_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.timbrado_detalle ALTER COLUMN id SET DEFAULT nextval('financiero.timbrado_detalle_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.tipo_gasto ALTER COLUMN id SET DEFAULT nextval('financiero.tipo_gasto_id_seq'::regclass);


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

ALTER TABLE ONLY operaciones.cobro ALTER COLUMN id SET DEFAULT nextval('operaciones.cobro_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.cobro_detalle ALTER COLUMN id SET DEFAULT nextval('operaciones.cobro_detalle_id_seq'::regclass);


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

ALTER TABLE ONLY operaciones.inventario ALTER COLUMN id SET DEFAULT nextval('operaciones.inventario_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto ALTER COLUMN id SET DEFAULT nextval('operaciones.inventario_producto_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto_item ALTER COLUMN id SET DEFAULT nextval('operaciones.inventario_producto_item_id_seq'::regclass);


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

ALTER TABLE ONLY operaciones.nota_recepcion ALTER COLUMN id SET DEFAULT nextval('operaciones.nota_recepcion_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion_item ALTER COLUMN id SET DEFAULT nextval('operaciones.nota_recepcion_item_id_seq'::regclass);


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

ALTER TABLE ONLY operaciones.programar_precio ALTER COLUMN id SET DEFAULT nextval('operaciones.programar_precio_id_seq'::regclass);


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

ALTER TABLE ONLY operaciones.transferencia ALTER COLUMN id SET DEFAULT nextval('operaciones.transferencia_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia_item ALTER COLUMN id SET DEFAULT nextval('operaciones.transferencia_item_id_seq'::regclass);


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

ALTER TABLE ONLY personas.grupo_role ALTER COLUMN id SET DEFAULT nextval('personas.grupo_privilegio_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.persona ALTER COLUMN id SET DEFAULT nextval('personas.persona_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.pre_registro_funcionario ALTER COLUMN id SET DEFAULT nextval('personas.pre_registro_funcionario_id_seq'::regclass);


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

ALTER TABLE ONLY personas.usuario_grupo ALTER COLUMN id SET DEFAULT nextval('personas.usuario_grupo_id_seq'::regclass);


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

ALTER TABLE ONLY productos.costo_por_producto ALTER COLUMN id SET DEFAULT nextval('productos.costos_por_sucursal_id_seq'::regclass);


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
-- Name: actualizacion_current_version_key; Type: CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.actualizacion
    ADD CONSTRAINT actualizacion_current_version_key UNIQUE (current_version);


--
-- Name: actualizacion_pkey; Type: CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.actualizacion
    ADD CONSTRAINT actualizacion_pkey PRIMARY KEY (id);


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
-- Name: local_un; Type: CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.local
    ADD CONSTRAINT local_un UNIQUE (sucursal_id);


--
-- Name: cargo_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.cargo
    ADD CONSTRAINT cargo_pkey PRIMARY KEY (id);


--
-- Name: configuracion_general_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.configuracion_general
    ADD CONSTRAINT configuracion_general_pkey PRIMARY KEY (id);


--
-- Name: punto_de_venta_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.punto_de_venta
    ADD CONSTRAINT punto_de_venta_pkey PRIMARY KEY (id);


--
-- Name: sector_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sector
    ADD CONSTRAINT sector_pkey PRIMARY KEY (id);


--
-- Name: sucursal_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sucursal
    ADD CONSTRAINT sucursal_pkey PRIMARY KEY (id);


--
-- Name: zona_pkey; Type: CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.zona
    ADD CONSTRAINT zona_pkey PRIMARY KEY (id);


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
-- Name: conteo_moneda_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.conteo_moneda
    ADD CONSTRAINT conteo_moneda_pkey PRIMARY KEY (id);


--
-- Name: conteo_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.conteo
    ADD CONSTRAINT conteo_pkey PRIMARY KEY (id);


--
-- Name: cuenta_bancaria_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cuenta_bancaria
    ADD CONSTRAINT cuenta_bancaria_pkey PRIMARY KEY (id);


--
-- Name: documento_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.documento
    ADD CONSTRAINT documento_pkey PRIMARY KEY (id);


--
-- Name: documento_un; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.documento
    ADD CONSTRAINT documento_un UNIQUE (descripcion);


--
-- Name: factura_legal_item_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal_item
    ADD CONSTRAINT factura_legal_item_pkey PRIMARY KEY (id);


--
-- Name: factura_legal_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_pkey PRIMARY KEY (id);


--
-- Name: forma_pago_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.forma_pago
    ADD CONSTRAINT forma_pago_pkey PRIMARY KEY (id);


--
-- Name: gasto_detalle_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto_detalle
    ADD CONSTRAINT gasto_detalle_pkey PRIMARY KEY (id);


--
-- Name: gasto_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT gasto_pkey PRIMARY KEY (id);


--
-- Name: maletin_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.maletin
    ADD CONSTRAINT maletin_pkey PRIMARY KEY (id);


--
-- Name: maletin_un_descripcion; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.maletin
    ADD CONSTRAINT maletin_un_descripcion UNIQUE (descripcion);


--
-- Name: moneda_billetes_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda_billetes
    ADD CONSTRAINT moneda_billetes_pkey PRIMARY KEY (id);


--
-- Name: moneda_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda
    ADD CONSTRAINT moneda_pkey PRIMARY KEY (id);


--
-- Name: mov_cambio_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_pkey PRIMARY KEY (id);


--
-- Name: movimiento_caja_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_pkey PRIMARY KEY (id);


--
-- Name: pdv_caja_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_pkey PRIMARY KEY (id);


--
-- Name: retiro_detalle_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro_detalle
    ADD CONSTRAINT retiro_detalle_pkey PRIMARY KEY (id);


--
-- Name: retiro_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_pkey PRIMARY KEY (id);


--
-- Name: sencillo_detalle_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_pkey PRIMARY KEY (id);


--
-- Name: sencillo_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_pkey PRIMARY KEY (id);


--
-- Name: timbrado_detalle_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.timbrado_detalle
    ADD CONSTRAINT timbrado_detalle_pkey PRIMARY KEY (id);


--
-- Name: timbrado_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.timbrado
    ADD CONSTRAINT timbrado_pkey PRIMARY KEY (id);


--
-- Name: tipo_gasto_pkey; Type: CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.tipo_gasto
    ADD CONSTRAINT tipo_gasto_pkey PRIMARY KEY (id);


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
-- Name: cobro_detalle_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_pkey PRIMARY KEY (id);


--
-- Name: cobro_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.cobro
    ADD CONSTRAINT cobro_pkey PRIMARY KEY (id);


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
-- Name: inventario_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario
    ADD CONSTRAINT inventario_pkey PRIMARY KEY (id);


--
-- Name: inventario_producto_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_item_pkey PRIMARY KEY (id);


--
-- Name: inventario_producto_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_pkey PRIMARY KEY (id);


--
-- Name: inventario_producto_un; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_un UNIQUE (inventario_id, zona_id);


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
-- Name: nota_recepcion_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion_item
    ADD CONSTRAINT nota_recepcion_item_pkey PRIMARY KEY (id);


--
-- Name: nota_recepcion_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_pkey PRIMARY KEY (id);


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
-- Name: programar_precio_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.programar_precio
    ADD CONSTRAINT programar_precio_pkey PRIMARY KEY (id);


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
-- Name: transferencia_item_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_pkey PRIMARY KEY (id);


--
-- Name: transferencia_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_pkey PRIMARY KEY (id);


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
-- Name: funcionario_un_persona; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_un_persona UNIQUE (persona_id);


--
-- Name: grupo_privilegio_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.grupo_role
    ADD CONSTRAINT grupo_privilegio_pkey PRIMARY KEY (id);


--
-- Name: persona_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.persona
    ADD CONSTRAINT persona_pkey PRIMARY KEY (id);


--
-- Name: persona_un_documento; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.persona
    ADD CONSTRAINT persona_un_documento UNIQUE (documento);


--
-- Name: pre_registro_funcionario_documento_key; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.pre_registro_funcionario
    ADD CONSTRAINT pre_registro_funcionario_documento_key UNIQUE (documento);


--
-- Name: pre_registro_funcionario_email_key; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.pre_registro_funcionario
    ADD CONSTRAINT pre_registro_funcionario_email_key UNIQUE (email);


--
-- Name: pre_registro_funcionario_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.pre_registro_funcionario
    ADD CONSTRAINT pre_registro_funcionario_pkey PRIMARY KEY (id);


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
-- Name: role_grupo_role_un; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_grupo_role_un UNIQUE (id, grupo_role_id);


--
-- Name: role_nombre_un; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_nombre_un UNIQUE (nombre);


--
-- Name: role_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: usuario_grupo_pkey; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario_grupo
    ADD CONSTRAINT usuario_grupo_pkey PRIMARY KEY (id);


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
-- Name: usuario_un_nickname; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_un_nickname UNIQUE (nickname);


--
-- Name: usuario_un_persona; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_un_persona UNIQUE (persona_id);


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

ALTER TABLE ONLY productos.costo_por_producto
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
-- Name: producto_un_id_central; Type: CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.producto
    ADD CONSTRAINT producto_un_id_central UNIQUE (id_central);


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
-- Name: codigo_codigo_idx; Type: INDEX; Schema: productos; Owner: franco
--

CREATE INDEX codigo_codigo_idx ON productos.codigo USING btree (codigo);


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
-- Name: actualizacion_usuario_fk; Type: FK CONSTRAINT; Schema: configuraciones; Owner: franco
--

ALTER TABLE ONLY configuraciones.actualizacion
    ADD CONSTRAINT actualizacion_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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
-- Name: punto_de_venta_sucursal_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.punto_de_venta
    ADD CONSTRAINT punto_de_venta_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id) ON DELETE CASCADE;


--
-- Name: punto_de_venta_usuario_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.configuracion_general
    ADD CONSTRAINT punto_de_venta_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON DELETE SET NULL;


--
-- Name: punto_de_venta_usuario_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.punto_de_venta
    ADD CONSTRAINT punto_de_venta_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON DELETE SET NULL;


--
-- Name: sector_sucursal_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sector
    ADD CONSTRAINT sector_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: sector_usuario_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.sector
    ADD CONSTRAINT sector_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: sector_usuario_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.zona
    ADD CONSTRAINT sector_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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
-- Name: zona_sector_fk; Type: FK CONSTRAINT; Schema: empresarial; Owner: franco
--

ALTER TABLE ONLY empresarial.zona
    ADD CONSTRAINT zona_sector_fk FOREIGN KEY (sector_id) REFERENCES empresarial.sector(id) ON DELETE CASCADE;


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
-- Name: cambio_autorizado_por_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT cambio_autorizado_por_id_fkey FOREIGN KEY (autorizado_por_id) REFERENCES personas.funcionario(id);


--
-- Name: cambio_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio
    ADD CONSTRAINT cambio_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: cambio_responsable_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT cambio_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id);


--
-- Name: cambio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio
    ADD CONSTRAINT cambio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: cambio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT cambio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: conteo_moneda_conteo_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.conteo_moneda
    ADD CONSTRAINT conteo_moneda_conteo_id_fkey FOREIGN KEY (conteo_id) REFERENCES financiero.conteo(id) ON DELETE CASCADE;


--
-- Name: conteo_moneda_moneda_billetes_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.conteo_moneda
    ADD CONSTRAINT conteo_moneda_moneda_billetes_id_fkey FOREIGN KEY (moneda_billetes_id) REFERENCES financiero.moneda_billetes(id);


--
-- Name: conteo_moneda_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.conteo_moneda
    ADD CONSTRAINT conteo_moneda_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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
-- Name: documento_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.documento
    ADD CONSTRAINT documento_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: factura_legal_cliente_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_cliente_fk FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id) ON DELETE SET NULL;


--
-- Name: factura_legal_item_factura_legal_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal_item
    ADD CONSTRAINT factura_legal_item_factura_legal_fk FOREIGN KEY (factura_legal_id) REFERENCES financiero.factura_legal(id) ON DELETE CASCADE;


--
-- Name: factura_legal_item_presentacion_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal_item
    ADD CONSTRAINT factura_legal_item_presentacion_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id) ON DELETE SET NULL;


--
-- Name: factura_legal_item_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal_item
    ADD CONSTRAINT factura_legal_item_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: factura_legal_item_venta_item_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal_item
    ADD CONSTRAINT factura_legal_item_venta_item_fk FOREIGN KEY (venta_item_id) REFERENCES operaciones.venta_item(id) ON DELETE SET NULL;


--
-- Name: factura_legal_timbrado_detalle_id_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_timbrado_detalle_id_fk FOREIGN KEY (timbrado_detalle_id) REFERENCES financiero.timbrado_detalle(id) ON DELETE SET NULL;


--
-- Name: factura_legal_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: factura_legal_venta_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.factura_legal
    ADD CONSTRAINT factura_legal_venta_fk FOREIGN KEY (venta_id) REFERENCES operaciones.venta(id);


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
-- Name: gasto_caja_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto
    ADD CONSTRAINT gasto_caja_fk FOREIGN KEY (caja_id) REFERENCES financiero.pdv_caja(id) ON DELETE CASCADE;


--
-- Name: gasto_detalle_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto_detalle
    ADD CONSTRAINT gasto_detalle_fk FOREIGN KEY (gasto_id) REFERENCES financiero.gasto(id) ON DELETE CASCADE;


--
-- Name: gasto_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto_detalle
    ADD CONSTRAINT gasto_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: gasto_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.gasto_detalle
    ADD CONSTRAINT gasto_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: maletin_cargo_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.tipo_gasto
    ADD CONSTRAINT maletin_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES empresarial.cargo(id);


--
-- Name: maletin_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.maletin
    ADD CONSTRAINT maletin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: maletin_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.tipo_gasto
    ADD CONSTRAINT maletin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: maletin_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.conteo
    ADD CONSTRAINT maletin_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: moneda_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda_billetes
    ADD CONSTRAINT moneda_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id) ON DELETE CASCADE;


--
-- Name: moneda_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.moneda_billetes
    ADD CONSTRAINT moneda_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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
-- Name: mov_cambio_autorizado_por_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_autorizado_por_id_fkey FOREIGN KEY (autorizado_por_id) REFERENCES personas.funcionario(id);


--
-- Name: mov_cambio_cliente_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES personas.cliente(id);


--
-- Name: mov_cambio_moneda_compra_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_moneda_compra_id_fkey FOREIGN KEY (moneda_compra_id) REFERENCES financiero.moneda(id);


--
-- Name: mov_cambio_moneda_venta_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_moneda_venta_id_fkey FOREIGN KEY (moneda_venta_id) REFERENCES financiero.moneda(id);


--
-- Name: mov_cambio_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.cambio_caja
    ADD CONSTRAINT mov_cambio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: movimiento_caja_cambio_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_cambio_id_fkey FOREIGN KEY (cambio_id) REFERENCES financiero.cambio(id);


--
-- Name: movimiento_caja_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_fk FOREIGN KEY (caja_id) REFERENCES financiero.pdv_caja(id) ON DELETE CASCADE;


--
-- Name: movimiento_caja_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: movimiento_caja_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.movimiento_caja
    ADD CONSTRAINT movimiento_caja_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: pdv_caja_conteo_apertura_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_conteo_apertura_fk FOREIGN KEY (conteo_apertura_id) REFERENCES financiero.conteo(id) ON DELETE CASCADE;


--
-- Name: pdv_caja_conteo_cierre_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_conteo_cierre_fk FOREIGN KEY (conteo_cierre_id) REFERENCES financiero.conteo(id) ON DELETE CASCADE;


--
-- Name: pdv_caja_maletin_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_maletin_id_fkey FOREIGN KEY (maletin_id) REFERENCES financiero.maletin(id);


--
-- Name: pdv_caja_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.pdv_caja
    ADD CONSTRAINT pdv_caja_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: retiro_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro_detalle
    ADD CONSTRAINT retiro_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: retiro_detalle_retiro_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro_detalle
    ADD CONSTRAINT retiro_detalle_retiro_id_fkey FOREIGN KEY (retiro_id) REFERENCES financiero.retiro(id);


--
-- Name: retiro_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro_detalle
    ADD CONSTRAINT retiro_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: retiro_fk_entrada; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_fk_entrada FOREIGN KEY (caja_entrada_id) REFERENCES financiero.pdv_caja(id) ON DELETE CASCADE;


--
-- Name: retiro_fk_salida; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_fk_salida FOREIGN KEY (caja_salida_id) REFERENCES financiero.pdv_caja(id) ON DELETE CASCADE;


--
-- Name: retiro_responsable_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id);


--
-- Name: retiro_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.retiro
    ADD CONSTRAINT retiro_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: sencillo_autorizado_por_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_autorizado_por_id_fkey FOREIGN KEY (autorizado_por_id) REFERENCES personas.funcionario(id);


--
-- Name: sencillo_detalle_cambio_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_cambio_id_fkey FOREIGN KEY (cambio_id) REFERENCES financiero.cambio(id);


--
-- Name: sencillo_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: sencillo_detalle_sencillo_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_sencillo_id_fkey FOREIGN KEY (sencillo_id) REFERENCES financiero.sencillo(id);


--
-- Name: sencillo_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo_detalle
    ADD CONSTRAINT sencillo_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: sencillo_responsable_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES personas.funcionario(id);


--
-- Name: sencillo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.sencillo
    ADD CONSTRAINT sencillo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: timbrado_detalle_punto_de_venta_id_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.timbrado_detalle
    ADD CONSTRAINT timbrado_detalle_punto_de_venta_id_fk FOREIGN KEY (punto_de_venta_id) REFERENCES empresarial.punto_de_venta(id) ON DELETE SET NULL;


--
-- Name: timbrado_detalle_timbrado_id_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.timbrado_detalle
    ADD CONSTRAINT timbrado_detalle_timbrado_id_fk FOREIGN KEY (timbrado_id) REFERENCES financiero.timbrado(id) ON DELETE CASCADE;


--
-- Name: timbrado_detalle_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.timbrado_detalle
    ADD CONSTRAINT timbrado_detalle_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON DELETE SET NULL;


--
-- Name: timbrado_usuario_fk; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.timbrado
    ADD CONSTRAINT timbrado_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON DELETE SET NULL;


--
-- Name: tipo_gasto_clasificacion_gasto_id_fkey; Type: FK CONSTRAINT; Schema: financiero; Owner: franco
--

ALTER TABLE ONLY financiero.tipo_gasto
    ADD CONSTRAINT tipo_gasto_clasificacion_gasto_id_fkey FOREIGN KEY (clasificacion_gasto_id) REFERENCES financiero.tipo_gasto(id) ON DELETE CASCADE;


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
-- Name: cobro_detalle_cobro_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_cobro_id_fkey FOREIGN KEY (cobro_id) REFERENCES operaciones.cobro(id) ON DELETE CASCADE;


--
-- Name: cobro_detalle_fk_forma_pago; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_fk_forma_pago FOREIGN KEY (forma_pago_id) REFERENCES financiero.forma_pago(id);


--
-- Name: cobro_detalle_moneda_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: cobro_detalle_usuario_id_fkey; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.cobro_detalle
    ADD CONSTRAINT cobro_detalle_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: cobro_usuario_id_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.cobro
    ADD CONSTRAINT cobro_usuario_id_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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
-- Name: compra_item_pedido_item_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_pedido_item_fk FOREIGN KEY (pedido_item_id) REFERENCES operaciones.pedido_item(id);


--
-- Name: compra_item_presentacion_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.compra_item
    ADD CONSTRAINT compra_item_presentacion_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


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
-- Name: inventario_producto_inventario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_inventario_fk FOREIGN KEY (inventario_id) REFERENCES operaciones.inventario(id) ON DELETE CASCADE;


--
-- Name: inventario_producto_inventario_producto_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_inventario_producto_fk FOREIGN KEY (inventario_producto_id) REFERENCES operaciones.inventario_producto(id) ON DELETE CASCADE;


--
-- Name: inventario_producto_presentacion_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_presentacion_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


--
-- Name: inventario_producto_producto_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_producto_fk FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: inventario_producto_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: inventario_producto_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: inventario_producto_zona_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto
    ADD CONSTRAINT inventario_producto_zona_fk FOREIGN KEY (zona_id) REFERENCES empresarial.zona(id);


--
-- Name: inventario_producto_zona_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario_producto_item
    ADD CONSTRAINT inventario_producto_zona_fk FOREIGN KEY (zona_id) REFERENCES empresarial.zona(id);


--
-- Name: inventario_sucursal_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario
    ADD CONSTRAINT inventario_sucursal_fk FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: inventario_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.inventario
    ADD CONSTRAINT inventario_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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
-- Name: nota_recepcion_compra_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_compra_fk FOREIGN KEY (compra_id) REFERENCES operaciones.nota_recepcion_item(id);


--
-- Name: nota_recepcion_documento_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_documento_fk FOREIGN KEY (documento_id) REFERENCES financiero.documento(id);


--
-- Name: nota_recepcion_item_nota_recepcion_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion_item
    ADD CONSTRAINT nota_recepcion_item_nota_recepcion_fk FOREIGN KEY (nota_recepcion_id) REFERENCES operaciones.nota_recepcion(id) ON DELETE CASCADE;


--
-- Name: nota_recepcion_item_pedido_item_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion_item
    ADD CONSTRAINT nota_recepcion_item_pedido_item_fk FOREIGN KEY (pedido_item_id) REFERENCES operaciones.pedido_item(id) ON DELETE CASCADE;


--
-- Name: nota_recepcion_item_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion_item
    ADD CONSTRAINT nota_recepcion_item_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: nota_recepcion_pedido_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_pedido_fk FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id) ON DELETE CASCADE;


--
-- Name: nota_recepcion_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.nota_recepcion
    ADD CONSTRAINT nota_recepcion_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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
-- Name: pedido_item_pedido_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_pedido_fk FOREIGN KEY (pedido_id) REFERENCES operaciones.pedido(id) ON DELETE CASCADE;


--
-- Name: pedido_item_presentacion_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.pedido_item
    ADD CONSTRAINT pedido_item_presentacion_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


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
-- Name: programar_precio_precio_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.programar_precio
    ADD CONSTRAINT programar_precio_precio_fk FOREIGN KEY (precio_id) REFERENCES productos.precio_por_sucursal(id) ON DELETE CASCADE;


--
-- Name: programar_precio_usuairo_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.programar_precio
    ADD CONSTRAINT programar_precio_usuairo_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


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
-- Name: transferencia_item_presentacion_1_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_presentacion_1_fk FOREIGN KEY (presentacion_pre_transferencia_id) REFERENCES productos.presentacion(id);


--
-- Name: transferencia_item_presentacion_2_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_presentacion_2_fk FOREIGN KEY (presentacion_preparacion_id) REFERENCES productos.presentacion(id);


--
-- Name: transferencia_item_presentacion_3_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_presentacion_3_fk FOREIGN KEY (presentacion_transporte_id) REFERENCES productos.presentacion(id);


--
-- Name: transferencia_item_presentacion_4_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_presentacion_4_fk FOREIGN KEY (presentacion_recepcion_id) REFERENCES productos.presentacion(id);


--
-- Name: transferencia_item_transferencia_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_transferencia_fk FOREIGN KEY (transferencia_id) REFERENCES operaciones.transferencia(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transferencia_item_usuario_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia_item
    ADD CONSTRAINT transferencia_item_usuario_fk FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: transferencia_suc_destino_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_suc_destino_fk FOREIGN KEY (sucursal_destino_id) REFERENCES empresarial.sucursal(id);


--
-- Name: transferencia_suc_origen_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_suc_origen_fk FOREIGN KEY (sucursal_origen_id) REFERENCES empresarial.sucursal(id);


--
-- Name: transferencia_usuario_1_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_usuario_1_fk FOREIGN KEY (usuario_pre_transferencia_id) REFERENCES personas.usuario(id);


--
-- Name: transferencia_usuario_2_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_usuario_2_fk FOREIGN KEY (usuario_preparacion_id) REFERENCES personas.usuario(id);


--
-- Name: transferencia_usuario_3_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_usuario_3_fk FOREIGN KEY (usuario_transporte_id) REFERENCES personas.usuario(id);


--
-- Name: transferencia_usuario_4_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.transferencia
    ADD CONSTRAINT transferencia_usuario_4_fk FOREIGN KEY (usuario_recepcion_id) REFERENCES personas.usuario(id);


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
-- Name: venta_fk_caja; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_fk_caja FOREIGN KEY (caja_id) REFERENCES financiero.pdv_caja(id);


--
-- Name: venta_fk_cobro; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta
    ADD CONSTRAINT venta_fk_cobro FOREIGN KEY (cobro_id) REFERENCES operaciones.cobro(id);


--
-- Name: venta_item_fk; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_fk FOREIGN KEY (presentacion_id) REFERENCES productos.presentacion(id);


--
-- Name: venta_item_fk_precio; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_fk_precio FOREIGN KEY (precio_id) REFERENCES productos.precio_por_sucursal(id);


--
-- Name: venta_item_fk_venta; Type: FK CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.venta_item
    ADD CONSTRAINT venta_item_fk_venta FOREIGN KEY (venta_id) REFERENCES operaciones.venta(id) ON DELETE CASCADE;


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
    ADD CONSTRAINT cliente_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id) ON UPDATE CASCADE;


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
    ADD CONSTRAINT funcionario_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id) ON UPDATE CASCADE;


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
-- Name: grupo_privilegio_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario_grupo
    ADD CONSTRAINT grupo_privilegio_id_fkey FOREIGN KEY (grupo_privilegio_id) REFERENCES personas.grupo_role(id);


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
-- Name: pre_registro_funcionario_fk; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.pre_registro_funcionario
    ADD CONSTRAINT pre_registro_funcionario_fk FOREIGN KEY (funcionario_id) REFERENCES personas.funcionario(id);


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
-- Name: role_grupo_role_fk; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.role
    ADD CONSTRAINT role_grupo_role_fk FOREIGN KEY (grupo_role_id) REFERENCES personas.grupo_role(id) ON DELETE SET NULL;


--
-- Name: usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.grupo_role
    ADD CONSTRAINT usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: usuario_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario_grupo
    ADD CONSTRAINT usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id);


--
-- Name: usuario_persona_id_fkey; Type: FK CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.usuario
    ADD CONSTRAINT usuario_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES personas.persona(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
    ADD CONSTRAINT usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES personas.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL;


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

ALTER TABLE ONLY productos.costo_por_producto
    ADD CONSTRAINT costos_por_sucursal_moneda_id_fkey FOREIGN KEY (moneda_id) REFERENCES financiero.moneda(id);


--
-- Name: costos_por_sucursal_movimiento_stock_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costo_por_producto
    ADD CONSTRAINT costos_por_sucursal_movimiento_stock_id_fkey FOREIGN KEY (movimiento_stock_id) REFERENCES operaciones.movimiento_stock(id);


--
-- Name: costos_por_sucursal_producto_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costo_por_producto
    ADD CONSTRAINT costos_por_sucursal_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos.producto(id);


--
-- Name: costos_por_sucursal_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costo_por_producto
    ADD CONSTRAINT costos_por_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES empresarial.sucursal(id);


--
-- Name: costos_por_sucursal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.costo_por_producto
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
-- Name: subfamilia_subfamiliafk; Type: FK CONSTRAINT; Schema: productos; Owner: franco
--

ALTER TABLE ONLY productos.subfamilia
    ADD CONSTRAINT subfamilia_subfamiliafk FOREIGN KEY (sub_familia_id) REFERENCES productos.subfamilia(id) ON DELETE CASCADE;


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

