import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { LogicalReplication, ReplicationStatus } from './logical-replication.model';
import { ReplicationSubscriptionsGQL } from './graphql/replication-subscriptions-gql';
import { ReplicationPublicationsGQL } from './graphql/replication-publications-gql';
import { SetupReplicationGQL } from './graphql/setup-replication-gql';
import { SetupReplicationAdvancedGQL } from './graphql/setup-replication-advanced-gql';
import { SetupBranchReplicationGQL } from './graphql/setup-branch-replication-gql';
import { RemoveReplicationGQL } from './graphql/remove-replication-gql';
import { RemoveReplicationAdvancedGQL } from './graphql/remove-replication-advanced-gql';
import { RemoveBranchReplicationGQL } from './graphql/remove-branch-replication-gql';
import { ToggleReplicationGQL } from './graphql/toggle-replication-gql';
import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { SearchReplicationSubscriptionsGQL } from './graphql/search-replication-subscriptions-gql';
import { RemoteReplicationSubscriptionsGQL } from './graphql/remote-replication-subscriptions-gql';
import { RemoteReplicationPublicationsGQL } from './graphql/remote-replication-publications-gql';
import { SearchRemoteReplicationSubscriptionsGQL } from './graphql/search-remote-replication-subscriptions-gql';
import { ToggleRemoteSubscriptionGQL } from './graphql/toggle-remote-subscription-gql';
import { DropRemotePublicationGQL } from './graphql/drop-remote-publication-gql';
import { GenerateConnectionStringGQL } from './graphql/generate-connection-string-gql';
import { GenerateCentralConnectionStringGQL } from './graphql/generate-central-connection-string-gql';
import { 
  GenerateBranchPublicationNameGQL,
  GenerateBranchSubscriptionNameGQL,
  GenerateCentralToBranchPublicationNameGQL,
  GenerateCentralToBranchSubscriptionNameGQL
} from './graphql/generate-replication-names-gql';
import { CreateRemotePublicationGQL } from './graphql/create-remote-publication-gql';
import { CreateRemoteSubscriptionGQL } from './graphql/create-remote-subscription-gql';
import { EditRemotePublicationGQL } from './graphql/edit-remote-publication-gql';
import { EditRemoteSubscriptionGQL } from './graphql/edit-remote-subscription-gql';
import { RefreshSubscriptionGQL } from './graphql/refresh-subscription-gql';
import { RefreshAllSubscriptionsGQL } from './graphql/refresh-all-subscriptions-gql';
import { RefreshRemoteSubscriptionGQL } from './graphql/refresh-remote-subscription-gql';
import { RefreshAllRemoteSubscriptionsGQL } from './graphql/refresh-all-remote-subscriptions-gql';
import { SyncPublicationsWithReplicationTableGQL } from './graphql/sync-publications-with-replication-table-gql';
import { GetReplicationSetupStateGQL, ReplicationSetupState } from './graphql/get-replication-setup-state-gql';

@Injectable({
  providedIn: 'root'
})
export class LogicalReplicationService {

  constructor(
    // Local queries
    private replicationSubscriptionsGQL: ReplicationSubscriptionsGQL,
    private replicationPublicationsGQL: ReplicationPublicationsGQL,
    private searchReplicationSubscriptionsGQL: SearchReplicationSubscriptionsGQL,
    
    // Remote queries
    private remoteReplicationSubscriptionsGQL: RemoteReplicationSubscriptionsGQL,
    private remoteReplicationPublicationsGQL: RemoteReplicationPublicationsGQL,
    private searchRemoteReplicationSubscriptionsGQL: SearchRemoteReplicationSubscriptionsGQL,
    
    // Utility queries
    private getReplicationSetupStateGQL: GetReplicationSetupStateGQL,
    private generateConnectionStringGQL: GenerateConnectionStringGQL,
    private generateCentralConnectionStringGQL: GenerateCentralConnectionStringGQL,
    private generateBranchPublicationNameGQL: GenerateBranchPublicationNameGQL,
    private generateBranchSubscriptionNameGQL: GenerateBranchSubscriptionNameGQL,
    private generateCentralToBranchPublicationNameGQL: GenerateCentralToBranchPublicationNameGQL,
    private generateCentralToBranchSubscriptionNameGQL: GenerateCentralToBranchSubscriptionNameGQL,
    
    // Local mutations
    private setupReplicationGQL: SetupReplicationGQL,
    private setupReplicationAdvancedGQL: SetupReplicationAdvancedGQL,
    private setupBranchReplicationGQL: SetupBranchReplicationGQL,
    private removeReplicationGQL: RemoveReplicationGQL,
    private removeReplicationAdvancedGQL: RemoveReplicationAdvancedGQL,
    private removeBranchReplicationGQL: RemoveBranchReplicationGQL,
    private toggleReplicationGQL: ToggleReplicationGQL,
    
    // Remote mutations
    private toggleRemoteSubscriptionGQL: ToggleRemoteSubscriptionGQL,
    private dropRemotePublicationGQL: DropRemotePublicationGQL,
    private createRemotePublicationGQL: CreateRemotePublicationGQL,
    private createRemoteSubscriptionGQL: CreateRemoteSubscriptionGQL,
    private editRemotePublicationGQL: EditRemotePublicationGQL,
    private editRemoteSubscriptionGQL: EditRemoteSubscriptionGQL,
    
    // Refresh mutations
    private refreshSubscriptionGQL: RefreshSubscriptionGQL,
    private refreshAllSubscriptionsGQL: RefreshAllSubscriptionsGQL,
    private refreshRemoteSubscriptionGQL: RefreshRemoteSubscriptionGQL,
    private refreshAllRemoteSubscriptionsGQL: RefreshAllRemoteSubscriptionsGQL,
    private syncPublicationsWithReplicationTableGQL: SyncPublicationsWithReplicationTableGQL,

    private genericService: GenericCrudService,
    private notificacionSnackBar: NotificacionSnackbarService
  ) { }

  // LOCAL QUERIES

  /**
   * Get current replication setup state for a branch (what exists on central and filial).
   */
  getReplicationSetupState(sucursalId: number): Observable<ReplicationSetupState | null> {
    return this.genericService.onCustomQuery(
      this.getReplicationSetupStateGQL,
      { sucursalId: String(sucursalId) },
      true,
      undefined,
      true
    ).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get replication subscriptions with pagination
   * @param page Page number (0-based)
   * @param size Items per page
   */
  getReplicationSubscriptions(page: number = 0, size: number = 10): Observable<PageInfo<LogicalReplication>> {
    return this.genericService.onCustomQuery(
      this.replicationSubscriptionsGQL,
      { page, size });
  }

  /**
   * Get replication publications with pagination
   * @param page Page number (0-based)
   * @param size Items per page
   */
  getReplicationPublications(page: number = 0, size: number = 10): Observable<PageInfo<LogicalReplication>> {
    return this.genericService.onCustomQuery(
      this.replicationPublicationsGQL,
      { page, size });
  }

  /**
   * Search for replication subscriptions by name
   * @param query Search query
   * @param page Page number (0-based)
   * @param size Items per page
   */
  searchReplicationSubscriptions(query: string, page: number = 0, size: number = 10): Observable<PageInfo<LogicalReplication>> {
    return this.genericService.onCustomQuery(
      this.searchReplicationSubscriptionsGQL,
      { query, page, size });
  }

  // REMOTE QUERIES

  /**
   * Get replication subscriptions from a remote branch with pagination
   * @param sucursalId ID of the branch to query
   * @param page Page number (0-based)
   * @param size Items per page
   */
  getRemoteReplicationSubscriptions(sucursalId: number, page: number = 0, size: number = 10): Observable<PageInfo<LogicalReplication>> {
    return this.genericService.onCustomQuery(
      this.remoteReplicationSubscriptionsGQL,
      { sucursalId, page, size });
  }

  /**
   * Get replication publications from a remote branch with pagination
   * @param sucursalId ID of the branch to query
   * @param page Page number (0-based)
   * @param size Items per page
   */
  getRemoteReplicationPublications(sucursalId: number, page: number = 0, size: number = 10): Observable<PageInfo<LogicalReplication>> {
    return this.genericService.onCustomQuery(
      this.remoteReplicationPublicationsGQL,
      { sucursalId, page, size });
  }

  /**
   * Search for replication subscriptions by name on a remote branch
   * @param sucursalId ID of the branch to query
   * @param query Search query
   * @param page Page number (0-based)
   * @param size Items per page
   */
  searchRemoteReplicationSubscriptions(sucursalId: number, query: string, page: number = 0, size: number = 10): Observable<PageInfo<LogicalReplication>> {
    return this.genericService.onCustomQuery(
      this.searchRemoteReplicationSubscriptionsGQL,
      { sucursalId, query, page, size });
  }
  
  // UTILITY QUERIES
  
  /**
   * Generate a connection string
   * @param host Server hostname or IP
   * @param port Server port
   * @param dbName Database name
   * @param username Username
   * @param password Password
   */
  generateConnectionString(host: string, port: number, dbName: string, username: string, password: string): Observable<string> {
    return this.genericService.onCustomQuery(
      this.generateConnectionStringGQL,
      { host, port, dbName, username, password });
  }
  
  /**
   * Generate a connection string for the central server
   */
  generateCentralConnectionString(): Observable<string> {
    return this.genericService.onCustomQuery(
      this.generateCentralConnectionStringGQL,
      {});
  }
  
  /**
   * Generate a name for a branch publication
   * @param sucursalId ID of the branch
   */
  generateBranchPublicationName(sucursalId: number): Observable<string> {
    return this.genericService.onCustomQuery(
      this.generateBranchPublicationNameGQL,
      { sucursalId });
  }
  
  /**
   * Generate a name for a branch subscription
   * @param sucursalId ID of the branch
   */
  generateBranchSubscriptionName(sucursalId: number): Observable<string> {
    return this.genericService.onCustomQuery(
      this.generateBranchSubscriptionNameGQL,
      { sucursalId });
  }
  
  /**
   * Generate a name for a central-to-branch publication
   * @param sucursalId ID of the branch
   */
  generateCentralToBranchPublicationName(sucursalId: number): Observable<string> {
    return this.genericService.onCustomQuery(
      this.generateCentralToBranchPublicationNameGQL,
      { sucursalId });
  }
  
  /**
   * Generate a name for a central-to-branch subscription
   * @param sucursalId ID of the branch
   */
  generateCentralToBranchSubscriptionName(sucursalId: number): Observable<string> {
    return this.genericService.onCustomQuery(
      this.generateCentralToBranchSubscriptionNameGQL,
      { sucursalId });
  }

  // LOCAL MUTATIONS

  /**
   * Setup a new logical replication from central server to a branch
   */
  setupReplication(input: any): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.setupReplicationGQL,
      { input }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('REPLICACIÓN CONFIGURADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error setting up replication', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL CONFIGURAR REPLICACIÓN');
        return of({ success: false, message: error.message });
      })
    );
  }

  /**
   * Setup replication with granular control (target: SUBSCRIPTION | PUBLICATION | BOTH, scope: CENTRAL | FILIAL | BOTH)
   */
  setupReplicationAdvanced(sucursalId: number, target: string, scope: string): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.setupReplicationAdvancedGQL,
      { sucursalId: String(sucursalId), target, scope }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('REPLICACIÓN CONFIGURADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error in setupReplicationAdvanced', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL CONFIGURAR REPLICACIÓN');
        return of({ success: false, message: error?.message || 'Error desconocido' });
      })
    );
  }

  /**
   * Setup branch-side replication (to be called on branch server)
   */
  setupBranchReplication(sucursalId: number): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.setupBranchReplicationGQL,
      { sucursalId }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('REPLICACIÓN DE SUCURSAL CONFIGURADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error setting up branch replication', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL CONFIGURAR REPLICACIÓN DE SUCURSAL');
        return of({ success: false, message: error.message });
      })
    );
  }

  /**
   * Remove central server replication for a branch
   */
  removeReplication(sucursalId: number): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.removeReplicationGQL,
      { sucursalId }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('REPLICACIÓN ELIMINADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error removing replication', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL ELIMINAR REPLICACIÓN');
        return of({ success: false, message: error.message });
      })
    );
  }

  /**
   * Remove replication with granular control (target: SUBSCRIPTION | PUBLICATION | BOTH, scope: CENTRAL | FILIAL | BOTH)
   */
  removeReplicationAdvanced(sucursalId: number, target: string, scope: string): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.removeReplicationAdvancedGQL,
      { sucursalId: String(sucursalId), target, scope }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('ELIMINACIÓN COMPLETADA');
        }
      }),
      catchError(error => {
        console.error('Error in removeReplicationAdvanced', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL ELIMINAR REPLICACIÓN');
        return of({ success: false, message: error?.message || 'Error desconocido' });
      })
    );
  }

  /**
   * Remove branch-side replication (to be called on branch server)
   */
  removeBranchReplication(sucursalId: number): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.removeBranchReplicationGQL,
      { sucursalId }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('REPLICACIÓN DE SUCURSAL ELIMINADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error removing branch replication', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL ELIMINAR REPLICACIÓN DE SUCURSAL');
        return of({ success: false, message: error.message });
      })
    );
  }

  /**
   * Enable or disable a replication
   * @param sucursalId ID of the branch
   * @param enabled Whether to enable or disable
   * @param isSubscription Whether this is a subscription (true) or publication (false)
   */
  toggleReplication(sucursalId: number, enabled: boolean, isSubscription: boolean): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.toggleReplicationGQL,
      { sucursalId, enabled, isSubscription }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          const type = isSubscription ? 'suscripción' : 'publicación';
          this.notificacionSnackBar.openSucess(`LA ${type.toUpperCase()} HA SIDO ${enabled ? 'ACTIVADA' : 'DESACTIVADA'} CORRECTAMENTE`);
        }
      }),
      catchError(error => {
        console.error('Error toggling replication', error);
        const type = isSubscription ? 'suscripción' : 'publicación';
        this.notificacionSnackBar.openAlgoSalioMal(`ERROR AL ${enabled ? 'ACTIVAR' : 'DESACTIVAR'} LA ${type.toUpperCase()}`);
        return of({ success: false, message: error.message });
      })
    );
  }

  // REMOTE MUTATIONS

  /**
   * Toggle a subscription on a remote branch
   * @param branchSucursalId ID of the branch
   * @param subscriptionName Name of the subscription
   * @param enabled Whether to enable or disable
   */
  toggleRemoteSubscription(branchSucursalId: number, subscriptionName: string, enabled: boolean): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.toggleRemoteSubscriptionGQL,
      { branchSucursalId, subscriptionName, enabled }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess(`LA SUSCRIPCIÓN REMOTA HA SIDO ${enabled ? 'ACTIVADA' : 'DESACTIVADA'} CORRECTAMENTE`);
        }
      }),
      catchError(error => {
        console.error('Error toggling remote subscription', error);
        this.notificacionSnackBar.openAlgoSalioMal(`ERROR AL ${enabled ? 'ACTIVAR' : 'DESACTIVAR'} LA SUSCRIPCIÓN REMOTA`);
        return of({ success: false, message: error.message });
      })
    );
  }

  /**
   * Drop a publication on a remote branch
   * @param branchSucursalId ID of the branch
   * @param publicationName Name of the publication
   */
  dropRemotePublication(branchSucursalId: number, publicationName: string): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.dropRemotePublicationGQL,
      { branchSucursalId, publicationName }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('LA PUBLICACIÓN REMOTA HA SIDO ELIMINADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error dropping remote publication', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL ELIMINAR LA PUBLICACIÓN REMOTA');
        return of({ success: false, message: error.message });
      })
    );
  }
  
  /**
   * Create a publication on a remote branch
   * @param branchSucursalId ID of the branch
   * @param publicationName Name of the publication
   * @param tables Tables to include in the publication
   */
  createRemotePublication(branchSucursalId: number, publicationName: string, tables: string[]): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.createRemotePublicationGQL,
      { branchSucursalId, publicationName, tables }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('PUBLICACIÓN REMOTA CREADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error creating remote publication', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL CREAR PUBLICACIÓN REMOTA');
        return of({ success: false, message: error.message });
      })
    );
  }
  
  /**
   * Create a subscription on a remote branch
   * @param branchSucursalId ID of the branch
   * @param subscriptionName Name of the subscription
   * @param connectionString Connection string to the source database
   * @param publicationName Name of the publication to subscribe to
   */
  createRemoteSubscription(branchSucursalId: number, subscriptionName: string, connectionString: string, publicationName: string): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.createRemoteSubscriptionGQL,
      { branchSucursalId, subscriptionName, connectionString, publicationName }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('SUSCRIPCIÓN REMOTA CREADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error creating remote subscription', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL CREAR SUSCRIPCIÓN REMOTA');
        return of({ success: false, message: error.message });
      })
    );
  }
  
  /**
   * Edit a publication on a remote branch
   * @param branchSucursalId ID of the branch
   * @param publicationName Name of the publication
   * @param tables Tables to include in the publication
   */
  editRemotePublication(branchSucursalId: number, publicationName: string, tables: string[]): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.editRemotePublicationGQL,
      { branchSucursalId, publicationName, tables }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('PUBLICACIÓN REMOTA ACTUALIZADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error editing remote publication', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL ACTUALIZAR PUBLICACIÓN REMOTA');
        return of({ success: false, message: error.message });
      })
    );
  }
  
  /**
   * Edit a subscription on a remote branch
   * @param branchSucursalId ID of the branch
   * @param subscriptionName Name of the subscription
   * @param connectionString Connection string to the source database (optional if not changing)
   * @param publicationName Name of the publication to subscribe to (optional if not changing)
   */
  editRemoteSubscription(branchSucursalId: number, subscriptionName: string, connectionString?: string, publicationName?: string): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.editRemoteSubscriptionGQL,
      { branchSucursalId, subscriptionName, connectionString, publicationName }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('SUSCRIPCIÓN REMOTA ACTUALIZADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error editing remote subscription', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL ACTUALIZAR SUSCRIPCIÓN REMOTA');
        return of({ success: false, message: error.message });
      })
    );
  }

  // REFRESH MUTATIONS

  /**
   * Refresh a specific subscription (local)
   * @param subscriptionName Name of the subscription to refresh
   */
  refreshSubscription(subscriptionName: string): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.refreshSubscriptionGQL,
      { subscriptionName }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('SUSCRIPCIÓN REFRESCADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error refreshing subscription', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL REFRESCAR SUSCRIPCIÓN');
        return of({ success: false, message: error.message });
      })
    );
  }

  /**
   * Sync existing publications with replication_table (add missing tables on central and all filiales).
   * Only meaningful when called from central server.
   */
  syncPublicationsWithReplicationTable(): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.syncPublicationsWithReplicationTableGQL,
      {}
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('PUBLICACIONES SINCRONIZADAS CON REPLICATION_TABLE');
        }
      }),
      catchError(error => {
        console.error('Error syncing publications', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL SINCRONIZAR PUBLICACIONES');
        return of({ success: false, message: error.message });
      })
    );
  }

  /**
   * Refresh all subscriptions (local)
   */
  refreshAllSubscriptions(): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.refreshAllSubscriptionsGQL,
      {}
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('TODAS LAS SUSCRIPCIONES REFRESCADAS CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error refreshing all subscriptions', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL REFRESCAR TODAS LAS SUSCRIPCIONES');
        return of({ success: false, message: error.message });
      })
    );
  }

  /**
   * Refresh a specific subscription on a remote branch
   * @param branchSucursalId ID of the branch
   * @param subscriptionName Name of the subscription to refresh
   */
  refreshRemoteSubscription(branchSucursalId: number, subscriptionName: string): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.refreshRemoteSubscriptionGQL,
      { branchSucursalId, subscriptionName }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('SUSCRIPCIÓN REMOTA REFRESCADA CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error refreshing remote subscription', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL REFRESCAR SUSCRIPCIÓN REMOTA');
        return of({ success: false, message: error.message });
      })
    );
  }

  /**
   * Refresh all subscriptions on a remote branch
   * @param branchSucursalId ID of the branch
   */
  refreshAllRemoteSubscriptions(branchSucursalId: number): Observable<ReplicationStatus> {
    return this.genericService.onCustomMutation(
      this.refreshAllRemoteSubscriptionsGQL,
      { branchSucursalId }
    ).pipe(
      tap(status => {
        if (status && status.success) {
          this.notificacionSnackBar.openSucess('TODAS LAS SUSCRIPCIONES REMOTAS REFRESCADAS CORRECTAMENTE');
        }
      }),
      catchError(error => {
        console.error('Error refreshing all remote subscriptions', error);
        this.notificacionSnackBar.openAlgoSalioMal('ERROR AL REFRESCAR TODAS LAS SUSCRIPCIONES REMOTAS');
        return of({ success: false, message: error.message });
      })
    );
  }
} 