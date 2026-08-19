import type { Presentacion } from '../../productos/presentacion/presentacion.model';
import { EtapaTransferencia } from './transferencia-etapa.enum';
import type { TransferenciaItem } from './transferencia.model';

/**
 * Confirmar un item en una etapa es copiar lo que trae de la etapa anterior.
 *
 * Vive aparte del componente porque es la regla que fallaba en silencio: cuando la etapa anterior
 * esta vacia la copia trae null y el item queda en "Falta verificar" para siempre, por mas veces que
 * se apriete Confirmar. Aca es una funcion pura y se puede probar sin levantar Angular: los tipos
 * entran como `import type` y lo unico que se importa en runtime es el enum de etapas.
 */
interface DatosDeEtapa {
  cantidad: number;
  presentacion: Presentacion;
  vencimiento: Date;
}

/** Datos de los que copia la etapa indicada. Null si en esa etapa no se confirman items. */
function datosDeOrigen(
  item: TransferenciaItem,
  etapa: EtapaTransferencia
): DatosDeEtapa {
  switch (etapa) {
    case EtapaTransferencia.PREPARACION_MERCADERIA:
      return {
        cantidad: item?.cantidadPreTransferencia,
        presentacion: item?.presentacionPreTransferencia,
        vencimiento: item?.vencimientoPreTransferencia,
      };
    case EtapaTransferencia.TRANSPORTE_VERIFICACION:
      return {
        cantidad: item?.cantidadPreparacion,
        presentacion: item?.presentacionPreparacion,
        vencimiento: item?.vencimientoPreparacion,
      };
    case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
      return {
        cantidad: item?.cantidadTransporte,
        presentacion: item?.presentacionTransporte,
        vencimiento: item?.vencimientoTransporte,
      };
    default:
      return null;
  }
}

/**
 * True si el item tiene de donde copiar. Un item que no paso por la etapa anterior no se puede
 * confirmar: corresponde rechazarlo, porque esa mercaderia no viajo.
 */
export function puedeConfirmar(
  item: TransferenciaItem,
  etapa: EtapaTransferencia
): boolean {
  const origen = datosDeOrigen(item, etapa);
  return origen != null && origen.cantidad != null;
}

/** Nombre de la etapa de la que se copia, para poder explicarle al usuario que es lo que falta. */
export function nombreEtapaDeOrigen(etapa: EtapaTransferencia): string {
  switch (etapa) {
    case EtapaTransferencia.PREPARACION_MERCADERIA:
      return 'pre-transferencia';
    case EtapaTransferencia.TRANSPORTE_VERIFICACION:
      return 'preparación';
    case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
      return 'transporte';
    default:
      return null;
  }
}

/**
 * Escribe en {@code item} los datos de la etapa confirmada y lo devuelve.
 *
 * Si no hay de donde copiar no toca nada: nunca escribe nulls, que era justamente el bug. El
 * llamador es el que decide sobre que instancia trabajar.
 */
export function aplicarConfirmacion(
  item: TransferenciaItem,
  etapa: EtapaTransferencia
): TransferenciaItem {
  if (!puedeConfirmar(item, etapa)) return item;

  const origen = datosDeOrigen(item, etapa);
  switch (etapa) {
    case EtapaTransferencia.PREPARACION_MERCADERIA:
      item.cantidadPreparacion = origen.cantidad;
      item.presentacionPreparacion = origen.presentacion;
      item.vencimientoPreparacion = origen.vencimiento;
      break;
    case EtapaTransferencia.TRANSPORTE_VERIFICACION:
      item.cantidadTransporte = origen.cantidad;
      item.presentacionTransporte = origen.presentacion;
      item.vencimientoTransporte = origen.vencimiento;
      break;
    case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
      item.cantidadRecepcion = origen.cantidad;
      item.presentacionRecepcion = origen.presentacion;
      item.vencimientoRecepcion = origen.vencimiento;
      break;
  }
  return item;
}
