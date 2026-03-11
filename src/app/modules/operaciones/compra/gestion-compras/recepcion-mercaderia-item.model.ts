import { NotaRecepcionItem } from './nota-recepcion-item.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export enum MotivoRechazoFisico {
  PRODUCTO_DANADO = 'PRODUCTO_DANADO',
  PRODUCTO_VENCIDO = 'PRODUCTO_VENCIDO',
  CANTIDAD_INCORRECTA = 'CANTIDAD_INCORRECTA',
  PRODUCTO_DIFERENTE = 'PRODUCTO_DIFERENTE',
  EMBALAJE_DANADO = 'EMBALAJE_DANADO',
  PRODUCTO_FALTANTE = 'PRODUCTO_FALTANTE',
  OTRO = 'OTRO'
}

export class RecepcionMercaderiaItem extends NotaRecepcionItem {
  // Campos específicos para recepción física (ahora vienen del backend)
  cantidadRecibida: number = 0;
  cantidadRechazada: number = 0;
  motivoRechazoFisico?: MotivoRechazoFisico;
  observacionesRechazo?: string;
  lote?: string;
  vencimientoRecibido?: Date;
  sucursalEntrega?: Sucursal;
  
  // Campos para tracking de recepción
  recepcionMercaderiaId?: number;
  estadoRecepcion: 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO' | 'PARCIAL' = 'PENDIENTE';

  // Propiedades computadas para UI (siguiendo regla @no-direct-function-calls-in-template.mdc)
  cantidadEsperadaComputed: number = 0;
  mostrarCantidadTotalComputed: boolean = false;

  constructor() {
    super();
    this.cantidadRecibida = 0;
    this.cantidadRechazada = 0;
    this.estadoRecepcion = 'PENDIENTE';
  }

  // Método para convertir a objeto para GraphQL
  toRecepcionMercaderiaItemInput(): any {
    return {
      id: this.id || undefined,
      recepcionMercaderiaId: this.recepcionMercaderiaId,
      notaRecepcionItemId: this.id,
      productoId: this.producto?.id,
      presentacionRecibidaId: this.presentacionEnNota?.id,
      sucursalEntregaId: this.sucursalEntrega?.id,
      cantidadRecibida: this.cantidadRecibida,
      cantidadRechazada: this.cantidadRechazada,
      vencimientoRecibido: dateToString(this.vencimientoRecibido),
      lote: this.lote,
      esBonificacion: this.esBonificacion,
      motivoRechazo: this.motivoRechazoFisico,
      observacion: this.observacionesRechazo
    };
  }

  // Método para crear desde NotaRecepcionItem (simplificado)
  static fromNotaRecepcionItem(notaItem: any): RecepcionMercaderiaItem {
    const item = new RecepcionMercaderiaItem();
    
    // Copiar propiedades de NotaRecepcionItem
    Object.assign(item, notaItem);
    
    // Los campos de recepción ya vienen calculados del backend
    // No necesitamos lógica adicional aquí
    
    return item;
  }

  // Métodos de utilidad
  get cantidadPendienteRecepcion(): number {
    return this.cantidadEnNota - this.cantidadRecibida - this.cantidadRechazada;
  }

  get estaVerificado(): boolean {
    return this.estadoRecepcion === 'VERIFICADO';
  }

  get estaPendiente(): boolean {
    return this.estadoRecepcion === 'PENDIENTE';
  }

  get estaRechazado(): boolean {
    return this.estadoRecepcion === 'RECHAZADO';
  }

  get estaParcial(): boolean {
    return this.estadoRecepcion === 'PARCIAL';
  }
} 