import { Injectable, Injector } from "@angular/core";
import { Mutation, Query, Subscription } from "apollo-angular";
import { Observable, OperatorFunction } from "rxjs";
import { map } from "rxjs/operators";
import { MainService } from "../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../notificacion-snackbar.service";
import { DialogosService } from "../shared/components/dialogos/dialogos.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { dateToString } from "../commons/core/utils/dateUtils";
import {
  limpiarErroresGraphQL,
  limpiarMensajeGraphQL,
  mensajeErrorTransporte,
} from "../commons/core/utils/graphqlErrorUtils";
import { CargandoDialogService } from "../shared/components/cargando-dialog/cargando-dialog.service";
import { esTimeoutDeLink } from "../shared/services/timeout-link";
import { Apollo } from "apollo-angular";
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

// Resultado sintético usado cuando el link de Apollo emite una respuesta vacía
// (servidor que responde con cuerpo vacío, operación cortada, etc.).
const RESPUESTA_VACIA = {
  data: null,
  errors: [{ message: "Respuesta vacía del servidor" }],
};

/** Tiempo máximo de onCustomQuery (reportes, vistas previas pesadas); lo aplica el timeout link. */
const TIMEOUT_CUSTOM_QUERY_MS = 300000;
/** El diálogo de carga es una red de seguridad: vence un poco después que el timeout real. */
const MARGEN_DIALOGO_MS = 5000;

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
    private injector: Injector,
    private apollo: Apollo
  ) {
    setTimeout(() => (this.mainService = injector.get(MainService)));
  }

  /**
   * Apollo puede emitir `null`/`undefined` cuando el servidor responde con
   * cuerpo vacío o la operación se corta antes de tiempo. Todos los handlers de
   * abajo asumen un objeto con `errors`/`data`, así que se normaliza acá: el
   * flujo entra por la rama de error ya existente (cierra el diálogo, avisa)
   * en vez de romper con "Cannot read properties of null (reading 'errors')".
   */
  private sinRespuestaVacia(): OperatorFunction<any, any> {
    return map((res: any) => {
      if (res != null) return res;
      // Si esto aparece SIN el warning "[GraphQL] Respuesta vacía del servidor"
      // de graphql-connection.service, la operación terminó sin emitir ningún
      // resultado (link terminal ausente), no por un cuerpo HTTP vacío.
      console.warn("[GraphQL] Resultado nulo en GenericCrudService");
      return RESPUESTA_VACIA;
    });
  }

  onGetAll(gql: Query, page?, size?, servidor: boolean = true): Observable<any> {
    this.isLoading = true;
    const { requestId } = this.cargandoService.openDialog(
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
              clientName: servidor == null || servidor ? "servidor" : null,
            },
          }
        )
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
        .subscribe({
          next: (res) => {
            this.cargandoService.closeDialog(requestId);
            this.isLoading = false;
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
            } else {
              this.notificacionSnackBar.notification$.next({
                texto: "Ups! Algo salió mal: " + limpiarMensajeGraphQL(res.errors[0].message),
                color: NotificacionColor.danger,
                duracion: 3,
              });
            }
          },
          error: () => {
            // Ej: servidor central offline. Cerrar el spinner en vez de colgarse.
            this.cargandoService.closeDialog(requestId);
            this.isLoading = false;
          },
        });
    });
  }

  onCustomQuery(
    gql: Query,
    data,
    servidor: boolean = true,
    errorConf?,
    silentLoad?: boolean
  ): Observable<any> {
    this.isLoading = true;
    // Usar verificación estricta: solo abrir diálogo si silentLoad NO es explícitamente true
    const shouldShowDialog = silentLoad !== true;
    let { requestId = null } =
      shouldShowDialog
        ? this.cargandoService.openDialog(false, "Buscando...", TIMEOUT_CUSTOM_QUERY_MS + MARGEN_DIALOGO_MS)
        : {};
    return new Observable((obs) => {
      this.apollo.query({
        query: gql.document,
        variables: data,
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
        context: {
          clientName: servidor == null || servidor ? "servidor" : null,
          // Reportes y vistas previas pesadas: el timeout real lo aplica el link (issue #304).
          timeoutMs: TIMEOUT_CUSTOM_QUERY_MS,
        },
      })
        .pipe(
          untilDestroyed(this),
          this.sinRespuestaVacia()
        )
        .subscribe({
          next: (res) => {
            if (shouldShowDialog) {
              this.cargandoService.closeDialog(requestId);
            }
            this.isLoading = false;
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
            } else {
              this.notificacionSnackBar.notification$.next({
                texto: "Ups! Algo salió mal: " + limpiarMensajeGraphQL(res.errors[0].message),
                color: NotificacionColor.danger,
                duracion: 3,
              });
              // Cerrar el observable igual: si no, el que llamo queda esperando para
              // siempre una respuesta que ya no va a llegar. Con errorPolicy 'all' puede
              // venir data parcial, asi que se emite lo que haya en vez de descartarla.
              obs.next(res.data?.["data"] ?? null);
              obs.complete();
            }
          },
          error: (error) => {
            this.isLoading = false;
            if (shouldShowDialog) {
              this.cargandoService.closeDialog(requestId);
            }
            if (errorConf?.networkError?.show == true && !esTimeoutDeLink(error)) {
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

  onCustomMutation(gql: Mutation, data, servidor: boolean = true, silentLoad: boolean = false,
                   opciones?: { timeoutMs?: number }): Observable<any> {
    this.isLoading = true;
    let requestId: number | null = null;
    
    if (silentLoad !== true) {
      const result = this.cargandoService.openDialog(
        false,
        "Guardando...",
        opciones?.timeoutMs != null ? opciones.timeoutMs + MARGEN_DIALOGO_MS : undefined
      );
      requestId = result.requestId;
    }
    
    return new Observable((obs) => {
      gql
        .mutate(data, {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
          context: {
            clientName: servidor == null || servidor ? "servidor" : null,
            timeoutMs: opciones?.timeoutMs,
          },
        })
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
        .subscribe({
          next: (res) => {
            if (silentLoad !== true) {
              this.cargandoService.closeDialog(requestId);
            }
            this.isLoading = false;
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
            } else {
              if (silentLoad !== true) {
                this.notificacionSnackBar.notification$.next({
                  texto: "Ups! Algo salió mal: " + limpiarMensajeGraphQL(res.errors[0].message),
                  color: NotificacionColor.danger,
                  duracion: 3,
                });
              }
              obs.error(limpiarErroresGraphQL(res.errors));
            }
          },
          error: (error) => {
            if (silentLoad !== true) {
              this.cargandoService.closeDialog(requestId);
            }
            this.isLoading = false;
            obs.error(error);
          }
        });
    });
  }

  onCustomSub(
    gql: Subscription,
    data,
    servidor: boolean = true,
    cargando?: boolean
  ): Observable<any> {
    this.isLoading = true;
    let requestId: number | null = null;

    if (cargando == true) {
      const result = this.cargandoService.openDialog(false, "Buscando...");
      requestId = result.requestId;
    }

    return new Observable((obs) => {
      gql
        .subscribe(data, {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
          context: {
            clientName: servidor == null || servidor ? "servidor" : null,
          },
        })
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
        .subscribe({
          next: (res) => {
            if (cargando == true) {
              this.cargandoService.closeDialog(requestId);
            }
            this.isLoading = false;
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
            } else {
              this.notificacionSnackBar.notification$.next({
                texto: "Ups! Algo salió mal: " + limpiarMensajeGraphQL(res.errors[0].message),
                color: NotificacionColor.danger,
                duracion: 3,
              });
            }
          },
          error: () => {
            if (cargando == true) {
              this.cargandoService.closeDialog(requestId);
            }
            this.isLoading = false;
          },
        });
    });
  }

  onGetById<T>(
    gql: any,
    id: number,
    page?,
    size?,
    servidor: boolean = true,
    sucId?,
    error?,
    duracion?,
    silentLoad?,
    errorText?,
    warningText?
  ): Observable<T> {
    this.isLoading = true;
    let { requestId = null } =
      silentLoad != true
        ? this.cargandoService.openDialog(false, "Buscando...")
        : {};
    return new Observable((obs) => {
      gql
        .fetch(
          { id, page, size, sucId },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
            context: {
              clientName: servidor == null || servidor ? "servidor" : null,
            },
          }
        )
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
        .subscribe(
          (res) => {
            silentLoad != true
              ? this.cargandoService.closeDialog(requestId)
              : null;
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
                texto: errorText != null ? errorText : "Ups! Algo salió mal: " + limpiarMensajeGraphQL(res.errors[0].message),
                color: NotificacionColor.danger,
                duracion: 3,
              });
            }
          },
          (err) => {
            if (!esTimeoutDeLink(err)) {
              this.notificacionBar.openWarn(
                warningText != null ? warningText : "Problema al realizar esta operación"
              );
            }
            this.cargandoService.closeDialog(requestId);
          }
        );
    });
  }

  onGetByTexto(
    gql: Query,
    texto: string,
    servidor: boolean = true,
    duracion?,
    errorConf?: QueryError
  ): Observable<any> {
    this.isLoading = true;
    const { requestId } = this.cargandoService.openDialog(
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
              clientName: servidor == null || servidor ? "servidor" : null,
            },
          }
        )
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
        .subscribe({
          next: (res) => {
            this.cargandoService.closeDialog(requestId);
            this.isLoading = false;
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
            } else {
              const errorMessage = limpiarMensajeGraphQL(res.errors[0].message);
              if (errorConf?.graphError?.show !== false) {
                this.notificacionSnackBar.notification$.next({
                  texto: "Ups! Algo salió mal: " + errorMessage,
                  color: NotificacionColor.danger,
                  duracion: 3,
                });
              }
              if (errorConf?.graphError?.propagate === true) {
                obs.error({ message: errorMessage, errors: limpiarErroresGraphQL(res.errors) });
              }
            }
          },
          error: (error) => {
            this.cargandoService.closeDialog(requestId);
            this.isLoading = false;
            if (errorConf?.networkError?.show === true && !esTimeoutDeLink(error)) {
              this.notificacionSnackBar.notification$.next({
                texto: "Error de red",
                color:
                  errorConf?.networkError?.color || NotificacionColor.danger,
                duracion: 3,
              });
            }
            if (errorConf?.networkError?.propagate === true) {
              obs.error(error);
            }
          },
        });
    });
  }

  onSave<T>(
    gql: Mutation,
    input,
    printerName?: string,
    local?: string,
    servidor: boolean = true,
    errorConf?: QueryError,
    usuarioId?: number
  ): Observable<T> {
    this.isLoading = true;
    if (usuarioId == null) usuarioId = this.mainService.usuarioActual.id;
    if ("usuarioId" in input) {
      if (input?.usuarioId == null) {
        input["usuarioId"] = this.mainService.usuarioActual.id;
      }
    }

    const { requestId } = this.cargandoService.openDialog(
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
              clientName: servidor == null || servidor ? "servidor" : null,
            },
          }
        )
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
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
                  "Ups! Algo salió mal en operacion: " + limpiarMensajeGraphQL(res.errors[0].message),
                color: NotificacionColor.danger,
                duracion: 5,
              });
              if (res?.data != null && res?.data["data"] != null) {
                obs.next(res.data["data"]);
              } else {
                obs.error(limpiarErroresGraphQL(res.errors));
              }
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.cargandoService.closeDialog(requestId);
            if (errorConf?.networkError?.show == true && !esTimeoutDeLink(error)) {
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

  // Un lote (forkJoin de N onSaveCustom) que falla dispara N errores casi juntos (de red o de
  // negocio): forkJoin corta en el primero, pero las demás llamadas siguen vivas y cada una
  // avisaría. La cola de notificaciones es secuencial, así que N avisos iguales taparían cualquier
  // otro. Misma operación y mismo texto dentro de la ventana = un solo aviso. La clave incluye la
  // operación: dos acciones distintas que fallan igual (p. ej. dos 403) avisan cada una.
  ventanaAvisoErrorMs = 3000;
  private ultimoAvisoError: { gql: Mutation; texto: string; en: number } = null;

  private avisarErrorSinRepetir(gql: Mutation, texto: string, duracion: number): void {
    // Reloj monotónico: si el reloj del sistema retrocede (NTP), Date.now() dejaría la
    // resta negativa y silenciaría avisos mucho más de la ventana.
    const ahora = performance.now();
    const repetido = this.ultimoAvisoError?.gql === gql
      && this.ultimoAvisoError.texto === texto
      && ahora - this.ultimoAvisoError.en < this.ventanaAvisoErrorMs;
    if (repetido) return;
    this.ultimoAvisoError = { gql, texto, en: ahora };
    this.notificacionSnackBar.notification$.next({ texto, color: NotificacionColor.danger, duracion });
  }

  /**
   * `opciones.avisarExito = false` apaga solo «Guardado con éxito», para el llamador que muestra su
   * propio aviso de éxito (más específico). No toca el diálogo «Guardando...» ni los avisos de
   * error: esos los da siempre este método, que tiene el mensaje real del backend.
   * Es un objeto y no un booleano: varios wrappers terminan en `servidor: boolean`, y un `false`
   * suelto caería ahí sin que el compilador lo note.
   */
  onSaveCustom<T>(gql: Mutation, data, servidor: boolean = true,
                  opciones?: { avisarExito?: boolean; timeoutMs?: number }): Observable<T> {
    this.isLoading = true;
    const { requestId } = this.cargandoService.openDialog(
      false,
      "Guardando...",
      opciones?.timeoutMs != null ? opciones.timeoutMs + MARGEN_DIALOGO_MS : undefined
    );
    return new Observable((obs) => {
      gql
        .mutate(data, {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
          context: {
            clientName: servidor == null || servidor ? "servidor" : null,
            timeoutMs: opciones?.timeoutMs,
          },
        })
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            this.cargandoService.closeDialog(requestId);
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
              if (opciones?.avisarExito !== false) {
                this.notificacionSnackBar.notification$.next({
                  texto: "Guardado con éxito",
                  duracion: 2,
                  color: NotificacionColor.success,
                });
              }
            } else {
              // Sin mensaje del backend (undefined o vacío) el aviso diría «…operacion: undefined».
              const limpio = limpiarMensajeGraphQL(res.errors[0]?.message);
              const mensaje = typeof limpio === "string" && limpio.trim() ? limpio : "el servidor no dio detalle";
              this.avisarErrorSinRepetir(gql, "Ups! Algo salió mal en operacion: " + mensaje, 5);
              // Ademas del snackbar hay que CERRAR el observable: sin esto el llamador se queda
              // esperando para siempre y cualquier bandera de "guardando" nunca se apaga, con lo
              // cual el boton de confirmar queda muerto y el usuario tiene que rehacer el
              // formulario entero. Un error de negocio del backend es un error para el llamador,
              // no un silencio.
              obs.error({ graphQLErrors: limpiarErroresGraphQL(res.errors), message: mensaje });
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.cargandoService.closeDialog(requestId);
            // Error de transporte: nadie más lo avisa (errorObs no tiene suscriptores), así que
            // sin esto el usuario no ve nada. «Error de red» salvo que haya un status HTTP real.
            // Un corte por timeout ya lo avisó el link.
            if (!esTimeoutDeLink(error)) {
              this.avisarErrorSinRepetir(gql, mensajeErrorTransporte(error), 3);
            }
            obs.error(error);
          },
        });
    });
  }

  onDelete(
    gql: Mutation,
    id,
    titulo?,
    data?: any,
    showDialog?: boolean,
    servidor: boolean = true,
    mensaje?: string
  ): Observable<any> {
    return new Observable((obs) => {
      if (showDialog == false) {
        const { requestId } = this.cargandoService.openDialog(
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
                clientName: servidor == null || servidor ? "servidor" : null,
              },
            }
          )
          .pipe(untilDestroyed(this), this.sinRespuestaVacia())
          .subscribe({
            next: (res) => {
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
                      limpiarMensajeGraphQL(res.errors[0].message),
                    duracion: 3,
                    color: NotificacionColor.danger,
                  });
                  obs.next(null);
                }
              }
            },
            error: () => {
              this.cargandoService.closeDialog(requestId);
              obs.next(null);
            },
          });
      } else {
        this.dialogoService
          .confirm(titulo != null ? titulo : "Atención!!", mensaje != null ? mensaje : "Realemente desea eliminar este item?")
          .pipe(untilDestroyed(this))
          .subscribe((res1) => {
            const { requestId } = this.cargandoService.openDialog(
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
                      clientName: servidor == null || servidor ? "servidor" : null,
                    },
                  }
                )
                .pipe(this.sinRespuestaVacia())
                .subscribe({
                  next: (res) => {
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
                            limpiarMensajeGraphQL(res.errors[0].message),
                          duracion: 3,
                          color: NotificacionColor.danger,
                        });
                        obs.next(null);
                        obs.complete();
                      }
                    }
                  },
                  error: () => {
                    this.cargandoService.closeDialog(requestId);
                    obs.next(null);
                    obs.complete();
                  },
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
    servidor: boolean = true
  ): Observable<any> {
    return new Observable((obs) => {
      if (showDialog == false) {
        const { requestId } = this.cargandoService.openDialog(
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
                clientName: servidor == null || servidor ? "servidor" : null,
              },
            }
          )
          .pipe(untilDestroyed(this), this.sinRespuestaVacia())
          .subscribe({
            next: (res) => {
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
                      limpiarMensajeGraphQL(res.errors[0].message),
                    duracion: 3,
                    color: NotificacionColor.danger,
                  });
                  obs.next(null);
                }
              }
            },
            error: () => {
              this.cargandoService.closeDialog(requestId);
              obs.next(null);
            },
          });
      } else {
        this.dialogoService
          .confirm("Atención!!", "Realemente desea eliminar este " + titulo)
          .pipe(untilDestroyed(this))
          .subscribe((res1) => {
            const { requestId } = this.cargandoService.openDialog(
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
                      clientName: servidor == null || servidor ? "servidor" : null,
                    },
                  }
                )
                .pipe(this.sinRespuestaVacia())
                .subscribe({
                  next: (res) => {
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
                            limpiarMensajeGraphQL(res.errors[0].message),
                          duracion: 3,
                          color: NotificacionColor.danger,
                        });
                        obs.next(null);
                        obs.complete();
                      }
                    }
                  },
                  error: () => {
                    this.cargandoService.closeDialog(requestId);
                    obs.next(null);
                    obs.complete();
                  },
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
    servidor: boolean = true,
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
    const { requestId } = this.cargandoService.openDialog(
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
              clientName: servidor == null || servidor ? "servidor" : null,
            },
          }
        )
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
        .subscribe({
          next: (res) => {
            this.cargandoService.closeDialog(requestId);
            if (res.errors == null) {
              obs.next(res.data["data"]);
              obs.complete();
            } else {
              this.notificacionSnackBar.notification$.next({
                texto: "Ups! Algo salió mal: " + limpiarMensajeGraphQL(res.errors[0].message),
                color: NotificacionColor.danger,
                duracion: 3,
              });
            }
          },
          error: () => {
            this.cargandoService.closeDialog(requestId);
            this.isLoading = false;
          },
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
    servidor: boolean = true,
    error?: boolean
  ) {
    const { requestId } = this.cargandoService.openDialog();
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
              clientName: servidor == null || servidor ? "servidor" : null,
            },
          }
        )
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
        .subscribe({
          next: (res) => {
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
                texto: "Ups!! Algo salio mal: " + limpiarMensajeGraphQL(res.errors[0].message),
                color: NotificacionColor.danger,
                duracion: 5,
              });
              if (error) {
                obs.next({ error: limpiarErroresGraphQL(res.errors) });
                obs.complete();
              } else {
                obs.next(null);
                obs.complete();
              }
            }
          },
          error: (err) => {
            this.cargandoService.closeDialog(requestId);
            if (error) {
              obs.next({ error: err });
            } else {
              obs.next(null);
            }
            obs.complete();
          },
        });
    });
  }
}
