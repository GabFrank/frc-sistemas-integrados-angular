import { Persona } from "../../personas/persona/persona.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Banco } from "../banco/banco.model";
import { Moneda } from "../moneda/moneda.model";
import { CuentaBancariaInput } from "./cuenta-bancaria-input.model";

export class CuentaBancaria {
  id: number;
  numero: string;
  nombre: string;
  persona: Persona;
  banco: Banco;
  moneda: Moneda;
  tipoCuenta: TipoCuenta;
  titular: string;
  alias: string;
  activo: boolean;
  disponibleOperacionesFinancieras: boolean;
  permiteSaldoNegativo: boolean;
  saldo: number;
  saldoReservado: number;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): CuentaBancariaInput {
    let input = new CuentaBancariaInput();
    input.id = this.id;
    input.numero = this.numero;
    input.nombre = this.nombre;
    input.tipoCuenta = this.tipoCuenta;
    input.titular = this.titular;
    input.alias = this.alias;
    input.activo = this.activo;
    input.disponibleOperacionesFinancieras = this.disponibleOperacionesFinancieras;
    input.permiteSaldoNegativo = this.permiteSaldoNegativo;
    input.personaId = this.persona?.id;
    input.bancoId = this.banco?.id;
    input.monedaId = this.moneda?.id;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

// OJO: estos valores viajan como enum GraphQL (TipoCuenta en cuenta-bancaria.graphqls) —
// tienen que ser el string literal, no el índice numérico por defecto de TS.
export enum TipoCuenta {
  CUENTA_CORRIENTE = 'CUENTA_CORRIENTE',
  CAJA_DE_AHORRO = 'CAJA_DE_AHORRO'
}
