import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { LogicalReplication, ReplicationStatus } from './logical-replication.model';
import { ReplicationSubscriptionsGQL } from './graphql/replication-subscriptions-gql';
import { ReplicationPublicationsGQL } from './graphql/replication-publications-gql';
import { SetupReplicationGQL } from './graphql/setup-replication-gql';
import { SetupBranchReplicationGQL } from './graphql/setup-branch-replication-gql';
import { RemoveReplicationGQL } from './graphql/remove-replication-gql';
import { RemoveBranchReplicationGQL } from './graphql/remove-branch-replication-gql';
import { ToggleReplicationGQL } from './graphql/toggle-replication-gql';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';
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
    private generateConnectionStringGQL: GenerateConnectionStringGQL,
    private generateCentralConnectionStringGQL: GenerateCentralConnectionStringGQL,
    private generateBranchPublicationNameGQL: GenerateBranchPublicationNameGQL,
    private generateBranchSubscriptionNameGQL: GenerateBranchSubscriptionNameGQL,
    private generateCentralToBranchPublicationNameGQL: GenerateCentralToBranchPublicationNameGQL,
    private generateCentralToBranchSubscriptionNameGQL: GenerateCentralToBranchSubscriptionNameGQL,
    
    // Local mutations
    private setupReplicationGQL: SetupReplicationGQL,
    private setupBranchReplicationGQL: SetupBranchReplicationGQL,
    private removeReplicationGQL: RemoveReplicationGQL,
    private removeBranchReplicationGQL: RemoveBranchReplicationGQL,
    private toggleReplicationGQL: ToggleReplicationGQL,
    
    // Remote mutations
    private toggleRemoteSubscriptionGQL: ToggleRemoteSubscriptionGQL,
    private dropRemotePublicationGQL: DropRemotePublicationGQL,
    private createRemotePublicationGQL: CreateRemotePublicationGQL,
    private createRemoteSubscriptionGQL: CreateRemoteSubscriptionGQL,
    private editRemotePublicationGQL: EditRemotePublicationGQL,
    private editRemoteSubscriptionGQL: EditRemoteSubscriptionGQL,
    
    private snackBar: MatSnackBar,
    private genericService: GenericCrudService
  ) { }

  // LOCAL QUERIES

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
          this.snackBar.open('Replicación configurada correctamente', 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error setting up replication', error);
        this.snackBar.open('Error al configurar replicación', 'Cerrar', { duration: 3000 });
        return of({ success: false, message: error.message });
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
          this.snackBar.open('Replicación de sucursal configurada correctamente', 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error setting up branch replication', error);
        this.snackBar.open('Error al configurar replicación de sucursal', 'Cerrar', { duration: 3000 });
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
          this.snackBar.open('Replicación eliminada correctamente', 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error removing replication', error);
        this.snackBar.open('Error al eliminar replicación', 'Cerrar', { duration: 3000 });
        return of({ success: false, message: error.message });
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
          this.snackBar.open('Replicación de sucursal eliminada correctamente', 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error removing branch replication', error);
        this.snackBar.open('Error al eliminar replicación de sucursal', 'Cerrar', { duration: 3000 });
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
          this.snackBar.open(`La ${type} ha sido ${enabled ? 'activada' : 'desactivada'} correctamente`, 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error toggling replication', error);
        const type = isSubscription ? 'suscripción' : 'publicación';
        this.snackBar.open(`Error al ${enabled ? 'activar' : 'desactivar'} la ${type}`, 'Cerrar', { duration: 3000 });
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
          this.snackBar.open(`La suscripción remota ha sido ${enabled ? 'activada' : 'desactivada'} correctamente`, 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error toggling remote subscription', error);
        this.snackBar.open(`Error al ${enabled ? 'activar' : 'desactivar'} la suscripción remota`, 'Cerrar', { duration: 3000 });
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
          this.snackBar.open(`La publicación remota ha sido eliminada correctamente`, 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error dropping remote publication', error);
        this.snackBar.open(`Error al eliminar la publicación remota`, 'Cerrar', { duration: 3000 });
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
          this.snackBar.open(`Publicación remota creada correctamente`, 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error creating remote publication', error);
        this.snackBar.open(`Error al crear publicación remota`, 'Cerrar', { duration: 3000 });
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
          this.snackBar.open(`Suscripción remota creada correctamente`, 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error creating remote subscription', error);
        this.snackBar.open(`Error al crear suscripción remota`, 'Cerrar', { duration: 3000 });
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
          this.snackBar.open(`Publicación remota actualizada correctamente`, 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error editing remote publication', error);
        this.snackBar.open(`Error al actualizar publicación remota`, 'Cerrar', { duration: 3000 });
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
          this.snackBar.open(`Suscripción remota actualizada correctamente`, 'Cerrar', { duration: 3000 });
        }
      }),
      catchError(error => {
        console.error('Error editing remote subscription', error);
        this.snackBar.open(`Error al actualizar suscripción remota`, 'Cerrar', { duration: 3000 });
        return of({ success: false, message: error.message });
      })
    );
  }
} 