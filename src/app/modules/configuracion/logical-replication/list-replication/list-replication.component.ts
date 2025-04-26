import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LogicalReplication } from '../logical-replication.model';
import { LogicalReplicationService } from '../logical-replication.service';
import { PageInfo } from '../../../../app.component';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { EditRemotePublicationDialogComponent } from '../edit-remote-publication-dialog/edit-remote-publication-dialog.component';
import { EditRemoteSubscriptionDialogComponent } from '../edit-remote-subscription-dialog/edit-remote-subscription-dialog.component';

@UntilDestroy()
@Component({
  selector: 'app-list-replication',
  templateUrl: './list-replication.component.html',
  styleUrls: ['./list-replication.component.scss']
})
export class ListReplicationComponent implements OnInit {
  // Branch selection
  sucursalList: Sucursal[] = [];
  selectedSucursalControl = new FormControl(null);
  isLocalMode = true;
  
  // Pre-calculated properties to avoid function calls in template
  selectedBranchName = 'Local';
  
  // Subscriptions data
  subscriptionsPage: PageInfo<LogicalReplication>;
  isLoadingSubscriptions = false;
  subPageSize = 10;
  subPageIndex = 0;
  
  // Publications data
  publicationsPage: PageInfo<LogicalReplication>;
  isLoadingPublications = false;
  pubPageSize = 10;
  pubPageIndex = 0;
  
  // Common
  displayedColumns: string[] = ['name', 'sucursal', 'enabled', 'actions'];
  
  @ViewChild('subPaginator') subPaginator: MatPaginator;
  @ViewChild('pubPaginator') pubPaginator: MatPaginator;

  constructor(
    private logicalReplicationService: LogicalReplicationService,
    private sucursalService: SucursalService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Load branches for remote selection
    this.loadSucursales();
    
    // Initial data load
    this.loadSubscriptions();
    this.loadPublications();
    
    // Subscribe to branch selection changes
    this.selectedSucursalControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      this.isLocalMode = value === null;
      
      // Update the display name for the selected branch
      this.updateSelectedBranchName();
      
      // Reset pagination
      this.subPageIndex = 0;
      this.pubPageIndex = 0;
      
      // Reload data
      this.loadSubscriptions();
      this.loadPublications();
    });
  }
  
  loadSucursales(): void {
    this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this)).subscribe(sucursales => {
      this.sucursalList = sucursales || [];
      this.updateSelectedBranchName();
    });
  }

  loadSubscriptions(): void {
    this.isLoadingSubscriptions = true;
    
    const sucursalId = this.selectedSucursalControl.value;
    
    if (this.isLocalMode) {
      // Load local subscriptions
      this.logicalReplicationService.getReplicationSubscriptions(this.subPageIndex, this.subPageSize)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (page) => {
            this.subscriptionsPage = page;
            
            // Update pageIndex if available from the response
            if (page?.getPageable?.getPageNumber !== undefined) {
              this.subPageIndex = page.getPageable.getPageNumber;
            }
            this.isLoadingSubscriptions = false;
          },
          error: (error) => {
            console.error('Error loading subscriptions:', error);
            this.isLoadingSubscriptions = false;
            this.snackBar.open('Error al cargar suscripciones', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Load remote subscriptions
      this.logicalReplicationService.getRemoteReplicationSubscriptions(sucursalId, this.subPageIndex, this.subPageSize)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (page) => {
            this.subscriptionsPage = page;
            
            // Update pageIndex if available from the response
            if (page?.getPageable?.getPageNumber !== undefined) {
              this.subPageIndex = page.getPageable.getPageNumber;
            }
            this.isLoadingSubscriptions = false;
          },
          error: (error) => {
            console.error('Error loading remote subscriptions:', error);
            this.isLoadingSubscriptions = false;
            this.snackBar.open('Error al cargar suscripciones remotas', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }
  
  loadPublications(): void {
    this.isLoadingPublications = true;
    
    const sucursalId = this.selectedSucursalControl.value;
    
    if (this.isLocalMode) {
      // Load local publications
      this.logicalReplicationService.getReplicationPublications(this.pubPageIndex, this.pubPageSize)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (page) => {
            this.publicationsPage = page;
            // Update pageIndex if available from the response
            if (page?.getPageable?.getPageNumber !== undefined) {
              this.pubPageIndex = page.getPageable.getPageNumber;
            }
            this.isLoadingPublications = false;
          },
          error: (error) => {
            console.error('Error loading publications:', error);
            this.isLoadingPublications = false;
            this.snackBar.open('Error al cargar publicaciones', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Load remote publications
      this.logicalReplicationService.getRemoteReplicationPublications(sucursalId, this.pubPageIndex, this.pubPageSize)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (page) => {
            this.publicationsPage = page;
            // Update pageIndex if available from the response
            if (page?.getPageable?.getPageNumber !== undefined) {
              this.pubPageIndex = page.getPageable.getPageNumber;
            }
            this.isLoadingPublications = false;
          },
          error: (error) => {
            console.error('Error loading remote publications:', error);
            this.isLoadingPublications = false;
            this.snackBar.open('Error al cargar publicaciones remotas', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  setupReplication(): void {
    // This would open a dialog to set up a new replication
    // For now we'll just show a message
    this.snackBar.open('Esta funcionalidad se implementará en el futuro', 'Cerrar', { duration: 3000 });
  }

  toggleReplication(item: LogicalReplication, isSubscription: boolean): void {
    const newStatus = !item.enabled;
    
    if (this.isLocalMode) {
      // Toggle local replication
      this.logicalReplicationService.toggleReplication(item.sucursal.id, newStatus, isSubscription)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (result) => {
            if (result?.success) {
              // Update the item in the local list
              item.enabled = newStatus;
            }
            // The service already shows success/error messages
          }
        });
    } else {
      // Toggle remote subscription
      if (isSubscription) {
        const sucursalId = this.selectedSucursalControl.value;
        this.logicalReplicationService.toggleRemoteSubscription(sucursalId, item.name, newStatus)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (result) => {
              if (result?.success) {
                // Update the item in the local list
                item.enabled = newStatus;
              }
              // The service already shows success/error messages
            }
          });
      } else {
        this.snackBar.open('No se puede alternar publicaciones remotas directamente', 'Cerrar', { duration: 3000 });
      }
    }
  }

  removeReplication(item: LogicalReplication, isSubscription: boolean): void {
    if (this.isLocalMode) {
      // Remove local replication
      if (confirm(`¿Está seguro que desea eliminar la replicación para la sucursal ${item.sucursal.nombre}?`)) {
        this.logicalReplicationService.removeReplication(item.sucursal.id)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (result) => {
              if (result?.success) {
                // Refresh the appropriate list
                if (isSubscription) {
                  this.loadSubscriptions();
                } else {
                  this.loadPublications();
                }
              }
              // The service already shows success/error messages
            }
          });
      }
    } else {
      // Remove remote publication or subscription
      if (!isSubscription) {
        // Drop remote publication
        if (confirm(`¿Está seguro que desea eliminar la publicación remota ${item.name}?`)) {
          const sucursalId = this.selectedSucursalControl.value;
          this.logicalReplicationService.dropRemotePublication(sucursalId, item.name)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (result) => {
                if (result?.success) {
                  this.loadPublications();
                }
                // The service already shows success/error messages
              }
            });
        }
      } else {
        this.snackBar.open('No se puede eliminar suscripciones remotas directamente', 'Cerrar', { duration: 3000 });
      }
    }
  }
  
  // New methods for remote publication management
  openCreateRemotePublicationDialog(): void {
    if (!this.selectedSucursalControl.value) {
      this.snackBar.open('Debe seleccionar una sucursal para crear una publicación remota', 'Cerrar', { duration: 3000 });
      return;
    }
    
    const dialogRef = this.dialog.open(EditRemotePublicationDialogComponent, {
      width: '550px',
      data: {
        branchSucursalId: this.selectedSucursalControl.value,
        isEdit: false
      }
    });
    
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.loadPublications(); // Refresh publications list
      }
    });
  }
  
  openEditRemotePublicationDialog(publication: LogicalReplication): void {
    const dialogRef = this.dialog.open(EditRemotePublicationDialogComponent, {
      width: '550px',
      data: {
        branchSucursalId: this.selectedSucursalControl.value,
        publication: publication,
        isEdit: true
      }
    });
    
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.loadPublications(); // Refresh publications list
      }
    });
  }
  
  // New methods for remote subscription management
  openCreateRemoteSubscriptionDialog(): void {
    if (!this.selectedSucursalControl.value) {
      this.snackBar.open('Debe seleccionar una sucursal para crear una suscripción remota', 'Cerrar', { duration: 3000 });
      return;
    }
    
    const dialogRef = this.dialog.open(EditRemoteSubscriptionDialogComponent, {
      width: '550px',
      data: {
        branchSucursalId: this.selectedSucursalControl.value,
        isEdit: false
      }
    });
    
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.loadSubscriptions(); // Refresh subscriptions list
      }
    });
  }
  
  openEditRemoteSubscriptionDialog(subscription: LogicalReplication): void {
    const dialogRef = this.dialog.open(EditRemoteSubscriptionDialogComponent, {
      width: '550px',
      data: {
        branchSucursalId: this.selectedSucursalControl.value,
        subscription: subscription,
        isEdit: true
      }
    });
    
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.loadSubscriptions(); // Refresh subscriptions list
      }
    });
  }
  
  handleSubPageEvent(event: PageEvent): void {
    this.subPageIndex = event.pageIndex;
    this.subPageSize = event.pageSize;
    this.loadSubscriptions();
  }
  
  handlePubPageEvent(event: PageEvent): void {
    this.pubPageIndex = event.pageIndex;
    this.pubPageSize = event.pageSize;
    this.loadPublications();
  }
  
  // Update the pre-calculated branch name when needed
  private updateSelectedBranchName(): void {
    if (!this.selectedSucursalControl.value) {
      this.selectedBranchName = 'Local';
    } else {
      const selectedBranch = this.sucursalList.find(s => s.id === this.selectedSucursalControl.value);
      this.selectedBranchName = selectedBranch ? selectedBranch.nombre : 'Sucursal Desconocida';
    }
  }

  // Keep this method for backward compatibility but don't use it in template
  getSelectedBranchName(): string {
    return this.selectedBranchName;
  }
} 