import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { LogicalReplication, ReplicationStatus } from './logical-replication.model';
import { ReplicationSubscriptionsGQL } from './graphql/replication-subscriptions-gql';
import { ReplicationPublicationsGQL } from './graphql/replication-publications-gql';
import { SetupReplicationAdvancedGQL } from './graphql/setup-replication-advanced-gql';
import { RemoveReplicationAdvancedGQL } from './graphql/remove-replication-advanced-gql';
import { ToggleReplicationGQL } from './graphql/toggle-replication-gql';
import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { SearchReplicationSubscriptionsGQL } from './graphql/search-replication-subscriptions-gql';
import { RemoteReplicationSubscriptionsGQL } from './graphql/remote-replication-subscriptions-gql';
import { RemoteReplicationPublicationsGQL } from './graphql/remote-replication-publications-gql';
import { SearchRemoteReplicationSubscriptionsGQL } from './graphql/search-remote-replication-subscriptions-gql';
import { ToggleRemoteSubscriptionGQL } from './graphql/toggle-remote-subscription-gql';
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
import { erroresDeRechazo, motivoDelRechazo } from '../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../shared/services/timeout-link';

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
    private setupReplicationAdvancedGQL: SetupReplicationAdvancedGQL,
    private removeReplicationAdvancedGQL: RemoveReplicationAdvancedGQL,
    private toggleReplicationGQL: ToggleReplicationGQL,
    
    // Remote mutations
    private toggleRemoteSubscriptionGQL: ToggleRemoteSubscriptionGQL,
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
        // En un rechazo el genérico ya mostró el motivo: queda en el log del diálogo, sin otro aviso (#488)
        if (erroresDeRechazo(error) != null) {
          return of({ success: false, message: motivoDelRechazo(error) ?? 'El servidor rechazó la configuración.' });
        }
        // Sin respuesta: es una operación larga y pudo seguir aplicándose. El corte por tiempo ya lo avisó el link
        const texto = 'No se pudo confirmar si se configuró la replicación: es una operación larga, revisá el estado antes de repetir.';
        if (!esTimeoutDeLink(error)) {
          this.notificacionSnackBar.openWarn(texto, 8);
        }
        return of({ success: false, message: texto, sinConfirmar: true });
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
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se eliminó la replicación: revisá el estado antes de repetir.'))
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
        } else {
          this.avisarFallaInformada(status, `No se pudo ${enabled ? 'activar' : 'desactivar'} la ${isSubscription ? 'suscripción' : 'publicación'}.`);
        }
      }),
      catchError(error => this.estadoTrasError(error, `No se pudo confirmar si se ${enabled ? 'activó' : 'desactivó'} la ${isSubscription ? 'suscripción' : 'publicación'}: revisá el estado antes de repetir. La lista se actualiza en unos segundos.`))
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
        } else {
          this.avisarFallaInformada(status, `No se pudo ${enabled ? 'activar' : 'desactivar'} la suscripción remota.`);
        }
      }),
      catchError(error => this.estadoTrasError(error, `No se pudo confirmar si se ${enabled ? 'activó' : 'desactivó'} la suscripción remota: revisá el estado antes de repetir. La lista se actualiza en unos segundos.`))
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
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se creó la publicación remota. Es seguro volver a guardarla.'))
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
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se creó la suscripción remota. Es seguro volver a guardarla.'))
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
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se actualizó la publicación remota: puede haber quedado a medias. Volvé a guardarla para completarla.'))
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
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se actualizó la suscripción remota: puede haber quedado a medias o desactivada. Volvé a guardarla para completarla.'))
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
        } else {
          this.avisarFallaInformada(status, 'No se pudo refrescar la suscripción.');
        }
      }),
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se refrescó la suscripción: revisá el estado antes de repetir. La lista se actualiza en unos segundos.'))
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
        } else {
          this.avisarFallaInformada(status, 'No se pudieron sincronizar las publicaciones.');
        }
      }),
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se sincronizaron las publicaciones: revisá el estado antes de repetir. La lista se actualiza en unos segundos.'))
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
        } else {
          this.avisarFallaInformada(status, 'No se pudieron refrescar todas las suscripciones.');
        }
      }),
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se refrescaron las suscripciones: revisá el estado antes de repetir. La lista se actualiza en unos segundos.'))
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
        } else {
          this.avisarFallaInformada(status, 'No se pudo refrescar la suscripción remota.');
        }
      }),
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se refrescó la suscripción remota: revisá el estado antes de repetir. La lista se actualiza en unos segundos.'))
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
        } else {
          this.avisarFallaInformada(status, 'No se pudieron refrescar todas las suscripciones remotas.');
        }
      }),
      catchError(error => this.estadoTrasError(error, 'No se pudo confirmar si se refrescaron las suscripciones remotas: revisá el estado antes de repetir. La lista se actualiza en unos segundos.'))
    );
  }

  /**
   * Resultado de una mutation que falló (#501). En un rechazo el genérico ya mostró el motivo y no se aplicó nada: sin
   * otro aviso. Sin respuesta pudo aplicarse: se avisa `textoSinRespuesta` (salvo el corte por tiempo, que ya avisó el
   * link) y el resultado lleva `sinConfirmar` para que la pantalla recargue.
   */
  private estadoTrasError(error: any, textoSinRespuesta: string): Observable<ReplicationStatus> {
    console.error('Error en una mutation de replicación', error);
    if (erroresDeRechazo(error) != null) {
      return of({ success: false, message: motivoDelRechazo(error) ?? 'El servidor rechazó la operación.' });
    }
    if (!esTimeoutDeLink(error)) {
      this.notificacionSnackBar.openWarn(textoSinRespuesta, 8);
    }
    return of({ success: false, message: textoSinRespuesta, sinConfirmar: true });
  }

  /** El central respondió `success: false` con su mensaje: en la lista nadie lo mostraba (#501). */
  private avisarFallaInformada(status: ReplicationStatus, textoPorDefecto: string): void {
    if (status) {
      this.notificacionSnackBar.openWarn(status.message || textoPorDefecto, 6);
    }
  }
}
