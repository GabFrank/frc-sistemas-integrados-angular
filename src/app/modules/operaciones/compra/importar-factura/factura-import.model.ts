// Modelos de la feature "importar factura de proveedor".
// El backend vive en CENTRAL. Estas interfaces reflejan el schema de
// factura-proveedor-import.graphqls.

export const ESTADO_IMPORT = {
  PROCESANDO: 'PROCESANDO',
  REVISION_PENDIENTE: 'REVISION_PENDIENTE',
  CONFIRMADO: 'CONFIRMADO',
  ERROR: 'ERROR',
} as const;

export const CONFIANZA = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  NONE: 'NONE',
} as const;

/** Un archivo (pagina) a enviar. base64 sin prefijo data-uri (el backend tolera ambos). */
export interface ArchivoImportInput {
  archivoBase64: string;
  nombreArchivo: string;
  mimeType: string;
}

export interface FacturaProveedorImport {
  id: number;
  estado: string;
  origen?: string;
  nombreArchivo?: string;
  errorMensaje?: string;
  modeloIa?: string;
  tokensPrompt?: number;
  tokensRespuesta?: number;
  pedidoId?: number;
  creadoEn?: any;
}

export interface ProductoLite {
  id: number;
  descripcion: string;
  codigoPrincipal?: string;
}

export interface PersonaLite {
  id: number;
  nombre?: string;
  documento?: string;
  apodo?: string;
}

export interface ProveedorLite {
  id: number;
  persona?: PersonaLite;
}

export interface FacturaImportItemPreview {
  textoOcr?: string;
  codigoOcr?: string;
  cantidad?: number;
  precioUnitario?: number;
  descuento?: number;
  totalItem?: number;
  productoSugerido?: ProductoLite;
  productoConfianza?: string;
  productoRazon?: string;
  candidatos?: ProductoLite[];
}

export interface FacturaImportPreview {
  importId: number;
  estado?: string;
  emisorRuc?: string;
  emisorNombre?: string;
  numeroFactura?: string;
  timbrado?: string;
  fechaEmision?: string;
  moneda?: string;
  totalGeneral?: number;
  sumaItems?: number;
  totalesCuadran?: boolean;
  totalesAdvertencia?: string;
  esLegal?: boolean;
  proveedorSugerido?: ProveedorLite;
  proveedorConfianza?: string;
  proveedorRazon?: string;
  items?: FacturaImportItemPreview[];
}

export interface ConfirmarFacturaImportItemInput {
  textoOcr?: string;
  codigoOcr?: string;
  productoId?: number;
  presentacionId?: number;
  cantidad?: number;
  precioUnitario?: number;
  descuento?: number;
  omitir?: boolean;
}

/** Pagina de resultados del historial. */
export interface FacturaImportPage {
  getTotalElements?: number;
  getTotalPages?: number;
  getNumberOfElements?: number;
  isFirst?: boolean;
  isLast?: boolean;
  getContent?: FacturaProveedorImport[];
}
