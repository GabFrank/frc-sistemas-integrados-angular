import { Injectable } from '@angular/core';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CostoPorProducto } from './costo-por-producto.model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Moneda } from '../../financiero/moneda/moneda.model';
import { CONTEXTO_SONDEO, LECTURA_ESTRICTA } from '../../../generics/generic-crud.constantes';
import { CostoCosteoDeProductoGQL } from './graphql/costoCosteoDeProducto';
import { GetCostosPorProductoIdGQL } from './graphql/getCososPorProductoId';
import { SaveCostoPorProductoGQL } from './graphql/saveCostoPorProducto';
import { PageInfo } from '../../../app.component';

/** Costo de un producto en la moneda de costeo (módulo COSTOS). */
export interface CostoEnCosteo {
  moneda: Moneda;
  costoMedio: number | null;
  ultimoPrecioCompra: number | null;
}

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
    private saveCostoPorProductoGQL: SaveCostoPorProductoGQL,
    private costoCosteoGQL: CostoCosteoDeProductoGQL
  ) { }

  getCostosPorProductoId(id: number, page: number, size: number): Observable<PageInfo<CostoPorProducto[]>> {
    return this.genericService.onGetById(this.costosPorProductoId, id, page, size);
  }

  onSaveCostoPorProducto(input: CostoPorProductoInput): Observable<CostoPorProducto> {
    return this.genericService.onCustomMutation(this.saveCostoPorProductoGQL, { costoPorProducto: input });
  }

  /**
   * El costo del producto en su moneda de costeo. Si el central no tiene los campos, no responde o el
   * producto no tiene costo, emite null y quien llama sigue con el costo de la empresa.
   */
  getCostoEnCosteo(productoId: number): Observable<CostoEnCosteo | null> {
    return this.genericService
      .onCustomQuery(this.costoCosteoGQL, { id: productoId }, true, LECTURA_ESTRICTA, true, CONTEXTO_SONDEO)
      .pipe(
        map((producto: any) => {
          const costo = producto?.costo;
          if (!costo?.monedaCosteo) return null;
          return {
            moneda: costo.monedaCosteo,
            costoMedio: costo.costoMedioCosteo ?? null,
            ultimoPrecioCompra: costo.ultimoPrecioCompraCosteo ?? null,
          } as CostoEnCosteo;
        }),
        catchError(() => of(null)),
      );
  }
}
