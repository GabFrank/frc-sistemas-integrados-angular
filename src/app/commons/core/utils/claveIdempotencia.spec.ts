import { nuevaClaveIdempotencia } from "./claveIdempotencia";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("nuevaClaveIdempotencia", () => {
  it("devuelve un UUID v4 en minúsculas", () => {
    expect(nuevaClaveIdempotencia()).toMatch(UUID_V4);
  });

  it("entra en el largo que acepta el central (64)", () => {
    expect(nuevaClaveIdempotencia().length).toBe(36);
  });

  it("no repite la clave entre intentos", () => {
    const claves = new Set<string>();
    for (let i = 0; i < 500; i++) claves.add(nuevaClaveIdempotencia());
    expect(claves.size).toBe(500);
  });

  it("fija versión y variante sobre lo que entregue la fuente", () => {
    const todoEnUno = { getRandomValues: (bytes: Uint8Array) => bytes.fill(0xff) };
    expect(nuevaClaveIdempotencia(todoEnUno)).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    const todoEnCero = { getRandomValues: (bytes: Uint8Array) => bytes.fill(0) };
    expect(nuevaClaveIdempotencia(todoEnCero)).toBe("00000000-0000-4000-8000-000000000000");
  });

  it("sin crypto igual devuelve un UUID v4 y no lanza", () => {
    expect(nuevaClaveIdempotencia(null)).toMatch(UUID_V4);
    expect(nuevaClaveIdempotencia(null)).not.toBe(nuevaClaveIdempotencia(null));
  });
});
