import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { EntradaItem, EntradaItemInput } from './entrada-item.model';
import { DeleteEntradaItemGQL } from './graphql/deleteEntradaItem';
import { GetAllEntradaItemsGQL } from './graphql/getAllEntradasItem';
import { SaveEntradaItemGQL } from './graphql/saveEntradaItem';

import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class EntradaItemService {

  constructor(
    private genericService: GenericCrudService,
    private saveEntradaItem: SaveEntradaItemGQL,
    private deleteEntradaItem: DeleteEntradaItemGQL,
    private getAllEntradaItems: GetAllEntradaItemsGQL,
    private notificacionService: NotificacionSnackbarService
  ) { }

  onSaveEntradaItem(input: EntradaItemInput): Observable<EntradaItem> {
    return this.genericService.onSaveCustom<EntradaItem>(this.saveEntradaItem, { entity: input }, false);
  }

  /** `true` si se eliminó; `null` si no (rechazo o corte, los dos avisados). La pantalla ya confirmó. */
  onDeleteEntradaItem(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteEntradaItem, id, null, null, false, false);
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
