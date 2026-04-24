import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, of } from 'rxjs';
import { catchError, take, timeout } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from '../../../environments/environment';
import { ConfiguracionService } from './configuracion.service';
@UntilDestroy()
@Injectable({
    providedIn: 'root'
})
export class HoraServidorService implements OnDestroy {
    private offsetMs = 0;
    private sincronizado = false;
    horaActual$ = new BehaviorSubject<Date>(new Date());
    private readonly INTERVALO_SYNC_MS = 5 * 60 * 1000;

    constructor(
        private http: HttpClient,
        private configService: ConfiguracionService
    ) {
        this.sincronizarConServidor();
        interval(this.INTERVALO_SYNC_MS)
            .pipe(untilDestroyed(this))
            .subscribe(() => this.sincronizarConServidor());
        interval(1000)
            .pipe(untilDestroyed(this))
            .subscribe(() => {
                const horaCorregida = new Date(Date.now() + this.offsetMs);
                this.horaActual$.next(horaCorregida);
            });
    }

    obtenerHoraActual(): Date {
        return new Date(Date.now() + this.offsetMs);
    }
    estaSincronizado(): boolean {
        return this.sincronizado;
    }
    sincronizarConServidor(): void {
        const config = this.configService.getConfig();
        const serverIp = config?.serverCentralIp || config?.serverIp || environment['serverCentralIp'] || environment['serverIp'];
        const serverPort = config?.serverCentralPort || config?.serverPort || environment['serverCentralPort'] || environment['serverPort'];
        const url = `http://${serverIp}:${serverPort}/config/hora-servidor`;

        const antesRequest = Date.now();

        this.http.get<{ horaServidor: string, timestamp: number }>(url)
            .pipe(
                timeout(5000),
                take(1),
                catchError(err => {
                    console.warn('HoraServidorService: No se pudo sincronizar con el servidor', err);
                    return of(null);
                })
            )
            .subscribe(res => {
                if (res && res.timestamp) {
                    const despuesRequest = Date.now();
                    const latenciaEstimada = (despuesRequest - antesRequest) / 2;
                    const horaServidorAjustada = res.timestamp + latenciaEstimada;
                    this.offsetMs = horaServidorAjustada - despuesRequest;
                    this.sincronizado = true;
                    this.horaActual$.next(new Date(Date.now() + this.offsetMs));
                }
            });
    }

    ngOnDestroy(): void { }
}
