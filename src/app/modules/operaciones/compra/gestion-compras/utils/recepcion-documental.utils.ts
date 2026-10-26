import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { avisoTrasMutacion, erroresDeRechazo } from '../../../../../commons/core/utils/graphqlErrorUtils';
import { NotaRecepcion } from '../nota-recepcion.model';

/** Opción de un mat-select: valor y texto ya armado. */
export interface OpcionSelect<T> {
  value: T;
  viewValue: string;
}

/** Cierre de un diálogo cuando la mutación quedó sin respuesta: pudo aplicarse, quien lo abrió recarga (#488). */
export interface CierreParaRecargar {
  success: false;
  recargar: true;
  message?: string;
}

export const AVISO_SIN_PRESENTACIONES =
  'No se pudieron cargar las presentaciones del producto: el servidor no responde. Intentá de nuevo.';

/** Las notas del pedido como opciones del select («Número: 3 - Fecha: 17/10/2026»). */
export function opcionesDeNotas(notas: NotaRecepcion[]): OpcionSelect<number>[] {
  return notas.map((nota) => ({
    value: nota.id,
    viewValue: `Número: ${nota.numero} - Fecha: ${dateToString(nota.fecha, 'dd/MM/yyyy')}`,
  }));
}

/** Cantidad en unidades base llevada a la presentación (sin presentación o con cantidad 0 queda igual). */
export function enPresentacion(cantidadBase: number, presentacion?: { cantidad?: number } | null): number {
  const porUnidad = presentacion?.cantidad ?? 0;
  return porUnidad > 0 ? cantidadBase / porUnidad : cantidadBase;
}

/** Cantidad en la presentación llevada a unidades base (sin presentación o con cantidad 0 queda igual). */
export function aUnidadesBase(cantidad: number, presentacion?: { cantidad?: number } | null): number {
  const porUnidad = presentacion?.cantidad ?? 0;
  return porUnidad > 0 ? cantidad * porUnidad : cantidad;
}

/**
 * Tras el error de una mutación transaccional: si el servidor la rechazó no se aplicó nada (el genérico ya mostró el
 * motivo) y devuelve `null` para dejar el diálogo abierto; si quedó sin respuesta devuelve el cierre con recarga.
 */
export function cierreSiNoHuboRespuesta(error: unknown, queSeHizo: string): CierreParaRecargar | null {
  if (erroresDeRechazo(error) != null) return null;
  return { success: false, recargar: true, message: avisoTrasMutacion(error, queSeHizo) ?? undefined };
}
