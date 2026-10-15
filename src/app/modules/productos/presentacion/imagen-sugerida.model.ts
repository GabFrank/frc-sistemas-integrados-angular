/** Foto de internet sugerida por el central para una presentación. */
export interface ImagenSugerida {
  url: string;
  miniatura: string;
  ancho?: number;
  alto?: number;
  titulo?: string;
  sitio?: string;
  fuente: 'OPEN_FOOD_FACTS' | 'BING' | 'BRAVE' | 'BRAVE_WEB';
  /** Es el producto del código buscado: la foto o su título nombran el código, o es de Open Food Facts. */
  exacta?: boolean;
  /** Solo BRAVE_WEB: para pedir fotos visualmente parecidas (`imagenesParecidasDe`). */
  similares?: string;
}

/**
 * Fotos parecidas a una sugerida. `aproximada`: la foto no estaba en Brave, son parecidas a otra similar.
 * `porTexto`: Brave no respondió, son de Bing con el título de la foto.
 */
export interface ParecidasImagen {
  imagenes: ImagenSugerida[];
  aproximada: boolean;
  porTexto: boolean;
}

export interface SugerenciasImagen {
  codigo?: string;
  codigoDescartado?: string;
  texto: string;
  /** «pack x 12» si la presentación es de varias unidades. */
  pack?: string;
  porCodigo: ImagenSugerida[];
  /** Solo con pack: las que nombran la cantidad. */
  porPack: ImagenSugerida[];
  porDescripcion: ImagenSugerida[];
  avisos: string[];
}
