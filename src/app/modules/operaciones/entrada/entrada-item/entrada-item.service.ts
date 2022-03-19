import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { EntradaItem, EntradaItemInput } from './entrada-item.model';
import { DeleteEntradaItemGQL } from './graphql/deleteEntradaItem';
import { GetAllEntradaItemsGQL } from './graphql/getAllEntradasItem';
import { SaveEntradaItemGQL } from './graphql/saveEntradaItem';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
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

  onSaveEntradaItem(input: EntradaItemInput): Observable<EntradaItem>{
    return new Observable(obs => {
      this.saveEntradaItem.mutate({
        entity: input
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).pipe(untilDestroyed(this)).subscribe(res => {
        if(res.errors==null){
          obs.next(res.data)
          this.notificacionService.notification$.next({
            texto: `Guardado con éxito`,
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

  onDeleteEntradaItem(id: number){
    return new Observable(obs => {
      this.deleteEntradaItem.mutate({
        id
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).pipe(untilDestroyed(this)).subscribe(res => {
        if(res.errors==null){
          obs.next(true)
          this.notificacionService.notification$.next({
            texto: `Eliminado con éxito`,
            color: NotificacionColor.success,
            duracion: 2
          })
        } else {
          obs.next(false)
          this.notificacionService.notification$.next({
            texto: `Ups, ocurrio algun error: ${res.errors[0].message}`,
            color: NotificacionColor.danger,
            duracion: 3
          })
        }
      })
    })
  }

  onGetAllEntradaItems(){
    return new Observable(obs => {
      this.getAllEntradaItems.fetch({},{fetchPolicy: 'no-cache', errorPolicy: 'all'}).pipe(untilDestroyed(this))
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
