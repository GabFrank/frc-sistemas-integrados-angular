import { costoEnMonedaDelPrecio, evaluarMargenPrecio, MARGEN_MINIMO_PORCENTAJE } from './margen-precio.util';

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

describe('costoEnMonedaDelPrecio', () => {
  const PYG = { id: 1, cambio: 1 };
  const USD = { id: 3, cambio: 5980 };

  it('precio en la moneda de la empresa: el costo de la empresa, tal cual', () => {
    expect(costoEnMonedaDelPrecio(10000, PYG, PYG)).toBe(10000);
    expect(costoEnMonedaDelPrecio(10000, null, PYG)).toBe(10000);
    // ids como texto (GraphQL) y como número
    expect(costoEnMonedaDelPrecio(10000, { id: '1' }, { id: 1 })).toBe(10000);
    expect(costoEnMonedaDelPrecio(null, PYG, PYG)).toBeNull();
  });

  it('moneda de costeo igual a la del precio: ese costo, sin convertir', () => {
    const costeo = { moneda: { id: '3' }, costoMedio: 2.5 };
    expect(costoEnMonedaDelPrecio(14950, USD, PYG, costeo)).toBe(2.5);
  });

  it('moneda de costeo distinta: convierte el costo de la empresa con los cambios del comercio', () => {
    const costeo = { moneda: { id: 2 }, costoMedio: 99 };
    expect(costoEnMonedaDelPrecio(11960, USD, PYG, costeo)).toBeCloseTo(2, 10);
    expect(costoEnMonedaDelPrecio(11960, USD, PYG, null)).toBeCloseTo(2, 10);
  });

  it('sin cambio de la moneda del precio o sin costo: null (no se avisa)', () => {
    expect(costoEnMonedaDelPrecio(11960, { id: 3, cambio: null }, PYG)).toBeNull();
    expect(costoEnMonedaDelPrecio(0, USD, PYG)).toBeNull();
    expect(costoEnMonedaDelPrecio(null, USD, PYG)).toBeNull();
  });

  it('el margen se calcula en la moneda del precio', () => {
    const costo = costoEnMonedaDelPrecio(11960, USD, PYG); // US$ 2
    const res = evaluarMargenPrecio(2.2, costo, 1);
    expect(res.margenPorcentaje).toBeCloseTo(10, 5);
    expect(res.debeAvisar).toBeTrue();
  });
});
