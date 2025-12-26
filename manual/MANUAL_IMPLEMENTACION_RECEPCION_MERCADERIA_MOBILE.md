# Manual de Implementación: Recepción de Mercadería (Móvil)

## 📊 **1. RESUMEN EJECUTIVO**

### **1.1. Objetivo**
Implementar un flujo de trabajo para la **Recepción Física de Mercadería** optimizado para dispositivos móviles. Este sistema será el método principal y por defecto para la recepción, relegando la versión de escritorio a un rol de soporte para casos especiales. El objetivo es proporcionar una herramienta ágil, intuitiva y robusta para el personal de operaciones en la sucursal, garantizando la correcta verificación de los productos recibidos contra las notas de recepción documentales.

### **1.2. Principios Clave**
- **Mobile-First**: Diseñado y optimizado para la experiencia en dispositivos móviles.
- **Centrado en el Operario**: La interfaz debe ser simple, con información clara y concisa, eliminando datos financieros irrelevantes para el proceso de verificación física (valores, descuentos, etc.).
- **Verificación In-Situ**: El sistema requiere que el usuario esté físicamente en la sucursal de recepción, validado por GPS o QR.
- **Independencia del Pedido**: El flujo se centra en las **Notas de Recepción** como protagonistas, permitiendo procesar una o varias simultáneamente.
- **Trazabilidad y Auditoría**: Cada acción de verificación, modificación o rechazo quedará registrada, asegurando una trazabilidad completa del proceso.

### **1.3. Flujo General**
1.  **Validación de Ubicación**: El operario valida su presencia en la sucursal.
2.  **Selección de Notas**: Se seleccionan una o más notas de recepción del mismo proveedor.
3.  **Inicio de Sesión de Recepción**: Se crea una `RecepcionMercaderia` que agrupa toda la operación.
4.  **Verificación de Productos**: En modo "Agrupado por Producto", se verifican los ítems usando lector de código de barras o selección manual.
5.  **Registro de Cantidades y Vencimientos**: Se registran las cantidades recibidas y, si aplica, las fechas de vencimiento (soportando múltiples vencimientos por producto).
6.  **Finalización y Constancia**: Al terminar, se genera una **Constancia de Recepción** como comprobante para el proveedor.

---

## 🏛️ **2. ENTIDADES DEL DOMINIO**

Se utilizarán entidades existentes y se crearán nuevas para soportar el flujo de trabajo.

### **2.1. Entidades Existentes Clave**
- `RecepcionMercaderia`, `RecepcionMercaderiaNota`, `NotaRecepcion`, `NotaRecepcionItem`, `Producto`, `Presentacion`, `Proveedor`, `Sucursal`, `Usuario`.

#### **2.1.1. Modificación a `RecepcionMercaderiaItem`**
- Para soportar una auditoría robusta, se agregarán campos críticos a la entidad `RecepcionMercaderiaItem`:
  - **`metodoVerificacion`**: `Enum` (`ESCANER`, `MANUAL`). Registrará si la verificación fue por escáner (método seguro) o manual (método excepcional).
  - **`motivoVerificacionManual`**: `Enum` (`CODIGO_ILEGIBLE`, `PRODUCTO_SIN_CODIGO`) (nullable). Almacenará el motivo seleccionado por el usuario cuando el `metodoVerificacion` es `MANUAL`. Este dato es fundamental para la auditoría.

### **2.2. Nuevas Entidades a Crear**

#### **2.2.1. `ProductoVencimiento`**
Tabla genérica y centralizada para auditar todos los movimientos de stock que involucren una fecha de vencimiento.

- **Tabla**: `producto_vencimiento`
- **Schema**: `operaciones`
- **Campos**:
  - `id`: `BIGSERIAL` (PK)
  - `producto_id`: `BIGINT` (FK a `productos.producto`)
  - `presentacion_id`: `BIGINT` (FK a `productos.presentacion`)
  - `sucursal_id`: `BIGINT` (FK a `empresarial.sucursal`)
  - `fecha_vencimiento`: `DATE`
  - `cantidad`: `NUMERIC` (Cantidad en la unidad de la presentación)
  - `tipo_origen`: `VARCHAR` (Enum: `RECEPCION_MERCADERIA`, `AJUSTE_STOCK`, `VENTA`, `TRANSFERENCIA`)
  - `origen_id`: `BIGINT` (ID de la entidad de origen, ej: `recepcion_mercaderia_item.id`)
  - `usuario_id`: `BIGINT` (FK a `personas.usuario`)
  - `fecha_creacion`: `TIMESTAMP`

#### **2.2.2. `ConstanciaDeRecepcion`**
Documento final que se genera al finalizar la recepción y que sirve como comprobante para el proveedor.

- **Tabla**: `constancia_de_recepcion`
- **Schema**: `operaciones`
- **Campos**:
  - `id`: `BIGSERIAL` (PK)
  - `recepcion_mercaderia_id`: `BIGINT` (FK a `operaciones.recepcion_mercaderia`)
  - `proveedor_id`: `BIGINT` (FK a `personas.proveedor`)
  - `sucursal_id`: `BIGINT` (FK a `empresarial.sucursal`)
  - `fecha_emision`: `TIMESTAMP`
  - `usuario_id`: `BIGINT` (FK a `personas.usuario`)
  - `codigo_verificacion`: `VARCHAR` (Código único para validación externa)
  - `estado`: `VARCHAR` (Enum: `EMITIDA`, `ANULADA`)

#### **2.2.3. `ConstanciaDeRecepcionItem`**
Detalle de los productos incluidos en la constancia.

- **Tabla**: `constancia_de_recepcion_item`
- **Schema**: `operaciones`
- **Campos**:
  - `id`: `BIGSERIAL` (PK)
  - `constancia_de_recepcion_id`: `BIGINT` (FK a `constancia_de_recepcion`)
  - `producto_id`: `BIGINT` (FK a `productos.producto`)
  - `presentacion_id`: `BIGINT` (FK a `productos.presentacion`)
  - `cantidad_recibida`: `NUMERIC`
  - `cantidad_rechazada_fisico`: `NUMERIC`

---

## ⚙️ **3. FLUJO DE TRABAJO Y REQUERIMIENTOS FUNCIONALES**

### **3.1. Inicio de Sesión y Selección de Notas**
- **RF-01**: El usuario debe validar su presencia en la sucursal de recepción mediante los mecanismos existentes (QR o Geocalización).
- **RF-02**: Una vez validado, la aplicación presentará una interfaz limpia para la selección de notas. La pantalla contendrá:
    - Un campo para seleccionar un `Proveedor` (opcional, actúa como filtro pre-búsqueda).
    - Un campo de texto para ingresar manualmente un `número de nota de recepción`.
    - Un **ícono de búsqueda** junto al campo de texto.
- **RF-03: Búsqueda y Selección de Notas**: El usuario tiene dos maneras de agregar notas a la sesión:
    - **Entrada Directa**: El usuario ingresa un número de nota. Si el resultado es único, se muestra un diálogo de confirmación con los detalles de la nota. Si no es único, se muestra una lista para que elija.
    - **Búsqueda Asistida**: Al hacer clic en el **ícono de búsqueda**, se abrirá un **diálogo modal**. Este diálogo contendrá la lista completa de todas las `NotaRecepcion` pendientes para la sucursal, con herramientas para buscar y filtrar.
- **RF-04**: Tras seleccionar una nota por cualquiera de los dos métodos, se mostrará un **diálogo de confirmación** con información mínima (Proveedor, fecha, etc.) para que el usuario verifique que es la correcta antes de agregarla a la lista de sesión.
- **RF-05**: Las notas confirmadas se irán agregando a una lista visible en la pantalla principal ("Notas a Recepcionar en esta Sesión"), con una opción para remover cada una.
- **RF-06**: Un botón de acción principal ("Iniciar Recepción") estará presente en el footer. Este botón se habilitará únicamente cuando haya al menos una nota en la lista de sesión.
- **R-01 (Regla de Negocio)**: El sistema debe validar que todas las notas agregadas a la sesión pertenezcan al mismo `Proveedor`.
- **R-02 (Regla de Negocio)**: El sistema debe filtrar y permitir seleccionar únicamente notas que no hayan sido completamente recepcionadas en la sucursal actual.
- **RF-07**: Al presionar "Iniciar Recepción", el sistema crea una única instancia de `RecepcionMercaderia` con estado `EN_PROCESO`, asociando todas las `NotaRecepcion` seleccionadas.
- **RF-08**: El modo de trabajo por defecto será **"Agrupar por Productos"**. Se debe proveer una opción en la UI para cambiar al modo "Agrupar por Notas".

### **3.3. Recepción Agrupada por Producto (Implementación Inicial)**
- **RF-09: Interfaz de Verificación**: La pantalla principal para la verificación de productos se compondrá de dos partes: una sección de búsqueda y una lista de productos.
- **RF-10: Búsqueda Proactiva de Producto**: En la parte superior, se mostrará un campo de búsqueda para que el usuario pueda encontrar un producto por su **nombre o código**. Junto al campo, un **ícono de lector de código de barras** permitirá activar la cámara para escanear directamente.
    - Si el producto escaneado o buscado se encuentra en la sesión de recepción, el sistema abrirá directamente el **Diálogo de Verificación Detallada** (ver 3.4) para ese producto.
- **RF-11: Lista de Productos Pendientes**: Debajo de la barra de búsqueda, se mostrará la lista de productos únicos pendientes de verificar. Cada ítem de la lista mostrará:
    - Información esencial: **Imagen, Nombre del Producto, Código Principal y Cantidad Total Esperada**.
    - **Dos íconos de acción para verificar**:
        1.  **Verificar con Escáner (Recomendado)**: Un ícono de código de barras que abre el lector. El usuario debe escanear el producto físico para confirmar que es el correcto antes de abrir el diálogo de verificación.
        2.  **Verificación Manual (Excepcional)**: Un ícono alternativo (ej. un check manual) para casos donde el producto no tiene código o es ilegible.
- **R-03 (Regla de Auditoría y Responsabilidad)**: Al usar la **Verificación Manual**, el sistema debe:
    - Mostrar un **diálogo de advertencia** informando al usuario que está realizando una verificación sin la confirmación del escáner y que la responsabilidad es suya.
    - Solicitar al usuario que seleccione un motivo para la verificación manual (ej. botones: "Producto sin código de barras", "Código de barras ilegible", u otras opciones en un dropdown).
    - Registrar tanto el `metodoVerificacion` como 'MANUAL', como también el motivo seleccionado para fines de auditoría.
- **RF-12: Apertura del Diálogo de Verificación**: El **Diálogo de Verificación Detallada** (ver 3.4) es el paso central para registrar la recepción de CUALQUIER producto. Se abrirá **siempre** que el usuario inicie una acción de verificación, ya sea mediante la búsqueda proactiva o desde los íconos de la lista.
- **RF-13: Flujo de Verificación Rápida (dentro del diálogo)**: La "rapidez" se logra mediante un diseño inteligente del diálogo:
    - Al abrirse, el campo "Cantidad Recibida" se **autocompleta** con la cantidad total esperada.
    - Si la cantidad es correcta y el producto no requiere información adicional (como fecha de vencimiento), el usuario solo necesita presionar **"Confirmar"** para completar la verificación (flujo de 1-click).
    - Si la cantidad es incorrecta o se necesita agregar un vencimiento, el usuario simplemente edita los campos necesarios antes de confirmar. Esto mantiene un flujo único, consistente y seguro.

### **3.4. Diálogo de Verificación Detallada**
- **RF-14**: El diálogo debe mostrar claramente el producto y la cantidad total esperada, calculada en base a la presentación de la nota.
- **RF-15**: Contendrá un campo numérico para que el usuario ingrese la `cantidadRecibida`.
- **RF-16: Gestión de Presentaciones**:
    - Se incluirá un **selector (dropdown)** para que el usuario elija la `presentacion` en la que está recibiendo el producto.
    - Por defecto, este selector mostrará la `presentacionEnNota`. Sin embargo, el usuario podrá cambiarla si, por ejemplo, el proveedor entregó el producto en un formato de empaque diferente.
    - **Toda la lógica del diálogo (cantidades esperadas, recibidas, validaciones) deberá recalcularse dinámicamente si el usuario cambia la presentación seleccionada.**
- **RF-17: Manejo de Vencimientos**:
    - Si `producto.posee_vencimiento` es `true`, se mostrará un campo para ingresar la `fechaVencimiento`.
    - **RF-18: Múltiples Vencimientos**: Debe existir un botón **"Agregar Vencimiento"**. Al presionarlo, se habilitará un nuevo par de campos (cantidad, fecha de vencimiento), permitiendo al usuario distribuir la cantidad total recibida en diferentes lotes.
    - **R-04 (Regla de Consistencia)**: La suma de las cantidades distribuidas por vencimiento debe ser igual a la `cantidadRecibida` total.
- **RF-19**: Debe incluir la misma funcionalidad de **rechazo** que la versión de escritorio.
- **RF-20**: Al guardar, el sistema creará uno o más `RecepcionMercaderiaItem`, guardando explícitamente la `presentacionRecibidaId` seleccionada por el usuario.
- **RF-21**: Por cada lote con fecha de vencimiento guardado, se debe crear un registro en la nueva tabla `ProductoVencimiento`.

### **3.5. Finalización de la Recepción y Procesos de Backend**
- **RF-22**: Cuando todos los ítems de la sesión de recepción hayan sido procesados (verificados o rechazados), el usuario debe poder presionar el botón "Finalizar Recepción".
- **RF-23**: Al finalizar, el sistema ejecutará una serie de procesos de backend de forma transaccional para consolidar la operación:

#### **3.5.1. Acciones de Backend Post-Finalización**
- **RF-24 (Actualización de Estado):** El estado de la `RecepcionMercaderia` se actualiza a `FINALIZADO`.
- **RF-25 (Generación de Constancia):** Se genera el documento `ConstanciaDeRecepcion` con sus ítems, sirviendo como el registro inmutable de la operación para el proveedor.
    - Se debe generar un documento en formato PDF con un diseño formal y un `codigo_verificacion` único.
    - La aplicación móvil debe permitir al usuario previsualizar, imprimir o compartir digitalmente la constancia.
- **RF-26 (Movimiento de Stock):** Para cada `RecepcionMercaderiaItem` con `cantidadRecibida > 0`, el sistema debe generar un `MovimientoStock` de tipo `ENTRADA_POR_COMPRA`. Esto incrementará el inventario del `producto` en la `sucursalEntrega` correspondiente.
- **RF-27 (Cálculo de Costos):** El sistema debe invocar al servicio de costos (`CostoService`) para calcular y registrar el nuevo `CostoProducto` de los ítems recibidos. El costo se basará en el `precioUnitarioEnNota` del documento original.
- **RF-28 (Actualización de Documentos Origen):** Se debe actualizar el estado de las `NotaRecepcionItem` y `NotaRecepcion` originales para reflejar que ya han sido procesadas, evitando que puedan ser recepcionadas nuevamente en la misma sucursal.

---

## 🏗️ **4. REQUERIMIENTOS DE BACKEND (API GRAPHQL)**

La implementación del backend se beneficiará enormemente de la lógica ya existente y funcional en el flujo de recepción de escritorio. La estrategia será reutilizar al máximo los servicios y mutaciones a nivel de ítem y crear nuevos endpoints solo para los flujos que son específicos del móvil (inicio y finalización de sesión basada en notas).

### **4.1. API para la Selección de Notas (Nuevos Endpoints)**
- **Query `notasPendientes(sucursalId: ID!, proveedorId: ID): [NotaRecepcion]`**
  - **Propósito:** Reemplaza a `onGetNotaRecepcionPorPedidoId`. Es el punto de entrada para el flujo móvil.
  - **Lógica:** Devuelve todas las `NotaRecepcion` que están pendientes de recepción para una sucursal y, opcionalmente, filtradas por un proveedor.

- **Query `productosAgrupadosPorNotas(notaRecepcionIds: [ID!]): [ProductoAgrupadoDTO]`**
  - **Propósito:** Obtener la lista consolidada de productos a verificar. Este es uno de los endpoints más críticos, ya que debe entregar al frontend toda la información necesaria para mostrar los ítems agrupados y, posteriormente, poder verificarlos individualmente con la trazabilidad correcta.
  - **Lógica:** Recibe una lista de IDs de `NotaRecepcion`. El backend debe buscar todos los `NotaRecepcionItem` y sus correspondientes `NotaRecepcionItemDistribucion` asociados a las notas y sucursales seleccionadas. Luego, agrupará todas estas distribuciones por `producto`.
  - **DTO de Respuesta `ProductoAgrupadoDTO`:**
    - `Producto producto`: La información del producto consolidado (nombre, imagen, etc.).
    - `Double cantidadTotalEsperada`: La suma total de las cantidades de todas las distribuciones para ese producto.
    - `Presentacion presentacionConsolidada`: La presentación principal para mostrar en la UI (el backend puede decidir la más común o relevante).
    - `List<NotaRecepcionItemDistribucion> distribuciones`: **La clave de la trazabilidad.** Una lista completa de todas las distribuciones que componen el total. Esto permite al frontend saber exactamente qué `id` de distribución verificar y de qué nota original proviene.

### **4.2. API para la Sesión de Recepción (Nuevos Endpoints)**
- **Mutation `iniciarRecepcion(input: IniciarRecepcionInput!): RecepcionMercaderia`**
  - **Propósito:** Crea la `RecepcionMercaderia` que servirá como la sesión de trabajo.
  - **Input:** `{ sucursalId: ID!, notaRecepcionIds: [ID!]! }`
  - **Lógica:** Crea la `RecepcionMercaderia` y sus asociaciones en `RecepcionMercaderiaNota`. Devuelve la sesión creada.

### **4.3. API para Verificación de Ítems (Reutilización de Lógica Existente)**
La lógica de verificación, rechazo y cancelación de ítems ya está madura en el backend. Se reutilizarán los siguientes servicios existentes (invocados a través de `pedido.service.ts` en la versión de escritorio):

- **Mutation `saveRecepcionMercaderiaItem(input: RecepcionMercaderiaItemInput!): RecepcionMercaderiaItem` (Reutilización Directa)**
  - **Propósito:** Es la mutación **central** para registrar un ítem verificado.
  - **Lógica Existente:** Ya maneja la creación automática de `RecepcionMercaderia` si no existe, y la vinculación inteligente de `NotaRecepcionItemDistribucion`. El front-end móvil deberá construir el `input` con los datos del diálogo (incluyendo `metodoVerificacion`, `motivoVerificacionManual`, y `presentacionRecibidaId`).

- **Mutation `cancelarVerificacion(notaRecepcionItemId: ID!, sucursalId: ID!): Boolean` (Reutilización Directa)**
- **Mutation `cancelarRechazo(notaRecepcionItemId: ID!, sucursalId: ID!): Boolean` (Reutilización Directa)**

### **4.4. API para la Finalización (Nuevo Endpoint)**
- **Mutation `finalizarRecepcion(recepcionMercaderiaId: ID!): ConstanciaDeRecepcion`**
  - **Propósito:** Reemplaza a `onFinalizarRecepcionFisicaPorPedido`. Inicia la cascada de procesos de finalización.
  - **Lógica:** Este resolver debe orquestar las acciones de backend descritas en la sección `3.5.1` (Generar Constancia, Movimiento de Stock, Cálculo de Costos, etc.), utilizando el `recepcionMercaderiaId` como punto de partida.

---

## 📝 **5. CONSIDERACIONES ADICIONALES**

- **UI/UX**: La interfaz debe ser extremadamente clara, usando íconos y colores para indicar estados (pendiente, verificado, discrepancia, rechazado). Las acciones más comunes deben ser accesibles con un mínimo de taps.
- **Performance**: Las consultas al backend deben estar optimizadas. La carga de productos y notas debe ser rápida para no entorpecer el trabajo del operario.
- **Manejo de Errores**: Se debe proveer feedback claro al usuario en caso de errores de red, de validación o del servidor.
- **Offline-First (Futuro)**: Para una versión futura, se debe analizar la viabilidad de un modo offline que permita continuar la recepción sin conexión a internet y sincronizar los datos posteriormente.
- **Auditoría**: Todas las mutaciones de GraphQL que modifiquen datos deben registrar quién (`usuario_id`) y cuándo (`timestamp`) realizó la operación.
