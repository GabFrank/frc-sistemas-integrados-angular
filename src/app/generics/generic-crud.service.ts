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
  MENSAJE_RESPUESTA_VACIA,
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
  errors: [{ message: MENSAJE_RESPUESTA_VACIA }],
};

/** Tiempo máximo de onCustomQuery (reportes, vistas previas pesadas); lo aplica el timeout link. */
const TIMEOUT_CUSTOM_QUERY_MS = 300000;
/** El diálogo de carga es una red de seguridad: vence un poco después que el timeout real. */
const MARGEN_DIALOGO_MS = 5000;
/** Tiempo máximo de una consulta de fondo (poll del header): nadie la está esperando. */
export const TIMEOUT_CONSULTA_DE_FONDO_MS = 20000;
/** Lo que espera un cajero de pie (escanear, elegir un lote) antes de que se le diga algo (#390). */
export const TIMEOUT_CONSULTA_MOSTRADOR_MS = 10000;
/**
 * Para quien maneja el error de red con su propio `error:`: sin esto onCustomQuery no emite nada si
 * el servidor no responde, y el que llama queda esperando para siempre. Solo red: un error GraphQL
 * sigue llegando como `null` (#390).
 */
export const PROPAGAR_ERROR_DE_RED: QueryError = { networkError: { propagate: true, show: false } };
/** Para quien ya avisa por su cuenta cuando onGetAll le devuelve `null`: sin aviso del genérico. */
export const SIN_AVISO_DEL_GENERICO: QueryError = { graphError: { show: false }, networkError: { show: false } };
/** Contexto de onCustomQuery: timeout propio y si el link avisa al vencer. */
export interface ContextoConsulta {
  timeoutMs?: number;
  silenciarAvisoTimeout?: boolean;
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

  // Un diálogo suele pedir varias listas a la vez (monedas, formas de pago…): si el servidor no
  // responde fallan todas juntas, y alcanza con decirlo una vez. Reloj monotónico, como abajo.
  private ultimoAvisoLectura: { texto: string; en: number } = null;

  private avisarLecturaFallida(texto: string): void {
    const ahora = performance.now();
    if (this.ultimoAvisoLectura?.texto === texto && ahora - this.ultimoAvisoLectura.en < 5000) return;
    this.ultimoAvisoLectura = { texto, en: ahora };
    this.notificacionSnackBar.notification$.next({ texto, color: NotificacionColor.warn, duracion: 4 });
  }

  /**
   * Siempre termina (#390). Ante una falla emite `null` y completa: antes no emitía ni completaba, y
   * quien llamaba quedaba esperando para siempre (spinner propio encendido, `forkJoin` que no cerraba).
   * `null` es «no se pudo leer»; una lista vacía sigue siendo `[]`.
   *
   * Ante un error de red avisa «No se pudo cargar: …», una vez aunque fallen varias lecturas juntas.
   *
   * @param errorConf opcional. `graphError.show = false` y `networkError.show = false` apagan los
   * avisos (para quien avisa por su cuenta). Con `propagate` la falla llega al `error:` del que llama en vez de `null`: el error de
   * red tal cual, y el GraphQL como `{ message, errors }` (igual que onCustomQuery).
   */
  onGetAll(gql: Query, page?, size?, servidor: boolean = true, errorConf?: QueryError): Observable<any> {
    this.isLoading = true;
    const { requestId } = this.cargandoService.openDialog(
      false,
      "Buscando..."
    );
    return new Observable((obs) => {
      // Una sola salida, pase lo que pase: resultado, error del servidor, error de red, que la
      // consulta complete sin emitir, o una excepción al leer la respuesta.
      let terminado = false;
      const cerrar = (): boolean => {
        if (terminado) return false;
        terminado = true;
        this.cargandoService.closeDialog(requestId);
        this.isLoading = false;
        return true;
      };
      const terminar = (valor: any) => {
        if (!cerrar()) return;
        obs.next(valor);
        obs.complete();
      };
      const fallar = (error: any) => {
        if (cerrar()) obs.error(error);
      };
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
            let errores: any[] = null;
            let datos: any = null;
            try {
              errores = res.errors?.length ? res.errors : null;
              datos = res.data?.["data"] ?? null;
            } catch (e) {
              console.error("[GraphQL] Respuesta de onGetAll ilegible", e);
            }
            if (errores == null) {
              terminar(datos);
              return;
            }
            const mensaje = limpiarMensajeGraphQL(errores[0]?.message);
            if (errorConf?.graphError?.show !== false) {
              this.notificacionSnackBar.notification$.next({
                texto: "Ups! Algo salió mal: " + mensaje,
                color: NotificacionColor.danger,
                duracion: 3,
              });
            }
            if (errorConf?.graphError?.propagate === true) {
              fallar({ message: mensaje, errors: limpiarErroresGraphQL(errores) });
              return;
            }
            // Una lista a medias no es una lista: con errores se emite null aunque haya venido algo.
            terminar(null);
          },
          error: (error) => {
            // Ej: servidor central offline, corte del link, servidor caído.
            if (errorConf?.networkError?.propagate === true) {
              fallar(error);
              return;
            }
            // Nadie más lo dice (el central offline y el servidor caído no avisan), y sin esto la
            // pantalla queda vacía sin explicación. El corte por tiempo ya lo avisó el link.
            if (!terminado && errorConf?.networkError?.show !== false && !esTimeoutDeLink(error)) {
              this.avisarLecturaFallida("No se pudo cargar: " + mensajeErrorTransporte(error));
            }
            terminar(null);
          },
          complete: () => terminar(null),
        });
    });
  }

  /**
   * @param contexto opcional. `timeoutMs` reemplaza el tiempo máximo (por defecto el de reportes,
   * 5 min); `silenciarAvisoTimeout` evita el aviso al vencer. Pensado para consultas de fondo que
   * nadie está esperando. Sin pasarlo, el comportamiento es el de siempre.
   */
  onCustomQuery(
    gql: Query,
    data,
    servidor: boolean = true,
    errorConf?: QueryError,
    silentLoad?: boolean,
    contexto?: ContextoConsulta
  ): Observable<any> {
    const timeoutMs = contexto?.timeoutMs ?? TIMEOUT_CUSTOM_QUERY_MS;
    this.isLoading = true;
    // Usar verificación estricta: solo abrir diálogo si silentLoad NO es explícitamente true
    const shouldShowDialog = silentLoad !== true;
    let { requestId = null } =
      shouldShowDialog
        ? this.cargandoService.openDialog(false, "Buscando...", timeoutMs + MARGEN_DIALOGO_MS)
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
          timeoutMs,
          silenciarAvisoTimeout: contexto?.silenciarAvisoTimeout === true,
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
              const errorMessage = limpiarMensajeGraphQL(res.errors[0].message);
              if (errorConf?.graphError?.show !== false) {
                this.notificacionSnackBar.notification$.next({
                  texto: "Ups! Algo salió mal: " + errorMessage,
                  color: NotificacionColor.danger,
                  duracion: 3,
                });
              }
              // Opt-in, con la misma forma que onGetByTexto: el que llama decide qué mostrar.
              if (errorConf?.graphError?.propagate === true) {
                obs.error({ message: errorMessage, errors: limpiarErroresGraphQL(res.errors) });
                return;
              }
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

  /**
   * Siempre termina (#390). `null` es «no existe» y nada más: un error **no** se disfraza de `null`, porque
   * quien llama decide cosas con ese `null` (ofrecer crear, abrir una caja, dar algo por inexistente).
   *
   * - **Sin `errorConf`**: un error del servidor falla con `{ message, errors }` y uno de red con el error
   *   tal cual. El genérico avisa («Ups!…» / el `warningText`), sin repetir el de red.
   * - **Con `errorConf`** (lo que ya hacían los migrados, sin cambios): un error del servidor emite `null` y
   *   completa, o falla si `graphError.propagate`; el de red falla si `networkError.propagate`, y el aviso
   *   propio sale solo con `networkError.show === true`.
   *
   * `contexto.timeoutMs` fija el corte del link.
   */
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
    warningText?,
    errorConf?: QueryError,
    contexto?: ContextoConsulta
  ): Observable<T> {
    this.isLoading = true;
    let { requestId = null } =
      silentLoad != true
        ? this.cargandoService.openDialog(false, "Buscando...")
        : {};
    return new Observable((obs) => {
      // Una sola salida, pase lo que pase.
      let terminado = false;
      const cerrar = (): boolean => {
        if (terminado) return false;
        terminado = true;
        this.isLoading = false;
        if (silentLoad != true) this.cargandoService.closeDialog(requestId);
        return true;
      };
      const alResponder = (res: any) => {
        if (!cerrar()) return;
        // Ni errores ni data: no se puede decir «no existe».
        if (res.errors == null && res.data == null) res = RESPUESTA_VACIA;
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
          return;
        }
        const errorMessage = limpiarMensajeGraphQL(res.errors[0]?.message);
        if (errorConf?.graphError?.show !== false) {
          this.notificacionSnackBar.notification$.next({
            texto: errorText != null ? errorText : "Ups! Algo salió mal: " + errorMessage,
            color: NotificacionColor.danger,
            duracion: 3,
          });
        }
        if (errorConf == null || errorConf.graphError?.propagate === true) {
          obs.error({ message: errorMessage, errors: limpiarErroresGraphQL(res.errors) });
        } else {
          obs.next(null);
          obs.complete();
        }
      };
      gql
        .fetch(
          { id, page, size, sucId },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
            context: {
              clientName: servidor == null || servidor ? "servidor" : null,
              ...(contexto?.timeoutMs != null ? { timeoutMs: contexto.timeoutMs } : {}),
              ...(contexto?.silenciarAvisoTimeout ? { silenciarAvisoTimeout: true } : {}),
            },
          }
        )
        .pipe(untilDestroyed(this), this.sinRespuestaVacia())
        .subscribe({
          next: alResponder,
          error: (err) => {
            if (!cerrar()) return;
            const avisar = errorConf != null ? errorConf.networkError?.show === true : true;
            if (avisar && !esTimeoutDeLink(err)) {
              this.avisarLecturaFallida(
                warningText != null ? warningText : "Problema al realizar esta operación"
              );
            }
            if (errorConf == null || errorConf.networkError?.propagate === true) {
              obs.error(err);
            }
          },
          // La consulta terminó sin emitir nada: es una respuesta vacía.
          complete: () => alResponder(RESPUESTA_VACIA),
        });
    });
  }

  /**
   * Siempre termina cuando no se pasa `errorConf` (#390): ante un error falla hacia quien llama (el del
   * servidor como `{ message, errors }`, el de red tal cual) y avisa, sin repetir el de red. Una lista vacía
   * sigue siendo `[]`.
   *
   * Con `errorConf` no cambia: falla solo lo que se pidió propagar (`graphError.propagate`,
   * `networkError.propagate`). Quien lo pasa tiene que pedir las dos cosas si no quiere quedar esperando.
   */
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
      let terminado = false;
      const cerrar = (): boolean => {
        if (terminado) return false;
        terminado = true;
        this.cargandoService.closeDialog(requestId);
        this.isLoading = false;
        return true;
      };
      const alResponder = (res: any) => {
        if (!cerrar()) return;
        if (res.errors == null && res.data == null) res = RESPUESTA_VACIA;
        if (res.errors == null) {
          obs.next(res.data["data"]);
          obs.complete();
          return;
        }
        const errorMessage = limpiarMensajeGraphQL(res.errors[0]?.message);
        if (errorConf?.graphError?.show !== false) {
          this.notificacionSnackBar.notification$.next({
            texto: "Ups! Algo salió mal: " + errorMessage,
            color: NotificacionColor.danger,
            duracion: 3,
          });
        }
        if (errorConf == null || errorConf.graphError?.propagate === true) {
          obs.error({ message: errorMessage, errors: limpiarErroresGraphQL(res.errors) });
        }
      };
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
          next: alResponder,
          error: (error) => {
            if (!cerrar()) return;
            if (errorConf == null) {
              // Antes callaba y no terminaba. Se usa en búsquedas por tecla: el aviso no se repite.
              if (!esTimeoutDeLink(error)) {
                this.avisarLecturaFallida("No se pudo consultar: " + mensajeErrorTransporte(error));
              }
              obs.error(error);
              return;
            }
            if (errorConf.networkError?.show === true && !esTimeoutDeLink(error)) {
              this.notificacionSnackBar.notification$.next({
                texto: "Error de red",
                color:
                  errorConf?.networkError?.color || NotificacionColor.danger,
                duracion: 3,
              });
            }
            if (errorConf.networkError?.propagate === true) {
              obs.error(error);
            }
          },
          complete: () => alResponder(RESPUESTA_VACIA),
        });
    });
  }

  /**
   * Siempre termina (#390): emite lo guardado y completa, o falla.
   * - Rechazo del servidor: avisa «Ups!…» y falla con el arreglo de errores (`esRechazoDelServidor`).
   * - Error de red (sin conexión, central offline, HTTP 4xx/5xx): avisa «No se pudo confirmar si se
   *   guardó…» y falla con el error tal cual. **No es un «no se guardó»**: quien lo maneja no debe
   *   invitar a repetir a ciegas (`erroresDeRechazo(err) == null` lo distingue).
   *
   * @param errorConf `networkError.show = false` apaga ese aviso, para quien dice lo suyo.
   */
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
      // Una sola salida, pase lo que pase (#390).
      let terminado = false;
      const cerrar = (): boolean => {
        if (terminado) return false;
        terminado = true;
        this.isLoading = false;
        this.cargandoService.closeDialog(requestId);
        return true;
      };
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
            if (!cerrar()) return;
            // Ni errores ni data: no se puede decir que guardó (y leer `data` de ahí rompía sin terminar).
            if (res.errors == null && res.data == null) res = RESPUESTA_VACIA;
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
                // Se guardó, y falló algo al armar la respuesta. Antes emitía sin completar.
                obs.next(res.data["data"]);
                obs.complete();
              } else {
                obs.error(limpiarErroresGraphQL(res.errors));
              }
            }
          },
          error: (error) => {
            if (!cerrar()) return;
            // Antes, sin `errorConf`, acá no pasaba nada: ni aviso ni error, y quien llamaba quedaba
            // esperando para siempre. El guardado pudo haberse aplicado (el servidor sigue aunque el
            // cliente corte), así que se dice eso y no «no se guardó». Calla quien avisa por su cuenta
            // (`show: false`); el corte por tiempo ya lo avisó el link.
            if (errorConf?.networkError?.show !== false && !esTimeoutDeLink(error)) {
              // Con un status HTTP el servidor respondió: se dice cuál, sin «pudo haberse aplicado».
              const status = error?.networkError?.status ?? error?.status;
              const texto = typeof status === "number" && status > 0
                ? `No se pudo confirmar si se guardó: el servidor respondió HTTP ${status}. Verificá antes de repetir.`
                : "No se pudo confirmar si se guardó (error de red): pudo haberse aplicado, verificá antes de repetir.";
              this.avisarErrorSinRepetir(gql, texto, 8);
            }
            obs.error(error);
          },
          // La mutation terminó sin emitir nada: para quien llama es una respuesta vacía.
          complete: () => {
            if (!cerrar()) return;
            this.avisarErrorSinRepetir(gql, "Ups! Algo salió mal en operacion: " + MENSAJE_RESPUESTA_VACIA, 5);
            obs.error(limpiarErroresGraphQL(RESPUESTA_VACIA.errors));
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
    // Antes `new Date(hoy.getDay() - 1)`: un día de la semana usado como milisegundos (1970).
    let ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
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
      "Buscando..."
    );
    // Siempre termina (#390): ante un error falla hacia quien llama, como onGetById.
    return new Observable((obs) => {
      let terminado = false;
      const cerrar = (): boolean => {
        if (terminado) return false;
        terminado = true;
        this.cargandoService.closeDialog(requestId);
        this.isLoading = false;
        return true;
      };
      const alResponder = (res: any) => {
        if (!cerrar()) return;
        if (res.errors == null && res.data == null) res = RESPUESTA_VACIA;
        if (res.errors == null) {
          obs.next(res.data["data"]);
          obs.complete();
          return;
        }
        const errorMessage = limpiarMensajeGraphQL(res.errors[0]?.message);
        this.notificacionSnackBar.notification$.next({
          texto: "Ups! Algo salió mal: " + errorMessage,
          color: NotificacionColor.danger,
          duracion: 3,
        });
        obs.error({ message: errorMessage, errors: limpiarErroresGraphQL(res.errors) });
      };
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
          next: alResponder,
          error: (error) => {
            if (!cerrar()) return;
            if (!esTimeoutDeLink(error)) {
              this.avisarLecturaFallida("No se pudo consultar: " + mensajeErrorTransporte(error));
            }
            obs.error(error);
          },
          complete: () => alResponder(RESPUESTA_VACIA),
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
