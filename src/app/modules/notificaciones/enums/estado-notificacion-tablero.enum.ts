export enum EstadoNotificacionTablero {
  POR_VERIFICAR = 'POR_VERIFICAR',
  EN_PROCESO = 'EN_PROCESO',
  VERIFICADO = 'VERIFICADO'
}

export const ESTADOS_TABLERO_LABELS = {
  [EstadoNotificacionTablero.POR_VERIFICAR]: 'Por Verificar',
  [EstadoNotificacionTablero.EN_PROCESO]: 'En Proceso',
  [EstadoNotificacionTablero.VERIFICADO]: 'Verificado'
};

