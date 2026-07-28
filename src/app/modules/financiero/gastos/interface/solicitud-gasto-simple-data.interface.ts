export interface SolicitudGastoSimpleData {
  tipoGastoId: number;
  tipoGastoDescripcion: string;
  moduloPadre?: string;
  tipoNaturaleza?: string;
  esPagoCuotaActivo?: boolean;
  requiereAutorizacion?: boolean;
  solicitanteId: number;
  solicitanteNombre: string;
}
