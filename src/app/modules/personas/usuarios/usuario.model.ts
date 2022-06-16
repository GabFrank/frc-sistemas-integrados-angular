import { Persona } from '../persona/persona.model';
import { UsuarioInput } from './usuario-input.model';

export class Usuario  {
  id: number;
  persona: Persona;
  email: string;
  password: string;
  nickname: string;
  creadoEn: Date;
  usuario: Usuario;
  roles: string[];
  avatar: string;

  toInput(): UsuarioInput {
    let input = new UsuarioInput;
    input.id = this.id
    input.personaId = this.persona?.id
    input.password = this.password
    input.nickname = this.nickname
    input.creadoEn = this.creadoEn
    input.usuarioId = this.usuario?.id
    return input;
  }
}
