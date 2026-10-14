/** Foto de internet sugerida por el central para una presentación. */
export interface ImagenSugerida {
  url: string;
  miniatura: string;
  ancho?: number;
  alto?: number;
  titulo?: string;
  sitio?: string;
  fuente: 'OPEN_FOOD_FACTS' | 'BING' | 'BRAVE';
}

export interface SugerenciasImagen {
  codigo?: string;
  codigoDescartado?: string;
  texto: string;
  porCodigo: ImagenSugerida[];
  porDescripcion: ImagenSugerida[];
  avisos: string[];
}
