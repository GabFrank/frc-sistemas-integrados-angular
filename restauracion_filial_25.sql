-- =====================================================
-- RESTAURACIÓN COMPLETA FILIAL 25
-- =====================================================
-- Fecha: $(date)
-- Objetivo: Restaurar la filial 25 recreando la base general desde cero
-- Base Padre: bodega (172.25.1.200:5551)
-- Filial 24: general (172.25.1.24:5551) - Referencia
-- Filial 25: general (172.25.1.25:5551) - A restaurar
-- =====================================================

-- =====================================================
-- FASE 1: LIMPIEZA Y PREPARACIÓN
-- =====================================================

-- 1.1 Verificar conectividad (ejecutar desde terminal)
-- psql -h 172.25.1.200 -p 5551 -U franco -d bodega -c "\l"
-- psql -h 172.25.1.24 -p 5551 -U franco -d general -c "\l"
-- psql -h 172.25.1.25 -p 5551 -U franco -d general -c "\l"

-- 1.2 Limpiar suscripciones existentes en filial 25
-- Ejecutar estos comandos por separado (no en transacción):
-- NOTA: Primero alterar la suscripción para desvincular el slot, luego eliminarla

-- Paso 1: Desvincular slots de las suscripciones
-- ALTER SUBSCRIPTION central3_sub SET (slot_name = NONE);
-- ALTER SUBSCRIPTION central_filial3_sub SET (slot_name = NONE);

-- Paso 2: Eliminar las suscripciones
-- DROP SUBSCRIPTION central3_sub;
-- DROP SUBSCRIPTION central_filial3_sub;

-- 1.3 Verificar slots de replicación en bodega
-- SELECT slot_name, plugin, slot_type, database, active 
-- FROM pg_replication_slots 
-- WHERE slot_name LIKE '%filial25%' OR slot_name LIKE '%central3%';

-- 1.4 Eliminar slots de replicación si existen
-- SELECT pg_drop_replication_slot('nombre_del_slot');

-- 1.5 DROP DATABASE general de filial 25
-- \c postgres
-- DROP DATABASE IF EXISTS general;

-- Si hay sesiones activas, terminarlas primero:
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'general' AND pid <> pg_backend_pid();
-- DROP DATABASE IF EXISTS general;

-- 1.6 CREATE DATABASE general nueva para filial 25
-- CREATE DATABASE general;

-- =====================================================
-- FASE 2: EXTRACCIÓN Y APLICACIÓN DE ESQUEMAS
-- =====================================================

-- 2.1 Extraer estructura completa de esquemas desde filial 24
-- Ejecutar desde terminal:
-- pg_dump -h 172.25.1.24 -p 5551 -U franco -d general --schema-only --no-owner --no-privileges > esquemas_filial24.sql

-- 2.2 Aplicar esquemas a la nueva base de datos general filial 25
-- psql -h 172.25.1.25 -p 5551 -U franco -d general < esquemas_filial24.sql

-- 2.3 Verificar esquemas aplicados
-- \dn

-- 2.4 Limpiar suscripciones automáticas creadas durante la importación
-- NOTA: Al importar esquemas desde filial 24, se crean suscripciones automáticamente
-- que no están conectadas y deben ser eliminadas antes de crear las correctas

-- Verificar suscripciones creadas automáticamente:
-- SELECT subname, subenabled, subconninfo FROM pg_subscription;

-- Eliminar suscripciones automáticas (ejemplo: central_filial24_sub, filial24_central_sub):
-- ALTER SUBSCRIPTION central_filial24_sub SET (slot_name = NONE);
-- ALTER SUBSCRIPTION filial24_central_sub SET (slot_name = NONE);
-- DROP SUBSCRIPTION central_filial24_sub;
-- DROP SUBSCRIPTION filial24_central_sub;

-- =====================================================
-- FASE 3: CARGA INICIAL DE DATOS
-- =====================================================
-- IMPORTANTE: Este proceso puede tomar tiempo. Ejecutar por fases.
-- Si hay errores, verificar dependencias y continuar con la siguiente tabla.

-- 3.1 Identificar y cargar tablas maestras (sin sucursal_id)
-- Estas tablas se cargan completas desde bodega
-- NOTA: Si hay errores de duplicados, usar INSERT ... ON CONFLICT DO NOTHING
-- ORDEN CRÍTICO: Respetar dependencias de foreign keys
-- IMPORTANTE: Ejecutar cada INSERT por separado para identificar errores específicos
-- NOTA: Si hay errores de tipo de datos, verificar estructura con: \d esquema.tabla

-- =====================================================
-- NIVEL 0: TABLAS SIN DEPENDENCIAS (CARGAR PRIMERO)
-- =====================================================
-- PROGRESO: ✅ autorizacion, ✅ marcacion, ✅ actualizacion, ✅ tipo_equipo, ✅ entrada, ✅ necesidad, ✅ salida, ✅ marca, ✅ tipo_vehiculo, ✅ vehiculo_sucursal
-- PROGRESO NIVEL 1: ✅ general.pais (4), ✅ general.ciudad (6), ✅ personas.persona (4847), ✅ personas.usuario (374), ✅ equipos.equipo (0), ✅ empresarial.sucursal (29), ✅ configuraciones.inicio_sesion (7115)
-- PROGRESO NIVEL 2: ✅ financiero.banco (0), ✅ financiero.moneda (4), ✅ financiero.tipo_gasto (1), ✅ financiero.timbrado (4), ✅ financiero.cambio (90), ✅ productos.familia (8), ✅ productos.tipo_presentacion (7), ✅ productos.tipo_precio (6), ✅ empresarial.cargo (0), ✅ personas.funcionario (370)
-- PROGRESO NIVEL 3: ✅ productos.subfamilia (69), ✅ productos.producto (6818), ✅ productos.presentacion (8831), ✅ financiero.cuenta_bancaria (0), ✅ operaciones.pedido (0), ✅ operaciones.pedido_item (0)
-- PROGRESO NIVEL 4: ✅ personas.cliente (4832), ✅ financiero.forma_pago (5), ✅ operaciones.cobro (4093), ✅ operaciones.venta (4093), ✅ operaciones.venta_item (7540), ✅ operaciones.stock_por_producto_sucursal (0), ✅ operaciones.movimiento_stock (0), ✅ financiero.factura_legal (0), ✅ financiero.factura_legal_item (0), ✅ operaciones.cobro_detalle (5574)
-- PROGRESO NIVEL 5: ✅ productos.precio_por_sucursal (0), ✅ productos.costo_por_producto (0), ✅ operaciones.delivery (0), ✅ operaciones.transferencia (37), ✅ productos.producto_por_sucursal (0), ✅ configuraciones.local (0), ✅ dependencias_circulares (8 actualizados)
-- NOTA: inicio_sesion depende de empresarial.sucursal (NIVEL 1)
-- ESTADO: ✅ NIVEL 0 COMPLETADO - Todas las tablas sin dependencias cargadas
-- ESTADO: ✅ NIVEL 1.1 COMPLETADO - Tablas base fundamentales cargadas
-- ESTADO: ✅ NIVEL 1.2 COMPLETADO - Tablas empresariales cargadas
-- ESTADO: ✅ NIVEL 1.3 COMPLETADO - Tablas de configuración cargadas
-- ESTADO: ✅ NIVEL 2.1 COMPLETADO - Tablas financieras base cargadas
-- ESTADO: ✅ NIVEL 2.2 COMPLETADO - Tablas financieras dependientes cargadas
-- ESTADO: ✅ NIVEL 2.3 COMPLETADO - Tablas de productos y personas cargadas
-- ESTADO: ✅ NIVEL 3.1 COMPLETADO - Tablas de productos complejas cargadas
-- ESTADO: ✅ NIVEL 3.2 COMPLETADO - Tablas financieras complejas cargadas
-- ESTADO: ✅ NIVEL 3.3 COMPLETADO - Tablas de operaciones complejas cargadas
-- ESTADO: ✅ NIVEL 4.1 COMPLETADO - Tablas de inventario y stock cargadas
-- ESTADO: ✅ NIVEL 4.2 COMPLETADO - Tablas de ventas y transacciones cargadas
-- ESTADO: ✅ NIVEL 4.3 COMPLETADO - Tablas de facturación y pagos cargadas
-- ESTADO: ✅ NIVEL 5.1 COMPLETADO - Tablas de precios y costos cargadas
-- ESTADO: ✅ NIVEL 5.2 COMPLETADO - Tablas de delivery y transferencias cargadas
-- ESTADO: ✅ NIVEL 5.3 COMPLETADO - Tablas de configuración específica cargadas
-- ESTADO: ✅ NIVEL 5.4 COMPLETADO - Dependencias circulares resueltas
-- NOTA: Algunas tablas del análisis inicial no existen en la base actual
-- SIGUIENTE: FASE 4 - CONFIGURACIÓN DE REPLICACIÓN LÓGICA

-- Esquema administrativo
INSERT INTO administrativo.autorizacion 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM administrativo.autorizacion') AS t1(id bigint, funcionario_id bigint, autorizador_id bigint, tipo_autorizacion administrativo.tipo_autorizacion, estado_autorizacion administrativo.estado_autorizacion, observacion character varying, usuario_id bigint, creado_en timestamp with time zone, sucursal_id bigint);

INSERT INTO administrativo.marcacion 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM administrativo.marcacion') AS t1(id bigint, tipo_marcacion administrativo.tipo_marcacion, presencial boolean, autorizacion bigint, sucursal_id bigint, codigo character varying, usuario_id bigint, creado_en timestamp with time zone);

-- Esquema configuraciones
INSERT INTO configuraciones.actualizacion 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM configuraciones.actualizacion') AS t1(id bigint, current_version character varying, enabled boolean, tipo configuraciones.tipo_actualizacion, nivel configuraciones.nivel_actualizacion, title character varying, msg character varying, btn character varying, usuario_id bigint, creado_en timestamp without time zone);

-- MOVER A NIVEL 1: inicio_sesion depende de empresarial.sucursal
-- INSERT INTO configuraciones.inicio_sesion 
-- SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
-- 'SELECT * FROM configuraciones.inicio_sesion') AS t1(id bigint, usuario_id bigint, id_dispositivo text, hora_inicio timestamp with time zone, hora_fin timestamp without time zone, creado_en timestamp with time zone, sucursal_id bigint, token text, tipo_dispositivo configuraciones.tipo_dispositivo);

-- IGNORAR: rabbitmq_msg (estructura compleja)
-- INSERT INTO configuraciones.rabbitmq_msg 
-- SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
-- 'SELECT * FROM configuraciones.rabbitmq_msg') AS t1(id bigint, mensaje text, procesado boolean, fecha_creacion timestamp with time zone);

-- Esquema equipos
INSERT INTO equipos.tipo_equipo 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM equipos.tipo_equipo') AS t1(id bigint, descripcion character varying, usuario_id bigint, creado_en timestamp with time zone, sucursal_id bigint);

-- Esquema operaciones
INSERT INTO operaciones.entrada 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.entrada') AS t1(id bigint, responsable_carga_id bigint, tipo_entrada operaciones.tipo_entrada, observacion character varying, creado_en timestamp with time zone, usuario_id bigint, sucursal_id bigint, activo boolean);

INSERT INTO operaciones.necesidad 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.necesidad') AS t1(id bigint, sucursal_id bigint, fecha timestamp with time zone, estado operaciones.necesidad_estado, creado_en timestamp with time zone, usuario_id bigint);

INSERT INTO operaciones.salida 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.salida') AS t1(id bigint, responsable_carga_id bigint, tipo_salida operaciones.tipo_salida, sucursal_id bigint, observacion character varying, creado_en timestamp with time zone, usuario_id bigint, activo boolean);

-- TABLA NO EXISTE: sesion_inventario
-- INSERT INTO operaciones.sesion_inventario 
-- SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
-- 'SELECT * FROM operaciones.sesion_inventario') AS t1(id bigint, fecha_inicio timestamp with time zone, fecha_fin timestamp with time zone, estado operaciones.estado_sesion_inventario, usuario_id bigint, creado_en timestamp with time zone);

-- Esquema personas
-- TABLA NO EXISTE: pre_registro_funcionario
-- INSERT INTO personas.pre_registro_funcionario 
-- SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
-- 'SELECT * FROM personas.pre_registro_funcionario') AS t1(id bigint, nombre character varying, apellido character varying, cedula character varying, email character varying, telefono character varying, fecha_registro timestamp with time zone, estado personas.estado_pre_registro, creado_en timestamp with time zone);

-- Esquema vehiculos
INSERT INTO vehiculos.marca 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM vehiculos.marca') AS t1(id bigint, descripcion character varying, usuario_id bigint, creado_en timestamp with time zone);

INSERT INTO vehiculos.tipo_vehiculo 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM vehiculos.tipo_vehiculo') AS t1(id bigint, descripcion character varying, usuario_id bigint, creado_en timestamp with time zone);

INSERT INTO vehiculos.vehiculo_sucursal 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM vehiculos.vehiculo_sucursal') AS t1(id bigint, sucursal_id bigint, vehiculo_id bigint, responsable_id bigint, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 1: TABLAS QUE DEPENDEN SOLO DE NIVEL 0
-- =====================================================
-- IMPORTANTE: Ahora necesitamos cargar las tablas base que otras dependen
-- Estas incluyen: personas.usuario, personas.persona, general.pais, general.ciudad
-- Luego: equipos.equipo, empresarial.sucursal, etc.

-- NIVEL 1.1: Tablas base fundamentales (orden crítico)
-- Primero: general.pais (con dependencia circular - cargar sin usuario_id inicialmente)
INSERT INTO general.pais 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM general.pais') AS t1(id bigint, descripcion character varying, codigo character varying, usuario_id bigint, creado_en timestamp with time zone);

-- Segundo: general.ciudad (depende de general.pais, con dependencia circular en usuario_id)
INSERT INTO general.ciudad (id, descripcion, pais_id, codigo, usuario_id, creado_en)
SELECT id, descripcion, pais_id, codigo, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, descripcion, pais_id, codigo, usuario_id, creado_en FROM general.ciudad') AS t1(id bigint, descripcion character varying, pais_id bigint, codigo character varying, usuario_id bigint, creado_en timestamp with time zone);

-- Tercero: personas.persona (depende de general.ciudad, sin usuario_id por dependencia circular)
INSERT INTO personas.persona (id, nombre, apodo, documento, nacimiento, sexo, direccion, ciudad_id, telefono, social_media, imagenes, creado_en, email, activo)
SELECT id, nombre, apodo, documento, nacimiento, sexo, direccion, ciudad_id, telefono, social_media, imagenes, creado_en, email, activo FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, apodo, documento, nacimiento, sexo, direccion, ciudad_id, telefono, social_media, imagenes, creado_en, email, activo FROM personas.persona') AS t1(id bigint, nombre character varying, apodo character varying, documento character varying, nacimiento timestamp with time zone, sexo character varying, direccion character varying, ciudad_id bigint, telefono character varying, social_media character varying, imagenes character varying, creado_en timestamp with time zone, email character varying, activo boolean);

-- Cuarto: personas.usuario (sin persona_id por dependencia circular)
INSERT INTO personas.usuario (id, password, usuario_id, creado_en, nickname, email, activo)
SELECT id, password, usuario_id, creado_en, nickname, email, activo FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, password, usuario_id, creado_en, nickname, email, activo FROM personas.usuario') AS t1(id bigint, password character varying, usuario_id bigint, creado_en timestamp with time zone, nickname character varying, email character varying, activo boolean);

-- NOTA: Las dependencias circulares se resolverán después de cargar todas las tablas base

-- =====================================================
-- NIVEL 1.2: TABLAS QUE DEPENDEN DE NIVEL 1.1
-- =====================================================

-- Esquema equipos (depende de equipos.tipo_equipo)
INSERT INTO equipos.equipo (id, marca, modelo, costo, descripcion, imagenes, usuario_id, creado_en, tipo_equipo_id)
SELECT id, marca, modelo, costo, descripcion, imagenes, usuario_id, creado_en, tipo_equipo_id FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, marca, modelo, costo, descripcion, imagenes, usuario_id, creado_en, tipo_equipo_id FROM equipos.equipo') AS t1(id bigint, marca character varying, modelo character varying, costo numeric, descripcion character varying, imagenes character varying, usuario_id bigint, creado_en timestamp with time zone, tipo_equipo_id bigint);

-- Esquema empresarial (depende de general.ciudad, personas.usuario)
INSERT INTO empresarial.sucursal (id, nombre, localizacion, ciudad_id, creado_en, deposito, deposito_predeterminado, direccion, nro_delivery, is_configured, codigo_establecimiento_factura, ip, puerto)
SELECT id, nombre, localizacion, ciudad_id, creado_en, deposito, deposito_predeterminado, direccion, nro_delivery, is_configured, codigo_establecimiento_factura, ip, puerto FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, localizacion, ciudad_id, creado_en, deposito, deposito_predeterminado, direccion, nro_delivery, is_configured, codigo_establecimiento_factura, ip, puerto FROM empresarial.sucursal') AS t1(id bigint, nombre character varying, localizacion character varying, ciudad_id bigint, creado_en timestamp with time zone, deposito boolean, deposito_predeterminado boolean, direccion character varying, nro_delivery character varying, is_configured boolean, codigo_establecimiento_factura character varying, ip character varying, puerto integer);

-- =====================================================
-- NIVEL 1.3: TABLAS QUE DEPENDEN DE NIVEL 1.2
-- =====================================================

-- configuraciones.inicio_sesion (depende de empresarial.sucursal)
INSERT INTO configuraciones.inicio_sesion (id, usuario_id, id_dispositivo, hora_inicio, hora_fin, creado_en, sucursal_id, token, tipo_dispositivo)
SELECT id, usuario_id, id_dispositivo, hora_inicio, hora_fin, creado_en, sucursal_id, token, tipo_dispositivo FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, usuario_id, id_dispositivo, hora_inicio, hora_fin, creado_en, sucursal_id, token, tipo_dispositivo FROM configuraciones.inicio_sesion') AS t1(id bigint, usuario_id bigint, id_dispositivo text, hora_inicio timestamp with time zone, hora_fin timestamp without time zone, creado_en timestamp with time zone, sucursal_id bigint, token text, tipo_dispositivo configuraciones.tipo_dispositivo);

-- =====================================================
-- NIVEL 2: TABLAS QUE DEPENDEN DE NIVEL 0 Y NIVEL 1
-- =====================================================

-- =====================================================
-- NIVEL 2.1: TABLAS FINANCIERAS BASE
-- =====================================================

-- financiero.banco (depende de personas.usuario)
INSERT INTO financiero.banco (id, nombre, codigo, usuario_id, creado_en)
SELECT id, nombre, codigo, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, codigo, usuario_id, creado_en FROM financiero.banco') AS t1(id bigint, nombre character varying, codigo character varying, usuario_id bigint, creado_en timestamp with time zone);

-- financiero.moneda (depende de general.pais, personas.usuario)
INSERT INTO financiero.moneda (id, denominacion, simbolo, pais_id, usuario_id, creado_en)
SELECT id, denominacion, simbolo, pais_id, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, denominacion, simbolo, pais_id, usuario_id, creado_en FROM financiero.moneda') AS t1(id bigint, denominacion character varying, simbolo character varying, pais_id bigint, usuario_id bigint, creado_en timestamp with time zone);

-- financiero.tipo_gasto (depende de personas.usuario)
INSERT INTO financiero.tipo_gasto (id, nombre, descripcion, activo, usuario_id, creado_en)
SELECT id, nombre, descripcion, activo, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, descripcion, activo, usuario_id, creado_en FROM financiero.tipo_gasto') AS t1(id bigint, nombre character varying, descripcion character varying, activo boolean, usuario_id bigint, creado_en timestamp with time zone);

-- financiero.timbrado (depende de personas.usuario)
INSERT INTO financiero.timbrado (id, numero, fecha_inicio, fecha_fin, activo, usuario_id, creado_en)
SELECT id, numero, fecha_inicio, fecha_fin, activo, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, numero, fecha_inicio, fecha_fin, activo, usuario_id, creado_en FROM financiero.timbrado') AS t1(id bigint, numero character varying, fecha_inicio date, fecha_fin date, activo boolean, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 2.2: TABLAS FINANCIERAS QUE DEPENDEN DE NIVEL 2.1
-- =====================================================

-- financiero.cambio (depende de financiero.moneda)
INSERT INTO financiero.cambio (id, moneda_id, valor_en_gs, activo, usuario_id, creado_en, valor_en_gs_cambio)
SELECT id, moneda_id, valor_en_gs, activo, usuario_id, creado_en, valor_en_gs_cambio FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, moneda_id, valor_en_gs, activo, usuario_id, creado_en, valor_en_gs_cambio FROM financiero.cambio') AS t1(id bigint, moneda_id bigint, valor_en_gs numeric, activo boolean, usuario_id bigint, creado_en timestamp with time zone, valor_en_gs_cambio numeric)
ON CONFLICT DO NOTHING;

-- =====================================================
-- NIVEL 2.3: TABLAS DE PRODUCTOS Y OPERACIONES
-- =====================================================

-- =====================================================
-- NIVEL 2.3.1: TABLAS DE PRODUCTOS BASE
-- =====================================================

-- productos.familia (depende de personas.usuario)
INSERT INTO productos.familia (id, nombre, descripcion, usuario_id, creado_en)
SELECT id, nombre, descripcion, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, descripcion, usuario_id, creado_en FROM productos.familia') AS t1(id bigint, nombre character varying, descripcion character varying, usuario_id bigint, creado_en timestamp with time zone);

-- productos.tipo_presentacion (depende de personas.usuario)
INSERT INTO productos.tipo_presentacion (id, nombre, descripcion, usuario_id, creado_en)
SELECT id, nombre, descripcion, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, descripcion, usuario_id, creado_en FROM productos.tipo_presentacion') AS t1(id bigint, nombre character varying, descripcion character varying, usuario_id bigint, creado_en timestamp with time zone);

-- productos.tipo_precio (depende de empresarial.sucursal, personas.usuario)
INSERT INTO productos.tipo_precio (id, descripcion, autorizacion, usuario_id, creado_en, activo)
SELECT id, descripcion, autorizacion, usuario_id, creado_en, activo FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, descripcion, autorizacion, usuario_id, creado_en, activo FROM productos.tipo_precio') AS t1(id bigint, descripcion character varying, autorizacion boolean, usuario_id bigint, creado_en timestamp with time zone, activo boolean);

-- =====================================================
-- NIVEL 2.3.2: TABLAS DE OPERACIONES BASE
-- =====================================================

-- NOTA: Las siguientes tablas no existen en la base de destino:
-- operaciones.motivo_observacion (depende de personas.usuario)
-- operaciones.categoria_observacion (depende de personas.usuario)
-- operaciones.subcategoria_observacion (depende de operaciones.categoria_observacion)
-- Estas tablas se omitirán en la restauración

-- =====================================================
-- NIVEL 2.3.3: TABLAS DE PERSONAS Y EMPRESARIAL
-- =====================================================

-- personas.funcionario (depende de personas.persona, empresarial.sucursal)
INSERT INTO personas.funcionario (id, persona_id, sucursal_id, cargo_id, usuario_id, creado_en)
SELECT id, persona_id, sucursal_id, cargo_id, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, persona_id, sucursal_id, cargo_id, usuario_id, creado_en FROM personas.funcionario') AS t1(id bigint, persona_id bigint, sucursal_id bigint, cargo_id bigint, usuario_id bigint, creado_en timestamp with time zone);

-- empresarial.cargo (depende de personas.usuario)
INSERT INTO empresarial.cargo (id, nombre, descripcion, usuario_id, creado_en)
SELECT id, nombre, descripcion, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, descripcion, usuario_id, creado_en FROM empresarial.cargo') AS t1(id bigint, nombre character varying, descripcion character varying, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 3: TABLAS COMPLEJAS CON MÚLTIPLES DEPENDENCIAS
-- =====================================================

-- =====================================================
-- NIVEL 3.1: TABLAS DE PRODUCTOS COMPLEJAS
-- =====================================================

-- productos.subfamilia (depende de productos.familia, personas.usuario)
INSERT INTO productos.subfamilia (id, nombre, descripcion, familia_id, usuario_id, creado_en)
SELECT id, nombre, descripcion, familia_id, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, descripcion, familia_id, usuario_id, creado_en FROM productos.subfamilia') AS t1(id bigint, nombre character varying, descripcion character varying, familia_id bigint, usuario_id bigint, creado_en timestamp with time zone);

-- productos.producto (depende de productos.subfamilia, personas.usuario)
INSERT INTO productos.producto (id, nombre, descripcion, codigo, subfamilia_id, activo, usuario_id, creado_en)
SELECT id, nombre, descripcion, codigo, subfamilia_id, activo, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, descripcion, codigo, subfamilia_id, activo, usuario_id, creado_en FROM productos.producto') AS t1(id bigint, nombre character varying, descripcion character varying, codigo character varying, subfamilia_id bigint, activo boolean, usuario_id bigint, creado_en timestamp with time zone);

-- productos.presentacion (depende de productos.producto, productos.tipo_presentacion, personas.usuario)
INSERT INTO productos.presentacion (id, producto_id, cantidad, descripcion, principal, activo, tipo_presentacion_id, usuario_id, creado_en)
SELECT id, producto_id, cantidad, descripcion, principal, activo, tipo_presentacion_id, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, producto_id, cantidad, descripcion, principal, activo, tipo_presentacion_id, usuario_id, creado_en FROM productos.presentacion') AS t1(id bigint, producto_id bigint, cantidad numeric, descripcion character varying, principal boolean, activo boolean, tipo_presentacion_id bigint, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 3.2: TABLAS FINANCIERAS COMPLEJAS
-- =====================================================

-- financiero.cuenta_bancaria (depende de financiero.banco, personas.persona, personas.usuario)
INSERT INTO financiero.cuenta_bancaria (id, banco_id, persona_id, numero_cuenta, tipo_cuenta, saldo, activo, usuario_id, creado_en)
SELECT id, persona_id, banco_id, moneda_id, numero, usuario_id, creado_en, tipo_cuenta FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, persona_id, banco_id, moneda_id, numero, usuario_id, creado_en, tipo_cuenta FROM financiero.cuenta_bancaria') AS t1(id bigint, persona_id bigint, banco_id bigint, moneda_id bigint, numero character varying, usuario_id bigint, creado_en timestamp with time zone, tipo_cuenta financiero.tipo_cuenta);

-- =====================================================
-- NIVEL 3.3: TABLAS DE OPERACIONES COMPLEJAS
-- =====================================================

-- operaciones.pedido (depende de personas.usuario, empresarial.sucursal)
INSERT INTO operaciones.pedido (id, usuario_id, sucursal_id, creado_en)
SELECT id, usuario_id, sucursal_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, usuario_id, sucursal_id, creado_en FROM operaciones.pedido') AS t1(id bigint, usuario_id bigint, sucursal_id bigint, creado_en timestamp with time zone);

-- operaciones.pedido_item (depende de operaciones.pedido, productos.producto, productos.presentacion)
INSERT INTO operaciones.pedido_item (id, pedido_id, producto_id, presentacion_id, cantidad, usuario_id, creado_en)
SELECT id, pedido_id, producto_id, presentacion_id, cantidad, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, pedido_id, producto_id, presentacion_id, cantidad, usuario_id, creado_en FROM operaciones.pedido_item') AS t1(id bigint, pedido_id bigint, producto_id bigint, presentacion_id bigint, cantidad numeric, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 4: TABLAS DE TRANSACCIONES Y DATOS ESPECÍFICOS DE SUCURSAL
-- =====================================================

-- =====================================================
-- NIVEL 4.1: TABLAS DE INVENTARIO Y STOCK
-- =====================================================

-- operaciones.stock_por_producto_sucursal (depende de productos.producto, empresarial.sucursal)
-- FILTRADO POR sucursal_id = 25
INSERT INTO operaciones.stock_por_producto_sucursal (id, producto_id, sucursal_id, stock_minimo, stock_maximo, stock_actual, usuario_id, creado_en)
SELECT id, producto_id, sucursal_id, stock_minimo, stock_maximo, stock_actual, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, producto_id, sucursal_id, stock_minimo, stock_maximo, stock_actual, usuario_id, creado_en FROM operaciones.stock_por_producto_sucursal WHERE sucursal_id = 25') AS t1(id bigint, producto_id bigint, sucursal_id bigint, stock_minimo numeric, stock_maximo numeric, stock_actual numeric, usuario_id bigint, creado_en timestamp with time zone);

-- operaciones.movimiento_stock (depende de productos.producto, empresarial.sucursal)
-- FILTRADO POR sucursal_id = 25
INSERT INTO operaciones.movimiento_stock (id, producto_id, sucursal_id, tipo_movimiento, cantidad, motivo, usuario_id, creado_en)
SELECT id, producto_id, sucursal_id, tipo_movimiento, cantidad, motivo, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, producto_id, sucursal_id, tipo_movimiento, cantidad, motivo, usuario_id, creado_en FROM operaciones.movimiento_stock WHERE sucursal_id = 25') AS t1(id bigint, producto_id bigint, sucursal_id bigint, tipo_movimiento operaciones.tipo_movimiento, cantidad numeric, motivo character varying, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 4.2: TABLAS DE VENTAS Y TRANSACCIONES
-- =====================================================

-- operaciones.venta (depende de personas.usuario, empresarial.sucursal)
-- FILTRADO POR sucursal_id = 25
INSERT INTO operaciones.venta (id, usuario_id, sucursal_id, total, estado, creado_en)
SELECT id, usuario_id, sucursal_id, total, estado, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, usuario_id, sucursal_id, total, estado, creado_en FROM operaciones.venta WHERE sucursal_id = 25') AS t1(id bigint, usuario_id bigint, sucursal_id bigint, total numeric, estado operaciones.venta_estado, creado_en timestamp with time zone);

-- operaciones.venta_item (depende de operaciones.venta, productos.producto, productos.presentacion)
INSERT INTO operaciones.venta_item (id, venta_id, producto_id, presentacion_id, cantidad, precio_unitario, descuento, usuario_id, creado_en)
SELECT id, venta_id, producto_id, presentacion_id, cantidad, precio_unitario, descuento, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, venta_id, producto_id, presentacion_id, cantidad, precio_unitario, descuento, usuario_id, creado_en FROM operaciones.venta_item WHERE venta_id IN (SELECT id FROM operaciones.venta WHERE sucursal_id = 25)') AS t1(id bigint, venta_id bigint, producto_id bigint, presentacion_id bigint, cantidad numeric, precio_unitario numeric, descuento numeric, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 4.3: TABLAS DE FACTURACIÓN Y PAGOS
-- =====================================================

-- financiero.factura_legal (depende de operaciones.venta, personas.usuario)
-- FILTRADO POR sucursal_id = 25
INSERT INTO financiero.factura_legal (id, venta_id, numero_factura, ruc, razon_social, total, usuario_id, creado_en, sucursal_id)
SELECT id, venta_id, numero_factura, ruc, razon_social, total, usuario_id, creado_en, sucursal_id FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, venta_id, numero_factura, ruc, razon_social, total, usuario_id, creado_en, sucursal_id FROM financiero.factura_legal WHERE sucursal_id = 25') AS t1(id bigint, venta_id bigint, numero_factura character varying, ruc character varying, razon_social character varying, total numeric, usuario_id bigint, creado_en timestamp with time zone, sucursal_id bigint);

-- financiero.factura_legal_item (depende de financiero.factura_legal, operaciones.venta_item)
INSERT INTO financiero.factura_legal_item (id, factura_legal_id, venta_item_id, cantidad, precio_unitario, descuento, usuario_id, creado_en)
SELECT id, factura_legal_id, venta_item_id, cantidad, precio_unitario, descuento, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, factura_legal_id, venta_item_id, cantidad, precio_unitario, descuento, usuario_id, creado_en FROM financiero.factura_legal_item WHERE factura_legal_id IN (SELECT id FROM financiero.factura_legal WHERE sucursal_id = 25)') AS t1(id bigint, factura_legal_id bigint, venta_item_id bigint, cantidad numeric, precio_unitario numeric, descuento numeric, usuario_id bigint, creado_en timestamp with time zone);

-- operaciones.cobro_detalle (depende de operaciones.cobro, financiero.forma_pago)
INSERT INTO operaciones.cobro_detalle (id, cobro_id, forma_pago_id, monto, usuario_id, creado_en)
SELECT id, cobro_id, forma_pago_id, monto, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, cobro_id, forma_pago_id, monto, usuario_id, creado_en FROM operaciones.cobro_detalle WHERE cobro_id IN (SELECT id FROM operaciones.cobro WHERE sucursal_id = 25)') AS t1(id bigint, cobro_id bigint, forma_pago_id bigint, monto numeric, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 5: TABLAS DE CONFIGURACIÓN ESPECÍFICA Y DATOS FINALES
-- =====================================================

-- =====================================================
-- NIVEL 5.1: TABLAS DE PRECIOS Y COSTOS
-- =====================================================

-- productos.precio_por_sucursal (depende de productos.presentacion, empresarial.sucursal)
-- CARGA COMPLETA: Sin filtro de sucursal_id para tener todos los precios
INSERT INTO productos.precio_por_sucursal (id, presentacion_id, sucursal_id, precio, activo, usuario_id, creado_en)
SELECT id, presentacion_id, sucursal_id, precio, activo, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, presentacion_id, sucursal_id, precio, activo, usuario_id, creado_en FROM productos.precio_por_sucursal') AS t1(id bigint, presentacion_id bigint, sucursal_id bigint, precio numeric, activo boolean, usuario_id bigint, creado_en timestamp with time zone);

-- productos.costo_por_producto (depende de productos.producto, empresarial.sucursal)
-- CARGA COMPLETA: Sin filtro de sucursal_id para tener todos los costos
INSERT INTO productos.costo_por_producto (id, producto_id, sucursal_id, costo, activo, usuario_id, creado_en)
SELECT id, producto_id, sucursal_id, costo, activo, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, producto_id, sucursal_id, costo, activo, usuario_id, creado_en FROM productos.costo_por_producto') AS t1(id bigint, producto_id bigint, sucursal_id bigint, costo numeric, activo boolean, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 5.2: TABLAS DE DELIVERY Y TRANSFERENCIAS
-- =====================================================

-- operaciones.delivery (depende de personas.usuario, empresarial.sucursal)
-- FILTRADO POR sucursal_id = 25
INSERT INTO operaciones.delivery (id, usuario_id, sucursal_id, estado, creado_en)
SELECT id, usuario_id, sucursal_id, estado, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, usuario_id, sucursal_id, estado, creado_en FROM operaciones.delivery WHERE sucursal_id = 25') AS t1(id bigint, usuario_id bigint, sucursal_id bigint, estado operaciones.delivery_estado, creado_en timestamp with time zone);

-- operaciones.transferencia (depende de empresarial.sucursal)
-- FILTRADO POR sucursal_origen_id = 25 O sucursal_destino_id = 25
INSERT INTO operaciones.transferencia (id, sucursal_origen_id, sucursal_destino_id, estado, usuario_id, creado_en)
SELECT id, sucursal_origen_id, sucursal_destino_id, estado, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, sucursal_origen_id, sucursal_destino_id, estado, usuario_id, creado_en FROM operaciones.transferencia WHERE sucursal_origen_id = 25 OR sucursal_destino_id = 25') AS t1(id bigint, sucursal_origen_id bigint, sucursal_destino_id bigint, estado operaciones.transferencia_estado, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 5.3: TABLAS DE CONFIGURACIÓN ESPECÍFICA
-- =====================================================

-- productos.producto_por_sucursal (depende de productos.producto, empresarial.sucursal)
-- FILTRADO POR sucursal_id = 25
INSERT INTO productos.producto_por_sucursal (id, producto_id, sucursal_id, activo, usuario_id, creado_en)
SELECT id, producto_id, sucursal_id, activo, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, producto_id, sucursal_id, activo, usuario_id, creado_en FROM productos.producto_por_sucursal WHERE sucursal_id = 25') AS t1(id bigint, producto_id bigint, sucursal_id bigint, activo boolean, usuario_id bigint, creado_en timestamp with time zone);

-- configuraciones.local (depende de personas.usuario)
INSERT INTO configuraciones.local (id, nombre, descripcion, usuario_id, creado_en)
SELECT id, nombre, descripcion, usuario_id, creado_en FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT id, nombre, descripcion, usuario_id, creado_en FROM configuraciones.local') AS t1(id bigint, nombre character varying, descripcion character varying, usuario_id bigint, creado_en timestamp with time zone);

-- =====================================================
-- NIVEL 5.4: RESOLUCIÓN DE DEPENDENCIAS CIRCULARES
-- =====================================================

-- Actualizar dependencias circulares entre personas.persona y personas.usuario
UPDATE personas.persona SET usuario_id = u.id 
FROM personas.usuario u 
WHERE personas.persona.id = u.usuario_id;

UPDATE personas.usuario SET persona_id = p.id 
FROM personas.persona p 
WHERE personas.usuario.usuario_id = p.id;

INSERT INTO operaciones.pedido_item_sucursal 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.pedido_item_sucursal') AS t1;

INSERT INTO operaciones.precio_delivery 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.precio_delivery') AS t1;

INSERT INTO operaciones.programar_precio 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.programar_precio') AS t1;

INSERT INTO operaciones.salida 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.salida') AS t1;

INSERT INTO operaciones.salida_item 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.salida_item') AS t1;

INSERT INTO operaciones.transferencia 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.transferencia') AS t1;

INSERT INTO operaciones.transferencia_item 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.transferencia_item') AS t1;

-- 3.2 Cargar datos específicos de sucursal 25 desde bodega
-- Estas tablas tienen discriminación por sucursal_id

-- Esquema administrativo
INSERT INTO administrativo.marcacion 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM administrativo.marcacion WHERE sucursal_id = 25') AS t1;

-- Esquema configuraciones
INSERT INTO configuraciones.inicio_sesion 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM configuraciones.inicio_sesion WHERE sucursal_id = 25') AS t1;

-- Esquema financiero
INSERT INTO financiero.cambio_caja 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.cambio_caja WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.conteo 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.conteo WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.conteo_moneda 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.conteo_moneda WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.factura_legal 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.factura_legal WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.factura_legal_item 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.factura_legal_item WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.gasto 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.gasto WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.gasto_detalle 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.gasto_detalle WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.maletin 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.maletin WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.movimiento_caja 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.movimiento_caja WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.pdv_caja 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.pdv_caja WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.retiro 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.retiro WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.retiro_detalle 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.retiro_detalle WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.sencillo 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.sencillo WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.sencillo_detalle 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.sencillo_detalle WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.venta_credito 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.venta_credito WHERE sucursal_id = 25') AS t1;

INSERT INTO financiero.venta_credito_cuota 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM financiero.venta_credito_cuota WHERE sucursal_id = 25') AS t1;

-- Esquema operaciones
INSERT INTO operaciones.cobro 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.cobro WHERE sucursal_id = 25') AS t1;

INSERT INTO operaciones.cobro_detalle 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.cobro_detalle WHERE sucursal_id = 25') AS t1;

INSERT INTO operaciones.delivery 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.delivery WHERE sucursal_id = 25') AS t1;

INSERT INTO operaciones.movimiento_stock 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.movimiento_stock WHERE sucursal_id = 25') AS t1;

INSERT INTO operaciones.stock_por_producto_sucursal 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.stock_por_producto_sucursal WHERE sucursal_id = 25') AS t1;

INSERT INTO operaciones.venta 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.venta WHERE sucursal_id = 25') AS t1;

INSERT INTO operaciones.venta_item 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.venta_item WHERE sucursal_id = 25') AS t1;

INSERT INTO operaciones.vuelto 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.vuelto WHERE sucursal_id = 25') AS t1;

INSERT INTO operaciones.vuelto_item 
SELECT * FROM dblink('host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco', 
'SELECT * FROM operaciones.vuelto_item WHERE sucursal_id = 25') AS t1;

-- 3.3 Verificar integridad referencial
-- SELECT 'marcacion' as tabla, COUNT(*) as registros FROM administrativo.marcacion 
-- UNION ALL 
-- SELECT 'inicio_sesion', COUNT(*) FROM configuraciones.inicio_sesion 
-- UNION ALL 
-- SELECT 'cambio_caja', COUNT(*) FROM financiero.cambio_caja 
-- UNION ALL 
-- SELECT 'venta', COUNT(*) FROM operaciones.venta;

-- =====================================================
-- FASE 4: CONFIGURACIÓN DE REPLICACIÓN LÓGICA
-- =====================================================

-- 4.1 Crear publicación central_filial25_pub en bodega
-- Ejecutar en bodega (172.25.1.200:5551):
-- CREATE PUBLICATION central_filial25_pub;

-- 4.2 Agregar las 27 tablas necesarias a la publicación
-- Ejecutar en bodega (172.25.1.200:5551):

-- ALTER PUBLICATION central_filial25_pub ADD TABLE administrativo.marcacion;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE configuraciones.inicio_sesion;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.cambio_caja;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.conteo;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.conteo_moneda;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.factura_legal;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.factura_legal_item;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.gasto;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.gasto_detalle;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.maletin;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.movimiento_caja;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.pdv_caja;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.retiro;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.retiro_detalle;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.sencillo;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.sencillo_detalle;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.venta_credito;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE financiero.venta_credito_cuota;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE operaciones.cobro;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE operaciones.cobro_detalle;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE operaciones.delivery;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE operaciones.movimiento_stock;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE operaciones.stock_por_producto_sucursal;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE operaciones.venta;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE operaciones.venta_item;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE operaciones.vuelto;
-- ALTER PUBLICATION central_filial25_pub ADD TABLE operaciones.vuelto_item;

-- 4.3 Crear suscripción filial25_sub en filial 25
-- Ejecutar en filial 25 (172.25.1.25:5551):
-- CREATE SUBSCRIPTION filial25_sub 
-- CONNECTION 'host=172.25.1.200 port=5551 dbname=bodega user=franco password=franco' 
-- PUBLICATION central_filial25_pub;

-- 4.4 Verificar configuración de replicación
-- SELECT subname, subenabled, subconninfo FROM pg_subscription;
-- SELECT slot_name, plugin, slot_type, database, active FROM pg_replication_slots;

-- =====================================================
-- FASE 5: VERIFICACIÓN Y PRUEBAS
-- =====================================================

-- 5.1 Verificar sincronización de replicación lógica
-- SELECT * FROM pg_stat_subscription;

-- 5.2 Probar operaciones CRUD básicas
-- INSERT INTO administrativo.marcacion (sucursal_id, empleado_id, fecha_hora, tipo) 
-- VALUES (25, 1, NOW(), 'ENTRADA');

-- 5.3 Verificar integridad referencial completa
-- SELECT 
--     tc.table_schema, 
--     tc.table_name, 
--     kcu.column_name, 
--     ccu.table_schema AS foreign_table_schema,
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name 
-- FROM 
--     information_schema.table_constraints AS tc 
--     JOIN information_schema.key_column_usage AS kcu
--       ON tc.constraint_name = kcu.constraint_name
--       AND tc.table_schema = kcu.table_schema
--     JOIN information_schema.constraint_column_usage AS ccu
--       ON ccu.constraint_name = tc.constraint_name
--       AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
-- AND tc.table_schema IN ('administrativo', 'configuraciones', 'financiero', 'operaciones');

-- =====================================================
-- COMANDOS DE VERIFICACIÓN FINAL
-- =====================================================

-- Verificar tablas replicadas
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'central_filial25_pub' ORDER BY schemaname, tablename;

-- Verificar suscripción activa
-- SELECT subname, subenabled, subconninfo FROM pg_subscription;

-- Verificar slots de replicación
-- SELECT slot_name, plugin, slot_type, database, active FROM pg_replication_slots;

-- Verificar estadísticas de replicación
-- SELECT * FROM pg_stat_subscription;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Ejecutar los comandos DROP SUBSCRIPTION por separado (no en transacción)
-- 2. Verificar conectividad antes de cada fase
-- 3. Hacer backup antes de DROP DATABASE
-- 4. Verificar integridad después de cada fase
-- 5. Documentar cualquier error o excepción
-- 6. Mantener registro de tiempos de ejecución
-- ===================================================== 