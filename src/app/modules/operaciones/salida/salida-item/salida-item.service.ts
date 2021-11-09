import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { SalidaItem, SalidaItemInput } from './salida-item.model';
import { DeleteSalidaItemGQL } from './graphql/deleteSalidaItem';
import { GetAllSalidaItemsGQL } from './graphql/getAllSalidasItem';
import { SaveSalidaItemGQL } from './graphql/saveSalidaItem';


@Injectable({
  providedIn: 'root'
})
export class SalidaItemService {

  constructor(
    private saveSalidaItem: SaveSalidaItemGQL,
    private deleteSalidaItem: DeleteSalidaItemGQL,
    private getAllSalidaItems: GetAllSalidaItemsGQL,
    private notificacionService: NotificacionSnackbarService
  ) { }

  onSaveSalidaItem(input: SalidaItemInput): Observable<SalidaItem>{
    return new Observable(obs => {
      this.saveSalidaItem.mutate({
        entity: input
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).subscribe(res => {
        if(res.errors==null){
          obs.next(res.data['data'])
          this.notificacionService.notification$.next({
            texto: `Guardado con éxito!!`,
            color: NotificacionColor.success,
            duracion: 2
          })
        } else {
          this.notificacionService.notification$.next({
            texto: `Ups, ocurrio algun error: ${res.errors[0].message}`,
            color: NotificacionColor.danger,
            duracion: 3
          })
        }
      })
    })
  }

  onDeleteSalidaItem(id: number){
    return new Observable(obs => {
      this.deleteSalidaItem.mutate({
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

  onGetAllSalidaItems(){
    return new Observable(obs => {
      this.getAllSalidaItems.fetch({},{fetchPolicy: 'no-cache', errorPolicy: 'all'})
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
