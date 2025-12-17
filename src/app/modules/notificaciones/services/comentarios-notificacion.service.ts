import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { 
  GetComentariosNotificacionGQL, 
  GetConteoComentariosNotificacionGQL,
  CrearComentarioNotificacionGQL,
  NotificacionComentario 
} from '../graphql/comentariosNotificacion.gql';

@Injectable({
  providedIn: 'root'
})
export class ComentariosNotificacionService {
  private readonly _comentariosPorNotificacion$ = new BehaviorSubject<Map<number, NotificacionComentario[]>>(new Map());
  private readonly _conteosPorNotificacion$ = new BehaviorSubject<Map<number, number>>(new Map());

  readonly comentariosPorNotificacion$ = this._comentariosPorNotificacion$.asObservable();
  readonly conteosPorNotificacion$ = this._conteosPorNotificacion$.asObservable();

  constructor(
    private getComentariosGQL: GetComentariosNotificacionGQL,
    private getConteoGQL: GetConteoComentariosNotificacionGQL,
    private crearComentarioGQL: CrearComentarioNotificacionGQL
  ) {}

  obtenerComentarios(notificacionId: number): Observable<NotificacionComentario[]> {
    return this.getComentariosGQL.fetch({ notificacionId }, { fetchPolicy: 'network-only' }).pipe(
      map(result => result.data?.data || []),
      tap(comentarios => {
        const mapActual = new Map(this._comentariosPorNotificacion$.value);
        mapActual.set(notificacionId, comentarios);
        this._comentariosPorNotificacion$.next(mapActual);
      })
    );
  }

  obtenerConteoComentarios(notificacionId: number, forceRefresh: boolean = false): Observable<number> {
    const fetchPolicy = forceRefresh ? 'network-only' : 'cache-first';
    return this.getConteoGQL.fetch({ notificacionId }, { fetchPolicy }).pipe(
      map(result => result.data?.data || 0),
      tap(conteo => {
        const mapActual = new Map(this._conteosPorNotificacion$.value);
        mapActual.set(notificacionId, conteo);
        this._conteosPorNotificacion$.next(mapActual);
      })
    );
  }

  crearComentario(
    notificacionId: number, 
    comentario: string, 
    comentarioPadreId?: number
  ): Observable<NotificacionComentario> {
    return this.crearComentarioGQL.mutate({
      notificacionId,
      comentario,
      comentarioPadreId: comentarioPadreId || null
    }).pipe(
      map(result => {
        if (!result.data?.data) {
          throw new Error('Error al crear comentario');
        }
        return result.data.data;
      }),
      tap(nuevoComentario => {
        const mapActual = new Map(this._comentariosPorNotificacion$.value);
        // Crear una copia del array para evitar el error "object is not extensible"
        const comentariosExistentes = mapActual.get(notificacionId) || [];
        const comentarios = [...comentariosExistentes, nuevoComentario];
        mapActual.set(notificacionId, comentarios);
        this._comentariosPorNotificacion$.next(mapActual);

        const conteosActual = new Map(this._conteosPorNotificacion$.value);
        const conteoActual = conteosActual.get(notificacionId) || 0;
        conteosActual.set(notificacionId, conteoActual + 1);
        this._conteosPorNotificacion$.next(conteosActual);
      })
    );
  }

  obtenerComentariosDesdeCache(notificacionId: number): NotificacionComentario[] | null {
    const mapActual = this._comentariosPorNotificacion$.value;
    return mapActual.get(notificacionId) || null;
  }

  obtenerConteoDesdeCache(notificacionId: number): number | null {
    const mapActual = this._conteosPorNotificacion$.value;
    return mapActual.get(notificacionId) ?? null;
  }

  limpiarCache(notificacionId: number): void {
    const mapComentarios = new Map(this._comentariosPorNotificacion$.value);
    mapComentarios.delete(notificacionId);
    this._comentariosPorNotificacion$.next(mapComentarios);

    const mapConteos = new Map(this._conteosPorNotificacion$.value);
    mapConteos.delete(notificacionId);
    this._conteosPorNotificacion$.next(mapConteos);
  }
}

