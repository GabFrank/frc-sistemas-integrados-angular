export interface EmbeddingGaleriaItem {
  pose: string;
  embedding: number[];
  score: number;
}

export interface EmbeddingGaleria {
  master: number[];
  gallery: EmbeddingGaleriaItem[];
}

const POSES_CAPTURA = ['left', 'right', 'front'];

export const UMBRAL_SIMILITUD_FACIAL = 0.55;
/** Umbral 1:1 en pantalla de marcación (usuario ya seleccionado), sin importar cómo se llegó. */
export const UMBRAL_SIMILITUD_VERIFICACION = 0.75;
export const SCORE_MINIMO_DETECCION = 0.45;
export const SCORE_MINIMO_FRAME = 0.55;
export const SCORE_MINIMO_FRAME_VERIFICACION = 0.6;
export const SCORE_MINIMO_GALERIA = 0.7;
export const FRAMES_MINIMOS_VERIFICACION = 3;
export const HITS_CONSECUTIVOS_VERIFICACION = 3;

export interface FrameCalidadFacial {
  embedding: number[];
  score: number;
  similitud?: number;
}

export function parsearGaleriaFacial(json: string | null | undefined): EmbeddingGaleria | null {
  if (!json || json.trim() === '') {
    return null;
  }
  try {
    const parsed = JSON.parse(json);
    if (
      parsed &&
      Array.isArray(parsed.master) &&
      parsed.master.length > 0 &&
      Array.isArray(parsed.gallery) &&
      parsed.gallery.length > 0
    ) {
      return {
        master: parsed.master,
        gallery: parsed.gallery,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function construirGaleriaDesdeCapturas(
  capturas: Array<{ embedding: number[]; score: number }>,
  poses: string[] = POSES_CAPTURA
): EmbeddingGaleria | null {
  const validas = capturas.filter((c) => c.embedding?.length > 0);
  if (validas.length === 0) {
    return null;
  }

  const gallery: EmbeddingGaleriaItem[] = validas.map((captura, indice) => ({
    pose: poses[indice] ?? `pose-${indice + 1}`,
    embedding: captura.embedding,
    score: captura.score ?? 0,
  }));

  const master = fusionarEmbeddingsMaestro(validas);
  if (!master) {
    return null;
  }

  return { master, gallery };
}

export function extraerVectoresGaleria(galeria: EmbeddingGaleria): number[][] {
  const vectores: number[][] = [];
  if (galeria.master?.length > 0) {
    vectores.push(galeria.master);
  }
  for (const item of galeria.gallery ?? []) {
    if (item?.embedding?.length > 0) {
      vectores.push(item.embedding);
    }
  }
  return vectores;
}

export function serializarGaleriaFacial(galeria: EmbeddingGaleria): string {
  return JSON.stringify(galeria);
}

export function promediarEmbeddingsConScore(frames: FrameCalidadFacial[]): number[] | null {
  const validas = frames.filter((f) => f.embedding?.length > 0 && f.score >= SCORE_MINIMO_DETECCION);
  if (validas.length === 0) {
    return null;
  }

  const dim = validas[0].embedding.length;
  const promedio = new Array(dim).fill(0);
  let pesoTotal = 0;

  for (const frame of validas) {
    const peso = frame.score;
    pesoTotal += peso;
    for (let i = 0; i < dim; i++) {
      promedio[i] += frame.embedding[i] * peso;
    }
  }

  for (let i = 0; i < dim; i++) {
    promedio[i] /= pesoTotal;
  }

  const magnitud = Math.sqrt(promedio.reduce((sum, val) => sum + val * val, 0));
  if (magnitud > 0) {
    for (let i = 0; i < dim; i++) {
      promedio[i] /= magnitud;
    }
  }

  return promedio;
}

export function scorePromedioFrames(frames: FrameCalidadFacial[]): number {
  if (!frames.length) {
    return 0;
  }
  const total = frames.reduce((sum, frame) => sum + frame.score, 0);
  return total / frames.length;
}

function fusionarEmbeddingsMaestro(
  capturas: Array<{ embedding: number[]; score: number }>,
  scoreMinimo = 0.5
): number[] | null {
  const validas = capturas.filter((c) => c.score >= scoreMinimo && c.embedding?.length > 0);
  if (validas.length === 0) {
    return null;
  }

  const dim = validas[0].embedding.length;
  const promedio = new Array(dim).fill(0);

  for (const captura of validas) {
    for (let i = 0; i < dim; i++) {
      promedio[i] += captura.embedding[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    promedio[i] /= validas.length;
  }

  const magnitud = Math.sqrt(promedio.reduce((sum, val) => sum + val * val, 0));
  if (magnitud > 0) {
    for (let i = 0; i < dim; i++) {
      promedio[i] /= magnitud;
    }
  }

  return promedio;
}
