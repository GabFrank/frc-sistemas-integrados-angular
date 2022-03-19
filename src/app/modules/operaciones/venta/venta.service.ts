import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { MainService } from "../../../main.service";
import { CobroDetalleInput } from "./cobro/cobro-detalle.model";
import { Cobro, CobroInput } from "./cobro/cobro.model";
import { VentaEstado } from "./enums/venta-estado.enums";
import { CancelarVentaGQL } from "./graphql/cancelarVenta";
import { ReimprimirVentaGQL } from "./graphql/reimprimirVenta";
import { SaveVentaGQL } from "./graphql/saveVenta";
import { VentaPorIdGQL } from "./graphql/ventaPorId";
import { VentaPorCajaIdGQL } from "./graphql/ventasPorCajaId";
import { VentaItemInput } from "./venta-item.model";
import { SaveVentaItemListGQL } from "./venta-item/graphql/saveVentaItemList";
import { Venta, VentaInput } from "./venta.model";
import { VentaPorPeriodoGQL } from "./graphql/ventaPorPeriodo";
import { NotificacionColor, NotificacionSnackbarService } from "../../../notificacion-snackbar.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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
    private notificacionBar: NotificacionSnackbarService
  ) {}

  // $venta:VentaInput!, $venteItemList: [VentaItemInput], $cobro: CobroInput, $cobroDetalleList: [CobroDetalleInput]

  onSaveVenta(venta: Venta, cobro: Cobro): Observable<any> {
    let ventaItemInputList: VentaItemInput[] = [];
    let cobroDetalleInputList: CobroDetalleInput[] = [];
    let ventaInput: VentaInput = venta.toInput();
    let cobroInput: CobroInput = cobro.toInput();
    ventaInput.estado = VentaEstado.CONCLUIDA;
    ventaInput.usuarioId = this.mainService?.usuarioActual?.id;
    cobroInput.usuarioId = this.mainService?.usuarioActual?.id;
    console.log(ventaInput, cobroInput);
    venta.ventaItemList.forEach((e) => {
      ventaItemInputList.push(e.toInput());
    });
    cobro.cobroDetalleList.forEach((e) => {
      cobroDetalleInputList.push(e.toInput());
    });
    return new Observable((obs) => {
      this.saveVenta
        .mutate(
          {
            ventaInput: ventaInput,
            ventaItemList: ventaItemInputList,
            cobro: cobroInput,
            cobroDetalleList: cobroDetalleInputList,
          },
          {
            errorPolicy: "all",
            fetchPolicy: "no-cache",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          console.log(res);
          obs.next(res.data["data"]);
        });
    });
  }

  onReimprimirVenta(id): Observable<boolean> {
    return new Observable((obs) => {
      this.reimprimirVenta
        .mutate(
          {
            id,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            console.log(res.data.data);
            obs.next(res.data.data);
          } else {
            obs.next(null);
          }
        });
    });
  }

  onCancelarVenta(id): Observable<boolean> {
    return new Observable((obs) => {
      this.cancelarVenta
        .mutate(
          {
            id,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            console.log(res.data);
            obs.next(res.data.data);
          } else {
            obs.next(null);
          }
        });
    });
  }

  onSearch(id, offset?): Observable<Venta[]> {
    this.genericService.isLoading = true;
    if (offset == null) offset = 0;
    return new Observable((obs) => {
      this.ventasPorCajaId
        .fetch(
          {
            id,
            offset,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.genericService.isLoading = false;
          if (res.errors == null) {
            console.log(res.data.data);
            obs.next(res.data.data);
          } else {
            obs.next(null);
          }
        });
    });
  }

  onGetPorId(id): Observable<Venta> {
    return this.genericService.onGetById(this.ventaPorId, id);
  }

  onGetVentasPorPeriodo(inicio: string, fin: string): Observable<any> {
    return new Observable((obs) => {
      this.ventaPorPeriodo.fetch({inicio, fin},{
        fetchPolicy: "no-cache",
        errorPolicy: "all",
      }).pipe(untilDestroyed(this)).subscribe(res => {
        if(res.errors==null){
          obs.next(res.data.data)
        } else {
          obs.next(null)
          this.notificacionBar.notification$.next({
            texto: 'Ocurrio algún problema: ',
            color: NotificacionColor.warn,
            duracion: 2
          })
        }
      })
    });
  }
}
