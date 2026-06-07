import { EquipoFinancieroInput } from './equipo-financiero-input.model';

export interface EquipoInput {
  id?: number;
  propietarioId?: number;
  identificador?: string;
  modeloId?: number;
  descripcion?: string;
  imagenes?: string;
  tipoEquipoId?: number;
  consumeEnergia?: boolean;
  consumoValor?: string;
  sucursalId?: number;
  usuarioId?: number;
  financiero?: EquipoFinancieroInput;
  costo?: number;
  valorTasacion?: number;
  valorTasacionPyg?: number;
  valorTasacionBrl?: number;
  situacionPago?: string;
  proveedorId?: number;
  monedaId?: number;
  montoTotal?: number;
  montoYaPagado?: number;
  cantidadCuotas?: number;
  cantidadCuotasPagadas?: number;
  diaVencimiento?: number;
}
