import { precioEnMonedaEmpresa, textoPrecioEtiqueta } from './etiqueta-precio.util';

describe('textoPrecioEtiqueta', () => {
  it('moneda de la empresa: el texto de siempre, igual byte a byte', () => {
    expect(textoPrecioEtiqueta(26252, null)).toBe('Gs. ' + (26252).toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    expect(textoPrecioEtiqueta(1500000, undefined)).toBe('Gs. 1.500.000');
    expect(textoPrecioEtiqueta(26252.6, null)).toBe('Gs. 26.253');
  });

  it('otra moneda: símbolo y decimales de la moneda', () => {
    expect(textoPrecioEtiqueta(4.39, { simbolo: 'US$', decimales: 2 })).toBe('US$ 4,39');
    expect(textoPrecioEtiqueta(4, { simbolo: 'US$', decimales: 2 })).toBe('US$ 4,00');
    expect(textoPrecioEtiqueta(1234.5, { simbolo: 'R$', decimales: 2 })).toBe('R$ 1.234,50');
    expect(textoPrecioEtiqueta(50, { simbolo: '€', decimales: 0 })).toBe('€ 50');
  });

  it('nunca lleva «Gs.» en otra moneda', () => {
    expect(textoPrecioEtiqueta(4.39, { simbolo: 'US$', decimales: 2 })).not.toContain('Gs.');
  });
});

describe('precioEnMonedaEmpresa', () => {
  it('misma moneda: el mismo número', () => {
    expect(precioEnMonedaEmpresa(26252, null, null)).toBe(26252);
  });

  it('otra moneda: por su cambio; sin cambio, null', () => {
    expect(precioEnMonedaEmpresa(4, {}, 5980)).toBe(23920);
    expect(precioEnMonedaEmpresa(4, {}, null)).toBeNull();
  });
});
