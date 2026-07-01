export interface SolicitudGastoSimpleData {
  tipoGastoId: number;
  tipoGastoDescripcion: string;
  moduloPadre?: string;
  requiereAutorizacion?: boolean;
  solicitanteId: number;
  solicitanteNombre: string;
}
