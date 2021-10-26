import { Usuario } from "../../personas/usuarios/usuario.model";
import { CuentaBancaria } from "../cuenta-bancaria/cuenta-bancaria.model";
import { FormaPagoInput } from "./forma-pago-input.model";

export class FormaPago {
  id: number;
  descripcion: string;
  activo: boolean;
  moviemientoCaja: boolean;
  autorizacion: boolean;
  cuentaBancaria: CuentaBancaria;
  usuario: Usuario;

  toInput(): FormaPagoInput {
    let input = new FormaPagoInput();
    input.descripcion = this.descripcion;
    input.activo = this.activo;
    input.moviemientoCaja = this.moviemientoCaja;
    input.autorizacion = this.autorizacion;
    input.cuentaBancariaId = this.cuentaBancaria?.id;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}
