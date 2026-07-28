import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
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

  private catalogo$?: Observable<ModuloGastoInfo[]>;

  constructor(
    private genericService: GenericCrudService,
    private modulosGastoGQL: ModulosGastoGQL,
  ) { }

  obtenerModulos(servidor = true): Observable<ModuloGastoInfo[]> {
    if (!this.catalogo$) {
      this.catalogo$ = this.genericService
        .onCustomQuery(this.modulosGastoGQL, {}, servidor, null, true)
        .pipe(
          map((res: ModuloGastoInfo[] | null) => res ?? []),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.catalogo$;
  }
}
