import { Injectable, Input } from "@angular/core";
import { Observable, pipe } from "rxjs";
import { map, tap } from "rxjs/operators";
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
import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from "../../../generics/generic-crud.service";
import { RetiroPorCajaSalidaIdGQL } from "./graphql/retiroPorCajaSalidaId";
import { ReimprimirRetiroGQL } from "./graphql/reimprimirRetiro";
import { FilterRetirosGQL } from "./graphql/filterRetiros";
import { RetirosFlotantesGQL } from "./graphql/retirosFlotantes";
import { IngresarRetiroACajaMayorGQL } from "./graphql/ingresarRetiroACajaMayor";
import { CancelarRetiroGQL } from "./graphql/cancelarRetiro";
import { Tab } from "../../../layouts/tab/tab.model";
import { PageInfo } from "../../../app.component";
import { ConfiguracionService } from "../../../shared/services/configuracion.service";
import { ImpresionPosService } from "../../../shared/services/impresion-pos/impresion-pos.service";
import { SaveRetiroClienteGQL } from "./graphql/saveRetiroCliente";
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
    private retirosFlotantesGQL: RetirosFlotantesGQL,
    private ingresarRetiroACajaMayorGQL: IngresarRetiroACajaMayorGQL,
    private cancelarRetiro: CancelarRetiroGQL,
    private configService: ConfiguracionService,
    private saveRetiroCliente: SaveRetiroClienteGQL,
    private impresionPos: ImpresionPosService
  ) { }

  onGetFlotantes(sucId?: number, cajaId?: number, desde?: string, hasta?: string,
                 page = 0, size = 10, servidor = true): Observable<PageInfo<Retiro>> {
    return this.crudService.onCustomQuery(this.retirosFlotantesGQL, {
      sucId: sucId ?? null,
      cajaId: cajaId ?? null,
      desde: desde ?? null,
      hasta: hasta ?? null,
      page, size
    }, servidor);
  }

  // servidor = true: la mutation vive en el central, igual que la lista que se
  // consume con onFilterRetiro. El estado baja a la filial por replicacion.
  onCancelarRetiro(id: number, sucId: number, servidor = true): Observable<boolean> {
    return this.crudService.onCustomMutation(this.cancelarRetiro, { id, sucId }, servidor);
  }

  onIngresarACajaMayor(retiroId: number, sucId: number, cajaVirtualId: number, servidor = true,
                       opciones?: { avisarExito?: boolean }): Observable<Retiro> {
    return this.crudService.onSaveCustom(this.ingresarRetiroACajaMayorGQL, { retiroId, sucId, cajaVirtualId }, servidor, opciones);
  }

  onGePorCajaSalidaId(id: number, servidor = true): Observable<Retiro[]> {
    return this.crudService.onGetById(this.retiroPorCajaId, id, null, null, servidor);
  }

  onReimprimirRetiro(id: number, sucId?: number, servidor = true): Observable<boolean> {
    if (sucId == null) {
      if (this.impresionPos.porCliente(servidor)) {
        return this.impresionPos
          .imprimirTicket("RETIRO", id, "La reimpresión del retiro", true)
          .pipe(map((ok) => (ok ? true : null)));
      }
      return this.crudService.onCustomQuery(this.reimprimirRetiro, {
        id, printerName: this.configService?.getConfig()?.printers?.ticket,
        local: this.configService?.getConfig()?.local
      }, servidor, PROPAGAR_ERROR_DE_RED, null, this.impresionPos.contextoImpresionServidor)
        .pipe(this.impresionPos.avisarSinRespuesta("la reimpresión del retiro"))
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

  onSave(retiro: Retiro, servidor = true, silentLoad: boolean = false): Observable<any> {
    let retiroAux = retiro;
    if (!(retiro instanceof Retiro)) {
      retiroAux = new Retiro();
      Object.assign(retiroAux, retiro);
    }
    if (retiroAux.retiroDetalleList && retiroAux.retiroDetalleList.length > 0) {
      retiroAux.retiroGs = retiroAux.retiroDetalleList.find(r => r.moneda.denominacion == 'GUARANI')?.cantidad;
      retiroAux.retiroRs = retiroAux.retiroDetalleList.find(r => r.moneda.denominacion == 'REAL')?.cantidad;
      retiroAux.retiroDs = retiroAux.retiroDetalleList.find(r => r.moneda.denominacion == 'DOLAR')?.cantidad;
    }

    retiroAux.usuario = this.mainService.usuarioActual;

    if (this.impresionPos.porCliente(servidor)) {
      // "Imprimir desde esta PC": la filial guarda sin imprimir y el ticket se pide e imprime acá.
      return this.crudService.onCustomMutation(this.saveRetiroCliente, {
        entity: retiroAux.toInput(),
        retiroDetalleInputList: retiroAux.toDetalleInput(),
        local: this.configService?.getConfig()?.local
      }, servidor, silentLoad).pipe(
        tap((res) => {
          if (res?.id != null) {
            this.impresionPos.imprimirTicket("RETIRO", res.id, "El ticket del retiro", false).subscribe();
          }
        })
      );
    }

    return this.crudService.onCustomMutation(this.saveRetiro, {
      entity: retiroAux.toInput(),
      retiroDetalleInputList: retiroAux.toDetalleInput(),
      printerName: this.configService?.getConfig()?.printers?.ticket,
      local: this.configService?.getConfig()?.local
    }, servidor, silentLoad);
  }
}
