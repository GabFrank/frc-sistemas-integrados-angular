import { Ente } from './ente.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { Persona } from '../../../personas/persona/persona.model';

export interface EnteVinculacion {
  id?: number;
  ente?: Ente;
  sucursal?: Sucursal;
  esPropio?: boolean;
  alquilerProveedor?: Persona;
  alquilerMonto?: number;
  alquilerDiaVencimiento?: number;
  alquilerVigencia?: Date | string;
  observacion?: string;
  creadoEn?: Date;
}

export interface EnteVinculacionInput {
  id?: number;
  enteId?: number;
  sucursalId?: number;
  esPropio?: boolean;
  alquilerProveedorId?: number;
  alquilerMonto?: number;
  alquilerDiaVencimiento?: number;
  alquilerVigencia?: string;
  observacion?: string;
  usuarioId?: number;
}
