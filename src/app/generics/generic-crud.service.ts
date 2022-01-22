import { Injectable } from "@angular/core";
import { Mutation, Query } from "apollo-angular";
import { Observable } from "rxjs";
import { MainService } from "../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../notificacion-snackbar.service";
import { DialogosService } from "../shared/components/dialogos/dialogos.service";

@Injectable({
  providedIn: "root",
})
export class GenericCrudService {
  constructor(
    private notificacionSnackBar: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private mainService: MainService,
    private notificacionBar: NotificacionSnackbarService
  ) {}

  onGetAll(gql: Query): Observable<any> {
    return new Observable((obs) => {
      gql
        .fetch({}, { fetchPolicy: "no-cache", errorPolicy: "all" })
        .subscribe((res) => {
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

  onGetById<T>(gql: Query, id: number): Observable<T> {
    return new Observable((obs) => {
      gql
        .fetch({ id }, { fetchPolicy: "no-cache", errorPolicy: "all" })
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            console.log(res.errors)
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
    return new Observable((obs) => {
      gql
        .fetch({ texto }, { fetchPolicy: "no-cache", errorPolicy: "all" })
        .subscribe((res) => {
          console.log(res)
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            console.log(res.errors)
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
    if (input.usuarioId == null) {
      input.usuarioId = +localStorage.getItem("usuarioId");
    }
    return new Observable((obs) => {
      gql
        .mutate(
          { entity: input },
          { fetchPolicy: "no-cache", errorPolicy: "all" }
        )
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
            this.notificacionSnackBar.notification$.next({
              texto: "Guardado con éxito",
              duracion: 2,
              color: NotificacionColor.success,
            });
          } else {
            console.log(res.errors)
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
    return new Observable((obs) => {
      if (showDialog == false) {
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
                console.log(res.errors)
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
          )
          .subscribe((res1) => {
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

  onGetByFecha(gql: Query, inicio: Date, fin: Date): Observable<any> {
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
        .fetch({ inicio, fin }, { fetchPolicy: "no-cache", errorPolicy: "all" })
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


  onSaveConDetalle(gql:Mutation, entity:any, detalleList: any[], info?:string){
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
          )
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
              console.log(res);
              obs.next(null);
            }
          });
      });
  }
}
