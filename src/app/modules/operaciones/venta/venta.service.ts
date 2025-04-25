import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { MainService } from "../../../main.service";
import { CobroDetalle, CobroDetalleInput } from "./cobro/cobro-detalle.model";
import { Cobro, CobroInput } from "./cobro/cobro.model";
import { VentaEstado } from "./enums/venta-estado.enums";
import { CancelarVentaGQL } from "./graphql/cancelarVenta";
import { ReimprimirVentaGQL } from "./graphql/reimprimirVenta";
import { SaveVentaGQL } from "./graphql/saveVenta";
import { VentaPorIdGQL } from "./graphql/ventaPorId";
import { VentaPorCajaIdGQL } from "./graphql/ventasPorCajaId";
import { VentaItem, VentaItemInput } from "./venta-item.model";
import { SaveVentaItemListGQL } from "./venta-item/graphql/saveVentaItemList";
import { Venta, VentaInput } from "./venta.model";
import { VentaPorPeriodoGQL } from "./graphql/ventaPorPeriodo";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { environment } from "../../../../environments/environment";
import { DeleteVentaGQL } from "./graphql/deleteVenta";
import { ImprimirPagareGQL } from "./graphql/imprimirPagare";
import { CountVentaGQL } from "./graphql/count-venta";
import { SaveVentaItemGQL } from "./graphql/saveVentaItem";
import { SaveCobroDetalleGQL } from "./graphql/saveCobroDetalle";
import { DeleteCobroDetalleGQL } from "./graphql/deleteCobroDetalle";
import { DeleteVentaItemGQL } from "./graphql/deleteVentaItem";
import { PageInfo } from "../../../app.component";
import { VentaItemPorIdGQL } from "./graphql/ventaItemPorId";
import { SaveVentaDeliveryGQL } from "./graphql/saveVentaDelivery";
import {
  VentaCreditoInput,
  VentaCreditoCuotaInput,
} from "../../financiero/venta-credito/venta-credito.model";
import { DeliveryInput } from "../delivery/graphql/delivery-input.model";
import { ConfiguracionService } from "../../../shared/services/configuracion.service";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class VentaService {
  constructor(
    private genericService: GenericCrudService,
    private saveVenta: SaveVentaGQL,
    private saveVentaItemList: SaveVentaItemListGQL,
    private mainService: MainService,
    private cancelarVenta: CancelarVentaGQL,
    private reimprimirVenta: ReimprimirVentaGQL,
    private ventasPorCajaId: VentaPorCajaIdGQL,
    private ventaPorId: VentaPorIdGQL,
    private ventaPorPeriodo: VentaPorPeriodoGQL,
    private notificacionBar: NotificacionSnackbarService,
    private deleteVenta: DeleteVentaGQL,
    private deleteVentaItem: DeleteVentaItemGQL,
    private imprimirPagare: ImprimirPagareGQL,
    private countVenta: CountVentaGQL,
    private saveVentaItemQuery: SaveVentaItemGQL,
    private saveCobroDetalleQuery: SaveCobroDetalleGQL,
    private deleteCobroDetalle: DeleteCobroDetalleGQL,
    private ventaItemPorId: VentaItemPorIdGQL,
    private saveVentaDelivery: SaveVentaDeliveryGQL,
    private configService: ConfiguracionService
  ) { }

  // $venta:VentaInput!, $venteItemList: [VentaItemInput], $cobro: CobroInput, $cobroDetalleList: [CobroDetalleInput]

  onSaveVentaDelivery(
    ventaInput: VentaInput,
    deliveryInput: DeliveryInput,
    cobroDetalleList?: CobroDetalleInput[],
    ventaCreditoInput?: VentaCreditoInput,
    ventaCreditoCuotaInputList?: VentaCreditoCuotaInput[],
    servidor = true
  ) {
    return this.genericService.onCustomMutation(this.saveVentaDelivery, {
      ventaInput,
      deliveryInput,
      cobroDetalleList,
      ventaCreditoInput,
      ventaCreditoCuotaInputList,
    }, servidor);
  }

  onSaveVenta(
    venta: Venta,
    cobro: Cobro,
    ticket,
    ventaCreditoInput?,
    ventaCreditoCuotaInputList?,
    isFactura?: boolean,
    servidor = true
  ): Observable<Venta> {
    let ventaItemInputList: VentaItemInput[] = [];
    let cobroDetalleInputList: CobroDetalleInput[] = [];
    let ventaInput: VentaInput = venta.toInput();
    let cobroInput: CobroInput = cobro.toInput();
    ventaInput.estado = VentaEstado.CONCLUIDA;
    ventaInput.usuarioId = this.mainService?.usuarioActual?.id;
    cobroInput.usuarioId = this.mainService?.usuarioActual?.id;

    venta.ventaItemList.forEach((e) => {
      let aux = new VentaItem();
      ventaItemInputList.push(Object.assign(aux, e).toInput());
    });
    cobro.cobroDetalleList.forEach((e) => {
      let aux = new CobroDetalle();
      cobroDetalleInputList.push(Object.assign(aux, e).toInput());
    });

    return this.genericService.onCustomMutation(this.saveVenta, {
      ventaInput: ventaInput,
      ventaItemList: ventaItemInputList,
      cobro: cobroInput,
      cobroDetalleList: cobroDetalleInputList,
      ticket,
      facturar: isFactura,
      printerName: this.configService?.getConfig()?.printers?.ticket,
      local: this.configService?.getConfig()?.local,
      pdvId: this.configService?.getConfig()?.pdvId,
      ventaCreditoInput,
      ventaCreditoCuotaInputList,
    }, servidor);
  }

  onSaveVenta2(ventaInput?: VentaInput, servidor = true): Observable<Venta> {
    return this.genericService.onCustomMutation(this.saveVenta, {
      ventaInput: ventaInput,
    }, servidor);
  }

  onDeleteVenta(id, servidor = true): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteVenta,
      id,
      null,
      null,
      false,
      servidor
    );
  }

  onDeleteVentaItem(id, sucId, servidor = true): Observable<boolean> {
    return this.genericService.onDeleteWithSucId(
      this.deleteVentaItem,
      id,
      sucId,
      null,
      null,
      false,
      false
    );
  }

  onReimprimirVenta(id, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.reimprimirVenta,
      {
        id,
        printerName: this.configService?.getConfig()?.printers?.ticket,
        local: this.configService?.getConfig()?.local,
      },
      servidor
    );
  }

  onImprimirPagare(id, itens, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.imprimirPagare,
      {
        id,
        itens,
        printerName: this.configService?.getConfig()?.printers?.ticket,
        local: this.configService?.getConfig()?.local,
      },
      servidor
    );
  }

  onCancelarVenta(id, sucId, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(this.cancelarVenta, { id, sucId }, servidor);
  }

  onSearch(
    idVenta,
    idCaja,
    page?,
    size?,
    asc?,
    sucId?,
    formaPago?,
    estado?,
    isDelivery?,
    monedaId?,
    servidor = true
  ): Observable<PageInfo<Venta>> {
    return this.genericService.onCustomQuery(this.ventasPorCajaId, {
      idVenta,
      idCaja,
      page,
      size,
      asc,
      sucId,
      formaPago,
      estado,
      isDelivery,
      monedaId,
    }, servidor);
  }

  onGetPorId(id, sucId?, silentLoad?, servidor = true): Observable<Venta> {
    return this.genericService.onGetById(
      this.ventaPorId,
      id,
      null,
      null, servidor,
      sucId,
      null,
      null,
      silentLoad
    );
  }

  onGetVentasPorPeriodo(inicio: string, fin: string, sucId?, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(
      this.ventaPorPeriodo,
      { inicio, fin, sucId },
      servidor
    );
  }

  onCountVenta(servidor = true): Observable<number> {
    return this.genericService.onCustomQuery(this.countVenta, null, servidor);
  }

  onSaveVentaItem(ventaItemInput: VentaItemInput, servidor = true): Observable<any> {
    return this.genericService.onSave(this.saveVentaItemQuery, ventaItemInput, null, null, servidor);
  }

  onSaveCobroDetalle(
    cobroDetalleInput: CobroDetalleInput,
    servidor = true
  ): Observable<CobroDetalle> {
    return this.genericService.onSave(
      this.saveCobroDetalleQuery,
      cobroDetalleInput,
      null,
      null,
      servidor
    );
  }

  onDeleteCobroDetalle(id, sucId, servidor = true): Observable<boolean> {
    return this.genericService.onDeleteWithSucId(
      this.deleteCobroDetalle,
      id,
      sucId,
      null,
      null,
      false,
      servidor
    );
  }

  onGetVentaItemPorId(id, sucId, servidor = true): Observable<VentaItem> {
    return this.genericService.onGetById(
      this.ventaItemPorId,
      id,
      null,
      null,
      servidor,
      sucId
    );
  }
}
