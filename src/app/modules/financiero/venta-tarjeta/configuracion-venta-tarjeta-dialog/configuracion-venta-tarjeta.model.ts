import { Usuario } from "../../../personas/usuarios/usuario.model";

export class ConfiguracionVentaTarjeta {
  id: number;
  habilitado: boolean;
  usuario: Usuario;
  creadoEn: Date;
  modificadoEn: Date;

  toInput(): ConfiguracionVentaTarjetaInput {
    let input = new ConfiguracionVentaTarjetaInput();
    input.id = this?.id;
    input.habilitado = this?.habilitado;
    input.usuarioId = this?.usuario?.id;
    return input;
  }
}

export class ConfiguracionVentaTarjetaInput {
  id?: number;
  habilitado?: boolean;
  usuarioId?: number;
}
