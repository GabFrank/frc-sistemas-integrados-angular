import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';

/**
 * Utilidad genérica para búsqueda textual con debounce.
 * No transforma el texto: el backend (Lucene) resuelve similitud y ranking.
 */
@Injectable({
  providedIn: 'root',
})
export class BuscadorTextoService {
  readonly debounceMs = 400;

  /**
   * Emite cuando el usuario deja de escribir (solo modo texto, no código).
   */
  observarTexto(
    control: FormControl<string | null>,
    esBusquedaPorCodigo: () => boolean
  ): Observable<void> {
    return control.valueChanges.pipe(
      debounceTime(this.debounceMs),
      distinctUntilChanged(),
      filter(() => !esBusquedaPorCodigo()),
      map(() => void 0)
    );
  }
}
