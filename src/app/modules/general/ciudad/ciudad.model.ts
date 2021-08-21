import { Usuario } from '../../personas/usuarios/usuario.model';

export class Ciudad {
  id: number;
  descripcion: string;
  creadoEn: Date;
  usuario: Usuario;
}
