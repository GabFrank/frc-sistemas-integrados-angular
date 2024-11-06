import { Injectable } from "@angular/core";
import { DeliverysByEstadoNotInGQL } from "../../../../operaciones/delivery/graphql/deliverysByEstadoNotIn";
import { DeliverysUltimos10GQL } from "../../../../operaciones/delivery/graphql/deliverysUltimos10";
import { DeliverysUltimos10SubGQL } from "../../../../operaciones/delivery/graphql/deliverysUltimos10Sub";

import { UntilDestroy } from "@ngneat/until-destroy";
import { GenericCrudService } from "../../../../../generics/generic-crud.service";
import { PreciosDeliveryGQL } from "../../../../operaciones/delivery/precio-delivery/graphql/precioDeliverySearchByPrecio";
import { Observable } from "rxjs";
import { DeliveryPrecio } from "../../../../operaciones/delivery/precio-delivery/delivery-precios.model";
import { PrecioDelivery } from "../../../../operaciones/delivery/precio-delivery.model";
import { SaveDeliveryAndVentaGQL } from "../../../../operaciones/delivery/graphql/delivery-save";
import { DeliveryInput } from "../../../../operaciones/delivery/graphql/delivery-input.model";
import { VentaInput } from "../../../../operaciones/venta/venta.model";
import { VentaItem, VentaItemInput } from "../../../../operaciones/venta/venta-item.model";
import { DeliverysByEstadoListGQL } from "../../../../operaciones/delivery/graphql/deliverysByEstadoList";
import { DeliveryEstado } from "../../../../operaciones/delivery/enums";
import { Vuelto } from "../../../../operaciones/vuelto/vuelto.model";
import { VueltoInput } from "../../../../operaciones/vuelto/vuelto-input.model";
import { VueltoItemInput } from "../../../../operaciones/vuelto/vuelto-item/vuelto-item-input.model";
import { Delivery } from "../../../../operaciones/delivery/delivery.model";
import { DeliveryByIdGQL } from "../../../../operaciones/delivery/graphql/deliveryById";
import { MainService } from "../../../../../main.service";
import { SaveDeliveryEstadoGQL } from "../../../../operaciones/delivery/graphql/saveDeliveryEstado";
import { environment } from "../../../../../../environments/environment";
import { CobroInput } from "../../../../operaciones/venta/cobro/cobro.model";
import { CobroDetalleInput } from "../../../../operaciones/venta/cobro/cobro-detalle.model";
import { ReimprimirDeliveryGQL } from "../../../../operaciones/delivery/graphql/reimprimir-delivery";
import { DeliverysPorCajaIdAndEstadoGQL } from "../../../../operaciones/delivery/graphql/deliveryPorCajaIdAndEstado";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class DeliveryService {

  constructor(
    private genericService: GenericCrudService,
    private preciosDelivery: PreciosDeliveryGQL,
    private saveDeliveryAndVenta: SaveDeliveryAndVentaGQL,
    private deliverysByEstadoList: DeliverysByEstadoListGQL,
    private deliveryById: DeliveryByIdGQL,
    private mainService: MainService,
    private saveDeliveryEstado: SaveDeliveryEstadoGQL,
    private reimprimirDelivery: ReimprimirDeliveryGQL,
    private deliveryPorCajaIdAndEstado: DeliverysPorCajaIdAndEstadoGQL
  ) {
  }

  onDeliveryPorCajaIdAndEstado(id: number, estadoList: DeliveryEstado[], sucId): Observable<Delivery[]> {
    return this.genericService.onCustomQuery(this.deliveryPorCajaIdAndEstado, { id: id, estadoList: estadoList, sucId });
  }

  onGetById(id): Observable<Delivery> {
    return this.genericService.onGetById(this.deliveryById, id);
  }

  onGetDeliverysByEstadoList(estadoList: DeliveryEstado[], sucId?: number) {
    return this.genericService.onCustomQuery(this.deliverysByEstadoList, { estadoList, sucId })
  }

  onSaveDeliveryAndVenta(delivery: DeliveryInput, venta: VentaInput, ventaItemList: VentaItemInput[], cobro: CobroInput, cobroDetalleList: CobroDetalleInput[]) {
    if (delivery != null && delivery.usuarioId == null) delivery.usuarioId = this.mainService?.usuarioActual?.id
    if (venta != null && venta.usuarioId == null) venta.usuarioId = this.mainService?.usuarioActual?.id
    if (cobro != null && cobro.usuarioId == null) cobro.usuarioId = this.mainService?.usuarioActual?.id
    return this.genericService.onCustomQuery(this.saveDeliveryAndVenta, {
      deliveryInput: delivery,
      ventaInput: venta,
      ventaItemInputList: ventaItemList,
      cobroInput: cobro,
      cobroDetalleInputList: cobroDetalleList
    });
  }

  onGetPreciosDelivery(): Observable<PrecioDelivery[]> {
    return this.genericService.onGetAll(this.preciosDelivery)
  }

  onSaveDeliveryEstado(id, estado): Observable<Delivery> {
    return this.genericService.onSaveCustom(this.saveDeliveryEstado, {
      deliveryId: id,
      deliveryEstado: estado,
      printerName: environment['printers']['ticket'],
      local: environment['local'],
      pdvId: environment['pdvId'],
    })
  }

  onReimprimirDelivery(id): Observable<boolean> {
    return this.genericService.onCustomQuery(this.reimprimirDelivery, {
      id: id,
      printerName: environment['printers']['ticket'],
      local: environment['local'],
    })
  }
}
