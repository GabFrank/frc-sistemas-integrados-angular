import { MovimientoBancario } from './operacion-financiera.model';

/** Roles del usuario que importan para anular (se calculan una vez, en ngOnInit del componente). */
export interface PermisosAnulacionBancaria {
  /** TESORERIA GESTIONAR */
  gestionar: boolean;
  /** TESORERIA CPP PAGAR */
  pagarCpp: boolean;
}

export type ViaAnulacionBancaria = 'PAGO' | 'OPERACION';

/** Qué ofrece el menú de una fila de movimiento bancario. Se precalcula por fila: nada de esto se evalúa en el HTML. */
export interface AccionAnularMovimientoBancario {
  /** false = la fila no lleva menú (ya anulada, o es el contra-movimiento de una anulación). */
  visible: boolean;
  habilitada: boolean;
  via: ViaAnulacionBancaria | null;
  /** Por qué no se puede anular desde acá, cuando está deshabilitada. */
  tooltip: string | null;
  titulo: string | null;
  mensaje: string | null;
  /** Qué revierte el central al confirmar. */
  aviso: string | null;
}

const SIN_ACCION: AccionAnularMovimientoBancario = {
  visible: false, habilitada: false, via: null, tooltip: null, titulo: null, mensaje: null, aviso: null,
};

const bloqueada = (tooltip: string): AccionAnularMovimientoBancario => ({ ...SIN_ACCION, visible: true, tooltip });

const ORIGENES_DE_PAGO = ['PAGO_CPP', 'GASTO', 'RRHH_VALE', 'RRHH_LIQUIDACION_SUELDO', 'RRHH_LIQUIDACION_FINAL', 'RRHH_AGUINALDO'];

const AVISO_PAGO = 'Se anula el pago completo: todos sus movimientos de caja y de banco, y sus cheques.';

/** Lo que el central deja en el documento pagado al anular el evento (PagoProveedorService.anularPagoCpp). */
const AVISO_POR_ORIGEN: Record<string, string> = {
  PAGO_CPP: 'Las solicitudes vuelven a quedar pendientes de pago y las notas de recepción dejan de estar pagadas.',
  GASTO: 'El gasto queda cancelado y vuelve a tesorería como pendiente de pago.',
  RRHH_VALE: 'El vale vuelve a quedar pendiente de pago.',
  RRHH_LIQUIDACION_SUELDO: 'La liquidación vuelve a quedar aprobada, sin pagar.',
  RRHH_AGUINALDO: 'El aguinaldo vuelve a quedar aprobado, sin pagar.',
  RRHH_LIQUIDACION_FINAL: 'El finiquito vuelve a quedar aprobado, sin pagar. El funcionario sigue dado de baja.',
};

const AVISO_PAGO_SIN_CONCEPTO = 'Los documentos que pagó vuelven a quedar pendientes de pago.';

/** Desde dónde se anula un movimiento que no se puede anular en la tabla de banco. */
const TOOLTIP_POR_ORIGEN: Record<string, string> = {
  CHEQUE: 'El cobro de un cheque se anula desde Cheques',
  ACREDITACION_POS: 'Se anula desde las acreditaciones de POS',
  VENTA_CREDITO_COBRO: 'Se anula desde el cobro del crédito',
  MANUAL: 'Un ajuste manual no se anula: se corrige con otro ajuste',
};

/**
 * Decide qué puede hacer «Anular» sobre un movimiento bancario.
 *
 * El movimiento no se revierte suelto: se anula desde el módulo dueño. Un pago del motor se anula
 * por evento (`anularPagoCpp`) y una operación financiera entera (`anularOperacionFinanciera`).
 *
 * El pago se reconoce por `pagoId` y no por `origenId`: el cheque al contado de un pago se registra
 * con origen CHEQUE y `origenId` nulo, y también se anula anulando su pago. El conjunto de
 * `origenTipo` no se asume cerrado: lo que no se reconoce queda deshabilitado.
 */
export function accionAnularMovimientoBancario(
  mov: Pick<MovimientoBancario, 'anulado' | 'origenTipo' | 'origenId' | 'pagoId'>,
  permisos: PermisosAnulacionBancaria,
): AccionAnularMovimientoBancario {
  if (!mov || mov.anulado || mov.origenTipo === 'ANULACION') return SIN_ACCION;

  if (mov.pagoId) {
    if (!permisos?.gestionar && !permisos?.pagarCpp) return bloqueada('No tenés permiso para anular pagos');
    return {
      visible: true, habilitada: true, via: 'PAGO', tooltip: null,
      titulo: 'Anular pago',
      mensaje: '¿Por qué se anula este pago?',
      aviso: `${AVISO_PAGO} ${AVISO_POR_ORIGEN[mov.origenTipo] || AVISO_PAGO_SIN_CONCEPTO}`,
    };
  }

  if (mov.origenTipo === 'OPERACION_FINANCIERA' && mov.origenId) {
    if (!permisos?.gestionar) return bloqueada('No tenés permiso para anular operaciones financieras');
    return {
      visible: true, habilitada: true, via: 'OPERACION', tooltip: null,
      titulo: 'Anular operación financiera',
      mensaje: '¿Por qué se anula esta operación?',
      aviso: 'Se anula la operación completa: se revierten todos sus movimientos, de origen y de destino.',
    };
  }

  if (ORIGENES_DE_PAGO.includes(mov.origenTipo)) {
    return bloqueada('Pago anterior al motor de pagos: no se puede anular desde acá');
  }
  return bloqueada(TOOLTIP_POR_ORIGEN[mov.origenTipo] || 'Movimiento sin origen registrado: no se puede anular desde acá');
}
