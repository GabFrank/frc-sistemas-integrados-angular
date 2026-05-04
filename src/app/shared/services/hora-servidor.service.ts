import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, of } from 'rxjs';
import { catchError, take, timeout } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from '../../../environments/environment';
import { ConfiguracionService } from './configuracion.service';

/** IANA — backend (`app.timezone`) y APIs que piden nombre de zona. */
export const ZONA_HORARIA_PARAGUAY = 'America/Asuncion';

/**
 * Paraguay hoy es UTC−3 fijo (sin DST). Usar en `DatePipe` / `formatDate` en Electron/navegador:
 * `America/Asuncion` puede desfasar ~1 h con ICU antiguo (reglas DST obsoletas).
 */
export const ZONA_OFFSET_PARAGUAY = '-03:00';

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

        this.http.get<{
            horaServidor?: string;
            fechaHoraServidor?: string;
            timestamp?: number;
            epochMillis?: number;
        }>(url)
            .pipe(
                timeout(5000),
                take(1),
                catchError(err => {
                    console.warn('HoraServidorService: No se pudo sincronizar con el servidor', err);
                    return of(null);
                })
            )
            .subscribe(res => {
                if (res == null) {
                    return;
                }
                let epochMs = this.extraerInstanteServidorMillis(res);
                if (epochMs === null) {
                    return;
                }
                const despuesRequest = Date.now();
                const latenciaEstimada = (despuesRequest - antesRequest) / 2;
                const horaServidorAjustada = epochMs + latenciaEstimada;
                this.offsetMs = horaServidorAjustada - despuesRequest;
                this.sincronizado = true;
                this.horaActual$.next(new Date(Date.now() + this.offsetMs));
            });
    }

    ngOnDestroy(): void { }

    /**
     * Instante del servidor: mismo reloj que el SO del host JVM (`epochMillis` / `timestamp`).
     * Si el ISO con offset (`fechaHoraServidor` / `horaServidor`) coincide, refuerza el valor.
     */
    private extraerInstanteServidorMillis(res: {
        horaServidor?: string;
        fechaHoraServidor?: string;
        timestamp?: number;
        epochMillis?: number;
    }): number | null {
        const raw = res.epochMillis !== undefined && res.epochMillis !== null
            ? res.epochMillis
            : res.timestamp;
        if (raw === undefined || raw === null) {
            const soloIso = res.fechaHoraServidor || res.horaServidor;
            if (soloIso) {
                const u = Date.parse(soloIso);
                return Number.isFinite(u) ? u : null;
            }
            return null;
        }
        let epochMs = Number(raw);
        if (!Number.isFinite(epochMs)) {
            return null;
        }
        if (epochMs < 1e12) {
            epochMs = epochMs * 1000;
        }
        const iso = res.fechaHoraServidor || res.horaServidor;
        if (iso) {
            const desdeIso = Date.parse(iso);
            if (Number.isFinite(desdeIso)) {
                if (Math.abs(desdeIso - epochMs) <= 3000) {
                    epochMs = (epochMs + desdeIso) / 2;
                } else {
                    console.warn(
                        'HoraServidorService: epoch e fecha ISO divergen; se usa el instante ISO del servidor',
                        { epochMs, desdeIso, iso }
                    );
                    epochMs = desdeIso;
                }
            }
        }
        return epochMs;
    }
}
