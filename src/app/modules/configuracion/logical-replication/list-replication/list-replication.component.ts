import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { timer } from 'rxjs';
import { LogicalReplication, ReplicationStatus } from '../logical-replication.model';
import { LogicalReplicationService } from '../logical-replication.service';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { EditRemotePublicationDialogComponent } from '../edit-remote-publication-dialog/edit-remote-publication-dialog.component';
import { EditRemoteSubscriptionDialogComponent } from '../edit-remote-subscription-dialog/edit-remote-subscription-dialog.component';
import { SetupReplicationDialogComponent } from '../setup-replication-dialog/setup-replication-dialog.component';
import { RemoveReplicationDialogComponent, RemoveReplicationDialogData } from '../remove-replication-dialog/remove-replication-dialog.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { RECARGA_TRAS_CORTE_MS } from '../../../../commons/core/utils/graphqlErrorUtils';

@UntilDestroy({ checkProperties: true })
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
  
  // Suscripciones y publicaciones: locales o de la sucursal elegida, paginadas en el central (#772).
  subs = new PaginacionLista<LogicalReplication>({
    cargar: (page, size) => this.isLocalMode
      ? this.logicalReplicationService.getReplicationSubscriptions(page, size)
      : this.logicalReplicationService.getRemoteReplicationSubscriptions(this.selectedSucursalControl.value, page, size),
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
    alFallar: () => this.notificacionSnackBar.openAlgoSalioMal(
      this.isLocalMode ? 'ERROR AL CARGAR SUSCRIPCIONES' : 'ERROR AL CARGAR SUSCRIPCIONES REMOTAS'),
  });
  pubs = new PaginacionLista<LogicalReplication>({
    cargar: (page, size) => this.isLocalMode
      ? this.logicalReplicationService.getReplicationPublications(page, size)
      : this.logicalReplicationService.getRemoteReplicationPublications(this.selectedSucursalControl.value, page, size),
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
    alFallar: () => this.notificacionSnackBar.openAlgoSalioMal(
      this.isLocalMode ? 'ERROR AL CARGAR PUBLICACIONES' : 'ERROR AL CARGAR PUBLICACIONES REMOTAS'),
  });
  isSyncingPublications = false;

  // Common
  displayedColumns: string[] = ['name', 'sucursal', 'enabled', 'actions'];
  
  constructor(
    private logicalReplicationService: LogicalReplicationService,
    private sucursalService: SucursalService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionSnackBar: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    // Load branches for remote selection
    this.loadSucursales();
    
    this.subs.filtrar();
    this.pubs.filtrar();
    
    // Subscribe to branch selection changes
    this.selectedSucursalControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      this.isLocalMode = value === null;
      
      // Update the display name for the selected branch
      this.updateSelectedBranchName();
      
      // Otra sucursal: las dos listas vuelven a la página 1.
      this.subs.filtrar();
      this.pubs.filtrar();
    });
  }
  
  loadSucursales(): void {
    this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this)).subscribe(sucursales => {
      this.sucursalList = sucursales || [];
      this.updateSelectedBranchName();
    });
  }

  /** Repite la página actual de suscripciones. */
  loadSubscriptions(): void {
    this.subs.recargar();
  }

  /** Repite la página actual de publicaciones. */
  loadPublications(): void {
    this.pubs.recargar();
  }

  setupReplication(): void {
    const dialogRef = this.dialog.open(SetupReplicationDialogComponent, {
      width: '50vw',
      height: '60vh'
    });

    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.loadSubscriptions();
        this.loadPublications();
      }
    });
  }

  toggleReplication(item: LogicalReplication, isSubscription: boolean): void {
    const newStatus = !item.enabled;
    
    if (this.isLocalMode) {
      // Toggle local replication
      this.logicalReplicationService.toggleReplication(item.sucursal.id, newStatus, isSubscription)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (result) => {
            this.recargarSiSinConfirmar(result);
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
              this.recargarSiSinConfirmar(result);
              if (result?.success) {
                // Update the item in the local list
                item.enabled = newStatus;
              }
              // The service already shows success/error messages
            }
          });
      } else {
        this.notificacionSnackBar.openWarn('NO SE PUEDE ALTERNAR PUBLICACIONES REMOTAS DIRECTAMENTE');
      }
    }
  }

  removeReplication(item: LogicalReplication, isSubscription: boolean): void {
    const sucursalId = this.isLocalMode ? item.sucursal?.id : this.selectedSucursalControl.value;
    const sucursalNombre = this.isLocalMode ? (item.sucursal?.nombre ?? '') : this.selectedBranchName;
    if (sucursalId == null) {
      return;
    }
    const origin = isSubscription ? 'SUBSCRIPTION' : 'PUBLICATION';
    const dialogRef = this.dialog.open(RemoveReplicationDialogComponent, {
      width: '480px',
      data: { sucursalId, sucursalNombre, origin } as RemoveReplicationDialogData
    });
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(result => {
      if (result) {
        this.loadSubscriptions();
        this.loadPublications();
      }
    });
  }
  
  // New methods for remote publication management
  openCreateRemotePublicationDialog(): void {
    if (!this.selectedSucursalControl.value) {
      this.notificacionSnackBar.openWarn('DEBE SELECCIONAR UNA SUCURSAL PARA CREAR UNA PUBLICACIÓN REMOTA');
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
      this.notificacionSnackBar.openWarn('DEBE SELECCIONAR UNA SUCURSAL PARA CREAR UNA SUSCRIPCIÓN REMOTA');
      return;
    }
    
    const dialogRef = this.dialog.open(EditRemoteSubscriptionDialogComponent, {
      width: '600px',
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
      width: '600px',
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

  /**
   * Refresh a single subscription
   * @param item The subscription to refresh
   */
  refreshSubscription(item: LogicalReplication): void {
    if (this.isLocalMode) {
      // Refresh local subscription
      this.logicalReplicationService.refreshSubscription(item.name)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (result) => {
            this.recargarSiSinConfirmar(result);
            if (result?.success) {
              this.loadSubscriptions();
            }
            // The service already shows success/error messages
          }
        });
    } else {
      // Refresh remote subscription
      const sucursalId = this.selectedSucursalControl.value;
      this.logicalReplicationService.refreshRemoteSubscription(sucursalId, item.name)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (result) => {
            this.recargarSiSinConfirmar(result);
            if (result?.success) {
              this.loadSubscriptions();
            }
            // The service already shows success/error messages
          }
        });
    }
  }

  /**
   * Refresh all subscriptions
   */
  refreshAllSubscriptions(): void {
    if (this.isLocalMode) {
      // Refresh all local subscriptions
      this.logicalReplicationService.refreshAllSubscriptions()
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (result) => {
            this.recargarSiSinConfirmar(result);
            if (result?.success) {
              this.loadSubscriptions();
            }
            // The service already shows success/error messages
          }
        });
    } else {
      // Refresh all remote subscriptions
      const sucursalId = this.selectedSucursalControl.value;
      this.logicalReplicationService.refreshAllRemoteSubscriptions(sucursalId)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (result) => {
            this.recargarSiSinConfirmar(result);
            if (result?.success) {
              this.loadSubscriptions();
            }
            // The service already shows success/error messages
          }
        });
    }
  }

  /**
   * Sync publications with replication_table (add missing tables on central and all filiales).
   * Only available in local mode (central server).
   */
  syncPublicationsWithReplicationTable(): void {
    if (!this.isLocalMode) return;
    this.isSyncingPublications = true;
    this.logicalReplicationService.syncPublicationsWithReplicationTable()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          this.isSyncingPublications = false;
          this.recargarSiSinConfirmar(result);
          if (result?.success) {
            this.loadPublications();
            this.loadSubscriptions();
          }
          // Service already shows success/error snackbar; full log is in result.message if needed
        },
        error: () => {
          this.isSyncingPublications = false;
        }
      });
  }

  /**
   * Sin respuesta, la operación pudo aplicarse: la lista se recarga cuando el central tuvo tiempo de terminarla, así
   * muestra el estado real antes de que se repita (#501).
   */
  private recargarSiSinConfirmar(result: ReplicationStatus): void {
    if (result?.sinConfirmar) {
      timer(RECARGA_TRAS_CORTE_MS).pipe(untilDestroyed(this)).subscribe(() => {
        this.loadSubscriptions();
        this.loadPublications();
      });
    }
  }
}
