import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Delivery } from '../../../../modules/operaciones/delivery/delivery.model';
import { DeliveryEstado } from '../../../../modules/operaciones/delivery/enums';
import { DeliverysByEstadoNotInGQL } from '../../../../modules/operaciones/delivery/graphql/deliverysByEstadoNotIn';
import { DeliverysUltimos10GQL } from '../../../../modules/operaciones/delivery/graphql/deliverysUltimos10';
import { DeliverysUltimos10SubGQL } from '../../../../modules/operaciones/delivery/graphql/deliverysUltimos10Sub';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private ultimosDeliverys: Delivery[] = [];
  private deliverysActivos: Delivery[] = [];
  private deliverySub: Observable<any>;

  constructor(
    private getUltimosDeliverys: DeliverysUltimos10GQL,
    private getDeliverysActivos: DeliverysByEstadoNotInGQL,
    private getDeliverySub: DeliverysUltimos10SubGQL
  ) {
    getUltimosDeliverys
      .fetch(null, { fetchPolicy: 'no-cache' })
      .subscribe((res) => {
        if (!res.errors) {
          console.log(res);
          this.ultimosDeliverys = res.data.data;
          this.ultimosDeliverysSub.next(this.ultimosDeliverys);
        }
      });
    getDeliverysActivos
      .fetch(
        {
          estado: DeliveryEstado.ENTREGADO,
        },
        { fetchPolicy: 'no-cache' }
      )
      .subscribe((res) => {
        console.log(res);
        if (!res.errors) {
          this.deliverysActivos = res.data.data.filter(
            (d) => d.estado != DeliveryEstado.CANCELADO
          );
          this.deliverysActivosSub.next(this.deliverysActivos);
        }
      });

    this.deliverySub = getDeliverySub.subscribe()

    this.deliverySub.subscribe((res) => {
      console.log(res)
      let delivery = res.data.deliverys;
      let index = this.deliverysActivos.findIndex(d => d.id == delivery.id);
      if(index!=-1){
        this.deliverysActivos[index] = delivery;
      } else {
        this.deliverysActivos.push(delivery);
        this.deliverysActivosSub.next(this.deliverysActivos);
      }
    });
  }

  ultimosDeliverysSub = new BehaviorSubject<Delivery[]>(null);
  deliverysActivosSub = new BehaviorSubject<Delivery[]>(null);
}
