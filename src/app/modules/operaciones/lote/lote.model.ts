import { Producto } from '../../productos/producto/producto.model';
import { Proveedor } from '../../personas/proveedor/proveedor.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

/**
 * Estado de un lote. Solo los LIBERADO entran en FEFO y se pueden vender.
 * Los otros dos sacan el lote de circulación sin tocar el stock físico.
 */
export enum EstadoLote {
  LIBERADO = 'LIBERADO',
  CUARENTENA = 'CUARENTENA',
  BLOQUEADO = 'BLOQUEADO'
}

export const ESTADO_LOTE_LABELS: { [key in EstadoLote]: string } = {
  [EstadoLote.LIBERADO]: 'Liberado',
  [EstadoLote.CUARENTENA]: 'En cuarentena',
  [EstadoLote.BLOQUEADO]: 'Bloqueado'
};

/**
 * Maestro de lotes. La unicidad es (producto, numeroLote): el mismo código puede repetirse
 * entre productos distintos sin que sean el mismo lote.
 */
export class Lote {
  id: number;
  producto?: Producto;
  numeroLote: string;
  fechaVencimiento?: Date;
  /** Fecha por la que ordena FEFO. Se deriva de los días de vencimiento del producto. */
  fechaRetiro?: Date;
  fechaFabricacion?: Date;
  proveedor?: Proveedor;
  estado: EstadoLote;
  observacion?: string;
  usuario?: Usuario;
  creadoEn?: Date;
  actualizadoEn?: Date;
}

/** Saldo disponible de un lote en una sucursal (agregado del ledger + datos del maestro). */
export class StockLote {
  loteId: number;
  productoId: number;
  sucursalId: number;
  numeroLote: string;
  fechaVencimiento?: Date;
  fechaRetiro?: Date;
  estado: EstadoLote;
  cantidadDisponible: number;
}
