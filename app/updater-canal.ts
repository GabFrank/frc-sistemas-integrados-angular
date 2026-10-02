/**
 * Provider de auto-update que solo ve los releases del canal configurado (#381).
 *
 * El GitHubProvider de electron-updater 5.3.0 recorre el feed `releases.atom` y se queda con la
 * PRIMERA entrada que acepta; para un cliente alpha, un tag beta pasa el filtro («Allow moving
 * from alpha to beta»). Como GitHub no ordena el feed por fecha de creación, un beta puede quedar
 * arriba del alpha más nuevo y el desktop alpha instala el build de farmacia. Como asignar
 * `autoUpdater.channel` activa `allowDowngrade`, después vuelve al alpha: va y viene.
 *
 * Acá solo se filtra el feed antes de que lo lea el provider original: quedan las entradas
 * `vX.Y.Z-<canal>.N` del canal configurado, de la versión más alta a la más baja. Elegir el
 * manifest, descargar, verificar y las notas siguen siendo código de electron-updater.
 *
 * Todo camino raro devuelve el feed SIN TOCAR (= el comportamiento anterior): un desktop con un
 * updater roto no se arregla con otro update, hay que ir caja por caja.
 *
 * Este módulo no importa electron: se puede probar con node puro.
 */

/** Única versión de electron-updater contra la que se auditó la ruta interna y `httpRequest`. */
const VERSION_AUDITADA = '5.3.0';

const ENTRADA_FEED = /<entry>[\s\S]*?<\/entry>/g;
// Mismo criterio que el hrefRegExp de GitHubProvider: el tag es lo que sigue a /tag/ en el link
const TAG_DEL_LINK = /<link\b[^>]*\bhref="[^"]*\/tag\/([^"/]+)"/;
// Formato que emite semantic-release para los prereleases: v4.2.0-alpha.110
const TAG_PRERELEASE = /^v?(\d+)\.(\d+)\.(\d+)-([0-9A-Za-z-]+)\.(\d+)$/;

/**
 * Deja en el feed solo las entradas del canal, de mayor a menor versión.
 * Devuelve `null` si no hay entradas o ninguna es del canal: quien llama usa el feed original.
 */
export function filtrarFeedPorCanal(xml: string, canal: string): string | null {
  const entradas = xml.match(ENTRADA_FEED);
  if (!entradas || entradas.length === 0) {
    return null;
  }

  const delCanal: { entrada: string; version: number[] }[] = [];
  for (const entrada of entradas) {
    const link = TAG_DEL_LINK.exec(entrada);
    const tag = link ? TAG_PRERELEASE.exec(link[1]) : null;
    if (tag && tag[4] === canal) {
      delCanal.push({ entrada, version: [+tag[1], +tag[2], +tag[3], +tag[5]] });
    }
  }
  if (delCanal.length === 0) {
    return null;
  }

  delCanal.sort((a, b) => {
    for (let i = 0; i < a.version.length; i++) {
      if (a.version[i] !== b.version[i]) {
        return b.version[i] - a.version[i];
      }
    }
    return 0;
  });

  const ultima = entradas[entradas.length - 1];
  const inicio = xml.indexOf(entradas[0]);
  const fin = xml.lastIndexOf(ultima) + ultima.length;
  return xml.slice(0, inicio) + delCanal.map((d) => d.entrada).join('\n') + xml.slice(fin);
}

let GitHubProviderOriginal: any = null;
let motivo: string | null = null;
try {
  const version = require('electron-updater/package.json').version;
  if (version === VERSION_AUDITADA) {
    GitHubProviderOriginal = require('electron-updater/out/providers/GitHubProvider').GitHubProvider;
  } else {
    motivo = `electron-updater ${version} no es la versión auditada (${VERSION_AUDITADA})`;
  }
} catch (e) {
  motivo = `no se pudo cargar el GitHubProvider de electron-updater: ${(e as any)?.message}`;
}

/** Por qué el provider no está disponible, o `null` si lo está. */
export const motivoSinProviderCanal: string | null = motivo;

/**
 * Subclase del GitHubProvider que filtra `releases.atom` al canal del updater, o `null` si la
 * versión de electron-updater no es la auditada (entonces el updater sigue como siempre).
 */
export const GitHubProviderCanalEstricto: any = GitHubProviderOriginal
  ? class GitHubProviderCanalEstricto extends GitHubProviderOriginal {
      async httpRequest(url: any, headers: any, cancellationToken: any): Promise<string | null> {
        const respuesta: string | null = await super.httpRequest(url, headers, cancellationToken);
        const updater = (this as any).updater;
        const canal = updater?.channel;
        const ruta = String(url?.pathname ?? url ?? '');
        // Stable usa /releases/latest (ya excluye prereleases): solo se toca el feed de alpha/beta
        if (!respuesta || !updater?.allowPrerelease || (canal !== 'alpha' && canal !== 'beta') || !ruta.endsWith('.atom')) {
          return respuesta;
        }
        const logger = updater.logger ?? console;
        try {
          const filtrado = filtrarFeedPorCanal(respuesta, canal);
          if (filtrado == null) {
            logger.warn(`Feed sin entradas del canal ${canal}: se usa el feed original`);
            return respuesta;
          }
          const primera = TAG_DEL_LINK.exec(filtrado);
          logger.info(`Feed filtrado al canal ${canal}; primera entrada: ${primera ? primera[1] : '?'}`);
          return filtrado;
        } catch (e) {
          logger.warn(`No se pudo filtrar el feed al canal ${canal}, se usa el original: ${(e as any)?.message}`);
          return respuesta;
        }
      }
    }
  : null;
