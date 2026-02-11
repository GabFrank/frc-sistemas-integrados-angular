export enum MotivoRechazoFisico {
  PRODUCTO_DANADO = 'PRODUCTO_DANADO',
  PRODUCTO_VENCIDO = 'PRODUCTO_VENCIDO',
  PRODUCTO_DIFERENTE = 'PRODUCTO_DIFERENTE',
  CANTIDAD_INCORRECTA = 'CANTIDAD_INCORRECTA',
  CALIDAD_INSUFICIENTE = 'CALIDAD_INSUFICIENTE',
  EMBALAJE_DANADO = 'EMBALAJE_DANADO',
  PRODUCTO_FALTANTE = 'PRODUCTO_FALTANTE',
  FALTA_DOCUMENTACION = 'FALTA_DOCUMENTACION',
  OTRO = 'OTRO'
}

export const MOTIVO_RECHAZO_FISICO_OPTIONS = [
  { value: MotivoRechazoFisico.PRODUCTO_DANADO, label: 'Producto Dañado' },
  { value: MotivoRechazoFisico.PRODUCTO_VENCIDO, label: 'Producto Vencido' },
  { value: MotivoRechazoFisico.PRODUCTO_DIFERENTE, label: 'Producto Diferente al Solicitado' },
  { value: MotivoRechazoFisico.CANTIDAD_INCORRECTA, label: 'Cantidad Incorrecta' },
  { value: MotivoRechazoFisico.CALIDAD_INSUFICIENTE, label: 'Calidad Insuficiente' },
  { value: MotivoRechazoFisico.EMBALAJE_DANADO, label: 'Embalaje Dañado' },
  { value: MotivoRechazoFisico.PRODUCTO_FALTANTE, label: 'Producto Faltante' },
  { value: MotivoRechazoFisico.FALTA_DOCUMENTACION, label: 'Falta Documentación' },
  { value: MotivoRechazoFisico.OTRO, label: 'Otro' }
]; 