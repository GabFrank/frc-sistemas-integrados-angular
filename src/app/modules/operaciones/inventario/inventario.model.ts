import { Zona } from './../../empresarial/zona/zona.model';
import { Producto } from './../../productos/producto/producto.model';
import { Sucursal } from './../../empresarial/sucursal/sucursal.model';
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Presentacion } from '../../productos/presentacion/presentacion.model';
import { dateToString } from '../../../commons/core/utils/dateUtils';

export class Inventario {
  id: number;
  idOrigen: number;
  idCentral: number;
  sucursal: Sucursal;
  fechaInicio: Date;
  fechaFin: Date;
  abierto: boolean;
  tipo: TipoInventario;
  estado: InventarioEstado;
  usuario: Usuario
  observacion: string;
  inventarioProductoList: InventarioProducto[] = []

  toInput(): InventarioInput {
    let input = new InventarioInput;
    input.id = this.id;
    input.sucursalId = this.sucursal?.id;
    input.fechaInicio = dateToString(this.fechaInicio)
    input.fechaFin = dateToString(this.fechaFin);
    input.abierto = this.abierto;
    input.tipo = this.tipo;
    input.estado = this.estado;
    input.usuarioId = this.usuario?.id;
    input.observacion = this.observacion;
    return input;
  }
}

export class InventarioInput {
  id: number;
  idOrigen: number;
  idCentral: number;
  sucursalId: number;
  fechaInicio: string;
  fechaFin: string;
  abierto: boolean;
  tipo: TipoInventario;
  estado: InventarioEstado;
  usuarioId: number
  observacion: string;
}

export class InventarioProducto {
  id: number;
  idOrigen: number;
  idCentral: number;
  inventario: Inventario;
  producto: Producto;
  zona: Zona;
  concluido: boolean;
  usuario: Usuario;
  creadoEn: Date;
  inventarioProductoItemList: InventarioProductoItem[] = []

  toInput(): InventarioProductoInput {
    let input = new InventarioProductoInput;
    input.id = this.id;
    input.inventarioId = this.inventario?.id;
    input.productoId = this.producto?.id;
    input.zonaId = this.zona?.id;
    input.usuarioId = this.usuario?.id;
    input.creadoEn = this.creadoEn;
    return input;
  }
}

export class InventarioProductoInput {
  id: number;
  idOrigen: number;
  idCentral: number;
  inventarioId: number;
  productoId: number;
  concluido: boolean;
  zonaId: number;
  usuarioId: number;
  creadoEn: Date;
}

export class InventarioProductoItem {
  id: number;
  idOrigen: number;
  idCentral: number;
  inventarioProducto: InventarioProducto;
  zona: Zona;
  presentacion: Presentacion; 
  cantidad: number;
  cantidadFisica: number;
  vencimiento: Date;
  usuario: Usuario;
  estado: InventarioProductoEstado
  creadoEn: Date;

  toInput(): InventarioProductoItemInput {
    let input = new InventarioProductoItemInput;
    input.id = this.id
    input.inventarioProductoId = this.inventarioProducto?.id
    input.zonaId = this.zona?.id
    input.presentacionId = this.presentacion?.id
    input.cantidad = this.cantidad
    input.cantidadFisica = this.cantidadFisica
    input.vencimiento = this.vencimiento
    input.estado = this.estado
    input.usuarioId = this.usuario?.id
    input.creadoEn = this.creadoEn;
    return input;
  }
}

export class InventarioProductoItemInput {
  id: number;
  idOrigen: number;
  idCentral: number;
  inventarioProductoId: number;
  zonaId: number;
  presentacionId: any; //presentacion
  cantidad: number;
  cantidadFisica: number;
  vencimiento: Date; //vencimiento que el sistema le va a indicar, si no existe crear vencimiento
  estado: InventarioProductoEstado
  usuarioId: number;
  creadoEn: Date;
}

export enum InventarioEstado {
  ABIERTO = 'ABIERTO',
  CANCELADO = 'CANCELADO',
  CONCLUIDO = 'CONCLUIDO'
}

export enum InventarioProductoEstado {
  BUENO = 'BUENO',
  AVERIADO = 'AVERIADO',
  VENCIDO = 'VENCIDO'
}

export enum TipoInventario {
  ABC = 'ABC',
  ZONA = 'ZONA',
  PRODUCTO = 'PRODUCTO',
  CATEGORIA = 'CATEGORIA'
}
