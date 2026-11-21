import { Usuario } from '../../personas/usuarios/usuario.model';

export class Pais {
  id: number;
  descripcion: string;
  codigo: string;
  creadoEn: Date;
  usuario: Usuario;
}
