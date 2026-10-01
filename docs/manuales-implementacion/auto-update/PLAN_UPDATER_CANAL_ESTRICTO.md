# Plan — el auto-update de un desktop alpha deja de saltar a builds beta

Issue: #381. Rama: `fix/updater-alpha-no-salta-a-beta` (desde `develop`, con #382 ya mergeado).

## Qué pasa (reproducido 2026-10-01)

`electron-updater` 5.3.0 (`app/package-lock.json`) con `allowPrerelease = true` recorre el feed
`releases.atom` y se queda con la **primera** entrada que acepta. Para un cliente `alpha`, un tag
beta pasa el filtro (`GitHubProvider.js`: «Allow moving from alpha to beta but not down»). El feed
**no** está ordenado por fecha de creación: hoy `v4.2.0-beta.8` (17:12) aparece antes que
`v4.2.0-alpha.110` (18:06).

Repro contra el feed real, con el `GitHubProvider` original y un executor HTTPS de Node
(`$CLAUDE_JOB_DIR/tmp/repro-381.js`):

```
original  canal=alpha instalada=4.2.0-alpha.110  -> tag=v4.2.0-beta.8
original  canal=beta  instalada=4.2.0-beta.8     -> tag=v4.2.0-beta.8
```

Además, asignar `autoUpdater.channel` pone `allowDowngrade = true` (`AppUpdater.js:142`), así que
el cliente también **vuelve** a alpha cuando un alpha queda primero: va y viene.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Filtrar en `update-available` (lo que proponía la #381) | El provider ya cortó en la primera entrada aceptada. Con beta.8 arriba del feed, el alpha **nunca** llega a ver alpha.110: descartar beta.8 dejaría al cliente sin ninguna actualización |
| `allowDowngrade = false` | Corta el ida y vuelta pero no el salto (beta.8 es mayor que alpha.110). Y rompe el **cambio de canal** desde Configuración: pasar de alpha `4.5.0-alpha.3` a stable `4.4.0` es un downgrade, y hoy funciona justamente por `allowDowngrade = true` |
| Provider `generic` apuntado al manifest del canal | GitHub solo da URL fija (`releases/latest/download/…`) para el último release **no** prerelease. Para alpha/beta no hay URL estable |
| Actualizar `electron-updater` | Fuera de alcance: cambia de major y la lógica del loop es la misma en 6.x según el upstream (no verificado acá) |

## Cambio — una fase

1. **`app/updater-canal.ts` (nuevo)**: `GitHubProviderCanalEstricto extends GitHubProvider`.
   Sobrescribe `httpRequest`: cuando la URL es el `.atom` del feed **y** el cliente está en
   `alpha` o `beta` con `allowPrerelease`, devuelve el feed con **solo** las entradas cuyo tag es
   `vX.Y.Z-<canal>.N` del canal configurado, ordenadas por versión descendente. Todo lo demás
   (elección del manifest, descarga, notas) sigue en el código de `electron-updater`.
   - Sin dependencias nuevas: el orden lo da un comparador propio de `X.Y.Z-canal.N` (el formato
     que emite semantic-release).
   - Stable (`allowPrerelease = false`) no se filtra: usa `/releases/latest`, que ya excluye
     prereleases.
   - **Si el filtro lanza o deja 0 entradas, devuelve el XML original sin tocar** (auditoría B,
     hallazgo alto). Así un bug del filtro, o un formato de feed nuevo, degrada al comportamiento
     de hoy en vez de dejar a los alpha sin poder recibir el arreglo. Cada fallback se loguea.
   - Filtro por regex anclado a `<entry>…</entry>` y al href `/tag/<tag>`, igual al `hrefRegExp`
     de `GitHubProvider`. El feed real no trae CDATA y el `<content>` viene escapado (`&lt;`), así
     que no puede aparecer un `<entry>` literal adentro. El fallback de arriba cubre cualquier
     sorpresa.
   - `GitHubProvider` no está en la API pública: se importa de
     `electron-updater/out/providers/GitHubProvider`. El módulo **solo** se activa si el `require`
     resuelve **y** `electron-updater/package.json` dice `5.3.0`, la versión que se auditó. Si no,
     exporta `null` y `main.ts` no llama a `setFeedURL`: el updater queda exactamente como hoy y se
     loguea un warning. Así `^5.3.0` en `app/package.json` no puede traer en silencio una minor con
     otra firma.
2. **`app/main.ts`** (+ `app/main.js` y el nuevo `app/updater-canal.js` regenerados con
   `npm run electron:serve-tsc`, que es lo que corre el build): después de configurar
   `autoUpdater`, `setFeedURL({ provider: 'custom', updateProvider: GitHubProviderCanalEstricto,
   owner, repo })` con los mismos `owner`/`repo` que `electron-builder.json:publish`. El provider
   lee `updater.channel` en cada chequeo, así que el cambio de canal desde Configuración sigue
   funcionando sin volver a llamar `setFeedURL`. La creación del provider y el `setFeedURL` van en
   `try/catch`: si fallan, se loguea y el updater sigue con `app-update.yml`, como hoy.
   - Lo que `setFeedURL` **no** cambia (auditoría A, verificado): `updaterCacheDirName` y
     `publisherName` (firma NSIS) se siguen leyendo de `app-update.yml`, y `isUseMultipleRangeRequest`
     es `false` en `BaseGitHubProvider` igual que hoy. Lo que **sí** deja de salir del yml:
     `private`/`token` (`PrivateGitHubProvider`), `host` y `vPrefixedTagName`. Hoy el repo es
     público y los tags llevan `v`, así que no afecta. Si el repo pasara a privado, este
     `setFeedURL` hay que revisarlo.
3. `allowDowngrade` **no se toca**: el cambio de canal la necesita. Con el feed filtrado, un alpha
   solo ve alphas: el «downgrade» posible es volver de un build beta (el que ya saltó) al mejor
   alpha, que es justamente lo que se quiere.

**Tipo de commit: `fix(auto-update):`**. Es código que los clientes tienen que recibir: genera
alpha al mergear.

## Datos nuevos

Ninguno. No nace ningún campo, columna, clave de config ni canal IPC.

## Tests

N/A batería: el CI del desktop no corre tests [ev: `.github/workflows/ci.yml`]. En su lugar:

- **Repro antes/después** (`repro-381.js` con el módulo compilado): el original elige
  `v4.2.0-beta.8` para alpha (**falla con el código viejo**), el estricto tiene que elegir el
  alpha más alto del feed. Beta igual en los dos.
- Casos del filtro con un feed armado a mano: alpha y beta mezclados y desordenados, feed sin
  ninguna entrada del canal (→ XML original), XML basura (→ XML original), entrada con href que
  no es `/tag/…`, tag stable `v4.4.0`, alphas de varias bases (`3.8.0-alpha.24`, `4.0.0-alpha.14`,
  `4.2.0-alpha.110`).
- **Cambio de canal en caliente** sobre la misma instancia del provider: alpha → beta → stable
  (`allowPrerelease = false`, pasa por `/releases/latest`) → alpha.
- `npm run check` (AOT) + `npm run electron:serve-tsc` sin errores.
- **Runtime real**: `npx electron-builder --linux --publish never` → correr el AppImage con
  `XDG_CONFIG_HOME` apuntado a un directorio temporal, que tenga `config/config-backup.json` con
  `updateChannel: "alpha"` (no toca la config real de esta máquina). En `main.log` tiene que
  aparecer `Actualizacion disponible: version 4.2.0-alpha.<N>`, no `beta`. **No** aceptar el
  diálogo «Cerrar y actualizar». Confirmar en el log la ruta de la config (`Looking for config
  at:`) para saber que `userData` quedó realmente aislado.

## Qué queda sin verificar y cómo

- **Windows (NSIS)**: el provider es el mismo código, pero no hay Windows en esta máquina. Se
  verifica en el primer desktop alpha de Windows que actualice: `main.log` con un `alpha`.
- **Feed sin entradas del canal**: el atom trae solo 10 releases (hoy, 9 alpha y 1 beta). Para
  **beta** (farmacia, producción) el caso es **real**: más de 10 alphas entre dos betas sacan al
  último beta del feed, y el cliente beta da `No published versions on GitHub` y no actualiza
  hasta que salga otro beta. **Pasa igual hoy**, sin este cambio (el loop original también
  saltea los alphas), así que no es una regresión. Queda anotado para una issue aparte
  (paginar el feed o usar la API de releases). Para alpha el caso es teórico. Si pasara, el fallback al XML
  original **reintroduce el salto a beta** para ese chequeo, sin más aviso que un warn en
  `main.log` (auditoría del diff). Se acepta: es el precio de que un bug del filtro no trabe a los
  alpha.
- **Downgrade dentro del canal**: con `allowDowngrade = true`, si se borra el alpha más alto, los
  clientes vuelven al anterior. Pasa igual hoy; no se cambia.
- **Cómo les llega el fix a los alpha ya instalados** (auditoría A, hallazgo alto): corren el
  provider viejo, que toma la **primera** entrada alpha/beta del feed. Solo instalan el alpha con
  el fix si ese alpha queda **arriba** del feed en algún chequeo. El orden del feed **no** es por
  fecha de creación: drafts primero y después, según lo observado, por día y dentro del mismo
  día por semver. `v4.4.0` (28/09 14:35) aparece antes que `beta.7` (28/09 21:10), y `beta.8`
  antes que `alpha.110` (los dos del 01/10). Es hipótesis con dos casos. **Consecuencia práctica:**
  el alpha del fix tiene que salir un día en que no salga un beta después; si no, ese beta queda
  arriba hasta el día siguiente. **Verificación**: tras publicar el alpha del fix, `curl
  …/releases.atom` y mirar que sea la primera entrada; y en un desktop alpha, que `main.log`
  muestre ese alpha. Las cajas alpha que sigan sin actualizar se reinstalan a mano.
- **NSIS entre canales**: la skill `frc-desktop` (`electron-main-process.md:134`) avisa de un
  problema conocido del instalador en updates entre canales. Este cambio no lo toca ni lo
  empeora. Al contrario: elimina los saltos de canal involuntarios.

## Si sale mal

- Se ve en `main.log` del desktop (`Error en auto-update:` o una versión de otro canal).
- Revertir el commit con un PR `fix` genera un alpha nuevo sin el provider. Un desktop alpha con
  el fix lo recibe por cualquiera de dos caminos: el filtro funciona y lo elige (es un alpha), o el
  filtro falla y el fallback devuelve el feed original. El caso que queda sin red es un filtro que
  devuelve un feed **válido pero equivocado** (por ejemplo, solo alphas viejos). Lo cubren los casos
  de test y la prueba con el AppImage real, que van **antes** del PR. Si igual pasa, se
  reinstala a mano.

## Canales

`fix` en `develop` → alpha. Beta y stable lo reciben al promover. En beta el cambio solo agrega el
orden por versión (beta ya salteaba alphas). En stable no cambia nada.
