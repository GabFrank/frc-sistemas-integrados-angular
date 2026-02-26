import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CamaraService {

    private stream: MediaStream | null = null;

    constructor() { }

    async iniciarCamara(): Promise<MediaStream> {
        if (this.stream) {
            this.detenerCamara();
        }
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            return this.stream;
        } catch (err) {
            throw new Error('No se pudo acceder a la cámara: ' + err);
        }
    }

    detenerCamara(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    capturarFoto(videoElement: HTMLVideoElement): string {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/png');
        }
        return '';
    }
}
