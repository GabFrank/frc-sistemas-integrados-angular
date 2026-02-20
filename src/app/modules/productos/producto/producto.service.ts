import { Injectable } from "@angular/core";
import { SaveProductoGQL } from "./graphql/saveProducto";
import { ProductoInput } from "./producto-input.model";
import { BehaviorSubject, Observable } from "rxjs";
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
import { GenericCrudService } from "../../../generics/generic-crud.service";
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
import { ProductoDescripcionExistsGQL } from "./graphql/productoDescripcionExists";
import { PageInfo } from "../../../app.component";
import { SearchProductoWithFiltersGQL } from "./graphql/searchWithFilters";
import { ExportarProductoConFiltrosGQL } from "./graphql/exportarReporteConFiltros";
import { LucroPorProductoListGQL } from "./graphql/lucroPorProductoList";

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
    subfamilia, 
    vencimiento, 
    costoCero, 
    stockFiltro, 
    sucursalId, 
    page, 
    size, 
    servidor = true
  ): Observable<PageInfo<Producto>>{
    return this.genericService.onCustomQuery(this.searchWithFilters, {
      texto, 
      codigo, 
      activo, 
      stock, 
      balanza, 
      subfamilia, 
      vencimiento, 
      costoCero, 
      stockFiltro, 
      sucursalId, 
      page, 
      size
    }, 
    servidor);
  }

  onGetStockPorProductoAndSucursal(proId, sucId, servidor = true){
    return this.genericService.onCustomQuery(this.productoPorSucursalStock, {proId, sucId}, servidor);
  }

  onProductoDescripcionExists(descripcion: string, servidor = true) {
    return this.genericService.onCustomQuery(this.productoDescripcionExistsGql, { descripcion }, servidor);
  }

  onGetProductoPorCodigo(texto, servidor: boolean = true): Observable<Producto> {
    return this.genericService.onCustomQuery(this.productoPorCodigo, { texto }, servidor);
  }

  onSearch(texto, offset?, sucursalId?, conStock?, activo?, servidor = true): Observable<Producto[]> {
    return this.genericService.onCustomQuery(this.productoSearch, {texto, offset, sucursalId, conStock, isEnvase: false, activo}, servidor);
  }

  onEnvaseSearch(texto, offset?, isEnvase?: boolean, servidor = true): Observable<Producto[]> {
    return this.genericService.onCustomQuery(this.envaseSearch, {texto, offset, isEnvase}, servidor);
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

  onGetProductoPorId(id, servidor = true): Observable<Producto> {
    return this.genericService.onGetById(this.productoPorId, id, null, null, servidor);
  }

  onSaveProducto(input: ProductoInput, servidor = true): Observable<any> {
    return this.genericService.onCustomMutation(this.saveProducto, {entity: input}, servidor);
  }

  getProducto(id, servidor = true): Observable<Producto> {
    return this.genericService.onGetById(this.productoPorId, id, null, null, servidor);
  }

  onImageSave(image: string, filename: string, servidor = true): Observable<any> {
    return this.genericService.onCustomMutation(this.saveImage, {image, filename}, servidor);
  }

  onPrintProductoPorId(id, servidor = true) {
    return this.genericService.onCustomQuery(this.printProductoPorId, {id}, servidor);
  }

  onGetProductoParaPedido(id, servidor = true): Observable<Producto> {
    return this.genericService.onGetById(this.getProductoParaPedido, id, null, null, servidor);
  }

  onExportarReporte(texto: string, servidor = true): Observable<string> {
    return this.genericService.onCustomQuery(this.exportarReporte, {texto}, servidor);
  }

  onExportarReporteConFiltros(parametros: any, servidor = true): Observable<string> {
    return this.genericService.onCustomQuery(this.exportarReporteConFiltros, parametros, servidor);
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
    servidor = true
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
          subfamiliaId
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
      size
    }, servidor);
  }
}
