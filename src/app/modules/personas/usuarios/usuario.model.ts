import { Persona } from '../persona/persona.model';

export interface Usuario  {
  id: number;
  persona: Persona;
  email: string;
  password: string;
  nickname: string;
  creadoEn: Date;
  usuarioId: Usuario;
}
