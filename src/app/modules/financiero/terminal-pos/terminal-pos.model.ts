import { dateToString } from "../../../commons/core/utils/dateUtils";
import { Usuario } from "../../personas/usuarios/usuario.model";

export class TerminalPos {
  id: number;
  descripcion: string;
  codigo: string;
  cuentaBancariaId: number;
  activo: boolean;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): TerminalPosInput {
    let input = new TerminalPosInput();
    input.id = this?.id;
    input.descripcion = this?.descripcion;
    input.codigo = this?.codigo;
    input.cuentaBancariaId = this?.cuentaBancariaId;
    input.activo = this?.activo;
    input.creadoEn = dateToString(this?.creadoEn);
    input.usuarioId = this?.usuario?.id;
    return input;
  }
}

export class TerminalPosInput {
  id?: number;
  descripcion?: string;
  codigo?: string;
  cuentaBancariaId?: number;
  activo?: boolean;
  creadoEn?: string;
  usuarioId?: number;
}
