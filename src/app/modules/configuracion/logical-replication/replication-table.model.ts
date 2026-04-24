import { Usuario } from '../../personas/usuarios/usuario.model';
import { dateToString } from '../../../commons/core/utils/dateUtils';

/**
 * Enum para las direcciones de replicación
 */
export enum ReplicationDirection {
  // Replicación desde la central a todas las sucursales
  MAIN_TO_ALL = 'MAIN_TO_ALL',
  
  // Replicación desde la central a sucursales específicas
  MAIN_TO_SPECIFIC = 'MAIN_TO_SPECIFIC',
  
  // Replicación desde sucursal a la central
  BRANCH_TO_MAIN = 'BRANCH_TO_MAIN'
}

/**
 * Modelo para la tabla de replicación
 */
export interface ReplicationTable {
  // ID de la tabla de replicación
  id?: number;
  
  // Nombre de la tabla en la base de datos
  tableName: string;
  
  // Descripción opcional de la tabla
  description?: string;
  
  // Dirección de replicación
  direction: ReplicationDirection;
  
  // Indica si está activa para replicación
  enabled: boolean;
  
  // Fecha de creación
  createdAt?: Date;
  
  // Fecha de última actualización
  updatedAt?: Date;
  
  // Lista de IDs de sucursales para MAIN_TO_SPECIFIC
  branchIds?: number[];
  // Para BRANCH_TO_MAIN: si true, la tabla también va en central_filialX_pub (central → sucursal con filtro)
  replicateCentralToBranchWithFilter?: boolean;
}

export class ReplicationTableModel {
  id: number;
  tableName: string;
  direction: ReplicationDirection;
  enabled: boolean;
  description: string;
  creadoEn: Date;
  usuario: Usuario;
  branchIds: number[];
  replicateCentralToBranchWithFilter: boolean;

  constructor() {
    this.enabled = true;
    this.replicateCentralToBranchWithFilter = false;
  }

  toInput(): any {
    return {
      id: this.id,
      tableName: this.tableName?.toUpperCase(),
      direction: this.direction,
      enabled: this.enabled,
      description: this.description?.toUpperCase(),
      usuarioId: this.usuario?.id,
      creadoEn: dateToString(this.creadoEn),
      branchIds: this.branchIds ?? [],
      replicateCentralToBranchWithFilter: this.replicateCentralToBranchWithFilter ?? false
    };
  }

  // Helper method to get a human-readable direction name
  getDirectionName(): string {
    switch (this.direction) {
      case ReplicationDirection.MAIN_TO_ALL:
        return 'Central a Todas las Sucursales';
      case ReplicationDirection.MAIN_TO_SPECIFIC:
        return 'Central a Sucursales Específicas';
      case ReplicationDirection.BRANCH_TO_MAIN:
        return 'Sucursal a Central';
      default:
        return 'Desconocido';
    }
  }
} 