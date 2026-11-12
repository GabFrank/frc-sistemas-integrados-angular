import { monedaDelPrecioPrincipalDe, precioPrincipalDePresentacion } from './precio-moneda.service';

const usd: any = { id: 2, simbolo: 'US$', decimales: 2 };

describe('precioPrincipalDePresentacion (#713)', () => {
  it('toma el principal activo, no el primero de la lista', () => {
    const p = { precios: [{ id: 1, principal: false }, { id: 7, principal: true, activo: false }, { id: 9, principal: true, activo: true }] };
    expect(precioPrincipalDePresentacion(p).id).toBe(9);
  });

  it('sin principal activo, el principal inactivo', () => {
    expect(precioPrincipalDePresentacion({ precios: [{ id: 7, principal: true, activo: false }] }).id).toBe(7);
  });

  it('sin precios o sin principal: null', () => {
    expect(precioPrincipalDePresentacion({ precios: [] })).toBeNull();
    expect(precioPrincipalDePresentacion({ precios: [{ id: 1, principal: false }] })).toBeNull();
    expect(precioPrincipalDePresentacion(null)).toBeNull();
  });

  it('no usa precioPrincipal.id (el central puede mandar ahí el id de la presentación)', () => {
    const p = { id: 50, precioPrincipal: { id: 50, precio: 5.85 }, precios: [{ id: 9, precio: 5.85, principal: true }] };
    expect(precioPrincipalDePresentacion(p).id).toBe(9);
  });
});

describe('monedaDelPrecioPrincipalDe', () => {
  it('sigue dando la moneda del precio principal de la presentación principal', () => {
    const producto = { presentaciones: [
      { principal: false, precios: [{ principal: true, moneda: { id: 1 } }] },
      { principal: true, precios: [{ principal: true, activo: true, moneda: usd }] },
    ] };
    expect(monedaDelPrecioPrincipalDe(producto)).toBe(usd);
  });
});
