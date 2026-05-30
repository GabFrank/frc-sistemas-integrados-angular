import { Usuario } from "../../../personas/usuarios/usuario.model";

export class ConfiguracionTransferencia {
  id: number;
  permitirStockNegativo: boolean;
  usuario: Usuario;
  creadoEn: Date;
  modificadoEn: Date;

  toInput(): ConfiguracionTransferenciaInput {
    let input = new ConfiguracionTransferenciaInput();
    input.id = this?.id;
    input.permitirStockNegativo = this?.permitirStockNegativo;
    input.usuarioId = this?.usuario?.id;
    return input;
  }
}

export class ConfiguracionTransferenciaInput {
  id?: number;
  permitirStockNegativo?: boolean;
  usuarioId?: number;
}
