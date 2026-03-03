import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

export interface Ubicacion {
    latitud: number;
    longitud: number;
    precision: number;
}

@Injectable({
    providedIn: 'root'
})
export class UbicacionService {

    constructor() { }

    obtenerUbicacionActual(): Observable<Ubicacion> {
        return new Observable((observer: Observer<Ubicacion>) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        observer.next({
                            latitud: position.coords.latitude,
                            longitud: position.coords.longitude,
                            precision: position.coords.accuracy
                        });
                        observer.complete();
                    },
                    (error) => {
                        observer.error(error);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                observer.error('Geolocalización no soportada por el navegador.');
            }
        });
    }

    calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return Math.floor(d);
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
