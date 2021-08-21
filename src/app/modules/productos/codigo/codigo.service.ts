import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MainService } from '../../../main.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { CodigoInput } from './codigo-input.model';
import { Codigo } from './codigo.model';
import { CodigosPorProductoIdGQL } from './graphql/codigoPorProductoId';
import { DeleteCodigoGQL } from './graphql/deleteCodigo';
import { SaveCodigoGQL } from './graphql/saveCodigo';

@Injectable({
  providedIn: 'root'
})
export class CodigoService {

  dataOBs = new BehaviorSubject<Codigo[]>(null)

  constructor(
    private mainService: MainService,
    private saveCodigo: SaveCodigoGQL,
    private getCodigosPorProductoId: CodigosPorProductoIdGQL,
    private deleteCodigo: DeleteCodigoGQL,
    private notificacionBar: NotificacionSnackbarService
  ) { }

  onGetCodigosPorProductoId(id){
    this.getCodigosPorProductoId.fetch({
      id
    },
    {
      fetchPolicy: 'no-cache'
    }).subscribe(res => {
      if(!res.error){
        this.dataOBs.next(res.data.data)
      }
    })
  }

  onSaveCodigo(input: CodigoInput): Observable<any> {
    input.usuarioId = this.mainService?.usuarioActual?.id;
    input.id==null ? input.activo = true : null;
    return new Observable((obs) => {
      this.saveCodigo
        .mutate({
          entity: input,
        })
        .subscribe((res) => {
          if (!res.errors) {
            this.notificacionBar.notification$.next({
              texto: 'Código guardado con éxito',
              duracion: 2,
              color: NotificacionColor.success
            })
            obs.next(res.data.data);
          } else {
            this.notificacionBar.notification$.next({
              texto: 'Ups! Ocurrió algun problema al guardar',
              duracion: 2,
              color: NotificacionColor.danger
            })
          }
        });
    });
  }

  onDeleteCodigo(id: number): Observable<any> {
    return new Observable((obs) => {
      this.deleteCodigo
        .mutate({
          id
        })
        .subscribe((res) => {
          if (!res.errors) {
            this.notificacionBar.notification$.next({
              texto: 'Código eliminado con éxito',
              duracion: 2,
              color: NotificacionColor.success
            })
            obs.next(true);
          } else {
            {
              this.notificacionBar.notification$.next({
                texto: 'Ups! Ocurrió algun problema al eliminar',
                duracion: 2,
                color: NotificacionColor.danger
              })
            }
          }
        });
    });
  }
}
