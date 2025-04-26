import { Injectable } from '@angular/core';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CostoPorProducto } from './costo-por-producto.model';
import { Observable } from 'rxjs';
import { GetCostosPorProductoIdGQL } from './graphql/getCososPorProductoId';
import { PageInfo } from '../../../app.component';

@Injectable({
  providedIn: 'root'
})
export class CostoPorProductoService {

  constructor(
    private genericService: GenericCrudService,
    private costosPorProductoId: GetCostosPorProductoIdGQL
  ) { }

  getCostosPorProductoId(id: number, page: number, size: number): Observable<PageInfo<CostoPorProducto[]>> {
    return this.genericService.onGetById(this.costosPorProductoId, id, page, size);
  }
}
