import { Injectable, Type } from "@angular/core";
import { GenericListService } from "../../../shared/components/generic-list/generic-list.service";
import { TabService } from "../../../layouts/tab/tab.service";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import { Apollo } from "apollo-angular";
import {
  deletePedidoQuery,
  pedidoQuery,
  pedidosSearch,
  savePedido,
} from "./graphql/graphql-query";
import { ListPedidoComponent } from "./list-pedido/list-pedido.component";
import { EditPedidoComponent } from "./edit-pedido/edit-pedido.component";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { PedidoInfoCompletaGQL } from "./graphql/pedidoInfoCompleta";
import { BehaviorSubject, Observable } from "rxjs";
import { Pedido, PedidoInput } from "./edit-pedido/pedido.model";
import { SavePedidoGQL } from "./graphql/savePedido";
import { PedidoInfoResumidoGQL } from "./graphql/pedidoInfoResumido";
import { DeletePedidoItemGQL } from "./pedido-itens/graphql/deletePedidoItem";
import { PedidoItem, PedidoItemInput } from "./edit-pedido/pedido-item.model";
import { SavePedidoItemGQL } from "./pedido-itens/graphql/savePedidoItem";
import { PedidoItemSobranteGQL } from "./graphql/pedidoItemSobrante";
import { PedidoItemPorIdGQL } from "./nota-recepcion/graphql/pedidoItemPorId";
import { UpdateNotaRecepcionIdGQL } from "./graphql/updateNotaRecepcionId";
import { NotificacionColor, NotificacionSnackbarService } from "../../../notificacion-snackbar.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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
    private getAllPedidos: PedidoInfoResumidoGQL,
    private deletePedidoItem: DeletePedidoItemGQL,
    private savePedidoItem: SavePedidoItemGQL,
    private getPedidoItemSobrantes: PedidoItemSobranteGQL,
    private pedidoItemPorId: PedidoItemPorIdGQL,
    private updateNotaRecepcionId: UpdateNotaRecepcionIdGQL,
    private notificacionBar: NotificacionSnackbarService
  ) {}

  onGetPedidoInfoCompleta(id): Observable<Pedido> {
    return this.genericService.onGetById(this.getPedidoPorId, id);
  }

  onSave(input: PedidoInput): Observable<Pedido> {
    this.actualizarSub.next(true)
    return this.genericService.onSave<Pedido>(this.savePedido, input);
  }

  onGetAll(): Observable<Pedido[]> {
    return this.genericService.onGetAll(this.getAllPedidos);
  }

  onDeletePedidoItem(id): Observable<boolean> {
    this.actualizarSub.next(true)
    return this.genericService.onDelete(this.deletePedidoItem, id, "item");
  }

  onSaveItem(input: PedidoItemInput): Observable<PedidoItem> {
    this.actualizarSub.next(true)
    return this.genericService.onSave(this.savePedidoItem, input);
  }

  onGetPedidoItemSobrantes(id): Observable<PedidoItem[]> {
    return this.genericService.onGetById(this.getPedidoItemSobrantes, id);
  }

  onGetPedidoItem(id): Observable<PedidoItem> {
    return this.genericService.onGetById(this.pedidoItemPorId, id);
  }

  onUpdateNotaRecepcionId(
    pedidoItemId: number,
    notaRecepcionId: number
  ): Observable<PedidoItem> {
    this.actualizarSub.next(true)
    return new Observable((obs) => {
      this.updateNotaRecepcionId.mutate(
        {
          pedidoItemId,
          notaRecepcionId,
        },
        { fetchPolicy: "no-cache", errorPolicy: "all" }
      ).pipe(untilDestroyed(this)).subscribe(res => {
        if (res.errors == null) {
          obs.next(res.data["data"]);
        } else {
          console.log(res.errors)
          this.notificacionBar.notification$.next({
            texto: "Ups! Algo salió mal: " + res.errors[0].message,
            color: NotificacionColor.danger,
            duracion: 3,
          });
        }
      })
    });
  }
}
