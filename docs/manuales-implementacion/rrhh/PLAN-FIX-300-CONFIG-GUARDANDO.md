# Plan — fix #300: el campo de Configuración RRHH queda trabado en «guardando»

> Plan de trabajo del ciclo de 12 pasos. **Muere al cierre**: se borra en el PR final (paso 11).
> Rama: `fix/rrhh-configuracion-guardando` (desde `origin/develop` @ `0933a6c7`).

## Estado del issue al 2026-09-15 (paso 3)

El issue se escribió contra `e6ee4f88`. Desde entonces entró el PR #298 (`0933a6c7`), que tocó
`GenericCrudService.onSave` pero **solo el texto** de los errores (`limpiarMensajeGraphQL` /
`limpiarErroresGraphQL`); el flujo de `next`/`error` quedó igual. Verificado en `origin/develop`:

| Camino en `GenericCrudService.onSave` | Qué emite hoy | Efecto en el panel |
|---|---|---|
| `res.errors == null` | `next(data)` + `complete` | OK: apaga `guardando` |
| error de negocio **con** `data.data` | snackbar + `next(data)` (sin `complete`) | apaga `guardando`, lo trata como guardado — sin cambios |
| error de negocio **sin** `data.data` (`generic-crud.service.ts:495`) | snackbar + `obs.error(errores limpios)` | **bug**: el `subscribe` no tiene `error` → `guardando` queda `true` + excepción no capturada en consola |
| respuesta vacía (`sinRespuestaVacia`) | cae en la fila anterior (`RESPUESTA_VACIA` tiene `errors` y `data: null`) | **bug**, igual |
| error de red (`:499-513`), incluido el abort a los 60 s de `CargandoDialogService` | nada, salvo `errorConf.networkError.propagate` | **bug**: `guardando` queda `true`, sin aviso |

Además, en los tres casos de bug la pantalla sigue mostrando un valor **que no se guardó**
(`campo.config.valor` no cambia, pero `campo.control` sí).

`ConfiguracionRrhhService.onSave` tiene **dos** llamadores: el panel y
`edit-configuracion-rrhh-dialog.component.ts:97`. Por eso el `errorConf` no se fija dentro del
service: si propagara siempre el error de red, el diálogo (que tampoco tiene handler de `error`)
pasaría de «no pasa nada» a «excepción no capturada».

Rojo verificado: el script de test (abajo) corrido contra `origin/develop` da **23 fallos**
(casos 1, 2, 3, 5 y 6); los casos 4 y 7 pasan, como se espera.

## Qué se cambia

1. **`configuracion-rrhh.service.ts`** — `onSave(input, servidor = true, errorConf?: QueryError)`,
   y lo pasa como 6º argumento a `genericService.onSave` (orden real: `gql, input, printerName,
   local, servidor, errorConf, usuarioId`). Parámetro opcional al final: el llamador existente
   (`edit-configuracion-rrhh-dialog`) no cambia de comportamiento.
2. **`panel-configuracion-rrhh.component.ts` › `onGuardar`**:
   - El cálculo del string a guardar (`toggle` → `'true'`/`'false'`, resto → `String(value ?? '')`)
     pasa a un método privado `valorDelControl(campo): string`, usado al armar el input **y** en
     el guard de revertir, para comparar siempre string con string *(hallazgo B2)*.
   - Llama `onSave(input, true, { networkError: { show: true, propagate: true } })`. `show: true`
     muestra el «Error de red» de `GenericCrudService`: el issue espera un aviso también en ese
     caso, y hoy no hay ninguno.
   - `subscribe({ next, error })`:
     - `next(res)` con `res != null` → igual que hoy (`config.valor`, snackbar, `revisarImpacto`).
     - `next(null)` o `error` → `campo.guardando = false` y se revierte el control.
   - Revertir = `campo.control.setValue(this.parseValor(valorAnterior, campo.meta), { emitEvent: false })`,
     **solo si `valorDelControl(campo) === valor`** (el control todavía muestra lo que se intentó
     guardar). Si el usuario ya lo volvió a cambiar, no se le pisa lo que escribió.
     `setValue` no re-dispara `onGuardar`: el HTML escucha `(change)`/`(selectionChange)` de
     Material, no `valueChanges` (verificado por el eje B).
   - Sin snackbar propio en el `error`: el de negocio y el de red ya los muestra `onSave`.
   - **`timeout({ first: 65 s })` antes de `untilDestroyed`** *(agregado en el paso 8, hallazgo
     F3)*: `CargandoDialogService` aborta el fetch a los 60 s, y Apollo 3.7.14 **descarta el
     `AbortError` sin emitir nada** (`@apollo/client/link/http/parseAndCheckHttpResponse.js:132`).
     Sin el timeout ese camino queda trabado igual que antes. El aviso lo da el propio
     `CargandoDialogService` («Tiempo de espera superado»); el `error` solo libera y revierte.
3. Sin cambios en `GenericCrudService`, en el HTML ni en el backend.

## Fases

| Fase | Contenido | Commit | Test |
|---|---|---|---|
| 0 | Este plan, al aprobarse | `docs(rrhh): plan del fix del campo de configuracion trabado en guardando` | — |
| 1 | Service + panel | `fix(rrhh): liberar el campo de configuracion si falla el guardado` | script esbuild + node (abajo) |
| 2 | Cierre: borrar este plan | `docs(rrhh): retirar el plan del fix del campo trabado en guardando` | — |

`npm run check` leído del log antes del push de la fase 1 (skill `frc-desktop`: AOT al final de
la implementación; acá hay una sola fase de código), `git status` sin archivos ajenos, push.

### Test de la fase 1

Karma no corre en este repo (memoria `karma-desktop-inejecutable`) y el CI no corre tests, así
que el paso del ciclo es `N/A para desktop`; se hace igual porque es barato y es la única
evidencia automatizada. Script fuera del repo (`$CLAUDE_JOB_DIR/tmp/test300.ts`), bundle con
`esbuild --platform=node`, que instancia el **`PanelConfiguracionRrhhComponent` real**:

1. `onSave` responde `throwError([{ message }])` (negocio sin data) → `guardando === false`, el
   control vuelve al valor anterior (number, toggle y month), `config.valor` intacto, sin excepción.
2. `onSave` responde `throwError(new Error('network'))` (red con `propagate`) → ídem.
3. `onSave` responde `of(null)` → ídem.
4. `onSave` responde `of(config)` → `guardando === false`, `config.valor` actualizado, control
   con el valor nuevo, snackbar de éxito llamado.
5. El usuario cambia el control a un tercer valor antes de que falle el primer guardado → el
   control conserva el tercer valor.
6. El panel pasa `errorConf.networkError.propagate === true` al service.
7. `GenericCrudService.onSave` real con un `gql.mutate` fake que falla por red: con
   `propagate` emite `error`; sin `errorConf` no emite nada (documenta por qué hace falta el 6).
8. **Cadena real** *(hallazgo B4)*: panel + `ConfiguracionRrhhService` real +
   `GenericCrudService` real, con solo el `gql.mutate` fake fallando por red → el control se
   revierte y `guardando` se apaga. Atrapa un error de posición del `errorConf` en el service.

Rojo → verde: 1-3, 5, 6 y 8 fallan contra `origin/develop` (1-6 ya verificado: 23 fallos).

## Datos nuevos

N/A: no nace ningún campo, columna, clave de configuración ni valor de enum. El único
parámetro nuevo (`errorConf` en `ConfiguracionRrhhService.onSave`) lo escribe el panel y lo lee
`GenericCrudService.onSave`.

## Persistencia, backend, replicación

N/A para central y filial porque el cambio es solo de manejo de errores en el cliente: no toca
`.graphqls`, resolvers ni migraciones. `configuracion_rrhh` es central-only (schema `rrhh`, no
publicado a filiales) y no se escribe distinto. El eje A no encontró referencias a
`ConfiguracionRrhh` en `frc-mobile` ni en `frc-mobile-pwa`.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Verificación | Qué se hizo |
|---|---|---|---|---|
| A1 | A · alta | La prueba «usuario sin `RRHH CONFIG`» no es reproducible: ese usuario no llega al panel | `side-mini-variant.component.ts:350` (`visibilityRoles`) y `openTabIfAuthorized` — confirmado | Prueba de runtime rehecha: quitar el rol en la DB con el panel abierto |
| A2 | A · baja | Solo dos llamadores de `ConfiguracionRrhhService.onSave`; `errorConf` opcional no rompe al diálogo | grep — confirmado | Sin cambio |
| B1 | B · alta | El central puede **haber guardado** y aun así llegar un error de red (abort a los 60 s de `CargandoDialogService`, o respuesta perdida): revertir mostraría un valor que no es el de la base | `cargando-dialog.service.ts:54-57,82`; `saveConfiguracionRrhh` sin `@Transactional` — confirmado | **Riesgo aceptado y documentado** (abajo). Un refetch tras error de red no ayuda en el caso típico (central caído) y el issue pide explícitamente restaurar |
| B2 | B · media | Guard de revertir con tipos distintos (control `number`, valor `string`) nunca revertiría en number/percent/money | `parseValor` y `onGuardar` — confirmado | Aplicado: `valorDelControl(campo)` compartido |
| B3 | B · media | Dos guardados del mismo campo que resuelven fuera de orden pisan `config.valor` con el más viejo | Posible, pero el spinner es `[fullScreen]="true"` con fondo (`app.component.html:6`) y bloquea clics mientras se guarda; solo por teclado sin perder el foco | **No aplicado**: preexistente, fuera del alcance del issue, y muy improbable. Documentado abajo |
| B4 | B · baja | Ningún test cubre la cadena real panel → service → generic | — | Aplicado: caso 8 |

Los dos ejes no se contradicen: no hay nada para que arbitre el usuario.

## Auditoría del diff (paso 8)

3 fijos; ningún condicional se dispara (el diff no toca maquinaria de release ni migraciones).

| # | Eje | Hallazgo | Verificación | Qué se hizo |
|---|---|---|---|---|
| F1 | Autorización | Sin hallazgos: no hay operación, botón ni dato nuevo; el gate `RRHH CONFIG` no se toca; el `error` no loguea nada | — | Sin cambio |
| F2a | Esquema | Repite B1 (revertir tras un guardado con respuesta perdida) | Ya aceptado | Sin cambio. Un error de **negocio** no guarda (`requireAnyRole` es la primera línea), así que revertir ahí es correcto |
| F2b | Esquema · baja | `parseValor('2.50')` → `2.5` y `''` → `0`: guardado espurio al primer `(change)` | Confirmado, **preexistente** (`armarCampo` ya lo hacía) | No aplicado, fuera de alcance |
| F3 | Contrato · media | «Doble aviso en el timeout de 60 s (Tiempo de espera superado + Error de red)» | **Falso tal como está**: Apollo 3.7.14 descarta el `AbortError` sin emitir (`parseAndCheckHttpResponse.js:132`). Pero de ahí sale un defecto real: ese camino **seguía trabado** con el fix | Aplicado: `timeout({ first: 65 s })` en el panel + caso 9 del test |

El abort silencioso afecta a **todos** los llamadores de `GenericCrudService` (cualquier operación
que supere los 60 s queda sin emitir). Fuera del alcance de #300; se propone issue aparte.

## Prueba de runtime (paso 9)

Local, sin mergear: central en 8081 con perfil `dev` + `npm run ng:serve` desde Chrome.
RRHH › Configuración:
- **Error de negocio**: entrar con un usuario que tenga `RRHH CONFIG` y **no** sea superusuario
  (ni rol `ADMIN` ni nickname `ADMIN`), abrir el panel y, **con el panel abierto**, quitarle el rol
  en la DB local. Después cambiar una clave numérica. Esperado: snackbar «No autorizado: se
  requiere el rol RRHH CONFIG…», spinner apagado, valor anterior de vuelta, campo editable.
  Por qué así *(A1)*: el desktop conserva los roles del login, mientras que
  `RrhhSecurityService.currentRoles()` los relee de la DB en cada llamada
  (`roleService.findByUsuarioId`, sin caché), así que la mutación falla en
  `saveConfiguracionRrhh` → `seg.requireAnyRole(seg.CONFIG)` con `data: null`.
  Al terminar, devolverle el rol.
- **Error de red**: con DevTools › Network › Offline (o el central bajado), cambiar un toggle.
  Esperado: «Error de red», toggle de vuelta a su estado, campo editable.
- **Camino feliz**: con un usuario con `CONFIG`, cambiar una clave y volverla a su valor.
  Esperado: igual que hoy.
El usuario de prueba se elige consultando la DB local antes de proponer la prueba.

## Qué queda sin verificar / riesgos aceptados

- **B1 — guardado exitoso con respuesta perdida**: si el central persiste y la respuesta no llega
  (abort a los 60 s o corte de red después del commit), el control vuelve al valor anterior
  aunque en la base quedó el nuevo. Reabrir el panel muestra el valor real. Antes del fix el
  síntoma era peor (campo trabado y mostrando un valor sin confirmar).
- **B3 — guardados concurrentes fuera de orden**: preexistente, no se toca.
- **F2b — `parseValor` normaliza** (`'2.50'` → `2.5`, `''` → `0`): preexistente, no se toca.
- **Abort silencioso de Apollo en `GenericCrudService`**: toda operación que supere los 60 s
  de `CargandoDialogService` queda sin emitir, en cualquier pantalla. El panel se cubre con su
  propio `timeout`; el arreglo general merece issue aparte.
- **El caso timeout no se prueba en runtime** (exigiría un central que tarde >60 s); lo cubre el
  caso 9 del script.
- `edit-configuracion-rrhh-dialog` sigue sin handler de `error` en su `onSave` (el diálogo queda
  abierto y la excepción sin capturar). Fuera del alcance del issue; se deja anotado.
- Doble snackbar en el camino feliz («Guardado con éxito» de `onSave` + «Configuración guardada»
  del panel): preexistente, no se toca.
- El camino «error de negocio **con** `data`» sigue contándose como guardado (el backend devolvió
  la entidad). No se reproduce con este resolver, que devuelve `ConfiguracionRrhh!` o lanza.
- Karma y e2e: no corren en este repo.
