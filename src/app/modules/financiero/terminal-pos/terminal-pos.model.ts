import { dateToString } from "../../../commons/core/utils/dateUtils";
import { ProveedorServicio } from "../../personas/proveedor-servicio/proveedor-servicio.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Moneda } from "../moneda/moneda.model";
import { FormatoTerminalPos } from "../venta-tarjeta/qr-pos/formato-terminal-pos/formato-terminal-pos.model";

export class TerminalPos {
  id: number;
  descripcion: string;
  /**
   * La etiqueta interna que el negocio le pega al aparato para que el cajero la escanee.
   *
   * **No es el identificador de la maquina** — ese es `serie`. Son dos cosas con dos vidas: el
   * codigo lo elige el negocio y sirve para seleccionar la terminal en la caja; la serie viene de
   * fabrica y es la que el cupon imprime.
   */
  codigo: string;
  /**
   * Donde esta fisicamente el aparato.
   *
   * `null` en las terminales viejas: no se puede adivinar en que local esta una maquina, se carga
   * a mano. Con 24 sucursales y un proveedor que entrega 30 maquinas, es lo unico que responde
   * "cuantas maquinas deberia tener mi local".
   */
  sucursal: Sucursal;
  /**
   * El id pelado, que es lo que devuelve el FILIAL.
   *
   * Central devuelve el objeto `sucursal` porque ahí vive el ABM y la pantalla muestra el nombre;
   * el filial devuelve sólo el id, porque ya sabe en qué sucursal está. Se aceptan los dos.
   */
  sucursalId: number;
  /**
   * El identificador propio de la maquina, el que viene de fabrica y el que el cupon imprime.
   *
   * Con esto cargado, un cupon dice solo de que maquina salio — y si esa maquina esta registrada
   * en otra sucursal, el sistema lo puede cantar.
   */
  serie: string;
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
  /**
   * Si en esta terminal se puede tipear el cupon a mano.
   *
   * Tres estados, no dos: `null` = hereda la configuracion general del modulo, `true`/`false` =
   * decidido para este aparato. **No se edita desde el alta**: tiene su propia accion, porque
   * apagarla puede dejar a una caja sin ninguna forma de cobrar con tarjeta.
   */
  cargaManualPermitida: boolean;
  /** Campos que no se pueden dejar vacios en esta terminal. `null` = se deducen del formato. */
  camposObligatorios: string[];
  /**
   * Lo que se le exige de verdad al cajero: la lista del aparato si la hay, y si no, los que el
   * mapeo del formato declara obligatorios. Es de solo lectura, la calcula el backend.
   */
  camposObligatoriosEfectivos: string[];
  activo: boolean;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): TerminalPosInput {
    let input = new TerminalPosInput();
    input.id = this?.id;
    input.descripcion = this?.descripcion;
    input.codigo = this?.codigo;
    // Misma regla que el formato: si no va, el backend conserva lo que tenia. Una edicion trivial
    // desde un desktop viejo no puede borrar la sucursal que alguien cargo a mano.
    input.sucursalId = this?.sucursal?.id ?? this?.sucursalId;
    input.serie = this?.serie;
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
  /** Si no viene, el backend conserva la que ya tenia. */
  sucursalId?: number;
  /** Si no viene, el backend conserva la que ya tenia. Se normaliza a mayusculas alla. */
  serie?: string;
  cuentaBancariaId?: number;
  monedaId?: number;
  proveedorServicioId?: number;
  /** Si no viene, el backend conserva el que ya tenia. Ver el comentario de `toInput`. */
  formatoTerminalPosId?: number;
  activo?: boolean;
  creadoEn?: string;
  usuarioId?: number;
}
