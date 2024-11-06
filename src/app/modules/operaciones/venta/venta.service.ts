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
    private saveVentaDelivery: SaveVentaDeliveryGQL
  ) {}

  // $venta:VentaInput!, $venteItemList: [VentaItemInput], $cobro: CobroInput, $cobroDetalleList: [CobroDetalleInput]

  onSaveVentaDelivery(
    ventaInput: VentaInput,
    deliveryInput: DeliveryInput,
    cobroDetalleList?: CobroDetalleInput[],
    ventaCreditoInput?: VentaCreditoInput,
    ventaCreditoCuotaInputList?: VentaCreditoCuotaInput[]
  ) {
    console.log(
      ventaInput,
      deliveryInput,
      cobroDetalleList,
      ventaCreditoInput,
      ventaCreditoCuotaInputList
    );

    return this.genericService.onCustomMutation(this.saveVentaDelivery, {
      ventaInput,
      deliveryInput,
      cobroDetalleList,
      ventaCreditoInput,
      ventaCreditoCuotaInputList,
    });
  }

  onSaveVenta(
    venta: Venta,
    cobro: Cobro,
    ticket,
    ventaCreditoInput?,
    ventaCreditoCuotaInputList?,
    isFactura?: boolean
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
      printerName: environment["printers"]["ticket"],
      local: environment["local"],
      pdvId: environment["pdvId"],
      ventaCreditoInput,
      ventaCreditoCuotaInputList,
    });
    // return new Observable((obs) => {
    //   this.saveVenta
    //     .mutate(
    //       {
    //         ventaInput: ventaInput,
    //         ventaItemList: ventaItemInputList,
    //         cobro: cobroInput,
    //         cobroDetalleList: cobroDetalleInputList,
    //         ticket,
    //         facturar: isFactura,
    //         printerName: environment["printers"]["ticket"],
    //         local: environment["local"],
    //         pdvId: environment["pdvId"],
    //         ventaCreditoInput,
    //         ventaCreditoCuotaInputList,
    //       },
    //       {
    //         errorPolicy: "all",
    //         fetchPolicy: "no-cache",
    //       }
    //     )
    //     .pipe(untilDestroyed(this))
    //     .subscribe((res) => {
    //       if (res.errors != null) {
    //         this.notificacionBar.openWarn(res.errors[0].message);
    //       } else {
    //         obs.next(res.data["data"]);
    //       }
    //     });
    // });
  }

  onSaveVenta2(ventaInput?: VentaInput): Observable<Venta> {
    return new Observable((obs) => {
      this.saveVenta
        .mutate(
          {
            ventaInput: ventaInput,
          },
          {
            errorPolicy: "all",
            fetchPolicy: "no-cache",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          obs.next(res.data["data"]);
        });
    });
  }

  onDeleteVenta(id): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteVenta,
      id,
      null,
      null,
      false,
      false
    );
  }

  onDeleteVentaItem(id, sucId): Observable<boolean> {
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

  onReimprimirVenta(id): Observable<boolean> {
    return new Observable((obs) => {
      this.reimprimirVenta
        .mutate(
          {
            id,
            printerName: environment["printers"]["ticket"],
            local: environment["local"],
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data.data);
          } else {
            obs.next(null);
          }
        });
    });
  }

  onImprimirPagare(id, itens): Observable<boolean> {
    return new Observable((obs) => {
      this.imprimirPagare
        .mutate(
          {
            id,
            itens,
            printerName: environment["printers"]["ticket"],
            local: environment["local"],
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data.data);
          } else {
            obs.next(null);
          }
        });
    });
  }

  onCancelarVenta(id, sucId): Observable<boolean> {
    return new Observable((obs) => {
      this.cancelarVenta
        .mutate(
          {
            id,
            sucId,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data.data);
          } else {
            obs.next(null);
          }
        });
    });
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
    monedaId?
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
    });
    // if (page == null) page = 0;
    // if (size == null) size = 20;
    // if (asc == null) asc = true;
    // return new Observable((obs) => {
    //   this.ventasPorCajaId
    //     .fetch(
    //       {
    //         id,
    //         page,
    //         size,
    //         asc,
    //         sucId,
    //         formaPago,
    //         estado,
    //         isDelivery
    //       },
    //       {
    //         fetchPolicy: "no-cache",
    //         errorPolicy: "all",
    //       }
    //     ).pipe(untilDestroyed(this))
    //     .subscribe((res) => {
    //       this.genericService.isLoading = false;
    //       if (res.errors == null) {
    //         obs.next(res.data.data);
    //       } else {
    //         obs.next(null);
    //       }
    //     });
    // });
  }

  onGetPorId(id, sucId?, silentLoad?): Observable<Venta> {
    return this.genericService.onGetById(
      this.ventaPorId,
      id,
      null,
      null,
      false,
      sucId,
      null,
      null,
      silentLoad
    );
  }

  onGetVentasPorPeriodo(inicio: string, fin: string, sucId?): Observable<any> {
    return new Observable((obs) => {
      this.ventaPorPeriodo
        .fetch(
          { inicio, fin, sucId },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data.data);
          } else {
            obs.next(null);
            this.notificacionBar.notification$.next({
              texto: "Ocurrio algún problema: ",
              color: NotificacionColor.warn,
              duracion: 2,
            });
          }
        });
    });
  }

  onCountVenta(): Observable<number> {
    return this.genericService.onCustomQuery(this.countVenta, null);
  }

  onSaveVentaItem(ventaItemInput: VentaItemInput): Observable<any> {
    return this.genericService.onSave(this.saveVentaItemQuery, ventaItemInput);
  }

  onSaveCobroDetalle(
    cobroDetalleInput: CobroDetalleInput
  ): Observable<CobroDetalle> {
    return this.genericService.onSave(
      this.saveCobroDetalleQuery,
      cobroDetalleInput
    );
  }

  onDeleteCobroDetalle(id, sucId): Observable<boolean> {
    return this.genericService.onDeleteWithSucId(
      this.deleteCobroDetalle,
      id,
      sucId,
      null,
      null,
      false
    );
  }

  onGetVentaItemPorId(id, sucId): Observable<VentaItem> {
    return this.genericService.onGetById(
      this.ventaItemPorId,
      id,
      null,
      null,
      null,
      sucId
    );
  }
}
