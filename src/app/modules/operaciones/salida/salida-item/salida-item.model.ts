import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { Producto } from "../../../productos/producto/producto.model";
import { Salida } from "../salida.model";

export class SalidaItem {
  id: number;
  salida: Salida;
  producto: Producto;
  presentacion: Presentacion;
  observacion: string;
  cantidad: number;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): SalidaItemInput {
    let input = new SalidaItemInput();
    input.id = this.id;
    input.productoId = this.producto?.id;
    input.presentacionId = this.presentacion?.id;
    input.salidaId = this.salida?.id;
    input.cantidad = this.cantidad;
    input.creadoEn = this.creadoEn;
    input.usuarioId = this.usuario?.id;
    input.observacion = this.observacion;
    return input;
  }
}

export enum TipoSalidaItem {
  COMPRA, //LA ENTRADA PROVIENE DE UNA COMPRA
  SUCURSAL, //LA ENTRADA PROVIENE DE UNA TRANSFERENCIA DE SUCURSAL
  AJUSTE, //ENTRADA ES UN AJUSTE DE STOCK
}

export class SalidaItemInput {
  id: number;
  salidaId: number;
  productoId: number;
  presentacionId: number;
  observacion: string;
  cantidad: number;
  creadoEn: Date;
  usuarioId: number;
}
