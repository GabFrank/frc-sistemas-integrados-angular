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
    usuario_id bigint
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
    estado operaciones.pedido_item_estado,
    creado_en timestamp with time zone DEFAULT now(),
    usuario_id bigint,
    lote character varying,
    valor_total numeric,
    vencimiento timestamp(0) with time zone
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
    presentacion_id bigint
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
-- Data for Name: cambio_caja; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.cambio_caja (id, cliente_id, autorizado_por_id, moneda_venta_id, moneda_compra_id, cotizacion, observacion, creado_en, usuario_id) FROM stdin;
\.


--
-- Name: cambio_caja_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.cambio_caja_id_seq', 1, false);


--
-- Name: cambio_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.cambio_id_seq', 6, true);


--
-- Data for Name: conteo; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.conteo (id, observacion, creado_en, usuario_id) FROM stdin;
73	\N	2021-12-20 22:52:18.332+00	\N
74	\N	2021-12-21 19:58:17.656+00	\N
75	\N	2021-12-28 15:14:56.813+00	\N
72	\N	2021-12-20 21:39:05.68+00	\N
\.


--
-- Name: conteo_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.conteo_id_seq', 75, true);


--
-- Data for Name: conteo_moneda; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.conteo_moneda (id, conteo_id, moneda_billetes_id, cantidad, observacion, creado_en, usuario_id) FROM stdin;
928	72	1	1	\N	2021-12-20 21:39:05.921+00	\N
929	72	2	1	\N	2021-12-20 21:39:05.969+00	\N
930	72	3	1	\N	2021-12-20 21:39:06+00	\N
931	72	4	1	\N	2021-12-20 21:39:06.034+00	\N
932	72	5	1	\N	2021-12-20 21:39:06.063+00	\N
933	72	6	1	\N	2021-12-20 21:39:06.092+00	\N
934	72	7	1	\N	2021-12-20 21:39:06.124+00	\N
935	72	8	1	\N	2021-12-20 21:39:06.155+00	\N
936	72	9	1	\N	2021-12-20 21:39:06.183+00	\N
937	72	11	1	\N	2021-12-20 21:39:06.207+00	\N
938	72	12	1	\N	2021-12-20 21:39:06.234+00	\N
939	72	13	1	\N	2021-12-20 21:39:06.257+00	\N
940	72	14	1	\N	2021-12-20 21:39:06.28+00	\N
941	72	15	1	\N	2021-12-20 21:39:06.305+00	\N
942	72	16	1	\N	2021-12-20 21:39:06.328+00	\N
943	72	17	1	\N	2021-12-20 21:39:06.357+00	\N
944	72	18	1	\N	2021-12-20 21:39:06.384+00	\N
945	72	19	1	\N	2021-12-20 21:39:06.414+00	\N
946	72	20	1	\N	2021-12-20 21:39:06.442+00	\N
947	72	21	1	\N	2021-12-20 21:39:06.467+00	\N
948	72	22	1	\N	2021-12-20 21:39:06.489+00	\N
949	72	23	1	\N	2021-12-20 21:39:06.516+00	\N
950	72	24	1	\N	2021-12-20 21:39:06.543+00	\N
951	72	25	1	\N	2021-12-20 21:39:06.569+00	\N
952	72	26	1	\N	2021-12-20 21:39:06.595+00	\N
953	73	2	1	\N	2021-12-20 22:52:18.438+00	\N
954	73	3	1	\N	2021-12-20 22:52:18.474+00	\N
955	73	4	1	\N	2021-12-20 22:52:18.507+00	\N
956	73	5	2	\N	2021-12-20 22:52:18.542+00	\N
957	73	6	4	\N	2021-12-20 22:52:18.57+00	\N
958	73	7	19	\N	2021-12-20 22:52:18.594+00	\N
959	73	8	22	\N	2021-12-20 22:52:18.623+00	\N
960	73	9	1	\N	2021-12-20 22:52:18.651+00	\N
961	73	11	1	\N	2021-12-20 22:52:18.681+00	\N
962	73	12	1	\N	2021-12-20 22:52:18.707+00	\N
963	73	13	1	\N	2021-12-20 22:52:18.729+00	\N
964	73	14	1	\N	2021-12-20 22:52:18.752+00	\N
965	73	15	4	\N	2021-12-20 22:52:18.775+00	\N
966	73	16	3	\N	2021-12-20 22:52:18.808+00	\N
967	73	17	23	\N	2021-12-20 22:52:18.837+00	\N
968	73	18	5	\N	2021-12-20 22:52:18.866+00	\N
969	73	19	4	\N	2021-12-20 22:52:18.893+00	\N
970	73	20	6	\N	2021-12-20 22:52:18.923+00	\N
971	73	21	1	\N	2021-12-20 22:52:18.954+00	\N
972	73	23	1	\N	2021-12-20 22:52:18.983+00	\N
973	74	4	5	\N	2021-12-21 19:58:17.895+00	\N
974	74	5	5	\N	2021-12-21 19:58:17.944+00	\N
975	74	6	5	\N	2021-12-21 19:58:17.986+00	\N
\.


--
-- Name: conteo_moneda_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.conteo_moneda_id_seq', 975, true);


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
-- Data for Name: documento; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.documento (id, descripcion, activo, creado_en, usuario_id) FROM stdin;
1	COMUN	t	\N	1
2	LEGAL	t	\N	1
\.


--
-- Name: documento_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.documento_id_seq', 2, true);


--
-- Data for Name: forma_pago; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.forma_pago (id, descripcion, activo, movimiento_caja, cuenta_bancaria_id, autorizacion, creado_en, usuario_id) FROM stdin;
1	EFECTIVO	t	t	\N	f	2021-10-25 17:46:50.327752+00	1
2	TARJETA	t	f	1	f	2021-10-25 17:47:27.783142+00	1
3	CONVENIO	t	f	\N	t	2021-10-25 17:48:46.447436+00	1
4	TRANSFERENCIA	t	f	1	t	2021-10-25 17:49:29.495563+00	1
5	CHEQUE	t	f	1	t	2022-01-05 19:05:37.906336+00	1
\.


--
-- Name: forma_pago_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.forma_pago_id_seq', 5, true);


--
-- Data for Name: gasto; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.gasto (id, responsable_id, tipo_gasto_id, autorizado_por_id, observacion, creado_en, usuario_id, caja_id, activo, finalizado, retiro_gs, retiro_rs, retiro_ds, vuelto_gs, vuelto_rs, vuelto_ds) FROM stdin;
43	1	20	\N	moto 5	2022-01-04 19:44:12+00	1	37	t	t	50000	0	0	10000	0	0
44	3	20	\N	camion 1	2022-01-04 19:44:12+00	1	37	t	t	150000	0	0	0	0	0
45	1	26	3	auspicio para equipo de handball	2022-01-05 00:16:45.967+00	1	37	t	t	100000	0	0	0	0	0
46	1	19	\N	cualquier cosa	2022-01-05 01:07:21.148+00	1	37	t	t	50000	0	0	0	0	0
47	1	3	1	\N	2022-01-05 13:16:23.373+00	1	37	t	t	100000	0	0	0	0	0
\.


--
-- Data for Name: gasto_detalle; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.gasto_detalle (id, gasto_id, moneda_id, cambio, cantidad, creado_en, usuario_id, vuelto) FROM stdin;
\.


--
-- Name: gasto_detalle_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.gasto_detalle_id_seq', 36, true);


--
-- Name: gasto_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.gasto_id_seq', 47, true);


--
-- Data for Name: maletin; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.maletin (id, descripcion, activo, creado_en, usuario_id, abierto) FROM stdin;
8	m6	t	2021-12-02 20:10:46.038+00	1	f
3	M3	t	2021-11-24 16:49:41.78656+00	1	f
4	M4	t	2021-11-24 16:49:41.78656+00	1	f
1	M1	t	2021-11-24 16:49:41.78656+00	1	t
2	M2	t	2021-11-24 16:49:41.78656+00	1	t
\.


--
-- Name: maletin_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.maletin_id_seq', 8, true);


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
-- Data for Name: moneda_billetes; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.moneda_billetes (id, moneda_id, flotante, papel, valor, activo, creado_en, usuario_id) FROM stdin;
3	1	f	t	2000	t	2021-11-29 17:24:07.866627+00	1
1	1	f	f	500	t	2021-11-29 17:24:07.866627+00	1
2	1	f	f	1000	t	2021-11-29 17:24:07.866627+00	1
4	1	f	t	5000	t	2021-11-29 17:24:07.866627+00	1
5	1	f	t	10000	t	2021-11-29 17:24:07.866627+00	1
6	1	f	t	20000	t	2021-11-29 17:24:07.866627+00	1
7	1	f	t	50000	t	2021-11-29 17:24:07.866627+00	1
8	1	f	t	100000	t	2021-11-29 17:24:07.866627+00	1
12	2	t	f	0.5	t	2021-11-29 17:25:35.045612+00	1
13	2	t	f	1	t	2021-11-29 17:26:31.092831+00	1
9	2	t	f	0.05	t	2021-11-29 17:24:07.866627+00	1
10	2	t	f	0.1	t	2021-11-29 17:25:35.045612+00	1
11	2	t	f	0.25	t	2021-11-29 17:25:35.045612+00	1
14	2	t	t	2	t	2021-11-29 17:26:31.092831+00	1
15	2	t	t	5	t	2021-11-29 17:27:33.740995+00	1
16	2	t	t	10	t	2021-11-29 17:27:33.740995+00	1
17	2	t	t	20	t	2021-11-29 17:27:33.740995+00	1
18	2	t	t	50	t	2021-11-29 17:27:33.740995+00	1
19	2	t	t	100	t	2021-11-29 17:27:33.740995+00	1
20	2	t	t	200	t	2021-11-29 17:27:33.740995+00	1
21	3	t	t	1	t	2021-11-29 17:27:33.740995+00	1
22	3	t	t	5	t	2021-11-29 17:27:33.740995+00	1
23	3	t	t	10	t	2021-11-29 17:27:33.740995+00	1
24	3	t	t	20	t	2021-11-29 17:27:33.740995+00	1
25	3	t	t	50	t	2021-11-29 17:27:33.740995+00	1
26	3	t	t	100	t	2021-11-29 17:27:33.740995+00	1
\.


--
-- Name: moneda_billetes_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.moneda_billetes_id_seq', 27, true);


--
-- Name: moneda_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.moneda_id_seq', 4, true);


--
-- Data for Name: movimiento_caja; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.movimiento_caja (id, caja_id, moneda_id, referencia_id, cambio_id, cantidad, tipo_movimiento, creado_en, usuario_id) FROM stdin;
151	36	1	5	1	-160000	RETIRO	2021-12-22 20:39:31.836+00	2
152	36	2	6	6	0	RETIRO	2021-12-22 20:39:37.448+00	2
153	36	3	7	3	0	RETIRO	2021-12-22 20:39:37.609+00	2
154	36	1	115	1	78000	VENTA	2021-12-22 22:44:35.522+00	2
155	36	1	8	1	-50000	RETIRO	2021-12-22 22:44:47.589+00	2
156	36	2	9	6	0	RETIRO	2021-12-22 22:44:47.677+00	2
157	36	3	10	3	0	RETIRO	2021-12-22 22:44:47.771+00	2
158	36	1	116	1	480000	VENTA	2021-12-23 13:47:35.571+00	2
159	36	1	11	1	-400000	RETIRO	2021-12-23 13:47:49.138+00	2
160	36	2	12	6	0	RETIRO	2021-12-23 13:47:49.284+00	2
161	36	3	13	3	0	RETIRO	2021-12-23 13:47:49.414+00	2
162	36	1	14	1	-100000	RETIRO	2021-12-23 13:48:16.623+00	2
163	36	2	15	6	0	RETIRO	2021-12-23 13:48:16.767+00	2
164	36	3	16	3	0	RETIRO	2021-12-23 13:48:16.902+00	2
165	36	1	117	1	48000	VENTA	2021-12-23 14:54:22.241+00	2
166	36	1	118	1	48000	VENTA	2021-12-23 14:56:37.309+00	2
167	36	1	20	1	-100000	GASTO	2021-12-28 04:04:10.684+00	2
168	36	1	21	1	-15000	GASTO	2021-12-28 13:19:52.503+00	2
169	36	1	22	1	-1000	GASTO	2021-12-28 13:28:26.804+00	2
170	36	1	23	1	-1000	GASTO	2021-12-28 13:38:24.232+00	2
171	36	1	24	1	-500	GASTO	2021-12-28 13:38:34.491+00	2
172	36	1	119	1	338000	VENTA	2021-12-28 13:42:13.977+00	2
173	36	1	25	1	-50000	GASTO	2021-12-28 13:47:05.485+00	2
174	36	1	26	1	-5000	GASTO	2021-12-28 14:42:49.071+00	2
175	36	1	27	1	-50000	GASTO	2021-12-28 15:04:45.115+00	2
176	36	1	28	1	-30000	GASTO	2021-12-28 15:06:20.26+00	2
177	36	1	29	1	-50000	GASTO	2021-12-28 15:08:59.925+00	2
178	37	2	75	6	0	CAJA_INICIAL	2021-12-28 15:14:56.897+00	\N
179	37	3	75	3	0	CAJA_INICIAL	2021-12-28 15:14:56.932+00	\N
180	37	1	75	1	0	CAJA_INICIAL	2021-12-28 15:14:56.965+00	\N
181	37	1	120	1	725000	VENTA	2021-12-28 15:16:52.793+00	1
182	37	1	17	1	-700000	RETIRO	2021-12-28 15:17:25.579+00	1
183	37	2	18	6	0	RETIRO	2021-12-28 15:17:25.672+00	1
184	37	3	19	3	0	RETIRO	2021-12-28 15:17:25.772+00	1
185	37	1	30	1	-25000	GASTO	2021-12-28 15:18:49.992+00	1
186	37	1	121	1	6000	VENTA	2021-12-30 19:05:54.236+00	1
187	37	1	122	1	120000	VENTA	2021-12-30 20:04:42.369+00	1
188	37	1	123	1	100000	VENTA	2021-12-30 20:05:59.963+00	1
189	37	2	123	6	21000	VENTA	2021-12-30 20:06:00.065+00	1
190	37	2	123	6	-997.5	VENTA	2021-12-30 20:06:00.151+00	1
191	37	2	123	6	-2.5	VENTA	2021-12-30 20:06:00.236+00	1
192	37	1	124	1	100000	VENTA	2022-01-03 14:11:37.596+00	1
193	37	2	124	6	20	VENTA	2022-01-03 14:11:37.689+00	1
194	37	2	124	6	-0.999954648526078	VENTA	2022-01-03 14:11:37.776+00	1
195	37	2	125	6	100	VENTA	2022-01-03 14:50:58.548+00	1
196	37	1	125	1	20000	VENTA	2022-01-03 14:50:58.653+00	1
129	35	2	72	6	388.8	CAJA_INICIAL	2021-12-20 21:39:05.816+00	\N
130	35	3	72	3	186	CAJA_INICIAL	2021-12-20 21:39:05.846+00	\N
131	35	1	72	1	188500	CAJA_INICIAL	2021-12-20 21:39:05.871+00	\N
132	35	1	103	1	48000	VENTA	2021-12-20 21:45:34.84+00	2
133	35	1	104	1	6000	VENTA	2021-12-20 21:47:16.715+00	2
134	35	1	105	1	6000	VENTA	2021-12-20 21:53:45.373+00	2
135	35	1	106	1	48000	VENTA	2021-12-20 21:57:17.66+00	2
136	35	1	107	1	145000	VENTA	2021-12-20 22:17:53.345+00	2
137	35	1	108	1	6000	VENTA	2021-12-20 22:22:04.243+00	2
138	35	1	109	1	48000	VENTA	2021-12-20 22:23:57.474+00	2
139	35	1	110	1	6000	VENTA	2021-12-20 22:24:09.309+00	2
140	35	1	111	1	6000	VENTA	2021-12-20 22:32:16.768+00	2
141	35	1	112	1	48000	VENTA	2021-12-20 22:33:24.732+00	2
142	35	1	113	1	30000	VENTA	2021-12-20 22:41:13.833+00	2
143	35	1	114	1	30000	VENTA	2021-12-20 22:44:32.478+00	2
144	36	2	74	6	0	CAJA_INICIAL	2021-12-21 19:58:17.782+00	\N
145	36	3	74	3	0	CAJA_INICIAL	2021-12-21 19:58:17.821+00	\N
146	36	1	74	1	175000	CAJA_INICIAL	2021-12-21 19:58:17.849+00	\N
197	37	1	125	1	-5000	VENTA	2022-01-03 14:50:58.726+00	1
198	37	1	126	1	100000	VENTA	2022-01-03 14:52:12.363+00	1
199	37	2	126	6	19	VENTA	2022-01-03 14:52:12.449+00	1
200	37	2	126	6	0.0476190476190476	VENTA	2022-01-03 14:52:12.531+00	1
201	37	1	127	1	100000	VENTA	2022-01-03 15:19:22.385+00	1
202	37	2	127	6	20	VENTA	2022-01-03 15:19:22.484+00	1
203	37	2	127	6	-1	VENTA	2022-01-03 15:19:22.565+00	1
204	37	1	127	1	50	VENTA	2022-01-03 15:19:22.643+00	1
205	37	1	128	1	6000	VENTA	2022-01-03 15:22:46.006+00	1
206	37	1	129	1	100000	VENTA	2022-01-03 15:54:18.599+00	1
207	37	2	129	6	29	VENTA	2022-01-03 15:54:18.69+00	1
208	37	2	129	6	-10	VENTA	2022-01-03 15:54:18.77+00	1
209	37	1	129	1	50	VENTA	2022-01-03 15:54:18.843+00	1
210	37	1	130	1	40000	VENTA	2022-01-03 16:25:09.9+00	1
211	37	1	130	1	50000	VENTA	2022-01-03 16:25:09.986+00	1
212	37	1	130	1	30000	VENTA	2022-01-03 16:25:10.066+00	1
213	37	1	131	1	100000	VENTA	2022-01-03 17:08:51.968+00	1
214	37	2	131	6	20	VENTA	2022-01-03 17:08:52.067+00	1
215	37	1	131	1	-1000	VENTA	2022-01-03 17:08:52.147+00	1
216	37	1	132	1	120000	VENTA	2022-01-03 17:16:00.145+00	1
217	37	1	133	1	100000	VENTA	2022-01-03 17:31:37.777+00	1
218	37	2	133	6	20	VENTA	2022-01-03 17:31:37.879+00	1
219	37	2	133	6	-1	VENTA	2022-01-03 17:31:37.964+00	1
220	37	1	133	1	50	VENTA	2022-01-03 17:31:38.044+00	1
221	37	1	134	1	120000	VENTA	2022-01-03 17:32:52.831+00	1
222	37	1	135	1	100000	VENTA	2022-01-03 17:52:23.305+00	1
223	37	2	135	6	19	VENTA	2022-01-03 17:52:23.423+00	1
224	37	1	135	1	50	VENTA	2022-01-03 17:52:23.505+00	1
225	37	1	136	1	6000	VENTA	2022-01-03 19:09:36.684+00	1
226	37	1	137	1	120000	VENTA	2022-01-03 19:09:55.504+00	1
227	37	1	31	1	-15000	GASTO	2022-01-03 19:25:33.243+00	1
228	37	1	32	1	-15000	GASTO	2022-01-03 19:29:08.965+00	1
229	37	1	33	1	-50000	GASTO	2022-01-04 14:13:42.037+00	1
230	37	1	34	1	-20000	GASTO	2022-01-04 14:21:52.114+00	1
231	37	1	35	1	-100000	GASTO	2022-01-04 14:23:16.35+00	1
232	37	1	36	1	-15000	GASTO	2022-01-04 16:15:11.29+00	1
233	37	1	44	1	-150000	GASTO	2022-01-04 20:52:02.786+00	1
234	37	1	45	1	-100000	GASTO	2022-01-05 00:21:14.644+00	1
235	37	1	46	1	-50000	GASTO	2022-01-05 13:14:06.09+00	1
236	37	1	47	1	-100000	GASTO	2022-01-05 13:16:44.064+00	1
237	37	1	20	1	-100000	RETIRO	2022-01-05 14:25:44.798+00	1
238	37	2	21	6	0	RETIRO	2022-01-05 14:25:44.915+00	1
239	37	3	22	3	0	RETIRO	2022-01-05 14:25:45.038+00	1
240	37	1	23	1	-50000	RETIRO	2022-01-05 14:27:39.417+00	1
241	37	2	24	6	0	RETIRO	2022-01-05 14:27:39.535+00	1
242	37	3	25	3	0	RETIRO	2022-01-05 14:27:39.665+00	1
243	37	1	26	1	-50000	RETIRO	2022-01-05 14:29:04.049+00	1
244	37	2	27	6	0	RETIRO	2022-01-05 14:29:04.162+00	1
245	37	3	28	3	0	RETIRO	2022-01-05 14:29:04.302+00	1
246	37	2	138	6	100	VENTA	2022-01-09 17:12:31.741+00	1
247	37	1	138	1	-67000	VENTA	2022-01-09 17:12:31.854+00	1
\.


--
-- Name: movimiento_caja_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.movimiento_caja_id_seq', 247, true);


--
-- Data for Name: pdv_caja; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.pdv_caja (id, descripcion, activo, estado, tuvo_problema, fecha_apertura, fecha_cierre, observacion, creado_en, maletin_id, usuario_id, conteo_apertura_id, conteo_cierre_id) FROM stdin;
35	\N	f	\N	\N	2021-12-20 21:39:00+00	2021-12-20 22:52:18.369+00	\N	2021-12-20 21:39:00+00	1	2	72	73
36	\N	t	\N	\N	2021-12-21 19:58:17.683+00	\N	\N	2021-12-21 19:58:17.515+00	1	2	74	\N
37	\N	t	\N	\N	2021-12-28 15:14:56.85+00	\N	\N	2021-12-28 15:14:49.428+00	2	1	75	\N
\.


--
-- Name: pdv_caja_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.pdv_caja_id_seq', 37, true);


--
-- Data for Name: retiro; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.retiro (id, responsable_id, estado, observacion, creado_en, usuario_id, caja_salida_id, caja_entrada_id) FROM stdin;
9	2	\N	\N	2021-12-22 20:34:23.751+00	2	36	\N
10	2	\N	\N	2021-12-22 20:36:01.278+00	2	36	\N
11	1	\N	\N	2021-12-22 20:36:53.486+00	2	36	\N
12	1	\N	\N	2021-12-22 20:37:55.076+00	2	36	\N
13	1	\N	\N	2021-12-22 20:39:31.723+00	2	36	\N
14	1	\N	\N	2021-12-22 22:43:25.493+00	2	36	\N
15	1	\N	\N	2021-12-22 22:44:22.054+00	2	36	\N
16	1	\N	\N	2021-12-22 22:44:47.49+00	2	36	\N
17	3	\N	\N	2021-12-23 13:38:42.798+00	2	36	\N
18	3	\N	\N	2021-12-23 13:47:21.511+00	2	36	\N
19	1	\N	\N	2021-12-23 13:47:48.862+00	2	36	\N
20	1	\N	\N	2021-12-23 13:48:16.504+00	2	36	\N
22	1	\N	\N	2021-12-28 15:17:25.474+00	1	37	\N
23	1	\N	\N	2022-01-05 14:25:44.616+00	1	37	\N
24	1	\N	\N	2022-01-05 14:27:39.186+00	1	37	\N
25	1	\N	\N	2022-01-05 14:29:03.781+00	1	37	\N
\.


--
-- Data for Name: retiro_detalle; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.retiro_detalle (id, retiro_id, moneda_id, cambio, cantidad, creado_en, usuario_id) FROM stdin;
5	13	1	1	160000	2021-12-22 20:39:31.805+00	2
6	13	2	1050	0	2021-12-22 20:39:37.409+00	2
7	13	3	6800	0	2021-12-22 20:39:37.565+00	2
8	16	1	1	50000	2021-12-22 22:44:47.561+00	2
9	16	2	1050	0	2021-12-22 22:44:47.65+00	2
10	16	3	6800	0	2021-12-22 22:44:47.744+00	2
11	19	1	1	400000	2021-12-23 13:47:49.086+00	2
12	19	2	1050	0	2021-12-23 13:47:49.247+00	2
13	19	3	6800	0	2021-12-23 13:47:49.378+00	2
14	20	1	1	100000	2021-12-23 13:48:16.585+00	2
15	20	2	1050	0	2021-12-23 13:48:16.723+00	2
16	20	3	6800	0	2021-12-23 13:48:16.857+00	2
17	22	1	1	700000	2021-12-28 15:17:25.548+00	1
18	22	2	1050	0	2021-12-28 15:17:25.642+00	1
19	22	3	6800	0	2021-12-28 15:17:25.744+00	1
20	23	1	1	100000	2022-01-05 14:25:44.75+00	1
21	23	2	1050	0	2022-01-05 14:25:44.885+00	1
22	23	3	6800	0	2022-01-05 14:25:44.999+00	1
23	24	1	1	50000	2022-01-05 14:27:39.36+00	1
24	24	2	1050	0	2022-01-05 14:27:39.506+00	1
25	24	3	6800	0	2022-01-05 14:27:39.624+00	1
26	25	1	1	50000	2022-01-05 14:29:03.976+00	1
27	25	2	1050	0	2022-01-05 14:29:04.133+00	1
28	25	3	6800	0	2022-01-05 14:29:04.264+00	1
\.


--
-- Name: retiro_detalle_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.retiro_detalle_id_seq', 28, true);


--
-- Name: retiro_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.retiro_id_seq', 25, true);


--
-- Data for Name: sencillo; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.sencillo (id, responsable_id, entrada, autorizado_por_id, observacion, creado_en, usuario_id) FROM stdin;
\.


--
-- Data for Name: sencillo_detalle; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.sencillo_detalle (id, sencillo_id, moneda_id, cambio_id, cantidad, creado_en, usuario_id) FROM stdin;
\.


--
-- Name: sencillo_detalle_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.sencillo_detalle_id_seq', 1, false);


--
-- Name: sencillo_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.sencillo_id_seq', 1, false);


--
-- Data for Name: tipo_gasto; Type: TABLE DATA; Schema: financiero; Owner: franco
--

COPY financiero.tipo_gasto (id, is_clasificacion, clasificacion_gasto_id, descripcion, activo, autorizacion, cargo_id, creado_en, usuario_id) FROM stdin;
2	\N	1	SALARIOS	t	t	\N	2021-11-26 03:46:17.868+00	1
37	\N	2	ANTICIPO	t	t	\N	2021-11-26 03:46:44.221+00	1
8	t	\N	SERVICIOS	t	\N	\N	2021-11-25 15:17:04.100235+00	1
10	t	8	INTERNET	t	\N	\N	2021-11-25 15:17:04.100235+00	1
11	t	8	ENERGIA	t	\N	\N	2021-11-25 15:17:04.100235+00	1
13	\N	12	PRODUCTOS	t	\N	\N	2021-11-25 18:43:17.813928+00	\N
14	\N	12	SERVICIOS	t	\N	\N	2021-11-25 18:43:17.834002+00	\N
12	t	\N	LIMPIEZA	t	\N	\N	2021-11-25 15:17:04.100235+00	1
15	\N	\N	BIENES MATERIALES	t	\N	\N	2021-11-25 18:43:17.834002+00	\N
16	\N	15	EQUIPOS INFORMATICOS	t	\N	\N	2021-11-25 18:43:17.834002+00	\N
17	\N	15	MUEBLES	t	\N	\N	2021-11-25 18:43:17.834002+00	\N
18	\N	15	VEHICULOS	t	\N	\N	2021-11-25 18:43:17.834002+00	\N
19	\N	18	MANTENIMIENTO	t	\N	\N	2021-11-25 18:43:17.834002+00	\N
20	\N	18	COMBUSTIBLE	t	\N	\N	2021-11-25 18:43:17.834002+00	\N
21	\N	19	MANO DE OBRA	t	\N	\N	2021-11-25 18:43:17.834002+00	\N
22	\N	19	COMPRA PIEZAS	t	\N	\N	2021-11-25 18:43:17.834002+00	\N
23	\N	\N	MARKETING	t	\N	\N	2021-11-25 20:39:08.918+00	1
25	\N	23	PUBLICIDAD	t	\N	\N	2021-11-25 20:45:13.823+00	1
27	\N	2	AGUINALDO	t	\N	\N	2021-11-26 01:40:22.185+00	1
28	\N	\N	INSUMOS	t	\N	\N	2021-11-26 01:53:32.496+00	1
29	\N	28	DIRECTOS	t	\N	\N	2021-11-26 01:53:46.562+00	1
30	\N	28	INDIRECTOS	t	\N	\N	2021-11-26 01:56:25.698+00	1
31	\N	30	PRUEBA 1	t	\N	\N	2021-11-26 02:04:34.46+00	1
32	\N	30	PRUEBA 2	t	\N	\N	2021-11-26 02:05:47.394+00	1
1	\N	\N	RRHHS	t	\N	\N	2021-11-26 03:32:57.264+00	1
6	\N	5	MATERIALES	t	\N	\N	2021-11-26 03:42:00.185+00	1
3	t	2	VALE	t	t	\N	2021-11-25 14:55:44.546529+00	1
26	\N	23	AUSPICIO	t	t	\N	2021-11-26 01:35:36.103+00	1
4	t	2	COMISION	t	t	\N	2021-11-25 14:58:20.017877+00	1
7	t	5	CONTABLES	t	t	\N	2021-11-25 15:17:04.100235+00	1
9	t	8	TELEFONIA	t	t	\N	2021-11-25 15:17:04.100235+00	1
5	\N	\N	ADMINISTRATIVO	t	t	\N	2021-11-26 03:42:06.897+00	1
24	\N	23	MATERIAL PUBLICITARIO	t	t	\N	2021-11-26 03:43:30.315+00	1
\.


--
-- Name: tipo_gasto_id_seq; Type: SEQUENCE SET; Schema: financiero; Owner: franco
--

SELECT pg_catalog.setval('financiero.tipo_gasto_id_seq', 40, true);


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
-- Data for Name: cobro; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.cobro (id, creado_en, usuario_id, total_gs) FROM stdin;
131	2022-01-03 17:08:51.781+00	1	120000
132	2022-01-03 17:16:00.03+00	1	120000
133	2022-01-03 17:31:37.567+00	1	120000
134	2022-01-03 17:32:52.714+00	1	120000
135	2022-01-03 17:52:23.023+00	1	120000
136	2022-01-03 19:09:36.357+00	1	6000
137	2022-01-03 19:09:55.388+00	1	120000
138	2022-01-09 17:12:31.477+00	1	38000
\.


--
-- Data for Name: cobro_detalle; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.cobro_detalle (id, cobro_id, creado_en, usuario_id, moneda_id, forma_pago_id, valor, cambio, vuelto, descuento, pago, aumento) FROM stdin;
138	131	2022-01-03 17:08:51.907+00	\N	1	1	100000	1	f	f	t	f
139	131	2022-01-03 17:08:52.028+00	\N	2	1	20	1050	f	f	t	f
140	131	2022-01-03 17:08:52.113+00	\N	1	1	-1000	1	t	f	f	t
141	132	2022-01-03 17:16:00.098+00	\N	1	1	120000	1	f	f	t	f
142	133	2022-01-03 17:31:37.706+00	\N	1	1	100000	1	f	f	t	f
143	133	2022-01-03 17:31:37.837+00	\N	2	1	20	1050	f	f	t	f
144	133	2022-01-03 17:31:37.928+00	\N	2	1	-1	1050	t	f	f	f
145	133	2022-01-03 17:31:38.008+00	\N	1	1	50	1	f	t	f	f
146	134	2022-01-03 17:32:52.791+00	\N	1	1	120000	1	f	f	t	f
147	135	2022-01-03 17:52:23.218+00	\N	1	1	100000	1	f	f	t	f
148	135	2022-01-03 17:52:23.377+00	\N	2	1	19	1050	f	f	t	f
149	135	2022-01-03 17:52:23.468+00	\N	1	1	50	1	f	t	f	f
150	136	2022-01-03 19:09:36.557+00	\N	1	1	6000	1	f	f	t	f
151	137	2022-01-03 19:09:55.458+00	\N	1	1	120000	1	f	f	t	f
152	138	2022-01-09 17:12:31.664+00	\N	2	1	100	1050	f	f	t	f
153	138	2022-01-09 17:12:31.816+00	\N	1	1	-67000	1	t	f	f	f
\.


--
-- Name: cobro_detalle_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.cobro_detalle_id_seq', 153, true);


--
-- Name: cobro_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.cobro_id_seq', 138, true);


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

COPY operaciones.compra_item (id, compra_id, producto_id, cantidad, precio_unitario, descuento_unitario, bonificacion, frio, observacion, estado, creado_en, usuario_id, lote, valor_total, vencimiento) FROM stdin;
\.


--
-- Name: compra_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.compra_item_id_seq', 1, false);


--
-- Data for Name: delivery; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.delivery (id, venta_id, valor_en_gs, precio_delivery_id, entregador_id, telefono, direccion, cliente_id, forma_pago_id, creado_en, usuario_id, estado, barrio_id, vehiculo_id, vuelto_id) FROM stdin;
\.


--
-- Name: delivery_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.delivery_id_seq', 42, true);


--
-- Data for Name: entrada; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.entrada (id, responsable_carga_id, tipo_entrada, observacion, creado_en, usuario_id, sucursal_id, activo) FROM stdin;
\.


--
-- Name: entrada_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.entrada_id_seq', 66, true);


--
-- Data for Name: entrada_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.entrada_item (id, producto_id, presentacion_id, cantidad, observacion, creado_en, usuario_id, entrada_id) FROM stdin;
\.


--
-- Name: entrada_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.entrada_item_id_seq', 48, true);


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
221	70	VENTA	184	-24	2022-01-03 17:32:53.146+00	\N	t	\N
222	70	VENTA	185	-24	2022-01-03 17:52:23.78+00	\N	t	\N
223	70	VENTA	186	-1	2022-01-03 19:09:36.975+00	\N	t	\N
224	70	VENTA	187	-24	2022-01-03 19:09:55.72+00	\N	t	\N
225	79	VENTA	188	-6	2022-01-09 17:12:32.101+00	\N	t	\N
\.


--
-- Name: movimiento_stock_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.movimiento_stock_id_seq', 225, true);


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
-- Data for Name: nota_recepcion; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.nota_recepcion (id, pedido_id, compra_id, documento_id, valor, descuento, pagado, numero, timbrado, creado_en, usuario_id) FROM stdin;
1	58	\N	2	\N	\N	f	443456	\N	\N	1
\.


--
-- Name: nota_recepcion_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.nota_recepcion_id_seq', 1, true);


--
-- Data for Name: nota_recepcion_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.nota_recepcion_item (id, nota_recepcion_id, pedido_item_id, creado_en, usuario_id) FROM stdin;
3	1	25	\N	1
1	1	22	\N	\N
2	1	24	\N	\N
4	1	23	\N	\N
5	1	23	\N	\N
\.


--
-- Name: nota_recepcion_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.nota_recepcion_item_id_seq', 5, true);


--
-- Data for Name: pedido; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.pedido (id, necesidad_id, proveedor_id, vendedor_id, fecha_de_entrega, plazo_credito, moneda_id, descuento, estado, creado_en, usuario_id, cantidad_notas, cod_interno_proveedor, forma_pago_id) FROM stdin;
58	\N	1	1	\N	9	1	0	EN_RECEPCION_NOTA	2022-01-12 14:31:00+00	1	\N	\N	1
\.


--
-- Name: pedido_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.pedido_id_seq', 58, true);


--
-- Data for Name: pedido_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.pedido_item (id, pedido_id, producto_id, precio_unitario, descuento_unitario, bonificacion, frio, observacion, estado, creado_en, usuario_id, nota_pedido_id, bonificacion_detalle, vencimiento, presentacion_id, cantidad) FROM stdin;
23	58	79	4750	0	\N	\N	\N	\N	2022-01-12 14:31:00+00	\N	\N	\N	\N	85	1200
24	58	221	4666.667	0	\N	\N	\N	\N	2022-01-12 14:31:00+00	\N	\N	\N	\N	188	240
25	58	201	14500	0	\N	\N	\N	\N	2022-01-12 14:31:00+00	\N	\N	\N	\N	98	48
35	58	220	9833.333	0	\N	\N	\N	\N	2022-01-12 14:31:00+00	\N	\N	\N	\N	185	540
22	58	28	2533.3334	0	\N	\N	\N	\N	\N	1	\N	\N	\N	205	900
\.


--
-- Name: pedido_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.pedido_item_id_seq', 36, true);


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
\.


--
-- Name: salida_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.salida_id_seq', 34, true);


--
-- Data for Name: salida_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.salida_item (id, producto_id, presentacion_id, cantidad, observacion, creado_en, usuario_id, salida_id) FROM stdin;
\.


--
-- Name: salida_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.salida_item_id_seq', 15, true);


--
-- Data for Name: venta; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.venta (id, cliente_id, creado_en, usuario_id, estado, total_gs, total_rs, total_ds, forma_pago_id, cobro_id, caja_id) FROM stdin;
130	\N	2022-01-03 17:08:52.209+00	1	CONCLUIDA	120000	114.285714285714	17.6470588235294	\N	131	37
131	\N	2022-01-03 17:16:00.225+00	1	CONCLUIDA	120000	114.285714285714	17.6470588235294	1	132	37
132	\N	2022-01-03 17:31:38.105+00	1	CONCLUIDA	120000	114.285714285714	17.6470588235294	\N	133	37
133	\N	2022-01-03 17:32:52.94+00	1	CONCLUIDA	120000	114.285714285714	17.6470588235294	1	134	37
134	\N	2022-01-03 17:52:23.582+00	1	CONCLUIDA	120000	114.285714285714	17.6470588235294	\N	135	37
135	\N	2022-01-03 19:09:36.781+00	1	CONCLUIDA	6000	5.71428571428571	0.882352941176471	1	136	37
136	\N	2022-01-03 19:09:55.572+00	1	CONCLUIDA	120000	114.285714285714	17.6470588235294	\N	137	37
137	\N	2022-01-09 17:12:31.92+00	1	CONCLUIDA	38000	36.1904761904762	5.58823529411765	\N	138	37
\.


--
-- Name: venta_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.venta_id_seq', 137, true);


--
-- Data for Name: venta_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.venta_item (id, venta_id, unidad_medida, precio_id, costo_unitario, existencia, producto_id, cantidad, creado_en, usuario_id, descuento_unitario, presentacion_id) FROM stdin;
181	130	\N	355	\N	\N	70	1	\N	\N	\N	81
182	131	\N	355	\N	\N	70	1	\N	\N	\N	81
183	132	\N	355	\N	\N	70	1	\N	\N	\N	81
184	133	\N	355	\N	\N	70	1	\N	\N	\N	81
185	134	\N	355	\N	\N	70	1	\N	\N	\N	81
186	135	\N	352	\N	\N	70	1	\N	\N	\N	78
187	136	\N	355	\N	\N	70	1	\N	\N	\N	81
188	137	\N	357	\N	\N	79	1	\N	\N	\N	84
\.


--
-- Name: venta_item_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.venta_item_id_seq', 188, true);


--
-- Data for Name: vuelto; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.vuelto (id, autorizado_por_id, responsable_id, creado_en, usuario_id, activo) FROM stdin;
\.


--
-- Name: vuelto_id_seq; Type: SEQUENCE SET; Schema: operaciones; Owner: franco
--

SELECT pg_catalog.setval('operaciones.vuelto_id_seq', 53, true);


--
-- Data for Name: vuelto_item; Type: TABLE DATA; Schema: operaciones; Owner: franco
--

COPY operaciones.vuelto_item (id, vuelto_id, valor, moneda_id, creado_en, usuario_id) FROM stdin;
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

COPY personas.funcionario (id, persona_id, cargo_id, credito, fecha_ingreso, sueldo, sector, supervisado_por_id, sucursal_id, fase_prueba, diarista, usuario_id, creado_en, activo) FROM stdin;
1	1	1	1000000	2019-02-11 00:00:00	2250000	\N	1	1	t	f	1	2021-02-17 15:20:29+00	t
3	7	\N	\N	\N	2500000	\N	\N	\N	t	f	6	2021-11-19 17:16:22.913+00	t
2	8	\N	2000000	\N	\N	\N	\N	\N	t	f	\N	2021-11-19 17:11:00+00	t
\.


--
-- Name: funcionario_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.funcionario_id_seq', 3, true);


--
-- Data for Name: persona; Type: TABLE DATA; Schema: personas; Owner: franco
--

COPY personas.persona (id, nombre, apodo, documento, nacimiento, sexo, direccion, ciudad_id, telefono, social_media, imagenes, creado_en, usuario_id, email) FROM stdin;
3	CAMPOS S.A.	\N	800345-4	\N	\N	\N	\N	\N	\N	\N	2021-03-10 03:18:03.86199+00	1	\N
4	ANTONIO NUNES	\N	423423	\N	\N	\N	\N	\N	\N	\N	2021-03-10 03:18:27.730262+00	1	\N
5	LA CAOBA	\N	80025323	\N	\N	\N	\N	\N	\N	\N	2021-04-08 23:42:32.711355+00	1	\N
1	GABRIEL FRANCISCO FRANCO AREVALOS	GABRIEL	4043581	1992-04-10 04:00:00+00	M	\N	1	0982187492	\N	\N	2021-02-05 03:33:37.702804+00	1	francogabrielpy@outlook.com
6	ARTHUR ANDRES ACUÑA FRANCO	ARTHUR	\N	\N	\N	\N	\N	\N	\N	\N	2021-09-02 15:27:38.693365+00	1	\N
7	IGOR VERA	IGOR	\N	\N	\N	\N	\N	\N	\N	\N	2021-09-02 15:27:57.389437+00	1	\N
8	GILBERTO FRANCO	\N	423432	\N	\N	\N	\N	0987432473	\N	\N	2021-11-18 01:14:49.391+00	2	\N
9	RODOLFO ALEJANDRO FRANCO AREVALOS	oku	2314234	\N	\N	\N	\N	0981130269	\N	\N	2021-11-18 15:35:22.64+00	2	\N
2	CAMILA GREGORIO VUJANSKI	cami	2343	\N	\N	\N	\N	\N	\N	\N	\N	1	\N
\.


--
-- Name: persona_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.persona_id_seq', 9, true);


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
3	6	123	1	2021-09-02 15:28:54.942723+00	arthur	\N	t
4	7	123	1	2021-09-02 15:29:07.905601+00	igor	\N	t
6	9	OKU123	2	2021-11-18 15:35:31.341+00	OKU	\N	t
2	2	123	1	2021-02-12 19:32:06.788069+00	CAMI	\N	t
5	8	123	2	2021-11-18 15:03:28.979+00	GILBER	\N	t
1	1	GI123	1	2021-10-04 14:20:00+00	GABRIEL	\N	t
\.


--
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: personas; Owner: franco
--

SELECT pg_catalog.setval('personas.usuario_id_seq', 6, true);


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
392	702345702938759345	t	1	2021-12-28 18:47:22.602241+00	t	31
393	543523464563456	\N	1	2021-12-28 18:47:22.602241+00	t	32
394	3423453244534	t	1	2021-12-28 18:47:22.602241+00	t	32
428	8712000030582	t	4	2021-12-28 18:47:22.602241+00	t	72
429	8712000030810	t	4	2021-12-28 18:47:22.602241+00	t	73
430	8712000030599	t	4	2021-12-28 18:47:22.602241+00	t	78
432	8712000033545	t	4	2021-12-28 18:47:22.602241+00	t	79
433	8712000033583	t	4	2021-12-28 18:47:22.602241+00	t	81
434	072890000224	t	4	2021-12-28 18:47:22.602241+00	t	83
435	8712000030605	t	4	2021-12-28 18:47:22.602241+00	t	84
436	8712000030728	t	4	2021-12-28 18:47:22.602241+00	t	85
437	7804300120276	t	3	2021-12-28 18:47:22.602241+00	t	68
438	7804300003227	\N	3	2021-12-28 18:47:22.602241+00	t	68
441	7896045506040	t	4	2021-12-28 18:47:22.602241+00	t	86
442	7896045506057	t	4	2021-12-28 18:47:22.602241+00	t	87
443	7804300149314	t	3	2021-12-28 18:47:22.602241+00	t	88
444	7804300149307	t	3	2021-12-28 18:47:22.602241+00	t	91
445	7804300149994	t	3	2021-12-28 18:47:22.602241+00	t	93
446	7804300003234	t	3	2021-12-28 18:47:22.602241+00	t	94
447	7804300123512	t	3	2021-12-28 18:47:22.602241+00	t	95
448	7804300121846	t	3	2021-12-28 18:47:22.602241+00	t	98
449	7891149104932	t	4	2021-12-28 18:47:22.602241+00	t	99
490	03402119	t	4	2021-12-28 18:47:22.602241+00	t	162
450	7891149104949	\N	4	2021-12-28 18:47:22.602241+00	t	100
451	7840050002561	t	4	2021-12-28 18:47:22.602241+00	t	101
453	6543634563463546	t	2	2021-12-28 18:47:22.602241+00	t	33
454	7840050003735	t	4	2021-12-28 18:47:22.602241+00	t	103
457	78400030	t	4	2021-12-28 18:47:22.602241+00	t	105
458	78410848	t	4	2021-12-28 18:47:22.602241+00	t	107
459	7840050002493	t	4	2021-12-28 18:47:22.602241+00	t	109
460	7891149000142	t	4	2021-12-28 18:47:22.602241+00	t	111
461	7891991295314	t	4	2021-12-28 18:47:22.602241+00	t	113
462	87120103	t	4	2021-12-28 18:47:22.602241+00	t	121
463	8712000033538	t	4	2021-12-28 18:47:22.602241+00	t	122
465	8712000025649	t	4	2021-12-28 18:47:22.602241+00	t	125
466	7840050007399	t	4	2021-12-28 18:47:22.602241+00	t	82
467	7840050002783	t	4	2021-12-28 18:47:22.602241+00	t	70
468	7804300120559	t	3	2021-12-28 18:47:22.602241+00	t	128
469	7804300120252	t	3	2021-12-28 18:47:22.602241+00	t	129
471	7804300010263	t	3	2021-12-28 18:47:22.602241+00	t	132
472	7804300011512	\N	3	2021-12-28 18:47:22.602241+00	t	132
470	78409613	t	4	2021-12-28 18:47:22.602241+00	t	130
473	7840050007511	t	4	2021-12-28 18:47:22.602241+00	t	133
474	7840050006385	t	4	2021-12-28 18:47:22.602241+00	t	135
475	7840025110857	t	4	2021-12-28 18:47:22.602241+00	t	137
476	7840025110871	t	4	2021-12-28 18:47:22.602241+00	t	138
477	7898295301437	t	4	2021-12-28 18:47:22.602241+00	t	139
478	03456916	t	4	2021-12-28 18:47:22.602241+00	t	141
479	034100005696	\N	4	2021-12-28 18:47:22.602241+00	t	142
480	7804300120566	t	3	2021-12-28 18:47:22.602241+00	t	143
481	7804300120467	t	3	2021-12-28 18:47:22.602241+00	t	146
482	03456217	t	4	2021-12-28 18:47:22.602241+00	t	145
483	034100175054	t	4	2021-12-28 18:47:22.602241+00	t	148
484	034100001568	t	4	2021-12-28 18:47:22.602241+00	t	150
485	034100005528	t	4	2021-12-28 18:47:22.602241+00	t	153
486	7804300127312	t	3	2021-12-28 18:47:22.602241+00	t	156
487	7804300127305	\N	3	2021-12-28 18:47:22.602241+00	t	156
488	034100005542	t	4	2021-12-28 18:47:22.602241+00	t	157
489	03402313	t	4	2021-12-28 18:47:22.602241+00	t	159
491	7986045504879	t	4	2021-12-28 18:47:22.602241+00	t	177
492	7986045505098	t	4	2021-12-28 18:47:22.602241+00	t	178
493	7896045506255	t	4	2021-12-28 18:47:22.602241+00	t	179
495	7840050002769	t	4	2021-12-28 18:47:22.602241+00	t	183
496	8712000056445	t	4	2021-12-28 18:47:22.602241+00	t	184
497	8712000055264	t	4	2021-12-28 18:47:22.602241+00	t	186
498	8712000055400	t	4	2021-12-28 18:47:22.602241+00	t	189
499	7896045504831	t	4	2021-12-28 18:47:22.602241+00	t	192
500	7896045504848	t	4	2021-12-28 18:47:22.602241+00	t	193
501	7792798006045	t	4	2021-12-28 18:47:22.602241+00	t	194
502	5410228143376	t	4	2021-12-28 18:47:22.602241+00	t	197
503	5410228240945	t	4	2021-12-28 18:47:22.602241+00	t	199
504	7840050006644	t	4	2021-12-28 18:47:22.602241+00	t	202
505	7891149103102	t	4	2021-12-28 18:47:22.602241+00	t	204
506	7891149103119	t	4	2021-12-28 18:47:22.602241+00	t	205
507	7891149107704	t	4	2021-12-28 18:47:22.602241+00	t	206
508	7891149108923	t	4	2021-12-28 18:47:22.602241+00	t	209
509	7891149104468	t	4	2021-12-28 18:47:22.602241+00	t	213
510	78906709	t	4	2021-12-28 18:47:22.602241+00	t	215
511	7897395040246	t	4	2021-12-28 18:47:22.602241+00	t	217
512	7897395040307	t	4	2021-12-28 18:47:22.602241+00	t	220
513	7898295300935	t	4	2021-12-28 18:47:22.602241+00	t	222
514	7898295301475	t	4	2021-12-28 18:47:22.602241+00	t	223
515	7898295300867	t	4	2021-12-28 18:47:22.602241+00	t	224
516	7898295301338	t	4	2021-12-28 18:47:22.602241+00	t	225
517	7898295300843	t	4	2021-12-28 18:47:22.602241+00	t	226
518	7898295300409	t	4	2021-12-28 18:47:22.602241+00	t	228
519	7898295300119	t	4	2021-12-28 18:47:22.602241+00	t	230
520	7840050002523	t	4	2021-12-28 18:47:22.602241+00	t	232
521	7840050002530	t	4	2021-12-28 18:47:22.602241+00	t	233
522	7840050006200	t	4	2021-12-28 18:47:22.602241+00	t	235
523	7840050003700	t	4	2021-12-28 18:47:22.602241+00	t	238
524	7840050003087	t	4	2021-12-28 18:47:22.602241+00	t	240
525	7891991014786	t	4	2021-12-28 18:47:22.602241+00	t	242
526	7840050003803	t	4	2021-12-28 18:47:22.602241+00	t	244
527	7840050003827	t	4	2021-12-28 18:47:22.602241+00	t	245
528	78404533	t	4	2021-12-28 18:47:22.602241+00	t	246
529	7840050002639	t	4	2021-12-28 18:47:22.602241+00	t	248
530	78409736	t	4	2021-12-28 18:47:22.602241+00	t	250
531	7898367983790	t	4	2021-12-28 18:47:22.602241+00	t	252
532	7898367984018	t	4	2021-12-28 18:47:22.602241+00	t	253
533	7898367890010	t	4	2021-12-28 18:47:22.602241+00	t	254
534	7898367980058	t	4	2021-12-28 18:47:22.602241+00	t	255
535	7898637983615	t	4	2021-12-28 18:47:22.602241+00	t	257
536	789836798070	t	4	2021-12-28 18:47:22.602241+00	t	259
537	78983667984056	t	4	2021-12-28 18:47:22.602241+00	t	261
538	7840025110864	t	4	2021-12-28 18:47:22.602241+00	t	263
539	7840025110994	t	4	2021-12-28 18:47:22.602241+00	t	265
540	7840025110710	t	4	2021-12-28 18:47:22.602241+00	t	267
541	7840025110734	t	4	2021-12-28 18:47:22.602241+00	t	268
542	7840025110796	t	4	2021-12-28 18:47:22.602241+00	t	269
543	8412598002304	t	4	2021-12-28 18:47:22.602241+00	t	341
544	8412598005893	t	4	2021-12-28 18:47:22.602241+00	t	342
545	8412598005398	t	4	2021-12-28 18:47:22.602241+00	t	343
546	8412598001659	t	4	2021-12-28 18:47:22.602241+00	t	345
547	7898953990140	t	4	2021-12-28 18:47:22.602241+00	t	347
548	8412598074219	t	4	2021-12-28 18:47:22.602241+00	t	349
549	7897736409800	t	4	2021-12-28 18:47:22.602241+00	t	351
550	7897736409817	t	4	2021-12-28 18:47:22.602241+00	t	354
551	7897736409824	t	4	2021-12-28 18:47:22.602241+00	t	357
552	7897736409831	t	4	2021-12-28 18:47:22.602241+00	t	363
553	7897736409848	t	4	2021-12-28 18:47:22.602241+00	t	364
554	7983218000107	t	4	2021-12-28 18:47:22.602241+00	t	367
555	7983218000251	t	4	2021-12-28 18:47:22.602241+00	t	368
556	7983218003603	\N	4	2021-12-28 18:47:22.602241+00	t	367
557	9002490100070	\N	4	2021-12-28 18:47:22.602241+00	t	370
558	611269991000	\N	4	2021-12-28 18:47:22.602241+00	t	370
559	9002490214166	t	4	2021-12-28 18:47:22.602241+00	t	372
560	9002490240875	t	4	2021-12-28 18:47:22.602241+00	t	374
561	9002490241179	t	4	2021-12-28 18:47:22.602241+00	t	375
562	9002490229160	t	4	2021-12-28 18:47:22.602241+00	t	377
563	9002490248949	\N	4	2021-12-28 18:47:22.602241+00	t	377
564	9002490235192	t	4	2021-12-28 18:47:22.602241+00	t	380
565	9002490235208	t	4	2021-12-28 18:47:22.602241+00	t	381
566	9002490247379	t	4	2021-12-28 18:47:22.602241+00	t	383
567	7898295300652	t	4	2021-12-28 18:47:22.602241+00	t	386
568	7840027010001	t	4	2021-12-28 18:47:22.602241+00	t	388
569	7840027040008	\N	4	2021-12-28 18:47:22.602241+00	t	390
570	7840027100009	t	4	2021-12-28 18:47:22.602241+00	t	390
571	7790240072150	t	4	2021-12-28 18:47:22.602241+00	t	392
572	7896209603202	t	4	2021-12-28 18:47:22.602241+00	t	393
573	7792716000261	t	4	2021-12-28 18:47:22.602241+00	t	394
574	7792716000230	t	4	2021-12-28 18:47:22.602241+00	t	396
576	7798141877379	t	4	2021-12-28 18:47:22.602241+00	t	400
575	7790717152019	t	4	2021-12-28 18:47:22.602241+00	t	398
577	779717152002	t	4	2021-12-28 18:47:22.602241+00	t	399
578	7809579801222	t	4	2021-12-28 18:47:22.602241+00	t	401
579	7809579801215	t	4	2021-12-28 18:47:22.602241+00	t	402
580	7791843008294	t	4	2021-12-28 18:47:22.602241+00	t	403
581	7840779002972	t	4	2021-12-28 18:47:22.602241+00	t	405
582	7840779002996	t	4	2021-12-28 18:47:22.602241+00	t	407
583	7790314004995	t	4	2021-12-28 18:47:22.602241+00	t	409
584	7891962032306	t	4	2021-12-28 18:47:22.602241+00	t	410
585	7891962032283	t	4	2021-12-28 18:47:22.602241+00	t	411
587	7891962037004	\N	4	2021-12-28 18:47:22.602241+00	t	411
588	7891000325131	t	4	2021-12-28 18:47:22.602241+00	t	412
589	7840118216367	t	4	2021-12-28 18:47:22.602241+00	t	413
590	7896451900029	t	4	2021-12-28 18:47:22.602241+00	t	414
591	779226694	t	4	2021-12-28 18:47:22.602241+00	t	420
592	7892840818913	t	4	2021-12-28 18:47:22.602241+00	t	422
593	7892840817497	t	4	2021-12-28 18:47:22.602241+00	t	423
594	789840817473	t	4	2021-12-28 18:47:22.602241+00	t	424
595	7892840817503	t	4	2021-12-28 18:47:22.602241+00	t	425
596	7892840817763	t	4	2021-12-28 18:47:22.602241+00	t	426
597	7892840255442	t	4	2021-12-28 18:47:22.602241+00	t	427
598	7892840817480	t	4	2021-12-28 18:47:22.602241+00	t	428
599	7840127002005	t	4	2021-12-28 18:47:22.602241+00	t	429
600	7840127001121	t	4	2021-12-28 18:47:22.602241+00	t	430
601	7840127000124	t	4	2021-12-28 18:47:22.602241+00	t	431
602	784012700230	t	4	2021-12-28 18:47:22.602241+00	t	432
603	784012700000391	t	4	2021-12-28 18:47:22.602241+00	t	433
604	7840127000216	t	4	2021-12-28 18:47:22.602241+00	t	434
605	7840127001992	t	4	2021-12-28 18:47:22.602241+00	t	435
606	7790580169312	t	4	2021-12-28 18:47:22.602241+00	t	436
607	7790580169305	t	4	2021-12-28 18:47:22.602241+00	t	437
608	7790580230111	t	4	2021-12-28 18:47:22.602241+00	t	438
609	7790580230104	t	4	2021-12-28 18:47:22.602241+00	t	439
610	7794000003590	t	4	2021-12-28 18:47:22.602241+00	t	440
611	022000159540	t	4	2021-12-28 18:47:22.602241+00	t	441
612	02289902	t	4	2021-12-28 18:47:22.602241+00	t	443
613	7897115103091	t	4	2021-12-28 18:47:22.602241+00	t	445
614	7840188000101	t	4	2021-12-28 18:47:22.602241+00	t	446
615	7840188000088	t	4	2021-12-28 18:47:22.602241+00	t	448
616	7790580697303	t	4	2021-12-28 18:47:22.602241+00	t	450
617	7790040374607	t	4	2021-12-28 18:47:22.602241+00	t	451
618	7897115103107	t	4	2021-12-28 18:47:22.602241+00	t	452
619	7897115107488	t	4	2021-12-28 18:47:22.602241+00	t	453
620	7897115103084	t	4	2021-12-28 18:47:22.602241+00	t	454
621	7840118217067	t	4	2021-12-28 18:47:22.602241+00	t	455
622	7896098900208	t	4	2021-12-28 18:47:22.602241+00	t	456
623	7896098900215	t	4	2021-12-28 18:47:22.602241+00	t	457
624	7840255000096	t	4	2021-12-28 18:47:22.602241+00	t	458
625	7501009222729	t	4	2021-12-28 18:47:22.602241+00	t	459
626	7794000960435	t	4	2021-12-28 18:47:22.602241+00	t	462
627	7891962032290	t	4	2021-12-28 18:47:22.602241+00	t	463
628	7891962036984	\N	4	2021-12-28 18:47:22.602241+00	t	463
629	7840779001050	t	4	2021-12-28 18:47:22.602241+00	t	464
630	7840779002057	t	4	2021-12-28 18:47:22.602241+00	t	466
631	7840028202146	t	4	2021-12-28 18:47:22.602241+00	t	468
632	7840981000049	t	4	2021-12-28 18:47:22.602241+00	t	470
633	7896547501406	t	4	2021-12-28 18:47:22.602241+00	t	472
634	7896547501154	t	4	2021-12-28 18:47:22.602241+00	t	473
635	7896547501277	t	4	2021-12-28 18:47:22.602241+00	t	474
636	7840138000281	t	4	2021-12-28 18:47:22.602241+00	t	475
637	7896186300163	t	3	2021-12-28 18:47:22.602241+00	t	476
638	7840138000199	t	4	2021-12-28 18:47:22.602241+00	t	478
639	7840138001059	t	4	2021-12-28 18:47:22.602241+00	t	479
640	7896186302884	t	3	2021-12-28 18:47:22.602241+00	t	480
641	7896741692986	t	3	2021-12-28 18:47:22.602241+00	t	482
642	7840138000144	t	4	2021-12-28 18:47:22.602241+00	t	484
643	7897274100160	t	3	2021-12-28 18:47:22.602241+00	t	485
644	7842283000024	t	4	2021-12-28 18:47:22.602241+00	t	486
645	7897274100085	t	3	2021-12-28 18:47:22.602241+00	t	488
646	7896514700801	t	3	2021-12-28 18:47:22.602241+00	t	490
647	7896514700436	t	3	2021-12-28 18:47:22.602241+00	t	492
648	7840009650072	t	3	2021-12-28 18:47:22.602241+00	t	494
649	7840009650652	t	3	2021-12-28 18:47:22.602241+00	t	495
654	7840138000038	t	4	2021-12-28 18:47:22.602241+00	t	496
655	7840009650096	t	3	2021-12-28 18:47:22.602241+00	t	497
656	7840013000023	t	3	2021-12-28 18:47:22.602241+00	t	498
657	7840127001848	t	3	2021-12-28 18:47:22.602241+00	t	499
658	7840037000580	t	3	2021-12-28 18:47:22.602241+00	t	500
659	7840037000757	t	3	2021-12-28 18:47:22.602241+00	t	501
660	7891155032458	t	4	2021-12-28 18:47:22.602241+00	t	502
661	7891155003229	t	4	2021-12-28 18:47:22.602241+00	t	503
662	7840127000766	t	3	2021-12-28 18:47:22.602241+00	t	504
663	7840127000773	t	3	2021-12-28 18:47:22.602241+00	t	505
664	7840009650089	t	3	2021-12-28 18:47:22.602241+00	t	506
665	7896741702111	t	3	2021-12-28 18:47:22.602241+00	t	507
666	7840127001138	t	3	2021-12-28 18:47:22.602241+00	t	509
667	7891155013150	t	4	2021-12-28 18:47:22.602241+00	t	510
668	7891155003731	t	4	2021-12-28 18:47:22.602241+00	t	511
669	7891155043829	t	4	2021-12-28 18:47:22.602241+00	t	512
670	7891155050087	t	4	2021-12-28 18:47:22.602241+00	t	513
671	7891155056584	t	4	2021-12-28 18:47:22.602241+00	t	514
672	7891155017264	t	4	2021-12-28 18:47:22.602241+00	t	516
673	8411134000989	t	3	2021-12-28 18:47:22.602241+00	t	515
674	8411134000965	t	3	2021-12-28 18:47:22.602241+00	t	517
675	8411134000996	t	3	2021-12-28 18:47:22.602241+00	t	518
676	7840595008660	t	4	2021-12-28 18:47:22.602241+00	t	519
677	7891155008200	t	3	2021-12-28 18:47:22.602241+00	t	520
678	7898326370067	t	4	2021-12-28 18:47:22.602241+00	t	521
679	7840013000337	t	3	2021-12-28 18:47:22.602241+00	t	522
680	7840037014624	t	3	2021-12-28 18:47:22.602241+00	t	523
681	7840037014198	t	3	2021-12-28 18:47:22.602241+00	t	524
682	7840595013039	t	4	2021-12-28 18:47:22.602241+00	t	526
683	7840009650904	t	3	2021-12-28 18:47:22.602241+00	t	525
684	7840009650355	t	3	2021-12-28 18:47:22.602241+00	t	527
685	7840037000986	t	3	2021-12-28 18:47:22.602241+00	t	528
686	7898326370081	t	4	2021-12-28 18:47:22.602241+00	t	529
687	7840009650942	t	3	2021-12-28 18:47:22.602241+00	t	530
688	7840595000428	t	4	2021-12-28 18:47:22.602241+00	t	531
689	7840037014099	t	3	2021-12-28 18:47:22.602241+00	t	532
690	7840037000740	t	3	2021-12-28 18:47:22.602241+00	t	533
691	7840595000374	t	4	2021-12-28 18:47:22.602241+00	t	535
692	7840595006284	t	4	2021-12-28 18:47:22.602241+00	t	536
693	7840595015514	t	4	2021-12-28 18:47:22.602241+00	t	537
694	27894	t	3	2021-12-28 18:47:22.602241+00	t	538
695	080432402856	t	3	2021-12-28 18:47:22.602241+00	t	539
696	7898172660909	t	3	2021-12-28 18:47:22.602241+00	t	540
697	7840595008677	t	4	2021-12-28 18:47:22.602241+00	t	541
698	7840595015507	t	4	2021-12-28 18:47:22.602241+00	t	542
699	7840595015521	t	4	2021-12-28 18:47:22.602241+00	t	543
700	7898326370074	t	4	2021-12-28 18:47:22.602241+00	t	544
701	5010327903101	t	3	2021-12-28 18:47:22.602241+00	t	545
702	7896244138851	t	4	2021-12-28 18:47:22.602241+00	t	546
703	7896931611346	t	3	2021-12-28 18:47:22.602241+00	t	547
704	5000267015200	t	3	2021-12-28 18:47:22.602241+00	t	548
705	1110	t	4	2021-12-28 18:47:22.602241+00	t	549
706	5000267025209	t	3	2021-12-28 18:47:22.602241+00	t	550
707	5010327208107	t	3	2021-12-28 18:47:22.602241+00	t	551
708	5000267024608	t	3	2021-12-28 18:47:22.602241+00	t	552
709	5000291020706	t	3	2021-12-28 18:47:22.602241+00	t	553
710	7840028200258	t	3	2021-12-28 18:47:22.602241+00	t	554
711	7052201912074	t	4	2021-12-28 18:47:22.602241+00	t	555
712	7893218000473	t	3	2021-12-28 18:47:22.602241+00	t	556
713	5010327926513	t	3	2021-12-28 18:47:22.602241+00	t	557
714	44	t	4	2021-12-28 18:47:22.602241+00	t	558
715	7802110001143	t	3	2021-12-28 18:47:22.602241+00	t	559
716	5013967003996	t	3	2021-12-28 18:47:22.602241+00	t	560
717	7501035010109	t	3	2021-12-28 18:47:22.602241+00	t	561
718	4750021000164	t	3	2021-12-28 18:47:22.602241+00	t	562
719	7640175740047	t	3	2021-12-28 18:47:22.602241+00	t	563
720	6001495062508	t	3	2021-12-28 18:47:22.602241+00	t	564
721	7840027006158	t	3	2021-12-28 18:47:22.602241+00	t	565
722	7809623800478	t	3	2021-12-28 18:47:22.602241+00	t	566
723	3500610034442	t	4	2021-12-28 18:47:22.602241+00	t	567
724	7809623800485	t	3	2021-12-28 18:47:22.602241+00	t	568
725	7809623800591	t	3	2021-12-28 18:47:22.602241+00	t	569
726	7896780902466	t	4	2021-12-28 18:47:22.602241+00	t	570
727	7840138000960	t	3	2021-12-28 18:47:22.602241+00	t	571
728	7790290001193	t	4	2021-12-28 18:47:22.602241+00	t	572
729	7840118219535	t	3	2021-12-28 18:47:22.602241+00	t	573
730	5601142192636	t	4	2021-12-28 18:47:22.602241+00	t	574
731	3280110270006	t	4	2021-12-28 18:47:22.602241+00	t	575
732	7891031116920	t	3	2021-12-28 18:47:22.602241+00	t	576
733	7891031116951	t	3	2021-12-28 18:47:22.602241+00	t	577
734	7891031116944	t	3	2021-12-28 18:47:22.602241+00	t	578
735	7896931611537	t	4	2021-12-28 18:47:22.602241+00	t	579
736	7791203001231	t	4	2021-12-28 18:47:22.602241+00	t	580
737	7804350596335	t	4	2021-12-28 18:47:22.602241+00	t	581
738	7891031116906	t	3	2021-12-28 18:47:22.602241+00	t	582
739	7804350000337	t	4	2021-12-28 18:47:22.602241+00	t	583
740	7804350600353	t	4	2021-12-28 18:47:22.602241+00	t	584
741	7798081660437	t	4	2021-12-28 18:47:22.602241+00	t	585
742	78407466	t	4	2021-12-28 18:47:22.602241+00	t	586
743	7840595005331	t	3	2021-12-28 18:47:22.602241+00	t	588
744	7840595000510	t	3	2021-12-28 18:47:22.602241+00	t	589
745	7840595008554	t	3	2021-12-28 18:47:22.602241+00	t	590
746	7840595002415	t	3	2021-12-28 18:47:22.602241+00	t	591
747	78408562	t	4	2021-12-28 18:47:22.602241+00	t	592
748	78401266	t	4	2021-12-28 18:47:22.602241+00	t	594
749	6253345302283	t	4	2021-12-28 18:47:22.602241+00	t	596
750	7840595001562	t	3	2021-12-28 18:47:22.602241+00	t	598
751	7840595000565	t	3	2021-12-28 18:47:22.602241+00	t	599
752	6253345302276	t	4	2021-12-28 18:47:22.602241+00	t	600
753	7840595001111	t	3	2021-12-28 18:47:22.602241+00	t	602
754	7840624000023	t	4	2021-12-28 18:47:22.602241+00	t	604
755	7840595007571	t	3	2021-12-28 18:47:22.602241+00	t	603
756	7840595002859	t	3	2021-12-28 18:47:22.602241+00	t	606
757	7841414000025	t	3	2021-12-28 18:47:22.602241+00	t	608
758	78412231	t	4	2021-12-28 18:47:22.602241+00	t	607
761	7791560001158	t	3	2021-12-28 18:47:22.602241+00	t	613
762	78412248	t	4	2021-12-28 18:47:22.602241+00	t	614
763	7896037918592	t	3	2021-12-28 18:47:22.602241+00	t	616
759	7841414000032	t	3	2021-12-28 18:47:22.602241+00	t	610
760	7840595001012	t	3	2021-12-28 18:47:22.602241+00	t	612
764	78410190	t	4	2021-12-28 18:47:22.602241+00	t	617
769	78412033	t	4	2021-12-28 18:47:22.602241+00	t	619
770	5060116320589	t	3	2021-12-28 18:47:22.602241+00	t	621
771	7896037916338	t	3	2021-12-28 18:47:22.602241+00	t	622
772	78419339	t	4	2021-12-28 18:47:22.602241+00	t	623
773	7840255000089	t	3	2021-12-28 18:47:22.602241+00	t	625
774	78420991	t	4	2021-12-28 18:47:22.602241+00	t	626
775	7896279600538	t	3	2021-12-28 18:47:22.602241+00	t	628
776	78403178	t	4	2021-12-28 18:47:22.602241+00	t	629
777	78421783	t	4	2021-12-28 18:47:22.602241+00	t	631
778	7842283000017	t	4	2021-12-28 18:47:22.602241+00	t	634
779	7840029000383	t	4	2021-12-28 18:47:22.602241+00	t	636
780	7898186823512	t	3	2021-12-28 18:47:22.602241+00	t	633
781	7792070000938	t	3	2021-12-28 18:47:22.602241+00	t	637
782	7790314005305	t	4	2021-12-28 18:47:22.602241+00	t	638
783	7802110001051	t	3	2021-12-28 18:47:22.602241+00	t	639
784	082184000328	t	3	2021-12-28 18:47:22.602241+00	t	640
785	088076177406	t	3	2021-12-28 18:47:22.602241+00	t	641
786	7842283000031	t	4	2021-12-28 18:47:22.602241+00	t	642
787	088076175051	t	3	2021-12-28 18:47:22.602241+00	t	645
788	088076161863	t	3	2021-12-28 18:47:22.602241+00	t	646
790	7896037913849	t	4	2021-12-28 18:47:22.602241+00	t	648
792	7896037913603	t	4	2021-12-28 18:47:22.602241+00	t	649
793	7840027160003	t	4	2021-12-28 18:47:22.602241+00	t	650
794	7840050006491	t	4	2021-12-28 18:47:22.602241+00	t	652
795	5000267024400	t	3	2021-12-28 18:47:22.602241+00	t	654
796	5000267014401	t	3	2021-12-28 18:47:22.602241+00	t	655
797	5000267014609	t	3	2021-12-28 18:47:22.602241+00	t	656
798	4823021801304	t	3	2021-12-28 18:47:22.602241+00	t	659
799	7898295300300	t	4	2021-12-28 18:47:22.602241+00	t	657
800	7897736407066	t	3	2021-12-28 18:47:22.602241+00	t	660
801	7897736407059	t	3	2021-12-28 18:47:22.602241+00	t	661
802	7897736407325	t	3	2021-12-28 18:47:22.602241+00	t	662
803	7896072911114	t	3	2021-12-28 18:47:22.602241+00	t	663
804	7840028205024	t	3	2021-12-28 18:47:22.602241+00	t	664
805	7840028205031	t	3	2021-12-28 18:47:22.602241+00	t	665
806	7894900010015	t	4	2021-12-28 18:47:22.602241+00	t	666
807	7840029867818	t	3	2021-12-28 18:47:22.602241+00	t	668
808	7894900060010	t	4	2021-12-28 18:47:22.602241+00	t	669
809	7896072901313	t	3	2021-12-28 18:47:22.602241+00	t	671
810	7891991012867	t	4	2021-12-28 18:47:22.602241+00	t	672
811	5000265090056	t	3	2021-12-28 18:47:22.602241+00	t	673
812	7894900050011	t	4	2021-12-28 18:47:22.602241+00	t	675
813	5010106111956	t	3	2021-12-28 18:47:22.602241+00	t	677
814	794900030013	t	4	2021-12-28 18:47:22.602241+00	t	678
815	7790480001613	t	3	2021-12-28 18:47:22.602241+00	t	680
816	7840138000137	t	3	2021-12-28 18:47:22.602241+00	t	681
817	7840027340009	t	3	2021-12-28 18:47:22.602241+00	t	683
818	7840002010019	t	3	2021-12-28 18:47:22.602241+00	t	685
819	7840002030284	t	3	2021-12-28 18:47:22.602241+00	t	686
820	7897736407004	t	3	2021-12-28 18:47:22.602241+00	t	687
821	7897736406014	t	3	2021-12-28 18:47:22.602241+00	t	688
822	8437004142351	t	3	2021-12-28 18:47:22.602241+00	t	689
823	7896023080487	t	3	2021-12-28 18:47:22.602241+00	t	690
824	5010327000091	t	3	2021-12-28 18:47:22.602241+00	t	691
825	5010327207117	t	3	2021-12-28 18:47:22.602241+00	t	692
826	7898080663771	t	3	2021-12-28 18:47:22.602241+00	t	693
827	7898080662330	t	3	2021-12-28 18:47:22.602241+00	t	695
828	7896050200742	t	3	2021-12-28 18:47:22.602241+00	t	697
829	5000267134338	t	3	2021-12-28 18:47:22.602241+00	t	699
830	5000267107776	t	3	2021-12-28 18:47:22.602241+00	t	700
831	5000267023625	t	3	2021-12-28 18:47:22.602241+00	t	701
832	5000267013602	t	3	2021-12-28 18:47:22.602241+00	t	702
833	5000267098418	t	3	2021-12-28 18:47:22.602241+00	t	703
834	080432400432	t	3	2021-12-28 18:47:22.602241+00	t	704
835	50196364	t	3	2021-12-28 18:47:22.602241+00	t	705
836	5000196001695	t	3	2021-12-28 18:47:22.602241+00	t	706
837	7896023013157	t	3	2021-12-28 18:47:22.602241+00	t	707
\.


--
-- Name: codigo_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.codigo_id_seq', 567, true);


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
-- Data for Name: costo_por_producto; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.costo_por_producto (id, producto_id, sucursal_id, ultimo_precio_compra, ultimo_precio_venta, costo_medio, usuario_id, creado_en, existencia, movimiento_stock_id, moneda_id, cotizacion) FROM stdin;
7	79	\N	2666	4000	2666	1	2022-01-10 18:32:00.130881+00	\N	\N	1	1
\.


--
-- Name: costos_por_sucursal_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.costos_por_sucursal_id_seq', 7, true);


--
-- Data for Name: familia; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.familia (id, descripcion, activo, usuario_id, creado_en, icono, nombre, posicion) FROM stdin;
1	Cervezas, gaseosas, lacteos, jugos, aguas, energizantes, vinos, espumantes, whiskys, vodkas, cachaÃ§as, licores.	t	1	2021-03-10 00:48:20+00	liquor	BEBIDAS	1
6	PRODUCTOS QUE SON ELABORADOS A PARTIR DE INSUMOS U OTROS PRODUCTOS. EJEMPLO: UNA PIZZA.	t	\N	2021-12-28 18:23:17.103016+00	add_circle_outline	ELABORADOS	6
7	CIGARRILLOS TRADICIONALES, ELECTRICOS, NARGUILE, ESCENCIAS, CARBON PARA NARGUILE.	t	\N	2021-12-28 18:23:17.103016+00	album	CIGARRILLOS	5
2	PRODUCTOS DE LIMPIEZA, MEDICAMENTOS, ROPAS Y ACCESORIOS, ELECTRONICOS, FERRETERIA, CASA Y CAMPING.\n	t	\N	2021-12-28 18:23:17.103016+00	liquor	GENERAL	2
5	ALGUNA DESCRIPCION LO QUE SEA COMESTIBLE TIPO PAN JAMON QUESO CARNICOS ERE EREA	t	\N	2021-12-28 18:23:17.103016+00	block	COMESTIBLES	3
10	YERBAS - TÉ - ESPECIAS - CONDIMENTOS - REMEDIOS P/ MATE	t	4	2021-12-28 18:23:17.103016+00	block	COSUMIBLES	7
\.


--
-- Name: familia_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.familia_id_seq', 10, true);


--
-- Name: imagenes_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.imagenes_id_seq', 2, true);


--
-- Data for Name: pdv_categoria; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.pdv_categoria (id, descripcion, activo, usuario_id, creado_en) FROM stdin;
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
\.


--
-- Name: pdv_grupos_productos_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.pdv_grupos_productos_id_seq', 5, true);


--
-- Data for Name: precio_por_sucursal; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.precio_por_sucursal (id, sucursal_id, precio, usuario_id, creado_en, presentacion_id, tipo_precio_id, principal, activo) FROM stdin;
420	1	43000	4	2021-12-28 18:46:38.398145+00	136	2	t	t
421	1	40000	4	2021-12-28 18:46:38.398145+00	136	3	t	t
422	1	2000	4	2021-12-28 18:46:38.398145+00	137	1	t	t
313	1	5000	1	2021-12-28 18:46:38.398145+00	31	1	t	t
314	1	50000	1	2021-12-28 18:46:38.398145+00	32	2	t	t
315	1	4500	1	2021-12-28 18:46:38.398145+00	31	4	f	t
316	1	5000	1	2021-12-28 18:46:38.398145+00	34	1	t	t
350	1	13000	4	2021-12-28 18:46:38.398145+00	72	1	t	t
351	1	145000	4	2021-12-28 18:46:38.398145+00	73	2	t	t
352	1	6000	4	2021-12-28 18:46:38.398145+00	78	1	t	t
353	1	30000	4	2021-12-28 18:46:38.398145+00	78	2	t	t
354	1	30000	4	2021-12-28 18:46:38.398145+00	79	2	t	t
355	1	120000	4	2021-12-28 18:46:38.398145+00	81	2	t	t
356	1	7000	4	2021-12-28 18:46:38.398145+00	83	1	t	t
357	1	38000	4	2021-12-28 18:46:38.398145+00	84	2	t	t
358	1	36000	4	2021-12-28 18:46:38.398145+00	84	3	t	t
359	1	152000	4	2021-12-28 18:46:38.398145+00	85	2	t	t
360	1	144000	4	2021-12-28 18:46:38.398145+00	85	3	t	t
366	1	23000	3	2021-12-28 18:46:38.398145+00	68	1	t	t
367	1	7000	4	2021-12-28 18:46:38.398145+00	86	1	t	t
368	1	40000	4	2021-12-28 18:46:38.398145+00	87	2	t	t
369	1	160000	4	2021-12-28 18:46:38.398145+00	90	2	t	t
370	1	45000	3	2021-12-28 18:46:38.398145+00	88	1	t	t
372	1	240000	3	2021-12-28 18:46:38.398145+00	89	3	t	t
373	1	22000	3	2021-12-28 18:46:38.398145+00	91	1	t	t
374	1	250000	3	2021-12-28 18:46:38.398145+00	92	3	t	t
375	1	25000	3	2021-12-28 18:46:38.398145+00	93	1	t	t
376	1	25000	3	2021-12-28 18:46:38.398145+00	94	1	t	t
377	1	25000	3	2021-12-28 18:46:38.398145+00	95	1	t	t
378	1	24000	3	2021-12-28 18:46:38.398145+00	98	1	t	t
379	1	140000	2	2021-12-28 18:46:38.398145+00	73	3	f	t
380	1	5000	4	2021-12-28 18:46:38.398145+00	99	1	t	t
381	1	50000	4	2021-12-28 18:46:38.398145+00	100	2	t	t
382	1	48000	4	2021-12-28 18:46:38.398145+00	100	3	t	t
383	1	2500	4	2021-12-28 18:46:38.398145+00	101	1	t	t
384	1	28000	4	2021-12-28 18:46:38.398145+00	102	2	t	t
385	1	250000	2	2021-12-28 18:46:38.398145+00	33	2	t	t
386	1	2000	4	2021-12-28 18:46:38.398145+00	103	1	t	t
387	1	48000	4	2021-12-28 18:46:38.398145+00	104	2	t	t
388	1	6000	4	2021-12-28 18:46:38.398145+00	105	1	t	t
389	1	72000	4	2021-12-28 18:46:38.398145+00	106	2	t	t
390	1	70000	4	2021-12-28 18:46:38.398145+00	106	3	t	t
391	1	2500	4	2021-12-28 18:46:38.398145+00	107	1	t	t
392	1	60000	4	2021-12-28 18:46:38.398145+00	108	2	t	t
393	1	2500	4	2021-12-28 18:46:38.398145+00	109	1	t	t
394	1	26000	4	2021-12-28 18:46:38.398145+00	110	2	t	t
395	1	95000	4	2021-12-28 18:46:38.398145+00	112	2	t	t
396	1	8000	4	2021-12-28 18:46:38.398145+00	111	1	t	t
397	1	5000	4	2021-12-28 18:46:38.398145+00	113	1	t	t
398	1	28000	4	2021-12-28 18:46:38.398145+00	116	2	t	t
399	1	112000	4	2021-12-28 18:46:38.398145+00	117	2	t	t
401	1	5000	4	2021-12-28 18:46:38.398145+00	121	1	t	t
402	1	25000	4	2021-12-28 18:46:38.398145+00	122	2	t	t
403	1	100000	4	2021-12-28 18:46:38.398145+00	123	2	t	t
405	1	85000	4	2021-12-28 18:46:38.398145+00	125	1	t	t
406	1	170000	4	2021-12-28 18:46:38.398145+00	126	2	t	t
407	1	4000	4	2021-12-28 18:46:38.398145+00	82	1	t	t
408	1	48000	4	2021-12-28 18:46:38.398145+00	127	2	t	t
409	1	2500	4	2021-12-28 18:46:38.398145+00	70	2	t	t
410	1	58000	4	2021-12-28 18:46:38.398145+00	71	2	t	t
411	1	48000	3	2021-12-28 18:46:38.398145+00	128	1	t	t
412	1	23000	3	2021-12-28 18:46:38.398145+00	129	1	t	t
413	1	6000	4	2021-12-28 18:46:38.398145+00	130	1	t	t
414	1	60000	3	2021-12-28 18:46:38.398145+00	132	1	t	t
415	1	72000	4	2021-12-28 18:46:38.398145+00	131	2	t	t
416	1	7500	4	2021-12-28 18:46:38.398145+00	133	1	t	t
417	1	88000	4	2021-12-28 18:46:38.398145+00	134	2	t	t
418	1	86000	4	2021-12-28 18:46:38.398145+00	134	3	t	t
419	1	4000	4	2021-12-28 18:46:38.398145+00	135	1	t	t
423	1	24000	4	2021-12-28 18:46:38.398145+00	138	2	t	t
424	1	22000	4	2021-12-28 18:46:38.398145+00	138	3	f	t
425	1	3000	4	2021-12-28 18:46:38.398145+00	139	1	t	t
426	1	32000	4	2021-12-28 18:46:38.398145+00	140	2	t	t
427	1	30000	4	2021-12-28 18:46:38.398145+00	140	3	f	t
428	1	12000	4	2021-12-28 18:46:38.398145+00	141	1	t	t
429	1	170000	4	2021-12-28 18:46:38.398145+00	142	2	t	t
430	1	168000	4	2021-12-28 18:46:38.398145+00	142	3	f	t
431	1	45000	3	2021-12-28 18:46:38.398145+00	143	1	t	t
432	1	240000	3	2021-12-28 18:46:38.398145+00	144	3	t	t
433	1	23000	3	2021-12-28 18:46:38.398145+00	146	1	t	t
434	1	260000	3	2021-12-28 18:46:38.398145+00	147	3	f	t
436	1	48000	4	2021-12-28 18:46:38.398145+00	148	2	t	t
435	1	8000	4	2021-12-28 18:46:38.398145+00	145	1	t	t
437	1	192000	4	2021-12-28 18:46:38.398145+00	149	2	t	t
438	1	4000	4	2021-12-28 18:46:38.398145+00	150	1	t	t
439	1	20000	4	2021-12-28 18:46:38.398145+00	151	2	t	t
440	1	19000	4	2021-12-28 18:46:38.398145+00	151	3	t	t
441	1	80000	4	2021-12-28 18:46:38.398145+00	152	2	t	t
442	1	76000	4	2021-12-28 18:46:38.398145+00	152	3	t	t
443	1	90000	3	2021-12-28 18:46:38.398145+00	156	1	t	t
444	1	5000	4	2021-12-28 18:46:38.398145+00	153	1	t	t
445	1	28000	4	2021-12-28 18:46:38.398145+00	154	2	t	t
446	1	112000	4	2021-12-28 18:46:38.398145+00	155	2	t	t
447	1	5000	4	2021-12-28 18:46:38.398145+00	157	1	t	t
448	1	60000	4	2021-12-28 18:46:38.398145+00	158	2	t	t
449	1	13000	4	2021-12-28 18:46:38.398145+00	159	1	t	t
450	1	175000	4	2021-12-28 18:46:38.398145+00	160	1	t	t
451	1	7500	4	2021-12-28 18:46:38.398145+00	162	\N	f	t
452	1	7500	4	2021-12-28 18:46:38.398145+00	162	\N	t	t
453	1	45000	4	2021-12-28 18:46:38.398145+00	175	2	t	t
454	1	44000	4	2021-12-28 18:46:38.398145+00	175	3	t	t
455	1	180000	4	2021-12-28 18:46:38.398145+00	176	2	t	t
456	1	176000	4	2021-12-28 18:46:38.398145+00	176	3	t	t
457	1	2500	4	2021-12-28 18:46:38.398145+00	177	1	t	t
458	1	26000	4	2021-12-28 18:46:38.398145+00	178	2	t	t
459	1	2000	4	2021-12-28 18:46:38.398145+00	179	1	t	t
460	1	23000	4	2021-12-28 18:46:38.398145+00	180	2	t	t
461	1	22000	4	2021-12-28 18:46:38.398145+00	180	3	t	t
462	1	1500	4	2021-12-28 18:46:38.398145+00	183	1	t	t
463	1	15000	4	2021-12-28 18:46:38.398145+00	182	2	t	t
464	1	12000	4	2021-12-28 18:46:38.398145+00	184	1	t	t
465	1	130000	4	2021-12-28 18:46:38.398145+00	185	2	t	t
466	1	7000	4	2021-12-28 18:46:38.398145+00	186	1	t	t
467	1	38000	4	2021-12-28 18:46:38.398145+00	187	2	t	t
468	1	152000	4	2021-12-28 18:46:38.398145+00	188	2	t	t
469	1	4000	4	2021-12-28 18:46:38.398145+00	189	1	t	t
470	1	23000	4	2021-12-28 18:46:38.398145+00	190	2	t	t
471	1	22000	4	2021-12-28 18:46:38.398145+00	190	3	t	t
472	1	92000	4	2021-12-28 18:46:38.398145+00	191	2	t	t
473	1	88000	4	2021-12-28 18:46:38.398145+00	191	3	t	t
474	1	5000	4	2021-12-28 18:46:38.398145+00	192	1	t	t
475	1	55000	4	2021-12-28 18:46:38.398145+00	193	2	t	t
476	1	53000	4	2021-12-28 18:46:38.398145+00	193	3	t	t
477	1	7000	4	2021-12-28 18:46:38.398145+00	194	1	t	t
478	1	37000	4	2021-12-28 18:46:38.398145+00	195	2	t	t
479	1	34000	4	2021-12-28 18:46:38.398145+00	195	3	t	t
480	1	148000	4	2021-12-28 18:46:38.398145+00	196	2	t	t
481	1	136000	4	2021-12-28 18:46:38.398145+00	196	3	t	t
482	1	10000	4	2021-12-28 18:46:38.398145+00	197	1	t	t
483	1	120000	4	2021-12-28 18:46:38.398145+00	198	2	t	t
484	1	112000	4	2021-12-28 18:46:38.398145+00	198	3	t	t
485	1	6000	4	2021-12-28 18:46:38.398145+00	199	1	t	t
486	1	32000	4	2021-12-28 18:46:38.398145+00	200	2	t	t
487	1	128000	4	2021-12-28 18:46:38.398145+00	201	2	t	t
488	1	7500	4	2021-12-28 18:46:38.398145+00	202	\N	t	t
493	1	88000	4	2021-12-28 18:46:38.398145+00	203	2	t	t
494	1	86000	4	2021-12-28 18:46:38.398145+00	203	3	t	t
495	1	4000	4	2021-12-28 18:46:38.398145+00	204	1	t	t
496	1	50000	4	2021-12-28 18:46:38.398145+00	205	2	t	t
497	1	5000	4	2021-12-28 18:46:38.398145+00	206	1	t	t
498	1	30000	4	2021-12-28 18:46:38.398145+00	207	2	t	t
499	1	120000	4	2021-12-28 18:46:38.398145+00	208	2	t	t
500	1	5000	4	2021-12-28 18:46:38.398145+00	209	2	t	t
501	1	28000	4	2021-12-28 18:46:38.398145+00	210	2	t	t
502	1	26500	4	2021-12-28 18:46:38.398145+00	210	3	t	t
503	1	112000	4	2021-12-28 18:46:38.398145+00	211	2	t	t
504	1	106000	4	2021-12-28 18:46:38.398145+00	211	3	t	t
505	1	4000	4	2021-12-28 18:46:38.398145+00	213	1	t	t
506	1	48000	4	2021-12-28 18:46:38.398145+00	214	2	t	t
507	1	6000	4	2021-12-28 18:46:38.398145+00	215	1	t	t
508	1	140000	4	2021-12-28 18:46:38.398145+00	216	2	t	t
509	1	3000	4	2021-12-28 18:46:38.398145+00	217	1	t	t
510	1	17000	4	2021-12-28 18:46:38.398145+00	218	2	t	t
511	1	68000	4	2021-12-28 18:46:38.398145+00	219	2	t	t
512	1	30000	4	2021-12-28 18:46:38.398145+00	221	2	t	t
513	1	3000	4	2021-12-28 18:46:38.398145+00	220	1	t	t
514	1	3000	4	2021-12-28 18:46:38.398145+00	222	1	t	t
515	1	33000	4	2021-12-28 18:46:38.398145+00	223	2	t	t
516	1	3500	4	2021-12-28 18:46:38.398145+00	224	1	t	t
517	1	38000	4	2021-12-28 18:46:38.398145+00	225	2	t	t
518	1	36000	4	2021-12-28 18:46:38.398145+00	225	3	t	t
520	1	5000	4	2021-12-28 18:46:38.398145+00	226	1	t	t
521	1	115000	4	2021-12-28 18:46:38.398145+00	227	2	t	t
522	1	2500	4	2021-12-28 18:46:38.398145+00	228	1	t	t
523	1	25000	4	2021-12-28 18:46:38.398145+00	229	2	t	t
524	1	6000	4	2021-12-28 18:46:38.398145+00	230	1	t	t
525	1	130000	4	2021-12-28 18:46:38.398145+00	231	2	t	t
526	1	125000	4	2021-12-28 18:46:38.398145+00	231	3	t	t
527	1	7000	4	2021-12-28 18:46:38.398145+00	232	1	t	t
528	1	40000	4	2021-12-28 18:46:38.398145+00	233	2	t	t
529	1	160000	4	2021-12-28 18:46:38.398145+00	234	2	t	t
530	1	10000	4	2021-12-28 18:46:38.398145+00	235	1	t	t
531	1	60000	4	2021-12-28 18:46:38.398145+00	236	2	t	t
532	1	4000	4	2021-12-28 18:46:38.398145+00	238	1	t	t
533	1	46000	4	2021-12-28 18:46:38.398145+00	239	2	t	t
534	1	3000	4	2021-12-28 18:46:38.398145+00	240	1	t	t
535	1	65000	4	2021-12-28 18:46:38.398145+00	241	2	t	t
536	1	6500	4	2021-12-28 18:46:38.398145+00	242	\N	t	t
537	1	76000	4	2021-12-28 18:46:38.398145+00	243	2	t	t
538	1	75000	4	2021-12-28 18:46:38.398145+00	243	3	t	t
539	1	3500	4	2021-12-28 18:46:38.398145+00	244	1	t	t
540	1	40000	4	2021-12-28 18:46:38.398145+00	245	2	t	t
541	1	4000	4	2021-12-28 18:46:38.398145+00	246	1	t	t
542	1	48000	4	2021-12-28 18:46:38.398145+00	247	2	t	t
543	1	45000	4	2021-12-28 18:46:38.398145+00	247	3	t	t
544	1	4000	4	2021-12-28 18:46:38.398145+00	248	1	t	t
545	1	38000	4	2021-12-28 18:46:38.398145+00	249	2	t	t
546	1	36000	4	2021-12-28 18:46:38.398145+00	249	3	t	t
547	1	6000	4	2021-12-28 18:46:38.398145+00	250	1	t	t
548	1	72000	4	2021-12-28 18:46:38.398145+00	251	2	t	t
549	1	70000	4	2021-12-28 18:46:38.398145+00	251	3	t	t
550	1	4000	4	2021-12-28 18:46:38.398145+00	252	1	t	t
551	1	43000	4	2021-12-28 18:46:38.398145+00	253	2	t	t
552	1	4000	4	2021-12-28 18:46:38.398145+00	254	1	t	t
553	1	22000	4	2021-12-28 18:46:38.398145+00	255	2	t	t
554	1	44000	4	2021-12-28 18:46:38.398145+00	256	2	t	t
555	1	10000	4	2021-12-28 18:46:38.398145+00	257	1	t	t
556	1	58000	4	2021-12-28 18:46:38.398145+00	258	2	t	t
610	1	7500	4	2021-12-28 18:46:38.398145+00	367	1	t	t
557	1	56000	2	2021-12-28 18:46:38.398145+00	258	3	t	t
558	1	5000	4	2021-12-28 18:46:38.398145+00	259	1	t	t
559	1	60000	4	2021-12-28 18:46:38.398145+00	260	2	t	t
560	1	55000	4	2021-12-28 18:46:38.398145+00	260	3	f	t
561	1	5000	4	2021-12-28 18:46:38.398145+00	261	1	t	t
562	1	60000	4	2021-12-28 18:46:38.398145+00	262	2	t	t
563	1	55000	4	2021-12-28 18:46:38.398145+00	262	3	f	t
564	1	6000	4	2021-12-28 18:46:38.398145+00	263	1	t	t
565	1	65000	4	2021-12-28 18:46:38.398145+00	264	2	t	t
566	1	2500	4	2021-12-28 18:46:38.398145+00	265	1	t	t
567	1	25000	4	2021-12-28 18:46:38.398145+00	266	2	t	t
568	1	3000	4	2021-12-28 18:46:38.398145+00	267	1	t	t
569	1	33000	4	2021-12-28 18:46:38.398145+00	268	2	t	t
570	1	32000	4	2021-12-28 18:46:38.398145+00	268	3	f	t
571	1	2500	4	2021-12-28 18:46:38.398145+00	269	1	t	t
572	1	24000	4	2021-12-28 18:46:38.398145+00	270	2	t	t
573	1	10000	4	2021-12-28 18:46:38.398145+00	341	1	t	t
574	1	56000	4	2021-12-28 18:46:38.398145+00	342	2	t	t
575	1	52000	4	2021-12-28 18:46:38.398145+00	342	3	f	t
576	1	10000	4	2021-12-28 18:46:38.398145+00	343	1	t	t
577	1	58000	4	2021-12-28 18:46:38.398145+00	344	2	t	t
579	1	7000	4	2021-12-28 18:46:38.398145+00	345	1	t	t
580	1	42000	4	2021-12-28 18:46:38.398145+00	346	2	t	t
581	1	6000	4	2021-12-28 18:46:38.398145+00	347	1	t	t
582	1	60000	4	2021-12-28 18:46:38.398145+00	348	2	t	t
583	1	8000	4	2021-12-28 18:46:38.398145+00	349	1	t	t
584	1	32000	4	2021-12-28 18:46:38.398145+00	350	2	t	t
585	1	5000	4	2021-12-28 18:46:38.398145+00	351	1	t	t
586	1	30000	4	2021-12-28 18:46:38.398145+00	352	2	t	t
587	1	27000	4	2021-12-28 18:46:38.398145+00	352	3	f	t
588	1	120000	4	2021-12-28 18:46:38.398145+00	353	2	t	t
589	1	108000	4	2021-12-28 18:46:38.398145+00	353	3	f	t
590	1	5000	4	2021-12-28 18:46:38.398145+00	354	1	t	t
591	1	30000	4	2021-12-28 18:46:38.398145+00	355	2	t	t
592	1	27000	4	2021-12-28 18:46:38.398145+00	355	3	f	t
593	1	120000	4	2021-12-28 18:46:38.398145+00	356	2	t	t
594	1	108000	4	2021-12-28 18:46:38.398145+00	356	3	f	t
595	1	5000	4	2021-12-28 18:46:38.398145+00	357	1	t	t
596	1	30000	4	2021-12-28 18:46:38.398145+00	358	2	t	t
597	1	27000	4	2021-12-28 18:46:38.398145+00	358	3	f	t
598	1	120000	4	2021-12-28 18:46:38.398145+00	359	2	t	t
599	1	108000	4	2021-12-28 18:46:38.398145+00	359	3	f	t
600	1	5000	4	2021-12-28 18:46:38.398145+00	363	1	t	t
601	1	120000	4	2021-12-28 18:46:38.398145+00	362	2	t	t
602	1	108000	4	2021-12-28 18:46:38.398145+00	362	3	f	t
603	1	30000	4	2021-12-28 18:46:38.398145+00	361	2	t	t
604	1	27000	4	2021-12-28 18:46:38.398145+00	361	3	f	t
605	1	5000	4	2021-12-28 18:46:38.398145+00	364	1	t	t
606	1	30000	4	2021-12-28 18:46:38.398145+00	365	2	t	t
607	1	27000	4	2021-12-28 18:46:38.398145+00	365	3	f	t
608	1	120000	4	2021-12-28 18:46:38.398145+00	366	2	t	t
609	1	108000	4	2021-12-28 18:46:38.398145+00	366	3	f	t
611	1	45000	4	2021-12-28 18:46:38.398145+00	368	2	t	t
612	1	180000	4	2021-12-28 18:46:38.398145+00	369	2	t	t
613	1	10000	4	2021-12-28 18:46:38.398145+00	370	1	t	t
614	1	210000	4	2021-12-28 18:46:38.398145+00	371	2	t	t
615	1	205000	4	2021-12-28 18:46:38.398145+00	371	3	f	t
616	1	20000	4	2021-12-28 18:46:38.398145+00	372	1	t	t
617	1	200000	4	2021-12-28 18:46:38.398145+00	373	2	t	t
618	1	12000	4	2021-12-28 18:46:38.398145+00	374	1	t	t
619	1	48000	4	2021-12-28 18:46:38.398145+00	375	2	t	t
620	1	260000	4	2021-12-28 18:46:38.398145+00	376	2	t	t
621	1	12000	4	2021-12-28 18:46:38.398145+00	377	1	t	t
622	1	48000	4	2021-12-28 18:46:38.398145+00	378	2	t	t
623	1	260000	4	2021-12-28 18:46:38.398145+00	379	2	t	t
624	1	12000	4	2021-12-28 18:46:38.398145+00	380	1	t	t
625	1	48000	4	2021-12-28 18:46:38.398145+00	381	2	t	t
626	1	260000	4	2021-12-28 18:46:38.398145+00	382	2	t	t
627	1	12000	4	2021-12-28 18:46:38.398145+00	383	1	t	t
628	1	48000	4	2021-12-28 18:46:38.398145+00	384	2	t	t
629	1	260000	4	2021-12-28 18:46:38.398145+00	385	2	t	t
630	1	7000	4	2021-12-28 18:46:38.398145+00	386	1	t	t
631	1	40000	4	2021-12-28 18:46:38.398145+00	387	2	t	t
632	1	7500	4	2021-12-28 18:46:38.398145+00	388	1	t	t
633	1	75000	4	2021-12-28 18:46:38.398145+00	389	2	t	t
634	1	4000	4	2021-12-28 18:46:38.398145+00	390	1	t	t
635	1	87000	4	2021-12-28 18:46:38.398145+00	391	2	t	t
636	1	33000	4	2021-12-28 18:46:38.398145+00	392	1	t	t
637	1	20000	4	2021-12-28 18:46:38.398145+00	393	1	t	t
638	1	11000	4	2021-12-28 18:46:38.398145+00	394	1	t	t
639	1	58000	4	2021-12-28 18:46:38.398145+00	395	2	t	t
640	1	54000	4	2021-12-28 18:46:38.398145+00	395	3	f	t
641	1	15000	4	2021-12-28 18:46:38.398145+00	396	1	t	t
642	1	82000	4	2021-12-28 18:46:38.398145+00	397	2	t	t
643	1	25000	4	2021-12-28 18:46:38.398145+00	398	1	t	t
644	1	40000	4	2021-12-28 18:46:38.398145+00	400	1	t	t
645	1	25000	4	2021-12-28 18:46:38.398145+00	399	1	t	t
646	1	30000	4	2021-12-28 18:46:38.398145+00	401	1	t	t
647	1	30000	4	2021-12-28 18:46:38.398145+00	402	1	t	t
649	1	13000	4	2021-12-28 18:46:38.398145+00	403	1	t	t
650	1	75000	4	2021-12-28 18:46:38.398145+00	404	2	t	t
651	1	6000	4	2021-12-28 18:46:38.398145+00	405	1	t	t
652	1	35000	4	2021-12-28 18:46:38.398145+00	406	2	t	t
653	1	33000	4	2021-12-28 18:46:38.398145+00	406	3	f	t
654	1	6000	4	2021-12-28 18:46:38.398145+00	407	1	t	t
655	1	36000	4	2021-12-28 18:46:38.398145+00	408	2	t	t
656	1	33000	4	2021-12-28 18:46:38.398145+00	408	3	f	t
657	1	20000	4	2021-12-28 18:46:38.398145+00	409	1	t	t
658	1	5000	4	2021-12-28 18:46:38.398145+00	410	1	t	t
659	1	5000	4	2021-12-28 18:46:38.398145+00	411	1	t	t
660	1	16000	4	2021-12-28 18:46:38.398145+00	412	1	t	t
667	1	11000	4	2021-12-28 18:46:38.398145+00	413	1	t	t
668	1	500	4	2021-12-28 18:46:38.398145+00	414	1	t	t
669	1	18000	4	2021-12-28 18:46:38.398145+00	415	1	t	t
670	1	1000	4	2021-12-28 18:46:38.398145+00	416	1	t	t
671	1	10000	4	2021-12-28 18:46:38.398145+00	417	1	t	t
672	1	2000	4	2021-12-28 18:46:38.398145+00	418	1	t	t
673	1	37000	4	2021-12-28 18:46:38.398145+00	419	1	t	t
674	1	2000	4	2021-12-28 18:46:38.398145+00	420	1	t	t
675	1	19000	4	2021-12-28 18:46:38.398145+00	421	1	t	t
676	1	3000	4	2021-12-28 18:46:38.398145+00	422	1	t	t
677	1	10000	4	2021-12-28 18:46:38.398145+00	423	1	t	t
678	1	4000	4	2021-12-28 18:46:38.398145+00	424	1	t	t
679	1	10000	4	2021-12-28 18:46:38.398145+00	425	1	t	t
680	1	11000	4	2021-12-28 18:46:38.398145+00	426	1	t	t
681	1	11000	4	2021-12-28 18:46:38.398145+00	427	1	t	t
682	1	4000	4	2021-12-28 18:46:38.398145+00	428	1	t	t
683	1	13000	4	2021-12-28 18:46:38.398145+00	429	1	t	t
684	1	12000	4	2021-12-28 18:46:38.398145+00	430	1	t	t
701	1	18500	4	2021-12-28 18:46:38.398145+00	447	2	t	t
685	1	11000	4	2021-12-28 18:46:38.398145+00	431	1	t	t
686	1	6	4	2021-12-28 18:46:38.398145+00	432	1	t	t
687	1	6500	4	2021-12-28 18:46:38.398145+00	433	1	t	t
688	1	7000	4	2021-12-28 18:46:38.398145+00	434	1	t	t
689	1	8000	4	2021-12-28 18:46:38.398145+00	435	1	t	t
690	1	2000	4	2021-12-28 18:46:38.398145+00	436	1	t	t
691	1	22000	4	2021-12-28 18:46:38.398145+00	437	1	t	t
692	1	2000	4	2021-12-28 18:46:38.398145+00	438	1	t	t
693	1	20000	4	2021-12-28 18:46:38.398145+00	439	1	t	t
694	1	13000	4	2021-12-28 18:46:38.398145+00	440	1	t	t
695	1	10000	4	2021-12-28 18:46:38.398145+00	441	1	t	t
696	1	100000	4	2021-12-28 18:46:38.398145+00	442	1	t	t
697	1	10000	4	2021-12-28 18:46:38.398145+00	443	1	t	t
698	1	100000	4	2021-12-28 18:46:38.398145+00	444	1	t	t
699	1	2000	4	2021-12-28 18:46:38.398145+00	445	1	t	t
700	1	3500	4	2021-12-28 18:46:38.398145+00	446	1	t	t
702	1	18500	4	2021-12-28 18:46:38.398145+00	449	2	t	t
703	1	3500	4	2021-12-28 18:46:38.398145+00	448	1	t	t
704	1	6000	4	2021-12-28 18:46:38.398145+00	450	1	t	t
705	1	6000	4	2021-12-28 18:46:38.398145+00	451	1	t	t
706	1	2000	4	2021-12-28 18:46:38.398145+00	452	1	t	t
707	1	2000	4	2021-12-28 18:46:38.398145+00	453	1	t	t
708	1	2000	4	2021-12-28 18:46:38.398145+00	454	1	t	t
709	1	11000	4	2021-12-28 18:46:38.398145+00	455	1	t	t
711	1	3000	4	2021-12-28 18:46:38.398145+00	456	1	t	t
712	1	4000	4	2021-12-28 18:46:38.398145+00	457	1	t	t
713	1	17000	4	2021-12-28 18:46:38.398145+00	458	1	t	t
714	1	5000	4	2021-12-28 18:46:38.398145+00	459	1	t	t
715	1	1000	4	2021-12-28 18:46:38.398145+00	460	1	t	t
717	1	27000	4	2021-12-28 18:46:38.398145+00	461	1	f	t
718	1	8000	4	2021-12-28 18:46:38.398145+00	462	1	t	t
719	1	5000	4	2021-12-28 18:46:38.398145+00	463	1	t	t
720	1	10000	4	2021-12-28 18:46:38.398145+00	464	1	t	t
721	1	38000	4	2021-12-28 18:46:38.398145+00	465	1	t	t
722	1	10000	4	2021-12-28 18:46:38.398145+00	466	1	t	t
723	1	38000	4	2021-12-28 18:46:38.398145+00	467	1	t	t
724	1	7000	4	2021-12-28 18:46:38.398145+00	468	1	t	t
725	1	28000	4	2021-12-28 18:46:38.398145+00	469	1	t	t
726	1	13000	4	2021-12-28 18:46:38.398145+00	471	1	t	t
727	1	2000	4	2021-12-28 18:46:38.398145+00	470	1	t	t
728	1	6000	4	2021-12-28 18:46:38.398145+00	472	1	t	t
729	1	6000	4	2021-12-28 18:46:38.398145+00	473	1	t	t
730	1	6000	4	2021-12-28 18:46:38.398145+00	474	1	t	t
731	1	18000	4	2021-12-28 18:46:38.398145+00	475	1	t	t
732	1	5000	3	2021-12-28 18:46:38.398145+00	476	1	t	t
733	1	26000	3	2021-12-28 18:46:38.398145+00	477	2	t	t
734	1	18000	4	2021-12-28 18:46:38.398145+00	478	1	t	t
735	1	25000	3	2021-12-28 18:46:38.398145+00	477	3	f	t
736	1	18000	4	2021-12-28 18:46:38.398145+00	479	1	t	t
737	1	5000	3	2021-12-28 18:46:38.398145+00	480	1	t	t
738	1	26000	3	2021-12-28 18:46:38.398145+00	481	2	t	t
739	1	25000	3	2021-12-28 18:46:38.398145+00	481	3	f	t
740	1	8000	3	2021-12-28 18:46:38.398145+00	482	1	t	t
741	1	90000	3	2021-12-28 18:46:38.398145+00	483	3	f	t
742	1	18000	4	2021-12-28 18:46:38.398145+00	484	1	t	t
743	1	13000	3	2021-12-28 18:46:38.398145+00	485	1	t	t
744	1	3000	4	2021-12-28 18:46:38.398145+00	486	1	t	t
745	1	15000	4	2021-12-28 18:46:38.398145+00	487	2	t	t
746	1	14000	4	2021-12-28 18:46:38.398145+00	487	3	f	t
747	1	12000	3	2021-12-28 18:46:38.398145+00	488	1	t	t
748	1	110000	3	2021-12-28 18:46:38.398145+00	489	3	t	t
749	1	15000	3	2021-12-28 18:46:38.398145+00	490	1	t	t
750	1	85000	3	2021-12-28 18:46:38.398145+00	491	3	t	t
751	1	6000	3	2021-12-28 18:46:38.398145+00	492	1	t	t
752	1	62000	3	2021-12-28 18:46:38.398145+00	493	3	t	t
753	1	10000	3	2021-12-28 18:46:38.398145+00	494	1	t	t
754	1	12000	3	2021-12-28 18:46:38.398145+00	495	1	t	t
755	1	18000	4	2021-12-28 18:46:38.398145+00	496	1	t	t
756	1	10000	3	2021-12-28 18:46:38.398145+00	497	1	t	t
757	1	9000	3	2021-12-28 18:46:38.398145+00	498	1	t	t
758	1	12000	3	2021-12-28 18:46:38.398145+00	499	1	t	t
759	1	10000	3	2021-12-28 18:46:38.398145+00	500	1	t	t
760	1	9000	3	2021-12-28 18:46:38.398145+00	501	1	t	t
762	1	10000	4	2021-12-28 18:46:38.398145+00	502	1	t	t
763	1	7000	4	2021-12-28 18:46:38.398145+00	503	1	t	t
764	1	5000	3	2021-12-28 18:46:38.398145+00	504	1	t	t
765	1	8000	3	2021-12-28 18:46:38.398145+00	505	1	t	t
766	1	6000	3	2021-12-28 18:46:38.398145+00	506	1	t	t
767	1	156000	3	2021-12-28 18:46:38.398145+00	508	3	t	t
768	1	16000	3	2021-12-28 18:46:38.398145+00	507	1	t	t
769	1	7000	3	2021-12-28 18:46:38.398145+00	509	1	t	t
770	1	7500	4	2021-12-28 18:46:38.398145+00	510	1	t	t
771	1	5000	4	2021-12-28 18:46:38.398145+00	511	1	t	t
772	1	6000	4	2021-12-28 18:46:38.398145+00	512	1	t	t
773	1	9000	4	2021-12-28 18:46:38.398145+00	513	1	t	t
774	1	12000	4	2021-12-28 18:46:38.398145+00	514	1	t	t
775	1	10000	4	2021-12-28 18:46:38.398145+00	516	1	t	t
776	1	8000	3	2021-12-28 18:46:38.398145+00	515	1	t	t
777	1	8000	3	2021-12-28 18:46:38.398145+00	517	1	t	t
778	1	12000	3	2021-12-28 18:46:38.398145+00	518	1	t	t
779	1	4000	4	2021-12-28 18:46:38.398145+00	519	1	t	t
780	1	7000	3	2021-12-28 18:46:38.398145+00	520	1	t	t
781	1	5000	4	2021-12-28 18:46:38.398145+00	521	1	t	t
782	1	10000	3	2021-12-28 18:46:38.398145+00	522	1	t	t
783	1	12000	3	2021-12-28 18:46:38.398145+00	523	1	t	t
784	1	5000	3	2021-12-28 18:46:38.398145+00	524	1	t	t
785	1	5000	4	2021-12-28 18:46:38.398145+00	526	1	t	t
786	1	8000	3	2021-12-28 18:46:38.398145+00	525	1	t	t
787	1	10000	3	2021-12-28 18:46:38.398145+00	527	1	t	t
788	1	9000	3	2021-12-28 18:46:38.398145+00	528	1	t	t
789	1	5000	4	2021-12-28 18:46:38.398145+00	529	1	t	t
790	1	12000	3	2021-12-28 18:46:38.398145+00	530	1	t	t
791	1	3000	4	2021-12-28 18:46:38.398145+00	531	1	t	t
792	1	9000	3	2021-12-28 18:46:38.398145+00	532	1	t	t
793	1	5000	3	2021-12-28 18:46:38.398145+00	533	1	t	t
794	1	3000	4	2021-12-28 18:46:38.398145+00	535	1	t	t
795	1	4000	4	2021-12-28 18:46:38.398145+00	536	1	t	t
796	1	5500	4	2021-12-28 18:46:38.398145+00	537	1	t	t
797	1	320000	3	2021-12-28 18:46:38.398145+00	538	1	t	t
798	1	68000	3	2021-12-28 18:46:38.398145+00	539	1	t	t
799	1	38000	3	2021-12-28 18:46:38.398145+00	540	1	t	t
800	1	3500	4	2021-12-28 18:46:38.398145+00	541	1	t	t
801	1	5500	4	2021-12-28 18:46:38.398145+00	542	1	t	t
802	1	2000	4	2021-12-28 18:46:38.398145+00	543	1	t	t
803	1	5000	4	2021-12-28 18:46:38.398145+00	544	1	t	t
804	1	48000	3	2021-12-28 18:46:38.398145+00	545	1	t	t
805	1	3000	4	2021-12-28 18:46:38.398145+00	546	1	t	t
806	1	15000	3	2021-12-28 18:46:38.398145+00	547	1	t	t
807	1	25000	3	2021-12-28 18:46:38.398145+00	548	1	t	t
808	1	2000	4	2021-12-28 18:46:38.398145+00	549	1	t	t
809	1	50000	3	2021-12-28 18:46:38.398145+00	550	1	t	t
810	1	22000	3	2021-12-28 18:46:38.398145+00	551	1	t	t
811	1	95000	3	2021-12-28 18:46:38.398145+00	552	1	t	t
812	1	115000	3	2021-12-28 18:46:38.398145+00	553	1	t	t
813	1	12000	3	2021-12-28 18:46:38.398145+00	554	1	t	t
819	1	20000	4	2021-12-28 18:46:38.398145+00	555	1	t	t
820	1	43000	3	2021-12-28 18:46:38.398145+00	556	1	t	t
821	1	60000	3	2021-12-28 18:46:38.398145+00	557	1	t	t
822	1	2000	4	2021-12-28 18:46:38.398145+00	558	1	t	t
823	1	53000	3	2021-12-28 18:46:38.398145+00	559	1	t	t
824	1	55000	3	2021-12-28 18:46:38.398145+00	560	1	t	t
825	1	80000	3	2021-12-28 18:46:38.398145+00	561	1	t	t
826	1	72000	3	2021-12-28 18:46:38.398145+00	562	1	t	t
827	1	115000	3	2021-12-28 18:46:38.398145+00	563	1	t	t
828	1	85000	3	2021-12-28 18:46:38.398145+00	564	1	t	t
829	1	35000	3	2021-12-28 18:46:38.398145+00	565	1	t	t
830	1	25000	3	2021-12-28 18:46:38.398145+00	566	1	t	t
831	1	60000	4	2021-12-28 18:46:38.398145+00	567	1	t	t
832	1	25000	3	2021-12-28 18:46:38.398145+00	568	1	t	t
833	1	25000	3	2021-12-28 18:46:38.398145+00	569	1	t	t
834	1	23000	4	2021-12-28 18:46:38.398145+00	570	1	t	t
835	1	7000	3	2021-12-28 18:46:38.398145+00	571	1	t	t
836	1	60000	4	2021-12-28 18:46:38.398145+00	572	1	t	t
837	1	2500	3	2021-12-28 18:46:38.398145+00	573	1	t	t
838	1	38000	4	2021-12-28 18:46:38.398145+00	574	1	t	t
839	1	65000	4	2021-12-28 18:46:38.398145+00	575	1	t	t
840	1	9000	3	2021-12-28 18:46:38.398145+00	576	1	t	t
841	1	10000	3	2021-12-28 18:46:38.398145+00	577	1	t	t
842	1	10000	3	2021-12-28 18:46:38.398145+00	578	1	t	t
843	1	15000	4	2021-12-28 18:46:38.398145+00	579	1	t	t
844	1	65000	4	2021-12-28 18:46:38.398145+00	580	1	t	t
845	1	46000	4	2021-12-28 18:46:38.398145+00	581	1	t	t
846	1	40000	4	2021-12-28 18:46:38.398145+00	583	1	t	t
847	1	7000	3	2021-12-28 18:46:38.398145+00	582	1	t	t
848	1	46000	4	2021-12-28 18:46:38.398145+00	584	1	t	t
849	1	85000	4	2021-12-28 18:46:38.398145+00	585	1	t	t
850	1	4000	4	2021-12-28 18:46:38.398145+00	586	1	t	t
851	1	38000	4	2021-12-28 18:46:38.398145+00	587	1	t	t
852	1	3500	3	2021-12-28 18:46:38.398145+00	588	1	t	t
853	1	2500	3	2021-12-28 18:46:38.398145+00	589	1	t	t
854	1	3000	3	2021-12-28 18:46:38.398145+00	590	1	t	t
855	1	2000	4	2021-12-28 18:46:38.398145+00	592	1	t	t
856	1	38000	4	2021-12-28 18:46:38.398145+00	593	1	t	t
857	1	3000	4	2021-12-28 18:46:38.398145+00	594	1	t	t
858	1	25000	4	2021-12-28 18:46:38.398145+00	595	1	t	t
859	1	5000	4	2021-12-28 18:46:38.398145+00	596	1	t	t
860	1	35000	4	2021-12-28 18:46:38.398145+00	597	1	t	t
861	1	3500	3	2021-12-28 18:46:38.398145+00	591	1	t	t
862	1	2500	3	2021-12-28 18:46:38.398145+00	598	1	t	t
863	1	3000	3	2021-12-28 18:46:38.398145+00	599	1	t	t
864	1	5000	4	2021-12-28 18:46:38.398145+00	600	1	t	t
865	1	35000	4	2021-12-28 18:46:38.398145+00	601	1	t	t
866	1	2500	3	2021-12-28 18:46:38.398145+00	602	1	t	t
867	1	2500	4	2021-12-28 18:46:38.398145+00	604	1	t	t
868	1	24000	4	2021-12-28 18:46:38.398145+00	605	1	t	t
869	1	2500	3	2021-12-28 18:46:38.398145+00	603	1	t	t
870	1	6000	3	2021-12-28 18:46:38.398145+00	606	1	t	t
871	1	3500	3	2021-12-28 18:46:38.398145+00	608	1	t	t
872	1	10000	4	2021-12-28 18:46:38.398145+00	607	1	t	t
873	1	95000	4	2021-12-28 18:46:38.398145+00	609	1	t	t
874	1	5000	3	2021-12-28 18:46:38.398145+00	610	1	t	t
875	1	2500	3	2021-12-28 18:46:38.398145+00	612	1	t	t
876	1	26000	3	2021-12-28 18:46:38.398145+00	613	1	t	t
877	1	6000	4	2021-12-28 18:46:38.398145+00	614	1	t	t
878	1	58000	4	2021-12-28 18:46:38.398145+00	615	1	t	t
879	1	30000	3	2021-12-28 18:46:38.398145+00	616	1	t	t
880	1	10000	4	2021-12-28 18:46:38.398145+00	617	1	t	t
881	1	86000	4	2021-12-28 18:46:38.398145+00	618	1	t	t
882	1	6000	4	2021-12-28 18:46:38.398145+00	619	1	t	t
883	1	96000	4	2021-12-28 18:46:38.398145+00	620	1	t	t
884	1	45000	3	2021-12-28 18:46:38.398145+00	621	1	t	t
885	1	28000	3	2021-12-28 18:46:38.398145+00	622	1	t	t
886	1	4000	4	2021-12-28 18:46:38.398145+00	623	1	t	t
887	1	35000	4	2021-12-28 18:46:38.398145+00	624	1	t	t
888	1	15000	3	2021-12-28 18:46:38.398145+00	625	1	t	t
889	1	11000	3	2021-12-28 18:46:38.398145+00	628	1	t	t
890	1	8000	4	2021-12-28 18:46:38.398145+00	626	1	t	t
891	1	78000	4	2021-12-28 18:46:38.398145+00	627	1	t	t
892	1	2500	4	2021-12-28 18:46:38.398145+00	629	1	t	t
893	1	24000	4	2021-12-28 18:46:38.398145+00	630	1	t	t
894	1	11000	4	2021-12-28 18:46:38.398145+00	631	1	t	t
895	1	94000	4	2021-12-28 18:46:38.398145+00	632	1	t	t
896	1	2000	4	2021-12-28 18:46:38.398145+00	634	1	t	t
897	1	15000	4	2021-12-28 18:46:38.398145+00	635	1	t	t
898	1	75000	4	2021-12-28 18:46:38.398145+00	636	1	t	t
931	1	38000	3	2021-12-28 18:46:38.398145+00	633	1	t	t
932	1	12500	3	2021-12-28 18:46:38.398145+00	637	1	t	t
933	1	13000	4	2021-12-28 18:46:38.398145+00	638	1	t	t
934	1	53000	3	2021-12-28 18:46:38.398145+00	639	1	t	t
935	1	140000	3	2021-12-28 18:46:38.398145+00	640	1	t	t
936	1	165000	3	2021-12-28 18:46:38.398145+00	641	1	t	t
937	1	15000	4	2021-12-28 18:46:38.398145+00	643	1	t	t
938	1	3000	4	2021-12-28 18:46:38.398145+00	642	1	t	t
939	1	165000	3	2021-12-28 18:46:38.398145+00	645	1	t	t
940	1	150000	3	2021-12-28 18:46:38.398145+00	646	1	t	t
941	1	30000	4	2021-12-28 18:46:38.398145+00	648	1	t	t
942	1	55000	4	2021-12-28 18:46:38.398145+00	649	1	t	t
943	1	7000	4	2021-12-28 18:46:38.398145+00	650	1	t	t
944	1	80000	4	2021-12-28 18:46:38.398145+00	651	1	t	t
945	1	4000	4	2021-12-28 18:46:38.398145+00	652	1	t	t
946	1	42000	4	2021-12-28 18:46:38.398145+00	653	1	t	t
947	1	125000	3	2021-12-28 18:46:38.398145+00	654	1	t	t
948	1	67000	3	2021-12-28 18:46:38.398145+00	655	1	t	t
949	1	50000	3	2021-12-28 18:46:38.398145+00	656	1	t	t
950	1	7000	4	2021-12-28 18:46:38.398145+00	657	1	t	t
951	1	30000	3	2021-12-28 18:46:38.398145+00	659	1	t	t
952	1	40000	4	2021-12-28 18:46:38.398145+00	658	1	t	t
953	1	50000	3	2021-12-28 18:46:38.398145+00	660	1	t	t
954	1	48000	3	2021-12-28 18:46:38.398145+00	661	1	t	t
955	1	14000	3	2021-12-28 18:46:38.398145+00	662	1	t	t
956	1	17000	3	2021-12-28 18:46:38.398145+00	663	1	t	t
957	1	20000	3	2021-12-28 18:46:38.398145+00	664	1	t	t
958	1	15000	3	2021-12-28 18:46:38.398145+00	665	1	t	t
959	1	4000	4	2021-12-28 18:46:38.398145+00	666	1	t	t
960	1	45000	4	2021-12-28 18:46:38.398145+00	667	1	t	t
961	1	14000	3	2021-12-28 18:46:38.398145+00	668	1	t	t
962	1	4000	4	2021-12-28 18:46:38.398145+00	669	1	t	t
963	1	22000	4	2021-12-28 18:46:38.398145+00	670	1	t	t
964	1	22000	4	2021-12-28 18:46:38.398145+00	670	\N	t	t
965	1	20000	3	2021-12-28 18:46:38.398145+00	671	1	t	t
966	1	3000	4	2021-12-28 18:46:38.398145+00	672	1	t	t
967	1	36000	4	2021-12-28 18:46:38.398145+00	674	1	t	t
968	1	80000	3	2021-12-28 18:46:38.398145+00	673	1	t	t
969	1	22000	4	2021-12-28 18:46:38.398145+00	676	1	t	t
970	1	4000	4	2021-12-28 18:46:38.398145+00	675	1	t	t
971	1	75000	3	2021-12-28 18:46:38.398145+00	677	1	t	t
972	1	4000	4	2021-12-28 18:46:38.398145+00	678	1	t	t
973	1	22000	4	2021-12-28 18:46:38.398145+00	679	1	t	t
974	1	45000	3	2021-12-28 18:46:38.398145+00	680	1	t	t
975	1	13000	3	2021-12-28 18:46:38.398145+00	681	1	t	t
977	1	14000	3	2021-12-28 18:46:38.398145+00	683	1	t	t
978	1	155000	3	2021-12-28 18:46:38.398145+00	684	3	t	t
976	1	150000	3	2021-12-28 18:46:38.398145+00	682	3	t	t
979	1	18000	3	2021-12-28 18:46:38.398145+00	685	1	t	t
980	1	13000	3	2021-12-28 18:46:38.398145+00	686	1	t	t
981	1	25000	3	2021-12-28 18:46:38.398145+00	687	1	t	t
982	1	54000	3	2021-12-28 18:46:38.398145+00	688	1	t	t
983	1	162000	3	2021-12-28 18:46:38.398145+00	689	1	t	t
984	1	12000	3	2021-12-28 18:46:38.398145+00	690	1	t	t
985	1	50000	3	2021-12-28 18:46:38.398145+00	691	1	t	t
986	1	33000	3	2021-12-28 18:46:38.398145+00	692	1	t	t
987	1	38000	3	2021-12-28 18:46:38.398145+00	693	1	t	t
988	1	188000	3	2021-12-28 18:46:38.398145+00	694	3	t	t
989	1	25000	3	2021-12-28 18:46:38.398145+00	695	1	t	t
990	1	188000	3	2021-12-28 18:46:38.398145+00	696	3	t	t
991	1	20000	3	2021-12-28 18:46:38.398145+00	697	1	t	t
992	1	120000	3	2021-12-28 18:46:38.398145+00	698	1	t	t
993	1	290000	3	2021-12-28 18:46:38.398145+00	699	1	t	t
994	1	285000	3	2021-12-28 18:46:38.398145+00	700	1	t	t
996	1	165000	3	2021-12-28 18:46:38.398145+00	701	1	t	t
997	1	75000	3	2021-12-28 18:46:38.398145+00	702	1	t	t
998	1	520000	3	2021-12-28 18:46:38.398145+00	703	1	t	t
999	1	180000	3	2021-12-28 18:46:38.398145+00	704	1	t	t
1000	1	175000	3	2021-12-28 18:46:38.398145+00	705	1	t	t
1001	1	500000	3	2021-12-28 18:46:38.398145+00	706	1	t	t
1002	1	12000	3	2021-12-28 18:46:38.398145+00	707	1	t	t
\.


--
-- Name: precio_por_sucursal_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.precio_por_sucursal_id_seq', 630, true);


--
-- Data for Name: presentacion; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.presentacion (id, producto_id, cantidad, descripcion, principal, activo, tipo_presentacion_id, usuario_id, creado_en) FROM stdin;
99	14	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
100	14	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
101	7	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
102	7	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
103	9	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
104	9	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
105	153	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
106	153	12	CAJA X 12 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
107	12	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
108	12	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
109	11	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
110	11	12	caja x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
111	21	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
112	21	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
113	17	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
115	80	1	test presentacion	t	t	1	2	2021-12-28 18:31:32.214677+00
116	17	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
117	17	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
118	80	12	test 2	f	t	2	2	2021-12-28 18:31:32.214677+00
119	80	24	test 3	f	t	3	2	2021-12-28 18:31:32.214677+00
31	160	1	unidad	t	t	1	1	2021-12-28 18:31:32.214677+00
32	160	6	caja x 6	f	t	2	1	2021-12-28 18:31:32.214677+00
33	160	24	CAJA X 24	f	t	2	1	2021-12-28 18:31:32.214677+00
34	162	1	1	t	t	1	1	2021-12-28 18:31:32.214677+00
68	13	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
70	26	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
71	26	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
72	83	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
73	83	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
78	70	1	unidad	t	t	1	1	2021-12-28 18:31:32.214677+00
79	70	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
81	70	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
82	1	1	unidad	t	t	1	1	2021-12-28 18:31:32.214677+00
83	79	1	unidAD	t	t	1	4	2021-12-28 18:31:32.214677+00
84	79	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
85	79	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
86	87	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
87	87	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
88	15	1	unitario	t	t	1	3	2021-12-28 18:31:32.214677+00
89	15	6	caja x 6 unid	f	t	2	3	2021-12-28 18:31:32.214677+00
90	87	24	CAJA X 24 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
91	16	1	unitario	t	t	1	3	2021-12-28 18:31:32.214677+00
92	16	12	caja x 12 unid	f	t	2	3	2021-12-28 18:31:32.214677+00
93	18	1	unitario	t	t	1	3	2021-12-28 18:31:32.214677+00
94	198	1	unitario	t	t	1	3	2021-12-28 18:31:32.214677+00
95	199	1	unitario	t	t	1	3	2021-12-28 18:31:32.214677+00
98	201	1	unitario	t	t	1	3	2021-12-28 18:31:32.214677+00
120	80	10	test 4	f	t	4	2	2021-12-28 18:31:32.214677+00
121	204	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
122	204	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
123	204	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
125	205	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
126	205	2	pack x 2 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
127	1	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
128	23	1	unitario	t	t	1	3	2021-12-28 18:31:32.214677+00
129	24	1	unitario	t	t	1	3	2021-12-28 18:31:32.214677+00
130	27	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
131	27	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
132	25	1	unitario	t	t	1	3	2021-12-28 18:31:32.214677+00
133	206	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
134	206	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
135	2	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
136	2	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
137	155	1	unidad 	t	t	1	4	2021-12-28 18:31:32.214677+00
138	155	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
139	156	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
140	156	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
141	89	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
142	89	15	caja x 15 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
143	31	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
144	31	6	CAJA X 6 UNID	f	t	2	3	2021-12-28 18:31:32.214677+00
145	90	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
146	33	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
147	33	12	caja x 12 unid	f	t	2	3	2021-12-28 18:31:32.214677+00
148	90	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
149	90	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
150	91	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
151	91	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
152	91	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
153	119	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
154	119	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
155	119	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
156	35	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
157	120	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
158	120	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
159	130	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
160	130	15	caja x 15 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
162	207	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
175	207	6	pack x 6	f	t	4	2	2021-12-28 18:31:32.214677+00
176	207	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
177	212	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
178	212	12	PACK X 12 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
179	213	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
180	213	12	PACK X 12 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
182	215	12	PACK X 12 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
183	215	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
184	220	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
185	220	12	CAJA X 12 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
186	221	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
187	221	6	PACK X 6 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
188	221	24	CAJA X 24 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
189	222	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
190	222	6	PACK X 6 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
191	222	24	CAJA X 24 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
192	224	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
193	224	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
194	147	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
195	147	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
196	147	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
197	148	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
198	148	12	CAJA X 12 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
199	149	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
200	149	6	PACK X 6 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
201	149	24	CAJA X 24 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
202	5	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
203	5	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
204	28	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
205	28	15	pack x 15 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
206	29	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
207	29	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
208	29	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
209	30	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
210	30	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
211	30	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
213	225	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
214	225	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
215	151	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
216	151	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
217	152	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
218	152	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
219	152	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
220	154	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
221	154	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
222	226	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
223	226	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
224	227	1	unidad 	t	t	1	4	2021-12-28 18:31:32.214677+00
225	227	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
226	228	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
227	228	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
228	229	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
229	229	12	caja x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
230	230	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
231	230	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
232	52	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
233	52	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
234	52	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
235	53	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
236	53	6	caja x 6 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
237	53	12	caja x 12 unidad	f	t	3	4	2021-12-28 18:31:32.214677+00
238	54	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
239	54	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
240	57	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
241	57	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
242	61	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
243	61	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
244	63	1	unidad 	t	t	1	4	2021-12-28 18:31:32.214677+00
245	63	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
246	145	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
247	145	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
248	146	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
249	146	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
250	150	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
251	150	12	CAJA X 12 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
252	231	1	unidad 	t	t	1	4	2021-12-28 18:31:32.214677+00
253	231	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
254	232	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
255	232	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
256	232	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
257	235	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
258	235	6	caja x 6 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
259	236	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
260	236	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
261	238	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
262	238	11	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
263	157	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
264	157	24	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
265	158	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
266	158	12	pack x 12 uniDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
267	159	1	unidad 	t	t	1	4	2021-12-28 18:31:32.214677+00
268	159	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
269	239	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
270	239	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
341	241	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
342	241	6	PACK X 6 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
343	242	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
344	242	6	PACK X 6 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
345	243	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
346	243	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
347	244	1	unidad 	t	t	1	4	2021-12-28 18:31:32.214677+00
348	244	12	pack x 12 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
349	245	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
350	245	4	pack x 4 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
351	246	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
352	246	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
353	246	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
354	247	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
355	247	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
356	247	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
357	248	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
358	248	6	PACK X 6 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
359	248	24	CAJA X 24 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
361	249	6	PACK X 6 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
362	249	24	CAJA X 24 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
363	249	1	UNIDAD 	t	t	1	4	2021-12-28 18:31:32.214677+00
364	250	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
365	250	6	PACK X 6 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
366	250	24	CAJA X 24 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
367	251	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
368	251	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
369	251	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
370	252	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
371	252	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
372	253	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
373	253	12	PACK X 12 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
374	254	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
375	254	4	pack x 4 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
376	254	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
377	255	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
378	255	4	PACK X 4 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
379	255	24	CAJA X 24 UNIDAD	f	t	2	4	2021-12-28 18:31:32.214677+00
380	256	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
381	256	4	pack x 4 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
382	256	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
383	257	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
384	257	4	pack x 4 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
385	257	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
386	258	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
387	258	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
388	259	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
389	259	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
390	261	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
391	261	24	caja x 24 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
392	123	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
393	262	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
394	263	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
395	263	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
396	264	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
397	264	6	caja x 6 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
398	265	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
399	266	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
400	105	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
401	267	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
402	268	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
403	269	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
404	269	6	caja x 6 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
405	270	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
406	270	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
407	271	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
408	271	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
409	272	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
410	273	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
411	274	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
425	284	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
412	275	1	unidad	t	t	2	4	2021-12-28 18:31:32.214677+00
413	276	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
414	277	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
415	277	40	caja x 40 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
416	278	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
426	285	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
417	278	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
418	279	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
419	279	20	pack x 20 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
420	280	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
421	280	12	paq x 12 unidad 	f	t	2	4	2021-12-28 18:31:32.214677+00
422	281	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
423	282	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
424	283	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
427	286	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
428	287	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
429	288	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
430	289	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
431	290	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
432	291	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
433	292	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
434	293	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
435	294	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
436	295	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
437	295	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
438	296	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
439	296	12	caja x 12 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
440	297	1	unidad	t	t	\N	4	2021-12-28 18:31:32.214677+00
441	298	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
442	298	10	caja x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
443	299	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
444	299	10	caja x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
445	300	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
446	301	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
447	301	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
448	302	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
449	302	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
450	303	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
451	304	1	unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
452	305	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
453	306	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
454	307	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
455	308	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
456	309	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
457	310	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
458	311	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
459	312	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
460	313	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
461	313	30	caja x 30 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
462	314	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
463	315	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
464	316	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
465	316	4	pack x 4 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
466	317	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
467	317	4	pack x 4 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
468	318	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
469	318	4	pack x 4 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
470	319	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
471	319	12	pack x 12 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
472	320	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
473	321	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
474	322	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
475	323	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
476	324	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
477	324	6	pack x 6 unidad	f	t	4	3	2021-12-28 18:31:32.214677+00
478	325	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
479	326	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
480	328	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
481	328	6	pack x 6 unidad	f	t	4	3	2021-12-28 18:31:32.214677+00
482	329	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
483	329	12	caja x 12unid	f	t	2	3	2021-12-28 18:31:32.214677+00
484	327	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
485	330	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
486	331	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
487	331	6	pack x 6 unidad 	f	t	4	4	2021-12-28 18:31:32.214677+00
488	332	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
489	332	12	caja x 12unidades	f	t	2	3	2021-12-28 18:31:32.214677+00
490	6	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
491	6	6	caja x 6 unidades	f	t	2	3	2021-12-28 18:31:32.214677+00
492	8	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
493	8	12	caja x 12 unidades	f	t	2	3	2021-12-28 18:31:32.214677+00
494	333	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
495	335	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
496	334	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
497	336	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
498	337	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
499	338	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
500	339	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
501	340	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
502	341	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
503	343	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
504	342	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
505	344	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
506	345	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
507	346	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
508	346	12	CAJA X 12 UNIDADES	f	t	2	3	2021-12-28 18:31:32.214677+00
509	347	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
510	348	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
511	349	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
512	350	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
513	351	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
514	352	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
515	353	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
516	354	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
517	355	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
518	356	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
519	357	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
520	358	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
521	359	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
522	360	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
523	361	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
524	362	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
525	363	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
526	364	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
527	365	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
528	366	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
529	367	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
530	368	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
531	369	1	UNIADAD 	t	t	1	4	2021-12-28 18:31:32.214677+00
532	370	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
533	371	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
535	372	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
536	373	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
537	374	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
538	375	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
539	376	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
540	377	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
541	378	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
542	379	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
543	380	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
544	381	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
545	382	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
546	383	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
547	384	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
548	385	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
549	386	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
550	387	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
551	388	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
552	389	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
553	390	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
554	391	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
555	392	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
556	393	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
557	394	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
558	395	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
559	396	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
560	397	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
561	398	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
562	399	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
563	400	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
564	401	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
565	402	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
566	403	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
567	404	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
568	405	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
569	406	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
570	102	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
571	407	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
572	408	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
573	409	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
574	410	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
575	411	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
576	412	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
577	413	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
578	414	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
579	415	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
580	107	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
581	59	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
582	416	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
583	60	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
584	417	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
585	104	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
586	418	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
587	418	10	breza x 10 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
588	419	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
589	420	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
590	421	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
591	422	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
592	423	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
593	423	20	breza x 20 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
594	424	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
595	424	1	breza x 10 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
596	425	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
597	425	10	breza x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
598	426	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
599	427	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
600	428	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
601	428	10	breza x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
602	429	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
603	430	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
604	431	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
605	431	10	breza x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
606	432	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
607	433	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
608	434	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
609	433	1	breza x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
610	435	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
612	437	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
613	438	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
614	436	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
615	436	10	breza x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
616	439	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
617	440	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
618	440	10	breza x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
619	441	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
620	441	20	vreza x 20 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
621	442	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
622	443	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
623	444	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
624	444	10	breza x 10 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
625	445	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
626	446	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
627	446	10	breza x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
628	447	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
629	448	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
630	448	10	breza x 10 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
631	449	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
632	449	10	breza x 10 unidad	f	t	1	4	2021-12-28 18:31:32.214677+00
633	450	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
634	451	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
635	451	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
636	452	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
637	453	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
638	139	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
639	454	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
640	455	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
641	456	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
642	457	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
643	457	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
645	458	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
646	459	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
647	84	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
648	96	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
649	97	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
650	460	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
651	460	12	caja x 12 unidad	f	t	2	4	2021-12-28 18:31:32.214677+00
652	133	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
653	133	12	pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
654	461	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
655	462	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
656	463	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
657	464	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
658	464	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
659	465	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
660	466	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
661	467	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
662	468	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
663	469	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
664	470	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
665	471	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
666	472	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
667	472	12	Pack x 12 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
668	473	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
669	474	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
670	474	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
671	475	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
672	476	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
673	477	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
674	476	15	PACK X 15 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
675	478	1	UNIDAD	t	t	1	4	2021-12-28 18:31:32.214677+00
676	478	6	PACK X 6 UNIDAD	f	t	4	4	2021-12-28 18:31:32.214677+00
677	479	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
678	480	1	unidad	t	t	1	4	2021-12-28 18:31:32.214677+00
679	480	6	pack x 6 unidad	f	t	4	4	2021-12-28 18:31:32.214677+00
680	481	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
681	482	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
682	482	12	CAJA X 12 UNID	f	t	1	3	2021-12-28 18:31:32.214677+00
683	483	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
684	483	12	CAJA X 12 UNIDADES	f	t	2	3	2021-12-28 18:31:32.214677+00
685	484	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
686	485	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
687	486	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
688	487	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
689	488	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
690	489	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
691	490	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
692	491	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
693	492	1	UNIDAD	t	t	1	3	2021-12-28 18:31:32.214677+00
694	492	6	pack x 6 unidades	f	t	1	3	2021-12-28 18:31:32.214677+00
695	493	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
696	493	6	pack x 6 unidades	f	t	1	3	2021-12-28 18:31:32.214677+00
697	494	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
698	494	6	caja x 6 unidades	f	t	1	3	2021-12-28 18:31:32.214677+00
699	495	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
700	496	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
701	497	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
702	498	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
703	499	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
704	500	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
705	501	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
706	502	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
707	503	1	unidad	t	t	1	3	2021-12-28 18:31:32.214677+00
\.


--
-- Name: presentacion_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.presentacion_id_seq', 391, true);


--
-- Data for Name: producto; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.producto (id, id_central, propagado, descripcion, descripcion_factura, iva, unidad_por_caja, balanza, combo, garantia, ingrediente, promocion, vencimiento, stock, usuario_id, tipo_conservacion, creado_en, sub_familia_id, observacion, cambiable, es_alcoholico, unidad_por_caja_secundaria, imagenes, tiempo_garantia, dias_vencimiento, id_sucursal_origen, activo) FROM stdin;
13	\N	f	SANTA HELENA VINO BLANCO 750 ML	SANTA HELENA VINO BLANCO 750 ML	10	12	f	f	f	f	f	t	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
14	\N	f	BRAHMA ZERO ALCOHOL 0.0 LATA 350 ML	BRAHMA ZERO ALCOHOL 0.0 LATA 350 ML	10	12	f	f	f	f	f	t	t	4	REFRIGERABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	t
15	\N	f	SANTA HELENA VINO DULCE 1.5 LT	SANTA HELENA VINO DULCE 1.5 LT	10	6	f	f	f	f	f	t	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
16	\N	f	SANTA HELENA VINO DULCE 750 ML	SANTA HELENA VINO DULCE 750 ML	10	12	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
17	\N	f	BRAHMA DUPLO MALTE BOT 330 ML 	BRAHMA DUPLO MALTE BOT 330 ML 	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
18	\N	f	SANTA HELENA REFRESCANTE ROSE 750 ML	SANTA HELENA REFRESCANTE ROSE 750 ML	10	12	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
21	\N	f	BRAHMA DUPLO MALTE BOT 600 ML 	BRAHMA DUPLO MALTE BOT 600 ML 	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
3	\N	f	DON FRANCO SALTO LAGER 330 ML	DON FRANCO SALTO LAGER 330 ML	10	1	f	f	f	f	f	t	t	1	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	t
4	\N	f	DON FRANCO IPA HAPPE 330 ML	DON FRANCO IPA HAPPE 330 ML	10	6	f	f	f	f	f	t	t	1	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	t
5	\N	f	SKOL LITRO RETORNABLE	SKOL LITRO RETORNABLE	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	t
6	\N	f	7 COLINAS VINO TINTO 3 L	7 COLINAS VINO TINTO 3 L	10	6	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
7	\N	f	BRAHMA SUB ZERO LATA 269 ML 	BRAHMA SUB ZERO LATA 269 ML 	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
9	\N	f	BRAHMA SUB ZERO BOT 340 ML RETORNABLE	BRAHMA SUB ZERO BOT 340 ML RETORNABLE	10	24	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
10	\N	f	7 COLINAS VINO TINTO 2 L	7 COLINAS VINO TINTO 2 L	10	6	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
11	\N	f	BRAHMA CHOPP LATA 269 ML 	BRAHMA CHOPP LATA 269 ML 	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
8	\N	f	7 COLINAS VINO TINTO 880 ML	7 COLINAS VINO TINTO 880 ML	10	12	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
12	\N	f	BRAHMA CHOPP BOT 340 ML RETORNABLE	BRAHMA CHOPP BOT 340 ML RETORNABLE	10	24	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
23	\N	f	SANTA HELENA ROSADO 1.5 L	SANTA HELENA ROSADO 1.5 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
24	\N	f	SANTA HELENA ROSE 750 ML	SANTA HELENA ROSE 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
25	\N	f	SANTA HELENA SELECCION DEL DIRECTORIO 750 ML	SANTA HELENA SELECCION DEL DIRECTORIO 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
26	\N	f	PILSEN BOT 340 NL RETORNABLE	PILSEN BOT 340 NL RETORNABLE	10	24	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
27	\N	f	PILSEN LITRO RETORNABLE	PILSEN LITRO RETORNABLE	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
28	\N	f	SKOL LATA 269 ML	SKOL LATA 269 ML	10	15	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
29	\N	f	SKOL BOT ABRE FACIL 275 ML 	SKOL BOT ABRE FACIL 275 ML 	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
30	\N	f	SKOL BOT PURO MALTE ABRE FACIL 275 ML	SKOL BOT PURO MALTE ABRE FACIL 275 ML	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
31	\N	f	SANTA HELENA TINTO 1.5 ML	SANTA HELENA TINTO 1.5 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
32	\N	f	CORONITA EXTRA 7FL. OZ. 210 ML	CORONITA EXTRA 7FL. OZ. 210 ML	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
33	\N	f	SANTA HELENA TINTO 750 ML	SANTA HELENA TINTO 750 ML	10	12	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
34	\N	f	CORONA BOT 355 ML	CORONA BOT 355 ML	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
35	\N	f	SANTA HELENA VERNUS 750 ML	SANTA HELENA VERNUS 750 ML	10	12	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
36	\N	f	CORONA BOT 710 ML 	CORONA BOT 710 ML 	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
37	\N	f	SANTA HELENA TINTO PACK 2 BOTELLA 750ML + 1 COPA	SANTA HELENA TINTO PACK 2 BOTELLA 750ML + 1 COPA	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
38	\N	f	CONCHA Y TORO CASILLERO DEL DIABLO RESERVA PRIVADA 750ML	CONCHA Y TORO CASILLERO DEL DIABLO RESERVA PRIVADA 750ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
39	\N	f	CONCHA Y TORO CASILLERO DEL DIABLO RVA CAB SAUV 750ML	CONCHA Y TORO CASILLERO DEL DIABLO RVA CAB SAUV 750ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
40	\N	f	CONCHA Y TORO EXPORTACION CAB SAUV 750 ML	CONCHA Y TORO EXPORTACION CAB SAUV 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
41	\N	f	CONCHA Y TORO EXPORTACION CABERNET SAUVIGNON 1.5 L	CONCHA Y TORO EXPORTACION CABERNET SAUVIGNON 1.5 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
42	\N	f	CONCHA Y TORO FRONTERA CAB. SAU. 750 ML	CONCHA Y TORO FRONTERA CAB. SAU. 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
43	\N	f	CONCHA Y TORO FRONTERA SAUV. BLANC 750 ML	CONCHA Y TORO FRONTERA SAUV. BLANC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
44	\N	f	CONCHA Y TORO GRAN RESERVA BLANC 750 ML	CONCHA Y TORO GRAN RESERVA BLANC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
45	\N	f	CONCHA Y TORO GRAN RESERVA RIBERAS CAB SAUV 750ML	CONCHA Y TORO GRAN RESERVA RIBERAS CAB SAUV 750ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
46	\N	f	CONCHA Y TORO RESERVADO CAB. SAUV.750 ML	CONCHA Y TORO RESERVADO CAB. SAUV.750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
47	\N	f	CONCHA Y TORO RESERVADO MERLOT 750 ML	CONCHA Y TORO RESERVADO MERLOT 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
48	\N	f	CONCHA Y TORO RESERVADO SAUV BLANCO 750 ML	CONCHA Y TORO RESERVADO SAUV BLANCO 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
49	\N	f	CORONA LATA 269 ML	CORONA LATA 269 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
83	\N	f	HEINEKEN BOT 650 ML	HEINEKEN BOT 650 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
1	\N	f	PILSEN EXTRA PURA MALTA LATA 310 ML 	PILSEN PURA MALTA LATA 310 ML 	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
52	\N	f	BUDWEISER 66 BOT 330 ML	BUDWEISER 66 BOT 330 ML	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
53	\N	f	BUDWEISER 66 CADILLAC BOT 550 ML 	BUDWEISER 66 CADILLAC BOT 550 ML 	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	12	/productos	\N	30	\N	t
50	\N	f	AURORA VINO MOSCATEL ESPUMANTE 750 ML	AURORA VINO MOSCATEL ESPUMANTE 750 ML	10	1	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	16	\N	f	f	2	/productos	\N	\N	\N	t
51	\N	f	AURORA ESPUMANTE BRUT 750 ML	AURORA ESPUMANTE BRUT 750 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	16	\N	f	f	2	/productos	\N	\N	\N	t
54	\N	f	BUDWEISER 66 LATA 269 ML	BUDWEISER 66 LATA 269 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
55	\N	f	AURORA JUGO DE UVA TINTO INTEGRAL 300 ML	AURORA JUGO DE UVA TINTO INTEGRAL 300 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	22	\N	f	f	2	/productos	\N	\N	\N	t
56	\N	f	AURORA JUGO DE UVA TINTO INTEGRAL 1 L	AURORA JUGO DE UVA TINTO INTEGRAL 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	22	\N	f	f	2	/productos	\N	\N	\N	t
57	\N	f	BUDWEISER BOT 340 ML RETORNABLE	BUDWEISER BOT 340 ML RETORNABLE	10	24	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
58	\N	f	AURORA JUGO DE UVA TINTO INTEGRAL 1.5 L	AURORA JUGO DE UVA TINTO INTEGRAL 1.5 L	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	22	\N	f	f	2	/productos	\N	\N	\N	t
59	\N	f	SANTA CAROLINA ESTRELLAS CAB SAUV 750ML	SANTA CAROLINA ESTRELLAS CAB SAUV 750ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
60	\N	f	SANTA CAROLINA ESTRELLAS CARMENERE 750 ML	SANTA CAROLINA ESTRELLAS CARMENERE 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
61	\N	f	BUDWEISER CADILLAC BOT 550 ML	BUDWEISER CADILLAC BOT 550 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
62	\N	f	SANTA CAROLINA PREMIO BLANCO 750 ML	SANTA CAROLINA PREMIO BLANCO 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
63	\N	f	BUDWEISER LATA 269 ML	BUDWEISER LATA 269 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
64	\N	f	SANTA CAROLINA PREMIO TINTO 1.5 L	SANTA CAROLINA PREMIO TINTO 1.5 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
65	\N	f	SANTA CAROLINA PREMIO TINTO 750 ML	SANTA CAROLINA PREMIO TINTO 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
66	\N	f	SANTA CAROLINA PREMIO TINTO DULCE 750 ML	SANTA CAROLINA PREMIO TINTO DULCE 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
67	\N	f	SANTA CAROLINA RESERVA CABERNET SAUVIGNON 750 ML	SANTA CAROLINA RESERVA CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
68	\N	f	SANTA CAROLINA RESERVA DE FAMILIA CABERNT SAUV 750 ML	SANTA CAROLINA RESERVA DE FAMILIA CABERNT SAUV 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
69	\N	f	SANTA CAROLINA RESERVA SAUVIGNON BLANC 750 ML	SANTA CAROLINA RESERVA SAUVIGNON BLANC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
71	\N	f	SANTA CAROLINA RESERVADO CABER SAUV CARM EDIC LTDA 750 ML	SANTA CAROLINA RESERVADO CABER SAUV CARM EDIC LTDA 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
72	\N	f	SANTA CAROLINA RESERVADO CABERNET SAUVIGNON 1.5 L	SANTA CAROLINA RESERVADO CABERNET SAUVIGNON 1.5 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
84	\N	f	QUINTA DO MORGADO BORDO TINTO SUAVE 1 L	QUINTA DO MORGADO BORDO TINTO SUAVE 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
73	\N	f	SANTA CAROLINA RESERVADO CABERNET SAUVIGNON 750 ML	SANTA CAROLINA RESERVADO CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
78	\N	f	SANTA CAROLINA RESERVADO CARMENERE 750 ML	SANTA CAROLINA RESERVADO CARMENERE 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
79	\N	f	HEINEKEN BOT 330 ML 	HEINEKEN BOT 330 ML 	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
81	\N	f	QUINTA DO MORGADO BLANCO SUAVE 750 ML	QUINTA DO MORGADO BLANCO SUAVE 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
82	\N	f	QUINTA DO MORGADO BORDO SUAVE 750 ML	QUINTA DO MORGADO BORDO SUAVE 750 ML	10	12	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
85	\N	f	QUINTA DO MORGADO ESPUMANTE DEMI SEC 660 ML	QUINTA DO MORGADO ESPUMANTE DEMI SEC 660 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	16	\N	f	f	2	/productos	\N	\N	\N	t
86	\N	f	QUINTA DO MORGADO ESPUMANTE MOSCATEL 660ML	QUINTA DO MORGADO ESPUMANTE MOSCATEL 660ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	16	\N	f	f	2	/productos	\N	\N	\N	t
87	\N	f	HEINEKEN PURO MALTE 0,0 ALCOHOL BOT 330 ML	HEINEKEN PURO MALTE 0,0 ALCOHOL BOT 330 ML	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
88	\N	f	QUINTA DO MORGADO ROSADO SUAVE 750 ML	QUINTA DO MORGADO ROSADO SUAVE 750 ML	10	12	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
89	\N	f	MILLER BOT 650 ML	MILLER BOT 650 ML	10	15	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
90	\N	f	MILLER BOT 355 ML	MILLER BOT 355 ML	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
91	\N	f	MILLER LATA 237 ML 8OZ	MILLER LATA 237 ML 8OZ	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
92	\N	f	QUINTA DO MORGADO SUAVE LATA 269 ML	QUINTA DO MORGADO SUAVE LATA 269 ML	10	12	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
93	\N	f	QUINTA DO MORGADO JUGO DE UVA INTEGRAL 300 ML	QUINTA DO MORGADO JUGO DE UVA INTEGRAL 300 ML	10	1	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
94	\N	f	QUINTA DO MORGADO JUGO DE UVA INTEGRAL 1 L	QUINTA DO MORGADO JUGO DE UVA INTEGRAL 1 L	10	1	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	22	\N	f	f	2	/productos	\N	\N	\N	t
95	\N	f	QUINTA DO MORGADO SUCO DE UVA TINTO 330 ML	QUINTA DO MORGADO SUCO DE UVA TINTO 330 ML	10	1	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	22	\N	f	f	2	/productos	\N	\N	\N	t
96	\N	f	QUINTA DO MORGADO TINTO SUAVE 1 L	QUINTA DO MORGADO TINTO SUAVE 1 L	10	12	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
97	\N	f	QUINTA DO MORGADO TINTO SUAVE 2 LT	QUINTA DO MORGADO TINTO SUAVE 2 LT	10	6	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
98	\N	f	QUINTA DO MORGADO TINTO SUAVE 245 ML	QUINTA DO MORGADO TINTO SUAVE 245 ML	10	1	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
80	\N	f	TEST PRODUCTO IMAGEN 2	TEST PRODUCTO IMAGEN 2	10	1	f	f	f	f	f	t	t	1	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	t
99	\N	f	QUINTA DO MORGADO TINTO SUAVE 750 ML	QUINTA DO MORGADO TINTO SUAVE 750 ML	10	12	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
100	\N	f	SAN PEDRO GATO NEGRO CABERNET SAUVIGNON 750 ML	SAN PEDRO GATO NEGRO CABERNET SAUVIGNON 750 ML	10	12	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
101	\N	f	CANCAO VINO SUAVE 750 ML	CANCAO VINO SUAVE 750 ML	10	12	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
102	\N	f	CANCAO VINO SUAVE 1 L	CANCAO VINO SUAVE 1 L	10	1	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
105	\N	f	LA CELIA EUGENIO BUSTOS CABERNET SAUVIGNON 750 ML	LA CELIA EUGENIO BUSTOS CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
103	\N	f	CANCAO VINO 1.5L	CANCAO VINO 1.5L	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
460	\N	f	LEON POPULAR 875ML	LEON POPULAR 875ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
461	\N	f	JOHNNIE WALKER BLACK LABEL 500 ML	JOHNNIE WALKER BLACK LABEL 500 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
106	\N	f	LUIGI BOSCA CABERNET SAUVIGNON 750 ML	LUIGI BOSCA CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
107	\N	f	LUIGI BOSCA CABERNET - MALBEC 750 ML	LUIGI BOSCA CABERNET - MALBEC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
108	\N	f	LUIGI BOSCA MALBEC 750 ML	LUIGI BOSCA MALBEC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
109	\N	f	LATITUD 33 CABERNET SAUVIGNON 750 ML	LATITUD 33 CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
110	\N	f	LATITUD 33 MALBEC 750 ML	LATITUD 33 MALBEC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
111	\N	f	NAVARRO CORREA RESERVA CABERNET SAUVIGNON 750 ML	NAVARRO CORREA RESERVA CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
112	\N	f	NAVARRO CORREAS COLECCION PRIVADA CAB SAU 750 ML	NAVARRO CORREAS COLECCION PRIVADA CAB SAU 750 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
113	\N	f	NAVARRO CORREAS COLECCION PRIVADA MALBEC 750 ML	NAVARRO CORREAS COLECCION PRIVADA MALBEC 750 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
114	\N	f	NAVARRO CORREAS ESPUMANTE EXTRA BRUT 750 ML	NAVARRO CORREAS ESPUMANTE EXTRA BRUT 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	16	\N	f	f	2	/productos	\N	\N	\N	t
115	\N	f	NAVARRO CORREAS GRAN LOS ARBOLES MALBEC 750 ML	NAVARRO CORREAS GRAN LOS ARBOLES MALBEC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
116	\N	f	NAVARRO CORREAS LOS ARBOLES CAB SAUV 750 ML	NAVARRO CORREAS LOS ARBOLES CAB SAUV 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
117	\N	f	NAVARRO CORREAS LOS ARBOLES CAB. MALBEC 750 ML	NAVARRO CORREAS LOS ARBOLES CAB. MALBEC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
118	\N	f	NAVARRO CORREAS LOS ARBOLES MALBEC 750 ML	NAVARRO CORREAS LOS ARBOLES MALBEC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
119	\N	f	MILLER LATA 296 ML 	MILLER LATA 296 ML 	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
120	\N	f	MILLER LATA 355 ML	MILLER LATA 355 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
121	\N	f	FINCA LA LINDA CABERNET SAUVIGNON 750 ML	FINCA LA LINDA CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
122	\N	f	FINCA LA LINDA MALBEC 750 ML	FINCA LA LINDA MALBEC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
123	\N	f	TRAPICHE VINEYARD CABERNET SAUVIGNON 750 ML	TRAPICHE VINEYARD CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
124	\N	f	TRAPICHE VINEYARD MALBEC 750 ML	TRAPICHE VINEYARD MALBEC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
125	\N	f	FINCA DO CARVALHO TINTO SUAVE 1 LT	FINCA DO CARVALHO TINTO SUAVE 1 LT	10	12	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
126	\N	f	FINCA DO CARVALHO TINTO SUAVE 2 LT	FINCA DO CARVALHO TINTO SUAVE 2 LT	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
127	\N	f	FINCA DO CARVALHO TINTO SUAVE 750 ML	FINCA DO CARVALHO TINTO SUAVE 750 ML	10	12	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
128	\N	f	BODEGA PRIVADA CABERNET SAUVIGNON 750ML	BODEGA PRIVADA CABERNET SAUVIGNON 750ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
129	\N	f	BODEGA PRIVADA TINTO MALBEC 750 ML	BODEGA PRIVADA TINTO MALBEC 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
130	\N	f	MILLER HIGH LIFE BOT 710 ML	MILLER HIGH LIFE BOT 710 ML	10	15	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
131	\N	f	BODEGA PRIVADA VINO BLEND RED 750 ML	BODEGA PRIVADA VINO BLEND RED 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
132	\N	f	TORO CENTENARIO CABERNET SAUVIGNON 750 ML	TORO CENTENARIO CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
133	\N	f	ANTARCTICA ORIGINAL LATA 269 ML	ANTARCTICA ORIGINAL LATA 269 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
134	\N	f	TORO VIEJO BIVARIETAL BONARDA SIRAH 1.125 L	TORO VIEJO BIVARIETAL BONARDA SIRAH 1.125 L	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
135	\N	f	ANTARCTICA ORIGINAL BOT 300 ML	ANTARCTICA ORIGINAL BOT 300 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
136	\N	f	TORO CENTENARIO VINO TINTO 750 ML	TORO CENTENARIO VINO TINTO 750 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
230	\N	f	CONTI BIER BOT 600ML	CONTI BIER BOT 600ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	600	\N	t
137	\N	f	TORO VIEJO BIVARIETAL BONARDA SIRAH 750 ML	TORO VIEJO BIVARIETAL BONARDA SIRAH 750 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
138	\N	f	TORO VIEJO CHENIN TORRONTES BLANCO 750 ML	TORO VIEJO CHENIN TORRONTES BLANCO 750 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
139	\N	f	TORO VIEJO CLASICO 1.125 ML	TORO VIEJO CLASICO 1.125 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
140	\N	f	TORO VIEJO CLASICO BLANCO 700 ML	TORO VIEJO CLASICO BLANCO 700 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
141	\N	f	TORO VIEJO TINTO CLASICO 700 ML	TORO VIEJO TINTO CLASICO 700 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
142	\N	f	TORO VIEJO VINO ROSADO 700 ML	TORO VIEJO VINO ROSADO 700 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
143	\N	f	TORO CENTENARIO MALBEC 750 ML	TORO CENTENARIO MALBEC 750 ML	10	6	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
144	\N	f	ANTARCTICA ORIGINAL BOT 600 ML	ANTARCTICA ORIGINAL BOT 600 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
146	\N	f	OURO FINO LATA 269 ML	OURO FINO LATA 269 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
147	\N	f	STELLA ARTOIS BOT 330 ML 	STELLA ARTOIS BOT 330 ML 	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
148	\N	f	STELLA ARTOIS BOT 660 ML 	STELLA ARTOIS BOT 660 ML 	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
149	\N	f	STELLA ARTOIS LATA 250 ML	STELLA ARTOIS LATA 250 ML	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	24	/productos	\N	30	\N	t
150	\N	f	OURO FINO LITRO RETORNABLE	OURO FINO LITRO RETORNABLE	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
151	\N	f	ITAIPAVA BOT 600 ML RETORNABLE	ITAIPAVA BOT 600 ML RETORNABLE	10	24	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
152	\N	f	ITAIPAVA BOT 250 ML	ITAIPAVA BOT 250 ML	10	6	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	12	/productos	\N	30	\N	t
153	\N	f	BRAHMA LITRO RETORNABLE	BRAHMA LITRO RETORNABLE	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
154	\N	f	ITAIPAVA LATA 269 ML	ITAIPAVA LATA 269 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
155	\N	f	POLAR ICE LATA 269 ML	POLAR ICE LATA 269 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
156	\N	f	BURGUESA LATA 269 ML	BURGUESA LATA 269 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
157	\N	f	MUNICH ORIGINAL BOT LITRO RETORNABLE	MUNICH ORIGINAL BOT LITRO RETORNABLE	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
158	\N	f	MUNICH ORIGINAL LATA 269 ML	MUNICH ORIGINAL LATA 269 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
159	\N	f	MUNICH ROYAL BOT 350 ML	MUNICH ROYAL BOT 350 ML	10	12	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
2	\N	f	PILSEN CLASICA LATA 269 ML	PILSEN CLASICA LATA 269 ML	10	1	f	f	f	f	f	t	t	1	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
160	\N	f	PRUEBA PRODUCTO 5	PRUEBA PRODUCTO 5	10	1	f	f	f	f	f	t	t	1	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	t
162	\N	f	PRUDUCTO SIN CODIGO	PRUDUCTO SIN CODIGO	\N	1	f	f	f	f	f	t	t	1	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	t
198	\N	f	SANTA HELENA RESERVADO CABERNET SAUV 750 ML	SANTA HELENA RESERVADO CABERNET SAUV 750 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
199	\N	f	SANTA HELENA RESERVADO CARMENERE 750 ML	SANTA HELENA RESERVADO CARMENERE 750 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
201	\N	f	SANTA HELENA RESERVADO MERLOT 750 ML	SANTA HELENA RESERVADO MERLOT 750 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
203	\N	f	PRUEBA PRODUCTO 6	PRUEBA PRODUCTO 6	10	1	t	f	f	f	f	t	t	2	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	t
204	\N	f	HEINEKEN LATA 250 ML 	HEINEKEN LATA 250 ML 	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
205	\N	f	HEINEKEN DRAUGHTKET 5L	HEINEKEN DRAUGHTKET 5L	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
206	\N	f	PILSEN PURA MALTA LITRO RETORNABLE	PILSEN PURA MALTA LITRO RETORNABLE	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
207	\N	f	MILLER HIGH LIFE BOT 355ML	MILLER HIGH LIFE BOT 355ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
165	\N	f	TEST PRODUCTO VALUE	TEST PRODUCTO VALUE	\N	1	f	f	f	f	f	t	t	1	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	f
166	\N	f	TEST PRODUCTO VALUE 2	TEST PRODUCTO VALUE	\N	1	f	f	f	f	f	t	t	1	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	\N	\N	f
212	\N	f	KAISER LATA 269ML	KAISER LATA 269ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
213	\N	f	KAISER ULTRA CERO LATA 269ML	KAISER ULTRA CERO LATA 269ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
215	\N	f	NORTE BLANCA CERVEZA LATA 269ML	NORTE BLANCA CERVEZA LATA 269ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
220	\N	f	AMSTEL BIER BOT 650ML	AMSTEL BIER BOT 650ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
221	\N	f	AMSTEL BIER BOT 355ML	AMSTEL BIER BOT 355ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
222	\N	f	AMSTEL BIER LATA 250ML	AMSTEL BIER LATA 250ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
224	\N	f	AMSTEL LAGER LATA 350ML	AMSTEL LAGER LATA 350ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
225	\N	f	SKOL PROFISA BOT 330ML	SKOL PROFISA BOT 330ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
226	\N	f	CONTI ZERO GRAU LATA 269ML	CONTI ZERO GRAU LATA 269ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
227	\N	f	CONTI ZERO GRAU BOT 330ML	CONTI ZERO GRAU BOT 330ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
228	\N	f	CONTI ZERO GRAU BOT 660ML	CONTI ZERO GRAU BOT 660ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
229	\N	f	CONTI BIER LATA 269ML	CONTI BIER LATA 269ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
231	\N	f	EISENBAHN PILSEN LATA 350ML	EISENBAHN PILSEN LATA 350ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
232	\N	f	EISENBAHN PILSEN BOT 355ML	EISENBAHN PILSEN BOT 355ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
145	\N	f	OURO FINO LATA 354 ML	OURO FINO LATA 354 ML	10	1	f	f	f	f	f	t	t	2	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
235	\N	f	EISENBAHN PILSEN BOT 600ML	EISENBAHN PILSEN BOT 600ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
236	\N	f	EISENBAHN PALE ALE LATA 350ML	EISENBAHN PALE ALE LATA 350ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
238	\N	f	EISENBAHN AMERICAN IPA LATA 350ML	EISENBAHN AMERICAN IPA LATA 350ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
239	\N	f	MUNICH ROYAL LATA 269ML	MUNICH ROYAL LATA 269ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
242	\N	f	ESTRELLA GALICIA NEGRA 0.0 ALCOHOL BOT 250 ML	ESTRELLA GALICIA NEGRA 0.0 ALCOHOL BOT 250 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
241	\N	f	ESTRELLA GALICIA SIN GLUTEN BOT 330 ML	ESTRELLA GALICIA SIN GLUTEN BOT 330 ML	10	1	f	f	f	f	f	t	t	2	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
243	\N	f	ESTRELLA GALICIA 0.0 ALCOHOL 250 ML	ESTRELLA GALICIA 0.0 ALCOHOL 250 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
244	\N	f	ESTRELLA GALICIA PREMIUM LAGER BOT 355 ML	ESTRELLA GALICIA PREMIUM LAGER BOT 355 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
245	\N	f	ESTRELLA GALICIA WORLD LAGER 355ML 	ESTRELLA GALICIA WORLD LAGER 355ML 	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
247	\N	f	MIKS NÂº 2 DURAZNO BOT 275ML	MIKS NÂº 2 DURAZNO BOT 275ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	30	\N	t
248	\N	f	MIKS NÂº 3 FRUTAS VERDES BOT 275 ML	MIKS NÂº 3 FRUTAS VERDES BOT 275 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	30	\N	t
249	\N	f	MIKS NÂº 4 CITRUS BOT 275 ML	MIKS NÂº 4 CITRUS BOT 275 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	30	\N	t
250	\N	f	MIKS NÂº5 LIMON BOT 275 ML	MIKS NÂº5 LIMON BOT 275 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	30	\N	t
246	\N	f	MIKS  NÂº 1 FRUTILLA BOT 275ML	MIKS  NÂº 1 FRUTILLA BOT 275ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	30	\N	t
251	\N	f	SMIRNOFF ICE BOT 275 ML	SMIRNOFF ICE BOT 275 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	30	\N	t
252	\N	f	RED BULL ENERGY DRINK LATA 250 ML	RED BULL ENERGY DRINK LATA 250 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	23	\N	f	f	2	/productos	\N	30	\N	t
253	\N	f	RED BULL ENERGY DRINK LATA 473 ML	RED BULL ENERGY DRINK LATA 473 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	23	\N	f	f	2	/productos	\N	30	\N	t
254	\N	f	RED BULL THE COCO EDITION LATA 250 ML	RED BULL THE COCO EDITION LATA 250 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	23	\N	f	f	2	/productos	\N	30	\N	t
255	\N	f	RED BULL THE TROPICAL EDITION LATA 250 ML	RED BULL THE TROPICAL EDITION LATA 250 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	23	\N	f	f	2	/productos	\N	30	\N	t
256	\N	f	RED BULL THE ACAI EDITION LATA 250 ML	RED BULL THE ACAI EDITION LATA 250 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	23	\N	f	f	2	/productos	\N	30	\N	t
257	\N	f	RED BULL THE RED / MELANCIA EDITION LATA 250 ML	RED BULL THE RED / MELANCIA EDITION LATA 250 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	23	\N	f	f	2	/productos	\N	30	\N	t
258	\N	f	CONTI GASEOSA UVA 2LT	CONTI GASEOSA UVA 2LT	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
259	\N	f	TRES LEONES CAÑA ESPECIAL 875ML	TRES LEONES CAÑA ESPECIAL 875ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
261	\N	f	LEON POPULAR 425 ML	LEON POPULAR 425 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	30	\N	t
262	\N	f	TALLARICO VINO TINTO SUAVE 750 ML	TALLARICO VINO TINTO SUAVE 750 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
263	\N	f	SANTANDER SIDRA 910ML	SANTANDER SIDRA 910ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	16	\N	f	f	2	/productos	\N	30	\N	t
264	\N	f	LA FARRUKA FRESAS FIZZ 710 ML	LA FARRUKA FRESAS FIZZ 710 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	16	\N	f	f	2	/productos	\N	30	\N	t
265	\N	f	NOVECENTO VINO CABERNET SAUVIGNON 750ML	NOVECENTO VINO CABERNET SAUVIGNON 750ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
266	\N	f	NOVECENTO VINO MALBEC 750ML	NOVECENTO VINO MALBEC 750ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
267	\N	f	ESPIRITU DE CHILE CARMENERE CLASICO 750 ML	ESPIRITU DE CHILE CARMENERE CLASICO 750 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
268	\N	f	ESPIRITU DE CHILE CABERNET SAUVIGNON CLASICO 750 ML	ESPIRITU DE CHILE CABERNET SAUVIGNON CLASICO 750 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
269	\N	f	VIÑAS DE BALBO 1.250 ML 	VIÑAS DE BALBO 1.250 ML 	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
270	\N	f	PULP NARANJA 1L	PULP NARANJA 1L	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
271	\N	f	PULP POMELO 1 L	PULP POMELO 1 L	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
272	\N	f	VINO CANCILLER BLEND MERLOT SYRAH MALBEC 750ML	VINO CANCILLER BLEND MERLOT SYRAH MALBEC 750ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
273	\N	f	BAUDUCCO WAFER VAINILLA 140G	BAUDUCCO WAFER VAINILLA 140G	10	1	f	f	t	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	30	30	\N	t
274	\N	f	BAUDUCCO WAFER FRUTILLA 140G	BAUDUCCO WAFER FRUTILLA 140G	10	1	f	f	t	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	30	30	\N	t
275	\N	f	NESTLE ESPECIALIDADES 2511G ROJO	NESTLE ESPECIALIDADES 2511G ROJO	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	24	\N	f	f	2	/productos	\N	30	\N	t
276	\N	f	CAVALARO LAVANDA DESODORANTE DE AMBIENTE  900ML	CAVALARO LAVANDA DESODORANTE DE AMBIENTE  900ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	6	\N	f	f	2	/productos	\N	30	\N	t
277	\N	f	MINTY MENTA  17G X 40	MINTY MENTA  17G X 40	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	25	\N	f	f	2	/productos	\N	30	\N	t
278	\N	f	FREEGELLS 10 UNIDAD 31,7G	FREEGELLS 10 UNIDAD 31,7G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	25	\N	f	f	2	/productos	\N	30	\N	t
279	\N	f	TOPLINE VARIOS 6 UND 11G	TOPLINE VARIOS 6 UND 11G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	25	\N	f	f	2	/productos	\N	30	\N	t
280	\N	f	ARCOR MENTHOPLUS VARIOS 30,6G	ARCOR MENTHOPLUS VARIOS 30,6G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	25	\N	f	f	2	/productos	\N	\N	\N	t
281	\N	f	ELMA CHIPS BACONZITOS 28G	ELMA CHIPS BACONZITOS 28G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
282	\N	f	FANDANGOS FAMILIA PRESUNTO  140G / 164G 	FANDANGOS FAMILIA PRESUNTO  140G / 164G 	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
283	\N	f	FANDANGOS FAMILIA PRESUNTO 45G / 59G	FANDANGOS FAMILIA PRESUNTO 45G / 59G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
284	\N	f	FANDANGOS FAMILIA QUEIJO ASADO 140G / 164G	FANDANGOS FAMILIA QUEIJO ASADO 140G / 164G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
285	\N	f	CHEETOS LUA PARMEZAO 140G	CHEETOS LUA PARMEZAO 140G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
286	\N	f	ELMA CHIPS BACONZITOS 103G	ELMA CHIPS BACONZITOS 103G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
287	\N	f	FANDANGOS FAMILIA QUEIJO ASADO 45G / 59G	FANDANGOS FAMILIA QUEIJO ASADO 45G / 59G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
288	\N	f	KURUPI YERBA CEDRON CAPI 500G	KURUPI YERBA CEDRON CAPI 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	30	\N	t
289	\N	f	KURUPI YERBA CITRUS YORADOR 500G	KURUPI YERBA CITRUS YORADOR 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	30	\N	t
290	\N	f	KURUPI YERBA MENTA Y BOLDO 500G	KURUPI YERBA MENTA Y BOLDO 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	30	\N	t
291	\N	f	KURUPI YERBA CLASICA 500G	KURUPI YERBA CLASICA 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	30	\N	t
292	\N	f	KURUPI YERBA KATUAVA 250G	KURUPI YERBA KATUAVA 250G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	30	\N	t
293	\N	f	KURUPI YERBA MENTA Y BOLDO 250G	KURUPI YERBA MENTA Y BOLDO 250G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	30	\N	t
294	\N	f	KURUPI YERBA KAPI`I Y MENTA 250G	KURUPI YERBA KAPI`I Y MENTA 250G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	30	\N	t
295	\N	f	MOGUL CEREBRITOS 30G	MOGUL CEREBRITOS 30G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	25	\N	f	f	2	/productos	\N	30	\N	t
296	\N	f	MOGUL VIBORITAS 30G	MOGUL VIBORITAS 30G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	25	\N	f	f	2	/productos	\N	30	\N	t
297	\N	f	HELLMANNS KETCHUP DOYPACK 500G	HELLMANNS KETCHUP DOYPACK 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	30	\N	t
298	\N	f	EXTRA PEPPERMINT 15 STICKS 	EXTRA PEPPERMINT 15 STICKS 	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	25	\N	f	f	2	/productos	\N	30	\N	t
299	\N	f	EXTRA SPEARMINT 15 STICKS	EXTRA SPEARMINT 15 STICKS	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	25	\N	f	f	2	/productos	\N	30	\N	t
301	\N	f	WATTS NECTAR DE MANZANA 200 ML	WATTS NECTAR DE MANZANA 200 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	22	\N	f	f	2	/productos	\N	30	\N	t
302	\N	f	WATTS NECTAR DE NARANJA 200 ML	WATTS NECTAR DE NARANJA 200 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	22	\N	f	f	2	/productos	\N	30	\N	t
303	\N	f	SALADIX DE PIZZA 100 G 	SALADIX DE PIZZA 100 G 	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
304	\N	f	SALADIX DE JAMON Y QUESO DE 80 G	SALADIX DE JAMON Y QUESO DE 80 G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
305	\N	f	AMENDUPA SANCKS DE PIZZA 50G	AMENDUPA SANCKS DE PIZZA 50G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
300	\N	f	AMENDUPA SNACKS DE QUEIJO 50G	AMENDUPA SNACKS DE QUEIJO 50G	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
306	\N	f	AMENDUPA SNACKS DE COSTELINHA SUINA 50G	AMENDUPA SNACKS DE COSTELINHA SUINA 50G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
307	\N	f	AMENDUPA SNACKS DE BACON 50G	AMENDUPA SNACKS DE BACON 50G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
308	\N	f	CAVALLARO AZAHAR DESODORANTE DE AMBIENTE 900 ML	CAVALLARO AZAHAR DESODORANTE DE AMBIENTE 900 ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	6	\N	f	f	2	/productos	\N	\N	\N	t
309	\N	f	YPE DETERGENTE NEUTRO 500 ML	YPE DETERGENTE NEUTRO 500 ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	6	\N	f	f	2	/productos	\N	\N	\N	t
310	\N	f	YPE DETERGENTE MANZANA 500 ML	YPE DETERGENTE MANZANA 500 ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	6	\N	f	f	2	/productos	\N	\N	\N	t
311	\N	f	SAN DIEGO PALMITO EN TROZOS 800 G	SAN DIEGO PALMITO EN TROZOS 800 G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	19	\N	f	f	2	/productos	\N	30	\N	t
312	\N	f	GILLETTE PRSTOBARBA ULTRAGRIP	GILLETTE PRSTOBARBA ULTRAGRIP	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	6	\N	f	f	2	/productos	\N	\N	\N	t
313	\N	f	BON O BON VARIOS 450 GR X 30 UNIDAD	BON O BON VARIOS 450 GR X 30 UNIDAD	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	24	\N	f	f	2	/productos	\N	30	\N	t
314	\N	f	SAVORA MOSTAZA SACHET 250 G	SAVORA MOSTAZA SACHET 250 G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	30	\N	t
315	\N	f	BAUDUCCO WAFER CHOCOLATE 140 G	BAUDUCCO WAFER CHOCOLATE 140 G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	18	\N	f	f	2	/productos	\N	30	\N	t
316	\N	f	PULP NARANJA 2 L	PULP NARANJA 2 L	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
317	\N	f	PULP POMELO 2L	PULP POMELO 2L	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
318	\N	f	MIRINDA GUARANA 2L	MIRINDA GUARANA 2L	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
319	\N	f	DE LA COSTA AGUA SIN GAS 500ML	DE LA COSTA AGUA SIN GAS 500ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	5	\N	f	f	2	/productos	\N	30	\N	t
320	\N	f	COROTE COCTEL TUTTI FRUTTI 500ML	COROTE COCTEL TUTTI FRUTTI 500ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
321	\N	f	COROTE COCTEL SABOR FRUTILLA 500ML	COROTE COCTEL SABOR FRUTILLA 500ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	30	\N	t
322	\N	f	COROTE COCTEL BLUEBERRY 500ML	COROTE COCTEL BLUEBERRY 500ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	30	\N	t
323	\N	f	FORTIN RON COCO 750ML	FORTIN RON COCO 750ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	30	\N	t
324	\N	f	XERETA COLA 2 L	XERETA COLA 2 L	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
325	\N	f	FORTIN RON BLANCO 750ML	FORTIN RON BLANCO 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	30	\N	t
326	\N	f	FORTIN RON CANELA 750ML	FORTIN RON CANELA 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
327	\N	f	FORTIN RON LIMON 750ML	FORTIN RON LIMON 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
328	\N	f	XERETA TUBAINA 2 L	XERETA TUBAINA 2 L	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
329	\N	f	CATUABA RANDON ACAI 900 ML	CATUABA RANDON ACAI 900 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
330	\N	f	CATUABA PITOLA 900 ML	CATUABA PITOLA 900 ML	10	1	f	f	f	f	f	f	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
331	\N	f	SALTOS AGUA SIN GAS CON PICO 1L	SALTOS AGUA SIN GAS CON PICO 1L	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	5	\N	f	f	2	/productos	\N	30	\N	t
332	\N	f	PITOLA AMENDUIM 900 ML	PITOLA AMENDUIM 900 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
333	\N	f	CAMPESINO YERBA MENTA Y BOLDO 500 G	CAMPESINO YERBA MENTA Y BOLDO 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
334	\N	f	FORTIN RESERVA ESPECIAL 8 AÑOS 750ML	FORTIN RESERVA ESPECIAL 8 AÑOS 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
335	\N	f	CAMPESINO YERBA FITNESS 500 G	CAMPESINO YERBA FITNESS 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
336	\N	f	CAMPESINO YERBA TRADICIONAL HIERBAS NAT 500 G	CAMPESINO YERBA TRADICIONAL HIERBAS NAT 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
337	\N	f	PAJARITO YERBA ELABORADA 500 G	PAJARITO YERBA ELABORADA 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
338	\N	f	KURUPI YERBA MENTA Y LIMON 500 G	KURUPI YERBA MENTA Y LIMON 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
339	\N	f	COLON YERBA SELECCION ESPECIAL 500 G	COLON YERBA SELECCION ESPECIAL 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
340	\N	f	COLON YERBA TRADICIONAL 500 G	COLON YERBA TRADICIONAL 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
341	\N	f	JOINVILLE VASO (7941) 680ML	JOINVILLE VASO (7941) 680ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
342	\N	f	KURUPI YERBA TRADICIONAL 100% 250 G	KURUPI YERBA TRADICIONAL 100% 250 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
343	\N	f	NADIR MUNICH VASO (7709) 300ML	NADIR MUNICH VASO (7709) 300ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
344	\N	f	KURUPI YERBA TRADICIONAL 100% 500 G	KURUPI YERBA TRADICIONAL 100% 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
345	\N	f	CAMPESINO YERBA TRADICIONAL HIERBAS NAT 250 G	CAMPESINO YERBA TRADICIONAL HIERBAS NAT 250 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
346	\N	f	RANDON VINO TINTO SUAVE 750 ML	RANDON VINO TINTO SUAVE 750 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	30	\N	t
347	\N	f	KURUPI YERBA CITRUS YORADOR 250 G	KURUPI YERBA CITRUS YORADOR 250 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
348	\N	f	VASO (7909) MUNICH 530ML 	VASO (7909) MUNICH 530ML 	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
349	\N	f	NADIR MUNICH VASO (7109) 200ML	NADIR MUNICH VASO (7109) 200ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
350	\N	f	NADIR STOUT VASO (7051) 473ML	NADIR STOUT VASO (7051) 473ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
351	\N	f	LONDON VASO (7551) 540ML	LONDON VASO (7551) 540ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
352	\N	f	NADIR COPA GIN (7948) 600ML	NADIR COPA GIN (7948) 600ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
353	\N	f	CONTROL ADAPTA RETARDANTE 3 UNID	CONTROL ADAPTA RETARDANTE 3 UNID	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	30	\N	f	f	2	/productos	\N	\N	\N	t
354	\N	f	NADIR COPA EMPERATRIZ (7933) 590ML	NADIR COPA EMPERATRIZ (7933) 590ML	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
355	\N	f	CONTROL ADAPTA NATURE 3 UNID	CONTROL ADAPTA NATURE 3 UNID	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	30	\N	f	f	2	/productos	\N	\N	\N	t
356	\N	f	CONTROL ADAPTA RETARDANTE X 6 UNID	CONTROL ADAPTA RETARDANTE X 6 UNID	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	30	\N	f	f	2	/productos	\N	\N	\N	t
357	\N	f	AROCOIRIS SAL CONDIMENTADA CON CURUCUMA 400G	AROCOIRIS SAL CONDIMENTADA CON CURUCUMA 400G	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
358	\N	f	WINDSOR COPA (7128) 250 ML	WINDSOR COPA (7128) 250 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
359	\N	f	TEMPEROS MAIS VIDA SAL GROSSO VERDE 500G	TEMPEROS MAIS VIDA SAL GROSSO VERDE 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
360	\N	f	PAJARITO YERBA HIERBAS NATURALES 500 G	PAJARITO YERBA HIERBAS NATURALES 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
361	\N	f	COLON YERBA MATE SUAVE 500 G	COLON YERBA MATE SUAVE 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
362	\N	f	COLON YERBA STEVIA KAA HEE 250 G	COLON YERBA STEVIA KAA HEE 250 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
363	\N	f	CAMPESINO YERBA MANZANILLA Y ANIS 250 G	CAMPESINO YERBA MANZANILLA Y ANIS 250 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
364	\N	f	ARCOIRIS SAL MARINA FINA 500G	ARCOIRIS SAL MARINA FINA 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
365	\N	f	CAMPESINO YERBA CEDRON 500 G	CAMPESINO YERBA CEDRON 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
366	\N	f	COLON YERBA MENTA-BOLDO 500 G	COLON YERBA MENTA-BOLDO 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
367	\N	f	TEMPEROS MAIS VIDA SAL GROSSO ROJO 500G	TEMPEROS MAIS VIDA SAL GROSSO ROJO 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
368	\N	f	CAMPESINO YERBA DOBLE MENTA Y BOLDO 500 G	CAMPESINO YERBA DOBLE MENTA Y BOLDO 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
369	\N	f	ARCOIRIS SAL FINA YODADA 500G	ARCOIRIS SAL FINA YODADA 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
370	\N	f	COLON YERBA MORINGA KATUAVA BURRITO 500 G	COLON YERBA MORINGA KATUAVA BURRITO 500 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	\N	\N	t
371	\N	f	COLON YERBA TRADICIONAL 250 G	COLON YERBA TRADICIONAL 250 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
373	\N	f	ARCOIRIS SAL CONDIMENTADA 400G	ARCOIRIS SAL CONDIMENTADA 400G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
374	\N	f	ARCOIRIS SAL ENTREFINA AHUMADA 400G	ARCOIRIS SAL ENTREFINA AHUMADA 400G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
375	\N	f	PARRILLITA DE ALUMINIO DESMONTABLE	PARRILLITA DE ALUMINIO DESMONTABLE	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
376	\N	f	100 PIPERS 1 L WHISKY	100 PIPERS 1 L WHISKY	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
377	\N	f	GRAN PAR WHISKY 1 L	GRAN PAR WHISKY 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
378	\N	f	ARCOIRIS SAL CONDIMENTADA CON PIMIENTA 400G	ARCOIRIS SAL CONDIMENTADA CON PIMIENTA 400G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
379	\N	f	ARCOIRIS SAL FINA MARINA CONDIMENTADA 400G	ARCOIRIS SAL FINA MARINA CONDIMENTADA 400G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
380	\N	f	ARCOIRIS SAL ENTREFINA MARINA CONDIMENTADA 400G	ARCOIRIS SAL ENTREFINA MARINA CONDIMENTADA 400G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
381	\N	f	TEMPEROS MAIS VIDA SAL CONDIMENTADA 500G	TEMPEROS MAIS VIDA SAL CONDIMENTADA 500G	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
382	\N	f	CLAN MAC GREGOR 1 L	CLAN MAC GREGOR 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
383	\N	f	GARÇA GRILL SAL GRUEZA 1KG	GARÇA GRILL SAL GRUEZA 1KG	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
384	\N	f	CAMPO LARGO TINTO SUAVE 750 ML	CAMPO LARGO TINTO SUAVE 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
385	\N	f	JOHNNIE WALKER RED LABEL 200 ML	JOHNNIE WALKER RED LABEL 200 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
387	\N	f	JOHNNIE WALKER BLACK 200 ML	JOHNNIE WALKER BLACK 200 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
386	\N	f	PAPEL HIGIENICO DUPLA HOJA VARIOS  X UNIDAD	PAPEL HIGIENICO DUPLA HOJA VARIOS  X UNIDAD	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	6	\N	f	f	2	/productos	\N	\N	\N	t
388	\N	f	GRANTS 200 ML	GRANTS 200 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
389	\N	f	JOHNNIE WALKER BLACK LABEL 375 ML	JOHNNIE WALKER BLACK LABEL 375 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
390	\N	f	TANQUERAY DRY GIN 750 ML	TANQUERAY DRY GIN 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
391	\N	f	OLD TRADI CARTA DE PLATA 500 ML	OLD TRADI CARTA DE PLATA 500 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
392	\N	f	ECOPOWER CARGADOR DE IPHONE 2.1A EP7052	ECOPOWER CARGADOR DE IPHONE 2.1A EP7052	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	14	\N	f	f	2	/productos	\N	\N	\N	t
393	\N	f	SMIRNOFF VODKA 1 L	SMIRNOFF VODKA 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
394	\N	f	SIR ALBERT PREMIUM RESERVE 1 L	SIR ALBERT PREMIUM RESERVE 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
395	\N	f	ENCENDEDOR VARIOS	ENCENDEDOR VARIOS	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	32	\N	f	f	2	/productos	\N	\N	\N	t
396	\N	f	CAPEL PISCO SOUR 700 ML	CAPEL PISCO SOUR 700 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
397	\N	f	JOHN BARR WHISKY 1 L	JOHN BARR WHISKY 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
398	\N	f	JOSE CUERVO REPOSADO 750 ML	JOSE CUERVO REPOSADO 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
399	\N	f	STOLICHNAYA VODKA 1 L	STOLICHNAYA VODKA 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
400	\N	f	BOMBAY SAPPHIRE DRY GIN 750 ML	BOMBAY SAPPHIRE DRY GIN 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
401	\N	f	AMARULA LICOR 750 ML	AMARULA LICOR 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
402	\N	f	TRES LEONES RON ETIQUETA NEGRA 720 ML	TRES LEONES RON ETIQUETA NEGRA 720 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
403	\N	f	INDOMITA MERLOT 750 ML	INDOMITA MERLOT 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
404	\N	f	JP CHENET ROSE 750ML	JP CHENET ROSE 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	16	\N	f	f	2	/productos	\N	\N	\N	t
405	\N	f	INDOMITA CABERNET SAUVIGNON 750 ML	INDOMITA CABERNET SAUVIGNON 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
406	\N	f	INDOMITA CARMENERE 750	INDOMITA CARMENERE 750	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
407	\N	f	FORTIN CARRULIM 200 ML	FORTIN CARRULIM 200 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
408	\N	f	FERNET BRANCA 750ML	FERNET BRANCA 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
409	\N	f	JABON EN PAN AGRICULTOR 180 G	JABON EN PAN AGRICULTOR 180 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	6	\N	f	f	2	/productos	\N	\N	\N	t
410	\N	f	LANCERS ROSE SERVE CHILLED 750ML	LANCERS ROSE SERVE CHILLED 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
411	\N	f	VINOVALIE ROSE PISCINE 750ML	VINOVALIE ROSE PISCINE 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
413	\N	f	HEMMER ACEITUNAS VERDES RECHEADAS LOCOTE 140 G	HEMMER ACEITUNAS VERDES RECHEADAS LOCOTE 140 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	120	\N	t
414	\N	f	HEMMER ACEITUNAS VERDES FATIADAS 150 G SACHET	HEMMER ACEITUNAS VERDES FATIADAS 150 G SACHET	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	120	\N	t
415	\N	f	PARANA VINO TINTO SUAVE 750ML	PARANA VINO TINTO SUAVE 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
412	\N	f	HEMMER ACEITURAS VERDES SIN SEMILLA 140 G	HEMMER ACEITURAS VERDES SIN SEMILLA 140 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	365	\N	t
416	\N	f	HEMMER ACEITUNAS VERDES CON SEMILLA 180 G	HEMMER ACEITUNAS VERDES CON SEMILLA 180 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	120	\N	t
417	\N	f	SANTA CAROLINA ESTRELLAS MERLOT 750ML	SANTA CAROLINA ESTRELLAS MERLOT 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
104	\N	f	VALLE DE UCO LA CELIA PIONNER MALBEC 750ML	VALLE DE UCO LA CELIA PIONNER MALBEC 750ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	15	\N	f	f	2	/productos	\N	\N	\N	t
418	\N	f	PALERMO GREEN 20	PALERMO GREEN 20	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
419	\N	f	ARCOIRIS CONDIMIENTO PARA CARNE 15 G	ARCOIRIS CONDIMIENTO PARA CARNE 15 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	120	\N	t
420	\N	f	ARCOIRIS AJI PICANTE 15 G	ARCOIRIS AJI PICANTE 15 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	26	\N	f	f	2	/productos	\N	120	\N	t
372	\N	f	ARCOIRIS SAL ENTREFINA 500G	ARCOIRIS SAL ENTREFINA 500G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	30	\N	t
421	\N	f	ARCOIRIS CHIMICHURRI 15 G	ARCOIRIS CHIMICHURRI 15 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	120	\N	t
422	\N	f	ARCOIRIS COMINO MOLIDO 25 G	ARCOIRIS COMINO MOLIDO 25 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	120	\N	t
423	\N	f	PALERMO GREEN 10 	PALERMO GREEN 10 	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
424	\N	f	FOX ORIGINAL BOX 20	FOX ORIGINAL BOX 20	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
425	\N	f	ELEGANCE SUP. SLIM ULTRA 20 	ELEGANCE SUP. SLIM ULTRA 20 	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
426	\N	f	ARCOIRIS KURATU CILANTRO MOLIDO 15 G	ARCOIRIS KURATU CILANTRO MOLIDO 15 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	120	\N	t
427	\N	f	ARCOIRIS AJO DESHIDRATADO 15 G	ARCOIRIS AJO DESHIDRATADO 15 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	120	\N	t
428	\N	f	ELEGANCE SUP. SLIM LIGHTS 20 	ELEGANCE SUP. SLIM LIGHTS 20 	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
429	\N	f	ARCOIRIS BURRITO 15 G	ARCOIRIS BURRITO 15 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	120	\N	t
430	\N	f	ARCOIRIS MEZCLA HIERBAS 15 G	ARCOIRIS MEZCLA HIERBAS 15 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	120	\N	t
431	\N	f	EURO STAR BIX 20 	EURO STAR BIX 20 	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
432	\N	f	ARCOIRIS ANIS ESTRELLADO 15 G	ARCOIRIS ANIS ESTRELLADO 15 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	120	\N	t
433	\N	f	LUCKY STRIKE DOUBLE CLICK WILD 20	LUCKY STRIKE DOUBLE CLICK WILD 20	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
434	\N	f	NAVARRO SALSA DE SOJA 200 ML	NAVARRO SALSA DE SOJA 200 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	\N	\N	t
435	\N	f	NAVARRO SALSA DE SOJA 400 ML	NAVARRO SALSA DE SOJA 400 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	\N	\N	t
436	\N	f	LUCKY STRIKE DOUBLE CLICK WILD 10	LUCKY STRIKE DOUBLE CLICK WILD 10	10	1	f	f	f	f	f	t	t	4	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
437	\N	f	ARCOIRIS BOLDO 15 G	ARCOIRIS BOLDO 15 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	31	\N	f	f	2	/productos	\N	120	\N	t
438	\N	f	DOBLE V ETIQUETA NEGRA 1 L	DOBLE V ETIQUETA NEGRA 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
439	\N	f	BLACK STONE HONEY 1 L	BLACK STONE HONEY 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
440	\N	f	LUCKY STRIKE SWITCH 20 	LUCKY STRIKE SWITCH 20 	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
441	\N	f	LUCKY STRIKE SWITCH 10	LUCKY STRIKE SWITCH 10	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
442	\N	f	SIR EDWARDS 1 L	SIR EDWARDS 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
443	\N	f	BLACK STONE NEGRO 1 L	BLACK STONE NEGRO 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
444	\N	f	CHESTERFIELD REMIX BOX 11	CHESTERFIELD REMIX BOX 11	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
445	\N	f	SAN DIEGO PALMITO ENTERO VDR 360 G	SAN DIEGO PALMITO ENTERO VDR 360 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	19	\N	f	f	2	/productos	\N	\N	\N	t
446	\N	f	LUCKY STRIKE ENIGMA 20	LUCKY STRIKE ENIGMA 20	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
447	\N	f	COAMO OLEO DE SOJA 900 ML	COAMO OLEO DE SOJA 900 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	120	\N	t
448	\N	f	SAN MARINO BOX 20 	SAN MARINO BOX 20 	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
449	\N	f	MALBORO VISTA FOREST FUSION 20	MALBORO VISTA FOREST FUSION 20	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	11	\N	f	f	2	/productos	\N	\N	\N	t
450	\N	f	GAUCHO PARRILLA P/ PESCADO M 19.5CM X 29.5CM	GAUCHO PARRILLA P/ PESCADO M 19.5CM X 29.5CM	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	28	\N	f	f	2	/productos	\N	\N	\N	t
451	\N	f	SALTOS AGUA SIN GAS 500ML	SALTOS AGUA SIN GAS 500ML	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	5	\N	f	f	2	/productos	\N	\N	\N	t
452	\N	f	SANDY MAC 1L	SANDY MAC 1L	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
453	\N	f	CEBILA ACEITUNAS DESCAROZADAS 160 G	CEBILA ACEITUNAS DESCAROZADAS 160 G	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	21	\N	f	f	2	/productos	\N	\N	\N	t
454	\N	f	CAPEL MIX MANGO COLADA 700 ML	CAPEL MIX MANGO COLADA 700 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
455	\N	f	JACK DANIELS HONEY 1 L	JACK DANIELS HONEY 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
456	\N	f	CIROC PEACH VODKA 750 ML	CIROC PEACH VODKA 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
457	\N	f	SALTOS AGUA SIN GAS 2L	SALTOS AGUA SIN GAS 2L	10	1	f	f	f	f	f	f	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	5	\N	f	f	2	/productos	\N	\N	\N	t
458	\N	f	CIROC RED BERRY VODKA 750 ML	CIROC RED BERRY VODKA 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
459	\N	f	CIROC VODKA 750 ML	CIROC VODKA 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
462	\N	f	JOHNNIE WALKER RED LABEL 500 ML	JOHNNIE WALKER RED LABEL 500 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
463	\N	f	JOHNNIE WALKER RED LABEL 375 ML	JOHNNIE WALKER RED LABEL 375 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
464	\N	f	CONTI GASEOSA COLA 2L	CONTI GASEOSA COLA 2L	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
465	\N	f	NEMIROFF ORIGINAL VODKA 1 L	NEMIROFF ORIGINAL VODKA 1 L	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
466	\N	f	TEQUILERO DEL LESTE REPOSADO 750 ML	TEQUILERO DEL LESTE REPOSADO 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
467	\N	f	TEQUILERO DEL LESTE SILVER 750 ML	TEQUILERO DEL LESTE SILVER 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
468	\N	f	NINNOFF VODKA PINK LEMONADE 900 ML	NINNOFF VODKA PINK LEMONADE 900 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
469	\N	f	VEGAS CONHAQUE 1 L	VEGAS CONHAQUE 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
70	\N	f	HEINEKEN BOT 250 ML	HEINEKEN BOT 250 ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	1	\N	f	f	2	/productos	\N	30	\N	t
470	\N	f	OLD TRADI ETIQUETA NEGRA 750 ML C/ VASO	OLD TRADI ETIQUETA NEGRA 750 ML C/ VASO	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
471	\N	f	OLD TRADI ETIQUETA NEGRA 500 ML C/VASO	OLD TRADI ETIQUETA NEGRA 500 ML C/VASO	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
472	\N	f	COCA COLA LATA 350ML	COCA COLA LATA 350ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
473	\N	f	OLD TRADI ETIQUETA NEGRA 500 ML	OLD TRADI ETIQUETA NEGRA 500 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
474	\N	f	SPRITE LATA 350ML	SPRITE LATA 350ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
475	\N	f	CAPITAN CORTEZ RON CARTA BLANCA 965 ML	CAPITAN CORTEZ RON CARTA BLANCA 965 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
476	\N	f	ANTARCTICA GUARANA LATA 269ML	ANTARCTICA GUARANA LATA 269ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
477	\N	f	WHITE HORSE C/CAJA 1 L	WHITE HORSE C/CAJA 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
478	\N	f	FANTA UVA LATA 350ML	FANTA UVA LATA 350ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
479	\N	f	BALLANTINES 8 AÑOS S/CAJA 1 L	BALLANTINES 8 AÑOS S/CAJA 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
480	\N	f	FANTA NARANJA LATA 350ML	FANTA NARANJA LATA 350ML	10	1	f	f	f	f	f	t	t	4	ENFRIABLE	2021-12-28 18:29:38.098151+00	2	\N	f	f	2	/productos	\N	30	\N	t
481	\N	f	THE BREEDERS CHOICE 1 L	THE BREEDERS CHOICE 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
482	\N	f	FORTIN ETIQUETA NEGRA 475 ML	FORTIN ETIQUETA NEGRA 475 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
483	\N	f	TRES LEONES ETIQUETA NEGRA 420 ML	TRES LEONES ETIQUETA NEGRA 420 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
484	\N	f	ARISTOCRATA ETIQUETA NEGRA 750 ML	ARISTOCRATA ETIQUETA NEGRA 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
485	\N	f	ARISTOCRATA ETIQUETA NEGRA 450 ML	ARISTOCRATA ETIQUETA NEGRA 450 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
486	\N	f	BID LICOR DE MENTA 720 ML	BID LICOR DE MENTA 720 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
487	\N	f	BID LICOR DE AMARULA 720 ML	BID LICOR DE AMARULA 720 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
488	\N	f	PUERTO DE INDIAS GIN PURE BLACK 700 ML	PUERTO DE INDIAS GIN PURE BLACK 700 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
490	\N	f	GRANTS 500 ML	GRANTS 500 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
491	\N	f	GRANTS 350 ML	GRANTS 350 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
492	\N	f	GIN INTENCION 900 ML	GIN INTENCION 900 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
493	\N	f	INTENCION VODKA 900 ML	INTENCION VODKA 900 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
494	\N	f	VELHO BARREIRO LIMON 910 ML	VELHO BARREIRO LIMON 910 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
495	\N	f	JOHNNIE WALKER GREEN LABEL 15 A 750 ML	JOHNNIE WALKER GREEN LABEL 15 A 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
496	\N	f	JOHNNIE WALKER GOLD LABER RESERVE 750 ML	JOHNNIE WALKER GOLD LABER RESERVE 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
497	\N	f	JOHNNIE WALKER BLACK LABEL 1 L	JOHNNIE WALKER BLACK LABEL 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
498	\N	f	JOHNNIE WALKER RED LABEL 1 L	JOHNNIE WALKER RED LABEL 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
499	\N	f	JOHNNIE WALKER GOLD LABEL 18 A 750 ML	JOHNNIE WALKER GOLD LABEL 18 A 750 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
500	\N	f	CHIVAS REGAL 12 AÑOS 1 L	CHIVAS REGAL 12 AÑOS 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
501	\N	f	BUCHANANS 12 AÑOS 1 L	BUCHANANS 12 AÑOS 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
502	\N	f	BUCHANANS 18 AÑOS 1 L	BUCHANANS 18 AÑOS 1 L	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	17	\N	f	f	2	/productos	\N	\N	\N	t
489	\N	f	PRESIDENTE CONHAQUE 970 ML	PRESIDENTE CONHAQUE 970 ML	10	1	f	f	f	f	f	t	t	3	ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
503	\N	f	PRESIDENTE CONHAQUE CON MIEL 900 ML	PRESIDENTE CONHAQUE CON MIEL 900 ML	10	1	f	f	f	f	f	f	t	3	NO_ENFRIABLE	2021-12-28 18:29:38.098151+00	27	\N	f	f	2	/productos	\N	\N	\N	t
\.


--
-- Name: producto_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.producto_id_seq', 261, true);


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
1	1		t	1	2021-03-10 00:48:55+00	\N	sports_bar	CERVEZAS	1
2	1		t	1	2021-03-10 00:54:39+00	\N	local_drink	GASEOSAS	2
3	\N		t	1	2021-07-27 23:36:24+00	1		CON ALCOHOL	3
4	\N		t	1	2021-07-27 23:36:57+00	1		SIN ALCOHOL	4
5	1	AGUAS MINERALES, CON GAS, SIN GAS, TONICAS, AGUAS SABORIZADAS	t	\N	2021-12-28 18:23:46.046486+00	\N	local_drink	AGUAS	6
6	2	JABON, DETERGENTE, PAPEL HIGIENICO, SHAMPOO, ETC	t	\N	2021-12-28 18:23:46.046486+00	\N	block	PRODUCTOS DE BAÃ‘O Y COCINA	7
7	5		t	\N	2021-12-28 18:23:46.046486+00	\N	block	PANIFICADOS	8
8	5		t	\N	2021-12-28 18:23:46.046486+00	\N	block	CARNICOS	9
9	5	CHORIZOS, JAMON, PATE	t	\N	2021-12-28 18:23:46.046486+00	\N	block	EMBUTIDOS	10
10	2	PASTILLAS, JARABES	t	\N	2021-12-28 18:23:46.046486+00	\N	block	MEDICAMENTOS	11
11	7		t	\N	2021-12-28 18:23:46.046486+00	\N	block	TRADICIONALES	12
14	2		t	\N	2021-12-28 18:23:46.046486+00	\N	block	ACCESORIOS	13
15	1		t	\N	2021-12-28 18:23:46.046486+00	\N	block	VINOS	14
16	1		t	\N	2021-12-28 18:23:46.046486+00	\N	block	ESPUMANTES	15
17	1		t	\N	2021-12-28 18:23:46.046486+00	\N	block	WHISKYS	16
18	5		t	\N	2021-12-28 18:23:46.046486+00	\N	block	SNACKS Y GALLETITAS	17
19	5		t	\N	2021-12-28 18:23:46.046486+00	\N	block	ENLATADOS	18
21	5		t	\N	2021-12-28 18:23:46.046486+00	\N	block	ENVASADOS	18
22	1	NATURALES  Y EXTRACTOS	t	3	2021-12-28 18:23:46.046486+00	\N	arrow_drop_up	JUGOS	20
23	1	ENERGETICOS	t	4	2021-12-28 18:23:46.046486+00	\N	block	ENERGIZANTES	21
24	5	TODA CLASE DE CHOCOLATE	t	4	2021-12-28 18:23:46.046486+00	\N	block	CHOCOLATES	22
25	5	TODA CLASE DE GOLOSINA	t	4	2021-12-28 18:23:46.046486+00	\N	block	CANDY´S / GOLOSINAS 	22
26	10	TODA CLASE DE YERBA	t	4	2021-12-28 18:23:46.046486+00	\N	filter_vintage	YERBAS	24
27	1	LICOR / VODKA / GIN	t	4	2021-12-28 18:23:46.046486+00	\N	local_bar	DESTILADOS 	25
28	2	VASOS / CUCHILLAS / COLEMANNS / PARRILLAS / 	t	4	2021-12-28 18:23:46.046486+00	\N	block	UTENCILIOS 	26
29	2	VASOS / CUCHILLAS / COLEMANNS / PARRILLAS / 	t	4	2021-12-28 18:23:46.046486+00	\N	block	UTENCILIOS 	26
30	2	PRESERVATIVOS - LUBRICANTES - MIEL 	t	3	2021-12-28 18:23:46.046486+00	\N	hotel	AFRODICIACOS	28
31	10	SAL GRUEZA, SAL FINA, CONDIMENTOS VARIOS, 	t	4	2021-12-28 18:23:46.046486+00	\N	restaurant	CONDIMENTOS	29
32	7	ENCENDEDORES , DECHAVADOR	t	4	2021-12-28 18:23:46.046486+00	\N	block	ENCENDEDORES	29
\.


--
-- Name: subfamilia_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.subfamilia_id_seq', 23, true);


--
-- Data for Name: tipo_precio; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.tipo_precio (id, descripcion, autorizacion, usuario_id, creado_en, activo) FROM stdin;
1	UNITARIO	\N	1	2021-05-20 15:29:22+00	t
2	FRIO	\N	1	2021-05-20 15:29:22+00	t
3	NATURAL	\N	1	2021-05-20 15:29:22+00	t
4	FUNCIONARIOS	t	1	2021-05-20 15:29:22+00	t
\.


--
-- Name: tipo_precio_id_seq; Type: SEQUENCE SET; Schema: productos; Owner: franco
--

SELECT pg_catalog.setval('productos.tipo_precio_id_seq', 4, true);


--
-- Data for Name: tipo_presentacion; Type: TABLE DATA; Schema: productos; Owner: franco
--

COPY productos.tipo_presentacion (id, descripcion, unico, usuario_id, creado_en) FROM stdin;
2	CAJA	f	1	2021-09-28 21:59:22+00
3	CAJA SECUNDARIA	f	1	2021-09-28 21:59:39+00
4	PACK	f	\N	2021-10-06 13:08:52+00
1	UNIDAD	f	1	2021-09-28 21:59:02+00
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
-- Name: motivo_diferencia_pedido_pkey; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.motivo_diferencia_pedido
    ADD CONSTRAINT motivo_diferencia_pedido_pkey PRIMARY KEY (id);


--
-- Name: movimiento_stock_un; Type: CONSTRAINT; Schema: operaciones; Owner: franco
--

ALTER TABLE ONLY operaciones.movimiento_stock
    ADD CONSTRAINT movimiento_stock_un UNIQUE (tipo_movimiento, referencia);


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
-- Name: funcionario_un_persona; Type: CONSTRAINT; Schema: personas; Owner: franco
--

ALTER TABLE ONLY personas.funcionario
    ADD CONSTRAINT funcionario_un_persona UNIQUE (persona_id);


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

