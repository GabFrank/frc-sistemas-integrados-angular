/**
 * Resolución de endpoints cuando la app se sirve como web pura (Cloudflare Pages)
 * en vez de correr dentro de Electron.
 *
 * En Electron el servidor sale de la configuración del usuario (ip + puerto) y se
 * habla HTTP plano dentro de la red. Servida por HTTPS eso no es posible: el
 * navegador bloquea por mixed content cualquier request `http://` o `ws://`
 * hecha desde una página `https://`.
 *
 * La solución es la misma que usa la PWA: un mapa hostname → API. El canal lo
 * define qué proyecto de Cloudflare Pages sirvió la página; el backend por
 * defecto lo define el hostname. Un solo build sirve todas las puertas, y una
 * empresa nueva es una línea acá, no una compilación nueva.
 */

/** Hostname de la puerta → hostname del central que le corresponde. */
export const API_CENTRAL_POR_HOST: Record<string, string> = {
  'farmacia.desk.frcsuite.com': 'farmacia-api.frcsuite.com',
  'bodega.desk.frcsuite.com': 'bodega-api.frcsuite.com',
  'beta.desk.frcsuite.com': 'farmacia-api.frcsuite.com',
  'alpha.desk.frcsuite.com': 'alpha-api.frcsuite.com',
};

/**
 * Central que corresponde al hostname desde el que se sirvió la app, o `null`
 * si no es una puerta conocida — Electron, `localhost`, o una preview de Pages.
 * Que el fallback NO sea producción es parte del diseño.
 */
export function apiCentralDelHost(): string | null {
  if (typeof location === 'undefined' || !location.hostname) return null;
  return API_CENTRAL_POR_HOST[location.hostname] || null;
}

/** true si la app se está sirviendo por HTTPS (es decir: es la web publicada). */
export function servidoPorHttps(): boolean {
  return typeof location !== 'undefined' && location.protocol === 'https:';
}

/**
 * Arma las URLs HTTP y WebSocket de un servidor respetando el esquema con el
 * que se sirvió la app.
 *
 * Por HTTPS el puerto se omite a propósito: tanto nginx (farmacia/bodega) como
 * el túnel de cloudflared (alpha) terminan el TLS en 443, y el puerto interno
 * (8081/8082/8083) no forma parte de la URL pública.
 */
export function urlsDeServidor(
  ip: string,
  puerto: string | number
): { http: string; ws: string } {
  if (servidoPorHttps()) {
    return { http: `https://${ip}`, ws: `wss://${ip}` };
  }
  return { http: `http://${ip}:${puerto}`, ws: `ws://${ip}:${puerto}` };
}
