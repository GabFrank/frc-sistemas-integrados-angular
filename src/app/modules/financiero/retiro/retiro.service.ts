import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { MainService } from "../../../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { SaveRetiroGQL } from "./graphql/saveRetiro";
import { Retiro } from "./retiro.model";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CargandoDialogService } from "../../../shared/components/cargando-dialog/cargando-dialog.service";
import { environment } from "../../../../environments/environment";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class RetiroService {
  constructor(
    private saveRetiro: SaveRetiroGQL,
    private notificacionBar: NotificacionSnackbarService,
    private mainService: MainService,
    private cargandoDialog: CargandoDialogService
  ) {}

  onSave(retiro: Retiro): Observable<any> {
    this.cargandoDialog.openDialog(true, 'Guardando...')
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
            printerName: environment['printers']['ticket']
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoDialog.closeDialog()
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
