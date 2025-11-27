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
  private readonly paginationState$ = new BehaviorSubject<{ [key: string]: PaginationState }>({});
  private readonly notificaciones$ = new BehaviorSubject<NotificacionesPorEstado>({});
  private readonly tokenFcm$ = new BehaviorSubject<string>('');

  constructor(private apollo: Apollo) {
    Object.values(EstadoNotificacionTablero).forEach(estado => {
      this.paginationState$.next({
        ...this.paginationState$.value,
        [estado]: {
          pageIndex: 0,
          pageSize: this.pageSize,
          length: 0,
          loading: false
        }
      });
    });
  }

  get notificaciones(): Observable<NotificacionesPorEstado> {
    return this.notificaciones$.asObservable();
  }

  get paginationState(): Observable<{ [key: string]: PaginationState }> {
    return this.paginationState$.asObservable();
  }

  setTokenFcm(token: string): void {
    this.tokenFcm$.next(token);
  }

  cargarNotificaciones(estado: string, pageIndex: number, pageSize: number): void {
    const currentState = this.paginationState$.value;
    if (!currentState[estado]) {
      currentState[estado] = {
        pageIndex: 0,
        pageSize: this.pageSize,
        length: 0,
        loading: false
      };
    }

    this.paginationState$.next({
      ...currentState,
      [estado]: {
        ...currentState[estado],
        loading: true
      }
    });

    this.apollo.query({
      query: getNotificacionesUsuarioQuery,
      variables: {
        tokenFcm: this.tokenFcm$.value,
        page: pageIndex,
        size: pageSize,
        estadoTablero: estado
      },
      fetchPolicy: 'network-only'
    }).pipe(
      map((result: any) => result.data.data),
      tap((data: any) => {
        const notificacionesActuales = this.notificaciones$.value;
        this.notificaciones$.next({
          ...notificacionesActuales,
          [estado]: data.content
        });

        this.paginationState$.next({
          ...this.paginationState$.value,
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
        this.paginationState$.next({
          ...this.paginationState$.value,
          [estado]: {
            ...this.paginationState$.value[estado],
            loading: false
          }
        });
      }
    });
  }

  actualizarEstadoLeido(notificacionId: number): void {
    const notificacionesActuales = this.notificaciones$.value;
    let actualizado = false;
    
    Object.keys(notificacionesActuales).forEach(estado => {
      const notificacionesEstado = notificacionesActuales[estado];
      const index = notificacionesEstado.findIndex(n => n.id === notificacionId);
      
      if (index !== -1) {
        notificacionesEstado[index] = {
          ...notificacionesEstado[index],
          leida: true,
          fechaLeida: new Date().toISOString()
        };
        actualizado = true;
      }
    });
    
    if (actualizado) {
      this.notificaciones$.next({ ...notificacionesActuales });
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
          const estadoPagination = this.paginationState$.value[estado];
          if (estadoPagination) {
            this.cargarNotificaciones(estado, estadoPagination.pageIndex, estadoPagination.pageSize);
          }
        });
      })
    );
  }

  getNotificacionesPorEstado(estado: string): Observable<NotificacionData[]> {
    return this.notificaciones.pipe(
      map(notificaciones => notificaciones[estado] || [])
    );
  }

  getPaginationState(estado: string): Observable<PaginationState> {
    return this.paginationState.pipe(
      map(states => states[estado] || {
        pageIndex: 0,
        pageSize: this.pageSize,
        length: 0,
        loading: false
      })
    );
  }

  refrescarTodas(): void {
    Object.values(EstadoNotificacionTablero).forEach(estado => {
      const estadoPagination = this.paginationState$.value[estado];
      if (estadoPagination) {
        this.cargarNotificaciones(estado, 0, estadoPagination.pageSize);
      }
    });
  }
}
