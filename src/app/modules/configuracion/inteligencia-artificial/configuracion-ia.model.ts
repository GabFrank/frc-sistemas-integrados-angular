export type ProveedorIa = 'OPENAI' | 'CLAUDE';

export interface ConfiguracionIa {
  /** Proveedor activo que lee las facturas en papel. */
  proveedor: ProveedorIa;
  // OpenAI
  claveCargada: boolean;
  claveFinal?: string;
  modelo?: string;
  // Claude
  claudeClaveCargada: boolean;
  claudeClaveFinal?: string;
  claudeModelo?: string;
  promptAdicional?: string;
  cifradoDisponible: boolean;
}

/** Lo que se manda al guardar. null en un campo = no cambia; en las claves, "" = borra. */
export interface ConfiguracionIaInput {
  proveedor: ProveedorIa;
  apiKey: string | null;
  modelo: string;
  claudeApiKey: string | null;
  claudeModelo: string;
  promptAdicional: string;
}
