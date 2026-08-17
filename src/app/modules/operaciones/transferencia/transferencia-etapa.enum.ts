/**
 * Etapas por las que pasa una transferencia, en orden de avance.
 *
 * Vive en su propio archivo, sin un solo import, para que la logica que depende solo de la etapa
 * pueda usarla sin arrastrar `transferencia.model` (que a traves de dateUtils termina importando
 * @angular/common y obliga a levantar todo Angular para probar una funcion pura).
 *
 * `transferencia.model` la re-exporta, asi que los import existentes siguen funcionando igual.
 */
export enum EtapaTransferencia {
  PRE_TRANSFERENCIA_CREACION = 'PRE_TRANSFERENCIA_CREACION',
  PRE_TRANSFERENCIA_ORIGEN = 'PRE_TRANSFERENCIA_ORIGEN',
  PREPARACION_MERCADERIA = 'PREPARACION_MERCADERIA',
  PREPARACION_MERCADERIA_CONCLUIDA = 'PREPARACION_MERCADERIA_CONCLUIDA',
  TRANSPORTE_VERIFICACION = 'TRANSPORTE_VERIFICACION',
  TRANSPORTE_EN_CAMINO = 'TRANSPORTE_EN_CAMINO',
  TRANSPORTE_EN_DESTINO = 'TRANSPORTE_EN_DESTINO',
  RECEPCION_EN_VERIFICACION = 'RECEPCION_EN_VERIFICACION',
  RECEPCION_CONCLUIDA = 'RECEPCION_CONCLUIDA',
}
