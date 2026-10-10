import { of, throwError } from "rxjs";
import { centralNoConoceLaClave, conClaveSiElCentralLaConoce, nuevaClaveIdempotencia } from "./claveIdempotencia";

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

describe("centralNoConoceLaClave", () => {
  const desconocido = {
    message: "Validation error of type UnknownArgument: Unknown field argument claveIdempotencia @ 'crearPrestamo'",
    extensions: { classification: "ValidationError" },
  };

  it("reconoce el rechazo de un central anterior, como arreglo o dentro de graphQLErrors", () => {
    expect(centralNoConoceLaClave([desconocido])).toBe(true);
    expect(centralNoConoceLaClave({ graphQLErrors: [desconocido], message: "x" })).toBe(true);
    expect(centralNoConoceLaClave([{ message: desconocido.message }])).toBe(true);
  });

  it("no confunde un rechazo de negocio ni un error de red", () => {
    expect(centralNoConoceLaClave([{ message: "La clave de idempotencia ya se usó para otro pedido" }])).toBe(false);
    expect(centralNoConoceLaClave([{ message: "Saldo insuficiente", extensions: { classification: "DataFetchingException" } }])).toBe(false);
    expect(centralNoConoceLaClave([{ message: "Validation error: otro argumento", extensions: { classification: "ValidationError" } }])).toBe(false);
    expect(centralNoConoceLaClave(new Error("Http failure response"))).toBe(false);
    expect(centralNoConoceLaClave(null)).toBe(false);
  });
});

describe("conClaveSiElCentralLaConoce", () => {
  const desconocido = [{ message: "UnknownArgument claveIdempotencia", extensions: { classification: "ValidationError" } }];

  it("si el central conoce la clave manda una sola vez, con clave", () => {
    const envios: boolean[] = [];
    let resultado: string;
    conClaveSiElCentralLaConoce((conClave) => { envios.push(conClave); return of("ok"); }).subscribe((r) => (resultado = r));
    expect(envios).toEqual([true]);
    expect(resultado).toBe("ok");
  });

  it("si no la conoce avisa y manda otra vez sin clave", () => {
    const envios: boolean[] = [];
    let cayo = 0;
    let resultado: string;
    conClaveSiElCentralLaConoce(
      (conClave) => { envios.push(conClave); return conClave ? throwError(() => desconocido) : of("sin clave"); },
      () => cayo++
    ).subscribe((r) => (resultado = r));
    expect(envios).toEqual([true, false]);
    expect(cayo).toBe(1);
    expect(resultado).toBe("sin clave");
  });

  it("un reenvío no cae a «sin clave»: falla con el rechazo", () => {
    const envios: boolean[] = [];
    let error: any;
    conClaveSiElCentralLaConoce(
      (conClave) => { envios.push(conClave); return throwError(() => desconocido); }, undefined, false
    ).subscribe({ error: (e) => (error = e) });
    expect(envios).toEqual([true]);
    expect(error).toBe(desconocido);
  });

  it("cualquier otro error pasa tal cual, sin reintento", () => {
    const envios: boolean[] = [];
    const red = { networkError: true };
    let error: any;
    conClaveSiElCentralLaConoce((conClave) => { envios.push(conClave); return throwError(() => red); })
      .subscribe({ error: (e) => (error = e) });
    expect(envios).toEqual([true]);
    expect(error).toBe(red);
  });
});
