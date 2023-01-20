import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { version } from '../../../../environments/conectionConfig';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../shared/components/cargando-dialog/cargando-dialog.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { Actualizacion, TipoActualizacion } from './actualizacion.model';
import { ActualizacionByIdGQL } from './graphql/actualizacionById';
import { ActualizacionesGQL } from './graphql/actualizacionQuery';
import { DeleteActualizacionGQL } from './graphql/deleteActualizacion';
import { PingGQL } from './graphql/pingQuery';
import { SaveActualizacionGQL } from './graphql/saveActualizacion';
import { ultimaActualizacionGQL } from './graphql/ultimaActualizacion';
import { UpdateWizardComponent } from './update-wizard/update-wizard.component';
import { SaveActualizacionForSucursalesGQL } from './graphql/saveActualizacionBySucursales';

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class ActualizacionService {

  dialog;

  constructor(
    private crudService: GenericCrudService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private getAllActualizaciones: ActualizacionesGQL,
    private getActualizacion: ActualizacionByIdGQL,
    private getUltimaActualizacion: ultimaActualizacionGQL,
    private saveActualizacion: SaveActualizacionGQL,
    private saveActualizacionForSucursales: SaveActualizacionForSucursalesGQL,
    private deleteActualizacion: DeleteActualizacionGQL,
    private cargandoService: CargandoDialogService,
    private dialogoService: DialogosService,
    private matDialog: MatDialog,
    private getPing: PingGQL
  ) { }

  onGetPing(){
    return this.crudService.onGetById(this.getPing, 1)
  }

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

  onSaveForSucursales(input, sucList): Observable<Actualizacion> {
    return this.crudService.onSaveCustom(this.saveActualizacion, {entity: input, sucId: sucList})
  }

  onDelete(id): Observable<boolean> {
    return this.crudService.onDelete(this.deleteActualizacion, id)
  }

  checkForUpdates() {
    if (this.dialog == null) {
      this.onGetUltimaActualizacion(TipoActualizacion.DESKTOP)
        .pipe()
        .subscribe(res => {
          if (res != null) {
            if (res.currentVersion != version) {
              this.dialog = this.dialogoService.confirm(res.title, res.msg)
                .subscribe(dialogoRes => {
                  if (res) {
                    this.matDialog.open(UpdateWizardComponent, {
                      data: res,
                      width: '60%',
                      disableClose: true
                    }).afterClosed().subscribe(updateRes => {
                      this.dialog = null;
                    })
                  } else {
                    this.dialog = null;
                  }
                })
            }
          }
        })
    }
  }
}
