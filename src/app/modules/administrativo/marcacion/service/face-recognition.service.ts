import { Injectable } from '@angular/core';
import { Human, Config, Result } from '@vladmandic/human';

export interface DescriptorConScore {
    embedding: number[];
    score: number;
}

@Injectable({
    providedIn: 'root'
})
export class FaceRecognitionService {
    private human: Human | null = null;
    private config: Partial<Config> = {
        // Quitamos el backend fijo de aquí para manejarlo dinámicamente en init()
        modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human@3.3.6/models/',
        filter: { enabled: true, equalization: false },
        face: {
            enabled: true,
            detector: { rotation: false },
            mesh: { enabled: true },
            attention: { enabled: false },
            iris: { enabled: true },
            description: { enabled: true },
            emotion: { enabled: false },
            antispoof: { enabled: true },
            liveness: { enabled: true }
        },
        body: { enabled: false },
        hand: { enabled: false },
        object: { enabled: false },
        gesture: { enabled: true }
    };

    async init(): Promise<void> {
        if (!this.human) {
            // Intentamos inicializar con el mejor backend disponible
            // Primero WebGL (GPU), si falla vamos a WASM (CPU optimizado)
            try {
                this.human = new Human({ ...this.config, backend: 'webgl' });
                await this.human.load();
                await this.human.warmup();
                console.log('FaceRecognition: WebGL inicializado (GPU)');
            } catch (e) {
                console.warn('FaceRecognition: WebGL no disponible, intentando Plan B (WASM)...', e);
                try {
                    this.human = new Human({ ...this.config, backend: 'wasm' });
                    await this.human.load();
                    await this.human.warmup();
                    console.log('FaceRecognition: WASM inicializado (CPU)');
                } catch (e2) {
                    console.error('FaceRecognition: Error crítico de inicialización, usando CPU genérico', e2);
                    this.human = new Human({ ...this.config, backend: 'cpu' });
                    await this.human.load();
                    await this.human.warmup();
                }
            }
        }
    }

    async detect(input: HTMLImageElement | HTMLVideoElement): Promise<Result> {
        await this.init();
        return await this.human!.detect(input);
    }

    async getDescriptor(input: HTMLImageElement | HTMLVideoElement | string): Promise<number[] | null> {
        await this.init();

        let result: Result;
        if (typeof input === 'string') {
            const image = new Image();
            image.src = input;
            image.crossOrigin = 'Anonymous';
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });
            result = await this.human!.detect(image);
        } else {
            result = await this.human!.detect(input);
        }

        if (result.face && result.face.length > 0) {
            return result.face[0].embedding as number[];
        }
        return null;
    }

    similarity(embedding1: number[], embedding2: number[]): number {
        if (!embedding1 || !embedding2) return 0;
        return this.human?.match.similarity(embedding1, embedding2) || 0;
    }

    async getDescriptorConScore(input: HTMLVideoElement | HTMLImageElement): Promise<DescriptorConScore | null> {
        await this.init();
        const result = await this.human!.detect(input);
        if (result.face && result.face.length > 0) {
            const face = result.face[0];
            return {
                embedding: Array.from(face.embedding),
                score: face.score ?? 0
            };
        }
        return null;
    }
}
