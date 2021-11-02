import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";

export class Salida {
  id: number;
  responsableCarga: Usuario;
  sucursal: Sucursal;
  tipoSalida: TipoSalida;
  observacion: String;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): SalidaInput {
    let input = new SalidaInput();
    input.id = this.id;
    input.responsableCargaId = this.responsableCarga?.id;
    input.sucursalId = this.sucursal?.id;
    input.tipoSalida = this.tipoSalida;
    input.usuarioId = this.usuario?.id;
    input.observacion = this.observacion;
    return input;
  }
}

export enum TipoSalida {
  SUCURSAL, // LA SALIDA PROVIENE DE UNA TRANSFERENCIA DE SUCURSAL
  VENCIDO, // LA SALIDA DE PRODUCTOS VENCIDOS
  DETERIORADO, // LA SALIDA DE PRODUCTOS DETERIORADOS
  AJUSTE, // LA ENTRADA ES UN AJUSTE DE STOCK

}

export class SalidaInput {
  id: number;
  responsableCargaId: number;
  sucursalId: number;
  tipoSalida: TipoSalida;
  observacion: String;
  creadoEn: Date;
  usuarioId: number;
}
