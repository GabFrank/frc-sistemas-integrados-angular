import { Component, ComponentRef, Injectable, Type } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
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
import {
  CantidadSugeridaPorSucursalRaw,
  GetCantidadSugeridaPorSucursalesGQL,
} from "./graphql/getCantidadSugeridaPorSucursales";

/**
 * Lo que el diálogo de ítem de compra necesita saber de una sucursal para sugerir una cantidad.
 * Ya normalizado: `sucursalId` afuera como clave del Map, y las fechas como `Date` o null.
 */
export interface CantidadSugeridaPorSucursal {
  totalVentas: number;
  cantidadCompras: number;
  primeraCompra: Date | null;
  ultimaCompra: Date | null;
}

/** Una fecha del central, o null si no vino o no es parseable. */
function aFecha(valor: string): Date | null {
  if (valor == null) return null;
  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
}

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
    private getStockAntesDeFechaGQL: GetStockAntesDeFechaGQL,
    private getCantidadSugeridaPorSucursalesGQL: GetCantidadSugeridaPorSucursalesGQL
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

  /**
   * Insumos de la cantidad sugerida de un producto en varias sucursales, en UN request.
   *
   * Antes esto eran dos llamadas encadenadas a `onGetMovimientoStockPorFiltros` por cada sucursal
   * —la de ventas recién salía cuando volvía la de compras—, cada una con `size: 1000`. El central
   * ahora agrupa: vuelven cuatro números por sucursal en vez de hasta 1000 filas por sucursal y
   * por tipo, y de paso desaparece el truncamiento silencioso que tenía esa paginación.
   *
   * Devuelve un `Map` indexado por `sucursalId`, igual que `ProductoService.onGetStockPorSucursales`.
   * Las sucursales sin movimientos en el rango no vienen en la respuesta: no hay filas que agrupar,
   * y el llamador las trata como cero.
   */
  onGetCantidadSugeridaPorSucursales(
    productoId: number,
    inicio: String,
    fin: String,
    sucursalList: number[],
    servidor = true,
    silentLoad = true
  ): Observable<Map<number, CantidadSugeridaPorSucursal>> {
    return this.genericService
      .onCustomQuery(
        this.getCantidadSugeridaPorSucursalesGQL,
        { productoId, inicio, fin, sucursalList },
        servidor,
        undefined,
        silentLoad
      )
      .pipe(
        map((filas: CantidadSugeridaPorSucursalRaw[]) => {
          const porSucursal = new Map<number, CantidadSugeridaPorSucursal>();
          (filas || []).forEach((fila) => {
            if (fila?.sucursalId == null) return;
            porSucursal.set(Number(fila.sucursalId), {
              totalVentas: fila.totalVentas ?? 0,
              cantidadCompras: fila.cantidadCompras ?? 0,
              primeraCompra: aFecha(fila.primeraCompra),
              ultimaCompra: aFecha(fila.ultimaCompra),
            });
          });
          return porSucursal;
        })
      );
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
