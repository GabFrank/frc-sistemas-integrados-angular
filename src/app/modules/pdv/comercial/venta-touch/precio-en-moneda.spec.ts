import { Moneda } from "../../../financiero/moneda/moneda.model";
import { claveMonedaDePrecio, itemsConMonedaDesactualizada, resolverPrecioDeItem } from "./precio-en-moneda";

const PYG = Object.assign(new Moneda(), { id: 1, denominacion: "GUARANI", simbolo: "Gs.", decimales: 0, cambio: 1 });
const USD = Object.assign(new Moneda(), { id: 3, denominacion: "DOLAR", simbolo: "US$", decimales: 2, cambio: 5980 });
const USD_SIN_CAMBIO = Object.assign(new Moneda(), { id: 3, denominacion: "DOLAR", simbolo: "US$", decimales: 2, cambio: null });

describe("resolverPrecioDeItem", () => {
  const enUsd = new Map<string, Moneda>([["77", { id: "3", denominacion: "DOLAR", simbolo: "US$", decimales: 2 } as any]]);

  it("precio fuera del mapa: se vende como siempre", () => {
    expect(resolverPrecioDeItem(5, 10000, enUsd, [PYG, USD], PYG)).toEqual({ tipo: "empresa" });
    expect(resolverPrecioDeItem(5, 10000, new Map(), [PYG, USD], PYG)).toEqual({ tipo: "empresa" });
    expect(resolverPrecioDeItem(null, 10000, enUsd, [PYG, USD], PYG)).toEqual({ tipo: "empresa" });
  });

  it("precio en dólares: convierte con el cambio del comercio y deja el rastro", () => {
    const r = resolverPrecioDeItem("77", 4.39, enUsd, [PYG, USD], PYG);
    expect(r.tipo).toBe("convertido");
    if (r.tipo === "convertido") {
      expect(r.rastro).toEqual({ precio: 26252, precioMonedaId: 3, precioLista: 4.39, precioCotizacion: 5980 });
      expect(r.textoLista).toContain("US$");
      expect(r.textoLista).toContain("4,39");
    }
  });

  it("sin cambio de la moneda del precio: no se vende", () => {
    const r = resolverPrecioDeItem(77, 4.39, enUsd, [PYG, USD_SIN_CAMBIO], PYG);
    expect(r.tipo).toBe("sinCotizacion");
  });

  it("la moneda de cobro sin cambio cargado cuenta como 1", () => {
    const pygSinCambio = Object.assign(new Moneda(), { id: 1, decimales: 0, cambio: null });
    const r = resolverPrecioDeItem(77, 4.39, enUsd, [pygSinCambio, USD], pygSinCambio);
    expect(r.tipo).toBe("convertido");
  });

  it("en otra moneda y sin moneda de cobro conocida: no se vende (nunca al valor de lista)", () => {
    expect(resolverPrecioDeItem(77, 4.39, enUsd, [USD], null).tipo).toBe("sinCotizacion");
  });

  it("la moneda del precio es la de cobro: nada que convertir", () => {
    const enPyg = new Map<string, Moneda>([["77", { id: 1 } as any]]);
    expect(resolverPrecioDeItem(77, 10000, enPyg, [PYG, USD], PYG)).toEqual({ tipo: "empresa" });
  });

  describe("PDV en otra moneda (Fase 4)", () => {
    it("un precio sin moneda propia está en la de la empresa y se convierte a la del PDV", () => {
      const r = resolverPrecioDeItem(5, 36600, new Map(), [PYG, USD], USD, PYG);
      expect(r.tipo).toBe("convertido");
      if (r.tipo === "convertido") {
        expect(r.rastro.precio).toBe(6);
        expect(r.rastro.precioMonedaId).toBe(1);
      }
    });

    it("un precio en la moneda del PDV no se convierte", () => {
      const enUsd2 = new Map<string, Moneda>([["77", { id: "3", denominacion: "DOLAR", simbolo: "US$", decimales: 2 } as any]]);
      expect(resolverPrecioDeItem(77, 4.39, enUsd2, [PYG, USD], USD, PYG)).toEqual({ tipo: "empresa" });
    });

    it("con el PDV en la moneda de la empresa pasar la empresa no cambia nada", () => {
      expect(resolverPrecioDeItem(5, 10000, new Map(), [PYG, USD], PYG, PYG)).toEqual({ tipo: "empresa" });
    });
  });
});

describe("itemsConMonedaDesactualizada (#709)", () => {
  const usd = { id: "3", denominacion: "DOLAR", simbolo: "US$", decimales: 2 } as any;
  const item = (precioId: any, vista: string | null | undefined) => ({ precioVenta: precioId == null ? null : { id: precioId }, monedaPrecioVista: vista });

  it("precio que pasó a USD después de agregarlo (se agregó en la moneda de la empresa)", () => {
    const vigente = new Map<string, Moneda>([["10", usd]]);
    const a = item(10, null);
    expect(itemsConMonedaDesactualizada([a], vigente)).toEqual([a]);
  });

  it("precio que volvió a la moneda de la empresa (se agregó en USD)", () => {
    const a = item(10, "3");
    expect(itemsConMonedaDesactualizada([a], new Map())).toEqual([a]);
  });

  it("misma moneda que al agregarlo: no se marca", () => {
    const vigente = new Map<string, Moneda>([["10", usd]]);
    expect(itemsConMonedaDesactualizada([item(10, "3"), item(11, null)], vigente)).toEqual([]);
  });

  it("sin precio identificado o sin moneda vista: no se marca", () => {
    const vigente = new Map<string, Moneda>([["10", usd]]);
    expect(itemsConMonedaDesactualizada([item(null, null), item(10, undefined)], vigente)).toEqual([]);
  });

  it("claveMonedaDePrecio: id en texto o null", () => {
    const vigente = new Map<string, Moneda>([["10", usd]]);
    expect(claveMonedaDePrecio(10, vigente)).toBe("3");
    expect(claveMonedaDePrecio("11", vigente)).toBeNull();
    expect(claveMonedaDePrecio(null, vigente)).toBeNull();
  });
});
