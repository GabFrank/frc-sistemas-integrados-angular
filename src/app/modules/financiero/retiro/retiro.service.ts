import { Injectable, Input } from "@angular/core";
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
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { RetiroPorCajaSalidaIdGQL } from "./graphql/retiroPorCajaSalidaId";
import { ReimprimirRetiroGQL } from "./graphql/reimprimirRetiro";
import { FilterRetirosGQL } from "./graphql/filterRetiros";
import { Tab } from "../../../layouts/tab/tab.model";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class RetiroService {

  constructor(
    private saveRetiro: SaveRetiroGQL,
    private notificacionBar: NotificacionSnackbarService,
    private mainService: MainService,
    private cargandoDialog: CargandoDialogService,
    private crudService: GenericCrudService,
    private retiroPorCajaId: RetiroPorCajaSalidaIdGQL,
    private reimprimirRetiro: ReimprimirRetiroGQL,
    private filterRetiro: FilterRetirosGQL
  ) { }

  onGePorCajaSalidaId(id: number): Observable<Retiro[]> {
    return this.crudService.onGetById(this.retiroPorCajaId, id);
  }

  onReimprimirRetiro(id: number, sucId?: number): Observable<boolean> {
    if (sucId == null) {
      return this.crudService.onCustomQuery(this.reimprimirRetiro, {
        id, printerName: environment['printers']['ticket'],
        local: environment['local']
      })
    }
  }

  onFilterRetiro(id?: number, cajaId?: number, sucId?: number, responsableId?: number, cajeroId?: number, page?: number, size?: number): Observable<Retiro[]> {
    return this.crudService.onCustomQuery(
      this.filterRetiro, {
      id,
      cajaId,
      sucId,
      responsableId,
      cajeroId,
      page,
      size
    }, true
    )
  }

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
            printerName: environment['printers']['ticket'],
            local: environment['local']
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
              texto: "Ups!! Algo salio mal: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 5,
            });
            obs.next(null);
          }
        });
    });
  }
}
