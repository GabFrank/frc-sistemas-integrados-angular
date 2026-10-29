import {
  convertirConRastro,
  convertirPrecioLista,
  cotizacionEntreMonedas,
  redondearMonto,
} from './precio-moneda.util';

/** Los mismos casos que RastroPrecioTest de la filial: las dos puntas tienen que dar igual. */
describe('convertirPrecioLista (regla de RastroPrecio de la filial)', () => {
  it('dólares a guaraníes: un solo redondeo a 0 decimales', () => {
    expect(convertirPrecioLista(4.39, 5980, 0)).toBe(26252);
  });

  it('con decimales redondea HALF_UP', () => {
    expect(convertirPrecioLista(10000, 1 / 5980, 2)).toBe(1.67);
  });

  it('el medio se aleja del cero (HALF_UP), sin error binario', () => {
    expect(convertirPrecioLista(1.005, 1, 2)).toBe(1.01);
    expect(convertirPrecioLista(0.125, 1, 2)).toBe(0.13);
    expect(convertirPrecioLista(2.5, 1, 0)).toBe(3);
    expect(convertirPrecioLista(0.5, 1, 0)).toBe(1);
    expect(convertirPrecioLista(2.4999, 1, 0)).toBe(2);
  });

  it('multiplica decimal exacto, no el valor binario del double', () => {
    // 0.1 * 3 = 0.30000000000000004 en binario; decimal exacto da 0,3
    expect(convertirPrecioLista(0.1, 3, 1)).toBe(0.3);
    expect(convertirPrecioLista(19.99, 100, 0)).toBe(1999);
  });

  it('acepta números en notación científica', () => {
    expect(convertirPrecioLista(1e-7, 1e7, 0)).toBe(1);
    expect(convertirPrecioLista(1e21, 1, 0)).toBe(1e21);
  });

  it('rastro incompleto: no hay precio', () => {
    expect(convertirPrecioLista(null, 5980, 0)).toBeNull();
    expect(convertirPrecioLista(4.39, null, 0)).toBeNull();
    expect(convertirPrecioLista(4.39, 0, 0)).toBeNull();
    expect(convertirPrecioLista(4.39, -1, 0)).toBeNull();
    expect(convertirPrecioLista(NaN, 5980, 0)).toBeNull();
  });

  it('decimales ausentes cuentan como 0', () => {
    expect(convertirPrecioLista(4.39, 5980, null)).toBe(26252);
    expect(convertirPrecioLista(4.39, 5980, undefined)).toBe(26252);
  });
});

describe('redondearMonto', () => {
  it('HALF_UP por decimales de la moneda', () => {
    expect(redondearMonto(1.005, 2)).toBe(1.01);
    expect(redondearMonto(26252.5, 0)).toBe(26253);
    expect(redondearMonto(null, 2)).toBeNull();
  });
});

describe('cotizacionEntreMonedas', () => {
  it('cambio del precio sobre cambio del cobro; el guaraní es 1', () => {
    expect(cotizacionEntreMonedas(5980, 1)).toBe(5980);
    expect(cotizacionEntreMonedas(5980, null)).toBe(5980);
    expect(cotizacionEntreMonedas(1, 5980)).toBeCloseTo(1 / 5980, 12);
  });

  it('sin cambio de la moneda del precio no se puede convertir', () => {
    expect(cotizacionEntreMonedas(null, 1)).toBeNull();
    expect(cotizacionEntreMonedas(0, 1)).toBeNull();
    expect(cotizacionEntreMonedas(5980, 0)).toBeNull();
  });
});

describe('convertirConRastro', () => {
  it('arma el precio y el rastro que viaja con el ítem', () => {
    expect(convertirConRastro(4.39, '3', 5980, 1, 0)).toEqual({
      precio: 26252, precioMonedaId: 3, precioLista: 4.39, precioCotizacion: 5980,
    });
  });

  it('sin cotización devuelve null (no se vende)', () => {
    expect(convertirConRastro(4.39, 3, null, 1, 0)).toBeNull();
    expect(convertirConRastro(4.39, 3, 0, 1, 0)).toBeNull();
  });
});
