import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, Subject } from 'rxjs';
import { map, tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EstadoNotificacionTablero } from '../enums/estado-notificacion-tablero.enum';
import { ElectronService } from '../../../commons/core/electron/electron.service';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { MainService } from '../../../main.service';
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
  private readonly _paginationState$ = new BehaviorSubject<{ [key: string]: PaginationState }>({});
  private readonly _notificaciones$ = new BehaviorSubject<NotificacionesPorEstado>({});
  private readonly _tokenFcm$ = new BehaviorSubject<string>('');
  private readonly _refreshTrigger$ = new Subject<void>();
  private readonly _filtroFechas$ = new BehaviorSubject<FiltroFechas>({ fechaInicio: null, fechaFin: null });
  private readonly _unreadCount$ = new BehaviorSubject<number>(0);

  private isRefreshing = false;

  readonly notificaciones$ = this._notificaciones$.asObservable();
  readonly paginationState$ = this._paginationState$.asObservable();
  readonly unreadCount$ = this._unreadCount$.asObservable();
  readonly filtroFechas$ = this._filtroFechas$.asObservable();

  constructor() {
    Object.values(EstadoNotificacionTablero).forEach(estado => {
      this._paginationState$.next({
        ...this._paginationState$.value,
        [estado]: {
          pageIndex: 0,
          pageSize: this.pageSize,
          length: 0,
          loading: false
        }
      });
    });

    this._refreshTrigger$.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refrescarTodas();
        setTimeout(() => {
          this.obtenerConteoNoLeidas().subscribe(() => {
            this.isRefreshing = false;
          });
        }, 800);
      }
    });

    this.electronService.notificationReceived.subscribe(() => {
      this.actualizarConteo();
      this._refreshTrigger$.next();
    });
  }

  setTokenFcm(token: string): void {
    this._tokenFcm$.next(token);
    if (token && localStorage.getItem("token")) {
      this.genericService.onCustomMutation(this.actualizarTokenFcmGQL, { tokenFcm: token }).subscribe({
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
    return this.genericService.onCustomQuery(this.conteoNotificacionesNoLeidasGQL, {}, true, null, true).pipe(
      map((count: any) => {
        const result = count || 0;
        this._unreadCount$.next(result);
        return result;
      }),
      catchError(() => {
        return of(0);
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

  cargarNotificaciones(estado: string, pageIndex: number, pageSize: number): void {
    const currentState = this._paginationState$.value;
    if (!currentState[estado]) {
      currentState[estado] = {
        pageIndex: 0,
        pageSize: this.pageSize,
        length: 0,
        loading: false
      };
    }

    this._paginationState$.next({
      ...currentState,
      [estado]: {
        ...currentState[estado],
        loading: true
      }
    });

    const filtroFechas = this._filtroFechas$.value;

    this.genericService.onCustomQuery(this.notificacionesUsuarioGQL, {
      page: pageIndex,
      size: pageSize,
      estadoTablero: estado,
      fechaInicio: filtroFechas.fechaInicio,
      fechaFin: filtroFechas.fechaFin
    }, true, null, true).pipe(
      tap((data: any) => {
        const notificacionesActuales = this._notificaciones$.value;
        this._notificaciones$.next({
          ...notificacionesActuales,
          [estado]: data.content
        });

        this._paginationState$.next({
          ...this._paginationState$.value,
          [estado]: {
            pageIndex: data.pageNumber,
            pageSize: data.pageSize,
            length: data.totalElements,
            loading: false
          }
        });
        this.actualizarConteoDesdeNotificaciones();
      })
    ).subscribe({
      error: () => {
        this._paginationState$.next({
          ...this._paginationState$.value,
          [estado]: {
            ...this._paginationState$.value[estado],
            loading: false
          }
        });
      }
    });
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
    return this.genericService.onCustomMutation(this.marcarNotificacionLeidaGQL, {
      notificacionId: notificacionId
    }).pipe(
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
    Object.values(EstadoNotificacionTablero).forEach(estado => {
      const estadoPagination = this._paginationState$.value[estado];
      if (estadoPagination) {
        this.cargarNotificaciones(estado, 0, estadoPagination.pageSize);
      }
    });
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

