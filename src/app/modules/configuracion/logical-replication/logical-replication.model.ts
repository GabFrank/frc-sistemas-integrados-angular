import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export class LogicalReplication {
  id: number;
  name: string;
  enabled: boolean;
  sucursal: Sucursal;
  tables: string[];
  usuario: Usuario;

  toInput(): any {
    return {
      id: this.id,
      name: this.name?.toUpperCase(),
      enabled: this.enabled,
      sucursalId: this.sucursal?.id,
      tables: this.tables,
      usuarioId: this.usuario?.id
    };
  }
}

export class ReplicationStatus {
  success: boolean;
  message: string;
} 