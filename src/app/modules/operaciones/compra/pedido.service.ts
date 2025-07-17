import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';

// GraphQL imports
import { SavePedidoFullGQL } from './gestion-compras/graphql/savePedidoFull';
import { GetPedidoGQL } from './gestion-compras/graphql/getPedido';
import { GetPedidoItemsGQL } from './gestion-compras/graphql/getPedidoItems';
import { SavePedidoItemGQL } from './gestion-compras/graphql/savePedidoItem';
import { DeletePedidoItemGQL } from './gestion-compras/graphql/deletePedidoItem';

// Models
import { Pedido } from './gestion-compras/pedido.model';
import { PedidoItem, PedidoItemInput } from './gestion-compras/pedido-item.model';
import { GetPedidoItemPorPedidoPageGQL } from './gestion-compras/graphql/getPedidoItemPage';
import { PageInfo } from '../../../app.component';

// PedidoItemDistribucion imports
import { GetPedidoItemDistribucionesGQL } from './gestion-compras/graphql/getPedidoItemDistribuciones';
import { SavePedidoItemDistribucionesGQL } from './gestion-compras/graphql/savePedidoItemDistribuciones';
import { DeletePedidoItemDistribucionesGQL } from './gestion-compras/graphql/deletePedidoItemDistribuciones';
import { PedidoItemDistribucion, PedidoItemDistribucionInput } from './gestion-compras/pedido-item-distribucion.model';

// NotaRecepcionItemDistribucion imports
import { GetNotaRecepcionItemDistribucionGQL } from './gestion-compras/graphql/getNotaRecepcionItemDistribucion';
import { GetNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL } from './gestion-compras/graphql/getNotaRecepcionItemDistribucionesByNotaRecepcionItemId';
import { SaveNotaRecepcionItemDistribucionGQL } from './gestion-compras/graphql/saveNotaRecepcionItemDistribucion';
import { SaveNotaRecepcionItemDistribucionesGQL } from './gestion-compras/graphql/saveNotaRecepcionItemDistribuciones';
import { ReplaceNotaRecepcionItemDistribucionesGQL } from './gestion-compras/graphql/replaceNotaRecepcionItemDistribuciones';
import { NotaRecepcionItemDistribucion, NotaRecepcionItemDistribucionInput } from './gestion-compras/models/nota-recepcion-item-distribucion.model';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  constructor(
    private genericCrudService: GenericCrudService,
    private savePedidoFullGQL: SavePedidoFullGQL,
    private getPedidoGQL: GetPedidoGQL,
    private getPedidoItemsGQL: GetPedidoItemsGQL,
    private getPedidoItemPorPedidoPageGQL: GetPedidoItemPorPedidoPageGQL,
    private savePedidoItemGQL: SavePedidoItemGQL,
    private deletePedidoItemGQL: DeletePedidoItemGQL,
    // PedidoItemDistribucion services
    private getPedidoItemDistribucionesGQL: GetPedidoItemDistribucionesGQL,
    private savePedidoItemDistribucionesGQL: SavePedidoItemDistribucionesGQL,
    private deletePedidoItemDistribucionesGQL: DeletePedidoItemDistribucionesGQL,
    // NotaRecepcionItemDistribucion services
    private getNotaRecepcionItemDistribucionGQL: GetNotaRecepcionItemDistribucionGQL,
    private getNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL: GetNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL,
    private saveNotaRecepcionItemDistribucionGQL: SaveNotaRecepcionItemDistribucionGQL,
    private saveNotaRecepcionItemDistribucionesGQL: SaveNotaRecepcionItemDistribucionesGQL,
    private replaceNotaRecepcionItemDistribucionesGQL: ReplaceNotaRecepcionItemDistribucionesGQL
  ) {}

  /**
   * Obtiene un pedido por ID
   * @param id - ID del pedido
   * @returns Observable<Pedido>
   */
  onGetPedidoById(id: number): Observable<Pedido> {
    return this.genericCrudService.onGetById(this.getPedidoGQL, id);
  }

  /**
   * Obtiene los ítems de un pedido por ID
   * @param pedidoId - ID del pedido
   * @returns Observable<PedidoItem[]>
   */
  onGetPedidoItemsByPedidoId(pedidoId: number): Observable<PedidoItem[]> {
    return this.genericCrudService.onCustomQuery(this.getPedidoItemsGQL, { id: pedidoId });
  }

  onGetPedidoItemPorPedidoPage(pedidoId: number, page: number, size: number, texto: string): Observable<PageInfo<PedidoItem>> {
    return this.genericCrudService.onCustomQuery(this.getPedidoItemPorPedidoPageGQL, { pedidoId, page, size, texto });
  }

  /**
   * Guarda un pedido completo con toda la información de cabecera
   * @param pedidoInput - Datos del pedido a guardar
   * @param fechaEntregaList - Lista de fechas de entrega
   * @param sucursalEntregaList - Lista de IDs de sucursales de entrega
   * @param sucursalInfluenciaList - Lista de IDs de sucursales de influencia
   * @param usuarioId - ID del usuario que crea el pedido
   * @returns Observable<Pedido>
   */
  onSavePedidoFull(
    pedidoInput: any,
    fechaEntregaList: string[],
    sucursalEntregaList: number[],
    sucursalInfluenciaList: number[],
    usuarioId: number
  ): Observable<Pedido> {
    const data = {
      entity: pedidoInput,
      fechaEntregaList,
      sucursalEntregaList,
      sucursalInfluenciaList,
      usuarioId
    };
    
    return this.genericCrudService.onCustomMutation(this.savePedidoFullGQL, data);
  }

  /**
   * Guarda un ítem del pedido
   * @param pedidoItemInput - Datos del ítem a guardar
   * @returns Observable<PedidoItem>
   */
  onSavePedidoItem(pedidoItemInput: PedidoItemInput): Observable<PedidoItem> {
    const data = {
      input: pedidoItemInput
    };
    
    return this.genericCrudService.onCustomMutation(this.savePedidoItemGQL, data);
  }

  /**
   * Elimina un ítem del pedido
   * @param id - ID del ítem a eliminar
   * @returns Observable<boolean>
   */
  onDeletePedidoItem(id: number): Observable<boolean> {
    const data = {
      id: id
    };
    
    return this.genericCrudService.onCustomMutation(this.deletePedidoItemGQL, data);
  }

  /**
   * Elimina un pedido
   * @param id - ID del pedido a eliminar
   * @param showDialog - Si mostrar diálogo de confirmación
   * @returns Observable<any>
   */
  onDeletePedido(id: number, showDialog: boolean = true): Observable<any> {
    return this.genericCrudService.onDelete(
      this.savePedidoFullGQL, // Usar el mismo GQL service para eliminar
      id,
      'Eliminar Pedido',
      null,
      showDialog
    );
  }

  // ===============================================
  // PEDIDO ITEM DISTRIBUCION METHODS
  // ===============================================

  /**
   * Obtiene las distribuciones de un ítem de pedido
   * @param pedidoItemId - ID del ítem de pedido
   * @returns Observable<PedidoItemDistribucion[]>
   */
  onGetPedidoItemDistribucionesByPedidoItemId(pedidoItemId: number): Observable<PedidoItemDistribucion[]> {
    return this.genericCrudService.onCustomQuery(this.getPedidoItemDistribucionesGQL, { pedidoItemId });
  }

  /**
   * Guarda múltiples distribuciones de ítem de pedido
   * @param distribuciones - Array de distribuciones a guardar
   * @returns Observable<PedidoItemDistribucion[]>
   */
  onSavePedidoItemDistribuciones(pedidoItemId: number, distribuciones: PedidoItemDistribucion[]): Observable<PedidoItemDistribucion[]> {
    return this.genericCrudService.onCustomMutation(this.savePedidoItemDistribucionesGQL, { pedidoItemId: pedidoItemId, inputs: distribuciones });
  }

  /**
   * Elimina múltiples distribuciones de ítem de pedido por IDs
   * @param ids - Array de IDs de distribuciones a eliminar
   * @returns Observable<boolean>
   */
  onDeletePedidoItemDistribuciones(ids: number[]): Observable<boolean> {
    return this.genericCrudService.onCustomMutation(this.deletePedidoItemDistribucionesGQL, { ids });
  }

  // ===============================================
  // NOTA RECEPCION ITEM DISTRIBUCION METHODS
  // ===============================================

  /**
   * Obtiene una distribución de ítem de nota de recepción por ID
   * @param id - ID de la distribución
   * @returns Observable<NotaRecepcionItemDistribucion>
   */
  onGetNotaRecepcionItemDistribucionById(id: number): Observable<NotaRecepcionItemDistribucion> {
    return this.genericCrudService.onGetById(this.getNotaRecepcionItemDistribucionGQL, id);
  }

  /**
   * Obtiene las distribuciones de un ítem de nota de recepción
   * @param notaRecepcionItemId - ID del ítem de nota de recepción
   * @returns Observable<NotaRecepcionItemDistribucion[]>
   */
  onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId(notaRecepcionItemId: number): Observable<NotaRecepcionItemDistribucion[]> {
    return this.genericCrudService.onCustomQuery(this.getNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL, { notaRecepcionItemId });
  }

  /**
   * Guarda una distribución de ítem de nota de recepción
   * @param distribucionInput - Datos de la distribución a guardar
   * @returns Observable<NotaRecepcionItemDistribucion>
   */
  onSaveNotaRecepcionItemDistribucion(distribucionInput: NotaRecepcionItemDistribucionInput): Observable<NotaRecepcionItemDistribucion> {
    const data = {
      input: distribucionInput
    };
    
    return this.genericCrudService.onCustomMutation(this.saveNotaRecepcionItemDistribucionGQL, data);
  }

  /**
   * Guarda múltiples distribuciones de ítem de nota de recepción
   * @param distribucionesInput - Array de distribuciones a guardar
   * @returns Observable<NotaRecepcionItemDistribucion[]>
   */
  onSaveNotaRecepcionItemDistribuciones(distribucionesInput: NotaRecepcionItemDistribucionInput[]): Observable<NotaRecepcionItemDistribucion[]> {
    const data = {
      inputs: distribucionesInput
    };
    
    return this.genericCrudService.onCustomMutation(this.saveNotaRecepcionItemDistribucionesGQL, data);
  }

  /**
   * Reemplaza todas las distribuciones de un ítem de nota de recepción
   * @param notaRecepcionItemId - ID del ítem de nota de recepción
   * @param distribucionesInput - Array de nuevas distribuciones
   * @returns Observable<NotaRecepcionItemDistribucion[]>
   */
  onReplaceNotaRecepcionItemDistribuciones(notaRecepcionItemId: number, distribucionesInput: NotaRecepcionItemDistribucionInput[]): Observable<NotaRecepcionItemDistribucion[]> {
    const data = {
      notaRecepcionItemId,
      inputs: distribucionesInput
    };
    
    return this.genericCrudService.onCustomMutation(this.replaceNotaRecepcionItemDistribucionesGQL, data);
  }
} 