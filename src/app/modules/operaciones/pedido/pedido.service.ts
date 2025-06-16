import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { PedidoItem, PedidoItemInput, PedidoStep } from "./edit-pedido/pedido-item.model";
import { Pedido, PedidoInput, PedidoRecepcionNotaSummary, PedidoSummary } from "./edit-pedido/pedido.model";
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
import { VerificarItemRecepcionProductoGQL } from "./graphql/verificar-item-recepcion-producto";
import { PedidoItensFaltaVerificacionNotaGQL } from "./graphql/cantidadPedidoItensFaltanteVerficacionNota";
import { PedidoItensFaltaVerificacionProductoGQL } from "./graphql/cantidadPedidoItensFaltanteVerficacionProducto";
import { PedidoItemGQL } from './graphql/pedidoItem';
import { PedidoItemSucursalListGQL } from './graphql/pedidoItemSucursalList';
import { VerificarDistribucionSucursalesGQL } from './graphql/verificarDistribucionSucursales';
import { PedidoRecepcionNotaSummaryGQL } from './graphql/pedidoRecepcionNotaSummary';
import { PedidoSummaryGQL } from './graphql/pedidoSummary';

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
    private filterPedidos: FilterPedidosGQL,
    private verificarRecepcionProducto: VerificarItemRecepcionProductoGQL,
    private cantFaltaVerifNota: PedidoItensFaltaVerificacionNotaGQL,
    private cantFaltaVerifProducto: PedidoItensFaltaVerificacionProductoGQL,
    private pedidoItemGQL: PedidoItemGQL,
    private pedidoItemSucursalListGQL: PedidoItemSucursalListGQL,
    private verificarDistribucionSucursalesGQL: VerificarDistribucionSucursalesGQL,
    private pedidoRecepcionNotaSummaryGQL: PedidoRecepcionNotaSummaryGQL,
    private pedidoSummaryGQL: PedidoSummaryGQL,
  ) {}

  onGetPedidoInfoCompleta(id): Observable<Pedido> {
    return this.genericService.onGetById(this.getPedidoPorId, id);
  }

  onGetPedidoInfoCompletaFresh(id): Observable<Pedido> {
    // Use generic service to ensure proper cache management and error handling
    return this.genericService.onGetById(this.getPedidoPorId, id, null, null, true);
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

  onGetAll(): Observable<Pedido[]> {
    return this.genericService.onGetAll(this.getAllPedidos);
  }

  onDeletePedidoItem(id): Observable<boolean> {
    this.actualizarSub.next(true);
    return this.genericService.onDelete(this.deletePedidoItem, id, "¿Eliminar item de pedido?", null, false, true, "¿Está seguro que desea eliminar este item de pedido?");
  }

  onSaveItem(input: PedidoItemInput): Observable<PedidoItem> {
    this.actualizarSub.next(true);
    return this.genericService.onSave(this.savePedidoItem, input);
  }

  onGetPedidoItemSobrantes(
    id,
    page,
    size,
    texto?
  ): Observable<PageInfo<PedidoItem>> {
    return this.genericService.onCustomQuery(this.getPedidoItemSobrantes, {
      id,
      page,
      size,
      texto,
    });
  }

  onGetPedidoItemPorNotaRecepcion(
    id,
    page,
    size,
    texto?,
    verificado?
  ): Observable<PageInfo<PedidoItem>> {
    return this.genericService.onCustomQuery(this.pedidoItemPorNotaRecepcion, {
      id,
      page,
      size,
      texto,
      verificado,
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

  onUpdateNotaRecepcionId(
    pedidoItemId: number,
    notaRecepcionId: number
  ): Observable<PedidoItem> {
    this.actualizarSub.next(true);
    // Use generic service to ensure proper cache management and error handling
    return this.genericService.onCustomMutation(this.updateNotaRecepcionId, {
      pedidoItemId,
      notaRecepcionId,
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

  onVerificarItemRecepcionProducto(pedidoItemId, verificar) {
    return this.genericService.onCustomMutation(
      this.verificarRecepcionProducto,
      {
        pedidoItemId,
        verificar,
      }
    );
  }

  onGetCantPedidoItensFaltaVerificaNota(id){
    return this.genericService.onCustomQuery(this.cantFaltaVerifNota, {id})
  }

  onGetCantPedidoItensFaltaVerificaProducto(id){
    return this.genericService.onCustomQuery(this.cantFaltaVerifProducto, {id})
  }

  onGetPedidoItemById(id): Observable<PedidoItem> {
    return this.genericService.onGetById(this.pedidoItemGQL, id);
  }

  onGetPedidoItemSucursalList(id): Observable<PedidoItem> {
    return this.genericService.onGetById(this.pedidoItemSucursalListGQL, id);
  }

  onVerificarDistribucionSucursales(id): Observable<boolean> {
    return this.genericService.onCustomQuery(this.verificarDistribucionSucursalesGQL, {
      id,
    });
  }

  onGetPedidoRecepcionNotaSummary(id: number): Observable<PedidoRecepcionNotaSummary> {
    return this.genericService.onCustomQuery(this.pedidoRecepcionNotaSummaryGQL, { id });
  }

  onGetPedidoSummary(id: number): Observable<PedidoSummary> {
    return this.genericService.onCustomQuery(this.pedidoSummaryGQL, { id });
  }

  // Step-aware methods for PedidoItem management
  
  /**
   * Prepare pedido items for step transition by copying previous step data if no modifications exist
   * @param pedidoId - ID of the pedido
   * @param fromStep - Previous step
   * @param toStep - Target step
   */
  prepareItemsForStepTransition(pedidoId: number, fromStep: PedidoStep, toStep: PedidoStep): Observable<boolean> {
    return this.onGetPedidoInfoCompleta(pedidoId).pipe(
      map(pedido => {
        let hasUpdates = false;
        
        pedido.pedidoItens?.forEach(itemData => {
          // Create a proper PedidoItem instance from the data
          const item = new PedidoItem();
          Object.assign(item, itemData);
          
          // Only copy values if the target step doesn't have data yet
          if (!this.hasDataForStep(item, toStep)) {
            item.copyStepValues(fromStep, toStep);
            
            // Copy the modified values back to the original object
            Object.assign(itemData, item);
            hasUpdates = true;
          }
        });
        
        // Save the updated pedido if there were changes
        if (hasUpdates) {
          this.onSave(pedido.toInput()).subscribe();
        }
        
        return hasUpdates;
      })
    );
  }
  
  /**
   * Check if a pedido item has data for a specific step
   */
  private hasDataForStep(item: PedidoItem, step: PedidoStep): boolean {
    switch (step) {
      case PedidoStep.RECEPCION_NOTA:
        return item.precioUnitarioRecepcionNota !== null && 
               item.precioUnitarioRecepcionNota !== undefined;
      case PedidoStep.RECEPCION_PRODUCTO:
        return item.precioUnitarioRecepcionProducto !== null && 
               item.precioUnitarioRecepcionProducto !== undefined;
      default:
        return true; // Creation step always has data
    }
  }
  
  /**
   * Mark pedido items as verified for a specific step
   * @param pedidoItemIds - Array of pedido item IDs
   * @param step - Step to mark as verified
   */
  markItemsAsVerified(pedidoItemIds: number[], step: PedidoStep): Observable<boolean> {
    // This would need a corresponding GraphQL mutation
    // For now, returning a placeholder
    console.log(`Marking items ${pedidoItemIds} as verified for step ${step}`);
    return of(true);
  }
  
  /**
   * Get current step context based on pedido estado
   */
  getCurrentStepFromPedidoEstado(estado: any): PedidoStep {
    switch (estado) {
      case 'ABIERTO':
      case 'ACTIVO':
        return PedidoStep.DETALLES_PEDIDO;
      case 'EN_RECEPCION_NOTA':
        return PedidoStep.RECEPCION_NOTA;
      case 'EN_RECEPCION_MERCADERIA':
        return PedidoStep.RECEPCION_PRODUCTO;
      default:
        return PedidoStep.DETALLES_PEDIDO;
    }
  }
}
