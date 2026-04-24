# TODO List: Backend - Recepción de Mercadería Móvil

Este documento detalla todas las tareas de backend necesarias para implementar el nuevo flujo de recepción de mercadería móvil. Se prioriza la reutilización de la lógica existente siempre que sea posible.

---

## Fase 1: Modelado de Datos y Entidades

### 1.1. Modificar Entidad Existente: `RecepcionMercaderiaItem`
- **Archivo:** `src/main/java/com/franco/dev/domain/operaciones/RecepcionMercaderiaItem.java`
- **Objetivo:** Añadir campos para auditoría de verificación.
- **Tareas:**
  - [x] Añadir campo `metodoVerificacion` de tipo `MetodoVerificacion` (nuevo enum).
    ```java
    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_verificacion")
    @Type(type = "metodo_verificacion")
    private MetodoVerificacion metodoVerificacion;
    ```
  - [x] Añadir campo `motivoVerificacionManual` de tipo `MotivoVerificacionManual` (nuevo enum), nullable.
    ```java
    @Enumerated(EnumType.STRING)
    @Column(name = "motivo_verificacion_manual")
    @Type(type = "motivo_verificacion_manual")
    private MotivoVerificacionManual motivoVerificacionManual;
    ```

### 1.2. Crear Nueva Entidad: `ProductoVencimiento`
- **Archivo:** `src/main/java/com/franco/dev/domain/operaciones/ProductoVencimiento.java`
- **Objetivo:** Crear una tabla genérica para auditar todos los vencimientos.
- **Tareas:**
  - [x] Crear la clase `ProductoVencimiento` con los siguientes campos y anotaciones:
    - `id` (PK, `BIGSERIAL`)
    - `producto` (`@ManyToOne` a `Producto`)
    - `presentacion` (`@ManyToOne` a `Presentacion`)
    - `sucursal` (`@ManyToOne` a `Sucursal`)
    - `fechaVencimiento` (`LocalDate`)
    - `cantidad` (`Double`)
    - `tipoOrigen` (`Enum TipoOrigenVencimiento`)
    - `origenId` (`Long`)
    - `usuario` (`@ManyToOne` a `Usuario`)
    - `fechaCreacion` (`LocalDateTime`)

### 1.3. Crear Nueva Entidad: `ConstanciaDeRecepcion`
- **Archivo:** `src/main/java/com/franco/dev/domain/operaciones/ConstanciaDeRecepcion.java`
- **Objetivo:** Crear el documento formal e inmutable que se entrega al proveedor.
- **Tareas:**
  - [x] Crear la clase `ConstanciaDeRecepcion` con los siguientes campos y anotaciones:
    - `id` (PK, `BIGSERIAL`)
    - `recepcionMercaderia` (`@OneToOne` o `@ManyToOne` a `RecepcionMercaderia`)
    - `proveedor` (`@ManyToOne` a `Proveedor`)
    - `sucursal` (`@ManyToOne` a `Sucursal`)
    - `fechaEmision` (`LocalDateTime`)
    - `usuario` (`@ManyToOne` a `Usuario`)
    - `codigoVerificacion` (`String`, único)
    - `estado` (`Enum EstadoConstancia`)

### 1.4. Crear Nueva Entidad: `ConstanciaDeRecepcionItem`
- **Archivo:** `src/main/java/com/franco/dev/domain/operaciones/ConstanciaDeRecepcionItem.java`
- **Objetivo:** Detallar los ítems de la constancia.
- **Tareas:**
  - [x] Crear la clase `ConstanciaDeRecepcionItem` con los siguientes campos y anotaciones:
    - `id` (PK, `BIGSERIAL`)
    - `constanciaDeRecepcion` (`@ManyToOne` a `ConstanciaDeRecepcion`)
    - `producto` (`@ManyToOne` a `Producto`)
    - `presentacion` (`@ManyToOne` a `Presentacion`)
    - `cantidadRecibida` (`Double`)
    - `cantidadRechazadaFisico` (`Double`)

---

## Fase 2: Enums y Tipos de Base de Datos

- **Objetivo:** Definir los nuevos enums y registrarlos en PostgreSQL.
- **Tareas:**
  - [x] Crear enum `com.franco.dev.domain.operaciones.enums.MetodoVerificacion` (`ESCANER`, `MANUAL`).
  - [x] Crear enum `com.franco.dev.domain.operaciones.enums.MotivoVerificacionManual` (`CODIGO_ILEGIBLE`, `PRODUCTO_SIN_CODIGO`).
  - [x] Crear enum `com.franco.dev.domain.operaciones.enums.TipoOrigenVencimiento` (`RECEPCION_MERCADERIA`, `AJUSTE_STOCK`, `VENTA`, `TRANSFERENCIA`).
  - [x] Crear enum `com.franco.dev.domain.operaciones.enums.EstadoConstancia` (`EMITIDA`, `ANULADA`).
  - [x] Registrar todos los enums en `PostgreSQLEnumType` o asegurar que el `@TypeDef` se use correctamente en cada entidad.

---

## Fase 3: Capa de Acceso a Datos (Repositorios)

- **Objetivo:** Crear las interfaces de JpaRepository para las nuevas entidades.
- **Tareas:**
  - [x] Crear `ProductoVencimientoRepository`.
  - [x] Crear `ConstanciaDeRecepcionRepository`.
  - [x] Crear `ConstanciaDeRecepcionItemRepository`.
  - [ ] **Revisar `RecepcionMercaderiaItemRepository`**: No se necesitan cambios para guardar los nuevos campos.

---

## Fase 4: Capa de Servicio (Lógica de Negocio)

- **Objetivo:** Implementar la lógica de negocio para las nuevas entidades y reutilizar la existente.
- **Tareas:**
  - [ ] Crear `ProductoVencimientoService`.
  - [x] Crear `ProductoVencimientoService`.
  - [x] Crear `ConstanciaDeRecepcionService`.
  - [ ] Crear `ConstanciaDeRecepcionItemService`.
  - [ ] **Revisar `RecepcionMercaderiaItemService`**: La lógica principal de guardado ya existe. Se debe asegurar que el método `save` mapee los nuevos campos (`metodoVerificacion`, `motivoVerificacionManual`) desde el input.
  - [ ] **Revisar `RecepcionMercaderiaService`**: Será utilizado por los nuevos resolvers de GraphQL.

---

## Fase 5: API GraphQL (Resolvers)

### 5.1. Nuevas Queries
- **Objetivo:** Implementar los resolvers para las queries definidas para el flujo móvil.
- **Tareas:**
  - [x] **Implementar `notasPendientes(sucursalId, proveedorId)`**:
    - Usará `NotaRecepcionRepository` para buscar notas con estados apropiados (ej. `CONCILIADA`), filtrando por `sucursalId` (a través de las distribuciones) y opcionalmente por `proveedorId`.
  - [x] **Implementar `productosAgrupadosPorNotas(notaRecepcionIds)`**:
    - Este será el resolver más complejo.
    - 1. Recibe una lista de `notaRecepcionIds`.
    - 2. Busca todos los `NotaRecepcionItemDistribucion` asociados. (Agregado repo/service `findByNotaRecepcionIds`)
    - 3. Agrupa los resultados por `producto.id`.
    - 4. Construye y devuelve una lista de `ProductoAgrupadoDTO` (DTO creado) como se especificó en el manual.

### 5.2. Nuevas Mutaciones
- **Objetivo:** Implementar los resolvers para las mutaciones específicas del flujo móvil.
- **Tareas:**
  - [x] **Implementar `iniciarRecepcion(input)`**:
    - Crea una entidad `RecepcionMercaderia` con estado `EN_PROCESO`.
    - Itera sobre los `notaRecepcionIds` del input y crea las asociaciones en `RecepcionMercaderiaNota`.
    - Devuelve la `RecepcionMercaderia` creada.
  - [x] **Implementar `finalizarRecepcion(recepcionMercaderiaId)`**:
    - **Paso 1:** Validar que la recepción se pueda finalizar (todos los ítems procesados).
    - **Paso 2:** Cambiar el estado de `RecepcionMercaderia` a `FINALIZADO`.
    - **Paso 3:** Llamar a `ConstanciaDeRecepcionService` para generar la constancia y sus ítems.
    - **Paso 4:** Iterar sobre los `RecepcionMercaderiaItem` y llamar a `MovimientoStockService` para generar los movimientos de `ENTRADA_POR_COMPRA`.
    - **Paso 5:** Iterar sobre los `RecepcionMercaderiaItem` y llamar a `CostoService` para actualizar/crear los costos.
    - **Paso 6:** Actualizar el estado de los `NotaRecepcion` originales a `RECEPCION_COMPLETA` o `RECEPCION_PARCIAL`.
    - **Paso 7:** Envolver todo en una transacción (`@Transactional`).
    - **Paso 8:** Devolver la `ConstanciaDeRecepcion` generada.

### 5.3. Reutilización de Mutaciones Existentes
- **Objetivo:** Asegurar que los resolvers existentes son compatibles y se utilizan correctamente.
- **Tareas:**
  - [ ] **Revisar `saveRecepcionMercaderiaItem(input)`**:
    - El frontend móvil llamará a esta misma mutación.
    - El `RecepcionMercaderiaItemInput` DTO deberá ser actualizado para incluir los nuevos campos: `metodoVerificacion`, `motivoVerificacionManual`, y `presentacionRecibidaId`.
    - El resolver debe mapear estos nuevos campos del input a la entidad antes de guardarla. La lógica de reutilización/creación de `RecepcionMercaderia` ya está implementada aquí y debe ser aprovechada.
  - [ ] **Revisar `cancelarVerificacion` y `cancelarRechazo`**:
    - No se necesitan cambios. Son directamente reutilizables.

---

## Fase 6: Migraciones de Base de Datos (Flyway)

- **Objetivo:** Crear los scripts de migración para los nuevos cambios en el esquema.
- **Tareas:**
  - [x] Crear un nuevo script de migración (`V96__recepcion_mobile_enums_tables_and_audit.sql`).
  - [x] Añadir `CREATE TYPE` para los nuevos enums.
  - [x] Añadir `CREATE TABLE` para `producto_vencimiento`, `constancia_de_recepcion` y `constancia_de_recepcion_item` con todas sus columnas, constraints (FK) e índices.
  - [x] Añadir `ALTER TABLE recepcion_mercaderia_item` para agregar las nuevas columnas `metodo_verificacion` y `motivo_verificacion_manual`.
