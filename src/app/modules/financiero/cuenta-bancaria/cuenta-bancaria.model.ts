import { Persona } from "../../personas/persona/persona.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Banco } from "../banco/banco.model";
import { Moneda } from "../moneda/moneda.model";
import { CuentaBancariaInput } from "./cuenta-bancaria-input.model";

export class CuentaBancaria {
  id: number;
  numero: string;
  persona: Persona;
  banco: Banco;
  moneda: Moneda;
  tipoCuenta: TipoCuenta;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): CuentaBancariaInput{
    let input = new CuentaBancariaInput()
    input.id = this.id;
    input.numero = this.numero;
    input.personaId = this.persona?.id;
    input.bancoId = this.banco?.id;
    input.monedaId = this.moneda?.id;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

export enum TipoCuenta {
  CUENTA_CORRIENTE, CAJA_DE_AHORRO
}
