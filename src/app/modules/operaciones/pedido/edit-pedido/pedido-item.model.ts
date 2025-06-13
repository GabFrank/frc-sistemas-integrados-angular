import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { Producto } from "../../../productos/producto/producto.model";
import { CompraItem } from "../../compra/compra-item.model";
import { NotaRecepcion } from "../nota-recepcion/nota-recepcion.model";
import { PedidoItemSucursal } from "../pedido-item-sucursal/pedido-item-sucursal.model";
import { PedidoItemEstado, PedidoEstado } from "./pedido-enums";
import { Pedido } from "./pedido.model";

export enum PedidoStep {
  DETALLES_PEDIDO = 'DETALLES_PEDIDO',
  RECEPCION_NOTA = 'RECEPCION_NOTA', 
  RECEPCION_PRODUCTO = 'RECEPCION_PRODUCTO'
}

// Add NotaPedido class
export class NotaPedido {
  id: number;
  pedido: Pedido;
  nroNota: string;
  usuario: Usuario;
  creadoEn: Date;
}

export class PedidoItem {
  id: number;
  pedido: Pedido;
  producto: Producto;
  presentacionCreacion: Presentacion;
  cantidadCreacion: number;
  precioUnitarioCreacion: number;
  descuentoUnitarioCreacion: number;
  valorTotal: number;
  bonificacion: boolean;
  bonificacionDetalle: string;
  observacion: string;
  lote: string;
  frio: boolean;
  vencimientoCreacion: Date;
  estado: PedidoItemEstado;
  creadoEn: Date;
  usuarioCreacion: Usuario;
  notaRecepcion: NotaRecepcion;
  compraItem: CompraItem;
  precioUnitarioRecepcionNota: number;
  descuentoUnitarioRecepcionNota: number;
  vencimientoRecepcionNota: Date;
  presentacionRecepcionNota: Presentacion;
  cantidadRecepcionNota: number;
  precioUnitarioRecepcionProducto: number;
  descuentoUnitarioRecepcionProducto: number;
  vencimientoRecepcionProducto: Date;
  presentacionRecepcionProducto: Presentacion;
  cantidadRecepcionProducto: number;
  usuarioRecepcionNota: Usuario;
  usuarioRecepcionProducto: Usuario;
  obsCreacion: string;
  obsRecepcionNota: string;
  obsRecepcionProducto: string;
  autorizacionRecepcionNota;
  autorizacionRecepcionProducto;
  autorizadoPorRecepcionNota: Usuario;
  autorizadoPorRecepcionProducto: Usuario;
  motivoModificacionRecepcionNota: string;
  motivoModificacionRecepcionProducto: string;
  cancelado: boolean;
  verificadoRecepcionNota: boolean;
  verificadoRecepcionProducto: boolean;
  motivoRechazoRecepcionNota: string;
  motivoRechazoRecepcionProducto: string;
  pedidoItemSucursalList: PedidoItemSucursal[] = [];
  isDistribucionSucursalesCreacion: boolean;
  isDistribucionSucursalesRecepcion: boolean;

  toInput(): PedidoItemInput {
    let input = new PedidoItemInput();
    input.id = this.id;
    input.pedidoId = this.pedido?.id;
    input.productoId = this.producto?.id;
    input.presentacionCreacionId = this.presentacionCreacion?.id;
    input.cantidadCreacion = this.cantidadCreacion;
    input.precioUnitarioCreacion = this.precioUnitarioCreacion;
    input.descuentoUnitarioCreacion = this.descuentoUnitarioCreacion;
    input.valorTotal = this.valorTotal;
    input.bonificacion = this.bonificacion;
    input.observacion = this.observacion;
    input.lote = this.lote;
    input.vencimientoCreacion = dateToString(this.vencimientoCreacion);
    input.estado = this.estado;
    input.creadoEn = dateToString(this.creadoEn);
    input.usuarioCreacionId = this.usuarioCreacion?.id;
    input.notaRecepcionId = this.notaRecepcion?.id;
    input.precioUnitarioRecepcionNota = this.precioUnitarioRecepcionNota;
    input.descuentoUnitarioRecepcionNota = this.descuentoUnitarioRecepcionNota;
    input.vencimientoRecepcionNota = dateToString(
      this.vencimientoRecepcionNota
    );
    input.presentacionRecepcionNotaId = this.presentacionRecepcionNota?.id;
    input.cantidadRecepcionNota = this.cantidadRecepcionNota;
    input.precioUnitarioRecepcionProducto =
      this.precioUnitarioRecepcionProducto;
    input.descuentoUnitarioRecepcionProducto =
      this.descuentoUnitarioRecepcionProducto;
    input.vencimientoRecepcionProducto = dateToString(
      this.vencimientoRecepcionProducto
    );
    input.presentacionRecepcionProductoId =
      this.presentacionRecepcionProducto?.id;
    input.cantidadRecepcionProducto = this.cantidadRecepcionProducto;
    input.usuarioRecepcionNotaId = this.usuarioRecepcionNota?.id;
    input.usuarioRecepcionProductoId = this.usuarioRecepcionProducto?.id;
    input.obsCreacion = this.obsCreacion;
    input.obsRecepcionNota = this.obsRecepcionNota;
    input.obsRecepcionProducto = this.obsRecepcionProducto;
    input.autorizacionRecepcionNota = this.autorizacionRecepcionNota;
    input.autorizacionRecepcionProducto = this.autorizacionRecepcionProducto;
    input.autorizadoPorRecepcionNotaId = this.autorizadoPorRecepcionNota?.id;
    input.autorizadoPorRecepcionProductoId =
      this.autorizadoPorRecepcionProducto?.id;
    input.motivoModificacionRecepcionNota =
      this.motivoModificacionRecepcionNota;
    input.motivoModificacionRecepcionProducto =
      this.motivoModificacionRecepcionProducto;
    input.cancelado = this.cancelado;
    input.verificadoRecepcionNota = this.verificadoRecepcionNota;
    input.verificadoRecepcionProducto = this.verificadoRecepcionProducto;
    input.motivoRechazoRecepcionNota = this.motivoRechazoRecepcionNota;
    input.motivoRechazoRecepcionProducto = this.motivoRechazoRecepcionProducto;
    return input;
  }

  // Helper method to get the appropriate field value based on Pedido estado
  getFieldValueForEstado(fieldName: string, pedidoEstado: PedidoEstado): any {
    switch (pedidoEstado) {
      case PedidoEstado.ABIERTO:
      case PedidoEstado.ACTIVO:
        // Always use Creacion fields
        return this.getFieldValue(fieldName, 'Creacion');
        
      case PedidoEstado.EN_RECEPCION_NOTA:
        // Use RecepcionNota fields (should be populated by backend when estado changed)
        return this.getFieldValue(fieldName, 'RecepcionNota');
        
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        // Use RecepcionProducto fields (should be populated by backend when estado changed)
        return this.getFieldValue(fieldName, 'RecepcionProducto');
        
      case PedidoEstado.CONCLUIDO:
        // Use the final step (RecepcionProducto)
        return this.getFieldValue(fieldName, 'RecepcionProducto');
        
      default:
        // Default to Creacion fields for unknown estados
        return null;
    }
  }

  // Helper method to get field value by suffix
  private getFieldValue(fieldName: string, suffix: string): any {
    let fullFieldName: string;
    
    // Map field names to actual property names
    switch (fieldName) {
      case 'presentacion':
        fullFieldName = 'presentacion' + suffix;
        break;
      case 'cantidad':
        fullFieldName = 'cantidad' + suffix;
        break;
      case 'precioUnitario':
        fullFieldName = 'precioUnitario' + suffix;
        break;
      case 'descuentoUnitario':
        fullFieldName = 'descuentoUnitario' + suffix;
        break;
      case 'vencimiento':
        fullFieldName = 'vencimiento' + suffix;
        break;
      case 'obs':
        fullFieldName = 'obs' + suffix;
        break;
      default:
        fullFieldName = fieldName + suffix;
        break;
    }
    
    return this[fullFieldName];
  }

  // Helper method to set field value for specific estado
  setFieldValueForEstado(fieldName: string, value: any, pedidoEstado: PedidoEstado): void {
    let suffix: string;
    switch (pedidoEstado) {
      case PedidoEstado.ABIERTO:
      case PedidoEstado.ACTIVO:
        suffix = 'Creacion';
        break;
      case PedidoEstado.EN_RECEPCION_NOTA:
        suffix = 'RecepcionNota';
        break;
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
      case PedidoEstado.CONCLUIDO:
        suffix = 'RecepcionProducto';
        break;
      default:
        suffix = 'Creacion';
        break;
    }
    
    let fullFieldName: string;
    
    // Map field names to actual property names
    switch (fieldName) {
      case 'presentacion':
        fullFieldName = 'presentacion' + suffix;
        break;
      case 'cantidad':
        fullFieldName = 'cantidad' + suffix;
        break;
      case 'precioUnitario':
        fullFieldName = 'precioUnitario' + suffix;
        break;
      case 'descuentoUnitario':
        fullFieldName = 'descuentoUnitario' + suffix;
        break;
      case 'vencimiento':
        fullFieldName = 'vencimiento' + suffix;
        break;
      case 'obs':
        fullFieldName = 'obs' + suffix;
        break;
      default:
        fullFieldName = fieldName + suffix;
        break;
    }
    
    this[fullFieldName] = value;
  }

  // Check if modifications were made in a specific step
  hasModificationsInStep(step: PedidoStep): boolean {
    const fields = ['presentacion', 'cantidad', 'precioUnitario', 'descuentoUnitario', 'vencimiento'];
    
    switch (step) {
      case PedidoStep.RECEPCION_NOTA:
        return fields.some(field => {
          const recepcionValue = this.getFieldValue(field, 'RecepcionNota');
          const creacionValue = this.getFieldValue(field, 'Creacion');
          return recepcionValue !== null && recepcionValue !== undefined && 
                 recepcionValue !== creacionValue;
        });
        
      case PedidoStep.RECEPCION_PRODUCTO:
        return fields.some(field => {
          const recepcionValue = this.getFieldValue(field, 'RecepcionProducto');
          const creacionValue = this.getFieldValue(field, 'Creacion');
          return recepcionValue !== null && recepcionValue !== undefined && 
                 recepcionValue !== creacionValue;
        });
        
      default:
        return false;
    }
  }

  // Copy values from one step to another
  copyStepValues(fromStep: PedidoStep, toStep: PedidoStep): void {
    const fields = ['presentacion', 'cantidad', 'precioUnitario', 'descuentoUnitario', 'vencimiento'];
    
    fields.forEach(field => {
      const value = this.getFieldValueForStep(field, fromStep);
      if (value !== null && value !== undefined) {
        this.setFieldValueForStep(field, value, toStep);
      }
    });
  }

  // Helper method to get field value for specific step
  private getFieldValueForStep(fieldName: string, step: PedidoStep): any {
    switch (step) {
      case PedidoStep.DETALLES_PEDIDO:
        return this.getFieldValue(fieldName, 'Creacion');
      case PedidoStep.RECEPCION_NOTA:
        return this.getFieldValue(fieldName, 'RecepcionNota');
      case PedidoStep.RECEPCION_PRODUCTO:
        return this.getFieldValue(fieldName, 'RecepcionProducto');
      default:
        return null;
    }
  }

  // Helper method to set field value for specific step
  private setFieldValueForStep(fieldName: string, value: any, step: PedidoStep): void {
    switch (step) {
      case PedidoStep.DETALLES_PEDIDO:
        this.setFieldValue(fieldName, value, 'Creacion');
        break;
      case PedidoStep.RECEPCION_NOTA:
        this.setFieldValue(fieldName, value, 'RecepcionNota');
        break;
      case PedidoStep.RECEPCION_PRODUCTO:
        this.setFieldValue(fieldName, value, 'RecepcionProducto');
        break;
    }
  }

  // Helper method to set field value by suffix
  private setFieldValue(fieldName: string, value: any, suffix: string): void {
    let fullFieldName: string;
    
    // Map field names to actual property names
    switch (fieldName) {
      case 'presentacion':
        fullFieldName = 'presentacion' + suffix;
        break;
      case 'cantidad':
        fullFieldName = 'cantidad' + suffix;
        break;
      case 'precioUnitario':
        fullFieldName = 'precioUnitario' + suffix;
        break;
      case 'descuentoUnitario':
        fullFieldName = 'descuentoUnitario' + suffix;
        break;
      case 'vencimiento':
        fullFieldName = 'vencimiento' + suffix;
        break;
      case 'obs':
        fullFieldName = 'obs' + suffix;
        break;
      default:
        fullFieldName = fieldName + suffix;
        break;
    }
    
    this[fullFieldName] = value;
  }
}

export class PedidoItemInput {
  id: number;
  pedidoId: number;
  productoId: number;
  presentacionCreacionId: number;
  cantidadCreacion: number;
  precioUnitarioCreacion: number;
  descuentoUnitarioCreacion: number;
  valorTotal: number;
  bonificacion: boolean;
  observacion: string;
  lote: string;
  frio: boolean;
  bonificacionDetalle: string;
  vencimientoCreacion: string;
  estado: PedidoItemEstado;
  creadoEn: string;
  usuarioCreacionId: number;
  notaRecepcionId: number;
  precioUnitarioRecepcionNota: number;
  descuentoUnitarioRecepcionNota: number;
  vencimientoRecepcionNota: string;
  presentacionRecepcionNotaId: number;
  cantidadRecepcionNota: number;
  precioUnitarioRecepcionProducto: number;
  descuentoUnitarioRecepcionProducto: number;
  vencimientoRecepcionProducto: string;
  presentacionRecepcionProductoId: number;
  cantidadRecepcionProducto: number;
  usuarioRecepcionNotaId: number;
  usuarioRecepcionProductoId: number;
  obsCreacion: string;
  obsRecepcionNota: string;
  obsRecepcionProducto: string;
  autorizacionRecepcionNota;
  autorizacionRecepcionProducto;
  autorizadoPorRecepcionNotaId: number;
  autorizadoPorRecepcionProductoId: number;
  motivoModificacionRecepcionNota: string;
  motivoModificacionRecepcionProducto: string;
  cancelado: boolean;
  verificadoRecepcionNota: boolean;
  verificadoRecepcionProducto: boolean;
  motivoRechazoRecepcionNota: string;
  motivoRechazoRecepcionProducto: string;
}

export enum PedidoItemMotivoModificacion {
  PRODUCTO_INCORRECTO = 'Producto incorrecto',
  PRESENTACION_INCORRECTA = 'Presentacion incorrecta',
  PRECIO_UNITARIO_INCORRECTO = 'Precio unitario incorrecto',
  CANTIDAD_INCORRECTA = 'Cantidad incorrecta',
  VENCIMIENTO_INCORRECTO = 'Vencimiento incorrecto',
  BONIFICACION_INCORRECTA = 'Borificacion incorrecta',
  OTRO = 'Otro'
}

export enum PedidoItemMotivoRechazo {
  PRODUCTO_INCORRECTO = 'Producto incorrecto',
  FALTA_PRODUCTO = 'Falta producto',
  PRODUCTO_VENCIDO = 'Producto vencido',
  PRODUCTO_AVERIADO = 'Producto averiado',
  PRECIO_INCORRECTO = 'Precio incorrecto',
  OTRO = 'Otro'
}

// Enums for motivos
export enum MotivoModificacionRecepcionNota {
  CANTIDAD_INCORRECTA = 'CANTIDAD_INCORRECTA',
  PRESENTACION_INCORRECTA = 'PRESENTACION_INCORRECTA', 
  PRECIO_INCORRECTO = 'PRECIO_INCORRECTO',
  DESCUENTO_APLICADO = 'DESCUENTO_APLICADO',
  VENCIMIENTO_DIFERENTE = 'VENCIMIENTO_DIFERENTE',
  OBSERVACIONES_ADICIONALES = 'OBSERVACIONES_ADICIONALES'
}

export enum MotivoRechazoRecepcionNota {
  PRODUCTO_FALTANTE = 'PRODUCTO_FALTANTE',
  PRODUCTO_AVERIADO = 'PRODUCTO_AVERIADO',
  PRODUCTO_VENCIDO = 'PRODUCTO_VENCIDO',
  PRECIO_INCORRECTO = 'PRECIO_INCORRECTO',
  CANTIDAD_INCORRECTA = 'CANTIDAD_INCORRECTA',
  PRESENTACION_INCORRECTA = 'PRESENTACION_INCORRECTA',
  CALIDAD_INSATISFACTORIA = 'CALIDAD_INSATISFACTORIA',
  SIN_AUTORIZACION = 'SIN_AUTORIZACION'
}

// Helper class for motivo management
export class MotivoHelper {
  static getMotivoModificacionLabels(): { [key: string]: string } {
    return {
      [MotivoModificacionRecepcionNota.CANTIDAD_INCORRECTA]: 'Cantidad incorrecta',
      [MotivoModificacionRecepcionNota.PRESENTACION_INCORRECTA]: 'Presentación incorrecta',
      [MotivoModificacionRecepcionNota.PRECIO_INCORRECTO]: 'Precio incorrecto',
      [MotivoModificacionRecepcionNota.DESCUENTO_APLICADO]: 'Descuento aplicado',
      [MotivoModificacionRecepcionNota.VENCIMIENTO_DIFERENTE]: 'Vencimiento diferente',
      [MotivoModificacionRecepcionNota.OBSERVACIONES_ADICIONALES]: 'Observaciones adicionales'
    };
  }

  static getMotivoRechazoLabels(): { [key: string]: string } {
    return {
      [MotivoRechazoRecepcionNota.PRODUCTO_FALTANTE]: 'Producto faltante',
      [MotivoRechazoRecepcionNota.PRODUCTO_AVERIADO]: 'Producto averiado',
      [MotivoRechazoRecepcionNota.PRODUCTO_VENCIDO]: 'Producto vencido',
      [MotivoRechazoRecepcionNota.PRECIO_INCORRECTO]: 'Precio incorrecto',
      [MotivoRechazoRecepcionNota.CANTIDAD_INCORRECTA]: 'Cantidad incorrecta',
      [MotivoRechazoRecepcionNota.PRESENTACION_INCORRECTA]: 'Presentación incorrecta',
      [MotivoRechazoRecepcionNota.CALIDAD_INSATISFACTORIA]: 'Calidad insatisfactoria',
      [MotivoRechazoRecepcionNota.SIN_AUTORIZACION]: 'Sin autorización'
    };
  }

  static combineMotivos(motivos: string[]): string {
    return motivos.join(',');
  }

  static separateMotivos(motivosString: string): string[] {
    return motivosString ? motivosString.split(',').filter(m => m.trim()) : [];
  }

  static getMotivoLabel(motivo: string, isRechazo: boolean = false): string {
    const labels = isRechazo ? this.getMotivoRechazoLabels() : this.getMotivoModificacionLabels();
    return labels[motivo] || motivo;
  }
}