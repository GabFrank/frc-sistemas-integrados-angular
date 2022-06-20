import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../shared/components/cargando-dialog/cargando-dialog.service';
import { Actualizacion, TipoActualizacion } from './actualizacion.model';
import { ActualizacionByIdGQL } from './graphql/actualizacionById';
import { ActualizacionesGQL } from './graphql/actualizacionQuery';
import { DeleteActualizacionGQL } from './graphql/deleteActualizacion';
import { SaveActualizacionGQL } from './graphql/saveActualizacion';
import { ultimaActualizacionGQL } from './graphql/ultimaActualizacion';

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class ActualizacionService {

  constructor(
    private crudService: GenericCrudService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private getAllActualizaciones: ActualizacionesGQL,
    private getActualizacion: ActualizacionByIdGQL,
    private getUltimaActualizacion: ultimaActualizacionGQL,
    private saveActualizacion: SaveActualizacionGQL,
    private deleteActualizacion: DeleteActualizacionGQL,
    private cargandoService: CargandoDialogService
  ) { }

  onGetAll(): Observable<Actualizacion[]> {
    return this.crudService.onGetAll(this.getAllActualizaciones)
  }

  onGetById(id): Observable<Actualizacion> {
    return this.crudService.onGetById(this.getActualizacion, id)
  }

  onGetUltimaActualizacion(tipo: TipoActualizacion): Observable<Actualizacion> {
    this.cargandoService.openDialog(false, 'Buscando...')
    return new Observable((obs) => {
      this.getUltimaActualizacion
        .fetch({ tipo }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog()
          if (res.errors == null) {
            obs.next(res.data["data"]);
            if (res.data["data"] == null) {
              this.notificacionSnackBar.notification$.next({
                texto: "Item no encontrado",
                color: NotificacionColor.warn,
                duracion: 2,
              });
            }
          } else {
            this.notificacionSnackBar.notification$.next({
              texto: "Ups! Algo salió mal: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
  }

  onSave(input): Observable<Actualizacion> {
    return this.crudService.onSave(this.saveActualizacion, input)
  }

  onDelete(id): Observable<boolean> {
    return this.crudService.onDelete(this.deleteActualizacion, id)
  }
}
