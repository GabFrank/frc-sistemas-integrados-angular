import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Entrada, EntradaInput } from "./entrada.model";
import { DeleteEntradaGQL } from "./graphql/deleteEntrada";
import { FinalizarEntradaGQL } from "./graphql/finalizarEntrada";
import { GetAllEntradasGQL } from "./graphql/getAllEntradas";
import { GetEntradaGQL } from "./graphql/getEntrada";
import { GetEntradaPorFechaGQL } from "./graphql/getEntradasPorFecha";
import { imprimirEntrada, saveEntrada } from "./graphql/graphql-query";
import { ImprimirEntradaGQL } from "./graphql/imprimirEntrada";
import { SaveEntradaGQL } from "./graphql/saveEntrada";

import { GenericCrudService } from "../../../generics/generic-crud.service";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class EntradaService {
  /** Ids cuya finalización quedó sin respuesta en esta sesión: repetirla duplicaría el stock (#527). */
  finalizacionSinConfirmar = new Set<number>();

  constructor(
    private genericService: GenericCrudService,
    private saveEntrada: SaveEntradaGQL,
    private deleteEntrada: DeleteEntradaGQL,
    private getAllEntradas: GetAllEntradasGQL,
    private getEntradasPorFecha: GetEntradaPorFechaGQL,
    private notificacionService: NotificacionSnackbarService,
    private getEntrada: GetEntradaGQL,
    private finalizarEntrega: FinalizarEntradaGQL,
    private imprimirEntrada: ImprimirEntradaGQL,
    private cargandoDialog: CargandoDialogService
  ) {}

  // onSaveCustom y no onSave: onSave completaría usuarioId con el usuario actual, y hoy viaja null (#527).
  // servidor = false: el link por defecto, como antes.
  onSaveEntrada(input: EntradaInput): Observable<Entrada> {
    if (input?.id == null) input.activo = false;
    return this.genericService.onSaveCustom<Entrada>(this.saveEntrada, { entity: input }, false);
  }

  /** `true` si se eliminó; `null` si no (rechazo o corte, los dos avisados). La pantalla ya confirmó. */
  onDeleteEntrada(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteEntrada, id, null, null, false, false);
  }

  onGetEntrada(id): Observable<Entrada> {
    return new Observable((obs) => {
      this.getEntrada
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

  onGetAllEntradas() {
    return new Observable((obs) => {
      this.getAllEntradas
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

  onGetEntradasPorFecha(inicio: Date, fin: Date): Observable<Entrada[]> {
    return new Observable((obs) => {
      if (inicio != null && fin != null) {
        this.getEntradasPorFecha
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

  onImprimirEntrada(id){
    return new Observable(obs => {
      this.imprimirEntrada.fetch({id}, {fetchPolicy: 'no-cache', errorPolicy: 'all'}).pipe(untilDestroyed(this)).subscribe(res => {
        if(res.errors==null){
          obs.next(true)
        } else {
          obs.next(false)
        }
      })
    })
  }
}
