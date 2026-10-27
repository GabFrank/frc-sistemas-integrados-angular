import { compararVersiones, esVersionMenorQueMinima, leerVersion } from "./versionUtils";

describe("versionUtils", () => {
  it("lee major.minor.patch, la prerelease y la v inicial", () => {
    expect(leerVersion("4.12.0")).toEqual({ base: [4, 12, 0], pre: [] });
    expect(leerVersion("v4.12.0-alpha.3")).toEqual({ base: [4, 12, 0], pre: ["alpha", "3"] });
    expect(leerVersion(" 4.12 ")).toEqual({ base: [4, 12, 0], pre: [] });
    expect(leerVersion("web")).toBeNull();
    expect(leerVersion("")).toBeNull();
    expect(leerVersion(null)).toBeNull();
  });

  it("compara cada parte como número, no como texto", () => {
    expect(compararVersiones("4.9.0", "4.12.0")).toBe(-1);
    expect(compararVersiones("4.12.0", "4.9.0")).toBe(1);
    expect(compararVersiones("4.12.10", "4.12.9")).toBe(1);
    expect(compararVersiones("10.0.0", "9.99.99")).toBe(1);
    expect(compararVersiones("4.12.0", "4.12.0")).toBe(0);
  });

  it("una prerelease es menor que la release de la misma base", () => {
    expect(compararVersiones("4.12.0-alpha.3", "4.12.0")).toBe(-1);
    expect(compararVersiones("4.12.0", "4.12.0-beta.1")).toBe(1);
    // ...pero mayor que cualquier release anterior.
    expect(compararVersiones("4.12.0-alpha.3", "4.11.5")).toBe(1);
  });

  it("dos prereleases se comparan como en semver", () => {
    expect(compararVersiones("4.12.0-alpha.3", "4.12.0-alpha.10")).toBe(-1);
    expect(compararVersiones("4.12.0-alpha.3", "4.12.0-beta.1")).toBe(-1);
    expect(compararVersiones("4.12.0-alpha", "4.12.0-alpha.1")).toBe(-1);
    expect(compararVersiones("4.12.0-1", "4.12.0-alpha")).toBe(-1);
    expect(compararVersiones("4.12.0-beta.2", "4.12.0-beta.2")).toBe(0);
  });

  it("null si alguna no se puede leer", () => {
    expect(compararVersiones("web", "4.12.0")).toBeNull();
    expect(compararVersiones("4.12.0", "cuatro")).toBeNull();
  });

  describe("esVersionMenorQueMinima", () => {
    it("bloquea solo una versión legible menor que la mínima", () => {
      expect(esVersionMenorQueMinima("4.11.9", "4.12.0")).toBeTrue();
      expect(esVersionMenorQueMinima("4.12.0-alpha.3", "4.12.0")).toBeTrue();
      expect(esVersionMenorQueMinima("4.12.0", "4.12.0")).toBeFalse();
      expect(esVersionMenorQueMinima("4.12.1-alpha.1", "4.12.0")).toBeFalse();
      expect(esVersionMenorQueMinima("5.0.0", "4.12.0")).toBeFalse();
    });

    it("sin mínima o con una versión ilegible no bloquea", () => {
      expect(esVersionMenorQueMinima("4.0.0", null)).toBeFalse();
      expect(esVersionMenorQueMinima("4.0.0", "")).toBeFalse();
      expect(esVersionMenorQueMinima("4.0.0", "  ")).toBeFalse();
      expect(esVersionMenorQueMinima("web", "4.12.0")).toBeFalse();
      expect(esVersionMenorQueMinima(null, "4.12.0")).toBeFalse();
      expect(esVersionMenorQueMinima("4.0.0", "x.y")).toBeFalse();
    });
  });
});
