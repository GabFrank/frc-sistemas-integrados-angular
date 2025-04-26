import { Injectable, Input } from "@angular/core";
import { Observable, pipe } from "rxjs";
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
import { PageInfo } from "../../../app.component";
import { ConfiguracionService } from "../../../shared/services/configuracion.service";
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
    private filterRetiro: FilterRetirosGQL,
    private configService: ConfiguracionService
  ) { }

  onGePorCajaSalidaId(id: number, servidor = true): Observable<Retiro[]> {
    return this.crudService.onGetById(this.retiroPorCajaId, id, null, null, servidor);
  }

  onReimprimirRetiro(id: number, sucId?: number, servidor = true): Observable<boolean> {
    if (sucId == null) {
      return this.crudService.onCustomQuery(this.reimprimirRetiro, {
        id, printerName: this.configService?.getConfig()?.printers?.ticket,
        local: this.configService?.getConfig()?.local
      }, servidor)
    }
  }

  onFilterRetiro(id?: number, cajaId?: number, sucId?: number, responsableId?: number, cajeroId?: number, page?: number, size?: number, servidor = true): Observable<PageInfo<Retiro>> {
    return this.crudService.onCustomQuery(
      this.filterRetiro, {
      id,
      cajaId,
      sucId,
      responsableId,
      cajeroId,
      page,
      size
    }, servidor)
  }

  onSave(retiro: Retiro, servidor = true): Observable<any> {
    this.cargandoDialog.openDialog(true, 'Guardando...')
    retiro.retiroGs = retiro.retiroDetalleList.find(r => r.moneda.denominacion == 'GUARANI')?.cantidad;
    retiro.retiroRs = retiro.retiroDetalleList.find(r => r.moneda.denominacion == 'REAL')?.cantidad;
    retiro.retiroDs = retiro.retiroDetalleList.find(r => r.moneda.denominacion == 'DOLAR')?.cantidad;
    retiro.usuario = this.mainService.usuarioActual;
    //refactur using custom mutation,
    return this.crudService.onCustomMutation(this.saveRetiro, {
      entity: retiro.toInput(),
      retiroDetalleInputList: retiro.toDetalleInput(),
      printerName: this.configService?.getConfig()?.printers?.ticket,
      local: this.configService?.getConfig()?.local
    }, servidor);
  }
}
