import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, Subject, combineLatest } from 'rxjs';
import { map, tap, catchError, debounceTime, finalize } from 'rxjs/operators';
import { EstadoNotificacionTablero } from '../enums/estado-notificacion-tablero.enum';
import { ElectronService } from '../../../commons/core/electron/electron.service';
import { ContextoConsulta, GenericCrudService } from '../../../generics/generic-crud.service';
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../generics/generic-crud.constantes';

/** Consultas de fondo del tablero: nadie las espera, pero sin esto con el central sin responder no terminan (#390). */
const CONSULTA_TABLERO: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
import { MainService } from '../../../main.service';
import { PaginacionLista } from '../../../shared/components/paginacion/paginacion-lista';
import { PageEvent } from '@angular/material/paginator';
import { NotificacionesUsuarioGQL } from '../graphql/notificacionesUsuario.gql';
import {
  MarcarNotificacionLeidaGQL,
  MarcarTodasNotificacionesLeidasGQL,
  CambiarEstadoTableroNotificacionGQL,
  ActualizarTokenFcmGQL
} from '../graphql/notificacionMutations.gql';
import { ConteoNotificacionesNoLeidasGQL } from '../graphql/notificacionQueries.gql';
import { UsuariosActivosGQL } from '../graphql/usuariosActivos.gql';
import { EnviarNotificacionPersonalizadaGQL } from '../graphql/enviarNotificacionPersonalizada.gql';

export interface NotificacionData {
  id: number;
  leida: boolean;
  fechaLeida?: string;
  fechaEntrega?: string;
  fechaEnvio?: string;
  estadoEnvio?: string;
  interactuada?: boolean;
  fechaInteraccion?: string;
  accionRealizada?: string;
  estadoTablero?: string;
  notificacion: {
    id: number;
    titulo: string;
    mensaje: string;
    tipo: string;
    data?: string;
    estadoTablero: string;
    verificadoPorUsuario?: {
      id: number;
      nickname: string;
    };
    fechaVerificacion?: string;
    creadoEn: string;
    conteoComentarios?: number;
  };
  creadoEn: string;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  length: number;
  loading: boolean;
}

export interface FiltroFechas {
  fechaInicio: string | null;
  fechaFin: string | null;
}

export interface NotificacionesPorEstado {
  [key: string]: NotificacionData[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesTableroService {
  private readonly genericService = inject(GenericCrudService);
  private readonly mainService = inject(MainService);
  private readonly electronService = inject(ElectronService);
  private readonly notificacionesUsuarioGQL = inject(NotificacionesUsuarioGQL);
  private readonly marcarNotificacionLeidaGQL = inject(MarcarNotificacionLeidaGQL);
  private readonly marcarTodasNotificacionesLeidasGQL = inject(MarcarTodasNotificacionesLeidasGQL);
  private readonly cambiarEstadoTableroNotificacionGQL = inject(CambiarEstadoTableroNotificacionGQL);
  private readonly actualizarTokenFcmGQL = inject(ActualizarTokenFcmGQL);
  private readonly conteoNotificacionesNoLeidasGQL = inject(ConteoNotificacionesNoLeidasGQL);
  private readonly usuariosActivosGQL = inject(UsuariosActivosGQL);
  private readonly enviarNotificacionPersonalizadaGQL = inject(EnviarNotificacionPersonalizadaGQL);

  private readonly pageSize = 15;
  /**
   * Una lista paginada en el central por columna del tablero (#772): página, tamaño, total y carga. Las tarjetas que
   * se ven siguen en `_notificaciones$`, porque arrastrar y «leída» las cambian en el momento.
   */
  readonly columnas: { [estado: string]: PaginacionLista<NotificacionData> } = {};
  private readonly _notificaciones$ = new BehaviorSubject<NotificacionesPorEstado>({});
  private readonly _tokenFcm$ = new BehaviorSubject<string>('');
  private readonly _refreshTrigger$ = new Subject<void>();
  private readonly _filtroFechas$ = new BehaviorSubject<FiltroFechas>({ fechaInicio: null, fechaFin: null });
  private readonly _unreadCount$ = new BehaviorSubject<number>(0);

  private isRefreshing = false;
  /** Llegó un disparo mientras se refrescaba: se relanza uno al terminar, para no perder el push. */
  private refrescoPendiente = false;

  readonly notificaciones$ = this._notificaciones$.asObservable();
  readonly paginationState$: Observable<{ [key: string]: PaginationState }>;
  readonly unreadCount$ = this._unreadCount$.asObservable();
  readonly filtroFechas$ = this._filtroFechas$.asObservable();

  constructor() {
    Object.values(EstadoNotificacionTablero).forEach(estado => {
      const columna = new PaginacionLista<NotificacionData>({
        cargar: (page, size) => this.consultarColumna(estado, page, size),
        pageSize: this.pageSize,
        pageSizeOptions: [15, 25, 50, 100],
      });
      // Cada página que llega (o la columna vacía si falló un filtro nuevo) reemplaza las tarjetas de esa columna.
      columna.estado$.subscribe(e => {
        if (e.cargando) return;
        this._notificaciones$.next({ ...this._notificaciones$.value, [estado]: e.items });
        this.actualizarConteoDesdeNotificaciones();
      });
      this.columnas[estado] = columna;
    });
    this.paginationState$ = combineLatest(
      Object.entries(this.columnas).map(([estado, columna]) => columna.estado$.pipe(
        map(e => [estado, { pageIndex: e.pageIndex, pageSize: e.pageSize, length: e.total, loading: e.cargando }] as const)
      ))
    ).pipe(map(pares => Object.fromEntries(pares) as { [key: string]: PaginationState }));

    // Sin distinctUntilChanged: el trigger emite siempre undefined, así que solo pasaba el primer disparo de la
    // sesión. isRefreshing se baja en finalize: sin respuesta del central quedaba en true para siempre (#390).
    this._refreshTrigger$.pipe(
      debounceTime(500)
    ).subscribe(() => {
      if (this.isRefreshing) {
        this.refrescoPendiente = true;
        return;
      }
      this.isRefreshing = true;
      this.refrescarTodas();
      setTimeout(() => {
        this.obtenerConteoNoLeidas().pipe(
          finalize(() => {
            this.isRefreshing = false;
            if (this.refrescoPendiente) {
              this.refrescoPendiente = false;
              this._refreshTrigger$.next();
            }
          })
        ).subscribe();
      }, 800);
    });

    this.electronService.notificationReceived.subscribe(() => {
      this.actualizarConteo();
      this._refreshTrigger$.next();
    });
  }

  setTokenFcm(token: string): void {
    this._tokenFcm$.next(token);
    if (token && localStorage.getItem("token")) {
      // De fondo: sin «Guardando…», sin aviso propio ni el del timeout, el usuario no pidió nada (#501, #528)
      this.genericService.onCustomMutation(this.actualizarTokenFcmGQL, { tokenFcm: token }, true, true,
        { silenciarAvisoTimeout: true }).subscribe({
        next: (res: any) => {
          if (res === true) {
            this.obtenerConteoNoLeidas().subscribe();
          }
        },
        error: () => {
          this.obtenerConteoNoLeidas().subscribe();
        }
      });
    }
  }

  obtenerConteoNoLeidas(): Observable<number> {
    if (this.mainService.authenticationSub.value !== true) {
      return of(0);
    }
    return this.genericService.onCustomQuery(this.conteoNotificacionesNoLeidasGQL, {}, true, PROPAGAR_ERROR_DE_RED, true,
      CONSULTA_TABLERO).pipe(
      map((count: any) => {
        // null = error del servidor: se conserva el último conteo en vez de borrar el badge.
        if (count == null) { return this._unreadCount$.value; }
        this._unreadCount$.next(count);
        return count;
      }),
      catchError(() => {
        return of(this._unreadCount$.value);
      })
    );
  }

  private actualizarConteoDesdeNotificaciones(): void {
    const notificaciones = this._notificaciones$.value;
    let conteoNoLeidas = 0;

    Object.values(notificaciones).forEach(notificacionesEstado => {
      conteoNoLeidas += notificacionesEstado.filter(n => !n.leida).length;
    });

    this._unreadCount$.next(conteoNoLeidas);
  }

  /** Pide una página de la columna; la columna descarta la respuesta de un pedido viejo (#772). */
  cargarNotificaciones(estado: string, pageIndex: number, pageSize: number): void {
    const columna = this.columnas[estado];
    if (!columna) return;
    if (pageIndex === 0 && pageSize === columna.pageSize) {
      columna.filtrar();
    } else {
      columna.onPage({ pageIndex, pageSize } as PageEvent);
    }
  }

  private consultarColumna(estado: string, page: number, size: number): Observable<{ getContent: NotificacionData[]; getTotalElements: number } | null> {
    if (this.mainService.authenticationSub.value !== true) {
      return of(null);
    }
    const filtroFechas = this._filtroFechas$.value;
    return this.genericService.onCustomQuery(this.notificacionesUsuarioGQL, {
      page,
      size,
      estadoTablero: estado,
      fechaInicio: filtroFechas.fechaInicio,
      fechaFin: filtroFechas.fechaFin
    }, true, PROPAGAR_ERROR_DE_RED, true, CONSULTA_TABLERO).pipe(
      // null = error del servidor (ya avisado): la columna vuelve a la última página que cargó.
      map((data: any) => data == null ? null : { getContent: data.content || [], getTotalElements: data.totalElements || 0 })
    );
  }

  actualizarEstadoLeido(notificacionId: number): void {
    const notificacionesActuales = this._notificaciones$.value;
    let actualizado = false;
    const nuevasNotificaciones = { ...notificacionesActuales };

    Object.keys(nuevasNotificaciones).forEach(estado => {
      const notificacionesEstado = nuevasNotificaciones[estado];
      const index = notificacionesEstado.findIndex(n => n.notificacion.id === notificacionId);

      if (index !== -1) {
        const nuevoEstadoArray = [...notificacionesEstado];
        nuevoEstadoArray[index] = {
          ...nuevoEstadoArray[index],
          leida: true,
          fechaLeida: new Date().toISOString()
        };
        nuevasNotificaciones[estado] = nuevoEstadoArray;
        actualizado = true;
      }
    });

    if (actualizado) {
      this._notificaciones$.next(nuevasNotificaciones);
      this.actualizarConteoDesdeNotificaciones();
    }
  }

  actualizarEstadoTablero(notificacionId: number, nuevoEstado: string): Observable<any> {
    return this.genericService.onCustomMutation(this.cambiarEstadoTableroNotificacionGQL, {
      notificacionId: notificacionId,
      estado: nuevoEstado
    }).pipe(
      tap((res: any) => {
        if (res) {
          this._refreshTrigger$.next();
        }
      })
    );
  }

  marcarComoLeida(notificacionId: number): Observable<any> {
    // Se dispara al abrir una notificación: sin «Guardando…» ni aviso del timeout (la tarjeta queda sin
    // leer y se ve). El central nunca rechaza, devuelve false (#501, #528)
    return this.genericService.onCustomMutation(this.marcarNotificacionLeidaGQL, {
      notificacionId: notificacionId
    }, true, true, { silenciarAvisoTimeout: true }).pipe(
      tap((res: any) => {
        if (res) {
          this.actualizarEstadoLeido(notificacionId);
          this.actualizarConteo();
        }
      })
    );
  }

  marcarTodasComoLeidas(): Observable<any> {
    return this.genericService.onCustomMutation(this.marcarTodasNotificacionesLeidasGQL, {}).pipe(
      tap((res: any) => {
        if (res) {
          this.refrescarTodas();
          this.actualizarConteo();
        }
      })
    );
  }

  refrescarTodas(): void {
    Object.values(this.columnas).forEach(columna => columna.filtrar());
  }

  actualizarConteoNoLeidas(): void {
    this.obtenerConteoNoLeidas().subscribe();
  }

  public actualizarConteo(): void {
    this.obtenerConteoNoLeidas().subscribe();
  }

  obtenerUsuariosActivos(): Observable<any[]> {
    return this.genericService.onCustomQuery(this.usuariosActivosGQL, {}, true, null, true).pipe(
      map((res: any) => res || []),
      catchError(() => {
        return of([]);
      })
    );
  }

  enviarNotificacionPersonalizada(
    titulo: string,
    mensaje: string,
    tipoEnvio: string,
    usuariosIds?: number[]
  ): Observable<any> {
    return this.genericService.onCustomMutation(this.enviarNotificacionPersonalizadaGQL, {
      titulo: titulo,
      mensaje: mensaje,
      tipoEnvio: tipoEnvio.toUpperCase(),
      usuariosIds: usuariosIds || null
    }).pipe(
      tap((res: any) => {
        if (res) {
          this._refreshTrigger$.next();
          this.actualizarConteo();
        }
      })
    );
  }

  actualizarFiltroFechas(fechaInicio: string | null, fechaFin: string | null): void {
    this._filtroFechas$.next({ fechaInicio, fechaFin });
    this.refrescarTodas();
  }

  obtenerFiltroFechas(): FiltroFechas {
    return this._filtroFechas$.value;
  }
}

