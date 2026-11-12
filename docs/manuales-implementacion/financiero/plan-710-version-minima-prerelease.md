# Plan #710: la versión mínima del escritorio admite prerelease

Issue: GabFrank/frc-sistemas-integrados-angular#710. Rama `fix/version-minima-prerelease` en **desktop** (desde
`develop` f2657e46) y en **central** (desde `develop` 785d1da6). El plan vive acá; el central tiene uno corto que
apunta a este.

## Problema

La «Versión mínima del escritorio» (Financiero › Configuración › Moneda por módulo, solo ADMIN) solo acepta `X.Y.Z`:
- desktop: `PATRON_VERSION_MINIMA = /^\d+\.\d+\.\d+$/` (`configuracion-moneda-modulo.component.ts`);
- central: `VersionClienteGraphQL.setVersionMinimaDesktop` valida `\d+\.\d+\.\d+`.

Pero el control (`VersionMinimaDesktopService` → `versionUtils.esVersionMenorQueMinima`) compara con semver, donde una
prerelease es menor que su release: `4.2.0-alpha.345` < `4.2.0`. En alpha no hay forma de exigir la versión de alpha;
la única cercana, `4.2.0`, **bloquea a todos los Electron de alpha**. El runbook de «Moneda por módulo» pide cargar
`4.2.0-alpha.345`; en alpha quedó `4.1.0` para poder probar.

Además, `styles.scss` pone `text-transform: uppercase` a todo `input`: el valor se guarda como se escribe, pero se ve
«4.2.0-ALPHA.345». Las prerelease de semver distinguen mayúsculas (`ALPHA` < `alpha` en ASCII), y las versiones de
Electron son en minúsculas.

## Enfoque

Aceptar `X.Y.Z` con prerelease opcional (`X.Y.Z-ident(.ident)*`, identificadores `[0-9A-Za-z-]`, sin build
`+…`, hasta 64 caracteres), **guardarla en minúsculas**, y mostrarla como está guardada. Es una excepción a la regla
del desktop de guardar en MAYÚSCULAS: las versiones de Electron son en minúsculas (`.releaserc.json`: `alpha`/`beta`)
y semver distingue mayúsculas; una mínima `4.2.0-ALPHA.345` sería menor que toda alpha y **no bloquearía a nadie**,
en silencio. Lo que el central acepta es un subconjunto de lo que lee `versionUtils.leerVersion`: el control nunca
se apaga por una mínima ilegible.

- **Central** (`setVersionMinimaDesktop`): `trim().toLowerCase(Locale.ROOT)` y después
  `\d+\.\d+\.\d+(-[0-9a-z-]+(\.[0-9a-z-]+)*)?`, largo ≤ 64; mensaje «La version tiene que tener la forma 4.12.0 o
  4.12.0-alpha.345.». La lectura (`versionMinimaDesktop`) no cambia.
- **Desktop** (pantalla): `/^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/` y largo ≤ 64, se envía en
  minúsculas; el `<input>` con clase propia (`.cmm-version__campo input.cmm-version__input { text-transform: none
  !important; }`: le gana a `input { text-transform: uppercase !important }` de `styles.scss` por especificidad);
  error «Formato 4.12.0 o 4.12.0-alpha.345»; **aviso fijo** debajo: «Con prerelease (4.2.0-alpha.345) solo en
  alpha/beta: en producción bloquea a los escritorios estables hasta que lleguen a esa versión.»
- El control de bloqueo (`versionUtils`) **no cambia**: ya compara prerelease (tiene tests: `4.12.0-alpha.3` <
  `4.12.0`).
- `ControlVersionMoneda.menor` (central, para la propiedad `moneda.desktop.version-minima-requerida`, hoy sin
  configurar en ningún lado) parte por puntos: `4.2.0-alpha.345` se lee como `4.2.0.345`, y frente a una requerida
  con prerelease una configurada en release daría «menor». **Se corrige** comparando solo la base (antes del primer
  `-`): una alpha de 4.2.0 cuenta como 4.2.0 (ya trae lo de 4.2.0).

**Descartado:** otra regla por canal (mínima distinta para alpha/beta): más pantallas y claves; con la prerelease
alcanza para el caso del runbook.

## Fases

**Central** (va primero: un central viejo rechaza la prerelease con su mensaje de siempre):
- `VersionClienteGraphQL.setVersionMinimaDesktop`: patrón, minúsculas, largo, mensaje.
- `ControlVersionMoneda.menor`: solo la base. Test con prerelease en los dos lados.
- Test `VersionClienteGraphQLTest` (unitario, mock de `ConfiguracionSistemaService`): `4.2.0-alpha.345` se guarda;
  `4.2.0-ALPHA.345` se guarda en minúsculas; `4.12.0` y vacío como hoy; rechaza `4.2`, `4.2.0-`, `4.2.0+build`,
  `4.2.0-alpha..1`, `v4.2.0`, más de 64 caracteres; `guardar` recibe el valor en minúsculas (captor). Fallan con el
  código viejo los de prerelease.

**Desktop:**
- `configuracion-moneda-modulo.component.ts`: patrón exportado + función pura `normalizarVersionMinima` (trim +
  minúsculas); el guardado la usa.
- `.html`/`.scss`: clase sin mayúsculas en el campo, texto del error.
- Spec del patrón y la normalización (Karma acotado, como el resto de esta máquina), con un caso de consistencia: todo
  valor que acepta el patrón lo lee `leerVersion`. `versionUtils.spec`: `4.2.0-alpha.345` > `4.2.0-alpha.9`,
  `alpha` < `beta`.

## Datos nuevos

Ninguno: misma clave `cliente.desktop.version_minima` en `configuracion_sistema`, mismo GraphQL.

## Contrato y canales (eje A)

- El GraphQL no cambia; el central acepta más valores. Un desktop viejo puede guardar igual que hoy.
- Un desktop **nuevo** contra un central **viejo**: la prerelease se rechaza con «La version tiene que tener la forma
  4.12.0.» → central primero (o los dos juntos).
- Lee la mínima cualquier desktop al iniciar sesión (`versionMinimaDesktop`); los viejos también comparan con semver
  (`versionUtils` es de antes): una mínima con prerelease no rompe a nadie que ya tenga ese control. Un desktop
  anterior al control no la lee.
- PWA y filial: no la usan.

## Pruebas de runtime

Central de la rama contra la bodega local (perfil `dev`, Flyway, réplica y jobs apagados; anotar el valor de
`cliente.desktop.version_minima` y restaurarlo) y el desktop de la rama (build web) contra él, usuario MR:
1. Pantalla Moneda por módulo: guardar `4.2.0-alpha.345` → se guarda y se ve en minúsculas; `4.2.0-ALPHA.345` → se
   guarda `4.2.0-alpha.345`; `4.2` y `4.2.0+1` → error de formato y botón deshabilitado; vacío → apaga el control.
2. Contra el central de `develop` (jar viejo): la prerelease se rechaza con el mensaje viejo (orden de despliegue).
3. **Bloqueo en Electron** (la versión instalada solo se lee en Electron): `npm run electron:local` de la rama reporta
   la versión del `package.json` (3.0.9; la de release la pone el empaquetado). Mínima `3.0.10-alpha.1` → bloquea;
   `3.0.9-alpha.1` → entra (3.0.9 > su prerelease). Si no se puede levantar Electron, se frena y se pregunta.
4. El campo se ve en minúsculas (`getComputedStyle` del input: `text-transform: none`) y el aviso de prerelease.
5. Recuperación: guardar vacío apaga el control (y por SQL, `valor = ''` en `cliente.desktop.version_minima`).

## Resultado de las pruebas (11-12/11/2026)

**Tests:**
- Central: `VersionClienteGraphQLTest` 5/5 y `ControlVersionMonedaTest` 2/2 (más `ConfiguracionMonedaModuloServiceTest`
  y `PrecioMonedaTest`). Con el código viejo fallan los de prerelease (4 y 1).
- Desktop: `versionUtils.spec` 12/12 en Karma (Electron, `DISPLAY=:0`, tsconfig acotado; el «full page reload» del
  final es del entorno). Contra el código viejo el spec no compila (usa el patrón y la normalización nuevos).
- `npm run build:prod` (misma configuración que `npm run check`) y `npm run verificar:imports` en verde.

**Runtime** (central de la rama contra la bodega local, perfil `dev`, Flyway, réplica y jobs apagados; desktop web de la
rama contra él, usuario MR; la bodega local no tenía la clave `cliente.desktop.version_minima`: se creó al guardar y
se borró al final):

| # | Prueba | Resultado |
|---|---|---|
| 1 | Guardar `4.2.0-ALPHA.345` | «Versión mínima: 4.2.0-alpha.345»; el campo y la base en minúsculas |
| 1 | `4.2`, `4.2.0+1`, `v4.2.0`, `4.2.0-alpha..1` | Guardar deshabilitado, «Formato 4.12.0 o 4.12.0-alpha.345» |
| 1 | `4.12.0`, `3.0.10-alpha.1` | Se aceptan |
| 2 | Contra el central de `develop` (jar viejo) | «La version tiene que tener la forma 4.12.0.» (central primero) |
| 3 | **Electron** de la rama (`build:prod` + `electron .`, versión 3.0.9, datos aislados con `XDG_CONFIG_HOME` para no tocar `~/.config/FRC`), login de Franco | Mínima `3.0.10-alpha.1` → **diálogo de versión no habilitada**; mínima `3.0.9-alpha.1` → entra sin diálogo |
| 4 | Campo y aviso | `getComputedStyle(input).textTransform` = `none`; el aviso de prerelease se ve debajo |
| 5 | Guardar vacío | Apaga el control (valor vacío en la base) |

La lista de moneda por módulo de esa pantalla falla en la bodega local («could not extract ResultSet»): le falta la
tabla de V258.5. No tiene que ver con este cambio.

## Auditoría del diff (paso 8)

Fijo 1 (permisos): `setVersionMinimaDesktop` sigue con `exigirAdmin()` primero; la sección de la pantalla sigue solo para
ADMIN. Fijo 2 (migraciones): N/A. Fijo 3 (operaciones/contrato): mismo GraphQL; el central acepta más valores y los
guarda en minúsculas; `ControlVersionMoneda.menor` compara solo la base. Condicionales: desktop sin cambios de
Electron main ni de auto-update; la lectura de la mínima no cambia.

## Auditoría (paso 5, 11/11/2026)

| # | Hallazgo | Qué se hizo |
|---|---|---|
| A1 | Lectores: control de login (semver con prerelease), pantalla, diálogo de bloqueo, flujo `VERSION_MINIMA:` (solo el prefijo), `ControlVersionMoneda`. PWA y filial no la usan | Sin cambio de enfoque |
| A2 | Versiones de Electron: `vX.Y.Z-alpha.N` / `-beta.N`, minúsculas, sin `+build` | Patrón sin `+`; minúsculas |
| A3 | Guardar en minúsculas contradice la regla de MAYÚSCULAS, pero con `ALPHA` el control no bloquearía a nadie | Excepción justificada en el plan y en el código |
| A3 | CSS global `input { text-transform: uppercase !important }` | Clase en el `<input>` con selector más específico |
| A4 | Una prerelease en producción bloquea a los estables hasta esa base | Aviso fijo en la pantalla |
| B1 | `ControlVersionMoneda.menor` no ignoraba la prerelease (la leía como 4.º número) | Se corrige: solo la base; test |
| B2 | `toLowerCase()` sin locale rompe con `tr`; sin tope de largo | `Locale.ROOT`; ≤ 64 |
| B3 | Rollback: un jar viejo devuelve la prerelease guardada (no valida al leer) y los desktops con `versionUtils` la comparan bien; recuperación = guardar vacío | Anotado en runtime 5 |
| B5 | `electron:local` reporta 3.0.9 (package.json) | Prueba de bloqueo con mínimas 3.0.x |

## Sin verificar

- Cómo inyecta el empaquetado la versión del tag en `app.getVersion()` (se prueba con la del `package.json`).
- La descripción de la clave en V258.5 dice «ej. 4.12.0»: no se toca (migración aplicada).
