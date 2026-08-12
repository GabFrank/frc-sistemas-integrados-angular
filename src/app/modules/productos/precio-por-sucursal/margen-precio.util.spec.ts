import { evaluarMargenPrecio, MARGEN_MINIMO_PORCENTAJE } from './margen-precio.util';

describe('evaluarMargenPrecio', () => {
  it('avisa cuando el margen queda por debajo del mínimo', () => {
    const res = evaluarMargenPrecio(12000, 10000, 1);

    expect(res.debeAvisar).toBeTrue();
    expect(res.margenPorcentaje).toBeCloseTo(20, 5);
    expect(res.costoPresentacion).toBe(10000);
    expect(res.precioMinimoSugerido).toBeCloseTo(13000, 5);
  });

  it('no avisa cuando el margen supera el mínimo', () => {
    const res = evaluarMargenPrecio(15000, 10000, 1);

    expect(res.debeAvisar).toBeFalse();
    expect(res.margenPorcentaje).toBeCloseTo(50, 5);
  });

  it('no avisa cuando el margen es exactamente el mínimo', () => {
    const res = evaluarMargenPrecio(13000, 10000, 1);

    expect(res.margenPorcentaje).toBeCloseTo(MARGEN_MINIMO_PORCENTAJE, 5);
    expect(res.debeAvisar).toBeFalse();
  });

  it('multiplica el costo por la cantidad de la presentación', () => {
    // Una caja de 12 unidades a 1.000 la unidad cuesta 12.000: 14.220 deja 18,5%.
    const res = evaluarMargenPrecio(14220, 1000, 12);

    expect(res.costoPresentacion).toBe(12000);
    expect(res.margenPorcentaje).toBeCloseTo(18.5, 5);
    expect(res.debeAvisar).toBeTrue();
    expect(res.precioMinimoSugerido).toBeCloseTo(15600, 5);
  });

  it('trata una cantidad nula o cero como 1', () => {
    expect(evaluarMargenPrecio(12000, 10000, null).costoPresentacion).toBe(10000);
    expect(evaluarMargenPrecio(12000, 10000, 0).costoPresentacion).toBe(10000);
  });

  it('avisa con margen negativo cuando el precio está por debajo del costo', () => {
    const res = evaluarMargenPrecio(8000, 10000, 1);

    expect(res.margenPorcentaje).toBeCloseTo(-20, 5);
    expect(res.debeAvisar).toBeTrue();
  });

  it('no evalúa nada cuando el producto no tiene costo cargado', () => {
    expect(evaluarMargenPrecio(12000, null, 1)).toBeNull();
    expect(evaluarMargenPrecio(12000, 0, 1)).toBeNull();
    expect(evaluarMargenPrecio(12000, -5, 1)).toBeNull();
  });

  it('no evalúa nada cuando el precio no es un número válido', () => {
    expect(evaluarMargenPrecio(null, 10000, 1)).toBeNull();
    expect(evaluarMargenPrecio(Number('abc'), 10000, 1)).toBeNull();
  });
});
