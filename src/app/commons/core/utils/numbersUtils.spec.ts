import { stringToDecimal } from "./numbersUtils";

describe("stringToDecimal", () => {
  it("un entero lleva ,00 y no se multiplica por 10 (#714)", () => {
    expect(stringToDecimal("2")).toBe("2,00");
    expect(stringToDecimal("5")).toBe("5,00");
    expect(stringToDecimal("1234")).toBe("1.234,00");
    expect(stringToDecimal("-123")).toBe("-123,00");
  });

  it("redondea las sumas de float a 2 decimales", () => {
    expect(stringToDecimal("0.15000000000000002")).toBe("0,15");
    expect(stringToDecimal("-0.001")).toBe("0,00");
  });

  it("mantiene el formato que ya andaba", () => {
    expect(stringToDecimal("0")).toBe("0,00");
    expect(stringToDecimal("2.5")).toBe("2,50");
    expect(stringToDecimal("1234.56")).toBe("1.234,56");
    expect(stringToDecimal("1234567.8")).toBe("1.234.567,80");
    expect(stringToDecimal("-3.5")).toBe("-3,50");
  });

  it("un texto no numérico vuelve tal cual", () => {
    expect(stringToDecimal("NaN")).toBe("NaN");
  });
});
