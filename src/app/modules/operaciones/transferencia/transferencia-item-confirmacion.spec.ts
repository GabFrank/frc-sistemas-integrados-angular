import type { Presentacion } from '../../productos/presentacion/presentacion.model';
import {
  aplicarConfirmacion,
  aplicarDesconfirmacion,
  nombreEtapaDeOrigen,
  puedeConfirmar,
  tieneEtapaCargada,
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

  /**
   * #567: despues de des-verificar, la grilla reemplazaba la fila con la respuesta de la mutation,
   * que no trae el producto ni la cantidad pedida; "Confirmar" ya no tenia de donde copiar.
   */
  describe('aplicarDesconfirmacion', () => {
    const vencimiento = new Date(2027, 2, 1);

    /** Item verificado en las tres etapas, como una fila de la grilla (objeto plano, sin metodos). */
    function verificado(): TransferenciaItem {
      return item({
        cantidadPreparacion: 3,
        presentacionPreparacion: presentacion,
        vencimientoPreparacion: vencimiento,
        motivoModificacionPreparacion: 'CANTIDAD_INCORRECTA' as any,
        observacionPreparacion: 'OBS PREP',
        cantidadTransporte: 3,
        presentacionTransporte: presentacion,
        vencimientoTransporte: vencimiento,
        motivoRechazoTransporte: 'PRODUCTO_AVERIADO' as any,
        cantidadRecepcion: 3,
        presentacionRecepcion: presentacion,
        vencimientoRecepcion: vencimiento,
      });
    }

    it('en preparacion vacia solo preparacion y conserva lo pedido y las otras etapas', () => {
      const fila = aplicarDesconfirmacion(verificado(), EtapaTransferencia.PREPARACION_MERCADERIA);

      expect(fila.cantidadPreparacion).toBeNull();
      expect(fila.presentacionPreparacion).toBeNull();
      expect(fila.vencimientoPreparacion).toBeNull();
      expect(fila.motivoModificacionPreparacion).toBeNull();
      expect(fila.motivoRechazoPreparacion).toBeNull();
      expect(fila.observacionPreparacion).toBe('OBS PREP');
      expect(fila.cantidadPreTransferencia).toBe(3);
      expect(fila.presentacionPreTransferencia).toBe(presentacion);
      expect(fila.cantidadTransporte).toBe(3);
      expect(fila.cantidadRecepcion).toBe(3);
    });

    it('en transporte vacia solo transporte', () => {
      const fila = aplicarDesconfirmacion(verificado(), EtapaTransferencia.TRANSPORTE_VERIFICACION);

      expect(fila.cantidadTransporte).toBeNull();
      expect(fila.presentacionTransporte).toBeNull();
      expect(fila.motivoRechazoTransporte).toBeNull();
      expect(fila.cantidadPreparacion).toBe(3);
      expect(fila.cantidadRecepcion).toBe(3);
    });

    it('en recepcion vacia solo recepcion', () => {
      const fila = aplicarDesconfirmacion(verificado(), EtapaTransferencia.RECEPCION_EN_VERIFICACION);

      expect(fila.cantidadRecepcion).toBeNull();
      expect(fila.vencimientoRecepcion).toBeNull();
      expect(fila.cantidadTransporte).toBe(3);
      expect(fila.presentacionTransporte).toBe(presentacion);
    });

    it('en una etapa que no verifica items no toca nada', () => {
      const fila = aplicarDesconfirmacion(verificado(), EtapaTransferencia.TRANSPORTE_EN_CAMINO);

      expect(fila).toEqual(verificado());
    });

    it('sobre una copia no modifica la fila original', () => {
      const original = verificado();

      aplicarDesconfirmacion(Object.assign({}, original), EtapaTransferencia.PREPARACION_MERCADERIA);

      expect(original.cantidadPreparacion).toBe(3);
      expect(original.presentacionPreparacion).toBe(presentacion);
    });

    it('despues de des-verificar se puede volver a confirmar en cada etapa', () => {
      for (const etapa of [
        EtapaTransferencia.PREPARACION_MERCADERIA,
        EtapaTransferencia.TRANSPORTE_VERIFICACION,
        EtapaTransferencia.RECEPCION_EN_VERIFICACION,
      ]) {
        const fila = aplicarDesconfirmacion(verificado(), etapa);

        expect(puedeConfirmar(fila, etapa)).withContext(etapa).toBe(true);
      }
    });
  });

  /** Modificar o rechazar un item cargado tiene que desconfirmar antes: el save es un PATCH (#569). */
  describe('tieneEtapaCargada', () => {
    const campos: [EtapaTransferencia, string, string, string][] = [
      [EtapaTransferencia.PREPARACION_MERCADERIA, 'cantidadPreparacion', 'vencimientoPreparacion', 'motivoRechazoPreparacion'],
      [EtapaTransferencia.TRANSPORTE_VERIFICACION, 'cantidadTransporte', 'vencimientoTransporte', 'motivoRechazoTransporte'],
      [EtapaTransferencia.RECEPCION_EN_VERIFICACION, 'cantidadRecepcion', 'vencimientoRecepcion', 'motivoRechazoRecepcion'],
    ];

    it('es true con cantidad, con vencimiento o con rechazo en la etapa', () => {
      for (const [etapa, cantidad, vencimiento, rechazo] of campos) {
        expect(tieneEtapaCargada(item({ [cantidad]: 5 }), etapa)).withContext(etapa).toBe(true);
        expect(tieneEtapaCargada(item({ [vencimiento]: new Date(2026, 9, 1) }), etapa)).withContext(etapa).toBe(true);
        expect(tieneEtapaCargada(item({ [rechazo]: 'PRODUCTO_VENCIDO' } as any), etapa)).withContext(etapa).toBe(true);
      }
    });

    it('es false con la etapa vacía aunque otras etapas tengan datos', () => {
      const todo: any = {};
      for (const [, c, v, r] of campos) Object.assign(todo, { [c]: 5, [v]: new Date(), [r]: 'PRODUCTO_VENCIDO' });
      for (const [etapa, c, v, r] of campos) {
        const soloOtras = item({ ...todo, [c]: null, [v]: null, [r]: null });
        expect(tieneEtapaCargada(soloOtras, etapa)).withContext(etapa).toBe(false);
      }
    });

    it('es false en una etapa que no verifica ítems', () => {
      const cargado = item({ cantidadPreparacion: 5, cantidadTransporte: 5, cantidadRecepcion: 5 });
      expect(tieneEtapaCargada(cargado, EtapaTransferencia.PRE_TRANSFERENCIA_CREACION)).toBe(false);
      expect(tieneEtapaCargada(cargado, null)).toBe(false);
    });
  });
});
