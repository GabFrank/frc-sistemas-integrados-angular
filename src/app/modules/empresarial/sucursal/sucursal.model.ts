import { Ciudad } from '../../general/ciudad/ciudad.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export class Sucursal {
  id: number;
  nombre: string;
  localizacion: string;
  ciudad: Ciudad;
  deposito: boolean
  depositoPredeterminado: boolean
  creadoEn: Date;
  usuario: Usuario;
  codigoEstablecimientoFactura: string
}
