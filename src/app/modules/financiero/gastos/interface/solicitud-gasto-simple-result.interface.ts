import { SolicitudGastoSimpleMontoLinea } from './solicitud-gasto-simple-monto-linea.interface';

export interface SolicitudGastoSimpleResult {
  tipoGastoId: number;
  solicitanteId: number;
  descripcion: string;
  vencimiento: Date;
  montos: SolicitudGastoSimpleMontoLinea[];
  monedaId?: number;
  monto?: number;
  sucursalRetiroId?: number;
  proveedorId: number | null;
  enteId?: number | null;
}
