import { Injectable } from "@angular/core";
import { Observable } from "@apollo/client/utilities";
import { BehaviorSubject } from "rxjs";
import { MainService } from "../../../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { DeletePrecioPorSucursalGQL } from "./graphql/deletePrecioPorSucursal";
import { PrecioPorSucursalPorCodigoIdGQL } from "./graphql/precioPorSucursalPorCodigoId";
import { PrecioPorSucursalPorProductoIdGQL } from "./graphql/precioPorSucursalPorProductoId";
import { PrecioPorSucursalPorSucursalIdGQL } from "./graphql/precioPorSucursalPorSucursalId";
import { savePrecioPorSucursalGQL } from "./graphql/savePrecioPorSucursal";
import { PrecioPorSucursalInput } from "./precio-por-sucursal-input.model";
import { PrecioPorSucursal } from "./precio-por-sucursal.model";

@Injectable({
  providedIn: "root",
})
export class PrecioPorSucursalService {
  datosObs = new BehaviorSubject<PrecioPorSucursal[]>(null);

  constructor(
    private savePrecioPorSucursal: savePrecioPorSucursalGQL,
    private precioPorSucursalPorSucursalId: PrecioPorSucursalPorSucursalIdGQL,
    private precioPorSucursalPorCodigoId: PrecioPorSucursalPorCodigoIdGQL,
    private precioPorSucursalPorProductoId: PrecioPorSucursalPorProductoIdGQL,
    private notificacionSnackBar: NotificacionSnackbarService,
    private deletePrecioPorSucursal: DeletePrecioPorSucursalGQL,
    private mainService: MainService
  ) {}

  onGetPorProductoId(id: number) {
    this.precioPorSucursalPorProductoId
      .fetch(
        {
          id,
        },
        {
          fetchPolicy: "no-cache",
        }
      )
      .subscribe((res) => {
        if (!res.errors) {
          this.datosObs.next(res.data.data);
        }
      });
  }

  onSave(input: PrecioPorSucursalInput): Observable<any> {
    input.usuarioId = this.mainService?.usuarioActual?.id;
    return new Observable((obs) => {
      this.savePrecioPorSucursal
        .mutate({
          entity: input,
        })
        .subscribe((res) => {
          if (!res.errors) {
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

  onDelete(id: number): Observable<boolean> {
    return new Observable((obs) => {
      this.deletePrecioPorSucursal
        .mutate({
          id,
        })
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
    });
  }
}
