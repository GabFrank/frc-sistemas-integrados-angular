/**
 * Nota de Remisión Electrónica (NRE, tipo 7 de SIFEN): ampara el traslado de mercadería.
 * Toda la operación va contra el CENTRAL (servidor=true): el filial no emite notas.
 */

export enum OrigenNotaRemision {
  TRANSFERENCIA = 'TRANSFERENCIA',
  FACTURA = 'FACTURA',
  MANUAL = 'MANUAL'
}

/** Espejo de MotivoEmisionNotaRemision del backend (catálogo TiMotivTras de SIFEN). */
export enum MotivoEmisionNotaRemision {
  TRASLADO_POR_VENTAS = 'TRASLADO_POR_VENTAS',
  TRASLADO_POR_CONSIGNACION = 'TRASLADO_POR_CONSIGNACION',
  EXPORTACION = 'EXPORTACION',
  TRASLADO_POR_COMPRA = 'TRASLADO_POR_COMPRA',
  IMPORTACION = 'IMPORTACION',
  TRASLADO_POR_DEVOLUCION = 'TRASLADO_POR_DEVOLUCION',
  TRASLADO_ENTRE_LOCALES = 'TRASLADO_ENTRE_LOCALES',
  TRASLADO_BIENES_TRANSFORMACION = 'TRASLADO_BIENES_TRANSFORMACION',
  TRASLADO_BIENES_REPARACION = 'TRASLADO_BIENES_REPARACION',
  TRASLADO_POR_EMISOR_MOVIL = 'TRASLADO_POR_EMISOR_MOVIL',
  EXHIBICION_O_DEMOSTRACION = 'EXHIBICION_O_DEMOSTRACION',
  PARTICIPACION_EN_FERIAS = 'PARTICIPACION_EN_FERIAS',
  TRASLADO_DE_ENCOMIENDAS = 'TRASLADO_DE_ENCOMIENDAS',
  DECOMISO = 'DECOMISO',
  OTRO = 'OTRO'
}

export enum ResponsableEmisionNr {
  EMISOR_FACTURA = 'EMISOR_FACTURA',
  POSEEDOR_FACTURA_Y_BIENES = 'POSEEDOR_FACTURA_Y_BIENES',
  EMPRESA_TRANSPORTISTA = 'EMPRESA_TRANSPORTISTA',
  DESPACHANTE_DE_ADUANAS = 'DESPACHANTE_DE_ADUANAS',
  AGENTE_DE_TRANSPORTE_O_INTERMEDIARIO = 'AGENTE_DE_TRANSPORTE_O_INTERMEDIARIO'
}

export enum TipoTransporteNr {
  PROPIO = 'PROPIO',
  TERCERO = 'TERCERO'
}

export enum ModalidadTransporteNr {
  TERRESTRE = 'TERRESTRE',
  FLUVIAL = 'FLUVIAL',
  AEREO = 'AEREO',
  MULTIMODAL = 'MULTIMODAL'
}

/** Etiquetas para los select: el enum viaja, el texto se muestra. */
export const MOTIVOS_NOTA_REMISION: { valor: MotivoEmisionNotaRemision; texto: string }[] = [
  { valor: MotivoEmisionNotaRemision.TRASLADO_POR_VENTAS, texto: 'Traslado por ventas' },
  { valor: MotivoEmisionNotaRemision.TRASLADO_POR_CONSIGNACION, texto: 'Traslado por consignación' },
  { valor: MotivoEmisionNotaRemision.EXPORTACION, texto: 'Exportación' },
  { valor: MotivoEmisionNotaRemision.TRASLADO_POR_COMPRA, texto: 'Traslado por compra' },
  { valor: MotivoEmisionNotaRemision.IMPORTACION, texto: 'Importación' },
  { valor: MotivoEmisionNotaRemision.TRASLADO_POR_DEVOLUCION, texto: 'Traslado por devolución' },
  { valor: MotivoEmisionNotaRemision.TRASLADO_ENTRE_LOCALES, texto: 'Traslado entre locales' },
  { valor: MotivoEmisionNotaRemision.TRASLADO_BIENES_TRANSFORMACION, texto: 'Traslado para transformación' },
  { valor: MotivoEmisionNotaRemision.TRASLADO_BIENES_REPARACION, texto: 'Traslado para reparación' },
  { valor: MotivoEmisionNotaRemision.TRASLADO_POR_EMISOR_MOVIL, texto: 'Traslado por emisor móvil' },
  { valor: MotivoEmisionNotaRemision.EXHIBICION_O_DEMOSTRACION, texto: 'Exhibición o demostración' },
  { valor: MotivoEmisionNotaRemision.PARTICIPACION_EN_FERIAS, texto: 'Participación en ferias' },
  { valor: MotivoEmisionNotaRemision.TRASLADO_DE_ENCOMIENDAS, texto: 'Traslado de encomiendas' },
  { valor: MotivoEmisionNotaRemision.DECOMISO, texto: 'Decomiso' },
  { valor: MotivoEmisionNotaRemision.OTRO, texto: 'Otro' }
];

export const MODALIDADES_TRANSPORTE: { valor: ModalidadTransporteNr; texto: string }[] = [
  { valor: ModalidadTransporteNr.TERRESTRE, texto: 'Terrestre' },
  { valor: ModalidadTransporteNr.FLUVIAL, texto: 'Fluvial' },
  { valor: ModalidadTransporteNr.AEREO, texto: 'Aéreo' },
  { valor: ModalidadTransporteNr.MULTIMODAL, texto: 'Multimodal' }
];

export interface NotaRemisionItem {
  id?: number;
  sucursalId?: number;
  notaRemisionId?: number;
  productoId?: number;
  presentacionId?: number;
  codigo?: string;
  descripcion?: string;
  cantidad?: number;
  unidadMedida?: string;
}

export interface NotaRemision {
  id?: number;
  sucursalId?: number;
  timbradoDetalleId?: number;
  numeroNotaRemision?: number;
  fecha?: string;
  origen?: OrigenNotaRemision;
  transferenciaId?: number;
  facturaLegalId?: number;
  motivoEmision?: MotivoEmisionNotaRemision;
  responsableEmision?: ResponsableEmisionNr;
  kmEstimado?: number;
  fechaInicioTraslado?: string;
  fechaFinTraslado?: string;
  fechaEstimadaFactura?: string;
  clienteId?: number;
  receptorNombre?: string;
  receptorRuc?: string;
  receptorDireccion?: string;
  receptorDepartamento?: string;
  receptorCodigoCiudad?: number;
  receptorCiudad?: string;
  salidaDireccion?: string;
  salidaDepartamento?: string;
  salidaCodigoCiudad?: number;
  salidaCiudad?: string;
  entregaDireccion?: string;
  entregaDepartamento?: string;
  entregaCodigoCiudad?: number;
  entregaCiudad?: string;
  tipoTransporte?: TipoTransporteNr;
  modalidadTransporte?: ModalidadTransporteNr;
  transportistaNombre?: string;
  transportistaRuc?: string;
  transportistaDireccion?: string;
  vehiculoId?: number;
  vehiculoMarca?: string;
  vehiculoMatricula?: string;
  choferPersonaId?: number;
  choferNombre?: string;
  choferDocumento?: string;
  choferDireccion?: string;
  activo?: boolean;
  usuarioId?: number;
  creadoEn?: string;
}

/** Lo que devuelve prellenarNotaRemision: el borrador que arma el backend. */
export interface NotaRemisionPrellenada {
  notaRemision?: NotaRemision;
  items?: NotaRemisionItem[];
}

/** Input de la mutation; las fechas viajan como string, según la convención del repo. */
export interface NotaRemisionInput extends Omit<NotaRemision, 'origen' | 'motivoEmision' | 'responsableEmision' | 'tipoTransporte' | 'modalidadTransporte'> {
  origen?: string;
  motivoEmision?: string;
  responsableEmision?: string;
  tipoTransporte?: string;
  modalidadTransporte?: string;
}

export interface NotaRemisionItemInput {
  id?: number;
  productoId?: number;
  presentacionId?: number;
  codigo?: string;
  descripcion: string;
  cantidad: number;
  unidadMedida?: string;
}
