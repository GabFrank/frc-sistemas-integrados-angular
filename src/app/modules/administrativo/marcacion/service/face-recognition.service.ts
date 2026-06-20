import { Injectable } from '@angular/core';
import { Human, Config, Result } from '@vladmandic/human';
import { EmbeddingGaleria, extraerVectoresGaleria } from '../models/embedding-galeria.model';

export interface DescriptorConScore {
    embedding: number[];
    score: number;
}

/** Ruta local servida por angular.json → assets/tfjs-wasm/ (requiere @tensorflow/tfjs-backend-wasm instalado). */
function wasmAssetsPath(): string {
    const base = document.querySelector('base')?.getAttribute('href') ?? '/';
    return new URL('assets/tfjs-wasm/', new URL(base, window.location.href)).href;
}

@Injectable({
    providedIn: 'root'
})
export class FaceRecognitionService {
    private human: Human | null = null;
    private initPromise: Promise<void> | null = null;

    private buildConfig(): Partial<Config> {
        return {
            backend: 'wasm',
            wasmPath: wasmAssetsPath(),
            modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human@3.3.6/models/',
            filter: { enabled: true, equalization: false },
        face: {
            enabled: true,
            detector: { rotation: true, maxDetected: 1 },
            mesh: { enabled: true },
            attention: { enabled: false },
            iris: { enabled: true },
            description: { enabled: true },
            emotion: { enabled: false },
            antispoof: { enabled: false },
            liveness: { enabled: false }
        },
            body: { enabled: false },
            hand: { enabled: false },
            object: { enabled: false },
            gesture: { enabled: false }
        };
    }

    async init(): Promise<void> {
        if (this.human) {
            return;
        }
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            this.human = new Human(this.buildConfig());
            await this.human.init();
            await this.human.load();
            await this.human.warmup();
        })().catch((err) => {
            this.human = null;
            this.initPromise = null;
            throw err;
        });

        return this.initPromise;
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

    calcularMejorSimilitudConGaleria(embedding: number[], galeria: EmbeddingGaleria): number {
        const vectores = extraerVectoresGaleria(galeria);
        if (!embedding?.length || vectores.length === 0) {
            return 0;
        }
        let maxima = 0;
        for (const referencia of vectores) {
            const similitud = this.similarity(embedding, referencia);
            if (similitud > maxima) {
                maxima = similitud;
            }
        }
        return maxima;
    }

    async getDescriptorConScore(input: HTMLVideoElement | HTMLImageElement): Promise<DescriptorConScore | null> {
        return this.getDescriptorConScoreConTimeout(input, 20000);
    }

    async getDescriptorConScoreDesdeImagen(dataUrl: string): Promise<DescriptorConScore | null> {
        await this.init();
        const image = new Image();
        image.src = dataUrl;
        image.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('No se pudo cargar el frame capturado'));
        });
        return this.getDescriptorConScoreConTimeout(image, 20000);
    }

    private async getDescriptorConScoreConTimeout(
        input: HTMLVideoElement | HTMLImageElement,
        timeoutMs: number
    ): Promise<DescriptorConScore | null> {
        await this.init();
        const deteccion = await Promise.race([
            this.human!.detect(input),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
        ]);
        if (!deteccion || !deteccion.face || deteccion.face.length === 0) {
            return null;
        }
        const face = deteccion.face[0];
        return {
            embedding: Array.from(face.embedding),
            score: face.score ?? 0
        };
    }
}
