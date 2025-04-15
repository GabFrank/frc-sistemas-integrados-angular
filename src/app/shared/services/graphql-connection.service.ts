import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { 
  ApolloClientOptions, 
  ApolloLink, 
  InMemoryCache, 
  split 
} from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition, Observable } from '@apollo/client/utilities';
import { HttpLink } from 'apollo-angular/http';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfiguracionService, ConfiguracionSistema } from './configuracion.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../notificacion-snackbar.service';

// Connection status subject that can be subscribed to by components
export const connectionStatusSub = new BehaviorSubject<boolean>(null);
export const errorObs = new BehaviorSubject<any>(null);

@Injectable({
  providedIn: 'root'
})
export class GraphqlConnectionService {
  private wsClient: SubscriptionClient;
  private wsClient2: SubscriptionClient;
  private retryCount = 0;
  private maxRetries = 5;
  private isDev = !environment.production;

  constructor(
    private configService: ConfiguracionService,
    private notificationService: NotificacionSnackbarService
  ) {
    this.initialize();
  }

  /**
   * Initializes class variables that depend on environment
   */
  private initialize(): void {
    // Check if environment has the production flag
    try {
      this.isDev = environment && !environment.production;
    } catch (e) {
      console.warn('Error accessing environment variables, assuming development mode', e);
      this.isDev = true;
    }
    
    // Default retries and connection settings
    this.maxRetries = 5;
    this.retryCount = 0;
  }

  /**
   * Creates Apollo Client options with proper configuration validation
   */
  createApolloOptions(httpLink: HttpLink): ApolloClientOptions<any> {
    // Get configuration
    const config = this.configService.getConfig();
    
    // Create the links
    const link = this.createLink(httpLink, config);
    
    return {
      link,
      cache: new InMemoryCache(),
    };
  }

  /**
   * Validates the configuration for WebSocket and HTTP connections
   * @param config The configuration to validate
   * @returns True if configuration is valid, false otherwise
   */
  private isValidConfig(config: ConfiguracionSistema): boolean {
    // Check if required fields are present and valid
    const isValid = !!(
      config && 
      config.serverIp && 
      config.serverPort && 
      config.serverIp !== 'undefined' && 
      config.serverPort !== 'undefined'
    );
    
    // In development mode, log warnings but return true to allow operation with defaults
    if (!isValid && this.isDev) {
      console.warn('Invalid GraphQL configuration. Using development defaults.');
      return true;
    }
    
    if (!isValid) {
      console.error('Invalid GraphQL configuration. Connection will not be established.');
      this.notificationService.notification$.next({
        texto: "Configuración de servidor inválida. Conexión no disponible.",
        color: NotificacionColor.warn,
        duracion: 5
      });
    }
    
    return isValid;
  }

  /**
   * Creates the Apollo Link with WebSocket support
   */
  private createLink(httpLink: HttpLink, config: ConfiguracionSistema): ApolloLink {
    if (!this.isValidConfig(config)) {
      // Return a dummy link that will not actually connect
      return new ApolloLink(operation => {
        return new Observable(observer => {
          observer.error(new Error('No valid configuration found for GraphQL connection.'));
        });
      });
    }
    
    // Use configuration or development defaults
    const serverIp = config.serverIp || (this.isDev ? 'localhost' : null);
    const serverPort = config.serverPort || (this.isDev ? '8081' : null);
    const serverCentralIp = config.serverCentralIp || (this.isDev ? 'localhost' : null);
    const serverCentralPort = config.serverCentralPort || (this.isDev ? '8081' : null);
    
    // Create HTTP URLs
    const url = `http://${serverIp}:${serverPort}/graphql`;
    const url2 = `http://${serverCentralIp}:${serverCentralPort}/graphql`;
    
    // Create WebSocket URLs
    const wUri = `ws://${serverIp}:${serverPort}/subscriptions`;
    const wUri2 = `ws://${serverCentralIp}:${serverCentralPort}/subscriptions`;
    
    // Create the context for basic authentication
    const basic = setContext((operation, context) => ({}));
    
    // Create the context for token-based authentication
    const auth = setContext((operation, context) => {
      const token = localStorage.getItem("token");
      if (token === null) {
        return {};
      } else {
        return {
          headers: {
            Authorization: `Token ${token}`,
          },
        };
      }
    });

    // Error handling link
    const errorLink = onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          );
        });
      }

      if (networkError) {
        console.error(`[Network error]: ${networkError}`);
        // Handle the network error here
        errorObs.next(networkError);
      }
    });
    
    // Create an abortable link
    const abortableLink = this.createAbortableLink();
    
    // Create an HTTP link for primary server
    const http = ApolloLink.from([
      basic,
      auth,
      httpLink.create({
        uri: url,
      }),
    ]);
    
    // Create an HTTP link for central server
    const http2 = ApolloLink.from([
      basic,
      auth,
      httpLink.create({
        uri: url2,
      }),
    ]);
    
    // Create WebSocket clients with proper connection handling
    this.setupWebSocketClients(wUri, wUri2);
    
    // Create WebSocket links
    const ws = new WebSocketLink(this.wsClient);
    const ws2 = new WebSocketLink(this.wsClient2);
    
    // Combine links based on operation type
    return abortableLink.concat(
      errorLink.concat(
        split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === "OperationDefinition" &&
              definition.operation === "subscription"
            );
          },
          ApolloLink.split(
            (operation) => operation.getContext().clientName === "servidor",
            ws2,
            ws
          ),
          ApolloLink.split(
            (operation) => operation.getContext().clientName === "servidor",
            http2,
            http
          )
        )
      )
    );
  }
  
  /**
   * Create an abortable link for better request management
   */
  private createAbortableLink(): ApolloLink {
    return new ApolloLink((operation, forward) => {
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Set the signal in the operation context
      operation.setContext({ fetchOptions: { signal } });
      
      return new Observable((observer) => {
        const subscription = forward(operation).subscribe({
          next: (result) => {
            observer.next(result);
          },
          error: (error) => {
            observer.error(error);
          },
          complete: () => {
            observer.complete();
          },
        });
        
        return () => {
          controller.abort();
          subscription.unsubscribe();
        };
      });
    });
  }
  
  /**
   * Set up WebSocket clients with retry logic
   */
  private setupWebSocketClients(wUri: string, wUri2: string): void {
    // Primary WebSocket client
    this.wsClient = new SubscriptionClient(wUri, {
      reconnect: true,
      connectionCallback: (error) => {
        if (error) {
          console.error('WebSocket connection error:', error);
          this.retryCount++;
          if (this.retryCount === this.maxRetries) {
            this.notificationService.notification$.next({
              texto: "PROBLEMAS DE CONEXIÓN CON EL SERVIDOR. INTENTANDO RECONECTAR...",
              color: NotificacionColor.danger,
              duracion: 6,
            });
          }
        } else {
          this.retryCount = 0;
        }
      }
    });
    
    // Central server WebSocket client
    this.wsClient2 = new SubscriptionClient(wUri2, {
      reconnect: true,
      lazy: true,
    });
    
    // Connection event handlers
    this.wsClient.onConnected(() => {
      connectionStatusSub.next(true);
      console.log("WebSocket connected");
    });
    
    this.wsClient.onDisconnected(() => {
      if (connectionStatusSub.value != false) {
        connectionStatusSub.next(false);
      }
      console.log("WebSocket disconnected");
    });
    
    this.wsClient.onReconnected(() => {
      connectionStatusSub.next(true);
      console.log("WebSocket reconnected");
      this.notificationService.notification$.next({
        texto: "¡Conexión restablecida!",
        color: NotificacionColor.success,
        duracion: 3,
      });
    });
    
    this.wsClient.onReconnecting(() => {
      console.log(`WebSocket reconnecting... Attempt ${this.retryCount}`);
      
      // Show reconnection message periodically but not on every attempt
      if (this.retryCount % 5 === 0 && this.retryCount > 0) {
        this.notificationService.notification$.next({
          texto: `RECONECTANDO AL SERVIDOR... INTENTANDO RESTABLECER CONEXIÓN`,
          color: NotificacionColor.warn,
          duracion: 3,
        });
      }
    });
  }
  
  /**
   * Manually attempt to reconnect WebSockets
   * Can be called after configuration changes
   */
  reconnectWebSockets(): void {
    // Reset retry count when manually reconnecting
    this.retryCount = 0;
    
    if (this.wsClient) {
      this.wsClient.close(false);
    }
    
    if (this.wsClient2) {
      this.wsClient2.close(false);
    }
    
    // Get updated configuration
    const config = this.configService.getConfig();
    
    if (this.isValidConfig(config)) {
      const serverIp = config.serverIp;
      const serverPort = config.serverPort;
      const serverCentralIp = config.serverCentralIp;
      const serverCentralPort = config.serverCentralPort;
      
      const wUri = `ws://${serverIp}:${serverPort}/subscriptions`;
      const wUri2 = `ws://${serverCentralIp}:${serverCentralPort}/subscriptions`;
      
      this.setupWebSocketClients(wUri, wUri2);
      
      this.notificationService.notification$.next({
        texto: "Intentando reconexión con la nueva configuración...",
        color: NotificacionColor.info,
        duracion: 3,
      });
    }
  }
} 