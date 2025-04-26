import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { MainService } from "../../../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import { DeletePrecioPorSucursalGQL } from "./graphql/deletePrecioPorSucursal";
import { PrecioPorSucursalPorPresentacionIdGQL } from "./graphql/precioPorSucursalPorPresentacionId";
import { savePrecioPorSucursalGQL } from "./graphql/savePrecioPorSucursal";
import { PrecioPorSucursalInput } from "./precio-por-sucursal-input.model";
import { PrecioPorSucursal } from "./precio-por-sucursal.model";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class PrecioPorSucursalService {
  datosObs = new BehaviorSubject<PrecioPorSucursal[]>(null);

  constructor(
    private savePrecioPorSucursal: savePrecioPorSucursalGQL,
    private notificacionSnackBar: NotificacionSnackbarService,
    private deletePrecioPorSucursal: DeletePrecioPorSucursalGQL,
    private getPrecioPorSucursalPorPresentacion: PrecioPorSucursalPorPresentacionIdGQL,
    public mainService: MainService,
    private dialogoService: DialogosService
  ) {}

  onSave(input: PrecioPorSucursalInput): Observable<any> {
    input.usuarioId = this.mainService?.usuarioActual?.id;
    return new Observable((obs) => {
      this.savePrecioPorSucursal
        .mutate(
          {
            entity: input,
          },
          {
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data.data);
            this.notificacionSnackBar.notification$.next({
              texto: "Precio guardado con éxito",
              color: NotificacionColor.success,
              duracion: 2,
            });
          } else {
            this.notificacionSnackBar.notification$.next({
              texto: "Ups! Algo salió mal... =(",
              color: NotificacionColor.danger,
              duracion: 2,
            });
          }
        });
    });
  }

  onDelete(precio: PrecioPorSucursal): Observable<boolean> {
    return new Observable((obs) => {
      this.dialogoService
        .confirm("Atención!!", "Realmente desea elminar este precio?", null, [
          `Precio: ${precio?.precio}`,
          `Tipo Precio: ${precio?.tipoPrecio?.descripcion}`,
          `Principal: ${precio?.principal}`,
        ]).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res) {
            this.deletePrecioPorSucursal
              .mutate(
                {
                  id: precio.id,
                },
                {
                  errorPolicy: "all",
                  fetchPolicy: 'no-cache'
                }
              ).pipe(untilDestroyed(this))
              .subscribe((res) => {
                if (!res.errors) {
                  obs.next(true);
                  this.notificacionSnackBar.notification$.next({
                    texto: "Precio eliminado con éxito",
                    color: NotificacionColor.success,
                    duracion: 2,
                  });
                } else {
                  this.notificacionSnackBar.notification$.next({
                    texto: "Ups! Algo salió mal... =(",
                    color: NotificacionColor.danger,
                    duracion: 2,
                  });
                  obs.next(false);
                }
              });
          }
        });
    });
  }

  onGetPrecioPorSurursalPorPresentacionId(id: number) {
    return this.getPrecioPorSucursalPorPresentacion.fetch(
      {
        id,
      },
      {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
      }
    );
  }
}
