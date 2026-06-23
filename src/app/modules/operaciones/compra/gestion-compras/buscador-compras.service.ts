import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { Producto } from '../../../productos/producto/producto.model';
import { ProductoProveedor } from '../../../productos/producto-proveedor/producto-proveedor.model';
import { SearchProductoWithFiltersGQL } from '../../../productos/producto/graphql/searchWithFilters';
import {
  buscarProductoInteligenteQuery,
  productoProveedorBusquedaInteligenteQuery,
} from './graphql/buscador-producto-inteligente.graphql-query';

export type TipoCoincidenciaBuscador =
  | 'CODIGO_EXACTO'
  | 'CODIGO_PREFIJO'
  | 'TEXTO'
  | 'ID';

export interface BuscadorProductoResultado {
  producto: Producto;
  codigoCoincidente?: string;
  tipoCoincidencia: TipoCoincidenciaBuscador;
}

export interface BuscarProductoInteligenteResponse {
  data: PageInfo<BuscadorProductoResultado>;
}

export interface ProductoProveedorBusquedaInteligenteResponse {
  data: PageInfo<ProductoProveedor>;
}

@Injectable({
  providedIn: 'root',
})
export class BuscarProductoInteligenteGQL extends Query<BuscarProductoInteligenteResponse> {
  document = buscarProductoInteligenteQuery;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoProveedorBusquedaInteligenteGQL extends Query<ProductoProveedorBusquedaInteligenteResponse> {
  document = productoProveedorBusquedaInteligenteQuery;
}

@Injectable({
  providedIn: 'root',
})
export class BuscadorComprasService {
  constructor(
    private genericCrudService: GenericCrudService,
    private buscarProductoInteligenteGQL: BuscarProductoInteligenteGQL,
    private productoProveedorBusquedaInteligenteGQL: ProductoProveedorBusquedaInteligenteGQL,
    private searchProductoWithFiltersGQL: SearchProductoWithFiltersGQL
  ) {}

  buscarProducto(
    texto: string,
    page = 0,
    size = 10,
    proveedorId?: number,
    silentLoad = true
  ): Observable<PageInfo<BuscadorProductoResultado>> {
    return this.genericCrudService
      .onCustomQuery(
        this.buscarProductoInteligenteGQL,
        { texto, proveedorId, activo: true, page, size },
        true,
        undefined,
        silentLoad
      )
      .pipe(
        switchMap((pageInfo: PageInfo<BuscadorProductoResultado>) => {
          if (pageInfo?.getContent?.length > 0) {
            return of(pageInfo);
          }
          if (proveedorId != null) {
            return of(pageInfo);
          }
          return this.buscarProductoConFiltros(texto, page, size, silentLoad);
        }),
        catchError(() =>
          proveedorId != null
            ? of(new PageInfo<BuscadorProductoResultado>())
            : this.buscarProductoConFiltros(texto, page, size, silentLoad)
        )
      );
  }

  private buscarProductoConFiltros(
    texto: string,
    page: number,
    size: number,
    silentLoad: boolean
  ): Observable<PageInfo<BuscadorProductoResultado>> {
    const termino = texto.trim();
    const esCodigo = /^\d{3,}$/.test(termino);

    return this.genericCrudService
      .onCustomQuery(
        this.searchProductoWithFiltersGQL,
        {
          texto: esCodigo ? null : termino,
          codigo: esCodigo ? termino : null,
          activo: true,
          stock: null,
          balanza: null,
          familia: null,
          subfamilia: null,
          vencimiento: null,
          costoCero: null,
          stockFiltro: null,
          sucursalId: null,
          page,
          size,
        },
        true,
        undefined,
        silentLoad
      )
      .pipe(
        map((pageInfo: PageInfo<Producto>) => {
          const resultado = new PageInfo<BuscadorProductoResultado>();
          resultado.getTotalPages = pageInfo.getTotalPages;
          resultado.getTotalElements = pageInfo.getTotalElements;
          resultado.getNumberOfElements = pageInfo.getNumberOfElements;
          resultado.isFirst = pageInfo.isFirst;
          resultado.isLast = pageInfo.isLast;
          resultado.hasNext = pageInfo.hasNext;
          resultado.hasPrevious = pageInfo.hasPrevious;
          resultado.getContent = (pageInfo.getContent ?? []).map((producto) => ({
            producto,
            codigoCoincidente: producto.codigoPrincipal,
            tipoCoincidencia: esCodigo ? 'CODIGO_PREFIJO' : 'TEXTO',
          }));
          return resultado;
        })
      );
  }

  buscarProductoProveedor(
    proveedorId: number,
    texto: string,
    page = 0,
    size = 10,
    pedidoId?: number,
    silentLoad = true
  ): Observable<PageInfo<ProductoProveedor>> {
    return this.genericCrudService.onCustomQuery(
      this.productoProveedorBusquedaInteligenteGQL,
      { id: proveedorId, texto, page, size, pedidoId },
      true,
      undefined,
      silentLoad
    );
  }
}
