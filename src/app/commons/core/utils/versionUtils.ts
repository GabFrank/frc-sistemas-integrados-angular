/**
 * Comparación de versiones del desktop (semver: `4.12.0`, `4.12.0-alpha.3`, `v4.12.0`).
 *
 * major.minor.patch se comparan como números; una prerelease es menor que la release de la misma
 * base (`4.12.0-alpha.3` < `4.12.0`), y dos prereleases se comparan por identificadores como en
 * semver (los numéricos como números, y un numérico es menor que uno de texto).
 *
 * Funciones puras: sin Angular ni Electron, para poder probarlas solas.
 */

interface VersionLeida {
  base: [number, number, number];
  pre: string[];
}

const PATRON_VERSION = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

/** null si el texto no es una versión reconocible. */
export function leerVersion(texto: string | null | undefined): VersionLeida | null {
  if (texto == null) return null;
  const m = PATRON_VERSION.exec(String(texto).trim());
  if (!m) return null;
  return {
    base: [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)],
    pre: m[4] ? m[4].split(".") : [],
  };
}

function compararIdentificador(a: string, b: string): number {
  const an = /^\d+$/.test(a);
  const bn = /^\d+$/.test(b);
  if (an && bn) return Math.sign(Number(a) - Number(b));
  if (an) return -1;
  if (bn) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * -1, 0 o 1 según `a` sea menor, igual o mayor que `b`. null si alguna no se puede leer: quien
 * llama decide qué hacer, y para el control de versión mínima eso es no bloquear.
 */
export function compararVersiones(a: string, b: string): number | null {
  const va = leerVersion(a);
  const vb = leerVersion(b);
  if (!va || !vb) return null;
  for (let i = 0; i < 3; i++) {
    if (va.base[i] !== vb.base[i]) return va.base[i] < vb.base[i] ? -1 : 1;
  }
  if (!va.pre.length && !vb.pre.length) return 0;
  if (!va.pre.length) return 1;
  if (!vb.pre.length) return -1;
  const n = Math.max(va.pre.length, vb.pre.length);
  for (let i = 0; i < n; i++) {
    if (i >= va.pre.length) return -1;
    if (i >= vb.pre.length) return 1;
    const c = compararIdentificador(va.pre[i], vb.pre[i]);
    if (c !== 0) return c;
  }
  return 0;
}

/**
 * true solo si `actual` es una versión legible y menor que `minima`. Sin mínima, o con alguna de
 * las dos ilegible (`'web'` en un navegador, una versión mal cargada en el central), no bloquea.
 */
export function esVersionMenorQueMinima(actual: string | null | undefined,
                                        minima: string | null | undefined): boolean {
  if (minima == null || String(minima).trim() === "") return false;
  return compararVersiones(actual, minima) === -1;
}
