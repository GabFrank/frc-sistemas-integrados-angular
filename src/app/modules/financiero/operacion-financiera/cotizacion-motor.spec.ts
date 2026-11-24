import { cotizacionCruzada, cotizacionDeMontos, origenEsMayor, recalcular } from './cotizacion-motor';

/** La tabla de casos de desk #720 §3. */
describe('cotizacion-motor', () => {
  const GS = { id: 1, principal: true };
  const US = { id: 2, valorEnGs: 6400 };
  const RS = { id: 3, valorEnGs: 1200 };

  it('decide la moneda mayor sin hardcodear', () => {
    expect(origenEsMayor(GS, US)).toBeFalse();          // Gs → US$: vale 1 el dólar
    expect(origenEsMayor(US, GS)).toBeTrue();
    expect(origenEsMayor(RS, US)).toBeFalse();          // R$ → US$
    expect(origenEsMayor(US, RS)).toBeTrue();
    expect(origenEsMayor(GS, RS)).toBeFalse();
    // Sin cotización cargada decide por los montos (monto menor = mayor valor); sin montos, no decide.
    expect(origenEsMayor({ id: 4 }, { id: 5 }, 100, 560)).toBeTrue();
    expect(origenEsMayor({ id: 4 }, { id: 5 })).toBeNull();
  });

  it('cotización fija: escribir el origen calcula el destino, en los dos sentidos', () => {
    expect(recalcular('origen', true, { origen: 100, cotizacion: 5.6 }, true).montoDestino).toBeCloseTo(560);   // US$→R$
    expect(recalcular('origen', true, { origen: 560, cotizacion: 5.6 }, false).montoDestino).toBeCloseTo(100);  // R$→US$
    expect(recalcular('origen', true, { origen: 640000, cotizacion: 6400 }, false).montoDestino).toBeCloseTo(100); // Gs→US$
  });

  it('cotización fija: escribir el destino calcula el origen y la cotización no se mueve', () => {
    const r = recalcular('destino', true, { origen: 1, destino: 100, cotizacion: 5.6 }, false);
    expect(r.montoOrigen).toBeCloseTo(560);
    expect(r.cotizacion).toBeUndefined();
  });

  it('escribir los dos montos con la cotización fija no la recalcula nunca', () => {
    let v = { origen: 100, destino: 560, cotizacion: 5.6 };
    for (const campo of ['origen', 'destino', 'origen', 'destino'] as const) {
      expect(recalcular(campo, true, v, true).cotizacion).toBeUndefined();
    }
  });

  it('cotización vacía: se calcula de los montos y se recalcula al editarlos (ticket de casa de cambio)', () => {
    expect(recalcular('destino', false, { origen: 560, destino: 100 }, false).cotizacion).toBeCloseTo(5.6);
    expect(recalcular('origen', false, { origen: 600, destino: 100 }, false).cotizacion).toBeCloseTo(6);
    expect(recalcular('origen', false, { origen: 600 }, false)).toEqual({});
  });

  it('escribir la cotización con un monto completa el otro', () => {
    expect(recalcular('cotizacion', true, { destino: 100, cotizacion: 5.6 }, false).montoOrigen).toBeCloseTo(560);
  });

  it('la cruzada del sistema sale de las dos contra el guaraní', () => {
    expect(cotizacionCruzada(US, RS)).toBeCloseTo(5.333, 3);
    expect(cotizacionCruzada(US, { id: 9 })).toBeNull();
    expect(cotizacionDeMontos(100, 560, true)).toBeCloseTo(5.6);
  });
});
