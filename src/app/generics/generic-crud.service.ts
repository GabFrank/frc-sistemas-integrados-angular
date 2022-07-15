import { Injectable } from "@angular/core";
import { Mutation, Query } from "apollo-angular";
import { Observable } from "rxjs";
import { MainService } from "../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../notificacion-snackbar.service";
import { DialogosService } from "../shared/components/dialogos/dialogos.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CargandoDialogService } from "../shared/components/cargando-dialog/cargando-dialog.service";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class GenericCrudService {

  isLoading = false;

  constructor(
    private notificacionSnackBar: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private mainService: MainService,
    private notificacionBar: NotificacionSnackbarService,
    private cargandoService: CargandoDialogService
  ) { }

  onGetAll(gql: Query, page?, size?): Observable<any> {
    this.isLoading = true;
    this.cargandoService.openDialog(false, 'Buscando...')
    return new Observable((obs) => {
      gql
        .fetch({ page, size }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog()
          this.isLoading = false
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            this.notificacionSnackBar.notification$.next({
              texto: "Ups! Algo salió mal: " + res.errors[0].message + res,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
  }

  onGetById<T>(gql: any, id: number): Observable<T> {
    this.isLoading = true;
    this.cargandoService.openDialog(false, 'Buscando...')
    return new Observable((obs) => {
      gql
        .fetch({ id }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog()
          this.isLoading = false;
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

  onGetByTexto(gql: Query, texto: string): Observable<any> {
    this.isLoading = true;
    this.cargandoService.openDialog(false, 'Buscando...')
    return new Observable((obs) => {
      gql
        .fetch({ texto }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog()
          this.isLoading = false;
          if (res.errors == null) {
            obs.next(res.data["data"]);
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

  onSave<T>(gql: Mutation, input): Observable<T> {
    this.isLoading = true;
    input.usuarioId = this.mainService.usuarioActual.id
    this.cargandoService.openDialog(false, 'Guardando...')
    return new Observable((obs) => {
      gql
        .mutate(
          { entity: input },
          { fetchPolicy: "no-cache", errorPolicy: "all" }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.closeDialog()
          if (res.errors == null) {
            obs.next(res.data["data"]);
            this.notificacionSnackBar.notification$.next({
              texto: "Guardado con éxito",
              duracion: 2,
              color: NotificacionColor.success,
            });
          } else {
            this.notificacionSnackBar.notification$.next({
              texto:
                "Ups! Algo salió mal en operacion: " +
                res.errors[0].message +
                res,
              color: NotificacionColor.danger,
              duracion: 5,
            });
          }
        });
    });
  }

  onDelete(
    gql: Mutation,
    id,
    titulo?,
    data?: any,
    showDialog?: boolean
  ): Observable<any> {
    this.cargandoService.openDialog(false, 'Eliminando...')
    return new Observable((obs) => {
      if (showDialog == false) {
        gql
          .mutate(
            {
              id,
            },
            { errorPolicy: "all" }
          ).pipe(untilDestroyed(this))
          .subscribe((res) => {
            this.cargandoService.closeDialog()
            if (res.errors == null) {
              this.notificacionSnackBar.notification$.next({
                texto: "Eliminado con éxito",
                duracion: 2,
                color: NotificacionColor.success,
              });
              obs.next(true);
            } else {
              {
                this.notificacionSnackBar.notification$.next({
                  texto:
                    "Ups! Ocurrió algun problema al eliminar: " +
                    res.errors[0].message,
                  duracion: 3,
                  color: NotificacionColor.danger,
                });
                obs.next(null);
              }
            }
          });
      } else {
        this.dialogoService
          .confirm(
            "Atención!!",
            "Realemente desea eliminar este " + titulo
          ).pipe(untilDestroyed(this))
          .subscribe((res1) => {
            this.cargandoService.closeDialog()
            if (res1) {
              gql
                .mutate(
                  {
                    id,
                  },
                  { errorPolicy: "all" }
                )
                .subscribe((res) => {
                  if (res.errors == null) {
                    this.notificacionSnackBar.notification$.next({
                      texto: "Eliminado con éxito",
                      duracion: 2,
                      color: NotificacionColor.success,
                    });
                    obs.next(true);
                  } else {
                    {
                      this.notificacionSnackBar.notification$.next({
                        texto:
                          "Ups! Ocurrió algun problema al eliminar: " +
                          res.errors[0].message,
                        duracion: 3,
                        color: NotificacionColor.danger,
                      });
                      obs.next(null);
                    }
                  }
                });
            } else {
            }
          });
      }
    });
  }

  onGetByFecha(gql: any, inicio: Date, fin: Date): Observable<any> {
    let hoy = new Date();
    let ayer = new Date(hoy.getDay() - 1);
    ayer.setHours(0);
    ayer.setMinutes(0);
    ayer.setSeconds(0);

    if (inicio == null) {
      if (fin == null) {
        inicio = ayer;
        fin = hoy;
      } else {
        let aux = new Date(fin);
        aux.setHours(0);
        aux.setMinutes(0);
        aux.setSeconds(0);
        inicio = aux;
      }
    } else {
      if (fin == null) {
        fin = hoy;
      }
    }
    return new Observable((obs) => {
      gql
        .fetch({ inicio, fin }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
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


  onSaveConDetalle(gql: Mutation, entity: any, detalleList: any[], info?: string) {
    entity.usuarioId = this.mainService?.usuarioActual?.id;
    return new Observable((obs) => {
      gql
        .mutate(
          {
            entity,
            detalleList,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            this.notificacionBar.notification$.next({
              texto: "Guardado con éxito!!",
              color: NotificacionColor.success,
              duracion: 2,
            });
            obs.next(res.data['data']);
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups!! Algo salio mal: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 5,
            });
            obs.next(null);
          }
        });
    });
  }
}
