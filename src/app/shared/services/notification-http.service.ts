import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

declare global {
    interface Window {
        environment?: {
            centralIp?: string;
            centralPort?: string;
            [key: string]: any;
        };
    }
}

@Injectable({
    providedIn: 'root'
})
export class NotificationHttpService {

    constructor(private http: HttpClient) { }
    private get baseUrl(): string {
        const centralIp = window.environment?.centralIp || 'localhost';
        const centralPort = window.environment?.centralPort || '8081';
        return `http://${centralIp}:${centralPort}`;
    }

    sendVentaCreditoNotification(
        ventaCreditoId: number,
        sucursalId: number,
        personaId: number,
        valorTotal: number
    ): Observable<any> {
        const url = `${this.baseUrl}/notification/venta-credito/${ventaCreditoId}/${sucursalId}/${personaId}/${valorTotal}`;
        return this.http.post(url, {});
    }

    sendGastoNotification(
        gastoId: number,
        sucursalId: number,
        personaId: number,
        valorTotal: number
    ): Observable<any> {
        const url = `${this.baseUrl}/notification/gasto/${gastoId}/${sucursalId}/${personaId}/${valorTotal}`;
        return this.http.post(url, {});
    }

    sendRetiroNotification(
        retiroId: number,
        sucursalId: number,
        personaId: number,
        valorTotal: number
    ): Observable<any> {
        const url = `${this.baseUrl}/notification/retiro/${retiroId}/${sucursalId}/${personaId}/${valorTotal}`;
        return this.http.post(url, {});
    }
}
