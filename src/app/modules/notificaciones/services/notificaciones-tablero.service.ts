import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import {
  notificacionesUsuarioQuery,
  cambiarEstadoTableroNotificacionMutation,
  conteoNotificacionesNoLeidasQuery,
  actualizarTokenFcmMutation,
  marcarNotificacionLeidaMutation,
  enviarNotificacionPersonalizadaMutation,
  usuariosActivosQuery
} from '../graphql/graphql-query';
import { Observable, BehaviorSubject, of, Subject } from 'rxjs';
import { map, tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EstadoNotificacionTablero } from '../enums/estado-notificacion-tablero.enum';
import { ElectronService } from '../../../commons/core/electron/electron.service';

export interface NotificacionData {
  id: number;
  leida: boolean;
  fechaLeida?: string;
  fechaEntrega?: string;
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
  private readonly pageSize = 15;
  private readonly _paginationState$ = new BehaviorSubject<{ [key: string]: PaginationState }>({});
  private readonly _notificaciones$ = new BehaviorSubject<NotificacionesPorEstado>({});
  private readonly _tokenFcm$ = new BehaviorSubject<string>('');
  private readonly _refreshTrigger$ = new Subject<void>();
  private readonly _filtroFechas$ = new BehaviorSubject<FiltroFechas>({ fechaInicio: null, fechaFin: null });
  private isRefreshing = false;

  constructor(
    private apollo: Apollo,
    private electronService: ElectronService
  ) {
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

  private readonly _unreadCount$ = new BehaviorSubject<number>(0);

  readonly notificaciones$ = this._notificaciones$.asObservable();
  readonly paginationState$ = this._paginationState$.asObservable();
  readonly unreadCount$ = this._unreadCount$.asObservable();
  readonly filtroFechas$ = this._filtroFechas$.asObservable();

  setTokenFcm(token: string): void {
    const tokenAnterior = this._tokenFcm$.value;
    this._tokenFcm$.next(token);
    if (token) {
      this.apollo.mutate({
        mutation: actualizarTokenFcmMutation,
        variables: {
          tokenFcm: token
        }
      }).subscribe({
        next: (result: any) => {
          if (result?.data?.data === true) {
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
    return this.apollo.query({
      query: conteoNotificacionesNoLeidasQuery,
      fetchPolicy: 'network-only'
    }).pipe(
      map((result: any) => {
        const count = result.data?.data || 0;
        this._unreadCount$.next(count);
        return count;
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

    this.apollo.query({
      query: notificacionesUsuarioQuery,
      variables: {
        page: pageIndex,
        size: pageSize,
        estadoTablero: estado,
        fechaInicio: filtroFechas.fechaInicio,
        fechaFin: filtroFechas.fechaFin
      },
      fetchPolicy: 'network-only'
    }).pipe(
      map((result: any) => result.data.data),
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
    return this.apollo.mutate({
      mutation: cambiarEstadoTableroNotificacionMutation,
      variables: {
        notificacionId: notificacionId,
        estado: nuevoEstado
      }
    }).pipe(
      tap((result: any) => {
        if (result?.data?.data) {
          this._refreshTrigger$.next();
        }
      })
    );
  }

  marcarComoLeida(notificacionId: number): Observable<any> {
    return this.apollo.mutate({
      mutation: marcarNotificacionLeidaMutation,
      variables: {
        notificacionId: notificacionId
      }
    }).pipe(
      tap((result: any) => {
        if (result?.data?.data) {
          this.actualizarEstadoLeido(notificacionId);
          this.actualizarConteo();
        }
      })
    );
  }

  private moverNotificacionEntreEstados(notificacionId: number, nuevoEstado: string): void {
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

  /**
   * Obtiene la lista de usuarios activos disponibles para enviar notificaciones
   * @returns Observable con array de usuarios activos
   */
  obtenerUsuariosActivos(): Observable<any[]> {
    return this.apollo.query({
      query: usuariosActivosQuery,
      fetchPolicy: 'network-only'
    }).pipe(
      map((result: any) => result.data?.data || []),
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Envía una notificación personalizada a usuarios específicos o a todos
   * @param titulo Título de la notificación
   * @param mensaje Contenido del mensaje de la notificación
   * @param tipoEnvio Tipo de envío: 'todos' o 'especificos'
   * @param usuariosIds Array de IDs de usuarios (requerido si tipoEnvio es 'especificos')
   * @returns Observable con el resultado del envío
   */
  enviarNotificacionPersonalizada(
    titulo: string,
    mensaje: string,
    tipoEnvio: string,
    usuariosIds?: number[]
  ): Observable<any> {
    return this.apollo.mutate({
      mutation: enviarNotificacionPersonalizadaMutation,
      variables: {
        titulo: titulo,
        mensaje: mensaje,
        tipoEnvio: tipoEnvio.toUpperCase(),
        usuariosIds: usuariosIds || null
      }
    }).pipe(
      tap((result: any) => {
        if (result?.data?.data) {
          this._refreshTrigger$.next();
          this.actualizarConteo();
        }
      }),
      map((result: any) => result.data?.data)
    );
  }

  /**
   * Actualiza el filtro de fechas y recarga todas las notificaciones
   * @param fechaInicio Fecha de inicio en formato ISO
   * @param fechaFin Fecha de fin en formato ISO
   */
  actualizarFiltroFechas(fechaInicio: string | null, fechaFin: string | null): void {
    this._filtroFechas$.next({ fechaInicio, fechaFin });
    this.refrescarTodas();
  }

  /**
   * Obtiene el filtro de fechas actual
   * @returns Filtro de fechas actual
   */
  obtenerFiltroFechas(): FiltroFechas {
    return this._filtroFechas$.value;
  }
}

