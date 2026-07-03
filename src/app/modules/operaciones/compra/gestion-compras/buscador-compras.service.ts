import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { Producto } from '../../../productos/producto/producto.model';
import { ProductoProveedor } from '../../../productos/producto-proveedor/producto-proveedor.model';
import { ProductoService } from '../../../productos/producto/producto.service';
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

const BUSQUEDA_DIALOG_PAGE_SIZE = 20;
const BUSQUEDA_CACHE_TTL_MS = 60_000;

@Injectable({
  providedIn: 'root',
})
export class BuscadorComprasService {
  private busquedaDialogCache = new Map<string, Observable<Producto[]>>();
  private busquedaResultadosCache = new Map<string, Producto[]>();

  constructor(
    private genericCrudService: GenericCrudService,
    private buscarProductoInteligenteGQL: BuscarProductoInteligenteGQL,
    private productoProveedorBusquedaInteligenteGQL: ProductoProveedorBusquedaInteligenteGQL,
    private searchProductoWithFiltersGQL: SearchProductoWithFiltersGQL,
    private productoService: ProductoService
  ) {}

  /**
   * Búsqueda de productos para el diálogo de compras.
   * Usa caché compartida (shareReplay) para que prefetch y diálogo reutilicen la misma petición.
   */
  buscarProductosParaDialog(
    texto: string,
    page = 0,
    size = BUSQUEDA_DIALOG_PAGE_SIZE,
    silentLoad = true
  ): Observable<Producto[]> {
    const termino = (texto ?? '').trim();
    if (!termino) {
      return of([]);
    }

    const cacheKey = `${termino}|${page}|${size}`;
    const cached = this.busquedaDialogCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.ejecutarBusquedaProductosDialog(
      termino,
      page,
      size,
      silentLoad
    ).pipe(
      tap((productos) => this.busquedaResultadosCache.set(cacheKey, productos)),
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(() => of([] as Producto[]))
    );

    this.busquedaDialogCache.set(cacheKey, request$);
    setTimeout(() => {
      this.busquedaDialogCache.delete(cacheKey);
      this.busquedaResultadosCache.delete(cacheKey);
    }, BUSQUEDA_CACHE_TTL_MS);

    return request$;
  }

  /** Resultados ya resueltos en memoria (p. ej. tras prefetch al escribir). */
  obtenerResultadosCacheados(
    texto: string,
    page = 0,
    size = BUSQUEDA_DIALOG_PAGE_SIZE
  ): Producto[] | null {
    const cacheKey = `${(texto ?? '').trim()}|${page}|${size}`;
    return this.busquedaResultadosCache.get(cacheKey) ?? null;
  }

  /** Precalienta la conexión GraphQL al entrar al tab de ítems. */
  warmupBusquedaProductos(): void {
    this.buscarProductosParaDialog('a', 0, 1, true)
      .pipe(take(1))
      .subscribe({ error: () => undefined });
  }

  private ejecutarBusquedaProductosDialog(
    termino: string,
    page: number,
    size: number,
    silentLoad: boolean
  ): Observable<Producto[]> {
    if (this.pareceCodigoBarras(termino)) {
      return this.buscarProducto(termino, page, size, undefined, silentLoad).pipe(
        map((res) =>
          (res.getContent ?? [])
            .map((r) => r.producto)
            .filter((p): p is Producto => p?.id != null)
        )
      );
    }

    return this.productoService.onSearch(
      termino,
      page * size,
      null,
      false,
      true,
      true,
      silentLoad
    );
  }

  private pareceCodigoBarras(termino: string): boolean {
    if (!termino || termino.includes(' ')) {
      return false;
    }
    if (/^\d{3,}$/.test(termino)) {
      return true;
    }
    if (/^[A-Za-z]+$/.test(termino)) {
      return false;
    }
    return /^[A-Za-z0-9\-._]{4,32}$/.test(termino);
  }

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

  /**
   * Devuelve el producto si hay una única coincidencia exacta por nombre o código.
   */
  encontrarCoincidenciaExacta(
    productos: Producto[],
    termino: string
  ): Producto | null {
    const terminoNormalizado = (termino ?? '').trim().toLowerCase();
    if (!terminoNormalizado || !productos?.length) {
      return null;
    }

    const coincidencias = productos.filter((producto) =>
      this.esCoincidenciaExactaProducto(producto, terminoNormalizado)
    );

    return coincidencias.length === 1 ? coincidencias[0] : null;
  }

  private esCoincidenciaExactaProducto(
    producto: Producto,
    terminoNormalizado: string
  ): boolean {
    const descripcion = (producto.descripcion ?? '').trim().toLowerCase();
    if (descripcion === terminoNormalizado) {
      return true;
    }

    const codigoPrincipal = (producto.codigoPrincipal ?? '').trim().toLowerCase();
    if (codigoPrincipal === terminoNormalizado) {
      return true;
    }

    return (producto.codigos ?? []).some(
      (codigo) => (codigo.codigo ?? '').trim().toLowerCase() === terminoNormalizado
    );
  }
}
