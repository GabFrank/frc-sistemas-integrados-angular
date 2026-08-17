import type { Presentacion } from '../../productos/presentacion/presentacion.model';
import {
  aplicarConfirmacion,
  nombreEtapaDeOrigen,
  puedeConfirmar,
} from './transferencia-item-confirmacion';
import { EtapaTransferencia } from './transferencia-etapa.enum';
import type { TransferenciaItem } from './transferencia.model';

/**
 * Confirmar un item copia los datos de la etapa anterior. Cuando esa etapa esta vacia, la copia
 * traia null y el item quedaba en "Falta verificar" para siempre: es lo que les pasa a los items
 * 65830 y 65989 de la transferencia 6290, que no se pueden verificar por mas que se clickee.
 */
describe('transferencia-item-confirmacion', () => {
  const presentacion = { id: 13261 } as Presentacion;

  function item(valores: Partial<TransferenciaItem> = {}): TransferenciaItem {
    return {
      id: 65830,
      cantidadPreTransferencia: 3,
      presentacionPreTransferencia: presentacion,
      ...valores,
    } as TransferenciaItem;
  }

  describe('puedeConfirmar', () => {
    it('es false en recepcion cuando el item no tiene datos de transporte', () => {
      const sinTransporte = item({ cantidadTransporte: null });

      expect(
        puedeConfirmar(sinTransporte, EtapaTransferencia.RECEPCION_EN_VERIFICACION)
      ).toBe(false);
    });

    it('es true en recepcion cuando el item tiene datos de transporte', () => {
      const conTransporte = item({
        cantidadTransporte: 2,
        presentacionTransporte: presentacion,
      });

      expect(
        puedeConfirmar(conTransporte, EtapaTransferencia.RECEPCION_EN_VERIFICACION)
      ).toBe(true);
    });

    it('es false en transporte cuando el item no tiene datos de preparacion', () => {
      const sinPreparacion = item({ cantidadPreparacion: null });

      expect(
        puedeConfirmar(sinPreparacion, EtapaTransferencia.TRANSPORTE_VERIFICACION)
      ).toBe(false);
    });

    it('es true en preparacion porque copia de pre-transferencia, que siempre tiene cantidad', () => {
      expect(
        puedeConfirmar(item(), EtapaTransferencia.PREPARACION_MERCADERIA)
      ).toBe(true);
    });

    it('es false en una etapa donde no se confirman items', () => {
      expect(
        puedeConfirmar(item(), EtapaTransferencia.TRANSPORTE_EN_CAMINO)
      ).toBe(false);
    });
  });

  describe('aplicarConfirmacion', () => {
    it('copia transporte a recepcion', () => {
      const vencimiento = new Date(2027, 0, 31);
      const origen = item({
        cantidadTransporte: 2,
        presentacionTransporte: presentacion,
        vencimientoTransporte: vencimiento,
      });

      const confirmado = aplicarConfirmacion(
        origen,
        EtapaTransferencia.RECEPCION_EN_VERIFICACION
      );

      expect(confirmado.cantidadRecepcion).toBe(2);
      expect(confirmado.presentacionRecepcion).toBe(presentacion);
      expect(confirmado.vencimientoRecepcion).toBe(vencimiento);
    });

    it('copia pre-transferencia a preparacion', () => {
      const confirmado = aplicarConfirmacion(
        item(),
        EtapaTransferencia.PREPARACION_MERCADERIA
      );

      expect(confirmado.cantidadPreparacion).toBe(3);
      expect(confirmado.presentacionPreparacion).toBe(presentacion);
    });

    it('no escribe null en la etapa cuando la anterior esta vacia', () => {
      const sinTransporte = item({ cantidadTransporte: null });

      const confirmado = aplicarConfirmacion(
        sinTransporte,
        EtapaTransferencia.RECEPCION_EN_VERIFICACION
      );

      expect(confirmado.cantidadRecepcion).toBeUndefined();
      expect(confirmado.presentacionRecepcion).toBeUndefined();
    });
  });

  describe('nombreEtapaDeOrigen', () => {
    it('nombra la etapa que hay que completar antes', () => {
      expect(
        nombreEtapaDeOrigen(EtapaTransferencia.RECEPCION_EN_VERIFICACION)
      ).toBe('transporte');
    });
  });
});
