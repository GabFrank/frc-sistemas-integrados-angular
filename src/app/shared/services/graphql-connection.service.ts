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

// Connection status subjects that can be subscribed to by components
export const connectionStatusSub = new BehaviorSubject<boolean>(null);
export const cloudConnectionStatusSub = new BehaviorSubject<boolean>(null);
export const errorObs = new BehaviorSubject<any>(null);

@Injectable({
  providedIn: 'root'
})
export class GraphqlConnectionService {
  private wsClient: SubscriptionClient;
  private wsClient2: SubscriptionClient;
  private retryCount = 0;
  private cloudRetryCount = 0;
  private maxRetries = 5;
  private isDev = !environment.production;
  private isLocal = true;

  constructor(
    private configService: ConfiguracionService,
    private notificationService: NotificacionSnackbarService
  ) {
    this.initialize();

    // Subscribe to configuration changes
    this.configService.configChanged.subscribe(config => {
      this.isLocal = config.isLocal;

      // Reconnect WebSockets whenever configuration changes
      this.reconnectWebSockets();
    });
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

    // Load configuration
    const config = this.configService.getConfig();
    this.isLocal = config.isLocal;

    // Default retries and connection settings
    this.maxRetries = 5;
    this.retryCount = 0;
    this.cloudRetryCount = 0;
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
    // For cloud server, always check the server central configuration
    const isCloudValid = !!(
      config &&
      config.serverCentralIp &&
      config.serverCentralPort &&
      config.serverCentralIp !== 'undefined' &&
      config.serverCentralPort !== 'undefined'
    );

    // For local server, only check if isLocal is true
    const isLocalValid = !config.isLocal || !!(
      config &&
      config.serverIp &&
      config.serverPort &&
      config.serverIp !== 'undefined' &&
      config.serverPort !== 'undefined'
    );

    // Both must be valid based on our requirements
    const isValid = isCloudValid && isLocalValid;

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
    const serverCentralIp = config.serverCentralIp || (this.isDev ? 'localhost' : null);
    const serverCentralPort = config.serverCentralPort || (this.isDev ? '8081' : null);

    // Only use local server config if isLocal is true
    const serverIp = this.isLocal ? (config.serverIp || (this.isDev ? 'localhost' : null)) : null;
    const serverPort = this.isLocal ? (config.serverPort || (this.isDev ? '8081' : null)) : null;

    // Create HTTP URLs - only create local URL if isLocal is true
    const url2 = `http://${serverCentralIp}:${serverCentralPort}/graphql`;
    const url = this.isLocal ? `http://${serverIp}:${serverPort}/graphql` : null;

    // Create WebSocket URLs - only create local WebSocket URL if isLocal is true
    const wUri2 = `ws://${serverCentralIp}:${serverCentralPort}/subscriptions`;
    const wUri = this.isLocal ? `ws://${serverIp}:${serverPort}/subscriptions` : null;

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

    // Create HTTP links - only create local link if isLocal is true
    let http = null;
    if (this.isLocal && url) {
      http = ApolloLink.from([
        basic,
        auth,
        httpLink.create({
          uri: url,
        }),
      ]);
    }

    // Create an HTTP link for central server (always required)
    const http2 = ApolloLink.from([
      basic,
      auth,
      httpLink.create({
        uri: url2,
      }),
    ]);

    // Set up WebSocket clients with proper connection handling
    this.setupWebSocketClients(wUri, wUri2);

    // Create WebSocket links - only create local link if isLocal is true
    let ws = null;
    if (this.isLocal && this.wsClient) {
      ws = new WebSocketLink(this.wsClient);
    }

    // Create central WebSocket link (always required)
    const ws2 = new WebSocketLink(this.wsClient2);

    // Build the link chain based on whether we're using local server
    if (this.isLocal) {
      // Using both local and central servers
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
    } else {
      // Using only central server
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
            ws2,
            http2
          )
        )
      );
    }
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
            if (result) {
              observer.next(result);
            } else {
              observer.next({
                data: null,
                errors: [{ message: "Respuesta vacía del servidor" }] as any
              });
            }
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
    // Set up cloud connection first (always required)
    this.setupCloudWebSocketClient(wUri2);

    // Only set up local connection if isLocal is true and wUri is provided
    if (this.isLocal && wUri) {
      this.setupLocalWebSocketClient(wUri);
    } else {
      // If we're not using local server, set local status to null
      connectionStatusSub.next(null);

      // Close existing connection if any
      if (this.wsClient) {
        this.wsClient.close(false);
        this.wsClient = null;
      }
    }
  }

  /**
   * Set up local WebSocket client
   */
  private setupLocalWebSocketClient(wUri: string): void {
    // Only proceed if isLocal is true
    if (!this.isLocal || !wUri) {
      // console.log("Local server connection disabled. Not connecting to local server.");
      connectionStatusSub.next(null);
      return;
    }

    // Primary WebSocket client
    this.wsClient = new SubscriptionClient(wUri, {
      reconnect: true,
      connectionCallback: (error) => {
        if (error) {
          // console.error('WebSocket connection error:', error);
          this.retryCount++;
          if (this.retryCount === this.maxRetries) {
            this.notificationService.notification$.next({
              texto: "PROBLEMAS DE CONEXIÓN CON EL SERVIDOR LOCAL.",
              color: NotificacionColor.danger,
              duracion: 6,
            });
          }
        } else {
          this.retryCount = 0;
        }
      }
    });

    // Connection event handlers for local server
    this.wsClient.onConnected(() => {
      connectionStatusSub.next(true);
      // console.log("Local WebSocket connected");
    });

    this.wsClient.onDisconnected(() => {
      if (connectionStatusSub.value != false) {
        connectionStatusSub.next(false);
      }
      // console.log("Local WebSocket disconnected");
    });

    this.wsClient.onReconnected(() => {
      connectionStatusSub.next(true);
      // console.log("Local WebSocket reconnected");

      // Only show notification if both connections are now established
      if (cloudConnectionStatusSub.value === true) {
        this.notificationService.notification$.next({
          texto: "¡Conexión local restablecida!",
          color: NotificacionColor.success,
          duracion: 3,
        });
      }
    });

    this.wsClient.onReconnecting(() => {
      // console.log(`Local WebSocket reconnecting... Attempt ${this.retryCount}`);
    });
  }

  /**
   * Set up cloud WebSocket client
   */
  private setupCloudWebSocketClient(wUri2: string): void {
    // Central server WebSocket client
    this.wsClient2 = new SubscriptionClient(wUri2, {
      reconnect: true,
      connectionCallback: (error) => {
        if (error) {
          // console.error('Cloud WebSocket connection error:', error);
          this.cloudRetryCount++;
          if (this.cloudRetryCount === this.maxRetries) {
            this.notificationService.notification$.next({
              texto: "PROBLEMAS DE CONEXIÓN CON EL SERVIDOR CENTRAL.",
              color: NotificacionColor.danger,
              duracion: 6,
            });
          }
        } else {
          this.cloudRetryCount = 0;
        }
      }
    });

    // Connection event handlers for cloud server
    this.wsClient2.onConnected(() => {
      cloudConnectionStatusSub.next(true);
      // console.log("Cloud WebSocket connected");
    });

    this.wsClient2.onDisconnected(() => {
      if (cloudConnectionStatusSub.value != false) {
        cloudConnectionStatusSub.next(false);
      }
      // console.log("Cloud WebSocket disconnected");
    });

    this.wsClient2.onReconnected(() => {
      cloudConnectionStatusSub.next(true);
      // console.log("Cloud WebSocket reconnected");

      // Only show notification if both connections are now established or if not using local
      if (!this.isLocal || connectionStatusSub.value === true) {
        this.notificationService.notification$.next({
          texto: "¡Conexión central restablecida!",
          color: NotificacionColor.success,
          duracion: 3,
        });
      }
    });

    this.wsClient2.onReconnecting(() => {
      // console.log(`Cloud WebSocket reconnecting... Attempt ${this.cloudRetryCount}`);
    });
  }

  /**
   * Manually attempt to reconnect WebSockets
   * Can be called after configuration changes
   */
  reconnectWebSockets(): void {
    // Reset retry count when manually reconnecting
    this.retryCount = 0;
    this.cloudRetryCount = 0;

    // Update isLocal from config
    const config = this.configService.getConfig();
    this.isLocal = config.isLocal;

    // Close existing connections
    if (this.wsClient) {
      this.wsClient.close(false);
      // Clear reference if local is disabled
      if (!this.isLocal) {
        this.wsClient = null;
      }
    }

    if (this.wsClient2) {
      this.wsClient2.close(false);
    }

    // Get updated configuration    
    if (this.isValidConfig(config)) {
      const serverCentralIp = config.serverCentralIp;
      const serverCentralPort = config.serverCentralPort;

      // Only prepare local server URI if isLocal is true
      let wUri = null;
      if (this.isLocal) {
        const serverIp = config.serverIp;
        const serverPort = config.serverPort;
        wUri = `ws://${serverIp}:${serverPort}/subscriptions`;
      }

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