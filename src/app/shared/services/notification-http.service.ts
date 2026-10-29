import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfiguracionService } from './configuracion.service';
import { urlsDeServidor } from '../../commons/core/utils/webEndpoints';

export interface VentaStockCriticoItemPayload {
    productoId: number;
    productoDescripcion: string;
    stockActual: number;
    cantidadVendida: number;
    stockResultante: number;
}

export interface VentaStockCriticoPayload {
    ventaId: number;
    sucursalId: number;
    usuarioNombre?: string;
    sucursalNombre?: string;
    items: VentaStockCriticoItemPayload[];
}

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
        return urlsDeServidor(centralIp, centralPort).http;
    }

    /**
     * El central exige token en /notification/** (issue #521 del central). Se usa el token del
     * central y, si no hay, el de la filial: el mismo criterio que Apollo para el cliente "servidor".
     * Sin token no se manda el header y el central responde 401; la notificacion se pierde pero la
     * operacion (venta, gasto, retiro, caja) no se traba.
     */
    private get headers(): HttpHeaders {
        const token = localStorage.getItem('token_central') || localStorage.getItem('token');
        return token ? new HttpHeaders({ Authorization: `Token ${token}` }) : new HttpHeaders();
    }

    sendCompraCreditoNotification(
        ventaId: number,
        sucursalId: number,
        personaId: number,
        valorTotal: number,
        sucursalNombre?: string
    ): Observable<any> {
        const url = `${this.baseUrl}/notification/compra-credito/${ventaId}/${sucursalId}/${personaId}/${valorTotal}`;
        let params: any = {};
        if (sucursalNombre) params.sucursalNombre = sucursalNombre;
        return this.http.post(url, {}, { params, headers: this.headers });
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
        return this.http.post(url, {}, { params, headers: this.headers });
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
        return this.http.post(url, {}, { params, headers: this.headers });
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
        return this.http.post(url, {}, { params, headers: this.headers });
    }

    sendDiferenciaMaletinNotification(
        cajaId: number,
        sucursalId: number,
        diferenciaTotalGs: number,
        diferenciaGs?: number,
        diferenciaRs?: number,
        diferenciaDs?: number,
        maletinDescripcion?: string,
        sucursalNombre?: string
    ): Observable<any> {
        const url = `${this.baseUrl}/notification/diferencia-maletin/${cajaId}/${sucursalId}/${diferenciaTotalGs}`;
        let params: any = {};
        if (diferenciaGs != null) params.diferenciaGs = diferenciaGs;
        if (diferenciaRs != null) params.diferenciaRs = diferenciaRs;
        if (diferenciaDs != null) params.diferenciaDs = diferenciaDs;
        if (maletinDescripcion) params.maletinDescripcion = maletinDescripcion;
        if (sucursalNombre) params.sucursalNombre = sucursalNombre;
        return this.http.post(url, {}, { params, headers: this.headers });
    }

    sendVentaStockCriticoNotification(payload: VentaStockCriticoPayload): Observable<any> {
        const url = `${this.baseUrl}/notification/venta-stock-critico`;
        return this.http.post(url, payload, { headers: this.headers });
    }
}
