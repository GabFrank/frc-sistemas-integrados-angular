import { Moneda } from '../../moneda/moneda.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Persona } from '../../../personas/persona/persona.model';
import { Retiro } from '../retiro.model';

export enum ResultadoVerificacionRetiro {
  SIN_DIFERENCIA = 'SIN_DIFERENCIA',
  CON_DIFERENCIA = 'CON_DIFERENCIA',
}

export enum CategoriaDiferenciaRetiro {
  DIFERENCIA_CONTEO = 'DIFERENCIA_CONTEO',
  FALTANTE = 'FALTANTE',
  SOBRANTE = 'SOBRANTE',
  BILLETE_NO_RECIBIBLE = 'BILLETE_NO_RECIBIBLE',
  NO_RECIBIDO = 'NO_RECIBIDO',
  OTRO = 'OTRO',
}

export enum EstadoCasoRetiro {
  ABIERTO = 'ABIERTO',
  EN_INVESTIGACION = 'EN_INVESTIGACION',
  RESUELTO = 'RESUELTO',
}

/**
 * Conclusión del que investiga.
 *
 * No es lo mismo que CategoriaDiferenciaRetiro: esa la pone el que recibe mientras cuenta, por
 * moneda y sin haber averiguado nada. Esto es lo que se determinó después, uno por caso, y
 * nombra el lado responsable.
 */
export enum VeredictoCasoRetiro {
  ERROR_DE_CONTEO_TESORERIA = 'ERROR_DE_CONTEO_TESORERIA',
  FALTANTE_PDV = 'FALTANTE_PDV',
  SOBRANTE_PDV = 'SOBRANTE_PDV',
  REINTEGRADO = 'REINTEGRADO',
  ASUMIDO_SIN_RESPONSABLE = 'ASUMIDO_SIN_RESPONSABLE',
}

/**
 * Las dos etiquetas del PDV nombran **el sobre**, no la caja del cajero.
 *
 * «Faltante del PDV» se leía como "falta plata en el PDV", que es el sentido inverso: si el
 * cajero declaró 120 y mandó 110, al sobre le faltan 10 y a su caja le sobran esos mismos 10.
 * Decir «vino menos de lo declarado» no deja lugar a las dos lecturas.
 */
export const VEREDICTO_LABEL: Record<string, string> = {
  ERROR_DE_CONTEO_TESORERIA: 'Contó mal tesorería',
  FALTANTE_PDV: 'Vino menos de lo declarado',
  SOBRANTE_PDV: 'Vino más de lo declarado',
  REINTEGRADO: 'Reintegrado después',
  ASUMIDO_SIN_RESPONSABLE: 'Asumido sin responsable',
};

/** Qué exige cada veredicto para poder cerrarse. Espeja las validaciones del backend. */
export const VEREDICTO_EXIGE_RESPONSABLE: string[] = [
  VeredictoCasoRetiro.ERROR_DE_CONTEO_TESORERIA,
  VeredictoCasoRetiro.FALTANTE_PDV,
  VeredictoCasoRetiro.SOBRANTE_PDV,
];

/** Etiquetas para mostrar. El enum viaja en mayúsculas; la UI no. */
export const CATEGORIA_LABEL: Record<string, string> = {
  DIFERENCIA_CONTEO: 'Diferencia de conteo',
  FALTANTE: 'Faltante',
  SOBRANTE: 'Sobrante',
  BILLETE_NO_RECIBIBLE: 'Billete no recibible',
  NO_RECIBIDO: 'No recibido',
  OTRO: 'Otro',
};

export interface RetiroVerificacionDetalle {
  id?: number;
  moneda?: Moneda;
  declarado?: number;
  contado?: number;
  /** contado − declarado. Negativo = faltante, positivo = sobrante. */
  diferencia?: number;
  categoria?: CategoriaDiferenciaRetiro;
}

export interface RetiroVerificacion {
  id?: number;
  retiroId?: number;
  sucursalId?: number;
  usuario?: Usuario;
  creadoEn?: Date;
  resultado?: ResultadoVerificacionRetiro;
  /** Se confirmó lo declarado sin contar por denominación. */
  rapida?: boolean;
  observacion?: string;
  anulada?: boolean;
  detalles?: RetiroVerificacionDetalle[];
}

export interface RetiroCaso {
  id?: number;
  retiroId?: number;
  sucursalId?: number;
  verificacion?: RetiroVerificacion;
  estado?: EstadoCasoRetiro;
  abiertoPor?: Usuario;
  asignadoA?: Usuario;
  resueltoPor?: Usuario;
  creadoEn?: Date;
  resueltoEn?: Date;
  resolucion?: string;
  veredicto?: VeredictoCasoRetiro;
  responsablePersona?: Persona;
  reintegroRetiroId?: number;
  /** El lado que entrega: quién hizo el retiro y de qué caja salió. */
  retiro?: Retiro;
}

/** Lo que se manda al verificar, por moneda. */
export interface ConteoRetiroMonedaInput {
  monedaId: number;
  contado: number;
  categoria?: CategoriaDiferenciaRetiro;
}

/**
 * Conteo a medio hacer, guardado en el navegador.
 *
 * Contar plata se interrumpe: entra alguien, suena el teléfono, se cierra el diálogo sin
 * querer. El borrador permite retomar sin volver a contar todo. Vive en localStorage y no en
 * el backend, así que es de esta máquina: si el retiro se cuenta desde otra PC, no está.
 */
export interface BorradorVerificacion {
  /** Cantidades por valor de billete, por moneda: { monedaId: { valorBillete: cantidad } }. */
  cantidades: { [monedaId: string]: { [valor: string]: number } };
  observacion?: string;
  actualizadoEn: string;
}

/** Clave del borrador. Por retiro, no por caja: dos retiros no comparten conteo. */
export function claveBorrador(retiroId: number, sucursalId: number): string {
  return `frc.verificacion-retiro.${retiroId}.${sucursalId}`;
}
