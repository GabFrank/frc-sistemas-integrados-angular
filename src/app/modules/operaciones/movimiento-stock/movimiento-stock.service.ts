import { Component, ComponentRef, Injectable, Type } from "@angular/core";
import { Observable } from "rxjs";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { EntradaDialogComponent } from "../entrada/entrada-dialog/entrada-dialog.component";
import { SalidaDialogComponent } from "../salida/salida-dialog/salida-dialog.component";
import { GetMovimientosPorFechaGQL } from "./graphql/getMovimientosPorFecha";
import { GetStockPorProductoGQL } from "./graphql/getStockPorProducto";
import { TipoMovimiento } from "./movimiento-stock.enums";
import { MovimientoStock } from "./movimiento-stock.model";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { GetMovimientoStockPorFiltrosGQL } from "./graphql/getMovimientoStockByFilters";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { PageInfo } from "../../../app.component";
import { GetStockPorFiltrosGQL } from "./graphql/getStockByFilters";
import { GetStockPorTipoMovimientoByFiltersGQL, StockPorTipoMovimientoDto } from "./graphql/getStockPorTipoMovimientoByFilters";
import { SaveMovimientoStockGQL } from "./graphql/saveMovimientoStock";
import { GetStockPrevioAjusteGQL } from "./graphql/getStockPrevioAjuste";
import { GetStockAntesDeFechaGQL } from "./graphql/getStockAntesDeFecha";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class MovimientoStockService {
  constructor(
    private getMovimientosPorFecha: GetMovimientosPorFechaGQL,
    private notificacionBar: NotificacionSnackbarService,
    private getStockPorProducto: GetStockPorProductoGQL,
    private getMovimientoStockPorFilters: GetMovimientoStockPorFiltrosGQL,
    private genericService: GenericCrudService,
    private getStockWithFilters: GetStockPorFiltrosGQL,
    private getStockPorTipoMovimiento: GetStockPorTipoMovimientoByFiltersGQL,
    private saveMovimientoStockGQL: SaveMovimientoStockGQL,
    private getStockPrevioAjusteGQL: GetStockPrevioAjusteGQL,
    private getStockAntesDeFechaGQL: GetStockAntesDeFechaGQL
  ) { }


  getTipoMovimientoComponent(tipo: TipoMovimiento): Type<any> {
    switch (tipo) {
      case TipoMovimiento.ENTRADA:
        return EntradaDialogComponent;
        break;
      case TipoMovimiento.SALIDA:
        return SalidaDialogComponent;
        break;

      default:
        break;
    }
  }

  onGetStockPorProducto(id, sucursalId?: number, servidor = true): Observable<number> {
    //use genericService        
    return this.genericService.onCustomQuery(this.getStockPorProducto, {
      id,
      sucId: sucursalId
    }, servidor);
  }

  onGetMovimientoStockPorFiltros(
    inicio: String,
    fin: String,
    sucursalList: number[],
    productoId: number,
    tipoMovimientoList: TipoMovimiento[],
    usuarioId: number,
    page: number,
    size: number,
    servidor = true,
    silentLoad = false
  ): Observable<PageInfo<MovimientoStock>> {
    return this.genericService.onCustomQuery(this.getMovimientoStockPorFilters, {
      inicio,
      fin,
      sucursalList,
      productoId,
      tipoMovimientoList,
      usuarioId,
      page,
      size,
    }, servidor, undefined, silentLoad);
  }

  onGetStockPorFiltros(
    inicio: String,
    fin: String,
    sucursalList: number[],
    productoId: number,
    tipoMovimientoList: TipoMovimiento[],
    usuarioId: number,
    servidor = true
  ): Observable<number> {
    return this.genericService.onCustomQuery(this.getStockWithFilters, {
      inicio,
      fin,
      sucursalList,
      productoId,
      tipoMovimientoList,
      usuarioId
    }, servidor);
  }

  onGetStockPorTipoMovimiento(
    inicio: String,
    fin: String,
    sucursalList: number[],
    productoId: number,
    tipoMovimientoList: TipoMovimiento[],
    usuarioId: number,
    servidor = true
  ): Observable<StockPorTipoMovimientoDto[]> {
    return this.genericService.onCustomQuery(this.getStockPorTipoMovimiento, {
      inicio,
      fin,
      sucursalList,
      productoId,
      tipoMovimientoList,
      usuarioId
    }, servidor);
  }

  // getStockByProductoAndSucursal(productoId: number, sucursalId: number): Observable<number> {
  //   //refactorizar usando genericService
  //   return this.genericService.onCustomQuery(this.getStockByProductoAndSucursalGQL, {
  //     productoId,
  //     sucursalId
  //   });
  // }

  onSaveMovimientoStock(movimientoStock: any, servidor = true): Observable<MovimientoStock> {
    return this.genericService.onCustomMutation(this.saveMovimientoStockGQL, {
      movimientoStock: movimientoStock
    }, servidor);
  }

  onGetStockPrevioAjuste(productoId: number, movimientoId: number, sucursalId: number, servidor = true): Observable<number> {
    return this.genericService.onCustomQuery(this.getStockPrevioAjusteGQL, {
      productoId,
      movimientoId,
      sucursalId
    }, servidor);
  }

  onGetStockAntesDeFecha(productoId: number, sucursalId: number, fecha: string, servidor = true): Observable<number> {
    return this.genericService.onCustomQuery(this.getStockAntesDeFechaGQL, {
      productoId,
      sucursalId,
      fecha
    }, servidor);
  }
}
