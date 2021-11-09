import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { SalidaItem } from "./salida-item/salida-item.model";

export class Salida {
  id: number;
  responsableCarga: Usuario;
  sucursal: Sucursal;
  tipoSalida: TipoSalida;
  observacion: String;
  cantidad: number;
  activo: boolean
  creadoEn: Date;
  usuario: Usuario;
  salidaItemList: SalidaItem[]

  toInput(): SalidaInput {
    let input = new SalidaInput();
    input.id = this.id;
    input.responsableCargaId = this.responsableCarga?.id;
    input.sucursalId = this.sucursal?.id;
    input.tipoSalida = this.tipoSalida;
    input.usuarioId = this.usuario?.id;
    input.cantidad = this.cantidad;
    input.activo = this.activo;
    input.observacion = this.observacion;
    return input;
  }
}

export enum TipoSalida {
  SUCURSAL = 'SUCURSAL', // LA SALIDA PROVIENE DE UNA TRANSFERENCIA DE SUCURSAL
  VENCIDO = 'VENCIDO', // LA SALIDA DE PRODUCTOS VENCIDOS
  DETERIORADO = 'DETERIORADO', // LA SALIDA DE PRODUCTOS DETERIORADOS
  AJUSTE = 'AJUSTE', // LA ENTRADA ES UN AJUSTE DE STOCK

}

export class SalidaInput {
  id: number;
  responsableCargaId: number;
  sucursalId: number;
  tipoSalida: TipoSalida;
  observacion: String;
  creadoEn: Date;
  cantidad: number;
  activo: boolean;
  usuarioId: number;
}
