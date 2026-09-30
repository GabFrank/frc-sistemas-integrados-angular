import { Usuario } from "../../../personas/usuarios/usuario.model";

export class ConfiguracionVentaTarjeta {
  id: number;
  habilitado: boolean;
  /** undefined = el servidor no la informó (versión vieja): no se manda al guardar. */
  terminalObligatoria?: boolean;
  usuario: Usuario;
  creadoEn: Date;
  modificadoEn: Date;

  toInput(): ConfiguracionVentaTarjetaInput {
    let input = new ConfiguracionVentaTarjetaInput();
    input.id = this?.id;
    input.habilitado = this?.habilitado;
    if (this?.terminalObligatoria !== undefined) input.terminalObligatoria = this.terminalObligatoria;
    input.usuarioId = this?.usuario?.id;
    return input;
  }
}

export class ConfiguracionVentaTarjetaInput {
  id?: number;
  habilitado?: boolean;
  terminalObligatoria?: boolean;
  usuarioId?: number;
}
