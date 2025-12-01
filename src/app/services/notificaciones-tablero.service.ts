import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { getNotificacionesUsuarioQuery, actualizarEstadoTableroNotificacionMutation, getConteoNotificacionesNoLeidasQuery, actualizarTokenFcmMutation } from '../modules/configuracion/inicio-sesion/graphql/graphql-query';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { EstadoNotificacionTablero } from '../shared/enums/estado-notificacion-tablero.enum';
import { ElectronService } from '../commons/core/electron/electron.service';

export interface NotificacionData {
  id: number;
  leida: boolean;
  fechaLeida?: string;
  fechaEnvio?: string;
  estadoEnvio: string;
  interactuada: boolean;
  fechaInteraccion?: string;
  accionRealizada?: string;
  estadoTablero: string;
  notificacion: {
    id: number;
    titulo: string;
    mensaje: string;
    tipo: string;
    creadoEn: string;
  };
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  length: number;
  loading: boolean;
}

export interface NotificacionesPorEstado {
  [key: string]: NotificacionData[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesTableroService {
  private readonly pageSize = 10;
  private readonly _paginationState$ = new BehaviorSubject<{ [key: string]: PaginationState }>({});
  private readonly _notificaciones$ = new BehaviorSubject<NotificacionesPorEstado>({});
  private readonly _tokenFcm$ = new BehaviorSubject<string>('');

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

    this.electronService.notificationReceived.subscribe(() => {
      this.actualizarConteo();
      this.refrescarTodas();
    });
  }

  private readonly _unreadCount$ = new BehaviorSubject<number>(0);

  readonly notificaciones$ = this._notificaciones$.asObservable();
  readonly paginationState$ = this._paginationState$.asObservable();
  readonly unreadCount$ = this._unreadCount$.asObservable();

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
            // Ahora sí consultar el conteo
            this.obtenerConteoNoLeidas().subscribe();
          }
        },
        error: (error) => {
          console.error('[NotificacionesTablero] Error en mutación actualizarTokenFcm:', error);
          // Intentar consultar el conteo de todos modos
          this.obtenerConteoNoLeidas().subscribe();
        }
      });
    }
  }


  obtenerConteoNoLeidas(): Observable<number> {
    if (!this._tokenFcm$.value) {
      this._unreadCount$.next(0);
      return of(0);
    }

    return this.apollo.query({
      query: getConteoNotificacionesNoLeidasQuery,
      variables: {
        tokenFcm: this._tokenFcm$.value
      },
      fetchPolicy: 'network-only'
    }).pipe(
      map((result: any) => {
        const count = result.data?.data || 0;
        this._unreadCount$.next(count);
        return count;
      }),
      catchError((error) => {
        console.error('Error al obtener conteo de notificaciones no leídas:', error);
        return of(0);
      })
    );
  }

  private actualizarConteoDesdeNotificaciones(): void {
    this.actualizarConteo();
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

    this.apollo.query({
      query: getNotificacionesUsuarioQuery,
      variables: {
        tokenFcm: this._tokenFcm$.value,
        page: pageIndex,
        size: pageSize,
        estadoTablero: estado
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
      error: (error) => {
        console.error('Error al cargar notificaciones:', error);
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
      const index = notificacionesEstado.findIndex(n => n.id === notificacionId);

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
      mutation: actualizarEstadoTableroNotificacionMutation,
      variables: {
        notificacionUsuarioId: notificacionId,
        estado: nuevoEstado
      }
    }).pipe(
      tap((result: any) => {
        if (result?.data?.data) {
          this.moverNotificacionEntreEstados(notificacionId, nuevoEstado);
        }
      })
    );
  }

  private moverNotificacionEntreEstados(notificacionId: number, nuevoEstado: string): void {
    const notificacionesActuales = this._notificaciones$.value;
    const nuevasNotificaciones = { ...notificacionesActuales };
    let notificacionMovida: NotificacionData | null = null;
    let estadoOrigen: string | null = null;
    Object.keys(nuevasNotificaciones).forEach(estado => {
      const notificacionesEstado = nuevasNotificaciones[estado];
      const index = notificacionesEstado.findIndex(n => n.id === notificacionId);

      if (index !== -1) {
        notificacionMovida = { ...notificacionesEstado[index] };
        notificacionMovida.estadoTablero = nuevoEstado;
        estadoOrigen = estado;
        nuevasNotificaciones[estado] = [
          ...notificacionesEstado.slice(0, index),
          ...notificacionesEstado.slice(index + 1)
        ];
      }
    });

    if (notificacionMovida && estadoOrigen !== nuevoEstado) {
      if (!nuevasNotificaciones[nuevoEstado]) {
        nuevasNotificaciones[nuevoEstado] = [];
      }
      nuevasNotificaciones[nuevoEstado] = [
        notificacionMovida,
        ...nuevasNotificaciones[nuevoEstado]
      ];
    }

    this._notificaciones$.next(nuevasNotificaciones);
    this.actualizarConteoDesdeNotificaciones();
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
    this.obtenerConteoNoLeidas().subscribe(count => {
    });
  }

  public actualizarConteo(): void {
    this.obtenerConteoNoLeidas().subscribe();
  }
}
