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

@Injectable({
  providedIn: 'root'
})
export class SalidaService {

  constructor(
    private saveSalida: SaveSalidaGQL,
    private deleteSalida: DeleteSalidaGQL,
    private getAllSalidas: GetAllSalidasGQL,
    private getSalidasPorFecha: GetSalidaPorFechaGQL,
    private notificacionService: NotificacionSnackbarService,
    private getSalida: GetSalidaGQL,
    private finalizarEntrega: FinalizarSalidaGQL
  ) {}

  onSaveSalida(input: SalidaInput) {
    if(input?.id==null) input.activo = false;
    return new Observable((obs) => {
      this.saveSalida
        .mutate(
          {
            entity: input,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
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

  onDeleteSalida(id: number) {
    return new Observable((obs) => {
      this.deleteSalida
        .mutate(
          {
            id,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
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

  onGetSalida(id): Observable<Salida> {
    return new Observable((obs) => {
      this.getSalida
        .fetch({ id }, { fetchPolicy: "no-cache", errorPolicy: "all" })
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
        .fetch({}, { fetchPolicy: "no-cache", errorPolicy: "all" })
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
          )
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
      .mutate({ id }, { fetchPolicy: "no-cache", errorPolicy: "all" })
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
}
