import { Ciudad } from "../../../../modules/general/ciudad/ciudad.model";

export class PersonaInput {
  id: number;
  nombre: string;
  apodo: string;
  documento: string;
  nacimiento: Date;
  sexo: string;
  direccion: string;
  email: string;
  ciudadId: number;
  telefono: string;
  socialMedia: string;
  imagenes: string;
  creadoEn: Date;
  usuarioId: number;
}
