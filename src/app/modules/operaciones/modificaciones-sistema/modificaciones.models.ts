import { Usuario } from '../../personas/usuarios/usuario.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';

export class ModificacionRegistro {
  id: number;
  tipoEntidad: string;
  entidadId: number;
  entidadSucursalId?: number;
  schemaNombre: string;
  tablaNombre: string;
  tipoOperacion: TipoOperacion;
  usuario?: Usuario;
  sucursal?: Sucursal;
  modificadoEn: Date;
  creadoEn: Date;
  ipAddress?: string;
  userAgent?: string;
  observacion?: string;
  activo: boolean;
  detalles?: ModificacionDetalle[];
}

export class ModificacionDetalle {
  id: number;
  modificacionRegistro?: ModificacionRegistro;
  campoNombre: string;
  campoTipo?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  valorAnteriorId?: number;
  valorNuevoId?: number;
  orden: number;
  esCampoSensible: boolean;
}

export enum TipoOperacion {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SOFT_DELETE = 'SOFT_DELETE'
}
