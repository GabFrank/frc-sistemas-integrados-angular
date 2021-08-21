import { Usuario } from '../usuarios/usuario.model';

export interface Persona  {
  id: number;
  nombre: string;
  apodo: string;
  nacimiento: Date;
  documento: string;
  email: string;
  sexo: string;
  direccion: string;
  ciudad: number;
  telefono: string;
  socialMedia: string;
  imagenes: string;
  creadoEn: Date;
  usuario: Usuario;
}
