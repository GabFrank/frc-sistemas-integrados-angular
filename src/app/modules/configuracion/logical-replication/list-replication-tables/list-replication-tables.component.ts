import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReplicationDirection, ReplicationTable } from '../replication-table.model';
import { ReplicationTableService } from '../replication-table.service';
import { EditReplicationTableDialogComponent } from '../edit-replication-table-dialog/edit-replication-table-dialog.component';
import { PageInfo } from '../../../../app.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

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
    private snackBar: MatSnackBar
  ) { 
    console.log("ListReplicationTablesComponent: constructor");
    
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
    console.log('ListReplicationTablesComponent: initializing...');
    
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
      this.snackBar.open('Error al inicializar componente', 'Cerrar', { duration: 3000 });
    }
  }

  loadTables(): void {
    console.log('Loading replication tables...');
    this.isLoading = true;
    
    try {
      // Get search term and filters
      const search = this.searchControl.value;
      console.log('Search term:', search);
      
      this.replicationTableService.getReplicationTablesWithPagination(
        this.pageIndex,
        this.pageSize,
        search
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (page) => {
          console.log('Received replication tables:', page);
          try {
            this.tablesPage = page;
            
            // Apply client-side filtering for direction and enabled status
            if (this.tablesPage && this.tablesPage.getContent) {
              console.log('Applying client-side filters');
              let filteredContent = [...this.tablesPage.getContent];
              
              // Filter by direction
              const directionFilter = this.directionFilterControl.value;
              console.log('Direction filter:', directionFilter);
              if (directionFilter) {
                filteredContent = filteredContent.filter(table => table.direction === directionFilter);
              }
              
              // Filter by enabled status
              const enabledFilter = this.enabledFilterControl.value;
              console.log('Enabled filter:', enabledFilter);
              if (enabledFilter !== null && enabledFilter !== '') {
                const enabled = enabledFilter === 'true';
                filteredContent = filteredContent.filter(table => table.enabled === enabled);
              }
              
              // Create a new page with filtered content
              this.tablesPage = {
                ...this.tablesPage,
                getContent: filteredContent
              };
              console.log('Filtered content:', filteredContent);
            } else {
              console.warn('No content received from page or getContent is undefined');
            }
            
            // Update pageIndex if provided from the backend
            if (page?.getPageable?.getPageNumber !== undefined) {
              this.pageIndex = page.getPageable.getPageNumber;
            }
            
            this.isLoading = false;
            console.log('Table loading completed successfully');
          } catch (error) {
            console.error('Error while processing replication tables data:', error);
            this.isLoading = false;
            this.snackBar.open('Error al procesar datos de tablas de replicación', 'Cerrar', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error loading replication tables:', error);
          this.isLoading = false;
          this.snackBar.open('Error al cargar tablas de replicación', 'Cerrar', { duration: 3000 });
        }
      });
    } catch (error) {
      console.error('Exception in loadTables method:', error);
      this.isLoading = false;
      this.snackBar.open('Error al intentar cargar tablas de replicación', 'Cerrar', { duration: 3000 });
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