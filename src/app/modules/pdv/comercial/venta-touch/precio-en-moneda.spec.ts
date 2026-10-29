import { Moneda } from "../../../financiero/moneda/moneda.model";
import { resolverPrecioDeItem } from "./precio-en-moneda";

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
});
