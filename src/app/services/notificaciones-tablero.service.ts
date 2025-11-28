import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { getNotificacionesUsuarioQuery, actualizarEstadoTableroNotificacionMutation } from '../modules/configuracion/inicio-sesion/graphql/graphql-query';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { EstadoNotificacionTablero } from '../shared/enums/estado-notificacion-tablero.enum';

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

  constructor(private apollo: Apollo) {
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
  }

  readonly notificaciones$ = this._notificaciones$.asObservable();
  readonly paginationState$ = this._paginationState$.asObservable();

  setTokenFcm(token: string): void {
    this._tokenFcm$.next(token);
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
      tap(() => {
        Object.values(EstadoNotificacionTablero).forEach(estado => {
          const estadoPagination = this._paginationState$.value[estado];
          if (estadoPagination) {
            this.cargarNotificaciones(estado, estadoPagination.pageIndex, estadoPagination.pageSize);
          }
        });
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
}
