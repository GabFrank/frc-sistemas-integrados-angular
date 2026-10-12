import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, map, shareReplay } from 'rxjs/operators';
import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';
import { ModulosGastoGQL } from '../graphql/modulosGasto';
import { ModuloGastoInfo } from '../utils/tipo-gasto-modulo-reglas.util';

/**
 * Catálogo de módulos padre de tipo de gasto. Fuente de verdad en el backend
 * (query modulosGasto); acá se cachea para evitar refetch en cada consumidor.
 */
@Injectable({
  providedIn: 'root',
})
export class ModuloGastoService {

  /**
   * Se cachea el VALOR, no el Observable: antes la caché quedaba armada con la configuración del primer
   * llamador y un error se guardaba como [] para toda la sesión (#390).
   */
  private catalogo: ModuloGastoInfo[] | null = null;
  /** Consulta en vuelo, compartida por los llamadores que llegan mientras tanto. */
  private enCurso$?: Observable<ModuloGastoInfo[]>;

  constructor(
    private genericService: GenericCrudService,
    private modulosGastoGQL: ModulosGastoGQL,
  ) { }

  /** Propaga el error (de red o del servidor): sus llamadores tienen `error:` y siguen sin catálogo. */
  obtenerModulos(servidor = true): Observable<ModuloGastoInfo[]> {
    if (this.catalogo) {
      return of(this.catalogo);
    }
    if (!this.enCurso$) {
      this.enCurso$ = this.genericService
        .onCustomQuery(this.modulosGastoGQL, {}, servidor, PROPAGAR_ERROR_DE_RED, true,
          { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true })
        .pipe(
          map((res: ModuloGastoInfo[] | null) => {
            if (res == null) { throw new Error('No se pudo cargar el catálogo de módulos de gasto'); }
            this.catalogo = res;
            return res;
          }),
          finalize(() => { this.enCurso$ = undefined; }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.enCurso$;
  }
}
