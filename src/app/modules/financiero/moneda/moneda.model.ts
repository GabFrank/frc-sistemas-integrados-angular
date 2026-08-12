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
    input.paisId = this.pais?.id;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}
