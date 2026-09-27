import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { PrecioPorSucursal } from '../precio-por-sucursal/precio-por-sucursal.model';

export class PrecioEspecialSucursal {
  id: number;
  precioPorSucursal: PrecioPorSucursal;
  sucursal: Sucursal;
  precio: number;
  /** "yyyy-MM-dd 00:00" desde el backend; leer con stringToLocalDate. */
  fechaDesde: string;
  fechaHasta: string;
  activo: boolean;
  creadoEn: string;
  usuarioNickname: string;
}

export class PrecioEspecialSucursalInput {
  precioId: number;
  sucursalIds: number[];
  precio: number;
  fechaDesde: string | null;
  fechaHasta: string | null;
}
