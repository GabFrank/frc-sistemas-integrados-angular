import { FormGroup } from '@angular/forms';
import { ContextoConsulta, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';

/**
 * Carga de un bien para editarlo: el error de red y el del servidor llegan al formulario, que bloquea el
 * guardado y ofrece reintentar (sin aviso del servicio genérico: el cartel del formulario alcanza).
 */
export const LECTURA_BIEN: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
export const CONSULTA_BIEN: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

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

  /** Único dato que mira el botón Guardar (los templates no llaman funciones). */
  guardarBloqueado = false;
  /** Las cuotas guardadas están llegando: no se edita el plan (una carga tardía pisaría lo cambiado). */
  cuotasCargando = false;

  constructor(
    private form: () => FormGroup,
    private situacionActual: () => string,
    private alCambiar: () => void
  ) {}

  actualizar(cambios: Partial<Pick<EstadoFormularioBien, 'bien' | 'cuotas' | 'eraPagando' | 'enteFallo' | 'planSinCalcular'>>): void {
    Object.assign(this, cambios);
    this.recalcular();
  }

  /** También hay que llamarlo cuando cambia la situación de pago elegida. */
  recalcular(): void {
    const porBien = this.bien === 'cargando' || this.bien === 'error';
    const porCuotas = this.eraPagando && (this.cuotas === 'cargando' || this.cuotas === 'error');
    const porPlan = this.planSinCalcular && this.situacionActual() === 'PAGANDO';
    this.guardarBloqueado = porBien || porCuotas || porPlan;

    const cuotasCargando = this.cuotas === 'cargando';
    if (cuotasCargando !== this.cuotasCargando) {
      this.cuotasCargando = cuotasCargando;
      const form = this.form();
      CAMPOS_DE_CUOTAS.forEach((campo) => {
        const control = form?.controls[campo];
        if (control == null) return;
        if (cuotasCargando) control.disable({ emitEvent: false });
        else control.enable({ emitEvent: false });
      });
    }
    this.alCambiar();
  }
}
