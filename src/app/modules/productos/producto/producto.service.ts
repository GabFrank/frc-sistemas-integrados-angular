import { Injectable } from "@angular/core";
import { PorSucursal } from "../../../commons/core/utils/por-sucursal";
import { SaveProductoGQL } from "./graphql/saveProducto";
import { ProductoInput } from "./producto-input.model";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Producto } from "./producto.model";
import { ProductoPorProveedorGQL } from "./graphql/productoPorProveedor";
import { ProductoPorIdGQL } from "./graphql/productoPorId";
import { MainService } from "../../../main.service";
import { SaveImagenProductoGQL } from "./graphql/saveImagenProducto";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { ProductoForPdvGQL } from "./graphql/productoSearchForPdv";
import { PrintProductoPorIdGQL } from "./graphql/printProducto";
import { AllProductosGQL } from "./graphql/allProductos";
import { ContextoConsulta, GenericCrudService, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from "../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../shared/services/timeout-link";
import { ProductoParaPedidoGQL } from "./graphql/productoParaPedido";
import { ExportarProductoGQL } from "./graphql/exportarReporte";
import { FindByPdvGrupoProductoIdGQL } from "./graphql/findByPdvGrupoProductoId";
import { EnvaseSearchGQL } from "./graphql/envaseSearch";

export class CustomResponse {
  errors: string[];
  data: CustomData;
}

export class CustomData {
  data: any;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ProductoPorCodigoGQL } from "./graphql/productoPorCodigo";
import { ReporteLucroPorProductoGQL } from "./graphql/reporteLucroPorProducto";
import { ReporteService } from "../../reportes/reporte.service";
import { TabService } from "../../../layouts/tab/tab.service";
import { ListProductoComponent } from "./list-producto/list-producto.component";
import { Tab } from "../../../layouts/tab/tab.model";
import { ReportesComponent } from "../../reportes/reportes/reportes.component";
import { ImprimirCodigoBarraGQL } from "./graphql/imprimirCodigoBarra";
import { Codigo } from "../codigo/codigo.model";
import { ProductoStockGQL } from "./graphql/productoStock";
import {
  StockPorSucursalesGQL,
  StockPorSucursalRaw,
} from "./graphql/stockPorSucursales";
import { ProductoDescripcionExistsGQL } from "./graphql/productoDescripcionExists";
import { PageInfo } from "../../../app.component";
import { SearchProductoWithFiltersGQL } from "./graphql/searchWithFilters";
import { ExportarProductoConFiltrosGQL } from "./graphql/exportarReporteConFiltros";
import { LucroPorProductoListGQL } from "./graphql/lucroPorProductoList";

/** Un reporte puede tardar: se mantiene el corte largo de las consultas (no el de 60 s). */
export const TIMEOUT_REPORTE_MS = 300000;

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class ProductoService {
  productosSub = new BehaviorSubject<Producto[]>(null);
  buscandoProductos = false;
  productosList: Producto[];
  lastSearchText = "";

  constructor(
    public mainService: MainService,
    private productoPorProveedor: ProductoPorProveedorGQL,
    private saveProducto: SaveProductoGQL,
    private productoPorId: ProductoPorIdGQL,
    private saveImage: SaveImagenProductoGQL,
    private productoSearch: ProductoForPdvGQL,
    private envaseSearch: EnvaseSearchGQL,
    private notificacionSnack: NotificacionSnackbarService,
    private printProductoPorId: PrintProductoPorIdGQL,
    private searchForPdv: ProductoForPdvGQL,
    private getAllProductos: AllProductosGQL,
    private genericService: GenericCrudService,
    private getProductoParaPedido: ProductoParaPedidoGQL,
    private exportarReporte: ExportarProductoGQL,
    private exportarReporteConFiltros: ExportarProductoConFiltrosGQL,
    private findByPdvGrupoProductoId: FindByPdvGrupoProductoIdGQL,
    private productoPorCodigo: ProductoPorCodigoGQL,
    private reporteLucroPorProducto: ReporteLucroPorProductoGQL,
    private reporteService: ReporteService,
    private tabService: TabService,
    private imprimirCodigo: ImprimirCodigoBarraGQL,
    private productoPorSucursalStock: ProductoStockGQL,
    private stockPorSucursalesGql: StockPorSucursalesGQL,
    private searchWithFilters: SearchProductoWithFiltersGQL,
    private productoDescripcionExistsGql: ProductoDescripcionExistsGQL,
    private lucroPorProductoList: LucroPorProductoListGQL
  ) {
    this.productosList = [];
    // getAllProductos.fetch({},{fetchPolicy: 'no-cache', errorPolicy: 'all'}).subscribe(res => {
    //   if(res.errors==null){
    //     console.log('Lista de productos cargada')
    //     this.productosList = res.data.data
    //     console.log(this.productosList)
    //   }
    // })
  }

  onSearchWithFilters(
    texto: string, 
    codigo: string, 
    activo, 
    stock, 
    balanza, 
    familia, 
    subfamilia, 
    vencimiento, 
    costoCero, 
    stockFiltro, 
    sucursalId, 
    page, 
    size, 
    servidor = true,
    silentLoad = false
  ): Observable<PageInfo<Producto>>{
    return this.genericService.onCustomQuery(this.searchWithFilters, {
      texto, 
      codigo, 
      activo, 
      stock, 
      balanza, 
      familia, 
      subfamilia, 
      vencimiento, 
      costoCero, 
      stockFiltro, 
      sucursalId, 
      page, 
      size
    }, 
    servidor,
    // El error de red y el del servidor llegan a la lista (60 s), que avisa una vez (#390)
    { networkError: { propagate: true, show: false }, graphError: { propagate: true, show: false } },
    silentLoad,
    { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true });
  }

  onGetStockPorProductoAndSucursal(proId, sucId, silentLoad = false, servidor = true, errorConf?: QueryError,
                                   contexto?: ContextoConsulta){
    return this.genericService.onCustomQuery(this.productoPorSucursalStock, {proId, sucId}, servidor, errorConf, silentLoad,
      contexto);
  }

  /**
   * Existencia del producto en todas las sucursales, en un solo request.
   *
   * Preferir esta sobre llamar `onGetStockPorProductoAndSucursal` una vez por
   * sucursal: el central resuelve el desglose con un GROUP BY, y el navegador
   * abre 6 conexiones por origen, asi que N llamadas salen en tandas y ocupan
   * todo el pool mientras duran.
   *
   * Devuelve un `PorSucursal` por id de sucursal. Las sucursales sin movimientos no
   * vienen en la respuesta —no hay filas que sumar— y por eso quedan afuera: el
   * llamador las muestra en cero. Eso permite distinguir "no hay stock aca" de
   * "todavia no pregunte", que es lo que un cero por defecto pierde.
   *
   * El id de sucursal es `ID` en el schema y llega como string, tanto en esta
   * respuesta como en el `Sucursal.id` de cualquier otra query: `PorSucursal`
   * lo normaliza al guardar y al buscar, asi que se busca con el id tal como vino.
   */
  onGetStockPorSucursales(
    proId: number,
    silentLoad = true,
    servidor = true,
    errorConf?: QueryError,
    contexto?: ContextoConsulta
  ): Observable<PorSucursal<number>> {
    return this.genericService
      .onCustomQuery(this.stockPorSucursalesGql, { proId }, servidor, errorConf, silentLoad, contexto)
      .pipe(
        map((filas: StockPorSucursalRaw[]) => {
          // El central nunca devuelve null acá ([] si no hay movimientos): para quien pidió el error, un null
          // sin error es un fallo, no «sin stock en ninguna sucursal»
          if (filas == null && errorConf?.graphError?.propagate === true) {
            throw new Error('stockPorSucursales sin datos');
          }
          const porSucursal = new PorSucursal<number>();
          (filas || []).forEach((fila) => {
            if (fila?.sucursalId == null) return;
            porSucursal.set(fila.sucursalId, fila.cantidad ?? 0);
          });
          return porSucursal;
        })
      );
  }

  /**
   * El error de red y el del servidor llegan al llamador (20 s): un control de duplicado que no respondió no es
   * «no existe» (#390).
   */
  onProductoDescripcionExists(descripcion: string, servidor = true): Observable<boolean> {
    return this.genericService.onCustomQuery(this.productoDescripcionExistsGql, { descripcion }, servidor,
      { networkError: { propagate: true, show: false }, graphError: { propagate: true, show: false } }, undefined,
      { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true });
  }

  /** `errorConf` y `contexto` son para el POS; el resto de las pantallas no los pasa y queda como antes. */
  onGetProductoPorCodigo(texto, servidor: boolean = true, silentLoad: boolean = false,
                         errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Producto> {
    return this.genericService.onCustomQuery(this.productoPorCodigo, { texto }, servidor, errorConf, silentLoad, contexto);
  }

  onSearch(texto, offset?, sucursalId?, conStock?, activo?, servidor = true, silentLoad: boolean = false,
           errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Producto[]> {
    return this.genericService.onCustomQuery(this.productoSearch, {texto, offset, sucursalId, conStock, isEnvase: false, activo}, servidor, errorConf, silentLoad, contexto);
  }

  onEnvaseSearch(texto, offset?, isEnvase?: boolean, servidor = true): Observable<Producto[]> {
    // El error de red y el del servidor llegan al buscador (20 s), que avisa: sin esto quedaba «buscando» (#390)
    return this.genericService.onCustomQuery(this.envaseSearch, {texto, offset, isEnvase}, servidor,
      { networkError: { propagate: true, show: false }, graphError: { propagate: true, show: false } }, undefined,
      { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true });
  }

  onSearchLocal(texto: string) {
    return Promise.all(
      this.productosList.filter((p) => {
        let regex = new RegExp(".*" + texto.replace(" ", ".*"));
        if (
          regex.test(p.descripcion) ||
          p.descripcion.replace(" ", "").includes(texto.replace(" ", ""))
        ) {
          return p;
        }
      })
    );
  }

  onSearchParaPdv() {}

  onGetProductoPorId(id, servidor = true, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Producto> {
    return this.genericService.onGetById(this.productoPorId, id, null, null, servidor, null, null, null, null, null,
      null, errorConf, contexto);
  }

  onSaveProducto(input: ProductoInput, servidor = true): Observable<any> {
    return this.genericService.onCustomMutation(this.saveProducto, {entity: input}, servidor);
  }

  /** Con `errorConf` el error llega al llamador; sin él, la consulta no emite nada si falla (#390). */
  getProducto(id, servidor = true, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Producto> {
    return this.genericService.onGetById(this.productoPorId, id, null, null, servidor, null, null, null, null, null,
      null, errorConf, contexto);
  }

  onImageSave(image: string, filename: string, servidor = true): Observable<any> {
    return this.genericService.onCustomMutation(this.saveImage, {image, filename}, servidor);
  }

  onPrintProductoPorId(id, servidor = true) {
    return this.genericService.onCustomQuery(this.printProductoPorId, {id}, servidor);
  }

  onGetProductoParaPedido(id, servidor = true, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Producto> {
    return this.genericService.onGetById(this.getProductoParaPedido, id, null, null, servidor, null, null, null, null, null,
      null, errorConf, contexto);
  }

  onExportarReporte(texto: string, servidor = true): Observable<string> {
    return this.genericService.onCustomQuery(this.exportarReporte, {texto}, servidor);
  }

  /**
   * Propaga el error de red: sin eso quien llama no se entera y su modal «Generando reporte…» queda abierto (#390).
   * Sin modal ni avisos propios (los pone quien llama); con error del servidor emite `null`.
   */
  onExportarReporteConFiltros(parametros: any, servidor = true): Observable<string> {
    return this.genericService.onCustomQuery(this.exportarReporteConFiltros, parametros, servidor,
      { networkError: { propagate: true, show: false }, graphError: { show: false } }, true,
      { timeoutMs: TIMEOUT_REPORTE_MS, silenciarAvisoTimeout: true });
  }

  onFindByPdvGrupoProductoId(id, servidor = true): Observable<Producto[]> {
    return this.genericService.onGetById(this.findByPdvGrupoProductoId, id, null, null, servidor);
  }

  onImprimirReporteLucroPorProducto(
    fechaInicio,
    fechaFin,
    sucursalIdList?,
    usuarioIdList?,
    productoIdList?,
    subfamiliaId?: number,
    servidor = true,
    familiaId?: number
  ) {
    this.genericService
      .onCustomQuery(
        this.reporteLucroPorProducto,
        {
          fechaInicio,
          fechaFin,
          sucursalIdList,
          usuarioId: this.mainService.usuarioActual.id,
          usuarioIdList,
          productoIdList,
          subfamiliaId,
          familiaId
        },
        servidor
      )
      .subscribe((res) => {
        if (res != null) {
          this.reporteService.onAdd("Lucro por producto " + Date.now(), res);
          this.tabService.addTab(
            new Tab(ReportesComponent, "Reportes", null, ListProductoComponent)
          );
        }
      });
  }

  onImprimirCodigo(codigo: Codigo, servidor = true) {
    return this.genericService.onCustomQuery(this.imprimirCodigo, {codigoId: codigo?.id}, servidor);
  }

  onGetLucroPorProducto(
    fechaInicio: string,
    fechaFin: string,
    sucursalIdList: number[],
    usuarioIdList: number[],
    productoIdList: number[],
    subfamiliaId?: number,
    page?: number,
    size?: number,
    familiaId?: number,
    servidor = true
  ): Observable<any> {
    return this.genericService.onCustomQuery(this.lucroPorProductoList, {
      fechaInicio,
      fechaFin,
      sucursalIdList,
      usuarioIdList,
      productoIdList,
      subfamiliaId,
      page,
      size,
      familiaId
    }, servidor);
  }
}
