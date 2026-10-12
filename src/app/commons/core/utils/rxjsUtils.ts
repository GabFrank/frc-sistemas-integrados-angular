import { EMPTY, from, MonoTypeOperatorFunction, ObservableInput, OperatorFunction } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

/**
 * Para una lectura cuyo error ya avisó `GenericCrudService` y de la que quien llama no tiene nada más que
 * decir: ante el error corre `alFallar` (apagar una bandera, cerrar un modal propio) y termina sin emitir, en
 * vez de dejar un error sin capturar (#390).
 *
 * No usarla donde un «no llegó» se pueda confundir con un «no existe» y se decida algo con eso.
 */
export function terminarSiFalla<T>(alFallar?: (error: any) => void): MonoTypeOperatorFunction<T> {
  return catchError((error) => {
    // Siempre a la consola: acá también cae un error de programación de un operador de más arriba.
    console.error('[terminarSiFalla]', error);
    alFallar?.(error);
    return EMPTY;
  });
}

/**
 * `switchMap` para un flujo que tiene que seguir vivo (un filtro, lo que se tipea, un sondeo): si la consulta
 * de adentro falla, se descarta ese resultado y el flujo de afuera sigue escuchando. Con un `switchMap` común,
 * el primer error termina el flujo entero y la pantalla deja de responder hasta reabrirla (#390).
 */
export function switchMapSinCortar<T, R>(
  proyectar: (valor: T, indice: number) => ObservableInput<R>,
  alFallar?: (error: any) => void,
): OperatorFunction<T, R> {
  return switchMap((valor, indice) => from(proyectar(valor, indice)).pipe(terminarSiFalla<R>(alFallar)));
}
