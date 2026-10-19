import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

/** Lo único que se necesita de `crypto`; se puede pasar otro en una prueba, o `null` si no hay. */
export type FuenteAleatoria = { getRandomValues(bytes: Uint8Array): unknown } | null;

function cryptoDelNavegador(): FuenteAleatoria {
  return typeof crypto !== "undefined" && typeof crypto?.getRandomValues === "function" ? crypto : null;
}

/**
 * Clave de idempotencia de un pedido al central: un UUID v4 nuevo por cada intento del usuario, que se reenvía
 * tal cual al reintentar **ese mismo pedido**. Con la misma clave el central devuelve lo que ya registró en vez
 * de registrarlo otra vez (franco-system-backend-servidor#376).
 *
 * Usa `getRandomValues` y no `randomUUID`, que solo existe en contexto seguro: el desktop también se sirve por
 * `http://<ip>`. Sin `crypto` cae a `Math.random`: la clave tiene que ser única, no secreta, y no puede fallar
 * en medio de un guardado.
 */
export function nuevaClaveIdempotencia(fuente: FuenteAleatoria = cryptoDelNavegador()): string {
  const bytes = new Uint8Array(16);
  if (fuente) {
    fuente.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
  const hex: string[] = [];
  bytes.forEach((b) => hex.push(("0" + b.toString(16)).slice(-2)));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

/**
 * `true` si el central rechazó el pedido porque todavía no conoce el argumento `claveIdempotencia` (un central
 * anterior al cambio). Ese rechazo es de validación del schema: ocurre antes de ejecutar nada, así que el
 * pedido no se aplicó y se puede reenviar sin la clave.
 */
export function centralNoConoceLaClave(error: any): boolean {
  const errores = Array.isArray(error) ? error : error?.graphQLErrors;
  if (!Array.isArray(errores)) return false;
  return errores.some((e) => {
    const mensaje = typeof e?.message === "string" ? e.message : "";
    const deValidacion = e?.extensions?.classification === "ValidationError" || mensaje.includes("UnknownArgument");
    return deValidacion && mensaje.includes("claveIdempotencia");
  });
}

/** Lo que acepta un servicio que manda un pedido con clave, además de sus opciones propias. */
export interface OpcionesDePedidoConClave {
  /** El central no conoce la clave y el pedido se mandó sin ella: ante un «sin respuesta» no hay «Reintentar». */
  sinClave?: () => void;
  /** Es el reenvío de un pedido que quedó sin respuesta: no cae a «sin clave» (ver `conClaveSiElCentralLaConoce`). */
  esReenvio?: boolean;
}

/**
 * Manda el pedido con clave y, si el central no la conoce, lo manda una vez más sin ella (como se hacía antes).
 * `alCaer` avisa a quien llama que ese central no protege la repetición: ante un «sin respuesta» no puede
 * ofrecer «Reintentar».
 *
 * Un **reenvío** no cae (`permitirCaida = false`): el primer intento salió con clave, así que si ahora el
 * central no la conoce es porque volvió a una versión anterior, y mandarlo sin clave podría registrarlo dos
 * veces. Falla con ese rechazo y quien llama pide revisar.
 */
export function conClaveSiElCentralLaConoce<T>(
  enviar: (conClave: boolean) => Observable<T>,
  alCaer?: () => void,
  permitirCaida = true
): Observable<T> {
  return enviar(true).pipe(
    catchError((error) => {
      if (!permitirCaida || !centralNoConoceLaClave(error)) return throwError(() => error);
      if (alCaer) alCaer();
      return enviar(false);
    })
  );
}
