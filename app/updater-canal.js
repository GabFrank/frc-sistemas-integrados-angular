"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubProviderCanalEstricto = exports.motivoSinProviderCanal = exports.filtrarFeedPorCanal = void 0;
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
function filtrarFeedPorCanal(xml, canal) {
    const entradas = xml.match(ENTRADA_FEED);
    if (!entradas || entradas.length === 0) {
        return null;
    }
    const delCanal = [];
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
exports.filtrarFeedPorCanal = filtrarFeedPorCanal;
let GitHubProviderOriginal = null;
let motivo = null;
try {
    const version = require('electron-updater/package.json').version;
    if (version === VERSION_AUDITADA) {
        GitHubProviderOriginal = require('electron-updater/out/providers/GitHubProvider').GitHubProvider;
    }
    else {
        motivo = `electron-updater ${version} no es la versión auditada (${VERSION_AUDITADA})`;
    }
}
catch (e) {
    motivo = `no se pudo cargar el GitHubProvider de electron-updater: ${e === null || e === void 0 ? void 0 : e.message}`;
}
/** Por qué el provider no está disponible, o `null` si lo está. */
exports.motivoSinProviderCanal = motivo;
/**
 * Subclase del GitHubProvider que filtra `releases.atom` al canal del updater, o `null` si la
 * versión de electron-updater no es la auditada (entonces el updater sigue como siempre).
 */
exports.GitHubProviderCanalEstricto = GitHubProviderOriginal
    ? class GitHubProviderCanalEstricto extends GitHubProviderOriginal {
        httpRequest(url, headers, cancellationToken) {
            const _super = Object.create(null, {
                httpRequest: { get: () => super.httpRequest }
            });
            var _a, _b, _c;
            return __awaiter(this, void 0, void 0, function* () {
                const respuesta = yield _super.httpRequest.call(this, url, headers, cancellationToken);
                const updater = this.updater;
                const canal = updater === null || updater === void 0 ? void 0 : updater.channel;
                const ruta = String((_b = (_a = url === null || url === void 0 ? void 0 : url.pathname) !== null && _a !== void 0 ? _a : url) !== null && _b !== void 0 ? _b : '');
                // Stable usa /releases/latest (ya excluye prereleases): solo se toca el feed de alpha/beta
                if (!respuesta || !(updater === null || updater === void 0 ? void 0 : updater.allowPrerelease) || (canal !== 'alpha' && canal !== 'beta') || !ruta.endsWith('.atom')) {
                    return respuesta;
                }
                const logger = (_c = updater.logger) !== null && _c !== void 0 ? _c : console;
                try {
                    const filtrado = filtrarFeedPorCanal(respuesta, canal);
                    if (filtrado == null) {
                        logger.warn(`Feed sin entradas del canal ${canal}: se usa el feed original`);
                        return respuesta;
                    }
                    const primera = TAG_DEL_LINK.exec(filtrado);
                    logger.info(`Feed filtrado al canal ${canal}; primera entrada: ${primera ? primera[1] : '?'}`);
                    return filtrado;
                }
                catch (e) {
                    logger.warn(`No se pudo filtrar el feed al canal ${canal}, se usa el original: ${e === null || e === void 0 ? void 0 : e.message}`);
                    return respuesta;
                }
            });
        }
    }
    : null;
//# sourceMappingURL=updater-canal.js.map