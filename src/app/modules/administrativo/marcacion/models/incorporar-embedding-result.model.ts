export type ResultadoIncorporacionEmbedding = 'OK' | 'RECHAZADO_SCORE' | 'RECHAZADO_SIMILITUD';

export type ResultadoIncorporacionEmbeddingCliente = ResultadoIncorporacionEmbedding | 'ERROR_RED';

export interface IncorporarEmbeddingMarcacionResult {
  resultado: ResultadoIncorporacionEmbedding;
  mensaje: string;
}

export const MENSAJE_RECHAZADO_SCORE_CLIENTE =
  'La captura no alcanzó la calidad mínima (70%) para actualizar el perfil facial.';

export const MENSAJE_ERROR_RED_CLIENTE =
  'No se pudo actualizar el perfil facial por un error de conexión.';
