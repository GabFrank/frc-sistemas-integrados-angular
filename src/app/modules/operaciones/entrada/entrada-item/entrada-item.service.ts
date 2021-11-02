import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { EntradaItemInput } from './entrada-item.model';
import { DeleteEntradaItemGQL } from './graphql/deleteEntradaItem';
import { GetAllEntradaItemsGQL } from './graphql/getAllEntradasItem';
import { SaveEntradaItemGQL } from './graphql/saveEntradaItem';


@Injectable({
  providedIn: 'root'
})
export class EntradaItemService {

  constructor(
    private saveEntradaItem: SaveEntradaItemGQL,
    private deleteEntradaItem: DeleteEntradaItemGQL,
    private getAllEntradaItems: GetAllEntradaItemsGQL,
    private notificacionService: NotificacionSnackbarService
  ) { }

  onSaveEntradaItem(input: EntradaItemInput){
    return new Observable(obs => {
      this.saveEntradaItem.mutate({
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

  onDeleteEntradaItem(id: number){
    return new Observable(obs => {
      this.deleteEntradaItem.mutate({
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

  onGetAllEntradaItems(){
    return new Observable(obs => {
      this.getAllEntradaItems.fetch({},{fetchPolicy: 'no-cache', errorPolicy: 'all'})
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
