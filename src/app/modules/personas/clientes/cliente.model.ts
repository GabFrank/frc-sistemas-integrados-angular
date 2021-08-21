import { Contacto } from '../../general/contactos/contacto';
import { Persona } from '../persona/persona.model';
import { Usuario } from '../usuarios/usuario.model';

export interface Cliente  {
  id: number;
  persona: Persona;
  nombre: string;
  credito: number;
  creadoEn: Date;
  usuarioId: Usuario;
  contactos: Contacto[];
}
