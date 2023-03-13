import { Usuario } from "../../personas/usuarios/usuario.model";
import { TipoCuenta } from "./cuenta-bancaria.model";

export class CuentaBancariaInput {
  id: number;
  numero: string;
  bancoId: number;
  personaId: number;
  monedaId: number;
  tipoCuenta: TipoCuenta;
  creadoEn: Date;
  usuarioId: number;
}
