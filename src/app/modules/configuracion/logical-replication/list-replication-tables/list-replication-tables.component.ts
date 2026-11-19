import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { timer } from 'rxjs';
import { ReplicationDirection, ReplicationTable } from '../replication-table.model';
import { ReplicationTableService } from '../replication-table.service';
import { EditReplicationTableDialogComponent } from '../edit-replication-table-dialog/edit-replication-table-dialog.component';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { erroresDeRechazo, RECARGA_TRAS_CORTE_MS } from '../../../../commons/core/utils/graphqlErrorUtils';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-replication-tables',
  templateUrl: './list-replication-tables.component.html',
  styleUrls: ['./list-replication-tables.component.scss']
})
export class ListReplicationTablesComponent implements OnInit {
  private dialogos = inject(DialogosService);
  // Search and filters
  searchControl = new FormControl('');
  directionFilterControl = new FormControl('');
  enabledFilterControl = new FormControl('');
  
  /** El central filtra (texto, dirección, estado) y pagina (#772). */
  pag = new PaginacionLista<ReplicationTable>({
    cargar: (page, size) => this.replicationTableService.getReplicationTablesWithPagination(
      page,
      size,
      this.searchControl.value,
      (this.directionFilterControl.value as ReplicationDirection) || null,
      this.enabledFilterControl.value === '' || this.enabledFilterControl.value == null
        ? null
        : this.enabledFilterControl.value === 'true'
    ),
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
    // Solo la recarga tras el corte libera el bloqueo: otra (el buscador) puede traer el estado de antes de que
    // el central termine (#501).
    alCargar: () => {
      if (this.liberarTogglesAlCargar) {
        this.liberarTogglesAlCargar = false;
        this.toggleSinConfirmar = false;
      }
    },
  });
  private liberarTogglesAlCargar = false;
  /** Un cambio de estado quedó sin respuesta: repetirlo lo invertiría otra vez, así que se bloquea hasta recargar (#501). */
  toggleSinConfirmar = false;
  
  // Table configuration
  displayedColumns: string[] = ['tableName', 'direction', 'description', 'enabled', 'actions'];
  
  // Pre-calculated options to avoid function calls in template
  directionOptions: { value: ReplicationDirection, label: string }[] = [];
  enabledOptions: { value: string, label: string }[] = [
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' }
  ];
  
  // Map for direction names to display
  directionNameMap: { [key in ReplicationDirection]: string } = {} as { [key in ReplicationDirection]: string };
  
  constructor(
    private replicationTableService: ReplicationTableService,
    private dialog: MatDialog,
    private notificacionSnackBar: NotificacionSnackbarService
  ) { 
    // Initialize the direction options
    this.directionOptions = this.initializeDirectionOptions();
    this.initializeDirectionNameMap();
  }

  private initDirectionOptions(): void {
    // Initialize the direction options
    this.directionOptions = [
      { value: ReplicationDirection.MAIN_TO_ALL, label: 'Principal a Todas' },
      { value: ReplicationDirection.MAIN_TO_SPECIFIC, label: 'Principal a Específica' },
      { value: ReplicationDirection.BRANCH_TO_MAIN, label: 'Sucursal a Principal' }
    ];
    
    // Create a map for quick lookup of direction names
    this.directionOptions.forEach(option => {
      this.directionNameMap[option.value] = option.label;
    });
  }

  ngOnInit(): void {
    this.pag.filtrar();
    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => this.pag.filtrar());
    this.directionFilterControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.pag.filtrar());
    this.enabledFilterControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.pag.filtrar());
  }

  /** Repite la página actual (después de crear, editar, borrar o cambiar el estado). */
  loadTables(): void {
    this.pag.recargar();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(EditReplicationTableDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });
    
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.loadTables();
      }
    });
  }
  
  openEditDialog(table: ReplicationTable): void {
    const dialogRef = this.dialog.open(EditReplicationTableDialogComponent, {
      width: '500px',
      data: { isEdit: true, table: table }
    });
    
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.loadTables();
      }
    });
  }
  
  toggleEnabled(table: ReplicationTable): void {
    if (this.toggleSinConfirmar) {
      return;
    }
    this.replicationTableService.toggleReplicationTableEnabled(table.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          if (result) {
            table.enabled = !table.enabled;
          } else {
            this.notificacionSnackBar.openWarn('No se pudo cambiar el estado de la tabla.');
          }
        },
        error: (error) => {
          // El servicio ya avisó. Sin respuesta pudo invertirse: no se deja repetir hasta ver el estado real
          if (erroresDeRechazo(error) == null) {
            this.toggleSinConfirmar = true;
            this.recargarTrasCorte();
          }
        }
      });
  }
  
  deleteTable(table: ReplicationTable): void {
    this.dialogos.confirmar({
      titulo: 'Confirmar Eliminación',
      mensaje: `¿Está seguro que desea eliminar la configuración de la tabla "${table.tableName}"?`,
      si: 'Eliminar',
      no: 'Cancelar',
      peligro: true,
      ancho: '350px'
    }).pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.replicationTableService.deleteReplicationTable(table.id)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (success) => {
              if (success) {
                this.loadTables();
              } else {
                this.notificacionSnackBar.openWarn('No se pudo eliminar la configuración de la tabla.');
              }
            },
            error: (error) => {
              // El servicio ya avisó. Sin respuesta pudo borrarse: la lista se recarga
              if (erroresDeRechazo(error) == null) {
                this.recargarTrasCorte();
              }
            }
          });
      }
    });
  }
  
  updateServiceTables(): void {
    this.replicationTableService.updateReplicationServiceTables()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          if (!result) {
            this.notificacionSnackBar.openWarn('No se pudo actualizar la configuración de replicación.');
          }
        },
        // El servicio ya avisó; actualizar es idempotente y no cambia la lista
        error: () => {}
      });
  }
  
  /** Recarga cuando el central tuvo tiempo de terminar lo que quedó sin respuesta (#501). */
  private recargarTrasCorte(): void {
    timer(RECARGA_TRAS_CORTE_MS).pipe(untilDestroyed(this)).subscribe(() => {
      this.liberarTogglesAlCargar = true;
      this.loadTables();
    });
  }

  clearFilters(): void {
    // Sin emitir: se busca una sola vez, con los tres filtros ya limpios.
    this.searchControl.setValue('', { emitEvent: false });
    this.directionFilterControl.setValue('', { emitEvent: false });
    this.enabledFilterControl.setValue('', { emitEvent: false });
    this.pag.filtrar();
  }
  
  // This method is kept for compatibility but should not be used in the template
  getDirectionName(direction: ReplicationDirection): string {
    return this.directionNameMap[direction] || 'Desconocido';
  }

  // Initialize direction options
  private initializeDirectionOptions(): {value: ReplicationDirection, label: string}[] {
    return [
      { value: ReplicationDirection.MAIN_TO_ALL, label: 'Principal a Todas' },
      { value: ReplicationDirection.MAIN_TO_SPECIFIC, label: 'Principal a Específica' },
      { value: ReplicationDirection.BRANCH_TO_MAIN, label: 'Sucursal a Principal' }
    ];
  }

  // Initialize direction name mapping
  private initializeDirectionNameMap(): void {
    this.directionNameMap[ReplicationDirection.MAIN_TO_ALL] = 'Principal a Todas';
    this.directionNameMap[ReplicationDirection.MAIN_TO_SPECIFIC] = 'Principal a Específica';
    this.directionNameMap[ReplicationDirection.BRANCH_TO_MAIN] = 'Sucursal a Principal';
  }

  // These methods should no longer be called from the template
  getDirectionOptions() {
    return this.directionOptions;
  }

  getEnabledOptions() {
    return this.enabledOptions;
  }
} 