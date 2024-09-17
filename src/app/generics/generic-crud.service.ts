import { Injectable, Injector } from "@angular/core";
import { Mutation, Query, Subscription } from "apollo-angular";
import { Observable, timeout } from "rxjs";
import { MainService } from "../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../notificacion-snackbar.service";
import { DialogosService } from "../shared/components/dialogos/dialogos.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { dateToString } from "../commons/core/utils/dateUtils";
import { CargandoDialogService } from "../shared/components/cargando-dialog/cargando-dialog.service";

/**
 * Interfaz para gestionar el manejo de errores en una solicitud GraphQL.
 * Esta interfaz permite configurar cómo se deben mostrar y propagar
 * los errores tanto a nivel de GraphQL como de red.
 *
 * Propiedades:
 *
 * - graphError:
 *   - Configuración para manejar los errores relacionados con GraphQL.
 *   - show: Indica si se debe mostrar el error (booleano).
 *   - color: Define el color de la notificación cuando se muestra el error (NotificacionColor).
 *   - propagate: Indica si se debe propagar el error para su manejo en otros niveles (booleano).
 *
 * - networkError:
 *   - Configuración para manejar los errores de red.
 *   - show: Indica si se debe mostrar el error de red (booleano).
 *   - color: Define el color de la notificación para errores de red (NotificacionColor).
 *   - propagate: Indica si se debe propagar el error de red (booleano).
 */
export interface QueryError {
  graphError?: {
    show?: boolean;
    color?: NotificacionColor;
    propagate?: boolean;
  };
  networkError?: {
    show?: boolean;
    color?: NotificacionColor;
    propagate?: boolean;
  };
}

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class GenericCrudService {
  isLoading = false;

  private mainService: MainService;

  constructor(
    private notificacionSnackBar: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private notificacionBar: NotificacionSnackbarService,
    private cargandoService: CargandoDialogService,
    private injector: Injector
  ) {
    setTimeout(() => (this.mainService = injector.get(MainService)));
  }

  onGetAll(gql: Query, page?, size?, servidor?): Observable<any> {
    this.isLoading = true;
    const { requestId, signal } = this.cargandoService.openDialog(
      false,
      "Buscando..."
    );
    return new Observable((obs) => {
      gql
        .fetch(
          { page, size },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
            context: {
              clientName: servidor == true ? "servidor" : null,
              fetchOptions: { signal },
            },
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog(requestId);
          this.isLoading = false;
          if (res.errors == null) {
            obs.next(res.data["data"]);
            obs.complete();
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

  onCustomQuery(gql: Query, data, servidor?, errorConf?): Observable<any> {
    console.log("Entrando en custom query");

    this.isLoading = true;
    const { requestId, signal } = this.cargandoService.openDialog(
      false,
      "Buscando..."
    );
    return new Observable((obs) => {
      gql
        .fetch(data, {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
          context: {
            clientName: servidor == true ? "servidor" : null,
            fetchOptions: { signal },
          },
        })
        .pipe(
          untilDestroyed(this),
          timeout(300000) // Adjust as per your needs
        )
        .subscribe({
          next: (res) => {
            this.cargandoService.closeDialog(requestId);
            this.isLoading = false;
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
            } else {
              this.notificacionSnackBar.notification$.next({
                texto: "Ups! Algo salió mal: " + res.errors[0].message + res,
                color: NotificacionColor.danger,
                duracion: 3,
              });
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.cargandoService.closeDialog(requestId);
            if (errorConf?.networkError?.show == true) {
              this.notificacionSnackBar.notification$.next({
                texto: "Error de red",
                color:
                  errorConf?.networkError?.color || NotificacionColor.danger,
                duracion: 3,
              });
            }
            if (errorConf?.networkError?.propagate == true) {
              obs.error(error);
            }
          },
        });
    });
  }

  onCustomMutation(gql: Mutation, data, servidor?): Observable<any> {
    this.isLoading = true;
    const { requestId, signal } = this.cargandoService.openDialog(
      false,
      "Guardando..."
    );
    return new Observable((obs) => {
      gql
        .mutate(data, {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
          context: {
            clientName: servidor == true ? "servidor" : null,
            fetchOptions: { signal },
          },
        })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog(requestId);
          this.isLoading = false;
          if (res.errors == null) {
            obs.next(res.data["data"]);
            obs.complete();
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

  onCustomSub(
    gql: Subscription,
    data,
    servidor?,
    cargando?: boolean
  ): Observable<any> {
    this.isLoading = true;
    let requestId: number | null = null;
    let signal: AbortSignal | undefined;

    if (cargando == true) {
      const result = this.cargandoService.openDialog(false, "Buscando...");
      requestId = result.requestId;
      signal = result.signal;
    }

    return new Observable((obs) => {
      gql
        .subscribe(data, {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
          context: {
            clientName: servidor == true ? "servidor" : null,
            fetchOptions: { signal },
          },
        })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (cargando == true) {
            this.cargandoService.closeDialog(requestId);
          }
          this.isLoading = false;
          if (res.errors == null) {
            obs.next(res.data["data"]);
            obs.complete();
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

  onGetById<T>(
    gql: any,
    id: number,
    page?,
    size?,
    servidor?,
    sucId?,
    error?,
    duracion?
  ): Observable<T> {
    this.isLoading = true;
    const { requestId, signal } = this.cargandoService.openDialog(
      false,
      "Buscando...",
      duracion
    );
    return new Observable((obs) => {
      gql
        .fetch(
          { id, page, size, sucId },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
            context: {
              clientName: servidor == true ? "servidor" : null,
              fetchOptions: { signal },
            },
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            this.cargandoService.closeDialog(requestId);
            this.isLoading = false;
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
              if (res.data["data"] == null && res.data["error"] == false) {
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
          },
          (err) => {
            this.notificacionBar.openWarn(
              "Problema al realizar esta operación"
            );
            this.cargandoService.closeDialog(requestId);
          }
        );
    });
  }

  onGetByTexto(
    gql: Query,
    texto: string,
    servidor?,
    duracion?
  ): Observable<any> {
    this.isLoading = true;
    const { requestId, signal } = this.cargandoService.openDialog(
      false,
      "Buscando...",
      duracion
    );
    return new Observable((obs) => {
      gql
        .fetch(
          { texto },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
            context: {
              clientName: servidor == true ? "servidor" : null,
              fetchOptions: { signal },
            },
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog(requestId);
          this.isLoading = false;
          if (res.errors == null) {
            obs.next(res.data["data"]);
            obs.complete();
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

  onSave<T>(
    gql: Mutation,
    input,
    printerName?: string,
    local?: string,
    servidor?,
    errorConf?: QueryError
  ): Observable<T> {
    this.isLoading = true;
    if (input?.usuarioId == null) {
      input.usuarioId = this.mainService.usuarioActual.id;
    }
    const { requestId, signal } = this.cargandoService.openDialog(
      false,
      "Guardando..."
    );
    return new Observable((obs) => {
      gql
        .mutate(
          { entity: input, printerName, local },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
            context: {
              clientName: servidor == true ? "servidor" : null,
              fetchOptions: { signal },
            },
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            this.cargandoService.closeDialog(requestId);
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
              this.notificacionSnackBar.notification$.next({
                texto: "Guardado con éxito",
                duracion: 2,
                color: NotificacionColor.success,
              });
            } else {
              this.notificacionSnackBar.notification$.next({
                texto:
                  "Ups! Algo salió mal en operacion: " + res.errors[0].message,
                color: NotificacionColor.danger,
                duracion: 5,
              });
              if (res?.data != null && res?.data["data"] != null) {
                obs.next(res.data["data"]);
              } else {
                obs.error(res.errors);
              }
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.cargandoService.closeDialog(requestId);
            if (errorConf?.networkError?.show == true) {
              this.notificacionSnackBar.notification$.next({
                texto: "Error de red",
                color:
                  errorConf?.networkError?.color || NotificacionColor.danger,
                duracion: 3,
              });
            }
            if (errorConf?.networkError?.propagate == true) {
              obs.error(error);
            }
          },
        });
    });
  }

  onSaveCustom<T>(gql: Mutation, data, servidor?): Observable<T> {
    this.isLoading = true;
    const { requestId, signal } = this.cargandoService.openDialog(
      false,
      "Guardando..."
    );
    return new Observable((obs) => {
      gql
        .mutate(data, {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
          context: {
            clientName: servidor == true ? "servidor" : null,
            fetchOptions: { signal },
          },
        })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.closeDialog(requestId);
          if (res.errors == null) {
            obs.next(res.data["data"]);
            obs.complete();
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
    showDialog?: boolean,
    servidor?
  ): Observable<any> {
    return new Observable((obs) => {
      if (showDialog == false) {
        const { requestId, signal } = this.cargandoService.openDialog(
          false,
          "Eliminando..."
        );
        gql
          .mutate(
            {
              id,
            },
            {
              errorPolicy: "all",
              context: {
                clientName: servidor == true ? "servidor" : null,
                fetchOptions: { signal },
              },
            }
          )
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            this.cargandoService.closeDialog(requestId);
            if (res.errors == null) {
              this.notificacionSnackBar.notification$.next({
                texto: "Eliminado con éxito",
                duracion: 2,
                color: NotificacionColor.success,
              });
              obs.next(true);
              obs.complete();
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
          .confirm("Atención!!", "Realemente desea eliminar este " + titulo)
          .pipe(untilDestroyed(this))
          .subscribe((res1) => {
            const { requestId, signal } = this.cargandoService.openDialog(
              false,
              "Eliminando..."
            );
            if (res1) {
              gql
                .mutate(
                  {
                    id,
                  },
                  {
                    errorPolicy: "all",
                    context: {
                      clientName: servidor == true ? "servidor" : null,
                      fetchOptions: { signal },
                    },
                  }
                )
                .subscribe((res) => {
                  this.cargandoService.closeDialog(requestId);
                  if (res.errors == null) {
                    this.notificacionSnackBar.notification$.next({
                      texto: "Eliminado con éxito",
                      duracion: 2,
                      color: NotificacionColor.success,
                    });
                    obs.next(true);
                    obs.complete();
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
                      obs.complete();
                    }
                  }
                });
            } else {
            }
          });
      }
    });
  }

  onDeleteWithSucId(
    gql: Mutation,
    id,
    sucId?,
    titulo?,
    data?: any,
    showDialog?: boolean,
    servidor?
  ): Observable<any> {
    return new Observable((obs) => {
      if (showDialog == false) {
        const { requestId, signal } = this.cargandoService.openDialog(
          false,
          "Eliminando..."
        );
        gql
          .mutate(
            {
              id,
              sucId,
            },
            {
              errorPolicy: "all",
              context: {
                clientName: servidor == true ? "servidor" : null,
                fetchOptions: { signal },
              },
            }
          )
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            this.cargandoService.closeDialog(requestId);
            if (res.errors == null) {
              this.notificacionSnackBar.notification$.next({
                texto: "Eliminado con éxito",
                duracion: 2,
                color: NotificacionColor.success,
              });
              obs.next(true);
              obs.complete();
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
          .confirm("Atención!!", "Realemente desea eliminar este " + titulo)
          .pipe(untilDestroyed(this))
          .subscribe((res1) => {
            const { requestId, signal } = this.cargandoService.openDialog(
              false,
              "Eliminando..."
            );
            if (res1) {
              gql
                .mutate(
                  {
                    id,
                  },
                  {
                    errorPolicy: "all",
                    context: {
                      clientName: servidor == true ? "servidor" : null,
                      fetchOptions: { signal },
                    },
                  }
                )
                .subscribe((res) => {
                  this.cargandoService.closeDialog(requestId);
                  if (res.errors == null) {
                    this.notificacionSnackBar.notification$.next({
                      texto: "Eliminado con éxito",
                      duracion: 2,
                      color: NotificacionColor.success,
                    });
                    obs.next(true);
                    obs.complete();
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
                      obs.complete();
                    }
                  }
                });
            } else {
            }
          });
      }
    });
  }

  onGetByFecha(
    gql: any,
    inicio: Date,
    fin: Date,
    servidor?,
    sucId?
  ): Observable<any> {
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
    const { requestId, signal } = this.cargandoService.openDialog(
      false,
      "Eliminando..."
    );
    return new Observable((obs) => {
      gql
        .fetch(
          { inicio: dateToString(inicio), fin: dateToString(fin), sucId },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
            context: {
              clientName: servidor == true ? "servidor" : null,
              fetchOptions: { signal },
            },
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog(requestId);
          if (res.errors == null) {
            obs.next(res.data["data"]);
            obs.complete();
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

  onSaveConDetalle(
    gql: Mutation,
    entity: any,
    detalleList: any[],
    info?: string,
    printerName?: string,
    pdvId?: number,
    servidor?,
    error?: boolean
  ) {
    const { requestId, signal } = this.cargandoService.openDialog();
    entity.usuarioId = this.mainService?.usuarioActual?.id;
    return new Observable((obs) => {
      gql
        .mutate(
          {
            entity,
            detalleList,
            printerName,
            pdvId,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
            context: {
              clientName: servidor == true ? "servidor" : null,
              fetchOptions: { signal },
            },
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog(requestId);
          if (res.errors == null) {
            this.notificacionBar.notification$.next({
              texto: "Guardado con éxito!!",
              color: NotificacionColor.success,
              duracion: 2,
            });
            if (error) {
              obs.next({ data: res.data["data"] });
              obs.complete();
            } else {
              obs.next(res.data["data"]);
              obs.complete();
            }
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups!! Algo salio mal: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 5,
            });
            if (error) {
              obs.next({ error: res.errors });
              obs.complete();
            } else {
              obs.next(null);
              obs.complete();
            }
          }
        });
    });
  }
}
