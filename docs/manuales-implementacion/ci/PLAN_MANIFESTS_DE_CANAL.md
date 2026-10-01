# Plan — los releases alpha/beta dejan de subir `latest*.yml` y `builder-debug.yml`

Issue: #279. Rama: `fix/ci-manifests-de-canal` (desde `develop`).

## Qué pasa

`.github/workflows/release.yml`, paso «Generate channel manifests», **copia** `release/latest*.yml`
a `release/{alpha,beta}*.yml`. El paso «Upload artifacts» sube `release/*.yml` entero, así que
cada prerelease publica también `latest.yml` / `latest-linux.yml` (con la versión del prerelease
adentro) y el `builder-debug.yml` de electron-builder.

Verificado el 2026-10-01: `v4.2.0-alpha.110` y `v4.2.0-beta.8` traen los cuatro manifests más
`builder-debug.yml`; el `latest.yml` de alpha.110 dice `version: 4.2.0-alpha.110`.

## Por qué hoy no rompe nada (verificado contra `electron-updater` 5.3.0, `app/package-lock.json`)

- **stable** (`allowPrerelease=false`, `app/main.ts:140`): `getLatestTagName` pide
  `/releases/latest`, que excluye prereleases → `v4.4.0` hoy. Nunca abre un prerelease.
- **alpha / beta** (`allowPrerelease=true` + `channel`): eligen un tag alpha/beta del feed y piden
  `{prerelease-del-tag}.yml` / `{…}-linux.yml`.
- ⚠️ **Matiz que la issue no menciona**: si ese archivo da 404, `GitHubProvider.js` cae a
  `latest.yml` **del mismo prerelease** («Allow fallback to `latest.yml`»). Hoy ese fallback nunca
  se ejerce, porque el renombre siempre produce `alpha*.yml`/`beta*.yml`. Con este cambio el
  fallback deja de tener a dónde caer: si algún día el renombre no produce el manifest del canal
  (electron-builder cambia el nombre de su salida, o un bug del propio paso), el cliente da
  `ERR_UPDATER_CHANNEL_FILE_NOT_FOUND` y reintenta cada 5 min sin que nada avise. Por eso el
  cambio agrega un **chequeo duro** (punto 3 de «Cambio»): el job falla en rojo en vez de
  publicar un release sin manifest.
- La ventana entre que semantic-release crea el release y que la matriz sube los assets es
  **idéntica** con `cp` o con `mv`: ahí `alpha.yml` y `latest.yml` dan 404 los dos.

Nadie más lee esos archivos: `grep` en el repo y en `frc-cicd` solo encuentra documentación
(`CLAUDE.md:153-155`, `README.md:138`).

## Cambio — una sola fase

`.github/workflows/release.yml`:

1. «Generate channel manifests»: `cp` → `mv`. En stable el bloque ya se saltea
   (`CHANNEL=latest`), así que stable sigue publicando `latest*.yml` igual que hoy.
2. «Upload artifacts»: saltear `release/builder-debug.yml` en el loop.
3. Chequeo duro al final de «Generate channel manifests», **en los tres canales**: el job windows
   exige `release/${CHANNEL}.yml` y el linux `release/${CHANNEL}-linux.yml`; si falta, `exit 1`.
   En stable verifica `latest*.yml`, que hoy tampoco se controla.
4. Corregir el comentario `# Copy manifests with channel name` → «Rename».

Cada job de la matriz (ubuntu / windows) solo ve sus propios manifests (`latest-linux.yml` /
`latest.yml`), así que el `mv` no pisa nada del otro.

**Tipo de commit: `ci(release):`**, no `fix`: el cambio no lleva código que el
usuario tenga que recibir, y `ci` **no** dispara semantic-release, así que no publica un alpha
vacío a la flota al mergear. Precedentes en el repo: `66188c83 ci(release): …`. (`445cd8a3
fix(ci): …` usó `fix` y sí generó release.) El título del PR lleva el mismo `ci(release):` y
ningún `BREAKING CHANGE` en el cuerpo.

**Qué canal lo recibe y cuándo.** Cada rama corre su propia copia de `release.yml`: el cambio se
ejerce primero en **alpha** (próximo `feat`/`fix` en `develop`), y en **beta** / **stable** recién
cuando se promueva a `release/beta` / `master`. Ningún efecto en farmacia ni bodega antes de eso.

## Datos nuevos

Ninguno. N/A tabla escritor/lector porque no nace ningún campo, columna ni clave.

## Tests

N/A para desktop porque su CI no corre tests y no hay batería para workflows
[ev: `.github/workflows/ci.yml` — sin paso de test]. Verificación posible antes del merge:

- `bash -n` sobre los dos bloques `run:` extraídos.
- Simular los dos pasos en un directorio temporal con archivos falsos (`latest.yml`,
  `latest-linux.yml`, `builder-debug.yml`, `FRC-Setup.exe`) para `VERSION` alpha, beta y stable,
  y listar qué subiría el loop.
- `npm run check` **N/A**: el diff no toca código Angular ni Electron.

## Qué queda sin verificar y cómo

- **El workflow real** solo corre en un push a `develop` / `release/*` / `master` que genere
  versión. Con `ci(release):` el merge **no** genera release: el cambio se ejerce en el **próximo
  `feat`/`fix` que llegue a `develop`**. Verificación entonces: `gh release view
  v<ese-alpha> --json assets` → solo `alpha.yml`, `alpha-linux.yml`, `.exe`, `.AppImage`,
  `.blockmap`; y un desktop alpha que actualice (log `Auto-updater configured: channel=alpha`).
- **Probarlo de punta a punta antes del merge** exigiría un fork o un repo descartable con
  `workflow_dispatch` y un tag de prueba (sugerencia del auditor B). Se descarta por costo: los
  nombres reales que emite electron-builder ya están verificados en los assets publicados
  (`latest.yml`, `latest-linux.yml`, `builder-debug.yml` en `v4.2.0-alpha.110`), y la simulación
  local usa esos mismos nombres. El chequeo duro convierte cualquier sorpresa en un job rojo, no
  en un release roto.

## Si sale mal

- **Detección**: el job `build` queda en rojo en «Generate channel manifests» (chequeo duro), o
  `gh release view v<alpha> --json assets` no muestra `alpha.yml` / `alpha-linux.yml`.
- **Revertir el workflow NO repara el release ya publicado**, y re-correr la corrida tampoco
  (usa el `release.yml` del commit original). Reparación a mano:
  `gh release download v<X> -p 'latest*.yml'`, renombrar a `alpha*.yml` / `beta*.yml` y
  `gh release upload v<X> <archivos> --clobber`. Después, `git revert` del commit en una rama + PR.
- Los releases ya publicados conservan sus `latest*.yml` sobrantes. No se limpian: borrar assets
  de releases viejos no aporta y un alpha viejo es, por el fallback, lo único que lo usaría.

## Fuera de alcance (issue aparte)

`autoUpdater.channel = …` pone `allowDowngrade = true` (`AppUpdater.js:142`), y el loop del
`GitHubProvider` acepta para un cliente **alpha** el primer tag alpha **o beta** del feed. Un
cliente alpha se pasa a un beta cada vez que el beta es la entrada más nueva del feed, y vuelve al
alpha en el siguiente (ej. 2026-10-01: beta.8 17:12 entre alpha.109 14:31 y alpha.110 18:06).
No es lo que dice la issue #279 («nunca caen en un release de otro canal»).
