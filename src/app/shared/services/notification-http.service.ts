import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationHttpService {
    private baseUrl: string;

    constructor(private http: HttpClient) {
        const centralIp = (environment as any).serverCentralIp || 'localhost';
        const centralPort = (environment as any).serverCentralPort || '8081';
        this.baseUrl = `http://${centralIp}:${centralPort}`;
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
}
