import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export enum RecepcionMercaderiaEstado {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}

export class RecepcionMercaderia {
  id: number;
  proveedor: Proveedor;
  sucursalRecepcion: Sucursal;
  fecha: Date;
  moneda: Moneda;
  cotizacion: number;
  estado: RecepcionMercaderiaEstado;
  usuario: Usuario;

  constructor() {
    this.id = 0;
    this.proveedor = new Proveedor();
    this.sucursalRecepcion = new Sucursal();
    this.fecha = new Date();
    this.moneda = new Moneda();
    this.cotizacion = 1;
    this.estado = RecepcionMercaderiaEstado.PENDIENTE;
    this.usuario = new Usuario();
  }

  // Método para convertir a objeto para GraphQL
  toInput(): RecepcionMercaderiaInput {
    return {
      id: this.id || undefined,
      proveedorId: this.proveedor?.id,
      sucursalRecepcionId: this.sucursalRecepcion?.id,
      fecha: dateToString(this.fecha),
      monedaId: this.moneda?.id,
      cotizacion: this.cotizacion,
      estado: this.estado,
      usuarioId: this.usuario?.id
    };
  }
}

export interface RecepcionMercaderiaInput {
  id?: number;
  proveedorId?: number;
  sucursalRecepcionId?: number;
  fecha?: string;
  monedaId?: number;
  cotizacion?: number;
  estado?: RecepcionMercaderiaEstado;
  usuarioId?: number;
} 