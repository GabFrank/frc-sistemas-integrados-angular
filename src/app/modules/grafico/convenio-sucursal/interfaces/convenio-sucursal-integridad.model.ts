export interface ConvenioConteo {
  total: number;
  abiertas: number;
  finalizadas: number;
  canceladas: number;
  /** EN_MORA, INCOBRABLE o sin estado. */
  otras: number;
}

export type EstadoIntegridadConvenio = "OK" | "DIFERENCIA" | "SIN_CONEXION" | "SIN_IP";

/** Respuesta de convenioIntegridadPorSucursal: central contra la base de la filial. */
export interface ConvenioSucursalIntegridad {
  sucursalId: number;
  sucursalNombre: string;
  central: ConvenioConteo;
  /** null si la filial no se pudo consultar. */
  filial: ConvenioConteo | null;
  estadoIntegridad: EstadoIntegridadConvenio;
  error: string | null;
  faltanEnCentral: number;
  sobranEnCentral: number;
  estadoDistinto: number;
  idsFaltanEnCentral: string[];
  idsSobranEnCentral: string[];
  idsEstadoDistinto: string[];
  ultimoCentral: string | null;
  ultimoFilial: string | null;
}
