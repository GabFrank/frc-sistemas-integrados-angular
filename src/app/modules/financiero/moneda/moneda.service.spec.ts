import { MonedaService } from './moneda.service';
import { Moneda } from './moneda.model';

describe('MonedaService', () => {
  // Las máscaras no usan las dependencias: se construye sin TestBed.
  const service = new MonedaService(null, null, null, null, null, null, null, null);
  const moneda = (m: Partial<Moneda>) => m as Moneda;

  describe('currencyOptionsCostoByMoneda (#711)', () => {
    it('guaraní: la máscara de siempre, sin decimales', () => {
      expect(service.currencyOptionsCostoByMoneda(moneda({ decimales: 0 }))).toBe(service.currencyOptionsGuarani);
      expect(service.currencyOptionsCostoByMoneda(moneda({ denominacion: 'GUARANI' }))).toBe(service.currencyOptionsGuarani);
    });

    it('dólar (2 decimales): 4 decimales sin tocar la máscara compartida', () => {
      const options = service.currencyOptionsCostoByMoneda(moneda({ decimales: 2 }));
      expect(options.precision).toBe(4);
      expect(service.currencyOptionsNoGuarani.precision).toBe(2);
    });

    it('moneda sin decimales informados ni GUARANI: 4', () => {
      expect(service.decimalesCosto(moneda({ denominacion: 'DOLAR' }))).toBe(4);
      expect(service.decimalesCosto(null)).toBe(4);
    });

    it('moneda con más de 4 decimales: los suyos', () => {
      expect(service.currencyOptionsCostoByMoneda(moneda({ decimales: 6 })).precision).toBe(6);
    });
  });
});
