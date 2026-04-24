export enum MotivoModificacion {
  PRODUCTO_DANADO = 'PRODUCTO_DANADO',
  PRODUCTO_VENCIDO = 'PRODUCTO_VENCIDO',
  PRODUCTO_INCORRECTO = 'PRODUCTO_INCORRECTO',
  CANTIDAD_INCORRECTA = 'CANTIDAD_INCORRECTA',
  PRESENTACION_INCORRECTA = 'PRESENTACION_INCORRECTA',
  CALIDAD_INSUFICIENTE = 'CALIDAD_INSUFICIENTE',
  EMBALAJE_DANADO = 'EMBALAJE_DANADO',
  FALTA_DE_DOCUMENTACION = 'FALTA_DE_DOCUMENTACION',
  ERROR_EN_PEDIDO = 'ERROR_EN_PEDIDO',
  OTRO = 'OTRO'
}

export const MOTIVO_MODIFICACION_LABELS: { [key in MotivoModificacion]: string } = {
  [MotivoModificacion.PRODUCTO_DANADO]: 'Producto Dañado',
  [MotivoModificacion.PRODUCTO_VENCIDO]: 'Producto Vencido',
  [MotivoModificacion.PRODUCTO_INCORRECTO]: 'Producto Incorrecto',
  [MotivoModificacion.CANTIDAD_INCORRECTA]: 'Cantidad Incorrecta',
  [MotivoModificacion.PRESENTACION_INCORRECTA]: 'Presentación Incorrecta',
  [MotivoModificacion.CALIDAD_INSUFICIENTE]: 'Calidad Insuficiente',
  [MotivoModificacion.EMBALAJE_DANADO]: 'Embalaje Dañado',
  [MotivoModificacion.FALTA_DE_DOCUMENTACION]: 'Falta de Documentación',
  [MotivoModificacion.ERROR_EN_PEDIDO]: 'Error en Pedido',
  [MotivoModificacion.OTRO]: 'Otro'
}; 