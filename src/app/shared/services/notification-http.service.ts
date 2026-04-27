import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfiguracionService } from './configuracion.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationHttpService {

    constructor(
        private http: HttpClient,
        private configService: ConfiguracionService
    ) { }

    private get baseUrl(): string {
        const config = this.configService.getConfig();
        const centralIp = config?.serverCentralIp || 'localhost';
        const centralPort = config?.serverCentralPort || '8081';
        return `http://${centralIp}:${centralPort}`;
    }

    sendVentaCreditoNotification(
        ventaCreditoId: number,
        sucursalId: number,
        personaId: number,
        valorTotal: number,
        usuarioNombre?: string,
        sucursalNombre?: string
    ): Observable<any> {
        const url = `${this.baseUrl}/notification/venta-credito/${ventaCreditoId}/${sucursalId}/${personaId}/${valorTotal}`;
        let params: any = {};
        if (usuarioNombre) params.usuarioNombre = usuarioNombre;
        if (sucursalNombre) params.sucursalNombre = sucursalNombre;
        return this.http.post(url, {}, { params });
    }

    sendGastoNotification(
        gastoId: number,
        sucursalId: number,
        personaId: number,
        valorTotal: number,
        usuarioNombre?: string,
        sucursalNombre?: string
    ): Observable<any> {
        const url = `${this.baseUrl}/notification/gasto/${gastoId}/${sucursalId}/${personaId}/${valorTotal}`;
        let params: any = {};
        if (usuarioNombre) params.usuarioNombre = usuarioNombre;
        if (sucursalNombre) params.sucursalNombre = sucursalNombre;
        return this.http.post(url, {}, { params });
    }

    sendRetiroNotification(
        retiroId: number,
        sucursalId: number,
        personaId: number,
        valorTotal: number,
        usuarioNombre?: string,
        sucursalNombre?: string
    ): Observable<any> {
        const url = `${this.baseUrl}/notification/retiro/${retiroId}/${sucursalId}/${personaId}/${valorTotal}`;
        let params: any = {};
        if (usuarioNombre) params.usuarioNombre = usuarioNombre;
        if (sucursalNombre) params.sucursalNombre = sucursalNombre;
        return this.http.post(url, {}, { params });
    }

    sendVentaTransferenciaNotification(
        ventaId: number,
        sucursalId: number,
        valorTotal: number,
        usuarioNombre?: string,
        sucursalNombre?: string
    ): Observable<any> {
        const url = `${this.baseUrl}/notification/venta-transferencia/${ventaId}/${sucursalId}/${valorTotal}`;
        let params: any = {};
        if (usuarioNombre) params.usuarioNombre = usuarioNombre;
        if (sucursalNombre) params.sucursalNombre = sucursalNombre;
        return this.http.post(url, {}, { params });
    }
}
