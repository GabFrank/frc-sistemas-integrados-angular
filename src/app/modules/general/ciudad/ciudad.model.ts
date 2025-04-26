import { dateToString } from '../../../commons/core/utils/dateUtils';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { Pais } from '../pais/pais.model';

export class Ciudad {
  id: number;
  descripcion: string;
  creadoEn: Date;
  usuario: Usuario; 
  pais: Pais;

  toInput(): CiudadInput {
    return {
      id: this.id,
      descripcion: this.descripcion,
      paisId: this.pais.id,
      creadoEn: dateToString(this.creadoEn),
      usuarioId: this.usuario.id
    };
  }
}

export class CiudadInput {
  id: number;
  descripcion: string;
  paisId: number;
  creadoEn: string;
  usuarioId: number;
}

