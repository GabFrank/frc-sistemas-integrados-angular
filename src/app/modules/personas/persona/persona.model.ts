import { dateToString } from '../../../commons/core/utils/dateUtils';
import { Ciudad } from '../../general/ciudad/ciudad.model';
import { Usuario } from '../usuarios/usuario.model';
import { PersonaInput } from './persona/persona-input.model';

export class Persona  {
  id: number;
  nombre: string;
  apodo: string;
  nacimiento: Date;
  documento: string;
  email: string;
  sexo: string;
  direccion: string;
  ciudad: Ciudad;
  telefono: string;
  socialMedia: string;
  imagenes: string;
  creadoEn: Date;
  usuario: Usuario;
  isFuncionario: boolean
  isCliente: boolean
  isProveedor: boolean
  isUsuario: boolean

  toInput(): PersonaInput {
    let input = new PersonaInput;
    input.id = this.id
    input.nombre = this.nombre
    input.apodo = this.apodo
    input.nacimiento = dateToString(this.nacimiento)
    input.documento = this.documento
    input.email = this.email
    input.sexo = this.sexo
    input.direccion = this.direccion
    input.ciudadId = this.ciudad?.id
    input.telefono = this.telefono
    input.socialMedia = this.socialMedia
    input.imagenes = this.imagenes
    input.creadoEn = this.creadoEn
    input.usuarioId = this.usuario?.id
    input.isFuncionario = this.isFuncionario
    input.isCliente = this.isCliente
    input.isProveedor = this.isProveedor
    return input;
  }
}
