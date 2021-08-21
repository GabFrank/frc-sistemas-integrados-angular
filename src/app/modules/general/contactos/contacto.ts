import { Persona } from '../../personas/persona/persona.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export class Contacto {
  id: number;
  email: string;
  telefono: string;
  persona: Persona;
  creadoEn: Date;
  usuario: Usuario;
}
