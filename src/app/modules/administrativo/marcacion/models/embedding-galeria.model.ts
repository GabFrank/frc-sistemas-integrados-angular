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
