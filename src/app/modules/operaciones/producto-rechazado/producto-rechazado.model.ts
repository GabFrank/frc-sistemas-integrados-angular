export type FuenteRechazo = "TRANSFERENCIA" | "COMPRA";

/** Fila de «Productos rechazados». Viene armada del central (query productosRechazados). */
export interface ProductoRechazado {
  fuente: FuenteRechazo;
  /** PREPARACION | TRANSPORTE | RECEPCION (transferencia) o RECEPCION_FISICA | RECEPCION_DOCUMENTAL (compra). */
  etapa: string;
  /** Nro. de transferencia o de pedido de compra. */
  referenciaId: number;
  itemId: number;
  fecha: string;
  productoId: number;
  productoDescripcion: string;
  presentacion: string;
  cantidad: number;
  motivo: string;
  observacion: string;
  /** Transferencia: sucursal de origen. Compra: proveedor. */
  origen: string;
  /** Transferencia: sucursal de destino. Compra: sucursal que recibía. */
  destino: string;
  usuario: string;
}

export interface ProductoRechazadoPage {
  getContent: ProductoRechazado[];
  getTotalElements: number;
  getTotalPages: number;
  getNumberOfElements: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface ProductoRechazadoFiltros {
  fuente: FuenteRechazo | null;
  fechaInicio: string;
  fechaFin: string;
  sucursalId: number | null;
  referenciaId: number | null;
  texto: string | null;
  page: number;
  size: number;
}

export const ETAPA_RECHAZO_LABEL: Record<string, string> = {
  PREPARACION: "Preparación",
  TRANSPORTE: "Transporte",
  RECEPCION: "Recepción",
  RECEPCION_FISICA: "Recepción física",
  RECEPCION_DOCUMENTAL: "Recepción documental",
};

export const MOTIVO_RECHAZO_LABEL: Record<string, string> = {
  FALTA_PRODUCTO: "Falta producto",
  PRODUCTO_AVERIADO: "Producto averiado",
  PRODUCTO_VENCIDO: "Producto vencido",
  PRODUCTO_EQUIVOCADO: "Producto equivocado",
  PRODUCTO_DANADO: "Producto dañado",
  CANTIDAD_INCORRECTA: "Cantidad incorrecta",
  PRODUCTO_DIFERENTE: "Producto diferente",
  EMBALAJE_DANADO: "Embalaje dañado",
  PRODUCTO_FALTANTE: "Producto faltante",
  OTRO: "Otro",
};

/** Etiqueta legible de un código; lo desconocido (motivo escrito a mano en compras) se muestra tal cual. */
export function etiquetaRechazo(mapa: Record<string, string>, valor: string | null | undefined): string {
  if (valor == null || valor === "") return "";
  return mapa[valor] ?? valor.replace(/_/g, " ");
}
