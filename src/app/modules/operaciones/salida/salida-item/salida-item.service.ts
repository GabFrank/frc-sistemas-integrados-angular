import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { SalidaItem, SalidaItemInput } from './salida-item.model';
import { DeleteSalidaItemGQL } from './graphql/deleteSalidaItem';
import { GetAllSalidaItemsGQL } from './graphql/getAllSalidasItem';
import { SaveSalidaItemGQL } from './graphql/saveSalidaItem';

import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class SalidaItemService {

  constructor(
    private genericService: GenericCrudService,
    private saveSalidaItem: SaveSalidaItemGQL,
    private deleteSalidaItem: DeleteSalidaItemGQL,
    private getAllSalidaItems: GetAllSalidaItemsGQL,
    private notificacionService: NotificacionSnackbarService
  ) { }

  onSaveSalidaItem(input: SalidaItemInput): Observable<SalidaItem> {
    return this.genericService.onSaveCustom<SalidaItem>(this.saveSalidaItem, { entity: input }, false);
  }

  /** `true` si se eliminó; `null` si no (rechazo o corte, los dos avisados). La pantalla ya confirmó. */
  onDeleteSalidaItem(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteSalidaItem, id, null, null, false, false);
  }

  onGetAllSalidaItems(){
    return new Observable(obs => {
      this.getAllSalidaItems.fetch({},{fetchPolicy: 'no-cache', errorPolicy: 'all'}).pipe(untilDestroyed(this))
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
