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

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class EntradaService {
  constructor(
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

  onSaveEntrada(input: EntradaInput) {
    if(input?.id==null) input.activo = false;
    return new Observable((obs) => {
      this.saveEntrada
        .mutate(
          {
            entity: input,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            this.notificacionService.notification$.next({
              texto: "Guardado con éxito",
              color: NotificacionColor.success,
              duracion: 3,
            });
            obs.next(res.data);
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

  onDeleteEntrada(id: number) {
    return new Observable((obs) => {
      this.deleteEntrada
        .mutate(
          {
            id,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            this.notificacionService.notification$.next({
              texto: `Eliminado con éxito!`,
              color: NotificacionColor.success,
              duracion: 2,
            });
            obs.next(true);
          } else {
            obs.next(false)
            this.notificacionService.notification$.next({
              texto: `Ups, ocurrio algun error: ${res.errors[0].message}`,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
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
              console.log(res.errors[0].message);
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
  onFinalizarEntrega(id) {
    return new Observable(obs => {
      this.finalizarEntrega
      .mutate({ id }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res.errors == null) {
          obs.next(true)
          this.notificacionService.notification$.next({
            texto: "Guardado con éxito!!",
            duracion: 2,
            color: NotificacionColor.success,
          });
        } else {
          obs.next(false)
          this.notificacionService.notification$.next({
            texto: "Ups!, algo salio mal: " + res.errors[0].message,
            duracion: 3,
            color: NotificacionColor.danger,
          });
        }
      });
    })
  }

  onImprimirEntrada(id){
    return new Observable(obs => {
      this.imprimirEntrada.fetch({id}, {fetchPolicy: 'no-cache', errorPolicy: 'all'}).pipe(untilDestroyed(this)).subscribe(res => {
        if(res.errors==null){
          obs.next(true)
        } else {
          obs.next(false)
          console.log(res.errors[0].message)
        }
      })
    })
  }
}
