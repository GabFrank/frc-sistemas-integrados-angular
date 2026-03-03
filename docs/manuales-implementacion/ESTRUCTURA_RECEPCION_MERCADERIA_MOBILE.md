# Estructura de Implementación Frontend: Recepción de Mercadería Móvil

## 1. Introducción

Este documento especifica la estructura técnica detallada para la implementación del flujo de **Recepción de Mercadería Móvil** en el frontend (Angular/Ionic). Define los modelos de datos (interfaces TypeScript), el esquema de comunicación con el backend (GraphQL) y la capa de servicios necesaria.

El propósito es servir como una guía técnica campo por campo y función por función para el desarrollador, basada en los requerimientos del `MANUAL_IMPLEMENTACION_RECEPCION_MERCADERIA_MOBILE.md` y asumiendo un proyecto frontend nuevo sin estas entidades preexistentes.

---

## 2. Modelos de Datos (Interfaces TypeScript)

A continuación se definen las interfaces TypeScript que modelan las entidades del dominio. Estas interfaces deben ser un reflejo completo de las entidades del backend para garantizar la consistencia.

### 2.1. Interfaces de Entidades de Soporte

Estas son las entidades base que son referenciadas por las entidades principales del flujo de recepción.

```typescript
// ARCHIVO: src/app/models/personas/persona.model.ts
export class Persona {
    id: number;
    nombre: string;
    // ... otros campos de persona si son necesarios
}

// ARCHIVO: src/app/models/personas/usuario.model.ts
export class Usuario {
    id: number;
    password?: string;
    nickname: string;
    email?: string;
    activo: boolean;
    persona: Persona;
    usuario?: Usuario; // Usuario que creó a este usuario
    creadoEn: string; // Formato ISO
}

// ARCHIVO: src/app/models/empresarial/sucursal.model.ts
export class Sucursal {
    id: number;
    nombre: string;
    localizacion?: string;
    deposito: boolean;
    isConfigured?: boolean;
    depositoPredeterminado?: boolean;
    creadoEn: string; // Formato ISO
    usuario: Usuario;
    direccion?: string;
    nroDelivery?: string;
    codigoEstablecimientoFactura?: string;
    ip?: string;
    puerto?: number;
    // ciudad: Ciudad; // Descomentar si la entidad Ciudad es necesaria
}

// ARCHIVO: src/app/models/personas/proveedor.model.ts
export class Proveedor {
    id: number;
    credito: boolean;
    tipoCredito?: string;
    chequeDias?: number;
    datosBancarios?: number;
    persona: Persona;
    funcionarioEncargado?: any; // Reemplazar 'any' con la interfaz Funcionario si existe
    usuario: Usuario;
    creadoEn: string; // Formato ISO
}

// ARCHIVO: src/app/models/financiero/moneda.model.ts
export class Moneda {
    id: number;
    denominacion: string;
    // ... otros campos de moneda
}

// ARCHIVO: src/app/models/productos/producto.model.ts
export class Producto {
    id: number;
    propagado?: boolean;
    descripcion: string;
    descripcionFactura?: string;
    iva?: number;
    unidadPorCaja?: number;
    unidadPorCajaSecundaria?: number;
    balanza?: boolean;
    garantia?: boolean;
    tiempoGarantia?: number;
    ingrediente?: boolean;
    combo?: boolean;
    stock?: boolean;
    cambiable?: boolean;
    promocion?: boolean;
    vencimiento?: boolean; // 'posee_vencimiento' en el manual
    diasVencimiento?: number;
    observacion?: string;
    imagenes?: string;
    isEnvase?: boolean;
    activo?: boolean;
    tipoConservacion?: 'SECO' | 'REFRIGERADO' | 'CONGELADO';
    subfamilia?: any; // Reemplazar por interfaz Subfamilia
    envase?: Producto;
    creadoEn?: string; // Formato ISO
    usuario?: Usuario;
    imagenPrincipal?: string; // Campo adicional para la UI
}

// ARCHIVO: src/app/models/productos/presentacion.model.ts
export class Presentacion {
    id: number;
    descripcion: string;
    cantidad: number;
    activo: boolean;
    principal: boolean;
    creadoEn: string; // Formato ISO
    producto: Producto;
    tipoPresentacion?: any; // Reemplazar por interfaz TipoPresentacion
    usuario: Usuario;
}
```

### 2.2. Interfaces del Flujo de Compras y Pedidos

Entidades que forman parte del proceso de compra que precede a la recepción.

```typescript
// ARCHIVO: src/app/models/operaciones/pedido.model.ts
export class Pedido {
    id: number;
    // ... Definir campos de la entidad Pedido si es necesario
}

// ARCHIVO: src/app/models/operaciones/pedido-item.model.ts
export class PedidoItem {
    id: number;
    // ... Definir campos de la entidad PedidoItem si es necesario
}

// ARCHIVO: src/app/models/operaciones/compra.model.ts
export class Compra {
    id: number;
    // ... Definir campos de la entidad Compra si es necesario
}

// ARCHIVO: src/app/models/operaciones/nota-recepcion.model.ts
export type NotaRecepcionEstado = 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADO' | 'CANCELADO';

export class NotaRecepcion {
    id: number;
    pedido?: Pedido;
    compra?: Compra;
    documento?: any; // Reemplazar por interfaz Documento
    numero?: number;
    tipoBoleta?: string;
    timbrado?: number;
    fecha?: string; // Formato ISO
    moneda: Moneda;
    cotizacion?: number;
    estado: NotaRecepcionEstado;
    pagado?: boolean;
    esNotaRechazo: boolean;
    creadoEn?: string; // Formato ISO
    usuario?: Usuario;
}

// ARCHIVO: src/app/models/operaciones/nota-recepcion-item.model.ts
export type NotaRecepcionItemEstado = 'PENDIENTE' | 'VERIFICADO_PARCIAL' | 'VERIFICADO_TOTAL' | 'RECHAZADO' | 'CANCELADO';

export class NotaRecepcionItem {
    id: number;
    notaRecepcion: NotaRecepcion;
    pedidoItem?: PedidoItem;
    producto: Producto;
    presentacionEnNota?: Presentacion;
    cantidadEnNota: number;
    precioUnitarioEnNota: number;
    esBonificacion: boolean;
    vencimientoEnNota?: string; // Formato YYYY-MM-DD
    observacion?: string;
    estado?: NotaRecepcionItemEstado;
    motivoRechazo?: string;
    creadoEn?: string; // Formato ISO
    usuario?: Usuario;
}

// ARCHIVO: src/app/models/operaciones/nota-recepcion-item-distribucion.model.ts
export class NotaRecepcionItemDistribucion {
    id: number;
    notaRecepcionItem: NotaRecepcionItem;
    sucursalInfluencia?: Sucursal;
    sucursalEntrega: Sucursal;
    cantidad: number;
    creadoEn?: string; // Formato ISO
    usuario?: Usuario;
}
```

### 2.3. Interfaces del Flujo de Recepción de Mercadería (Móvil)

Estas son las entidades nuevas y modificadas, cruciales para el nuevo flujo móvil.

```typescript
// ARCHIVO: src/app/modules/operaciones/recepcion-mercaderia-mobile/models/recepcion-mobile.model.ts

export type RecepcionMercaderiaEstado = 'EN_PROCESO' | 'FINALIZADO' | 'CANCELADO';
export type MetodoVerificacion = 'ESCANER' | 'MANUAL';
export type MotivoVerificacionManual = 'CODIGO_ILEGIBLE' | 'PRODUCTO_SIN_CODIGO';
export type MotivoRechazoFisico = 'VENCIDO' | 'MAL_ESTADO' | 'NO_PEDIDO';
export type EstadoConstancia = 'EMITIDA' | 'ANULADA';

/**
 * Entidad principal que agrupa una sesión de recepción de mercadería.
 */
export class RecepcionMercaderia {
    id: number;
    proveedor: Proveedor;
    sucursalRecepcion: Sucursal;
    fecha: string; // Formato ISO
    moneda: Moneda;
    cotizacion?: number;
    estado: RecepcionMercaderiaEstado;
    usuario: Usuario;
}

/**
 * Representa un ítem verificado dentro de una sesión de recepción.
 * Incluye campos clave para la auditoría.
 */
export class RecepcionMercaderiaItem {
    id: number;
    recepcionMercaderia: RecepcionMercaderia;
    notaRecepcionItem: NotaRecepcionItem;
    notaRecepcionItemDistribucion?: NotaRecepcionItemDistribucion;
    producto: Producto;
    presentacionRecibida?: Presentacion;
    sucursalEntrega: Sucursal;
    usuario: Usuario;
    cantidadRecibida: number;
    cantidadRechazada?: number;
    esBonificacion: boolean;
    vencimientoRecibido?: string; // Formato YYYY-MM-DD
    lote?: string;
    motivoRechazo?: MotivoRechazoFisico;
    observaciones?: string;
    metodoVerificacion?: MetodoVerificacion;
    motivoVerificacionManual?: MotivoVerificacionManual;
}

/**
 * Entidad para auditar el ingreso de productos con fecha de vencimiento.
 */
export class ProductoVencimiento {
    id: number;
    producto: Producto;
    presentacion: Presentacion;
    sucursal: Sucursal;
    fechaVencimiento: string; // Formato YYYY-MM-DD
    cantidad: number;
    tipoOrigen: 'RECEPCION_MERCADERIA' | 'AJUSTE_STOCK' | 'VENTA' | 'TRANSFERENCIA';
    origenId: number; // ID de la entidad de origen (ej: recepcion_mercaderia_item.id)
    usuario: Usuario;
    fechaCreacion: string; // Formato ISO
}

/**
 * Documento final que se genera al concluir una recepción.
 */
export class ConstanciaDeRecepcion {
    id: number;
    recepcionMercaderia: RecepcionMercaderia;
    proveedor: Proveedor;
    sucursal: Sucursal;
    fechaEmision: string; // Formato ISO
    usuario: Usuario;
    codigoVerificacion: string;
    estado: EstadoConstancia;
    items?: ConstanciaDeRecepcionItem[]; // Detalle
}

/**
 * Detalle de los productos de una Constancia de Recepción.
 */
export class ConstanciaDeRecepcionItem {
    id: number;
    constanciaDeRecepcion: ConstanciaDeRecepcion;
    producto: Producto;
    presentacion?: Presentacion;
    cantidadRecibida?: number;
    cantidadRechazadaFisico?: number;
}
```

### 2.4. DTOs y Inputs para GraphQL

```typescript
// ARCHIVO: src/app/modules/operaciones/recepcion-mercaderia-mobile/models/recepcion-mobile-dto.model.ts

/**
 * DTO que agrupa un producto a través de múltiples notas.
 */
export class ProductoAgrupadoDTO {
  producto: Producto;
  cantidadTotalEsperada: number;
  presentacionConsolidada: Presentacion;
  distribuciones: NotaRecepcionItemDistribucion[];
}

/**
 * Input para la mutación que inicia la sesión de recepción.
 */
export class IniciarRecepcionInput {
  sucursalId: number;
  notaRecepcionIds: number[];
}

/**
 * Input para la mutación que guarda un ítem verificado.
 */
export class RecepcionMercaderiaItemInput {
  id?: number;
  recepcionMercaderiaId: number;
  notaRecepcionItemDistribucionId: number;
  cantidadRecibida: number;
  presentacionRecibidaId: number;
  metodoVerificacion: MetodoVerificacion;
  motivoVerificacionManual?: MotivoVerificacionManual;
  vencimientos?: ProductoVencimientoInput[];
  // ...otros campos necesarios pueden ser añadidos aquí

  // Ejemplo de método para convertir a un input plano si es necesario
  // toGraphQLInput(): any {
  //   return {
  //     ...this,
  //     vencimientos: this.vencimientos?.map(v => ({...v}))
  //   }
  // }
}

/**
 * Input para registrar un lote de vencimiento.
 */
export class ProductoVencimientoInput {
    fechaVencimiento: string; // Formato YYYY-MM-DD
    cantidad: number;
}
```

---

## 3. Esquema GraphQL (Frontend)

(Sin cambios respecto a la versión anterior. Las definiciones de queries y mutaciones permanecen igual)

---

## 4. Servicios (Angular)

(Sin cambios respecto a la versión anterior. La estructura del servicio permanece igual, pero ahora operará con las interfaces completas y detalladas definidas anteriormente)