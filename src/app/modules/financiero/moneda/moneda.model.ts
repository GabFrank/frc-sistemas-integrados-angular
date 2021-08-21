import { Pais } from '../../general/pais/pais.model';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { Cambio } from '../cambio/cambio.model';

export class Moneda{
  id: number;
  denominacion: string;
  simbolo: string;
  pais: Pais;
  creadoEn: Date;
  usuario: Usuario;
  cambio: number
}
