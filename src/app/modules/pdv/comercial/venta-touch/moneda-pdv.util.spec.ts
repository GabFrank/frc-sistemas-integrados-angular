import {
  cotizacionEmpresa,
  equivalenteEmpresa,
  factorABase,
  multiplosRedondeo,
  redondear,
  redondearDescuento,
  saldoCerrado,
} from "./moneda-pdv.util";

const PYG = { id: 1, cambio: 1, decimales: 0 };
const BRL = { id: 2, cambio: 1200, decimales: 2 };
const USD = { id: 3, cambio: 6100, decimales: 2 };

/** El cálculo que traía el diálogo del descuento, copiado tal cual, como referencia de la invariancia. */
function descuentoDeSiempre(discount: number): number {
  const originalDiscount = discount;
  const remainder500 = discount % 500;
  const remainder1000 = discount % 1000;
  if (remainder500 <= 250 && remainder500 !== 0) {
    discount -= remainder500;
  } else if (remainder500 > 250) {
    if (discount + (500 - remainder500) <= originalDiscount) {
      discount += 500 - remainder500;
    } else {
      discount -= remainder500;
    }
  } else if (remainder1000 !== 0) {
    if (discount + (1000 - remainder1000) <= originalDiscount) {
      discount += 1000 - remainder1000;
    }
  }
  return discount;
}

describe("moneda-pdv.util", () => {
  describe("bodega: base == empresa (guaraní, 0 decimales)", () => {
    it("redondear con 0 decimales es Math.round", () => {
      for (const x of [0, 0.4, 0.5, 1.5, 2.5, 12345.49, 12345.5, 99999.999, 0.1 * 3 * 1000, 1234.5678]) {
        expect(redondear(x, 0)).toBe(Math.round(x));
      }
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 1e7;
        expect(redondear(x, 0)).toBe(Math.round(x));
      }
    });

    it("cotizacionEmpresa de la empresa es 1 y el factor a base de la misma moneda es 1", () => {
      expect(cotizacionEmpresa(PYG, PYG)).toBe(1);
      expect(factorABase(PYG, PYG, PYG)).toBe(1);
    });

    it("el factor de las otras monedas es su cambio, como antes", () => {
      expect(factorABase(BRL, PYG, PYG)).toBe(1200);
      expect(factorABase(USD, PYG, PYG)).toBe(6100);
      expect(factorABase(USD, PYG, { id: 1 })).toBe(6100); // empresa sin cambio cuenta como 1
    });

    it("equivalente con cotización 1 no cambia el monto", () => {
      expect(equivalenteEmpresa(150000, 1, 0)).toBe(150000);
    });

    it("el saldo solo cierra en 0 (sin media unidad de tolerancia)", () => {
      expect(saldoCerrado(0, 0)).toBe(true);
      expect(saldoCerrado(0.4, 0)).toBe(false);
      expect(saldoCerrado(-0.4, 0)).toBe(false);
      expect(saldoCerrado(1, 0)).toBe(false);
      expect(saldoCerrado(null, 0)).toBe(false);
    });

    it("múltiplos 500 / 1000 y el redondeo del descuento es el de siempre", () => {
      expect(multiplosRedondeo(0)).toEqual([500, 1000]);
      for (let i = 0; i < 3000; i++) {
        const d = Math.random() * 500000;
        expect(redondearDescuento(d, 0)).toBe(descuentoDeSiempre(d));
      }
      for (const d of [0, 500, 1000, 7500, 12250, 12251, 12750, 100000]) {
        expect(redondearDescuento(d, 0)).toBe(descuentoDeSiempre(d));
      }
    });
  });

  describe("PDV en dólares, empresa en guaraníes", () => {
    it("redondea HALF_UP con decimales exactos", () => {
      expect(redondear(1.005, 2)).toBe(1.01);
      expect(redondear(5.854, 2)).toBe(5.85);
      expect(redondear(5.855, 2)).toBe(5.86);
      expect(redondear(2.5, 0)).toBe(3);
    });

    it("cotización de la empresa y factores", () => {
      expect(cotizacionEmpresa(USD, PYG)).toBe(6100);
      expect(cotizacionEmpresa(PYG, PYG)).toBe(1);
      expect(cotizacionEmpresa({ id: 9, cambio: null }, PYG)).toBeNull();
      expect(cotizacionEmpresa({ id: 9, cambio: 0 }, PYG)).toBeNull();
      expect(factorABase(USD, USD, PYG)).toBe(1);
      expect(factorABase(PYG, USD, PYG)).toBeCloseTo(1 / 6100, 12);
      expect(factorABase(BRL, USD, PYG)).toBeCloseTo(1200 / 6100, 12);
      expect(factorABase({ id: 9 }, USD, PYG)).toBeNull();
    });

    it("equivalente en guaraníes: 5,85 × 6100 = 35685", () => {
      expect(equivalenteEmpresa(5.85, 6100, 0)).toBe(35685);
      expect(equivalenteEmpresa(0.99, 6100, 0)).toBe(6039);
      expect(equivalenteEmpresa(1.0001, 6100, 0)).toBe(6101);
    });

    it("el saldo cierra por debajo de medio centavo", () => {
      expect(saldoCerrado(0, 2)).toBe(true);
      expect(saldoCerrado(0.004, 2)).toBe(true);
      expect(saldoCerrado(-0.004, 2)).toBe(true);
      expect(saldoCerrado(0.005, 2)).toBe(false);
      expect(saldoCerrado(0.01, 2)).toBe(false);
      // ruido típico del flotante
      const saldo = 5.85 - (35685 / 6100);
      expect(saldoCerrado(saldo, 2)).toBe(true);
    });

    it("múltiplos y redondeo del descuento en centavos", () => {
      expect(multiplosRedondeo(2)).toEqual([0.05, 0.1, 1]);
      expect(redondearDescuento(0.97, 2)).toBeCloseTo(0.95, 10); // resto 2 <= 2,5: baja a 0,95
      expect(redondearDescuento(0.93, 2)).toBeCloseTo(0.9, 10);
      expect(redondearDescuento(0.9, 2)).toBeCloseTo(0.9, 10);
      expect(redondearDescuento(0.9, 2)).toBeLessThanOrEqual(0.9);
      for (let i = 0; i < 500; i++) {
        const d = Math.round(Math.random() * 10000) / 100;
        expect(redondearDescuento(d, 2)).toBeLessThanOrEqual(d + 1e-9);
      }
    });
  });
});
