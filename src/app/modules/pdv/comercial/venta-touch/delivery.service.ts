import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { Delivery } from "../../../../modules/operaciones/delivery/delivery.model";
import { DeliveryEstado } from "../../../../modules/operaciones/delivery/enums";
import { DeliverysByEstadoNotInGQL } from "../../../../modules/operaciones/delivery/graphql/deliverysByEstadoNotIn";
import { DeliverysUltimos10GQL } from "../../../../modules/operaciones/delivery/graphql/deliverysUltimos10";
import { DeliverysUltimos10SubGQL } from "../../../../modules/operaciones/delivery/graphql/deliverysUltimos10Sub";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class DeliveryService implements OnDestroy {
  private ultimosDeliverys: Delivery[] = [];
  private deliverysActivos: Delivery[] = [];
  private deliverySub: Subscription

  constructor(
    private getUltimosDeliverys: DeliverysUltimos10GQL,
    private getDeliverysActivos: DeliverysByEstadoNotInGQL,
    private getDeliverySub: DeliverysUltimos10SubGQL
  ) {
    getUltimosDeliverys
      .fetch(null, { fetchPolicy: "no-cache" })
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!res.errors) {
          this.ultimosDeliverys = res.data.data;
          this.ultimosDeliverysSub.next(this.ultimosDeliverys);
        }
      });
    getDeliverysActivos
      .fetch(
        {
          estado: DeliveryEstado.ENTREGADO,
        },
        { fetchPolicy: "no-cache" }
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
        console.log(res);
        if (!res.errors) {
          this.deliverysActivos = res.data.data.filter(
            (d) => d.estado != DeliveryEstado.CANCELADO
          );
          this.deliverysActivosSub.next(this.deliverysActivos);
        }
      });

    // this.deliverySub = this.getDeliverySub.subscribe((res) => {
    //   let delivery = res.data.deliverys;
    //   let index = this.deliverysActivos.findIndex((d) => d.id == delivery.id);
    //   if (index != -1) {
    //     this.deliverysActivos[index] = delivery;
    //   } else {
    //     this.deliverysActivos.push(delivery);
    //     this.deliverysActivosSub.next(this.deliverysActivos);
    //   }
    // });
  }

  ultimosDeliverysSub = new BehaviorSubject<Delivery[]>(null);
  deliverysActivosSub = new BehaviorSubject<Delivery[]>(null);

  ngOnDestroy(): void {
    // this.deliverySub.subscribe;
  }
}
