import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { Producto } from "../../../productos/producto/producto.model";
import { Entrada } from "../entrada.model";

export class EntradaItem {
  id: number;
  entrada: Entrada;
  producto: Producto;
  presentacion: Presentacion;
  observacion: string;
  cantidad: number;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): EntradaItemInput {
    let input = new EntradaItemInput();
    input.id = this.id;
    input.productoId = this.producto?.id;
    input.presentacionId = this.presentacion?.id;
    input.entradaId = this.entrada?.id;
    input.usuarioId = this.usuario?.id;
    input.observacion = this.observacion;
    return input;
  }
}

export enum TipoEntradaItem {
  COMPRA, //LA ENTRADA PROVIENE DE UNA COMPRA
  SUCURSAL, //LA ENTRADA PROVIENE DE UNA TRANSFERENCIA DE SUCURSAL
  AJUSTE, //ENTRADA ES UN AJUSTE DE STOCK
}

export class EntradaItemInput {
  id: number;
  entradaId: number;
  productoId: number;
  presentacionId: number;
  observacion: string;
  cantidad: number;
  usuarioId: number;
}
