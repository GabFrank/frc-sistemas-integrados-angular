import { FormGroup } from '@angular/forms';
import { ContextoConsulta, QueryError } from '../../../../generics/generic-crud.service';
import { TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.constantes';
import { esRechazoDelServidor } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';

/**
 * Carga de un bien para editarlo: el error de red y el del servidor llegan al formulario, que bloquea el
 * guardado y ofrece reintentar (sin aviso del servicio genérico: el cartel del formulario alcanza).
 */
export const LECTURA_BIEN: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
export const CONSULTA_BIEN: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

export const AVISO_GUARDADO_SIN_CONFIRMAR = 'No se pudo confirmar el guardado: podés volver a intentar.';
export const AVISO_ALTA_SIN_CONFIRMAR =
  'No se pudo confirmar si el bien se guardó. No vuelvas a cargarlo sin revisar: cerrá y buscalo en la lista.';
export const AVISO_ALTA_RECHAZADA =
  'El servidor informó un error, pero el bien pudo haber quedado guardado: cerrá y buscalo en la lista antes de volver a cargarlo.';
export const AVISO_ALTA_DE_VEHICULO_RECHAZADA =
  'Si el error dice que la chapa ya existe, el vehículo pudo haberse guardado: cerrá y buscalo en la lista.';

export type EstadoCargaBien = 'nuevo' | 'cargando' | 'ok' | 'error';
export type EstadoCargaCuotas = 'sin-cargar' | 'cargando' | 'ok' | 'error';

/** Campos del plan de pago que no se tocan mientras las cuotas guardadas están llegando. */
const CAMPOS_DE_CUOTAS = ['cantidadCuotas', 'cantidadCuotasPagadas', 'montoTotal', 'montoYaPagado'];

/**
 * Estado de carga de un formulario de bien (equipo, mueble, inmueble, vehículo) y la regla de cuándo se puede
 * guardar. Los cuatro formularios hacían lo mismo sin manejo de error (#390):
 *
 * - si el bien a editar no cargaba, el formulario quedaba vacío y sin id: guardar creaba un bien NUEVO;
 * - si no cargaban sus cuotas, guardar un bien «pagando» mandaba la lista vacía y el central regeneraba todo el
 *   plan (perdiendo ajustes y cuotas pagadas); y pasarlo a otra situación las borraba.
 *
 * No depende de MatDialogRef: vehículo se abre en un diálogo o en una pestaña.
 */
export class EstadoFormularioBien {
  bien: EstadoCargaBien = 'nuevo';
  cuotas: EstadoCargaCuotas = 'sin-cargar';
  /**
   * El bien se cargó (o se guardó) en «pagando»: tiene cuotas en el servidor y hay que leerlas antes de guardar.
   * Es la situación ORIGINAL, no la del control: con las cuotas sin leer tampoco se lo puede pasar a «pagado».
   */
  eraPagando = false;
  /** No se pudo consultar el ente (solo afecta a los archivos): se avisa pero no bloquea el guardado. */
  enteFallo = false;
  /** El editor de cuotas está recalculando o no pudo recalcular. */
  planSinCalcular = false;
  /** Guardado en curso: sin doble «Guardar». */
  guardando = false;
  /**
   * Un ALTA quedó sin confirmar: el bien pudo haberse guardado y volver a guardar crearía otro (equipo, mueble e
   * inmueble no tienen ningún dato único; la chapa del vehículo no tiene restricción en la base). No se guarda
   * más desde este formulario: se cierra y se revisa la lista.
   */
  altaSinConfirmar = false;

  /** Único dato que mira el botón Guardar (los templates no llaman funciones). */
  guardarBloqueado = false;
  /**
   * Las cuotas guardadas están llegando o no se pudieron leer: no se edita el plan (ni los campos ni el editor).
   * Si se editara, las cuotas que lleguen después pisarían la tabla dejándola distinta de la cantidad y el monto.
   */
  planBloqueado = false;
  /** Contador de lecturas de ente y cuotas: solo aplica la última (reintentos, recarga tras guardar). */
  lectura = 0;

  constructor(
    private form: () => FormGroup,
    private situacionActual: () => string,
    private alCambiar: () => void
  ) {}

  actualizar(cambios: Partial<Pick<EstadoFormularioBien,
    'bien' | 'cuotas' | 'eraPagando' | 'enteFallo' | 'planSinCalcular' | 'guardando'>>): void {
    Object.assign(this, cambios);
    this.recalcular();
  }

  /**
   * El guardado dio error. Devuelve el aviso que tiene que mostrar el formulario (o `null` si no hace falta).
   *
   * - Edición (se envió con id): reintentar es inocuo. Solo se avisa si no hubo respuesta; un rechazo o una
   *   respuesta vacía ya los avisó el servicio genérico, y el corte por tiempo, el link.
   * - Alta: el central guarda el bien, después el ente y después lo financiero por separado, y sus errores dicen
   *   «No se pudo guardar…» aunque el bien ya esté guardado. Cualquier error deja el alta SIN CONFIRMAR.
   *   Excepción (`altaReintentableSiRechaza`, vehículo con chapa): un rechazo se puede corregir y reintentar,
   *   porque el central valida la chapa repetida.
   */
  alFallarElGuardado(error: any, esAlta: boolean, altaReintentableSiRechaza = false): string | null {
    this.guardando = false;
    let aviso: string | null;
    if (!esAlta) {
      aviso = Array.isArray(error) || esTimeoutDeLink(error) ? null : AVISO_GUARDADO_SIN_CONFIRMAR;
    } else if (altaReintentableSiRechaza && esRechazoDelServidor(error)) {
      aviso = AVISO_ALTA_DE_VEHICULO_RECHAZADA;
    } else {
      this.altaSinConfirmar = true;
      // Un aviso por flujo: en el corte por tiempo ya avisa el link («pudo haberse aplicado»); tras un rechazo
      // (que ya mostró el servicio genérico) se aclara que igual pudo haberse guardado. El cartel queda fijo.
      aviso = esTimeoutDeLink(error) ? null
        : esRechazoDelServidor(error) ? AVISO_ALTA_RECHAZADA
        : AVISO_ALTA_SIN_CONFIRMAR;
    }
    this.recalcular();
    return aviso;
  }

  /** También hay que llamarlo cuando cambia la situación de pago elegida. */
  recalcular(): void {
    const porBien = this.bien === 'cargando' || this.bien === 'error';
    const porCuotas = this.eraPagando && (this.cuotas === 'cargando' || this.cuotas === 'error');
    const porPlan = this.planSinCalcular && this.situacionActual() === 'PAGANDO';
    this.guardarBloqueado = porBien || porCuotas || porPlan || this.guardando || this.altaSinConfirmar;

    const planBloqueado = this.cuotas === 'cargando' || (this.eraPagando && this.cuotas === 'error');
    if (planBloqueado !== this.planBloqueado) {
      this.planBloqueado = planBloqueado;
      const form = this.form();
      CAMPOS_DE_CUOTAS.forEach((campo) => {
        const control = form?.controls[campo];
        if (control == null) return;
        if (planBloqueado) control.disable({ emitEvent: false });
        else control.enable({ emitEvent: false });
      });
    }
    this.alCambiar();
  }
}
