import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { EntradaItem } from "./entrada-item/entrada-item.model";

export class Entrada {
  id: number;
  responsableCarga: Usuario;
  sucursal: Sucursal;
  tipoEntrada: TipoEntrada;
  observacion: String;
  creadoEn: Date;
  usuario: Usuario;
  entradaItemList: EntradaItem[]

  toInput(): EntradaInput {
    let input = new EntradaInput();
    input.id = this.id;
    input.responsableCargaId = this.responsableCarga?.id;
    input.sucursalId = this.sucursal?.id;
    input.tipoEntrada = this.tipoEntrada;
    input.usuarioId = this.usuario?.id;
    input.observacion = this.observacion;
    return input;
  }
}

export enum TipoEntrada {
  COMPRA = "COMPRA", //LA ENTRADA PROVIENE DE UNA COMPRA
  SUCURSAL = "SUCURSAL", //LA ENTRADA PROVIENE DE UNA TRANSFERENCIA DE SUCURSAL
  AJUSTE = "AJUSTE", //ENTRADA ES UN AJUSTE DE STOCK
}

export class EntradaInput {
  id: number;
  responsableCargaId: number;
  sucursalId: number;
  tipoEntrada: TipoEntrada;
  observacion: String;
  creadoEn: Date;
  usuarioId: number;
}
