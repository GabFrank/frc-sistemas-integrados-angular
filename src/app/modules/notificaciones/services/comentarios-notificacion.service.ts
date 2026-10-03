import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  GetComentariosNotificacionGQL,
  GetConteoComentariosNotificacionGQL,
  CrearComentarioNotificacionGQL,
  NotificacionComentario
} from '../graphql/comentariosNotificacion.gql';
import { UsuariosConAccesoNotificacionGQL } from '../graphql/usuariosConAccesoNotificacion.gql';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';

@Injectable({
  providedIn: 'root'
})
export class ComentariosNotificacionService {
  private readonly genericService = inject(GenericCrudService);
  private readonly getComentariosGQL = inject(GetComentariosNotificacionGQL);
  private readonly getConteoGQL = inject(GetConteoComentariosNotificacionGQL);
  private readonly crearComentarioGQL = inject(CrearComentarioNotificacionGQL);
  private readonly usuariosConAccesoGQL = inject(UsuariosConAccesoNotificacionGQL);


  private readonly _comentariosPorNotificacion$ = new BehaviorSubject<Map<number, NotificacionComentario[]>>(new Map());
  private readonly _conteosPorNotificacion$ = new BehaviorSubject<Map<number, number>>(new Map());

  readonly comentariosPorNotificacion$ = this._comentariosPorNotificacion$.asObservable();
  readonly conteosPorNotificacion$ = this._conteosPorNotificacion$.asObservable();

  obtenerComentarios(notificacionId: number, errorConf?: QueryError,
                     contexto?: ContextoConsulta): Observable<NotificacionComentario[]> {
    return this.genericService.onCustomQuery(this.getComentariosGQL, { notificacionId }, true, errorConf ?? null, true,
      contexto).pipe(
      tap(comentarios => {
        // Un null (error del servidor) no pisa los comentarios ya cargados.
        if (comentarios == null) { return; }
        const mapActual = new Map(this._comentariosPorNotificacion$.value);
        mapActual.set(notificacionId, comentarios);
        this._comentariosPorNotificacion$.next(mapActual);
      })
    );
  }

  obtenerConteoComentarios(notificacionId: number): Observable<number> {
    return this.genericService.onCustomQuery(this.getConteoGQL, { notificacionId }, true, null, true).pipe(
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
    comentarioPadreId?: number,
    mediaUrl?: string
  ): Observable<NotificacionComentario> {
    return this.genericService.onCustomMutation(this.crearComentarioGQL, {
      notificacionId,
      comentario,
      mediaUrl: mediaUrl || null,
      comentarioPadreId: comentarioPadreId || null
    }).pipe(
      tap(nuevoComentario => {
        const mapActual = new Map(this._comentariosPorNotificacion$.value);
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

  obtenerUsuariosConAcceso(notificacionId: number): Observable<any[]> {
    // Un solo suscriptor, con error: (#390).
    return this.genericService.onCustomQuery(this.usuariosConAccesoGQL, { notificacionId }, true, PROPAGAR_ERROR_DE_RED,
      true, { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true });
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

