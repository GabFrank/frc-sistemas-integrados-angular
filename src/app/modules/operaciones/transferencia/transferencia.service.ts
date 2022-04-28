import { GetTransferenciaPorFechaGQL } from './graphql/getTransferenciaPorFecha';
import { NotificacionSnackbarService, NotificacionColor } from './../../../notificacion-snackbar.service';
import { DialogosService } from './../../../shared/components/dialogos/dialogos.service';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { FinalizarTransferenciaGQL } from './graphql/finalizarTransferencia';
import { DeleteTransferenciaItemGQL } from './graphql/deleteTransferenciaItem';
import { SaveTransferenciaItemGQL } from './graphql/saveTransferenciaItem';
import { SaveTransferenciaGQL } from './graphql/saveTransferencia';
import { Observable } from 'rxjs';
import { GetTransferenciaGQL } from './graphql/getTransferencia';
import { GenericCrudService } from './../../../generics/generic-crud.service';
import { Injectable } from '@angular/core';
import { Transferencia, TransferenciaEstado, TransferenciaItem } from './transferencia.model';
import { DeleteTransferenciaGQL } from './graphql/deleteTransferencia';

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class TransferenciaService {

  constructor(private genericCrudService: GenericCrudService,
    private getTransferencia: GetTransferenciaGQL,
    private saveTransferencia: SaveTransferenciaGQL,
    private deleteTransfencia: DeleteTransferenciaGQL,
    private saveTransferenciaItem: SaveTransferenciaItemGQL,
    private deleteTransferenciaItem: DeleteTransferenciaItemGQL,
    private finalizarTransferencia: FinalizarTransferenciaGQL,
    private dialogoService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private getTransferenciasPorFecha: GetTransferenciaPorFechaGQL
  ) { }

  onGetTrasferenciasPorFecha(inicio, fin){
    return this.genericCrudService.onGetByFecha(this.getTransferenciasPorFecha, inicio, fin);
  }

  onGetTransferencia(id): Observable<Transferencia> {
    return this.genericCrudService.onGetById(this.getTransferencia, id);
  }

  onSaveTransferencia(input): Observable<Transferencia> {
    return this.genericCrudService.onSave(this.saveTransferencia, input);
  }

  onDeleteTransferencia(id): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteTransfencia, id, 'Realmente  desea eliminar esta transferencia?')
  }

  onSaveTransferenciaItem(input): Observable<TransferenciaItem> {
    return this.genericCrudService.onSave(this.saveTransferenciaItem, input);
  }

  onDeleteTransferenciaItem(id): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteTransferenciaItem, id, 'Realmente  desea eliminar este item')
  }

  onFinalizar(transferencia: Transferencia): Observable<boolean> {
    return new Observable(obs => {
      if (transferencia.estado == TransferenciaEstado.ABIERTA) {
        this.dialogoService.confirm('Realmente desea finalizar esta transferencia?', 'Una vez finalizada, la transferencia estara disponible para ser preparada').subscribe(res => {
          if (res) {
            this.finalizarTransferencia.mutate({
              id: transferencia.id
            }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
              .pipe(untilDestroyed(this))
              .subscribe(res => {
                if (res.errors == null) {
                  obs.next(true)
                  this.notificacionService.notification$.next({
                    texto: 'Transferencia finalizada con éxito',
                    color: NotificacionColor.success,
                    duracion: 3
                  })
                } else {
                  obs.next(false)
                  this.notificacionService.notification$.next({
                    texto: 'Atención, ocurrio un error al finalizar la transferencia.' + res.errors[0],
                    color: NotificacionColor.danger,
                    duracion: 3
                  })
                }
              })
          }
        })

      }
    })
  }
}
