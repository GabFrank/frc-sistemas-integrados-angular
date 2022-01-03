import { Usuario } from "../../personas/usuarios/usuario.model";
import { Cambio } from "../cambio/cambio.model";
import { Moneda } from "../moneda/moneda.model";
import { Retiro } from "./retiro.model";

export class RetiroDetalle {
  id: number;
  retiro: Retiro;
  moneda: Moneda;
  cambio: number;
  cantidad: number;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): RetiroDetalleInput {
    let input = new RetiroDetalleInput();
    input.id = this.id;
    input.retiroId = this.retiro?.id
    input.monedaId = this.moneda?.id
    input.cantidad = this.cantidad
    input.cambio = this.cambio
    input.usuarioId = this.usuario?.id
    input.creadoEn = this.creadoEn;
    return input;
  }
}

export class RetiroDetalleInput {
  id: number;
  retiroId: number;
  monedaId: number;
  cambio: number;
  cantidad: number;
  creadoEn: Date;
  usuarioId: number;
}
