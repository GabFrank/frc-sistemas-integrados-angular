import { dateToString } from "../../../../../commons/core/utils/dateUtils";
import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { Proveedor } from "../../../../personas/proveedor/proveedor.model";
import { Usuario } from "../../../../personas/usuarios/usuario.model";


export class NotaRecepcionAgrupada {
  id: number;
  proveedor: Proveedor;
  sucursal: Sucursal;
  creadoEn: Date;
  usuario: Usuario;
  estado: NotaRecepcionAgrupadaEstado;
  cantNotas:number;


  toInput(): NotaRecepcionAgrupadaInput {
    let input = new NotaRecepcionAgrupadaInput();
    input.id = this.id;
    input.proveedorId = this.proveedor?.id;
    input.sucursalId = this.sucursal?.id;
    input.usuarioId = this.usuario?.id;
    input.creadoEn = dateToString(this.creadoEn);
    input.estado = this.estado;
    return input;
  }
}

export class NotaRecepcionAgrupadaInput {
  id: number;
  proveedorId: number;
  sucursalId: number;
  creadoEn: string;
  usuarioId: number;
  estado: NotaRecepcionAgrupadaEstado;
}

export enum NotaRecepcionAgrupadaEstado {
  EN_RECEPCION = 'EN_RECEPCION',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}
