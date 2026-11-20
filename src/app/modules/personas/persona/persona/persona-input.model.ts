import { Ciudad } from "../../../../modules/general/ciudad/ciudad.model";

export class PersonaInput {
  id: number;
  nombre: string;
  apodo: string;
  documento: string;
  nacimiento: string;
  sexo: string;
  direccion: string;
  email: string;
  ciudadId: number;
  /** Solo cuando se elige en el admin (#666); sin el campo, el central no lo toca. */
  paisId?: number;
  telefono: string;
  socialMedia: string;
  imagenes: string;
  creadoEn: Date;
  usuarioId: number = null;
  isFuncionario: boolean
  isCliente: boolean
  isProveedor: boolean
}
