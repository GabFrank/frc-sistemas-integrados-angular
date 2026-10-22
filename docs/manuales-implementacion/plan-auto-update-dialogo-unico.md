# Plan: un solo diálogo de actualización a la vez

Rama: `fix/auto-update-dialogo-unico` (desde `develop`). Pieza: desktop (proceso main de Electron).

## Problema

Con una versión nueva en cualquier canal (alpha, beta o stable), si el usuario no contesta el
diálogo «Actualizacion disponible», se apila uno nuevo cada 5 minutos.

## Causa

`app/main.ts` (y su espejo `app/main.js`):

- `setInterval` llama `autoUpdater.checkForUpdates()` cada 5 min.
- `update-available` llama `downloadUpdate()`; con el instalador ya en caché, `electron-updater`
  vuelve a emitir `update-downloaded` sin bajar nada.
- El handler de `update-downloaded` abre `dialog.showMessageBox(...)` sin mirar si ya hay uno
  abierto. Lo mismo pasa con «Buscar actualización» manual (`check-for-update-manual`) y al cambiar
  de canal (`set-update-channel`): las tres puertas desembocan en el mismo handler.

## Fase 1 (única) — `fix(update)`

- Bandera `dialogoActualizacionAbierto` en el módulo main.
- En `update-downloaded`: si está abierta, solo `log.info` y salir. Si no, marcarla justo antes
  de `showMessageBox` y envolver diálogo + `quitAndInstall` en `try/catch/finally` (con `await`):
  el `finally` libera la bandera aunque el diálogo rechace o algo tire síncrono. Sin eso, una
  bandera trabada dejaría a la PC sin diálogo hasta reiniciar, y con `autoInstallOnAppQuit=false`
  el diálogo es la única vía de instalar (auditoría eje A y B).
- Mismo cambio en `main.ts` y `main.js` (regla del repo).
- No cambia: el chequeo cada 5 min, la descarga, ni los textos. Si el usuario elige «Mas tarde»,
  el diálogo vuelve a aparecer (uno solo) en el próximo chequeo, como hoy.
- Si mientras el diálogo está abierto sale otra versión, el diálogo sigue mostrando la anterior;
  al contestarlo, el próximo chequeo muestra la nueva. `quitAndInstall` instala lo último bajado.

### Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `dialogoActualizacionAbierto` (variable en memoria del main) | handler `update-downloaded` (al abrir y al cerrar) | el mismo handler, al entrar |

Sin migraciones, sin GraphQL, sin cambios en el renderer.

## Tests

- Desktop sin batería en CI (N/A paso 9 según el ciclo). Gate: `npm run check` y compilar
  `app/main.ts` con `tsc -p app` para ver que `main.js` coincide.
- Prueba de runtime: correr Electron desde el worktree con un script de prueba que emite
  `update-downloaded` varias veces y cuenta los diálogos abiertos (esperado: 1; después de
  contestar, uno nuevo puede abrirse). Casos extra: `showMessageBox` que rechaza y que tira
  síncrono → la bandera se libera y el siguiente evento abre diálogo. Repetir sin el fix
  (`main.js` de `develop`) para ver que se apilan (3 de 3).

## Despliegue

- Las PCs que ya tienen el bug siguen apilando hasta instalar la versión con el fix: un clic en
  «Cerrar y actualizar» de cualquiera de los diálogos apilados alcanza. Va en el PR.
- Revertir no deja estado: la bandera vive en memoria.

## Auditoría del plan (paso 5)

- Eje A: las 4 puertas (arranque, intervalo, manual, cambio de canal) llegan al mismo handler;
  confirmada la re-emisión desde caché en `electron-updater` 5.3.0 (`BaseUpdater.js` `done` →
  `dispatchUpdateDownloaded`). El `UpdateDialogComponent` de Angular es manual y no se apila.
  Riesgo: bandera trabada si solo se libera en `.then` → aplicado `finally`.
- Eje B: mismo riesgo, más el throw síncrono antes del diálogo → aplicado `try/catch/finally`
  y los casos de prueba. Anotado el clic manual en las PCs con el bug.
- Deuda aparte (no se toca acá): el texto dice «Al cerrar la aplicacion se instalara
  automaticamente», pero `autoInstallOnAppQuit=false` (`main.ts:21`).

## Sin verificar

- El ciclo real con un release publicado (necesita un instalador empaquetado y un canal con
  versión nueva). Se verificaría instalando el build de alpha en una PC y dejando el diálogo sin
  contestar 15 min.
