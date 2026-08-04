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

/**
 * Saldo de un lote expresado en la presentación con la que carga el operador.
 * Las conversiones vienen resueltas del backend: acá no se calcula nada.
 */
export class StockLotePresentacion {
  loteId: number;
  numeroLote: string;
  fechaVencimiento?: Date;
  fechaRetiro?: Date;
  estado: EstadoLote;
  /** Saldo en unidades, como vive en el ledger. */
  cantidadDisponible: number;
  /** Presentaciones completas que entran en el saldo. Una caja es indivisible. */
  cantidadDisponiblePresentacion: number;
  /** Unidades que quedan fuera de esas presentaciones completas. */
  unidadesSobrantes: number;
  unidadesPorPresentacion: number;
  presentacionDescripcion?: string;
}

/** Saldo disponible de un lote (agregado del ledger + datos del maestro). */
export class StockLote {
  loteId: number;
  productoId: number;
  /** Solo lo completa buscarStockPorLote; stockPorLote lo deja null. */
  productoDescripcion?: string;
  /**
   * Solo los completa stockPorLote, que consulta una sucursal puntual. buscarStockPorLote agrupa
   * por lote y los deja null: el desglose se pide con stockLotePorSucursal.
   */
  sucursalId?: number;
  sucursalNombre?: string;
  numeroLote: string;
  fechaVencimiento?: Date;
  fechaRetiro?: Date;
  estado: EstadoLote;
  /** De quién vino el lote. Solo lo completa buscarStockPorLote; stockPorLote lo deja null. */
  proveedorNombre?: string;
  cantidadDisponible: number;
}

/**
 * Un movimiento del historial de un lote. Es la lectura inversa del ledger: responde de dónde
 * vino el lote y a dónde fue, que es lo que hace utilizable el bloqueo por recall.
 */
export class MovimientoLote {
  /** No es único por sí solo: la clave del ledger es (id, sucursalId). */
  id: number;
  sucursalId: number;
  fecha?: Date;
  sucursalNombre?: string;
  /** COMPRA, VENTA, AJUSTE o TRANSFERENCIA. Nulo si el movimiento padre ya no está. */
  tipoMovimiento?: string;
  /** Id del documento que originó el movimiento. Su significado depende del tipo. */
  referencia?: number;
  /** Positiva si entró al lote, negativa si salió. */
  cantidad: number;
  usuarioNombre?: string;
}

/**
 * Saldo de un lote en una sucursal puntual. Es el desglose de una fila de StockLote e incluye las
 * sucursales sin stock, con cantidad 0.
 */
export class StockLoteSucursal {
  sucursalId: number;
  sucursalNombre?: string;
  cantidadDisponible: number;
}
