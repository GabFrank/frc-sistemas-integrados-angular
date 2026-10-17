import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { Salida, SalidaInput } from './salida.model';
import { DeleteSalidaGQL } from './graphql/deleteSalida';
import { GetAllSalidasGQL } from './graphql/getAllSalidas';
import { saveSalida } from './graphql/graphql-query';
import { SaveSalidaGQL } from './graphql/saveSalida';
import { FinalizarSalidaGQL } from './graphql/finalizarSalida';
import { GetSalidaPorFechaGQL } from './graphql/getEntradasPorFecha';
import { GetSalidaGQL } from './graphql/getSalida';

import { GenericCrudService } from "../../../generics/generic-crud.service";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class SalidaService {
  /** Ids cuya finalización quedó sin respuesta en esta sesión: repetirla duplicaría el stock (#527). */
  finalizacionSinConfirmar = new Set<number>();

  constructor(
    private genericService: GenericCrudService,
    private saveSalida: SaveSalidaGQL,
    private deleteSalida: DeleteSalidaGQL,
    private getAllSalidas: GetAllSalidasGQL,
    private getSalidasPorFecha: GetSalidaPorFechaGQL,
    private notificacionService: NotificacionSnackbarService,
    private getSalida: GetSalidaGQL,
    private finalizarEntrega: FinalizarSalidaGQL
  ) {}

  // onSaveCustom y no onSave: onSave completaría usuarioId con el usuario actual, y hoy viaja null (#527).
  // servidor = false: el link por defecto, como antes.
  onSaveSalida(input: SalidaInput): Observable<Salida> {
    if (input?.id == null) input.activo = false;
    return this.genericService.onSaveCustom<Salida>(this.saveSalida, { entity: input }, false);
  }

  /** `true` si se eliminó; `null` si no (rechazo o corte, los dos avisados). La pantalla ya confirmó. */
  onDeleteSalida(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteSalida, id, null, null, false, false);
  }

  onGetSalida(id): Observable<Salida> {
    return new Observable((obs) => {
      this.getSalida
        .fetch({ id }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data['data']);
          } else {
            this.notificacionService.notification$.next({
              texto: `Ups, ocurrio algun error: ${res.errors[0].message}`,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
  }

  onGetAllSalidas() {
    return new Observable((obs) => {
      this.getAllSalidas
        .fetch({}, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data);
          } else {
            this.notificacionService.notification$.next({
              texto: `Ups, ocurrio algun error: ${res.errors[0]}`,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
  }

  onGetSalidasPorFecha(inicio: Date, fin: Date): Observable<Salida[]> {
    return new Observable((obs) => {
      if (inicio != null && fin != null) {
        this.getSalidasPorFecha
          .fetch(
            {
              inicio,
              fin,
            },
            {
              fetchPolicy: "no-cache",
              errorPolicy: "all",
            }
          ).pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res.errors == null) {
              obs.next(res.data);
            } else {
              this.notificacionService.notification$.next({
                texto: "Ups!, algo salio mal: " + res.errors[0].message,
                duracion: 3,
                color: NotificacionColor.danger,
              });
            }
          });
      } else {
      }
    });
  }
  /** No es idempotente en el filial (un movimiento de stock por ítem en cada llamada): ver finalizacionSinConfirmar. */
  onFinalizarEntrega(id: number): Observable<boolean> {
    return this.genericService.onCustomMutation(this.finalizarEntrega, { id }, false);
  }
}
