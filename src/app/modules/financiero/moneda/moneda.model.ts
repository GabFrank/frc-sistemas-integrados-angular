import { Pais } from "../../general/pais/pais.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Cambio } from "../cambio/cambio.model";
import { MonedaBillete } from "./moneda-billetes/moneda-billetes.model";
import { MonedaInput } from "./moneda-input.model";

export class Moneda {
  id: number;
  denominacion: string;
  simbolo: string;
  activo: boolean;
  principal: boolean;
  decimales: number;
  reglaRedondeo: string;
  redondeoMultiplo: number;
  /**
   * Código ISO 4217 (PYG, USD, BRL). Solo lo traen las consultas que lo piden (el ABM y las de
   * moneda por módulo): la de monedas de todo el sistema no, porque contra un central sin el campo
   * fallaría entera. `undefined` = no se leyó.
   */
  codigoIso?: string;
  pais: Pais;
  creadoEn: Date;
  usuario: Usuario;
  cambio: number;
  monedaBilleteList: MonedaBillete[]

  toInput(): MonedaInput {
    let input = new MonedaInput();
    input.id = this.id;
    input.denominacion = this.denominacion;
    input.simbolo = this.simbolo;
    input.activo = this.activo;
    input.principal = this.principal;
    input.decimales = this.decimales;
    input.reglaRedondeo = this.reglaRedondeo;
    input.redondeoMultiplo = this.redondeoMultiplo;
    // Solo viaja si se conoce: un central sin el campo rechaza el input entero si llega la clave,
    // y uno nuevo conserva el valor guardado cuando no llega. `''` lo borra.
    if (this.codigoIso !== undefined && this.codigoIso !== null) {
      input.codigoIso = this.codigoIso;
    }
    input.paisId = this.pais?.id;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}
