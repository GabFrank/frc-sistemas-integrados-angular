import { Component, ComponentRef, Injectable, Type } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { EntradaDialogComponent } from '../entrada/entrada-dialog/entrada-dialog.component';
import { GetMovimientosPorFechaGQL } from './graphql/getMovimientosPorFecha';
import { GetStockPorProductoGQL } from './graphql/getStockPorProducto';
import { TipoMovimiento } from './movimiento-stock.enums';
import { MovimientoStock } from './movimiento-stock.model';

@Injectable({
  providedIn: 'root'
})
export class MovimientoStockService {

  constructor(
    private getMovimientosPorFecha : GetMovimientosPorFechaGQL,
    private notificacionBar: NotificacionSnackbarService,
    private getStockPorProducto: GetStockPorProductoGQL
  ) { }

  onGetMovimientosPorFecha(inicio: Date, fin: Date): Observable<MovimientoStock[]>{
    let inicioString = inicio.getFullYear() + "-" + inicio.getMonth() + "-" + inicio.getDay() + " 00:00:00"
    let finString = fin.getFullYear() + "-" + fin.getMonth() + "-" + fin.getDay() + " 00:00:00"
    console.log('inicio', inicioString)
    console.log('fin', finString)
    return new Observable(obs => {
      this.getMovimientosPorFecha.fetch({
        inicio,
        fin
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).subscribe(res => {
        if(res.errors==null){
          obs.next(res.data)
        } else {
          console.log(res.errors[0].message)
          this.notificacionBar.notification$.next({
            texto: 'Ups!, algo salio mal: '+ res.errors[0].message,
            duracion: 3,
            color: NotificacionColor.danger
          })
        }
      })
    })
  }

  getTipoMovimientoComponent(tipo: TipoMovimiento): Type<any>{   
    switch (tipo) {
      case TipoMovimiento.ENTRADA:
        return EntradaDialogComponent;
        break;
    
      default:
        break;
    }
  }

  onGetStockPorProducto(id): Observable<number>{
    return new Observable(obs => {
      this.getStockPorProducto.fetch({id}, {fetchPolicy: 'no-cache', errorPolicy: 'all'}).subscribe(res => {
        if(res.errors == null){
          obs.next(res.data['data'])
        } else {
          this.notificacionBar.notification$.next({
            texto: 'Ups!, algo salio mal: '+ res.errors[0].message,
            duracion: 3,
            color: NotificacionColor.danger
          })
        }
      })
    })
  }
}
