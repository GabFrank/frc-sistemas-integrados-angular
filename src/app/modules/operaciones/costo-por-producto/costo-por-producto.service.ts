import { Injectable } from '@angular/core';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CostoPorProducto } from './costo-por-producto.model';
import { Observable } from 'rxjs';
import { GetCostosPorProductoIdGQL } from './graphql/getCososPorProductoId';
import { SaveCostoPorProductoGQL } from './graphql/saveCostoPorProducto';
import { PageInfo } from '../../../app.component';

export interface CostoPorProductoInput {
  id?: number;
  productoId: number;
  sucursalId: number;
  costoMedio: number;
  ultimoPrecioCompra?: number;
  ultimoPrecioVenta?: number;
  monedaId?: number;
  cotizacion?: number;
  existencia?: number;
  usuarioId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CostoPorProductoService {

  constructor(
    private genericService: GenericCrudService,
    private costosPorProductoId: GetCostosPorProductoIdGQL,
    private saveCostoPorProductoGQL: SaveCostoPorProductoGQL
  ) { }

  getCostosPorProductoId(id: number, page: number, size: number): Observable<PageInfo<CostoPorProducto[]>> {
    return this.genericService.onGetById(this.costosPorProductoId, id, page, size);
  }

  onSaveCostoPorProducto(input: CostoPorProductoInput): Observable<CostoPorProducto> {
    return this.genericService.onCustomMutation(this.saveCostoPorProductoGQL, { costoPorProducto: input });
  }
}
