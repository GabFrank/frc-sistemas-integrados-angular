import { Usuario } from '../../personas/usuarios/usuario.model';

export type EstadoRecuperacionContrasena = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'COMPLETADA' | 'ANULADA';

/** Solicitud de "¿Olvidó su contraseña?" de un usuario sin correo, que aprueba RRHH. */
export class SolicitudRecuperacionContrasena {
  id: number;
  usuario: Usuario;
  tipo: 'CORREO' | 'RRHH';
  estado: EstadoRecuperacionContrasena;
  vencida: boolean;
  email: string;
  /** El que informó el usuario: compararlo con usuario.persona.telefono. */
  telefono: string;
  observacion: string;
  intentos: number;
  ip: string;
  venceEn: Date;
  resueltoPor: Usuario;
  resueltoEn: Date;
  motivoRechazo: string;
  completadoEn: Date;
  creadoEn: Date;
}
