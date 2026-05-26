export interface ConfiguracionSistema {
  clave: string;
  valor: string | null;
  descripcion: string | null;
  encriptado: boolean;
  modificadoEn?: string;
}

export const MASCARA_SECRETO = '***';

// Claves de configuracion conocidas — type-safe access
export const CONFIG_CLAVES = {
  OPENAI_API_KEY: 'openai.api_key',
  OPENAI_MODELO: 'openai.modelo',
  OPENAI_PROMPT_ADICIONAL: 'openai.prompt_adicional',
  EMPRESA_NOMBRE_IMPRESION: 'empresa.nombre_impresion',
  EMPRESA_SUBTITULO_IMPRESION: 'empresa.subtitulo_impresion',
  EMPRESA_DIRECCION_IMPRESION: 'empresa.direccion_impresion',
  EMPRESA_TELEFONO_IMPRESION: 'empresa.telefono_impresion',
  EMPRESA_LOGO_BASE64: 'empresa.logo_base64',
} as const;
