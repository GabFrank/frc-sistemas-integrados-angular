import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import {
  CortarPrecioEspecialGQL, EditarPrecioEspecialGQL, FilterPreciosEspecialesGQL,
  PreciosEspecialesPorPrecioGQL, SavePreciosEspecialesGQL,
} from './graphql/precio-especial.gql';
import { PrecioEspecialSucursal, PrecioEspecialSucursalInput } from './precio-especial.model';

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
    return this.genericService.onCustomQuery(this.porPrecioGQL, { precioId: Number(precioId) }, true);
  }

  onFiltrar(params: { sucursalId?: number; texto?: string; soloVigentes?: boolean; page: number; size: number }):
    Observable<PageInfo<PrecioEspecialSucursal>> {
    return this.genericService.onCustomQuery(this.filterGQL, params, true, null, true);
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
