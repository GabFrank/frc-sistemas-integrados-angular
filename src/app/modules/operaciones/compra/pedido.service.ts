import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';

// GraphQL imports
import { SavePedidoFullGQL } from './gestion-compras/graphql/savePedidoFull';
import { GetPedidoGQL } from './gestion-compras/graphql/getPedido';
import { GetPedidoItemsGQL } from './gestion-compras/graphql/getPedidoItems';
import { SavePedidoItemGQL } from './gestion-compras/graphql/savePedidoItem';
import { DeletePedidoItemGQL } from './gestion-compras/graphql/deletePedidoItem';
import { GetPedidoResumenGQL, PedidoResumen } from './gestion-compras/graphql/getPedidoResumen';

// Models
import { Pedido } from './gestion-compras/pedido.model';
import { PedidoItem, PedidoItemInput } from './gestion-compras/pedido-item.model';
import { GetPedidoItemPorPedidoPageGQL } from './gestion-compras/graphql/getPedidoItemPage';
import { PageInfo } from '../../../app.component';

// PedidoItemDistribucion imports
import { GetPedidoItemDistribucionesGQL } from './gestion-compras/graphql/getPedidoItemDistribuciones';
import { SavePedidoItemDistribucionesGQL } from './gestion-compras/graphql/savePedidoItemDistribuciones';
import { DeletePedidoItemDistribucionesGQL } from './gestion-compras/graphql/deletePedidoItemDistribuciones';
import { IsDistribucionConcluidaGQL } from './gestion-compras/graphql/isDistribucionConcluida';
import { PedidoItemDistribucion, PedidoItemDistribucionInput } from './gestion-compras/pedido-item-distribucion.model';

// NotaRecepcionItemDistribucion imports
import { GetNotaRecepcionItemDistribucionGQL } from './gestion-compras/graphql/getNotaRecepcionItemDistribucion';
import { GetNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL } from './gestion-compras/graphql/getNotaRecepcionItemDistribucionesByNotaRecepcionItemId';
import { SaveNotaRecepcionItemDistribucionGQL } from './gestion-compras/graphql/saveNotaRecepcionItemDistribucion';
import { FinalizarCreacionPedidoGQL } from './gestion-compras/graphql/finalizarCreacionPedido';
import { SaveNotaRecepcionItemDistribucionesGQL } from './gestion-compras/graphql/saveNotaRecepcionItemDistribuciones';
import { ReplaceNotaRecepcionItemDistribucionesGQL } from './gestion-compras/graphql/replaceNotaRecepcionItemDistribuciones';
import { NotaRecepcionItemDistribucion, NotaRecepcionItemDistribucionInput } from './gestion-compras/models/nota-recepcion-item-distribucion.model';

// NotaRecepcion imports
import { GetNotaRecepcionPorPedidoIdGQL } from './gestion-compras/graphql/getNotaRecepcionPorPedidoId';
import { GetNotaRecepcionPorPedidoIdAndNumeroPageGQL } from './gestion-compras/graphql/getNotaRecepcionPorPedidoIdAndNumeroPage';
import { SaveNotaRecepcionGQL } from './gestion-compras/graphql/saveNotaRecepcion';
import { DeleteNotaRecepcionGQL } from './gestion-compras/graphql/deleteNotaRecepcion';
import { GetNotaRecepcionByIdGQL } from './gestion-compras/graphql/getNotaRecepcionById';
import { NotaRecepcion } from './gestion-compras/nota-recepcion.model';
import { AsignarItemsANotaGQL, AsignacionResult } from './gestion-compras/graphql/asignarItemsANota';

// NotaRecepcionItem imports
import { GetNotaRecepcionItemGQL } from './gestion-compras/graphql/getNotaRecepcionItem';
import { GetNotaRecepcionItemListGQL } from './gestion-compras/graphql/getNotaRecepcionItemList';
import { GetNotaRecepcionItemListPorNotaRecepcionIdGQL } from './gestion-compras/graphql/getNotaRecepcionItemListPorNotaRecepcionId';
import { SaveNotaRecepcionItemGQL } from './gestion-compras/graphql/saveNotaRecepcionItem';
import { DeleteNotaRecepcionItemGQL } from './gestion-compras/graphql/deleteNotaRecepcionItem';
import { NotaRecepcionItem } from './gestion-compras/nota-recepcion-item.model';

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
    private getPedidoResumenGQL: GetPedidoResumenGQL,
    // PedidoItemDistribucion services
    private getPedidoItemDistribucionesGQL: GetPedidoItemDistribucionesGQL,
    private savePedidoItemDistribucionesGQL: SavePedidoItemDistribucionesGQL,
    private deletePedidoItemDistribucionesGQL: DeletePedidoItemDistribucionesGQL,
    private isDistribucionConcluidaGQL: IsDistribucionConcluidaGQL,
    // NotaRecepcionItemDistribucion services
    private getNotaRecepcionItemDistribucionGQL: GetNotaRecepcionItemDistribucionGQL,
    private getNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL: GetNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL,
    private saveNotaRecepcionItemDistribucionGQL: SaveNotaRecepcionItemDistribucionGQL,
    private saveNotaRecepcionItemDistribucionesGQL: SaveNotaRecepcionItemDistribucionesGQL,
    private replaceNotaRecepcionItemDistribucionesGQL: ReplaceNotaRecepcionItemDistribucionesGQL,
    private finalizarCreacionPedidoGQL: FinalizarCreacionPedidoGQL,
    // NotaRecepcion services
    private getNotaRecepcionPorPedidoIdGQL: GetNotaRecepcionPorPedidoIdGQL,
    private getNotaRecepcionPorPedidoIdAndNumeroPageGQL: GetNotaRecepcionPorPedidoIdAndNumeroPageGQL,
    private saveNotaRecepcionGQL: SaveNotaRecepcionGQL,
    private deleteNotaRecepcionGQL: DeleteNotaRecepcionGQL,
    private getNotaRecepcionByIdGQL: GetNotaRecepcionByIdGQL,
    private asignarItemsANotaGQL: AsignarItemsANotaGQL,
    // NotaRecepcionItem services
    private getNotaRecepcionItemGQL: GetNotaRecepcionItemGQL,
    private getNotaRecepcionItemListGQL: GetNotaRecepcionItemListGQL,
    private getNotaRecepcionItemListPorNotaRecepcionIdGQL: GetNotaRecepcionItemListPorNotaRecepcionIdGQL,
    private saveNotaRecepcionItemGQL: SaveNotaRecepcionItemGQL,
    private deleteNotaRecepcionItemGQL: DeleteNotaRecepcionItemGQL
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
   * Obtiene el resumen del pedido con información actualizada
   * @param pedidoId - ID del pedido
   * @returns Observable<PedidoResumen>
   */
  onGetPedidoResumen(pedidoId: number): Observable<PedidoResumen> {
    return this.genericCrudService.onCustomQuery(this.getPedidoResumenGQL, { pedidoId: pedidoId });
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

  /**
   * Verifica si la distribución de un pedido item está concluida
   * @param pedidoItemId - ID del pedido item
   * @returns Observable<boolean> - true si la distribución está concluida, false si está pendiente
   */
  onIsDistribucionConcluida(pedidoItemId: number): Observable<boolean> {
    return this.genericCrudService.onCustomQuery(this.isDistribucionConcluidaGQL, { pedidoItemId });
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

  // ===============================================
  // WORKFLOW METHODS
  // ===============================================

  /**
   * Finaliza la etapa de creación del pedido y avanza a la siguiente etapa
   * @param pedidoId - ID del pedido a finalizar
   * @returns Observable<Pedido>
   */
  onFinalizarCreacionPedido(pedidoId: number): Observable<Pedido> {
    const data = {
      pedidoId: pedidoId
    };
    
    return this.genericCrudService.onCustomMutation(this.finalizarCreacionPedidoGQL, data);
  }

  // ===============================================
  // NOTA RECEPCION METHODS
  // ===============================================

  /**
   * Obtiene todas las notas de recepción de un pedido
   * @param pedidoId - ID del pedido
   * @returns Observable<NotaRecepcion[]>
   */
  onGetNotaRecepcionPorPedidoId(pedidoId: number): Observable<NotaRecepcion[]> {
    return this.genericCrudService.onCustomQuery(this.getNotaRecepcionPorPedidoIdGQL, { pedidoId });
  }

  /**
   * Obtiene las notas de recepción de un pedido con paginación y filtro por número
   * @param pedidoId - ID del pedido
   * @param numero - Número de nota (opcional)
   * @param page - Número de página
   * @param size - Tamaño de página
   * @returns Observable<PageInfo<NotaRecepcion>>
   */
  onGetNotaRecepcionPorPedidoIdAndNumeroPage(
    pedidoId: number, 
    numero: number | null, 
    page: number, 
    size: number
  ): Observable<PageInfo<NotaRecepcion>> {
    return this.genericCrudService.onCustomQuery(
      this.getNotaRecepcionPorPedidoIdAndNumeroPageGQL, 
      { pedidoId, numero, page, size }
    );
  }

  /**
   * Obtiene una nota de recepción por ID
   * @param id - ID de la nota de recepción
   * @returns Observable<NotaRecepcion>
   */
  onGetNotaRecepcionById(id: number): Observable<NotaRecepcion> {
    return this.genericCrudService.onCustomQuery(this.getNotaRecepcionByIdGQL, { id });
  }

  /**
   * Guarda una nota de recepción (crear o actualizar)
   * @param notaRecepcionInput - Datos de la nota de recepción
   * @returns Observable<NotaRecepcion>
   */
  onSaveNotaRecepcion(notaRecepcionInput: any): Observable<NotaRecepcion> {
    const data = {
      entity: notaRecepcionInput
    };
    
    return this.genericCrudService.onCustomMutation(this.saveNotaRecepcionGQL, data);
  }

  /**
   * Elimina una nota de recepción
   * @param id - ID de la nota de recepción a eliminar
   * @returns Observable<boolean>
   */
  onDeleteNotaRecepcion(id: number): Observable<boolean> {
    const data = {
      id: id
    };
    
    return this.genericCrudService.onCustomMutation(this.deleteNotaRecepcionGQL, data);
  }

  /**
   * Asigna ítems de pedido a una nota de recepción
   * @param notaRecepcionId - ID de la nota de recepción
   * @param pedidoItemIds - Array de IDs de ítems de pedido a asignar
   * @returns Observable<AsignacionResult>
   */
  onAsignarItemsANota(notaRecepcionId: number, pedidoItemIds: number[]): Observable<AsignacionResult> {
    return this.asignarItemsANotaGQL.mutate(notaRecepcionId, pedidoItemIds);
  }

  // ===============================================
  // NOTA RECEPCION ITEM METHODS
  // ===============================================

  /**
   * Obtiene un ítem de nota de recepción por ID
   * @param id - ID del ítem
   * @returns Observable<NotaRecepcionItem>
   */
  onGetNotaRecepcionItemById(id: number): Observable<NotaRecepcionItem> {
    return this.genericCrudService.onGetById(this.getNotaRecepcionItemGQL, id);
  }

  /**
   * Obtiene lista paginada de ítems de nota de recepción
   * @param page - Número de página
   * @param size - Tamaño de página
   * @returns Observable<NotaRecepcionItem[]>
   */
  onGetNotaRecepcionItemList(page: number, size: number): Observable<NotaRecepcionItem[]> {
    return this.genericCrudService.onCustomQuery(this.getNotaRecepcionItemListGQL, { page, size });
  }

  /**
   * Obtiene ítems de nota de recepción por ID de nota de recepción
   * @param notaRecepcionId - ID de la nota de recepción
   * @returns Observable<NotaRecepcionItem[]>
   */
  onGetNotaRecepcionItemListPorNotaRecepcionId(notaRecepcionId: number): Observable<NotaRecepcionItem[]> {
    return this.genericCrudService.onCustomQuery(this.getNotaRecepcionItemListPorNotaRecepcionIdGQL, { id: notaRecepcionId });
  }

  /**
   * Guarda un ítem de nota de recepción
   * @param notaRecepcionItemInput - Datos del ítem a guardar
   * @returns Observable<NotaRecepcionItem>
   */
  onSaveNotaRecepcionItem(notaRecepcionItemInput: any): Observable<NotaRecepcionItem> {
    const data = {
      NotaRecepcionItem: notaRecepcionItemInput
    };
    
    return this.genericCrudService.onCustomMutation(this.saveNotaRecepcionItemGQL, data);
  }

  /**
   * Elimina un ítem de nota de recepción
   * @param id - ID del ítem a eliminar
   * @returns Observable<boolean>
   */
  onDeleteNotaRecepcionItem(id: number): Observable<boolean> {
    const data = {
      id: id
    };
    
    return this.genericCrudService.onCustomMutation(this.deleteNotaRecepcionItemGQL, data);
  }
} 