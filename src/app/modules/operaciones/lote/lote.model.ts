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
  /**
   * OJO: no es el documento, es el ÍTEM del documento, porque el ledger se escribe por ítem.
   * Mostrarlo como documento manda a buscar un id que no existe. Para eso está documentoId.
   */
  referencia?: number;
  /** El documento al que pertenece ese ítem: la venta, la recepción o la transferencia. */
  documentoId?: number;
  /** Positiva si entró al lote, negativa si salió. */
  cantidad: number;
  usuarioNombre?: string;
}

/**
 * Una venta de un lote a un cliente identificado.
 *
 * Va una fila por VENTA y no una por cliente, aunque eso repita al que compró varias veces: cada
 * fila tiene que poder abrir su venta, y un cliente agrupado no tiene un único número al que
 * apuntar.
 *
 * Una consulta devuelve las ventas rastreables o las de mostrador, nunca las dos juntas: la
 * abrumadora mayoría va contra el cliente genérico y mezcladas taparían a los clientes reales.
 */
export class ClienteLote {
  ventaId: number;
  /** La clave de venta es (id, sucursalId): sin la sucursal el número es ambiguo. */
  sucursalId: number;
  sucursalNombre?: string;
  fecha?: Date;
  clienteId: number;
  clienteNombre?: string;
  clienteDocumento?: string;
  /** Dónde ubicarlo si hay que avisarle por un recall. Nula cuando la persona no la tiene cargada. */
  clienteDireccion?: string;
  /** Unidades que se llevó en esa venta, en positivo: el ledger las guarda negativas. */
  cantidad: number;
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

/**
 * Un lote del maestro con el saldo que tiene en una sucursal puntual.
 *
 * Es lo que devuelve el buscador de lotes del ajuste. Incluye los de saldo cero: son los que hacen
 * falta para trazar mercadería que ya estaba en góndola sin lote asignado.
 */
export class LoteDeProducto {
  loteId: number;
  numeroLote: string;
  fechaVencimiento?: Date;
  fechaRetiro?: Date;
  estado: EstadoLote;
  /** Saldo en la sucursal consultada. */
  saldo: number;
  /**
   * Saldo del lote en toda la red. Sin este dato un lote con mercadería en otro depósito se ve
   * igual que un lote agotado: los dos en cero.
   */
  saldoTotal: number;
  /** Archivado: sin saldo en la red y oculto de buscadores y selectores. */
  archivado?: boolean;
}

/**
 * Qué está haciendo el operador al ajustar el stock de un lote. Decide si la existencia total
 * cambia o no, y por eso se elige a mano en vez de deducirse del saldo sin trazar: el mismo número
 * tecleado tendría efectos distintos según un saldo que el operador no controla.
 */
export enum ModoAjusteLote {
  /** El stock ya estaba contado pero sin lote. El total no cambia, solo se traza. */
  ATRIBUIR = 'ATRIBUIR',
  /** La existencia estaba mal: rotura, faltante, mercadería encontrada. El total cambia. */
  CORREGIR = 'CORREGIR',
  /** El lote tiene más saldo del que hay con ese número: baja el lote y lo pasa a SIN LOTE. El total no cambia. */
  LIBERAR = 'LIBERAR'
}

/**
 * Las tres cuentas de un producto en una sucursal, en unidades base.
 *
 * `sinTrazar` es `existencia - enLotes` y puede venir negativo: eso significa que se vendió más de
 * lo que el ledger tenía atribuido, o sea deuda de trazabilidad, no un error de cálculo.
 */
export class ResumenStockLote {
  productoId: number;
  sucursalId: number;
  existencia: number;
  enLotes: number;
  sinTrazar: number;
}

/** Lo que devuelve el ajuste: los saldos ya recalculados contra la base, no los que predijo la UI. */
export class AjusteStockLoteResultado {
  movimientoStockId: number;
  sucursalId: number;
  loteId: number;
  numeroLote: string;
  /** Lo que se escribió en el movimiento agregado. Es 0 cuando fue una atribución. */
  cantidadMovimiento: number;
  saldoLote: number;
  resumen: ResumenStockLote;
}

/** Un ajuste de stock sobre un lote. El lote va por id, o por número cuando se lo está creando. */
export interface AjusteStockLoteInput {
  productoId: number;
  sucursalId: number;
  modo: ModoAjusteLote;
  /** Cuántas unidades de ESE lote hay realmente, en unidades base. No es la diferencia. */
  cantidadFinal: number;
  /** Opcional. Si viene, queda en el registro de modificaciones junto con el ajuste. */
  motivo?: string;
  usuarioId?: number;
  loteId?: number;
  numeroLote?: string;
  /** yyyy-MM-dd. Solo se usa al crear el lote. */
  fechaVencimiento?: string;
  /** Saldo del lote que vio el operador: si cambió al confirmar, el backend rechaza para recargar. */
  saldoEsperado?: number;
  /** yyyy-MM-dd. Solo se usa al crear el lote. */
  fechaRetiro?: string;
}

/** Un lote que coincide con el número buscado (#429 fase 2). Sale del maestro: incluye saldo 0 y archivados. */
export interface LoteEncontrado {
  loteId: number;
  productoId: number;
  productoDescripcion: string;
  numeroLote: string;
  fechaVencimiento?: string;
  estado?: EstadoLote;
  proveedorNombre?: string;
  archivado?: boolean;
  primeraEntradaFecha?: string;
  primeraEntradaTipo?: string;
  primeraEntradaDocumentoId?: number;
  saldoTotal: number;
  totalVendido: number;
  cantidadVentas: number;
}

export interface EntradaSinLote {
  tipoMovimiento: string;
  movimientos: number;
  cantidad: number;
}

/** Cuánto vale un "no hay registro" para el producto. */
export interface TrazabilidadProducto {
  productoId: number;
  productoDescripcion?: string;
  /** Nulo: el producto nunca se controló por lote. */
  trazadoDesde?: string;
  entradasSinLote: EntradaSinLote[];
  comprasAnteriores: number;
  todasLasEntradasConLote: boolean;
}

export interface ResultadoBusquedaLote {
  numeroBuscado: string;
  claveBusqueda?: string;
  /** false = no hay registro. NO quiere decir "nunca entró". */
  encontrado: boolean;
  coincidenciaExacta: boolean;
  lotes: LoteEncontrado[];
  trazabilidad?: TrazabilidadProducto;
}

/** De qué lote salió un ítem de una venta: una fila por ítem y lote («SIN LOTE» con loteId nulo). */
export interface LoteVentaItem {
  ventaItemId: number;
  productoId: number;
  loteId?: number;
  numeroLote: string;
  fechaVencimiento?: string;
  cantidad: number;
  anulado?: boolean;
}

/** Recepción que entró sin lote («Cargar lote después») y sigue pendiente (#429 fase 2, entrega 3). */
export interface PendienteLote {
  mslId: number;
  sucursalId: number;
  sucursalNombre?: string;
  productoId: number;
  productoDescripcion?: string;
  recepcionId?: number;
  recepcionItemId?: number;
  proveedorNombre?: string;
  fecha?: string;
  cantidad: number;
  resuelto: number;
  remanente: number;
}

export interface PendienteLotePage {
  content: PendienteLote[];
  totalElements: number;
  page: number;
  size: number;
}

export interface InfoPendienteLote {
  pendiente: PendienteLote;
  saldoSinLote: number;
  atribuidoManualDespues: number;
  cantidadSugerida: number;
  ultimaSincronizacion?: string;
  sincronizacionVencida: boolean;
  maxDesfaseMinutos: number;
  lotesParecidos: LoteEncontrado[];
}

export interface ResolucionLotePendiente {
  id: number;
  mslId: number;
  sucursalId: number;
  productoId?: number;
  productoDescripcion?: string;
  loteId?: number;
  numeroLote?: string;
  cantidadAtribuida: number;
  cantidadNoAtribuida: number;
  accion: 'ATRIBUIDO' | 'DESCARTADO';
  motivo?: string;
  movimientoStockId?: number;
  usuarioId?: number;
  usuarioNickname?: string;
  fecha?: string;
  anulada?: boolean;
}
