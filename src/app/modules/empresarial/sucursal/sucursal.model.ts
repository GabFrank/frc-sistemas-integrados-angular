import { dateToString } from '../../../commons/core/utils/dateUtils';
import { Ciudad } from '../../general/ciudad/ciudad.model';
import { Sector } from '../sector/sector.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export class Sucursal {
  id: number;
  nombre: string;
  localizacion: string;
  ciudad: Ciudad;
  deposito: boolean
  depositoPredeterminado: boolean
  ip: string
  puerto: number
  creadoEn: Date;
  usuario: Usuario;
  codigoEstablecimientoFactura: string
  direccion: string;
  nroDelivery: string;
  isConfigured: boolean;
  sectorList: Sector[];

  toInput(): any {
    return {
      id: this.id,
      nombre: this.nombre,
      localizacion: this.localizacion,
      ciudadId: this.ciudad?.id,
      usuarioId: this.usuario?.id,
      deposito: this.deposito,
      depositoPredeterminado: this.depositoPredeterminado,
      codigoEstablecimientoFactura: this.codigoEstablecimientoFactura,
      creadoEn: dateToString(this.creadoEn),
      ip: this.ip,
      puerto: this.puerto,
      direccion: this.direccion,
      nroDelivery: this.nroDelivery,
      isConfigured: this.isConfigured
    };
  }
}
