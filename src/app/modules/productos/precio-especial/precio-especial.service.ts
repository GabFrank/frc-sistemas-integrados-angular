import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageInfo } from '../../../app.component';
import { ContextoConsulta, GenericCrudService, QueryError } from '../../../generics/generic-crud.service';
import { TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../generics/generic-crud.constantes';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import {
  CortarPrecioEspecialGQL, EditarPrecioEspecialGQL, FilterPreciosEspecialesGQL,
  PreciosEspecialesPorPrecioGQL, SavePreciosEspecialesGQL,
} from './graphql/precio-especial.gql';
import { PrecioEspecialSucursal, PrecioEspecialSucursalInput } from './precio-especial.model';

/**
 * Lecturas de promociones: el error de red y el del servidor llegan a la pantalla, que avisa una vez. Sin esto un
 * error del servidor llegaba como «sin promociones» y uno de red dejaba la lista anterior a la vista (#390).
 */
const LECTURA_PROMOCIONES: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_DIALOGO: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
const CONSULTA_LISTA: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };

/** Todo va al central (servidor = true): la filial solo lee la tabla por replicacion. */
@Injectable({ providedIn: 'root' })
export class PrecioEspecialService {
  constructor(
    private genericService: GenericCrudService,
    private porPrecioGQL: PreciosEspecialesPorPrecioGQL,
    private filterGQL: FilterPreciosEspecialesGQL,
    private saveGQL: SavePreciosEspecialesGQL,
    private editarGQL: EditarPrecioEspecialGQL,
    private cortarGQL: CortarPrecioEspecialGQL
  ) {}

  onPorPrecio(precioId: number): Observable<PrecioEspecialSucursal[]> {
    // Sin modal global: el diálogo muestra su propio estado
    return this.genericService.onCustomQuery(this.porPrecioGQL, { precioId: Number(precioId) }, true,
      LECTURA_PROMOCIONES, true, CONSULTA_DIALOGO);
  }

  onFiltrar(params: { sucursalId?: number; texto?: string; soloVigentes?: boolean; page: number; size: number }):
    Observable<PageInfo<PrecioEspecialSucursal>> {
    return this.genericService.onCustomQuery(this.filterGQL, params, true, LECTURA_PROMOCIONES, true, CONSULTA_LISTA);
  }

  onCrear(input: PrecioEspecialSucursalInput): Observable<PrecioEspecialSucursal[]> {
    return this.genericService.onSaveCustom(this.saveGQL, { input }, true, { avisarExito: true });
  }

  onEditar(id: number, precio: number, fechaDesde: string | null, fechaHasta: string | null): Observable<PrecioEspecialSucursal> {
    return this.genericService.onSaveCustom(this.editarGQL, { id: Number(id), precio, fechaDesde, fechaHasta }, true, { avisarExito: true });
  }

  onCortar(id: number): Observable<PrecioEspecialSucursal> {
    return this.genericService.onSaveCustom(this.cortarGQL, { id: Number(id) }, true, { avisarExito: true });
  }
}
