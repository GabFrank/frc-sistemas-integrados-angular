import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { SalidaInput } from './salida.model';
import { DeleteSalidaGQL } from './graphql/deleteSalida';
import { GetAllSalidasGQL } from './graphql/getAllSalidas';
import { saveSalida } from './graphql/graphql-query';
import { SaveSalidaGQL } from './graphql/saveSalida';

@Injectable({
  providedIn: 'root'
})
export class SalidaService {

  constructor(
    private saveSalida: SaveSalidaGQL,
    private deleteSalida: DeleteSalidaGQL,
    private getAllSalidas: GetAllSalidasGQL,
    private notificacionService: NotificacionSnackbarService
  ) { }

  onSaveSalida(input: SalidaInput){
    return new Observable(obs => {
      this.saveSalida.mutate({
        entity: input
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

  onDeleteSalida(id: number){
    return new Observable(obs => {
      this.deleteSalida.mutate({
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

  onGetAllSalidas(){
    return new Observable(obs => {
      this.getAllSalidas.fetch({},{fetchPolicy: 'no-cache', errorPolicy: 'all'})
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
}
