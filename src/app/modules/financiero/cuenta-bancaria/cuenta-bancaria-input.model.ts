import { TipoCuenta } from "./cuenta-bancaria.model";

export class CuentaBancariaInput {
  id: number;
  numero: string;
  nombre: string;
  bancoId: number;
  personaId: number;
  monedaId: number;
  tipoCuenta: TipoCuenta;
  titular: string;
  alias: string;
  activo: boolean;
  disponibleOperacionesFinancieras: boolean;
  permiteSaldoNegativo: boolean;
  creadoEn: Date;
  usuarioId: number = null;
}
