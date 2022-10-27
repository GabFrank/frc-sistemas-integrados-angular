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

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class DeliveryService {

  constructor(
    private getUltimosDeliverys: DeliverysUltimos10GQL,
    private getDeliverysActivos: DeliverysByEstadoNotInGQL,
    private getDeliverySub: DeliverysUltimos10SubGQL,
    private genericService: GenericCrudService,
    private preciosDelivery: PreciosDeliveryGQL
  ) {
  }

  onGetPreciosDelivery(): Observable<PrecioDelivery[]>{
    return this.genericService.onGetAll(this.preciosDelivery)
  }
}
