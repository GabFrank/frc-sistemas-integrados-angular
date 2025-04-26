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
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs';

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
    private apollo: Apollo
  ) {}

  onGetMovimientosPorFecha(
    inicio: Date,
    fin: Date
  ): Observable<MovimientoStock[]> {
    // let inicioString = inicio.getFullYear() + "-" + inicio.getMonth() + "-" + inicio.getDay() + " 00:00:00"
    // let finString = fin.getFullYear() + "-" + fin.getMonth() + "-" + fin.getDay() + " 00:00:00"
    // console.log('inicio', inicioString)
    // console.log('fin', finString)
    return new Observable((obs) => {
      this.getMovimientosPorFecha
        .fetch(
          {
            inicio,
            fin,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data);
          } else {
            console.log(res.errors[0].message);
            this.notificacionBar.notification$.next({
              texto: "Ups!, algo salio mal: " + res.errors[0].message,
              duracion: 3,
              color: NotificacionColor.danger,
            });
          }
        });
    });
  }

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

  onGetStockPorProducto(id): Observable<number> {
    return new Observable((obs) => {
      this.getStockPorProducto
        .fetch({ id }, { fetchPolicy: "no-cache", errorPolicy: "all" })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups!, algo salio mal: " + res.errors[0].message,
              duracion: 3,
              color: NotificacionColor.danger,
            });
          }
        });
    });
  }

  onGetMovimientoStockPorFiltros(
    inicio: String,
    fin: String,
    sucursalList: number[],
    productoId: number,
    tipoMovimientoList: TipoMovimiento[],
    usuarioId: number,
    page: number,
    size: number
  ): Observable<PageInfo<MovimientoStock>>{
    return this.genericService.onCustomQuery(this.getMovimientoStockPorFilters, {
      inicio,
      fin,
      sucursalList,
      productoId,
      tipoMovimientoList,
      usuarioId,
      page,
      size,
    });
  }

  onGetStockPorFiltros(
    inicio: String,
    fin: String,
    sucursalList: number[],
    productoId: number,
    tipoMovimientoList: TipoMovimiento[],
    usuarioId: number
  ): Observable<number>{
    return this.genericService.onCustomQuery(this.getStockWithFilters, {
      inicio,
      fin,
      sucursalList,
      productoId,
      tipoMovimientoList,
      usuarioId})
  }

  onGetStockPorTipoMovimiento(
    inicio: String,
    fin: String,
    sucursalList: number[],
    productoId: number,
    tipoMovimientoList: TipoMovimiento[],
    usuarioId: number
  ): Observable<StockPorTipoMovimientoDto[]>{
    return this.genericService.onCustomQuery(this.getStockPorTipoMovimiento, {
      inicio,
      fin,
      sucursalList,
      productoId,
      tipoMovimientoList,
      usuarioId})
  }

  getStockByProductoAndSucursal(productoId: number, sucursalId: number): Observable<number> {
    const GET_STOCK_BY_PRODUCTO_AND_SUCURSAL = gql`
      query GetStockByProductoAndSucursal($productoId: Int!, $sucursalId: Int!) {
        getStockByProductoAndSucursal(productoId: $productoId, sucursalId: $sucursalId)
      }
    `;

    return this.apollo.query<{ getStockByProductoAndSucursal: number }>({
      query: GET_STOCK_BY_PRODUCTO_AND_SUCURSAL,
      variables: {
        productoId,
        sucursalId
      },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.getStockByProductoAndSucursal)
    );
  }
}
