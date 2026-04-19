# CLAUDE.md — frc-comercial/desktop

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`FRC` (`package.json` name), aplicación **desktop POS / admin** del producto **Franco Systems 3.0.9**. Es uno de los 4 componentes que forman `frc-comercial/`. Repo git independiente: `GabFrank/frc-sistemas-integrados-angular`.

Stack: **Angular 15.1.5** + **Electron 22** + **TypeScript** + **SCSS** + **Apollo Client 3.7** (GraphQL) + **Angular Material 15** + **ng-bootstrap** + **Playwright** (e2e). Husky para pre-commit hooks. App **siempre en modo dark** — no usar fondos blancos/claros.

Habla GraphQL contra `frc-comercial/central` (el server principal del SaaS). No habla con `frc-efact` (proyecto independiente con REST/Auth0).

## Build & Run

```bash
npm start                  # Electron + ng serve en paralelo (puerto 4200)
npm run build              # Build dev (sin optimizaciones)
npm run build:prod         # Build producción
npm run check              # AOT build sin progress — CORRELO ANTES DE PUSHEAR
npm run electron:local     # Build prod + electron local (sin packaging)
npm run electron:build     # Empaqueta installers Linux + Windows (electron-builder)
npm run e2e                # Playwright (corre build:prod primero)
npm test                   # Karma unit tests (single run)
npm run test:watch         # Karma watch
npm run lint               # ng lint (ESLint)
```

**`npm run check` es obligatorio antes de push**: Angular en modo `ng serve` (JIT) tolera errores que el build AOT de producción rechaza. Sin este check, hay riesgo concreto de pushear código que rompe el build de release. Existe `npm run remind` específicamente para nagearte sobre esto.

`ng:serve` exporta `NODE_OPTIONS=--max_old_space_size=8192` — el build Angular es memory-hungry y sin esa flag falla por OOM en máquinas con poca RAM.

## Convenciones críticas (de las cursor rules — `.cursor/rules/*.mdc`)

Este repo tiene reglas detalladas en `.cursor/rules/` que son **conocimiento institucional del proyecto**. Las más importantes:

### Acceso cross-project
El agente tiene acceso al backend (`frc-comercial/central`) Y al desktop. Cuando un problema cruza ambos (schemas GraphQL desalineados, inconsistencias de API, etc.), arreglar ambos lados y comunicar todos los cambios al usuario.

### Performance Angular
- **Nunca llamar funciones desde HTML** — causa re-evaluación en cada change detection cycle. Igual con getters/setters.
- **Nunca filtrar en `valueChanges` de form controls** salvo que el usuario lo pida explícitamente.

### UI / UX
- **Dark mode siempre.** No usar fondos blancos ni claros.
- **Texto centrado en tablas** por default, salvo pedido contrario.
- **No usar la clase `container`** — entra en conflicto con Bootstrap y rompe el layout.
- Snackbars: `notificacion-snackbar.service.ts`. Diálogos: `dialogos.service.ts`. No instanciar a mano.
- **Strings siempre en MAYÚSCULAS** al guardar, salvo pedido contrario.

### Estructura de módulos
- **No crear módulos Angular nuevos** para componentes nuevos salvo pedido explícito — usar el módulo más cercano en el path.
- Navegación es **tab-based** vía `src/app/layouts/tab/tab.service.ts`.
- CRUD via `src/app/generics/generic-crud.service.ts` (todos los services de Apollo).

### GraphQL / Apollo
- Un archivo `graphql-query.ts` por modelo.
- Una clase service Apollo por query/mutation, en archivos separados (`getX.ts`, `saveX.ts`, `deleteX.ts`, etc.).
- **Inputs con campos de fecha**: usar `string`, no `Date`. Convertir vía `dateToString` de `src/app/commons/core/utils/dateUtils.ts` en `toInput()`.
- Pagination format estándar (incluye `getTotalPages`, `getTotalElements`, `getNumberOfElements`, `isFirst`).

### Electron main process
- Editar **siempre** `.ts` Y `.js` en paralelo (`main.ts` ↔ `main.js`, `preload.ts` ↔ `preload.js`). El `.ts` se compila vía `tsc -p tsconfig.serve.json` antes de cada electron serve, pero el `.js` es lo que efectivamente carga Electron en builds locales.
- Hay un instalador NSIS custom en [app/installer.nsh](app/installer.nsh) — propenso a romperse en updates entre canales (alpha → beta → stable). Ver [../../propuesta-fix-NSIS-1.md](../../propuesta-fix-NSIS-1.md) antes de tocar el flujo de update.
- Sub-package interno: [electron-printer/](electron-printer/) — código aparte para impresión térmica con su propio `package.json` y `node_modules`.

## Configuración runtime

Hay varios `configuracion*.json` **versionados en git**:

- [assets/configuracion.json](assets/configuracion.json) — config base (cargada por la app)
- [assets/configuracion-local.json](assets/configuracion-local.json) — overrides locales
- [configuracion-local.json](configuracion-local.json), [configuracion 2.json](configuracion%202.json), [configuracion-old.json](configuracion-old.json) — variantes / backups

⚠️ A diferencia de los backends `central`/`filial` (que tienen `application-user-dev.properties` ignorado por git para overrides personales), **acá los configs locales están versionados**. Editar estos archivos crea diff que puede pushearse por error a `develop` y disparar release alpha. Antes de modificar, verificar con `git status` y considerar hacer stash si el cambio es solo para tu máquina.

## CI/CD

Mismo modelo `semantic-release` que los backends. Ver guía consolidada [../../cicd-implementation/guia-desarrollo-cicd.md](../../cicd-implementation/guia-desarrollo-cicd.md) para el detalle completo.

### Branches

- Tres branches long-lived: `develop` (alpha) → `release/beta` (beta) → `master` (stable)
- **Este repo usa `master`, not `main`**, y **`release/beta` long-lived**. Ambas protegidas con `enforce_admins=true` — siempre PR.
- Branch naming: `feature/modulo-descripcion`, `fix/modulo-descripcion`, `refactor/modulo-descripcion`, `chore/descripcion`, `hotfix/descripcion`. Minúsculas, guiones, sin acentos ni espacios.
- `feature/*`, `fix/*`, etc. salen de `develop`. **`hotfix/*` sale de `master`.**

### Releases automáticos

- `semantic-release` lee commits convencionales: `feat:` → minor, `fix:` → patch, `feat!:` o `BREAKING CHANGE:` → major. `chore:`/`refactor:`/`ci:`/`docs:`/`test:`/`perf:` no liberan.
- **Promoción `release/beta → master`: merge commit, NO squash.**
- **Push a cualquiera de las 3 branches dispara release** y empaqueta installers Win/Linux. Nunca pushear sin confirmación explícita del usuario.

### Hotfix flow

1. `git checkout master && git pull` → branch desde **master**
2. `git checkout -b hotfix/descripcion`
3. Fix + commit `fix(modulo): ...` + push
4. PR `hotfix/* → master`, merge → semantic-release genera versión de producción → installer en GitHub Release
5. **Inmediatamente después: PR `master → develop`** para que `develop` tenga el fix.

## ⚙️ Auto-update via electron-updater

El desktop se actualiza solo. Esto es lo que hay que saber:

### Flujo

```
App inicia → lee canal de config (alpha/beta/stable/dev)
           → checkForUpdates() al manifest YAML del GitHub Release del canal
           → si hay update: descarga el .exe / .AppImage automáticamente
           → diálogo: "Cerrar y actualizar" / "Más tarde"
           → si acepta: quitAndInstall() → NSIS instala → app reinicia
           → re-check automático cada 5 minutos mientras la app está abierta
```

### Canales

| Canal | Qué recibe | Quién lo usa |
|---|---|---|
| `alpha` | Cada release nuevo desde `develop` (commits con `feat:` o `fix:`) | Equipo interno, testing |
| `beta` | Cada release nuevo desde `release/beta` | Filial piloto |
| `stable` | Cada release nuevo desde `master` | Producción (todas las empresas) |
| `dev` | Nada — auto-update desactivado | Desarrollo local |

El canal se configura en la UI: **Configuración → Canal de actualización**.

### Persistencia local de la app instalada

| Archivo | Contenido |
|---|---|
| `%AppData%/FRC/config/config-backup.json` | Canal de actualización seleccionado, persistido vía IPC desde renderer al main process |
| `%AppData%/FRC/config/zoom-level.json` | Nivel de zoom del usuario |
| `%AppData%/FRC/logs/main.log` | Logs del proceso main de Electron — **primer lugar para debuggear problemas de auto-update** |

### Nombres de artefactos — NO CAMBIAR

`electron-updater` busca los assets por nombre exacto en los manifests YAML. Si cambiás el `artifactName` en `electron-builder.json` sin actualizar también el manifest, **el auto-update se rompe silenciosamente** (la app no detecta updates pero no muestra error).

| Artefacto | Nombre exacto | Por qué |
|---|---|---|
| Instalador Windows | `FRC-Setup.exe` | Con guión, sin espacios. `electron-updater` lo busca por este nombre en `latest.yml` / `alpha.yml` |
| AppImage Linux | `FRC.AppImage` | Idem |
| Manifests por canal | `alpha.yml`, `beta.yml`, `latest.yml` | `electron-updater` los descarga para detectar versiones disponibles por canal |

El instalador NSIS además es propenso a romperse en updates entre canales (ver [app/installer.nsh](app/installer.nsh) y [../../propuesta-fix-NSIS-1.md](../../propuesta-fix-NSIS-1.md)).

## Cambios en la API GraphQL (lado cliente)

El desktop consume GraphQL del `frc-comercial/central`. Si el backend cambia el schema:

1. **Agregar campos nuevos no rompe** al desktop (Apollo los ignora si no los pide).
2. **Eliminar o renombrar campos** que el desktop usa **rompe la app en runtime** (no en compile time — Angular/Apollo no validan schema antes del build).
3. Antes de mergear un cambio del backend que toca un schema, verificar grep en `src/app/modules/*/graphql/` para ver si el desktop usa ese campo.
4. Si el cambio es inevitable (`feat!:` en el backend), versión del desktop, mobile y backend deben coordinarse.

## Pull Requests

- **Tamaño**: idealmente menos de 400 líneas de cambio neto.
- **Descripción del PR debe incluir**: qué resuelve, cómo probarlo, riesgo (bajo/medio/alto), impacto en auto-update (si tocás `installer.nsh`, `electron-builder.json`, manifests).
- **Sin commits "WIP"** al mergear.
- **Antes de pushear: `npm run check`** (AOT build) — sino arriesgás romper el build de release y bloquear todos los releases del canal.

## Lo que NUNCA hacer

1. Push directo a `master`, `release/beta` o `develop` — siempre vía PR
2. `git push --force` a ramas compartidas
3. Cambiar el `artifactName` en `electron-builder.json` sin actualizar los manifests YAML del electron-updater
4. Renombrar `FRC-Setup.exe` o `FRC.AppImage`
5. Commitear secretos (claves de Firebase, tokens, certificados)
6. Squash merge en PRs — usar **merge commit**
7. Pushear sin correr `npm run check` antes — el AOT build de release puede fallar y bloquear todo el canal
8. Pushear los viernes (durante el período de adopción del workflow)
9. Saltear el CI con `--no-verify` — si commitlint o tests fallan, corregir
10. Llamar funciones desde HTML o usar getters/setters en bindings — performance issues garantizados

## Estructura de módulos (`src/app/modules/`)

19 módulos por dominio funcional: `administrativo`, `configuracion`, `dashboard`, `empresarial`, `financiero`, `general`, `login`, `notificaciones`, `operaciones`, `pdv`, `personas`, `print`, `productos`, `reportes`, `sistema`, `transferencias`. Cada uno sigue el patrón list/edit/graphql descripto arriba.

## Convenciones generales

- **Idioma de dominio:** español (nombres de entidades, módulos, campos UI). Identificadores genéricos en inglés.
- **CHANGELOG.md** sigue Keep a Changelog en español, semantic versioning. Versión actual línea base: `3.0.8-stable` (2025-11-26).
- **Husky pre-commit**: configurado vía `npm run prepare` (corre solo). Si falla, NO usar `--no-verify` — investigar el error.

## Referencias relacionadas

- [.cursor/rules/](. cursor/rules/) — Reglas detalladas del proyecto (apollo-patterns, create-edit-full-entity, entidades, graphql-query, no-direct-function-calls-in-template, service, REGLAS_DE_ESTILO, etc.)
- [../../REPORTE_VULNERABILIDADES.md](../../REPORTE_VULNERABILIDADES.md) — Auditoría 2026-04-02. Hallazgos en código de **este** repo (ej. `app/main.ts` líneas 106-108, `src/app/services/face-ai.service.ts`).
- [../../propuesta-fix-NSIS-1.md](../../propuesta-fix-NSIS-1.md) — Fix propuesto para el instalador NSIS (problema crítico en updates entre canales).
- [../../CLAUDE.md](../../CLAUDE.md) — Mapa cross-project del workspace.
- [../central/CLAUDE.md](../central/CLAUDE.md) — Backend al que este desktop habla por GraphQL.
