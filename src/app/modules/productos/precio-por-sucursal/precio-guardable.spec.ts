import { esPrecioGuardable } from "./precio-guardable";

describe("esPrecioGuardable", () => {
  it("acepta un precio de 1 o más, en alta y en edición", () => {
    expect(esPrecioGuardable(1)).toBeTrue();
    expect(esPrecioGuardable(65000)).toBeTrue();
    expect(esPrecioGuardable("5000")).toBeTrue();
    expect(esPrecioGuardable(5000, 0)).toBeTrue();
  });

  it("no acepta cero, negativos, fracciones menores a 1 ni texto en un alta", () => {
    expect(esPrecioGuardable(0)).toBeFalse();
    expect(esPrecioGuardable("0")).toBeFalse();
    expect(esPrecioGuardable(-5)).toBeFalse();
    expect(esPrecioGuardable(0.5)).toBeFalse();
    expect(esPrecioGuardable("abc")).toBeFalse();
    expect(esPrecioGuardable("")).toBeFalse();
    expect(esPrecioGuardable(null)).toBeFalse();
    expect(esPrecioGuardable(undefined)).toBeFalse();
  });

  it("no acepta bajar a cero un precio que tenía valor", () => {
    expect(esPrecioGuardable(0, 5000)).toBeFalse();
  });

  it("deja guardar un precio viejo en cero si el valor no cambia", () => {
    expect(esPrecioGuardable(0, 0)).toBeTrue();
    expect(esPrecioGuardable("0", 0)).toBeTrue();
  });
});
