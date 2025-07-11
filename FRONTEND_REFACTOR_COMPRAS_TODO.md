# Lista de Tareas para la Refactorización del Módulo de Compras (Frontend)

Este documento detalla las acciones necesarias para adaptar la interfaz de usuario (Angular/TypeScript) a la nueva arquitectura del backend para el módulo de compras. El objetivo es sincronizar modelos, servicios y componentes con el esquema de GraphQL refactorizado.

---

### Fase 1: Actualización de Modelos, Interfaces y Enums - ✔️ COMPLETADO

-   [x] **1.1. Refactorizar Interfaces Existentes:**
    -   [ ] `pedido.ts`: Simplificar la interfaz. Eliminar todos los campos de seguimiento de etapas (e.g., `usuarioCreacion`, `fechaInicioCreacion`, `progresoRecepcionNota`, etc.). El seguimiento ahora es manejado por `ProcesoEtapa`.
    -   [ ] `pedido-item.ts`: Simplificar la interfaz. Eliminar todos los campos de etapas posteriores (e.g., `notaRecepcion`, `precioUnitarioRecepcionNota`, `cantidadRecepcionProducto`, etc.). Añadir `vencimientoEsperado` y `observacion`.
    -   [ ] `nota-recepcion.ts`: Eliminar la referencia a `notaRecepcionAgrupada`. Añadir `moneda` y `cotizacion`.
    -   [ ] `solicitud-pago.ts`: Eliminar `tipo` y `referenciaId`. Preparar la interfaz para manejar una lista de `RecepcionMercaderia`.

-   [x] **1.2. Crear Nuevas Interfaces:**
    -   [ ] `proceso-etapa.ts`: Crear la interfaz para `ProcesoEtapa` con sus campos (`pedido`, `tipoEtapa`, `estadoEtapa`, fechas, usuarios).
    -   [ ] `pedido-item-distribucion.ts`: Crear la interfaz para `PedidoItemDistribucion`.
    -   [ ] `nota-recepcion-item.ts`: Crear o asegurar que la interfaz `NotaRecepcionItem` refleje el nuevo modelo (`pedidoItem` (nullable), `esBonificacion`, `vencimientoEnNota`).
    -   [ ] `recepcion-mercaderia.ts`: Crear la interfaz principal para el evento de recepción.
    -   [ ] `recepcion-mercaderia-item.ts`: Crear la interfaz para el ítem físico recibido.
    -   [ ] `recepcion-mercaderia-nota.ts`: Crear la interfaz para la tabla de unión.
    -   [ ] `recepcion-costo-adicional.ts`: Crear la interfaz para los costos asociados a una recepción.
    -   [ ] `devolucion.ts`: Crear la interfaz para la cabecera de la devolución.
    -   [ ] `devolucion-item.ts`: Crear la interfaz para el ítem de la devolución.
    -   [ ] `solicitud-pago-recepcion.ts`: Crear la interfaz para la tabla de unión.

-   [x] **1.3. Crear/Actualizar Enums:**
    -   [ ] Crear `ProcesoEtapaTipo.enum.ts`.
    -   [ ] Crear `ProcesoEtapaEstado.enum.ts`.
    -   [ ] Actualizar `NotaRecepcionEstado.enum.ts`.
    -   [ ] Crear `RecepcionMercaderiaEstado.enum.ts`.
    -   [ ] Crear `DevolucionEstado.enum.ts`.

---

### Fase 2: Refactorización de la Capa de Datos (GraphQL y Servicios) - ✔️ COMPLETADO

Adaptar los servicios de Apollo y los archivos de queries para que se comuniquen correctamente con el nuevo esquema del backend.

-   [x] **2.1. Actualizar Archivos `.graphql`:**
    -   [ ] Revisar y modificar los *fragments* y *queries/mutations* en `pedido.graphql.ts` para que coincidan con los nuevos tipos `Pedido` y `PedidoItem`.
    -   [ ] Añadir `procesoEtapa` a las queries de `Pedido` para poder mostrar el estado de las etapas.
    -   [ ] Crear nuevos archivos `.graphql` o actualizar los existentes para las nuevas entidades: `RecepcionMercaderia`, `Devolucion`, etc.
    -   [ ] Crear/Modificar las *mutations* para los nuevos flujos (`finalizarCreacionPedido`, `finalizarRecepcion`, `crearDevolucion`, `crearSolicitudPagoConsolidada`).

-   [x] **2.2. Refactorizar Servicios de Apollo (`.service.ts`):**
    -   [ ] Modificar `PedidoService` para que utilice las nuevas queries y devuelva los modelos actualizados.
    -   [ ] Crear `RecepcionMercaderiaService` para manejar la lógica de la nueva pantalla de recepción.
    -   [ ] Crear `DevolucionService` para el nuevo flujo de devoluciones.
    -   [ ] Modificar `SolicitudPagoService` para que se adapte al nuevo modelo de creación de solicitudes de pago (basado en recepciones).
    -   [ ] Asegurarse de que todos los servicios sigan utilizando `generic-crud.service.ts` para las operaciones CRUD.

---

### Fase 3: Refactorización de Componentes (UI y Lógica de Negocio) - ✔️ COMPLETADO (Estructuralmente)

Los componentes principales han sido refactorizados o vaciados para alinearse con la nueva arquitectura. La implementación de la nueva UI y lógica de negocio se realizará en fases posteriores.

-   [x] **3.1. Componente `edit-pedido-2`:** Estructura base actualizada para usar `ProcesoEtapa`.
-   [x] **3.2. Componente `recepcion-nota`:** Lógica obsoleta eliminada.
-   [x] **3.3. Componente `recepcion-mercaderia`:** Vaciado y preparado para la nueva implementación.
-   [x] **3.4. Componente `solicitud-pago`:** Servicio actualizado.
-   [x] **3.5. Nuevos Componentes para Devoluciones:** Modelos y servicios creados.

---

### Fase 4: Limpieza de Código Obsoleto - ✔️ COMPLETADO

-   [x] **4.1. Eliminar Archivos Obsoletos:** `pedido-item-sucursal` eliminado.
-   [x] **4.2. Eliminar GraphQL Queries Obsoletas:** Queries de `pedido` limpiadas.

---

### **NUEVA** Fase 5: Sincronización Final de Modelos y Servicios

Después de una revisión cruzada con los esquemas del backend, se han identificado las siguientes tareas para asegurar una sincronización perfecta.

-   [ ] **5.1. Sincronizar `nota-recepcion.model.ts`:**
    -   [ ] Simplificar el modelo para que coincida exactamente con el `type NotaRecepcion` del backend. Eliminar cualquier propiedad heredada de la lógica de `NotaRecepcionAgrupada`.

-   [ ] **5.2. Sincronizar `recepcion-mercaderia.enum.ts`:**
    -   [ ] Añadir el estado `PENDIENTE` al enum `RecepcionMercaderiaEstado` para que coincida con el backend.

-   [ ] **5.3. Sincronizar `solicitud-pago.model.ts` y `solicitud-pago.service.ts`:**
    -   [ ] Crear una nueva clase `SolicitudPagoMultipleRecepcionesInput` en el archivo de modelo.
    -   [ ] En `SolicitudPagoService`, crear un nuevo método `onCrearSolicitudPagoMultipleRecepciones` que utilice la *mutation* `crearSolicitudPagoMultipleRecepciones` y el nuevo `Input`.
    -   [ ] Marcar el método `onSaveSolicitudPago` como obsoleto o para uso manual si corresponde.

-   [ ] **5.4. Revisión General de `Input` DTOs:**
    -   [ ] Revisar todas las clases `Input` de los modelos refactorizados (`PedidoInput`, `NotaRecepcionInput`, `RecepcionMercaderiaInput`, `DevolucionInput`) y asegurarse de que los tipos de datos de sus campos coincidan con los del backend (e.g., `Date` vs `String`, `number` vs `Int` vs `Float`). Prestar especial atención a los campos de fecha, que deben ser `string` en los `Input`. 