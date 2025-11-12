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
  activo: boolean
  ip: string
  puerto: number
  creadoEn: Date;
  usuario: Usuario;
  codigoEstablecimientoFactura: string
  direccion: string;
  nroDelivery: string;
  isConfigured: boolean;
  sectorList: Sector[];
  activo: boolean;

  toInput(): any {
    return {
      id: this.id,
      nombre: this.nombre,
      localizacion: this.localizacion,
      ciudadId: this.ciudad?.id,
      usuarioId: this.usuario?.id,
      deposito: this.deposito,
      depositoPredeterminado: this.depositoPredeterminado,
      activo: this.activo,
      codigoEstablecimientoFactura: this.codigoEstablecimientoFactura,
      creadoEn: dateToString(this.creadoEn),
      ip: this.ip,
      puerto: this.puerto,
      direccion: this.direccion,
      nroDelivery: this.nroDelivery,
      isConfigured: this.isConfigured,
      activo: this.activo
    };
  }
}
