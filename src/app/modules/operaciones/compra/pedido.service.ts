import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
import { ReplacePedidoItemDistribucionesGQL } from './gestion-compras/graphql/replacePedidoItemDistribuciones';
import { MergePedidoItemDistribucionesGQL } from './gestion-compras/graphql/mergePedidoItemDistribuciones';
import { DeletePedidoItemDistribucionesGQL } from './gestion-compras/graphql/deletePedidoItemDistribuciones';
import { IsDistribucionConcluidaGQL } from './gestion-compras/graphql/isDistribucionConcluida';
import { PedidoItemDistribucion, PedidoItemDistribucionInput } from './gestion-compras/pedido-item-distribucion.model';

// NotaRecepcionItemDistribucion imports
import { GetNotaRecepcionItemDistribucionGQL } from './gestion-compras/graphql/getNotaRecepcionItemDistribucion';
import { GetNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL } from './gestion-compras/graphql/getNotaRecepcionItemDistribucionesByNotaRecepcionItemId';
import { SaveNotaRecepcionItemDistribucionGQL } from './gestion-compras/graphql/saveNotaRecepcionItemDistribucion';
import { FinalizarCreacionPedidoGQL } from './gestion-compras/graphql/finalizarCreacionPedido';
import { RevertirEtapaCreacionGQL } from './gestion-compras/graphql/revertirEtapaCreacion';
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
import { GetNotaRecepcionItemListPorNotaRecepcionIdYSucursalesGQL } from './gestion-compras/graphql/getNotaRecepcionItemListPorNotaRecepcionIdYSucursales';
import { SaveNotaRecepcionItemGQL } from './gestion-compras/graphql/saveNotaRecepcionItem';
import { DeleteNotaRecepcionItemGQL } from './gestion-compras/graphql/deleteNotaRecepcionItem';
import { NotaRecepcionItem } from './gestion-compras/nota-recepcion-item.model';
import { FinalizarRecepcionNotasGQL } from './gestion-compras/graphql/finalizarRecepcionNotas';

// RecepcionMercaderia imports
import { GetSucursalesDisponiblesRecepcionFisicaGQL } from './gestion-compras/graphql/getSucursalesDisponiblesRecepcionFisica';
import { GetNotasRecepcionDisponiblesGQL } from './gestion-compras/recepcion-mercaderia/graphql/get-notas-recepcion-disponibles';
import { SaveRecepcionMercaderiaGQL } from './gestion-compras/recepcion-mercaderia/graphql/save-recepcion-mercaderia';
import { SaveRecepcionMercaderiaItemGQL } from './gestion-compras/recepcion-mercaderia/graphql/save-recepcion-mercaderia-item';
import { RechazarItemGQL, RechazarItemInput } from './gestion-compras/recepcion-mercaderia/graphql/rechazarItemGQL';
import { CancelarVerificacionGQL } from './gestion-compras/recepcion-mercaderia/graphql/cancelarVerificacion';
import { CancelarRechazoGQL } from './gestion-compras/recepcion-mercaderia/graphql/cancelarRechazo';
import { ValidarFinalizacionRecepcionPorPedidoGQL } from './gestion-compras/recepcion-mercaderia/graphql/validarFinalizacionRecepcionPorPedido';
import { FinalizarRecepcionFisicaPorPedidoGQL } from './gestion-compras/recepcion-mercaderia/graphql/finalizarRecepcionFisicaPorPedido';
import { RecepcionarTodoPorNotaGQL } from './gestion-compras/recepcion-mercaderia/graphql/recepcionarTodoPorNota';
import { DeshacerVerificacionTodoPorNotaGQL } from './gestion-compras/recepcion-mercaderia/graphql/deshacerVerificacionTodoPorNota';

// Models
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { RecepcionMercaderiaItem } from './gestion-compras/recepcion-mercaderia-item.model';
import { GetPedidosWithFiltersGQL } from './gestion-compras/graphql/getPedidosWithFilters';

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
    private replacePedidoItemDistribucionesGQL: ReplacePedidoItemDistribucionesGQL,
    private mergePedidoItemDistribucionesGQL: MergePedidoItemDistribucionesGQL,
    private deletePedidoItemDistribucionesGQL: DeletePedidoItemDistribucionesGQL,
    private isDistribucionConcluidaGQL: IsDistribucionConcluidaGQL,
    // NotaRecepcionItemDistribucion services
    private getNotaRecepcionItemDistribucionGQL: GetNotaRecepcionItemDistribucionGQL,
    private getNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL: GetNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL,
    private saveNotaRecepcionItemDistribucionGQL: SaveNotaRecepcionItemDistribucionGQL,
    private saveNotaRecepcionItemDistribucionesGQL: SaveNotaRecepcionItemDistribucionesGQL,
    private replaceNotaRecepcionItemDistribucionesGQL: ReplaceNotaRecepcionItemDistribucionesGQL,
    private finalizarCreacionPedidoGQL: FinalizarCreacionPedidoGQL,
    private revertirEtapaCreacionGQL: RevertirEtapaCreacionGQL,
    private finalizarRecepcionNotasGQL: FinalizarRecepcionNotasGQL,
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
    private getNotaRecepcionItemListPorNotaRecepcionIdYSucursalesGQL: GetNotaRecepcionItemListPorNotaRecepcionIdYSucursalesGQL,
    private saveNotaRecepcionItemGQL: SaveNotaRecepcionItemGQL,
    private deleteNotaRecepcionItemGQL: DeleteNotaRecepcionItemGQL,
    // RecepcionMercaderia services
    private getSucursalesDisponiblesRecepcionFisicaGQL: GetSucursalesDisponiblesRecepcionFisicaGQL,
    private getNotasRecepcionDisponiblesGQL: GetNotasRecepcionDisponiblesGQL,
    private saveRecepcionMercaderiaGQL: SaveRecepcionMercaderiaGQL,
    private saveRecepcionMercaderiaItemGQL: SaveRecepcionMercaderiaItemGQL,
    private rechazarItemGQL: RechazarItemGQL,
    private cancelarVerificacionGQL: CancelarVerificacionGQL,
    private cancelarRechazoGQL: CancelarRechazoGQL,
    private validarFinalizacionRecepcionPorPedidoGQL: ValidarFinalizacionRecepcionPorPedidoGQL,
    private finalizarRecepcionFisicaPorPedidoGQL: FinalizarRecepcionFisicaPorPedidoGQL,
    private recepcionarTodoPorNotaGQL: RecepcionarTodoPorNotaGQL,
    private deshacerVerificacionTodoPorNotaGQL: DeshacerVerificacionTodoPorNotaGQL,
    private getPedidosWithFiltersGQL: GetPedidosWithFiltersGQL
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

  onGetPedidoItemPorPedidoPage(pedidoId: number, page: number, size: number, texto?: string, soloPendientes?: boolean): Observable<PageInfo<PedidoItem>> {
    return this.genericCrudService.onCustomQuery(this.getPedidoItemPorPedidoPageGQL, { pedidoId, page, size, texto, soloPendientes });
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
   * Reemplaza todas las distribuciones de un ítem de pedido
   * @param pedidoItemId - ID del ítem de pedido
   * @param distribucionesInput - Array de nuevas distribuciones
   * @returns Observable<PedidoItemDistribucion[]>
   */
  onReplacePedidoItemDistribuciones(pedidoItemId: number, distribucionesInput: PedidoItemDistribucionInput[]): Observable<PedidoItemDistribucion[]> {
    const data = {
      pedidoItemId,
      inputs: distribucionesInput
    };
    
    return this.genericCrudService.onCustomMutation(this.replacePedidoItemDistribucionesGQL, data);
  }

  /**
   * Merge inteligente de distribuciones: actualiza existentes, crea nuevas, elimina las que ya no están
   * Mantiene los IDs de las distribuciones existentes cuando es posible
   * @param pedidoItemId - ID del ítem de pedido
   * @param distribucionesInput - Array de distribuciones (con IDs si existen)
   * @returns Observable<PedidoItemDistribucion[]>
   */
  onMergePedidoItemDistribuciones(pedidoItemId: number, distribucionesInput: PedidoItemDistribucionInput[]): Observable<PedidoItemDistribucion[]> {
    const data = {
      pedidoItemId,
      inputs: distribucionesInput
    };
    
    return this.genericCrudService.onCustomMutation(this.mergePedidoItemDistribucionesGQL, data);
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

  /**
   * Revierte la etapa CREACION de COMPLETADA a EN_PROCESO
   * Solo se permite si RECEPCION_NOTA está en estado PENDIENTE (no ha empezado)
   * @param pedidoId - ID del pedido
   * @returns Observable<Pedido>
   */
  onRevertirEtapaCreacion(pedidoId: number): Observable<Pedido> {
    const data = {
      pedidoId: pedidoId
    };
    
    return this.genericCrudService.onCustomMutation(this.revertirEtapaCreacionGQL, data);
  }

  /**
   * Finaliza la etapa de recepción de notas de un pedido y avanza a la siguiente etapa
   * @param pedidoId - ID del pedido a finalizar
   * @returns Observable<Pedido>
   */
  onFinalizarRecepcionNotas(pedidoId: number): Observable<Pedido> {
    const data = {
      pedidoId: pedidoId
    };
    
    return this.genericCrudService.onCustomMutation(this.finalizarRecepcionNotasGQL, data);
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
   * Obtiene ítems de nota de recepción por ID de nota de recepción y sucursales
   * @param notaRecepcionId - ID de la nota de recepción
   * @param sucursales - Array de IDs de sucursales
   * @param page - Número de página
   * @param size - Tamaño de página
   * @param filtroVerificacion - Filtro de verificación (TODOS, PENDIENTES, VERIFICADOS, RECHAZADOS)
   * @param filtroTexto - Filtro de texto para búsqueda por código de barras o nombre
   * @returns Observable<PageInfo<NotaRecepcionItem>>
   */
  onGetNotaRecepcionItemListPorNotaRecepcionIdYSucursales(
    notaRecepcionId: number, 
    sucursales: number[], 
    page: number, 
    size: number,
    filtroVerificacion: 'TODOS' | 'PENDIENTES' | 'VERIFICADOS' | 'RECHAZADOS' = 'PENDIENTES',
    filtroTexto?: string
  ): Observable<PageInfo<NotaRecepcionItem>> {
    return this.genericCrudService.onCustomQuery(this.getNotaRecepcionItemListPorNotaRecepcionIdYSucursalesGQL, { 
      notaRecepcionId, 
      sucursalesIds: sucursales,
      page,
      size,
      filtroVerificacion,
      filtroTexto
    });
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

  // ===============================================
  // RECEPCION MERCADERIA METHODS
  // ===============================================

  /**
   * Obtiene las sucursales disponibles para recepción física de un pedido
   * @param pedidoId - ID del pedido
   * @returns Observable<Sucursal[]>
   */
  onGetSucursalesDisponiblesRecepcionFisica(pedidoId: number): Observable<Sucursal[]> {
    return this.genericCrudService.onCustomQuery(this.getSucursalesDisponiblesRecepcionFisicaGQL, { pedidoId });
  }

  /**
   * Guarda una recepción de mercadería
   * @param recepcionMercaderiaInput - Datos de la recepción a guardar
   * @returns Observable<any>
   */
  onSaveRecepcionMercaderia(recepcionMercaderiaInput: any): Observable<any> {
    const data = {
      entity: recepcionMercaderiaInput
    };
    
    return this.genericCrudService.onCustomMutation(this.saveRecepcionMercaderiaGQL, data);
  }

  /**
   * Guarda un ítem de recepción de mercadería
   * @param recepcionMercaderiaItemInput - Datos del ítem a guardar
   * @returns Observable<RecepcionMercaderiaItem>
   */
  onSaveRecepcionMercaderiaItem(recepcionMercaderiaItemInput: any): Observable<RecepcionMercaderiaItem> {
    const data = {
      entity: recepcionMercaderiaItemInput
    };
    
    return this.genericCrudService.onCustomMutation(this.saveRecepcionMercaderiaItemGQL, data);
  }

  /**
   * Rechaza un ítem de recepción de mercadería
   * @param rechazarItemInput - Datos del ítem a rechazar
   * @returns Observable<any>
   */
  onRechazarItem(rechazarItemInput: RechazarItemInput): Observable<any> {
    return this.genericCrudService.onCustomMutation(this.rechazarItemGQL, rechazarItemInput);
  }

  /**
   * Cancela la verificación de un ítem de recepción de mercadería
   * @param notaRecepcionItemId - ID del NotaRecepcionItem
   * @param sucursalId - ID de la sucursal
   * @returns Observable<any>
   */
  onCancelarVerificacion(notaRecepcionItemId: number, sucursalId: number): Observable<any> {
    return this.genericCrudService.onCustomMutation(this.cancelarVerificacionGQL, { notaRecepcionItemId, sucursalId });
  }

  /**
   * Cancela el rechazo de un ítem de recepción de mercadería
   * @param notaRecepcionItemId - ID del NotaRecepcionItem
   * @param sucursalId - ID de la sucursal
   * @returns Observable<any>
   */
  onCancelarRechazo(notaRecepcionItemId: number, sucursalId: number): Observable<any> {
    return this.genericCrudService.onCustomMutation(this.cancelarRechazoGQL, { notaRecepcionItemId, sucursalId });
  }

  /**
   * Valida si se puede finalizar la recepción física por pedido
   * @param pedidoId - ID del pedido
   * @param sucursalesIds - Lista de IDs de sucursales
   * @returns Observable<any>
   */
  onValidarFinalizacionRecepcionPorPedido(pedidoId: number, sucursalesIds: number[]): Observable<any> {
    return this.genericCrudService.onCustomMutation(this.validarFinalizacionRecepcionPorPedidoGQL, {
      pedidoId,
      sucursalesIds
    });
  }

  /**
   * Finaliza la recepción física por pedido
   * @param pedidoId - ID del pedido
   * @param sucursalesIds - Lista de IDs de sucursales
   * @returns Observable<any>
   */
  onFinalizarRecepcionFisicaPorPedido(pedidoId: number, sucursalesIds: number[]): Observable<any> {
    return this.genericCrudService.onCustomMutation(this.finalizarRecepcionFisicaPorPedidoGQL, {
      pedidoId,
      sucursalesIds
    });
  }

  /**
   * Recepciona todos los ítems de una nota para las sucursales dadas
   * @param notaId - ID de la nota
   * @param sucursalesIds - Lista de IDs de sucursales
   * @param usuarioId - ID del usuario
   * @param itemIds - Lista opcional de IDs de ítems de nota de recepción
   * @returns Observable<boolean>
   */
  onRecepcionarTodoPorNota(notaId: number, sucursalesIds: number[], usuarioId: number, itemIds?: number[]): Observable<boolean> {
    return this.genericCrudService.onCustomMutation(this.recepcionarTodoPorNotaGQL, {
      notaId,
      sucursalesIds,
      usuarioId,
      itemIds
    });
  }

  /**
   * Deshace (cancela) la verificación física masivamente por nota y sucursales.
   * @param notaId - ID de la nota
   * @param sucursalesIds - Lista de IDs de sucursales
   * @param usuarioId - ID del usuario
   * @param itemIds - Lista opcional de IDs de ítems de nota de recepción (para selección)
   * @returns Observable<boolean>
   */
  onDeshacerVerificacionTodoPorNota(notaId: number, sucursalesIds: number[], usuarioId: number, itemIds?: number[]): Observable<boolean> {
    return this.genericCrudService.onCustomMutation(this.deshacerVerificacionTodoPorNotaGQL, {
      notaId,
      sucursalesIds,
      usuarioId,
      itemIds
    });
  }

  /**
   * Obtiene pedidos con filtros avanzados
   * @param sucursalId - ID de sucursal (opcional)
   * @param productoId - ID de producto (opcional)
   * @param proveedorId - ID de proveedor (opcional)
   * @param estado - Estado de etapa (opcional)
   * @param creadoDesde - Fecha desde (opcional)
   * @param creadoHasta - Fecha hasta (opcional)
   * @param page - Número de página
   * @param size - Tamaño de página
   * @returns Observable<PageInfo<Pedido>>
   */
  onGetPedidosWithFilters(
    sucursalId?: number,
    productoId?: number,
    proveedorId?: number,
    estado?: string,
    creadoDesde?: string,
    creadoHasta?: string,
    page?: number,
    size?: number
  ): Observable<PageInfo<Pedido>> {
    return this.genericCrudService.onCustomQuery(this.getPedidosWithFiltersGQL, {
      sucursalId,
      productoId,
      proveedorId,
      estado,
      creadoDesde,
      creadoHasta,
      page,
      size
    });
  }

  /**
   * Cancela un pedido (usa deletePedido)
   * @param id - ID del pedido a cancelar
   * @returns Observable<boolean>
   */
  onCancelarPedido(id: number): Observable<boolean> {
    return this.genericCrudService.onDelete(
      this.savePedidoFullGQL,
      id,
      '¿Cancelar pedido?',
      null,
      true,
      true,
      '¿Está seguro que desea cancelar este pedido?'
    );
  }

  /**
   * Imprime un pedido
   * @param id - ID del pedido a imprimir
   * @returns Observable<string> - Base64 del PDF
   */
  onImprimirPedido(id: number): Observable<string> {
    // TODO: Implementar cuando se cree el método de impresión en el backend
    // Por ahora retornar un observable vacío
    return new Observable<string>(observer => {
      observer.error('Método de impresión no implementado aún');
      observer.complete();
    });
  }
} 