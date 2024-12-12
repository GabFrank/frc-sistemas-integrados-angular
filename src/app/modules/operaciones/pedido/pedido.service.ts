import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { PedidoItem, PedidoItemInput } from "./edit-pedido/pedido-item.model";
import { Pedido, PedidoInput } from "./edit-pedido/pedido.model";
import { PedidoInfoCompletaGQL } from "./graphql/pedidoInfoCompleta";
import { PedidoInfoResumidoGQL } from "./graphql/pedidoInfoResumido";
import { PedidoItemSobranteGQL } from "./graphql/pedidoItemSobrante";
import { SavePedidoGQL } from "./graphql/savePedido";
import { UpdateNotaRecepcionIdGQL } from "./graphql/updateNotaRecepcionId";
import { PedidoItemPorIdGQL } from "./nota-recepcion/graphql/pedidoItemPorId";
import { DeletePedidoItemGQL } from "./pedido-itens/graphql/deletePedidoItem";
import { SavePedidoItemGQL } from "./pedido-itens/graphql/savePedidoItem";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PageInfo } from "../../../app.component";
import { SavePedidoFullGQL } from "./graphql/savePedidoFull";
import { PedidoItemPorPedidoPageGQL } from "./graphql/pedido-item-por-pedido-page";
import { AddPedidoItemToNotaRecepcionGQL } from "./graphql/add-item-list-to-nota-recepcion";
import { PedidoItemPorNotaRecepcionGQL } from "./graphql/pedido-item-por-nota-recepcion";
import { PedidoInfoDetalleGQL } from "./graphql/pedidoInfoDetalle";
import { FinalizarPedidoGQL } from "./graphql/finalizarPedido";
import { FilterPedidosGQL } from "./graphql/filterPedidos";
import { PedidoEstado } from "./edit-pedido/pedido-enums";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class PedidoService {
  actualizarSub = new BehaviorSubject<boolean>(false);

  constructor(
    private getPedidoPorId: PedidoInfoCompletaGQL,
    private genericService: GenericCrudService,
    private savePedido: SavePedidoGQL,
    private savePedidoFull: SavePedidoFullGQL,
    private getAllPedidos: PedidoInfoResumidoGQL,
    private deletePedidoItem: DeletePedidoItemGQL,
    private savePedidoItem: SavePedidoItemGQL,
    private getPedidoItemSobrantes: PedidoItemSobranteGQL,
    private pedidoItemPorId: PedidoItemPorIdGQL,
    private updateNotaRecepcionId: UpdateNotaRecepcionIdGQL,
    private notificacionBar: NotificacionSnackbarService,
    private pedidoItemPorPedidoPage: PedidoItemPorPedidoPageGQL,
    private addPedidoItemToNotaRecepcion: AddPedidoItemToNotaRecepcionGQL,
    private pedidoItemPorNotaRecepcion: PedidoItemPorNotaRecepcionGQL,
    private getPedidoInfoDetalle: PedidoInfoDetalleGQL,
    private finalizarPedido: FinalizarPedidoGQL,
    private filterPedidos: FilterPedidosGQL
  ) {}

  onGetPedidoInfoCompleta(id): Observable<Pedido> {
    return this.genericService.onGetById(this.getPedidoPorId, id);
  }

  onGetPedidoInfoDetalle(id): Observable<Pedido> {
    return this.genericService.onGetById(this.getPedidoInfoDetalle, id);
  }

  onSaveFull(
    entity: PedidoInput,
    fechaEntregaList: String[],
    sucursalEntregaList: number[],
    sucursalInfluenciaList: number[],
    usuarioId: number
  ): Observable<Pedido> {
    this.actualizarSub.next(true);
    return this.genericService.onSaveCustom<Pedido>(this.savePedidoFull, {
      entity,
      fechaEntregaList,
      sucursalEntregaList,
      sucursalInfluenciaList,
      usuarioId,
    });
  }
  onFilterPedidos(
    estado: PedidoEstado,
    sucursalId: number,
    inicio: string,
    fin: string,
    proveedorId: number,
    vendedorId: number,
    formaPagoId: number,
    productoId: number,
    page: number,
    size: number
  ): Observable<PageInfo<Pedido>> {
    return this.genericService.onCustomQuery(this.filterPedidos, {
      estado,
      sucursalId,
      inicio,
      fin,
      proveedorId,
      vendedorId,
      formaPagoId,
      productoId,
      page,
      size
    })
  }

  onSave(input: PedidoInput): Observable<Pedido> {
    return this.genericService.onSave<Pedido>(this.savePedido, input);
  }

  onGetAll(): Observable<Pedido[]> {
    return this.genericService.onGetAll(this.getAllPedidos);
  }

  onDeletePedidoItem(id): Observable<boolean> {
    this.actualizarSub.next(true);
    return this.genericService.onDelete(this.deletePedidoItem, id, "item");
  }

  onSaveItem(input: PedidoItemInput): Observable<PedidoItem> {
    this.actualizarSub.next(true);
    return this.genericService.onSave(this.savePedidoItem, input);
  }

  onGetPedidoItemSobrantes(id, page, size, texto?): Observable<PageInfo<PedidoItem>> {
    return this.genericService.onCustomQuery(this.getPedidoItemSobrantes, {
      id,
      page,
      size,
      texto
    });
  }

  onGetPedidoItemPorNotaRecepcion(
    id,
    page,
    size,
    texto?
  ): Observable<PageInfo<PedidoItem>> {
    return this.genericService.onCustomQuery(this.pedidoItemPorNotaRecepcion, {
      id,
      page,
      size,
      texto
    });
  }

  onGetPedidoItem(id): Observable<PedidoItem> {
    return this.genericService.onGetById(this.pedidoItemPorId, id);
  }

  onGetPedidoItemPorPedido(id, page, size, texto?): Observable<PageInfo<PedidoItem>> {
    return this.genericService.onCustomQuery(this.pedidoItemPorPedidoPage, {
      id,
      page,
      size,
      texto
    });
  }

  onUpdateNotaRecepcionId(
    pedidoItemId: number,
    notaRecepcionId: number
  ): Observable<PedidoItem> {
    this.actualizarSub.next(true);
    return new Observable((obs) => {
      this.updateNotaRecepcionId
        .mutate(
          {
            pedidoItemId,
            notaRecepcionId,
          },
          { fetchPolicy: "no-cache", errorPolicy: "all" }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            console.log(res.errors);
            this.notificacionBar.notification$.next({
              texto: "Ups! Algo salió mal: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
  }

  onAddPedidoItemToNotaRecepcion(
    notaRecepcionId: number,
    pedidoItemId: number
  ) {
    return this.genericService.onCustomMutation(
      this.addPedidoItemToNotaRecepcion,
      {
        notaRecepcion: notaRecepcionId,
        pedidoItemId,
      }
    );
  }

  onFinalizarPedido(id, estado) {
    return this.genericService.onCustomMutation(this.finalizarPedido, {
      id,
      estado,
    });
  }
}
