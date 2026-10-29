import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageInfo } from '../../../app.component';
import { ContextoConsulta, GenericCrudService, QueryError } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import {
  CortarSorteoGQL, FilterSorteosGQL, SaveSorteoGQL, SorteoParticipacionesGQL, SorteoResumenGQL,
} from './graphql/sorteo.gql';
import { Sorteo, SorteoInput, SorteoParticipacion, SorteoResumenSucursal } from './sorteo.model';

/** Lecturas: el error llega a la pantalla, que avisa una vez (mismo criterio que las promociones). */
const LECTURA: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };

/** Todo va al central (servidor = true): la filial recibe los sorteos por replicación. */
@Injectable({ providedIn: 'root' })
export class SorteoService {
  constructor(
    private genericService: GenericCrudService,
    private filterGQL: FilterSorteosGQL,
    private participacionesGQL: SorteoParticipacionesGQL,
    private resumenGQL: SorteoResumenGQL,
    private saveGQL: SaveSorteoGQL,
    private cortarGQL: CortarSorteoGQL
  ) {}

  onFiltrar(params: { texto?: string; soloVigentes?: boolean; page: number; size: number }): Observable<PageInfo<Sorteo>> {
    return this.genericService.onCustomQuery(this.filterGQL, params, true, LECTURA, true, CONSULTA);
  }

  onParticipaciones(params: { sorteoId: number; sucursalId?: number; codigo?: string; page: number; size: number }):
    Observable<PageInfo<SorteoParticipacion>> {
    return this.genericService.onCustomQuery(this.participacionesGQL, { ...params, sorteoId: Number(params.sorteoId) },
      true, LECTURA, true, CONSULTA);
  }

  onResumen(sorteoId: number): Observable<SorteoResumenSucursal[]> {
    return this.genericService.onCustomQuery(this.resumenGQL, { sorteoId: Number(sorteoId) }, true, LECTURA, true, CONSULTA);
  }

  /** Crea cuando el input no trae id; edita si lo trae. */
  onGuardar(input: SorteoInput): Observable<Sorteo> {
    return this.genericService.onSaveCustom(this.saveGQL, { input }, true, { avisarExito: true });
  }

  onCortar(id: number): Observable<Sorteo> {
    return this.genericService.onSaveCustom(this.cortarGQL, { id: Number(id) }, true, { avisarExito: true });
  }
}
