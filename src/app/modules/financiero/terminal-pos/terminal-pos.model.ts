import { dateToString } from "../../../commons/core/utils/dateUtils";
import { ProveedorServicio } from "../../personas/proveedor-servicio/proveedor-servicio.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "../moneda/moneda.model";

export class TerminalPos {
  id: number;
  descripcion: string;
  codigo: string;
  cuentaBancariaId: number;
  moneda: Moneda;
  proveedorServicio: ProveedorServicio;
  activo: boolean;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): TerminalPosInput {
    let input = new TerminalPosInput();
    input.id = this?.id;
    input.descripcion = this?.descripcion;
    input.codigo = this?.codigo;
    input.cuentaBancariaId = this?.cuentaBancariaId;
    input.monedaId = this?.moneda?.id;
    input.proveedorServicioId = this?.proveedorServicio?.id;
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
  monedaId?: number;
  proveedorServicioId?: number;
  activo?: boolean;
  creadoEn?: string;
  usuarioId?: number;
}
