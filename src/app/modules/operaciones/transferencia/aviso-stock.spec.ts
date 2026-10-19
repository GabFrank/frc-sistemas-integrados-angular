import { decidirAvisoStock, necesitaConfiguracion } from "./aviso-stock";

describe("decidirAvisoStock", () => {
  it("con stock positivo sigue sin avisar", () => {
    expect(decidirAvisoStock(0.5, false, false)).toBe("SEGUIR");
    expect(decidirAvisoStock(10, true, false)).toBe("SEGUIR");
  });

  it("con stock 0 pide confirmación, permita o no el negativo", () => {
    expect(decidirAvisoStock(0, false, false)).toBe("CONFIRMAR");
    expect(decidirAvisoStock(0, true, false)).toBe("CONFIRMAR");
  });

  it("con stock negativo bloquea si la configuración no lo permite", () => {
    expect(decidirAvisoStock(-3, false, false)).toBe("BLOQUEAR");
  });

  it("con stock negativo pide confirmación si la configuración lo permite", () => {
    expect(decidirAvisoStock(-3, true, false)).toBe("CONFIRMAR");
  });

  it("desde COMPRAS nunca pide confirmación: se comporta como antes", () => {
    expect(decidirAvisoStock(0, false, true)).toBe("SEGUIR");
    expect(decidirAvisoStock(-3, true, true)).toBe("SEGUIR");
    expect(decidirAvisoStock(-3, false, true)).toBe("BLOQUEAR");
  });

  it("solo el negativo necesita leer la configuración", () => {
    expect(necesitaConfiguracion(-1)).toBeTrue();
    expect(necesitaConfiguracion(0)).toBeFalse();
    expect(necesitaConfiguracion(4)).toBeFalse();
  });
});
