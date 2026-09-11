import { dateToString } from "../../../commons/core/utils/dateUtils";
import { ProveedorServicio } from "../../personas/proveedor-servicio/proveedor-servicio.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "../moneda/moneda.model";
import { FormatoTerminalPos } from "../venta-tarjeta/qr-pos/formato-terminal-pos/formato-terminal-pos.model";

export class TerminalPos {
  id: number;
  descripcion: string;
  codigo: string;
  cuentaBancariaId: number;
  moneda: Moneda;
  proveedorServicio: ProveedorServicio;
  /**
   * Formato del modelo de aparato que es esta terminal: de aca sale el tipo (MAQUINA / WEB), el
   * patron y el mapeo.
   *
   * `null` = sin configurar, y el PDV **bloquea la venta con tarjeta** mientras siga asi. No es un
   * caso raro: el dia del corte lo estan todas las terminales, porque no hay backfill.
   */
  formatoTerminalPos: FormatoTerminalPos;
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
    // Si no hay formato queda `undefined` y el backend NO lo toca: omitir el campo no puede
    // apagarle la venta con tarjeta a una caja. Para desvincular hay una mutation aparte.
    input.formatoTerminalPosId = this?.formatoTerminalPos?.id;
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
  /** Si no viene, el backend conserva el que ya tenia. Ver el comentario de `toInput`. */
  formatoTerminalPosId?: number;
  activo?: boolean;
  creadoEn?: string;
  usuarioId?: number;
}
