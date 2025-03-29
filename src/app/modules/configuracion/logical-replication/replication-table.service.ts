import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MainService } from '../../../main.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';

import { ReplicationDirection, ReplicationTable, ReplicationTableModel } from './replication-table.model';
import { ReplicationTablesGQL } from './graphql/replication-tables-gql';
import { ReplicationTableGQL } from './graphql/replication-table-gql';
import { ReplicationTablesWithPaginationGQL } from './graphql/replication-tables-with-pagination-gql';
import { ReplicationTablesByDirectionGQL } from './graphql/replication-tables-by-direction-gql';
import { EnabledReplicationTablesGQL } from './graphql/enabled-replication-tables-gql';
import { MainToAllTableNamesGQL, MainToSpecificTableNamesGQL, BranchToMainTableNamesGQL } from './graphql/table-names-gql';
import { SaveReplicationTableGQL } from './graphql/save-replication-table-gql';
import { DeleteReplicationTableGQL } from './graphql/delete-replication-table-gql';
import { ToggleReplicationTableEnabledGQL } from './graphql/toggle-replication-table-enabled-gql';
import { UpdateReplicationServiceTablesGQL } from './graphql/update-replication-service-tables-gql';

@Injectable({
  providedIn: 'root'
})
export class ReplicationTableService {

  constructor(
    private replicationTablesGQL: ReplicationTablesGQL,
    private replicationTableGQL: ReplicationTableGQL,
    private replicationTablesWithPaginationGQL: ReplicationTablesWithPaginationGQL,
    private replicationTablesByDirectionGQL: ReplicationTablesByDirectionGQL,
    private enabledReplicationTablesGQL: EnabledReplicationTablesGQL,
    private mainToAllTableNamesGQL: MainToAllTableNamesGQL,
    private mainToSpecificTableNamesGQL: MainToSpecificTableNamesGQL,
    private branchToMainTableNamesGQL: BranchToMainTableNamesGQL,
    private saveReplicationTableGQL: SaveReplicationTableGQL,
    private deleteReplicationTableGQL: DeleteReplicationTableGQL,
    private toggleReplicationTableEnabledGQL: ToggleReplicationTableEnabledGQL,
    private updateReplicationServiceTablesGQL: UpdateReplicationServiceTablesGQL,
    private snackBar: MatSnackBar,
    private mainService: MainService,
    private genericService: GenericCrudService
  ) { }

  /**
   * Get all replication tables
   */
  getAllReplicationTables(): Observable<ReplicationTable[]> {
    return this.replicationTablesGQL.fetch({}, { fetchPolicy: 'no-cache' })
      .pipe(
        map(response => response.data?.data || [])
      );
  }

  /**
   * Get a replication table by ID
   */
  getReplicationTableById(id: number): Observable<ReplicationTable> {
    return this.replicationTableGQL.fetch({ id }, { fetchPolicy: 'no-cache' })
      .pipe(
        map(response => response.data?.data)
      );
  }

  /**
   * Get replication tables with pagination
   */
  getReplicationTablesWithPagination(
    page: number = 0,
    size: number = 10,
    search?: string
  ): Observable<PageInfo<ReplicationTable>> {
    console.log(`Getting paginated replication tables - page: ${page}, size: ${size}, search: ${search}`);
    try {
      return this.replicationTablesWithPaginationGQL.fetch({
        page,
        size,
        search: search || ''
      }, {
        fetchPolicy: 'network-only'
      }).pipe(
        map(response => {
          console.log('Replication tables pagination response:', response);
          if (response.data && response.data.data) {
            return response.data.data;
          } else {
            console.warn('No data received from pagination query');
            return {
              getContent: [],
              getTotalElements: 0,
              getTotalPages: 0,
              getNumberOfElements: 0,
              isFirst: true,
              isLast: true,
              hasNext: false,
              hasPrevious: false,
              getPageable: {
                getPageNumber: page,
                getPageSize: size
              }
            };
          }
        }),
        catchError(error => {
          console.error('Error fetching replication tables with pagination:', error);
          this.snackBar.open('Error al obtener tablas de replicación', 'Cerrar', { duration: 3000 });
          // Return empty page instead of throwing to avoid unhandled errors
          return of({
            getContent: [],
            getTotalElements: 0,
            getTotalPages: 0,
            getNumberOfElements: 0,
            isFirst: true,
            isLast: true,
            hasNext: false,
            hasPrevious: false,
            getPageable: {
              getPageNumber: page,
              getPageSize: size
            }
          });
        })
      );
    } catch (error) {
      console.error('Exception in getReplicationTablesWithPagination method:', error);
      this.snackBar.open('Error inesperado al obtener tablas de replicación', 'Cerrar', { duration: 3000 });
      return of({
        getContent: [],
        getTotalElements: 0,
        getTotalPages: 0,
        getNumberOfElements: 0,
        isFirst: true,
        isLast: true,
        hasNext: false,
        hasPrevious: false,
        getPageable: {
          getPageNumber: page,
          getPageSize: size
        }
      });
    }
  }

  /**
   * Get replication tables by direction
   */
  getReplicationTablesByDirection(direction: ReplicationDirection): Observable<ReplicationTable[]> {
    return this.replicationTablesByDirectionGQL.fetch(
      { direction },
      { fetchPolicy: 'no-cache' }
    ).pipe(
      map(response => response.data?.data || [])
    );
  }

  /**
   * Get enabled replication tables
   */
  getEnabledReplicationTables(): Observable<ReplicationTable[]> {
    return this.enabledReplicationTablesGQL.fetch({}, { fetchPolicy: 'no-cache' })
      .pipe(
        map(response => response.data?.data || [])
      );
  }

  /**
   * Get table names for MAIN_TO_ALL direction
   */
  getMainToAllTableNames(): Observable<string[]> {
    return this.mainToAllTableNamesGQL.fetch({}, { fetchPolicy: 'no-cache' })
      .pipe(
        map(response => response.data?.data || [])
      );
  }

  /**
   * Get table names for MAIN_TO_SPECIFIC direction
   */
  getMainToSpecificTableNames(): Observable<string[]> {
    return this.mainToSpecificTableNamesGQL.fetch({}, { fetchPolicy: 'no-cache' })
      .pipe(
        map(response => response.data?.data || [])
      );
  }

  /**
   * Get table names for BRANCH_TO_MAIN direction
   */
  getBranchToMainTableNames(): Observable<string[]> {
    return this.branchToMainTableNamesGQL.fetch({}, { fetchPolicy: 'no-cache' })
      .pipe(
        map(response => response.data?.data || [])
      );
  }

  /**
   * Save a replication table (create or update)
   */
  saveReplicationTable(replicationTable: ReplicationTable): Observable<ReplicationTable> {
    // Convert from interface to model for saving
    const replicationTableModel = new ReplicationTableModel();
    
    // Copy properties from the interface to the model
    replicationTableModel.id = replicationTable.id;
    replicationTableModel.tableName = replicationTable.tableName;
    replicationTableModel.description = replicationTable.description;
    replicationTableModel.direction = replicationTable.direction;
    replicationTableModel.enabled = replicationTable.enabled;
    
    // Set the current user if creating a new record
    if (!replicationTableModel.id) {
      replicationTableModel.usuario = this.mainService.usuarioActual;
    }
    
    return this.saveReplicationTableGQL.mutate(
      { input: replicationTableModel.toInput() },
      { fetchPolicy: 'no-cache' }
    ).pipe(
      map(response => {
        const result = response.data?.data;
        if (result) {
          this.snackBar.open(
            `Configuración de tabla ${result.tableName} guardada correctamente`,
            'Cerrar',
            { duration: 3000 }
          );
          return result as ReplicationTable;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error saving replication table:', error);
        this.snackBar.open('Error al guardar la tabla de replicación', 'Cerrar', { duration: 3000 });
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a replication table
   */
  deleteReplicationTable(id: number): Observable<boolean> {
    return this.deleteReplicationTableGQL.mutate(
      { id },
      { fetchPolicy: 'no-cache' }
    ).pipe(
      map(response => {
        const result = response.data?.data;
        if (result) {
          this.snackBar.open(
            'Configuración de tabla eliminada correctamente',
            'Cerrar',
            { duration: 3000 }
          );
        }
        return result;
      })
    );
  }

  /**
   * Toggle a replication table's enabled status
   */
  toggleReplicationTableEnabled(id: number): Observable<boolean> {
    return this.toggleReplicationTableEnabledGQL.mutate(
      { id },
      { fetchPolicy: 'no-cache' }
    ).pipe(
      map(response => {
        const result = response.data?.data;
        if (result) {
          this.snackBar.open(
            'Estado de la tabla actualizado correctamente',
            'Cerrar',
            { duration: 3000 }
          );
        }
        return result;
      })
    );
  }

  /**
   * Update the LogicalReplicationService with current table configuration
   */
  updateReplicationServiceTables(): Observable<boolean> {
    return this.updateReplicationServiceTablesGQL.mutate(
      {},
      { fetchPolicy: 'no-cache' }
    ).pipe(
      map(response => {
        const result = response.data?.data;
        if (result) {
          this.snackBar.open(
            'Configuración de replicación actualizada correctamente',
            'Cerrar',
            { duration: 3000 }
          );
        }
        return result;
      })
    );
  }

  /**
   * Get readable direction name
   */
  getDirectionName(direction: ReplicationDirection): string {
    switch (direction) {
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

  /**
   * Get all available directions as options for select
   */
  getDirectionOptions(): { value: ReplicationDirection, label: string }[] {
    return [
      { value: ReplicationDirection.MAIN_TO_ALL, label: this.getDirectionName(ReplicationDirection.MAIN_TO_ALL) },
      { value: ReplicationDirection.MAIN_TO_SPECIFIC, label: this.getDirectionName(ReplicationDirection.MAIN_TO_SPECIFIC) },
      { value: ReplicationDirection.BRANCH_TO_MAIN, label: this.getDirectionName(ReplicationDirection.BRANCH_TO_MAIN) }
    ];
  }
} 