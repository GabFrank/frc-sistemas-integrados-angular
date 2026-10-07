import { EMPTY, MonoTypeOperatorFunction } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Para una lectura cuyo error ya avisó `GenericCrudService` y de la que quien llama no tiene nada más que
 * decir: ante el error corre `alFallar` (apagar una bandera, cerrar un modal propio) y termina sin emitir, en
 * vez de dejar un error sin capturar (#390).
 *
 * No usarla donde un «no llegó» se pueda confundir con un «no existe» y se decida algo con eso.
 */
export function terminarSiFalla<T>(alFallar?: (error: any) => void): MonoTypeOperatorFunction<T> {
  return catchError((error) => {
    alFallar?.(error);
    return EMPTY;
  });
}
