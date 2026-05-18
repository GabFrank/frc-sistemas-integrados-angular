import { Injectable } from '@angular/core';
import { Human, Config, Result } from '@vladmandic/human';

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
