import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { Producto } from '../../../productos/producto/producto.model';
import { ProductoProveedor } from '../../../productos/producto-proveedor/producto-proveedor.model';
import { SearchProductoWithFiltersGQL } from '../../../productos/producto/graphql/searchWithFilters';
import { ProductoForPdvGQL } from '../../../productos/producto/graphql/productoSearchForPdv';
import {
  buscarProductoInteligenteQuery,
  productoProveedorBusquedaInteligenteQuery,
} from './graphql/buscador-producto-inteligente.graphql-query';

export type TipoCoincidenciaBuscador =
  | 'CODIGO_EXACTO'
  | 'CODIGO_PREFIJO'
  | 'CODIGO_PARCIAL'
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
/**
 * Filas que devuelve `productoSearch` del central por llamada, a partir de
 * `offset`: `limit 10` en `ProductoRepository.findbyAll` y `from + 10` en
 * `ProductoService.buscarPorTextoLucene`. No viaja en el schema: si el central
 * lo cambia, hay que cambiarlo acá.
 */
const FILAS_POR_LLAMADA_PRODUCTO_SEARCH = 10;
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
    private productoSearchGQL: ProductoForPdvGQL
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
      // La página 0 la comparten el prefetch y los Enter, que esperan lista
      // vacía ante un error. En las siguientes el error tiene que llegar al
      // diálogo: una lista vacía se leería como «no hay más resultados».
      catchError((error) => {
        this.olvidarBusqueda(cacheKey, request$);
        return page === 0 ? of([] as Producto[]) : throwError(() => error);
      })
    );

    this.busquedaDialogCache.set(cacheKey, request$);
    setTimeout(() => this.olvidarBusqueda(cacheKey, request$), BUSQUEDA_CACHE_TTL_MS);

    return request$;
  }

  /**
   * Borra la entrada solo si sigue siendo la de esa petición: tras un error se
   * borra antes del TTL, y un reintento con la misma clave no debe perder su
   * caché cuando vence el timer de la petición que falló.
   */
  private olvidarBusqueda(cacheKey: string, request$: Observable<Producto[]>): void {
    if (this.busquedaDialogCache.get(cacheKey) !== request$) {
      return;
    }
    this.busquedaDialogCache.delete(cacheKey);
    this.busquedaResultadosCache.delete(cacheKey);
  }

  /**
   * Filas que trae una página llena de `buscarProductosParaDialog`. Si llega
   * una página con menos, no hay más resultados.
   */
  filasPorPaginaDialog(texto: string, size = BUSQUEDA_DIALOG_PAGE_SIZE): number {
    return this.pareceCodigoBarras((texto ?? '').trim())
      ? size
      : FILAS_POR_LLAMADA_PRODUCTO_SEARCH;
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

    // productoSearch pagina por offset y devuelve FILAS_POR_LLAMADA_PRODUCTO_SEARCH
    // filas por llamada, no `size`. Se llama directo y no por
    // ProductoService.onSearch para que un error de red se propague: sin
    // `propagate`, onCustomQuery no emite ni completa y el diálogo queda
    // esperando para siempre.
    return this.genericCrudService
      .onCustomQuery(
        this.productoSearchGQL,
        {
          texto: termino,
          offset: page * FILAS_POR_LLAMADA_PRODUCTO_SEARCH,
          sucursalId: null,
          conStock: false,
          isEnvase: false,
          activo: true,
        },
        true,
        { networkError: { propagate: true } },
        silentLoad
      )
      .pipe(
        // Con un error de GraphQL onCustomQuery ya avisó y emite null.
        switchMap((productos: Producto[] | null) =>
          productos == null
            ? throwError(() => new Error('productoSearch sin datos'))
            : of(productos)
        )
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

    // Siempre como texto, igual que la lista de productos: el backend une las
    // coincidencias parciales de código con la descripción. Mandarlo como
    // "codigo" dejaba afuera los números de la descripción ("... 50 GR 1014218").
    return this.genericCrudService
      .onCustomQuery(
        this.searchProductoWithFiltersGQL,
        {
          texto: termino,
          codigo: null,
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
            tipoCoincidencia: 'TEXTO',
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
