import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
// Modelos actualizados y obsoletos
import { PedidoItem, PedidoItemInput } from "./edit-pedido/pedido-item.model";
import { Pedido, PedidoInput } from "./edit-pedido/pedido.model";

// GQLs Actuales y Nuevos
import { PedidoInfoCompletaGQL } from "./graphql/pedidoInfoCompleta";
import { SavePedidoGQL } from "./graphql/savePedido";
import { PedidoItemPorIdGQL } from "./nota-recepcion/graphql/pedidoItemPorId";
import { DeletePedidoItemGQL } from "./pedido-itens/graphql/deletePedidoItem";
import { SavePedidoItemGQL } from "./pedido-itens/graphql/savePedidoItem";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PageInfo } from "../../../app.component";
import { SavePedidoFullGQL } from "./graphql/savePedidoFull";
import { PedidoItemPorPedidoPageGQL } from "./graphql/pedido-item-por-pedido-page";
import { AddPedidoItemToNotaRecepcionGQL } from "./graphql/add-item-list-to-nota-recepcion";
import { PedidoItemPorNotaRecepcionGQL } from "./graphql/pedido-item-por-nota-recepcion";
import { FilterPedidosGQL } from "./graphql/filterPedidos";
import { PedidoEstado } from "./edit-pedido/pedido-enums";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class PedidoService {
  actualizarSub = new BehaviorSubject<boolean>(false);

  constructor(
    private genericService: GenericCrudService,
    private notificacionBar: NotificacionSnackbarService,
    // Inyecciones Principales
    private getPedidoPorId: PedidoInfoCompletaGQL,
    private savePedido: SavePedidoGQL,
    private savePedidoFull: SavePedidoFullGQL,
    private deletePedidoItem: DeletePedidoItemGQL,
    private savePedidoItem: SavePedidoItemGQL,
    private pedidoItemPorId: PedidoItemPorIdGQL,
    private pedidoItemPorPedidoPage: PedidoItemPorPedidoPageGQL,
    private addPedidoItemToNotaRecepcion: AddPedidoItemToNotaRecepcionGQL,
    private pedidoItemPorNotaRecepcion: PedidoItemPorNotaRecepcionGQL,
    private filterPedidos: FilterPedidosGQL,
    private finalizarCreacionPedido: FinalizarCreacionPedidoGQL, // NUEVO
  ) {}

  onGetPedidoInfoCompleta(id): Observable<Pedido> {
    return this.genericService.onGetById(this.getPedidoPorId, id);
  }

  onGetPedidoInfoCompletaFresh(id): Observable<Pedido> {
    return this.genericService.onGetById(this.getPedidoPorId, id, null, null, true);
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
    idPedido: number,
    numeroNotaRecepcion: number,
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
      idPedido,
      numeroNotaRecepcion,
      estado,
      sucursalId,
      inicio,
      fin,
      proveedorId,
      vendedorId,
      formaPagoId,
      productoId,
      page,
      size,
    });
  }

  onSave(input: PedidoInput): Observable<Pedido> {
    return this.genericService.onSave<Pedido>(this.savePedido, input);
  }

  onDeletePedidoItem(id): Observable<boolean> {
    this.actualizarSub.next(true);
    return this.genericService.onDelete(this.deletePedidoItem, id, "¿Eliminar item de pedido?", null, false, true, "¿Está seguro que desea eliminar este item de pedido?");
  }

  onSaveItem(input: PedidoItemInput): Observable<PedidoItem> {
    this.actualizarSub.next(true);
    return this.genericService.onSave(this.savePedidoItem, input);
  }

  onGetPedidoItemPorNotaRecepcion(
    id,
    page,
    size,
    texto?,
    verificado?,
    pedidoId?
  ): Observable<PageInfo<PedidoItem>> {
    return this.genericService.onCustomQuery(this.pedidoItemPorNotaRecepcion, {
      id,
      page,
      size,
      texto,
      verificado,
      pedidoId,
    });
  }

  onGetPedidoItem(id): Observable<PedidoItem> {
    return this.genericService.onGetById(this.pedidoItemPorId, id);
  }

  onGetPedidoItemPorPedido(
    id,
    page,
    size,
    texto?
  ): Observable<PageInfo<PedidoItem>> {
    return this.genericService.onCustomQuery(this.pedidoItemPorPedidoPage, {
      id,
      page,
      size,
      texto,
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

  // MÉTODO REFACTORIZADO
  onFinalizarCreacionPedido(id: number): Observable<any> {
    return this.genericService.onCustomMutation(this.finalizarCreacionPedido, {
      id
    });
  }

  // MÉTODOS OBSOLETOS ELIMINADOS
  // onFinalizarPedido
  // onVerificarItemRecepcionProducto
  // onGetCantPedidoItensFaltaVerificaNota
  // onGetCantPedidoItensFaltaVerificaProducto
  // onGetPedidoItemSobrantes
  // onUpdateNotaRecepcionId
  // onGetPedidoInfoDetalle
  // onGetAll
  // onGetPedidoItemSucursalList
  // onVerificarDistribucionSucursales
  // onGetPedidoRecepcionNotaSummary
  // onGetPedidoSummary
  // prepareItemsForStepTransition
  // hasDataForStep
  // markItemsAsVerified
  // getCurrentStepFromPedidoEstado
}
