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
