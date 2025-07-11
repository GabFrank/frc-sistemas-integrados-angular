# Análisis de Entidades y Relaciones del Módulo de Compras (Post-Refactor)

Este documento detalla la estructura conceptual de las entidades del módulo de compras después de la refactorización propuesta. Sirve como guía para entender el propósito de cada entidad y sus interconexiones, facilitando el desarrollo y la creación de diagramas de arquitectura.

---

## Diagrama Conceptual de Relaciones

```mermaid
graph TD
    subgraph "1. Planificación de Pedido"
        P(Pedido) -->|1..*| PI(PedidoItem)
        PI -->|1..*| PID(PedidoItemDistribucion)
    end

    subgraph "2. Documentación del Proveedor"
        NR(NotaRecepcion) -->|1..*| NRI(NotaRecepcionItem)
        PI -.->|1..1 (concilia)| NRI
    end

    subgraph "3. Recepción Física de Mercadería"
        RM("Recepción Mercadería") -->|1..*| RMN(RecepcionMercaderiaNota)
        RMN -->|1..1| NR
        RM -->|1..*| RMI("RecepcionMercaderiaItem")
        RM -->|0..*| RCA(RecepcionCostoAdicional)
        
        NRI -->|1..1 (justifica)| RMI
        PID -.->|0..1 (planifica)| RMI
    end

    subgraph "4. Proceso de Pago"
        SP(SolicitudPago) -->|1..*| SPR(SolicitudPagoRecepcion)
        SPR -->|1..1| RM
    end
    
    subgraph "5. Devoluciones"
        DEV(Devolucion) -->|1..*| DI(DevolucionItem)
        DI -->|1..1| RMI
    end

    subgraph "Auditoría Transversal"
        PE(ProcesoEtapa) -->|1..1| P
    end

    %% Styling
    classDef entity fill:#2E4053,stroke:#85929E,stroke-width:2px,color:#fff;
    class P,PI,PID,NR,NRI,RM,RMN,RMI,RCA,SP,SPR,PE,DEV,DI entity
```

---

## Descripción Detallada de Entidades y Relaciones

### 1. Entidades de Planificación

#### `Pedido`
- **Propósito:** Representa la cabecera de una orden de compra. Es el documento inicial que formaliza una solicitud a un proveedor.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `proveedor`: `Proveedor` - El proveedor al que se realiza el pedido.
    - `vendedor`: `Vendedor` - El vendedor asociado al pedido.
    - `formaPago`: `FormaPago` - La forma de pago acordada.
    - `tipoBoleta`: `String` - El tipo de boleta o factura (ej: "FACTURA A", "TICKET").
    - `moneda`: `Moneda` - La moneda en la que se realiza la transacción.
    - `plazoCredito`: `Integer` - Días de plazo para el crédito, si aplica.
    - `estado`: `PedidoEstado` (Enum) - El estado actual del pedido.
    - `creadoEn`: `LocalDateTime` - Fecha y hora de creación del registro.
    - `usuario`: `Usuario` - El usuario que creó o gestiona el pedido.
- **Relaciones:**
    - **`Proveedor` (N-1):** Un pedido pertenece a un único proveedor.
    - **`Vendedor` (N-1):** Asociado a un vendedor específico.
    - **`FormaPago` (N-1):** Define cómo se pagará el pedido.
    - **`Moneda` (N-1):** El pedido se emite en una moneda específica.
    - **`PedidoItem` (1-N):** Un pedido contiene uno o más ítems que se desean comprar.
    - **`ProcesoEtapa` (1-N):** El ciclo de vida completo del pedido es auditado a través de múltiples etapas.
    - **`Usuario` (N-1):** El usuario responsable del pedido.

#### `PedidoItem`
- **Propósito:** Define un producto específico solicitado dentro de un `Pedido`. Se considera **inmutable** tras la creación del pedido para preservar el registro original de la solicitud.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `pedido`: `Pedido` - El pedido al que pertenece el ítem.
    - `producto`: `Producto` - El producto solicitado.
    - `presentacionCreacion`: `Presentacion` - La presentación del producto al momento de crearlo.
    - `cantidadSolicitada`: `Double` - La cantidad del producto que se pidió.
    - `precioUnitarioSolicitado`: `Double` - El precio acordado al momento de la solicitud.
    - `vencimientoEsperado`: `LocalDateTime` - La fecha y hora de vencimiento esperada para el producto.
    - `observacion`: `String` - Notas adicionales sobre el ítem del pedido.
    - `estado`: `PedidoItemEstado` (Enum) - El estado específico del ítem.
    - `creadoEn`: `LocalDateTime` - Fecha y hora de creación del registro del ítem.
    - `usuarioCreacion`: `Usuario` - El usuario que añadió el ítem al pedido.
- **Relaciones:**
    - **`Pedido` (N-1):** Cada ítem pertenece a un único `Pedido`.
    - **`Producto` (N-1):** Especifica el producto del catálogo que se está solicitando.
    - **`Presentacion` (N-1):** La presentación en la que se pidió el producto.
    - **`PedidoItemDistribucion` (1-N):** Detalla cómo la cantidad de este ítem debe ser distribuida entre diferentes sucursales.
    - **`Usuario` (N-1):** El usuario que creó el ítem.

#### `PedidoItemDistribucion`
- **Propósito:** Planifica la entrega de una cantidad de un `PedidoItem` a una sucursal específica.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `pedidoItem`: `PedidoItem` - El ítem de pedido que se está distribuyendo.
    - `sucursalEntrega`: `Sucursal` - La sucursal donde se espera la entrega.
    - `cantidadAsignada`: `Double` - La cantidad de producto destinada a esa sucursal.
- **Relaciones:**
    - **`PedidoItem` (N-1):** Es parte de la distribución de un ítem de pedido.
    - **`Sucursal` (N-1):** Indica la sucursal de destino para esta porción del ítem.

#### `PedidoSucursalEntrega`
- **Propósito:** Asocia un pedido completo a una sucursal de entrega específica.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `pedido`: `Pedido` - El pedido que se entregará.
    - `sucursal`: `Sucursal` - La sucursal de destino para la entrega.
    - `usuario`: `Usuario` - El usuario que registró la asociación.
    - `creadoEn`: `LocalDateTime` - Fecha y hora de creación del registro.
- **Relaciones:**
    - **`Pedido` (N-1):** El pedido asociado.
    - **`Sucursal` (N-1):** La sucursal de destino.
    - **`Usuario` (N-1):** El usuario responsable.

---

### 2. Entidad de Auditoría

#### `ProcesoEtapa`
- **Propósito:** Audita el avance de un `Pedido` a través de su ciclo de vida (Ej: Creación, Recepción de Nota, Pago). Registra estados, fechas y usuarios responsables de cada fase.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `pedido`: `Pedido` - El pedido asociado a esta etapa.
    - `tipoEtapa`: `ProcesoEtapaTipo` (Enum) - Ej: `CREACION`, `RECEPCION_NOTA`.
    - `estadoEtapa`: `ProcesoEtapaEstado` (Enum) - Ej: `PENDIENTE`, `EN_PROCESO`.
    - `fechaInicio`: `LocalDateTime` - Cuándo se inició la etapa.
    - `fechaFin`: `LocalDateTime` - Cuándo se finalizó la etapa.
    - `usuarioInicio`: `Usuario` - Usuario que gestionó la etapa.
    - `creadoEn`: `LocalDateTime` - Timestamp de creación del registro.
- **Relaciones:**
    - **`Pedido` (N-1):** Cada registro de etapa está vinculado a un `Pedido`.
    - **`Usuario` (N-1):** Identifica al usuario que inició o gestionó la etapa.

---

### 3. Entidades de Documentación del Proveedor

#### `NotaRecepcion`
- **Propósito:** Modela un documento emitido por el proveedor, como una factura o un remito.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `pedido`: `Pedido` - El pedido de compra asociado (opcional).
    - `compra`: `Compra` - La compra asociada (opcional).
    - `documento`: `Documento` - El tipo de documento (ej: Factura, Remito).
    - `numero`: `Integer` - Número del documento.
    - `tipoBoleta`: `String` - Tipo de boleta o comprobante.
    - `timbrado`: `Integer` - Timbrado de la factura.
    - `fecha`: `LocalDateTime` - Fecha de emisión del documento.
    - `moneda`: `Moneda` - Moneda del documento.
    - `cotizacion`: `Double` - Tasa de cambio utilizada.
    - `estado`: `NotaRecepcionEstado` (Enum) - El estado actual de la nota.
    - `pagado`: `Boolean` - Indica si la nota ha sido pagada.
    - `creadoEn`: `LocalDateTime` - Fecha y hora de creación del registro.
    - `usuario`: `Usuario` - El usuario que registró la nota.
- **Relaciones:**
    - **`Proveedor` (N-1, Indirecta):** La nota se vincula a un proveedor a través de su `Pedido` o `Compra` asociada.
    - **`Pedido` (N-1, Opcional):** Puede estar asociada a un `Pedido` de compra previo.
    - **`Compra` (N-1, Opcional):** Puede estar asociada a una `Compra` directa.
    - **`Documento` (N-1):** Define el tipo de documento.
    - **`Moneda` (N-1):** La moneda del documento.
    - **`NotaRecepcionItem` (1-N):** La nota detalla uno o más productos.
    - **`RecepcionMercaderiaNota` (1-N):** Una nota puede ser procesada en un evento de recepción.
    - **`Usuario` (N-1):** El usuario que gestionó la nota.

#### `NotaRecepcionItem`
- **Propósito:** Representa una línea de producto tal como aparece en la `NotaRecepcion` del proveedor, incluyendo posibles bonificaciones o diferencias con el pedido original.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `notaRecepcion`: `NotaRecepcion` - La nota a la que pertenece el ítem.
    - `pedidoItem`: `PedidoItem` - Vínculo al ítem de pedido original (puede ser nulo).
    - `producto`: `Producto` - El producto según la nota.
    - `cantidadEnNota`: `Double` - Cantidad que figura en el documento.
    - `precioUnitarioEnNota`: `Double` - Precio que figura en el documento.
    - `esBonificacion`: `Boolean` - `true` si es un ítem sin costo.
    - `vencimientoEnNota`: `LocalDate` - Fecha de vencimiento indicada en la nota.
    - `observacion`: `String` - Notas adicionales.
    - `creadoEn`: `LocalDateTime` - Fecha y hora de creación del registro.
    - `usuario`: `Usuario` - El usuario que gestionó el ítem.
- **Relaciones:**
    - **`NotaRecepcion` (N-1):** Pertenece a una `NotaRecepcion`.
    - **`PedidoItem` (N-1, Opcional):** Se concilia con el ítem del pedido original. Es opcional para manejar productos no solicitados.
    - **`Producto` (N-1):** El producto según la factura del proveedor.
    - **`Usuario` (N-1):** El usuario que gestionó el ítem.

---

### 4. Entidades de Recepción Física

#### `RecepcionMercaderia`
- **Propósito:** Modela el evento físico de recibir productos. Agrupa una o más notas de recepción y es la entidad central para el ingreso de stock y el cálculo de costos.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `proveedor`: `Proveedor` - El proveedor que realiza la entrega.
    - `sucursalRecepcion`: `Sucursal` - La sucursal física donde se realiza la recepción.
    - `fecha`: `LocalDateTime` - Fecha y hora del evento de recepción.
    - `moneda`: `Moneda` - Moneda usada para los costos de esta recepción.
    - `cotizacion`: `Double` - Tasa de cambio del día de la recepción.
    - `estado`: `RecepcionMercaderiaEstado` (Enum) - Ej: `EN_PROCESO`, `FINALIZADA`.
    - `usuario`: `Usuario` - Usuario responsable de la recepción.
- **Relaciones:**
    - **`Proveedor` (N-1):** El proveedor que realiza la entrega.
    - **`Sucursal` (N-1):** La sucursal donde se reciben físicamente los productos.
    - **`Moneda` (N-1):** La moneda para los costos.
    - **`RecepcionMercaderiaNota` (1-N):** Vínculo a las `NotaRecepcion` que se incluyen en este evento.
    - **`RecepcionMercaderiaItem` (1-N):** Detalla todos los productos físicamente verificados.
    - **`RecepcionCostoAdicional` (0-N):** Costos extra (flete, aduanas) asociados a esta recepción.
    - **`SolicitudPagoRecepcion` (0-N):** Puede ser incluida en una o más solicitudes de pago.
    - **`Usuario` (N-1):** El usuario responsable.

#### `RecepcionMercaderiaNota`
- **Propósito:** Tabla intermedia que establece la relación N-N entre `RecepcionMercaderia` y `NotaRecepcion`.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `recepcionMercaderia`: `RecepcionMercaderia` - El evento de recepción.
    - `notaRecepcion`: `NotaRecepcion` - La nota que se está procesando.
- **Relaciones:**
    - **`RecepcionMercaderia` (N-1):** El evento de recepción.
    - **`NotaRecepcion` (N-1):** La nota de proveedor procesada.

#### `RecepcionMercaderiaItem`
- **Propósito:** Corazón de la operación. Registra la cantidad de un producto físicamente contado, aceptado o rechazado. Es la fuente de verdad para los movimientos de stock y el costo final.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `recepcionMercaderia`: `RecepcionMercaderia` - El evento de recepción al que pertenece.
    - `notaRecepcionItem`: `NotaRecepcionItem` - El ítem de la factura que se está recibiendo.
    - `pedidoItemDistribucion`: `PedidoItemDistribucion` - El plan de entrega original (puede ser nulo).
    - `producto`: `Producto` - El producto físico recibido.
    - `sucursalEntrega`: `Sucursal` - La sucursal final donde se almacenará el producto.
    - `cantidadRecibida`: `Double` - Cantidad físicamente contada y aceptada.
    - `cantidadRechazada`: `Double` - Cantidad físicamente contada y rechazada.
    - `esBonificacion`: `Boolean` - `true` si es bonificado.
    - `vencimientoRecibido`: `LocalDate` - La fecha de vencimiento real del producto.
    - `lote`: `String` - El número de lote del producto.
    - `motivoRechazo`: `String` - Justificación en caso de rechazo.
    - `observacion`: `String` - Notas adicionales sobre este ítem.
- **Relaciones:**
    - **`RecepcionMercaderia` (N-1):** Pertenece a un evento de recepción.
    - **`NotaRecepcionItem` (N-1):** Justifica la recepción del producto, vinculándolo a la factura.
    - **`PedidoItemDistribucion` (N-1, Opcional):** Traza el ítem recibido hasta el plan de entrega original.
    - **`Producto` (N-1):** El producto físico que ingresa.
    - **`Sucursal` (N-1):** La sucursal de destino final del stock.

#### `RecepcionCostoAdicional`
- **Propósito:** Registra costos adicionales (flete, impuestos) que se prorratearán entre los ítems de una `RecepcionMercaderia` para calcular el costo real de adquisición.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `recepcionMercaderia`: `RecepcionMercaderia` - La recepción a la que se aplica el costo.
    - `descripcion`: `String` - Ej: "Flete Internacional", "Gastos de Despacho".
    - `monto`: `Double` - El valor del costo adicional.
    - `moneda`: `Moneda` - La moneda en la que se pagó el costo.
- **Relaciones:**
    - **`RecepcionMercaderia` (N-1):** El costo se aplica a un evento de recepción completo.
    - **`Moneda` (N-1):** La moneda en que se pagó el costo.

---

### 5. Entidades de Devolución

#### `Devolucion`
- **Propósito:** Gestiona la devolución de mercadería a un proveedor *después* de haber sido recibida.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `proveedor`: `Proveedor` - Proveedor al que se le devuelve.
    - `sucursalOrigen`: `Sucursal` - Sucursal desde donde sale la mercadería.
    - `fecha`: `LocalDateTime` - Fecha y hora de la devolución.
    - `motivo`: `String` - Motivo general de la devolución.
    - `estado`: `DevolucionEstado` (Enum) - Ej: `EN_PROCESO`, `FINALIZADA`.
    - `usuario`: `Usuario` - Usuario que gestiona la devolución.
- **Relaciones:**
    - **`Proveedor` (N-1):** El proveedor al que se le devuelven los productos.
    - **`Sucursal` (N-1):** La sucursal desde donde se origina la devolución.
    - **`DevolucionItem` (1-N):** Detalla los productos a devolver.
    - **`Usuario` (N-1):** El usuario responsable.

#### `DevolucionItem`
- **Propósito:** Detalla un producto específico que se está devolviendo.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `devolucion`: `Devolucion` - La devolución a la que pertenece.
    - `recepcionMercaderiaItem`: `RecepcionMercaderiaItem` - Vínculo al ítem recibido originalmente para trazabilidad.
    - `producto`: `Producto` - El producto que se devuelve.
    - `cantidad`: `Double` - La cantidad que se devuelve.
    - `lote`: `String` - El lote del producto que se devuelve.
- **Relaciones:**
    - **`Devolucion` (N-1):** Pertenece a una `Devolucion`.
    - **`RecepcionMercaderiaItem` (N-1):** Proporciona trazabilidad hacia el lote y el evento de recepción original del producto.
    - **`Producto` (N-1):** El producto que se devuelve.

---

### 6. Entidades de Pago

#### `SolicitudPago`
- **Propósito:** Orquesta la solicitud formal de pago a un proveedor, pudiendo agrupar múltiples recepciones.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `proveedor`: `Proveedor` - El proveedor a quien se le pagará.
    - `montoTotal`: `Double` - El monto total de la solicitud.
    - `moneda`: `Moneda` - La moneda de pago.
    - `formaPago`: `FormaPago` - El método de pago.
    - `estado`: `SolicitudPagoEstado` (Enum) - El estado de la solicitud.
    - `creadoEn`: `LocalDateTime` - Fecha y hora de creación del registro.
    - `usuario`: `Usuario` - El usuario que creó la solicitud.
    - `pago`: `Pago` - El pago que salda esta solicitud (opcional).
- **Relaciones:**
    - **`Proveedor` (N-1):** El proveedor a quien se le va a pagar.
    - **`Moneda` (N-1):** La moneda del pago.
    - **`FormaPago` (N-1):** El método de pago.
    - **`Pago` (N-1, Opcional):** Se vincula a un pago una vez que se ha procesado.
    - **`Usuario` (N-1):** El usuario responsable.
    - **`SolicitudPagoRecepcion` (1-N):** Agrupa las recepciones de mercadería que se van a pagar.

#### `SolicitudPagoRecepcion`
- **Propósito:** Tabla intermedia que establece la relación N-N entre `SolicitudPago` y `RecepcionMercaderia`.
- **Campos:**
    - `id`: `Long` - Identificador único.
    - `solicitudPago`: `SolicitudPago` - La solicitud de pago.
    - `recepcionMercaderia`: `RecepcionMercaderia` - La recepción que se incluye en el pago.
- **Relaciones:**
    - **`SolicitudPago` (N-1):** La solicitud de pago.
    - **`RecepcionMercaderia` (N-1):** La recepción que se incluye en el pago. 