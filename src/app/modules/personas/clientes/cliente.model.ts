import { Contacto } from '../../general/contactos/contacto';
import { Persona } from '../persona/persona.model';
import { Usuario } from '../usuarios/usuario.model';

export class Cliente {
  id: number;
  persona: Persona;
  nombre: string;
  documento: string;
  credito: number;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): ClienteInput {
    let input = new ClienteInput;
    input.id = this.id
    input.personaId = this.persona?.id
    input.nombre = this.nombre
    input.credito = this.credito
    input.creadoEn = this.creadoEn
    input.usuarioId = this.usuario?.id
    return input;
  }s
}

export class ClienteInput {
  id: number;
  personaId: number;
  nombre: string;
  credito: number;
  creadoEn: Date;
  usuarioId: number;
}
