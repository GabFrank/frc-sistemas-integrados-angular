import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';

export interface EquipoFinanciero {
  id?: number;
  costo?: number;
  valorTasacion?: number;
  valorTasacionPyg?: number;
  valorTasacionBrl?: number;
  situacionPago?: string;
  proveedor?: Proveedor;
  moneda?: Moneda;
  montoTotal?: number;
  montoYaPagado?: number;
  cantidadCuotas?: number;
  cantidadCuotasPagadas?: number;
  diaVencimiento?: number;
  usuario?: Usuario;
  creadoEn?: Date;
}
