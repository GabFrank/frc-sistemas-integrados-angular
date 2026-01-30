import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ConfiguracionService, ConfiguracionSistema } from '../../../shared/services/configuracion.service';
import SockJS from 'sockjs-client';
export interface TelemetriaWsDTO {
    gpsId: number;
    imei: string;
    vehiculoId: number | null;
    vehiculoChapa: string | null;
    vehiculoModelo: string | null;
    vehiculoMarca: string | null;
    latitud: number;
    longitud: number;
    velocidad: number;
    direccion: number;
    ignicion: boolean;
    alarma: string;
    fechaGps: string;
    fechaServidor: string;
    activo: boolean;
    modeloTracker: string;
}

export interface EstadoDispositivoDTO {
    gpsId: number;
    imei: string;
    conectado: boolean;
}
@Injectable({
    providedIn: 'root'
})
export class GpsWebSocketService implements OnDestroy {

    private client: Client | null = null;
    private subscriptions: Map<string, StompSubscription> = new Map();
    private configSubscription: Subscription | null = null;
    private currentServerIp: string = '';
    private currentServerPort: string = '';
    private telemetriaSubject = new Subject<TelemetriaWsDTO>();
    private estadoDispositivoSubject = new Subject<EstadoDispositivoDTO>();
    private connectionStatusSubject = new BehaviorSubject<boolean>(false);
    public telemetria$ = this.telemetriaSubject.asObservable();
    public estadoDispositivo$ = this.estadoDispositivoSubject.asObservable();
    public connectionStatus$ = this.connectionStatusSubject.asObservable();

    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 3000;

    constructor(private configService: ConfiguracionService) {
        this.subscribeToConfigChanges();
        this.loadCurrentConfig();
    }

    private subscribeToConfigChanges(): void {
        this.configSubscription = this.configService.configChanged.subscribe(
            (newConfig: ConfiguracionSistema) => {
                const serverChanged =
                    this.currentServerIp !== newConfig.serverIp ||
                    this.currentServerPort !== newConfig.serverPort;

                if (serverChanged) {
                    console.log('WebSocket GPS: Configuración del servidor cambió, reconectando...');
                    console.log(`  Anterior: ${this.currentServerIp}:${this.currentServerPort}`);
                    console.log(`  Nueva: ${newConfig.serverIp}:${newConfig.serverPort}`);

                    this.currentServerIp = newConfig.serverIp;
                    this.currentServerPort = newConfig.serverPort;
                    if (this.client) {
                        this.reconnectWithNewConfig();
                    }
                }
            }
        );
    }
    private loadCurrentConfig(): void {
        const config = this.configService.getConfig();
        this.currentServerIp = config.serverIp || 'localhost';
        this.currentServerPort = config.serverPort || '8080';
    }

    private reconnectWithNewConfig(): void {
        this.disconnect();
        this.reconnectAttempts = 0;
        setTimeout(() => {
            this.connect();
        }, 500);
    }

    connect(): void {
        if (this.client?.connected) {
            console.log('WebSocket GPS: Ya conectado');
            return;
        }

        this.loadCurrentConfig();

        const wsUrl = this.getWebSocketUrl();
        console.log('WebSocket GPS: Conectando a', wsUrl);

        this.client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: this.reconnectDelay,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (msg) => {
                if (!environment.production) {
                    console.log('STOMP:', msg);
                }
            },
            onConnect: () => {
                console.log('WebSocket GPS: Conectado exitosamente a', wsUrl);
                this.reconnectAttempts = 0;
                this.connectionStatusSubject.next(true);
                this.subscribeToTopics();
            },
            onStompError: (frame) => {
                console.error('WebSocket GPS: Error STOMP', frame.headers['message']);
                this.connectionStatusSubject.next(false);
            },
            onDisconnect: () => {
                console.log('WebSocket GPS: Desconectado');
                this.connectionStatusSubject.next(false);
            },
            onWebSocketClose: () => {
                console.log('WebSocket GPS: Conexión cerrada');
                this.connectionStatusSubject.next(false);
                this.handleReconnect();
            }
        });

        this.client.activate();
    }

    disconnect(): void {
        if (this.client) {
            this.unsubscribeAll();
            this.client.deactivate();
            this.client = null;
            this.connectionStatusSubject.next(false);
            console.log('WebSocket GPS: Desconectado manualmente');
        }
    }

    private subscribeToTopics(): void {
        if (!this.client?.connected) return;
        this.subscribe('/topic/gps/all', (message: IMessage) => {
            try {
                const telemetria: TelemetriaWsDTO = JSON.parse(message.body);
                this.telemetriaSubject.next(telemetria);
            } catch (e) {
                console.error('Error parseando telemetría:', e);
            }
        });

        this.subscribe('/topic/gps/status', (message: IMessage) => {
            try {
                const estado: EstadoDispositivoDTO = JSON.parse(message.body);
                this.estadoDispositivoSubject.next(estado);
            } catch (e) {
                console.error('Error parseando estado:', e);
            }
        });
    }

    subscribeToGps(gpsId: number): Observable<TelemetriaWsDTO> {
        const subject = new Subject<TelemetriaWsDTO>();
        const topic = `/topic/gps/${gpsId}`;

        if (this.client?.connected) {
            this.subscribe(topic, (message: IMessage) => {
                try {
                    const telemetria: TelemetriaWsDTO = JSON.parse(message.body);
                    subject.next(telemetria);
                } catch (e) {
                    console.error('Error parseando telemetría GPS:', e);
                }
            });
        }

        return subject.asObservable();
    }

    subscribeToVehiculo(vehiculoId: number): Observable<TelemetriaWsDTO> {
        const subject = new Subject<TelemetriaWsDTO>();
        const topic = `/topic/gps/vehiculo/${vehiculoId}`;

        if (this.client?.connected) {
            this.subscribe(topic, (message: IMessage) => {
                try {
                    const telemetria: TelemetriaWsDTO = JSON.parse(message.body);
                    subject.next(telemetria);
                } catch (e) {
                    console.error('Error parseando telemetría vehículo:', e);
                }
            });
        }

        return subject.asObservable();
    }

    private subscribe(topic: string, callback: (message: IMessage) => void): void {
        if (!this.client?.connected) return;

        if (this.subscriptions.has(topic)) {
            console.log(`WebSocket GPS: Ya suscrito a ${topic}`);
            return;
        }

        const subscription = this.client.subscribe(topic, callback);
        this.subscriptions.set(topic, subscription);
        console.log(`WebSocket GPS: Suscrito a ${topic}`);
    }

    unsubscribe(topic: string): void {
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(topic);
            console.log(`WebSocket GPS: Desuscrito de ${topic}`);
        }
    }

    private unsubscribeAll(): void {
        this.subscriptions.forEach((sub, topic) => {
            sub.unsubscribe();
            console.log(`WebSocket GPS: Desuscrito de ${topic}`);
        });
        this.subscriptions.clear();
    }

    private getWebSocketUrl(): string {
        const serverIp = this.currentServerIp || 'localhost';
        const serverPort = this.currentServerPort || '8080';
        return `http://${serverIp}:${serverPort}/ws/gps`;
    }

    getCurrentUrl(): string {
        return this.getWebSocketUrl();
    }
    private handleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`WebSocket GPS: Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            console.error('WebSocket GPS: Máximo de intentos de reconexión alcanzado');
        }
    }

    isConnected(): boolean {
        return this.client?.connected || false;
    }

    ngOnDestroy(): void {
        if (this.configSubscription) {
            this.configSubscription.unsubscribe();
            this.configSubscription = null;
        }
        this.disconnect();
    }
}
