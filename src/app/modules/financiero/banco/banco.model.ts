import { Usuario } from "../../personas/usuarios/usuario.model";
import { BancoInput } from "./banco-input.model";

export class Banco {
  id: number;
  nombre: string;
  codigo: string;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): BancoInput{
    let input = new BancoInput()
    input.id = this.id;
    input.nombre = this.nombre;
    input.codigo = this.codigo;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}
