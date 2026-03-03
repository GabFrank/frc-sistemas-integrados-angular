import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DispositivoService {

    constructor() { }

    obtenerInfoDispositivo(): string {
        const navegador = navigator.userAgent;
        const plataforma = navigator.platform;
        return `${plataforma} - ${navegador.substring(0, 50)}`;
    }

    obtenerDeviceId(): string {
        let id = localStorage.getItem('device_id');
        if (!id) {
            if (crypto && crypto.randomUUID) {
                id = crypto.randomUUID();
            } else {
                id = Math.random().toString(36).substring(2) + Date.now().toString(36);
            }
            localStorage.setItem('device_id', id);
        }
        return id;
    }
}
