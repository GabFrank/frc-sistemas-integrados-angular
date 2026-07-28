import { Usuario } from "../../../personas/usuarios/usuario.model";

export class ConfiguracionFacturaConVenta {
  id: number;
  habilitado: boolean;
  usuario: Usuario;
  creadoEn: Date;
  modificadoEn: Date;

  toInput(): ConfiguracionFacturaConVentaInput {
    let input = new ConfiguracionFacturaConVentaInput();
    input.id = this?.id;
    input.habilitado = this?.habilitado;
    input.usuarioId = this?.usuario?.id;
    return input;
  }
}

export class ConfiguracionFacturaConVentaInput {
  id?: number;
  habilitado?: boolean;
  usuarioId?: number;
}
