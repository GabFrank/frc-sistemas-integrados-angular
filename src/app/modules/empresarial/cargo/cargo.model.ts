import { Ciudad } from '../../general/ciudad/ciudad.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export class Cargo {
  id: number;
  nombre: string;
  descripcion: string;
  supervisadoPor: Cargo;
  sueldoBase: number;
  creadoEn: Date;
  subcargoList: Cargo[]
  usuario: Usuario;
}
