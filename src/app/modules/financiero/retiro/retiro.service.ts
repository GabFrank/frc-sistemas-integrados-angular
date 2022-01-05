import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { MainService } from "../../../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { SaveRetiroGQL } from "./graphql/saveRetiro";
import { Retiro } from "./retiro.model";

@Injectable({
  providedIn: "root",
})
export class RetiroService {
  constructor(
    private saveRetiro: SaveRetiroGQL,
    private notificacionBar: NotificacionSnackbarService,
    private mainService: MainService
  ) {}

  onSave(retiro: Retiro): Observable<any> {
    retiro.retiroGs = retiro.retiroDetalleList.find(r => r.moneda.denominacion == 'GUARANI')?.cantidad;
    retiro.retiroRs = retiro.retiroDetalleList.find(r => r.moneda.denominacion == 'REAL')?.cantidad;
    retiro.retiroDs = retiro.retiroDetalleList.find(r => r.moneda.denominacion == 'DOLAR')?.cantidad;
    retiro.usuario = this.mainService.usuarioActual;
    return new Observable((obs) => {
      return this.saveRetiro
        .mutate(
          {
            entity: retiro.toInput(),
            retiroDetalleInputList: retiro.toDetalleInput(),
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .subscribe((res) => {
          if (res.errors == null) {
            this.notificacionBar.notification$.next({
              texto: "Guardado con éxito!!",
              color: NotificacionColor.success,
              duracion: 2,
            });
            obs.next(res.data.data);
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups!! Algo salio mal" + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 5,
            });
            console.log(res);
            obs.next(null);
          }
        });
    });
  }
}
