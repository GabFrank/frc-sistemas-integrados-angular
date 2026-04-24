import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReplicationDirection, ReplicationTable } from '../replication-table.model';
import { ReplicationTableService } from '../replication-table.service';
import { EditReplicationTableDialogComponent } from '../edit-replication-table-dialog/edit-replication-table-dialog.component';
import { PageInfo } from '../../../../app.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

@UntilDestroy()
@Component({
  selector: 'app-list-replication-tables',
  templateUrl: './list-replication-tables.component.html',
  styleUrls: ['./list-replication-tables.component.scss']
})
export class ListReplicationTablesComponent implements OnInit {
  // Table data
  tablesPage: PageInfo<ReplicationTable>;
  
  // Search and filters
  searchControl = new FormControl('');
  directionFilterControl = new FormControl('');
  enabledFilterControl = new FormControl('');
  
  // Pagination
  pageIndex = 0;
  pageSize = 10;
  isLoading = false;
  
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
  
  @ViewChild(MatPaginator) paginator: MatPaginator;

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
    try {
      // Load initial data
      this.loadTables();
      
      // Set up search with debounce
      this.searchControl.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          untilDestroyed(this)
        )
        .subscribe({
          next: () => {
            console.log('Search term changed');
            this.pageIndex = 0;
            this.loadTables();
          },
          error: (err) => console.error('Error in search subscription:', err)
        });
      
      // Set up direction filter
      this.directionFilterControl.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe({
          next: () => {
            console.log('Direction filter changed');
            this.pageIndex = 0;
            this.loadTables();
          },
          error: (err) => console.error('Error in direction filter subscription:', err)
        });
      
      // Set up enabled filter
      this.enabledFilterControl.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe({
          next: () => {
            console.log('Enabled filter changed');
            this.pageIndex = 0;
            this.loadTables();
          },
          error: (err) => console.error('Error in enabled filter subscription:', err)
        });
      
      console.log('ListReplicationTablesComponent: initialized successfully');
    } catch (error) {
      console.error('Error during component initialization:', error);
      this.notificacionSnackBar.openAlgoSalioMal('ERROR AL INICIALIZAR COMPONENTE');
    }
  }

  loadTables(): void {
    this.isLoading = true;
    
    try {
      // Get search term and filters
      const search = this.searchControl.value;
      
      this.replicationTableService.getReplicationTablesWithPagination(
        this.pageIndex,
        this.pageSize,
        search
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (page) => {
          try {
            this.tablesPage = page;
            
            // Update pageIndex if provided from the backend
            if (page?.getPageable?.getPageNumber !== undefined) {
              this.pageIndex = page.getPageable.getPageNumber;
            }
            
            this.isLoading = false;
          } catch (error) {
            console.error('Error while processing replication tables data:', error);
            this.isLoading = false;
            this.notificacionSnackBar.openAlgoSalioMal('ERROR AL PROCESAR DATOS DE TABLAS DE REPLICACIÓN');
          }
        },
        error: (error) => {
          console.error('Error loading replication tables:', error);
          this.isLoading = false;
          this.notificacionSnackBar.openAlgoSalioMal('ERROR AL CARGAR TABLAS DE REPLICACIÓN');
        }
      });
    } catch (error) {
      console.error('Exception in loadTables method:', error);
      this.isLoading = false;
      this.notificacionSnackBar.openAlgoSalioMal('ERROR AL INTENTAR CARGAR TABLAS DE REPLICACIÓN');
    }
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
    this.replicationTableService.toggleReplicationTableEnabled(table.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          if (result) {
            table.enabled = !table.enabled;
          }
        }
      });
  }
  
  deleteTable(table: ReplicationTable): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Está seguro que desea eliminar la configuración de la tabla "${table.tableName}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });
    
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.replicationTableService.deleteReplicationTable(table.id)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (success) => {
              if (success) {
                this.loadTables();
              }
            }
          });
      }
    });
  }
  
  updateServiceTables(): void {
    this.replicationTableService.updateReplicationServiceTables()
      .pipe(untilDestroyed(this))
      .subscribe();
  }
  
  clearFilters(): void {
    this.searchControl.setValue('');
    this.directionFilterControl.setValue('');
    this.enabledFilterControl.setValue('');
    this.pageIndex = 0;
    this.loadTables();
  }
  
  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTables();
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