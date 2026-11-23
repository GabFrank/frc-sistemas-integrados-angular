import {
  compararVersiones, esVersionMenorQueMinima, leerVersion, normalizarVersionMinima, PATRON_VERSION_MINIMA,
} from "./versionUtils";

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

  describe("versión mínima con prerelease (#710)", () => {
    it("acepta X.Y.Z y X.Y.Z con prerelease", () => {
      ["4.12.0", "4.2.0-alpha.345", "4.2.0-beta.2", "4.2.0-rc-1.x-y", "4.2.0-ALPHA.345"].forEach((v) =>
        expect(PATRON_VERSION_MINIMA.test(v)).withContext(v).toBeTrue());
    });

    it("rechaza lo que el central no guarda", () => {
      ["4.2", "4.2.0-", "4.2.0+build", "4.2.0-alpha+1", "4.2.0-alpha..1", "v4.2.0", "4.2.0.1", " 4.2.0", ""]
        .forEach((v) => expect(PATRON_VERSION_MINIMA.test(v)).withContext(v).toBeFalse());
    });

    it("todo lo que acepta lo puede leer el control", () => {
      ["4.12.0", "4.2.0-alpha.345", "4.2.0-rc-1.x-y"].forEach((v) =>
        expect(leerVersion(v)).withContext(v).not.toBeNull());
    });

    it("se guarda en minúsculas y sin espacios", () => {
      expect(normalizarVersionMinima("  4.2.0-ALPHA.345 ")).toBe("4.2.0-alpha.345");
      expect(normalizarVersionMinima(null)).toBe("");
    });

    it("una alpha bloquea a las anteriores y no a la release", () => {
      expect(esVersionMenorQueMinima("4.2.0-alpha.9", "4.2.0-alpha.345")).toBeTrue();
      expect(esVersionMenorQueMinima("4.2.0-alpha.345", "4.2.0-alpha.345")).toBeFalse();
      expect(esVersionMenorQueMinima("4.2.0-beta.1", "4.2.0-alpha.345")).toBeFalse();
      expect(esVersionMenorQueMinima("4.2.0", "4.2.0-alpha.345")).toBeFalse();
      expect(esVersionMenorQueMinima("4.2.0-alpha.345", "4.2.0")).toBeTrue();
    });
  });
});
