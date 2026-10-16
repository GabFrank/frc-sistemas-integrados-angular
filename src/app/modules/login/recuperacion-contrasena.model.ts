/** Respuestas de /public/recuperacion-contrasena del central. */

export interface CaptchaRecuperacion {
  id: string;
  /** PNG en base64. */
  imagen: string;
}

export interface VerificacionRecuperacion {
  tipo: 'CORREO' | 'SIN_CORREO';
  solicitudId?: number;
  emailEnmascarado?: string;
  minutosVigencia?: number;
  verificacionToken?: string;
}

export interface SolicitudRrhhCreada {
  solicitudId: number;
  codigoSecreto: string;
  mensajeWhatsapp: string;
  horasParaAprobar: number;
}

export interface EstadoRecuperacion {
  solicitudId: number;
  tipo: 'CORREO' | 'RRHH';
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA' | 'COMPLETADA' | 'ANULADA';
  motivoRechazo?: string;
  puedeRestablecer: boolean;
  mensaje: string;
}
