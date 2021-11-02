import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { Entrada, EntradaInput } from './entrada.model';
import { DeleteEntradaGQL } from './graphql/deleteEntrada';
import { GetAllEntradasGQL } from './graphql/getAllEntradas';
import { GetEntradaPorFechaGQL } from './graphql/getEntradasPorFecha';
import { saveEntrada } from './graphql/graphql-query';
import { SaveEntradaGQL } from './graphql/saveEntrada';

@Injectable({
  providedIn: 'root'
})
export class EntradaService {

  constructor(
    private saveEntrada: SaveEntradaGQL,
    private deleteEntrada: DeleteEntradaGQL,
    private getAllEntradas: GetAllEntradasGQL,
    private getEntradasPorFecha: GetEntradaPorFechaGQL,
    private notificacionService: NotificacionSnackbarService
  ) { }

  onSaveEntrada(input: EntradaInput){
    return new Observable(obs => {
      this.saveEntrada.mutate({
        entity: input
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).subscribe(res => {
        if(res.errors==null){
          this.notificacionService.notification$.next({
            texto: 'Guardado con éxito',
            color: NotificacionColor.success,
            duracion: 3
          })
          obs.next(res.data)
        } else {
          this.notificacionService.notification$.next({
            texto: `Ups, ocurrio algun error: ${res.errors[0]}`,
            color: NotificacionColor.danger,
            duracion: 3
          })
        }
      })
    })
  }

  onDeleteEntrada(id: number){
    return new Observable(obs => {
      this.deleteEntrada.mutate({
        id
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).subscribe(res => {
        if(res.errors==null){
          obs.next(res.data)
        } else {
          this.notificacionService.notification$.next({
            texto: `Ups, ocurrio algun error: ${res.errors[0]}`,
            color: NotificacionColor.danger,
            duracion: 3
          })
        }
      })
    })
  }

  onGetAllEntradas(){
    return new Observable(obs => {
      this.getAllEntradas.fetch({},{fetchPolicy: 'no-cache', errorPolicy: 'all'})
      .subscribe(res => {
        if(res.errors==null){
          obs.next(res.data)
        } else {
          this.notificacionService.notification$.next({
            texto: `Ups, ocurrio algun error: ${res.errors[0]}`,
            color: NotificacionColor.danger,
            duracion: 3
          })
        }
      })
    })
  }

  onGetEntradasPorFecha(inicio: Date, fin: Date): Observable<Entrada[]>{
    return new Observable(obs => {
      this.getEntradasPorFecha.fetch({
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
          this.notificacionService.notification$.next({
            texto: 'Ups!, algo salio mal: '+ res.errors[0].message,
            duracion: 3,
            color: NotificacionColor.danger
          })
        }
      })
    })
  }
}
