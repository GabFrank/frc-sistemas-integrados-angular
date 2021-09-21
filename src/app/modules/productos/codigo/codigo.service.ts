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
    public mainService: MainService,
    private saveCodigo: SaveCodigoGQL,
    private getCodigosPorProductoId: CodigosPorProductoIdGQL,
    private deleteCodigo: DeleteCodigoGQL,
    private notificacionBar: NotificacionSnackbarService
  ) { }

  onGetCodigosPorProductoId(id): Observable<any> {
    console.log("haciendo fetch", id)
    return this.getCodigosPorProductoId.fetch({
      id
    },
    {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    })
  }

  onSaveCodigo(input: CodigoInput): Observable<any> {
    // if(input.tipoPrecioId!=null){
    //   input.codigo = `${input.codigo}${input.tipoPrecioId}`;
    // }
    input.usuarioId = this.mainService?.usuarioActual?.id;
    input.id==null ? input.activo = true : null;
    console.log('guardado codigo: ', input)
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
        },
        {errorPolicy: 'all'})
        .subscribe((res) => {
          if (res.errors==null) {
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
