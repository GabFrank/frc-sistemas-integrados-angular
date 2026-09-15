# Plan — fix #301 (RRHH): suscripciones a `onSaveCustom` sin handler de `error`

> Plan de trabajo del ciclo de 12 pasos. **Muere al cierre**: se borra en el PR final (paso 11).
> Rama: `fix/rrhh-errores-onsavecustom` (desde `origin/develop` @ `8f9a8458`, que ya trae #303).
> Alcance acordado con el usuario: **PR 1 = RRHH**. Los llamadores de otros módulos van en un PR 2
> del mismo issue.

## Estado al 2026-09-15 (paso 3)

`GenericCrudService.onSaveCustom` (`generic-crud.service.ts:518-568`):

| Camino | Aviso al usuario | Qué emite |
|---|---|---|
| éxito | «Guardado con éxito» | `next(data)` + `complete` |
| error de negocio (`res.errors`) | «Ups! Algo salió mal en operacion: …» | `error({ graphQLErrors, message })` |
| **error de red** (`:561-565`) | **ninguno** | `error(errorCrudo)` |

Nadie escucha `errorObs` (`graphql-connection.service.ts:24,206`; el otro `errorObs` de
`app.module.ts:38` tampoco), así que un error de red en `onSaveCustom` hoy es **silencio**.

Relevamiento de RRHH (agente + verificación por grep: 40 suscripciones, 3 con `subscribe({` más la
foto de `informacion-general`, que abre el objeto más abajo):

- **45 métodos** de services RRHH envuelven `onSaveCustom`; 3 **sin llamador**
  (`liquidacion.service.ts:74 onGenerarMes`, `penalizacion.service.ts:53 onGenerarAuto`,
  `vale.service.ts:29 onCrearConfirmado`) — no se tocan.
- **44 llamadas en 42 suscripciones** (en `liquidacion-detalle-dialog` y `liquidacion-final-dialog`,
  `onEditarItem`/`onAgregarItem` se eligen con un ternario y comparten un `obs.pipe(...).subscribe`):
  **4 ya manejan `error`** (`pagar-aguinaldo-dialog:53`, `informacion-general:325`,
  `liquidacion-final-generar-dialog:131`, `generar-liquidacion-dialog:105`) y **38 no** (el agente
  contó 37: `cambio-cargo-dialog` tiene dos, la externa y la encadenada). Conteo del script 2.
- **Ninguna de las 38 tiene una bandera de carga** que quede trabada. El síntoma es: el `next` no
  corre (el diálogo no se cierra, la lista no se refresca) y queda una **excepción no capturada**
  (`reportUnhandledError` de RxJS 7.8).

## Decisión (usuario, opción B)

1. **`onSaveCustom` avisa el error de red**, con el mismo snackbar que `onSave` ya usa
   (`texto: "Error de red"`, `NotificacionColor.danger`, `duracion: 3`,
   `generic-crud.service.ts:502-508`), y sigue emitiendo `error`. Sin `errorConf`: el aviso es
   incondicional, como el de negocio.
2. Los **37 llamadores** de RRHH pasan a `subscribe({ next, error })` con un `error` que **no avisa
   de nuevo** (los dos avisos ya los da `onSaveCustom`; duplicarlos es #302) y solo apaga lo que el
   `next` apagaría — en estos 37, nada:
   ```ts
   .subscribe({
     next: (res) => { ...igual que hoy... },
     // El aviso (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
     error: () => {},
   });
   ```
   El comentario va una vez por archivo, no en cada suscripción.

## Lista de cambios

| Archivo | Suscripciones |
|---|---|
| `generics/generic-crud.service.ts` | `onSaveCustom`: snackbar en la rama `error` |
| `rrhh/aguinaldo/list-aguinaldo` | `onCalcular`, `onAprobar` |
| `rrhh/bono/list-bono` | `onAnular` |
| `rrhh/configuracion-rrhh/ajuste-salario-minimo-dialog` | `onAjustarSalariosAlMinimo` |
| `rrhh/hora-extra/list-hora-extra` | `onAnular` |
| `rrhh/legajo/cambio-cargo-dialog` | `onCambiarCargo` (`error` vacío) + `onCambiarSalario` encadenado en su `next`: **excepción al patrón** *(hallazgo B2)* — en su `error` se avisa «El cargo se cambió, pero el salario no se pudo actualizar. Revisalo con Cambiar salario.» (`openWarn`) y se cierra el diálogo con el resultado del cargo (`dialogRef.close(res)`), porque el cargo ya quedó commiteado y dejarlo abierto invita a repetirlo |
| `rrhh/legajo/cambio-salario-dialog` | `onCambiarSalario` |
| `rrhh/legajo/egresar-funcionario-dialog` | `onEgresar` |
| `rrhh/legajo/revertir-egreso-dialog` | `onRevertirEgreso` |
| `rrhh/legajo/legajo-funcionario` | `onAnularDocumento` |
| `rrhh/legajo/subir-documento-dialog` | `onSaveDocumento` |
| `rrhh/liquidacion-final/liquidacion-final-dialog` | `onAgregarItem`/`onEditarItem`, `onEliminarItem`, `onAprobar`, `onVolverBorrador`, `onPagar`, `onAnular` |
| `rrhh/liquidacion/liquidacion-detalle-dialog` | `onGenerarBorrador`, `onAgregarItem`/`onEditarItem`, `onEliminarItem`, `onAprobar`, `onVolverBorrador`, `onPagar`, `onAnular` |
| `rrhh/penalizacion/list-penalizacion` | `onAnular`, `onGenerarAutoRango` |
| `rrhh/prestamo/edit-prestamo-dialog` | `onCrear` |
| `rrhh/prestamo/prestamo-cuotas-dialog` | `onCobrarCuota` |
| `rrhh/vacacion/list-vacacion` | `onDevengar` |
| `rrhh/vacacion/gestion-vacacion-dialog` | `onProgramarPeriodo`, `onAprobarPeriodo`, `onMarcarGozada`, `onVenderDias`, `onAprobarVenta`, `onAnularVenta` |
| `rrhh/vale/confirmar-vale-dialog` | `onConfirmar` |
| `rrhh/vale/list-vale` | `onAnular` |

Las rutas exactas se confirman archivo por archivo al implementar (el relevamiento dio
`archivo:línea` para cada una). Si al abrir un archivo aparece una suscripción más, o una que ya
tiene `error`, se ajusta y se anota acá.

## Fases

| Fase | Contenido | Commit | Test |
|---|---|---|---|
| 0 | Este plan, al aprobarse | `docs(rrhh): plan del fix de errores de onSaveCustom en rrhh` | — |
| 1 | `onSaveCustom` avisa el error de red | `fix(generics): avisar el error de red en onSaveCustom` | script 1 |
| 2 | Llamadores de liquidación y finiquito (`liquidacion-detalle-dialog`, `liquidacion-final-dialog`) | `fix(rrhh): manejar el error de onSaveCustom en liquidaciones` | script 2 |
| 3 | Resto de RRHH (legajo, vacación, vale, préstamo, aguinaldo, bono, hora extra, penalización, ajuste de mínimo) | `fix(rrhh): manejar el error de onSaveCustom en el resto del modulo` | script 2 |
| 4 | Cierre: borrar este plan | `docs(rrhh): retirar el plan del fix de errores de onSaveCustom` | — |

`npm run check` leído del log **una vez, al final de la fase 3** (skill `frc-desktop`), y
`git status` sin archivos ajenos antes de cada push.

### Tests

Karma no corre en este repo (memoria `karma-desktop-inejecutable`) y el CI no corre tests: el
paso del ciclo es `N/A para desktop`; se hace igual porque es barato.

**Script 1** (esbuild + node, `$CLAUDE_JOB_DIR/tmp`), `GenericCrudService` real con `gql.mutate` fake:

1. error de red → un solo `notification$.next` con `texto: "Error de red"` y `obs.error` con el
   error crudo;
2. error de negocio → un solo aviso «Ups! Algo salió mal…», **ningún** «Error de red», `obs.error`
   con `{ graphQLErrors, message }`;
3. éxito → «Guardado con éxito», `next` + `complete`, sin avisos de error;
4. respuesta vacía (`null`) → cae en negocio («Respuesta vacía del servidor»), sin «Error de red».

Rojo → verde: el caso 1 falla contra `origin/develop`.

**Script 2** (chequeo estático, node): para cada método RRHH que envuelve `onSaveCustom`, encontrar
cada llamada en `src/app/**/*.component.ts` y exigir que su suscripción tenga `error:`. Rojo contra
`origin/develop` (37 faltantes), verde al final de la fase 3. Además, instanciar **uno** de los
componentes reales (p. ej. `list-vale`) con un service fake que responde `throwError` y verificar
que no queda error no capturado.

## Datos nuevos

N/A: no nace ningún campo, columna, clave ni valor de enum. Solo cambia qué se avisa y quién
atrapa el `error`.

## Persistencia, backend, replicación

N/A para central y filial porque el cambio es solo de manejo de errores en el cliente: no toca
`.graphqls`, resolvers ni migraciones.

## Riesgos conocidos antes de auditar

- **Doble aviso ante error de red en llamadores de OTROS módulos que ya muestran su mensaje en
  `error`.** ~20 componentes fuera de RRHH (p. ej. `configurar-caja-virtual-dialog.component.ts:111-115`,
  `conteo-caja-dialog.component.ts:217-221`, `pagar-compras-dialog`, `gestion-compras`) muestran
  `err?.graphQLErrors?.[0]?.message || err?.message || '…'`. Ante un corte de red verían «Error de
  red» y después su propio aviso con el texto crudo de `HttpErrorResponse`. Hoy ven solo el segundo.
  Se acepta: es el mismo patrón de duplicado de #302 y se limpia con el PR 2 de #301 / #302.
  Hay que confirmar que ninguno de esos 17 services **fuera de RRHH** dependa de que el error de red
  sea silencioso (auditor eje A).
- **Llamadores con `forkJoin`/`firstValueFrom` de `onSaveCustom`** fuera de RRHH: el cambio no
  altera qué se emite (sigue siendo `error`), solo agrega un snackbar.
- **Cola de notificaciones secuencial** *(A4)*: varios «Error de red» seguidos (p. ej. el usuario
  reintenta con el central caído) demoran 3 s cada uno cualquier otro aviso. Aceptado.
- **Cobro parcial de cuota reentrante** *(B1, backend, preexistente)*: tras un error de red con la
  respuesta perdida, reintentar un cobro parcial cobra dos veces. Este PR no lo cambia; issue aparte.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Verificación | Qué se hizo |
|---|---|---|---|---|
| A1 | A · media | Doble aviso ante red en ~20 llamadores fuera de RRHH que ya muestran su mensaje; ninguno depende de que el error de red sea silencioso (sin reintentos ni polling atados a `onSaveCustom`) | `configurar-caja-virtual-dialog.component.ts:103-115` | Ya aceptado; PR 2 de #301 / #302 |
| A2 | A · baja | No hay `forkJoin`/loops de varios `onSaveCustom` que disparen N avisos | revisados los 27 archivos con `forkJoin` | Sin cambio |
| A3 | A · baja | `createCentralTimeoutLink` emite por `error`; nadie escucha `errorObs`; el aviso offline del header es el dot de estado, no un snackbar | `graphql-connection.service.ts:399-437`; grep de `errorObs` | Sin cambio: con el central offline, un solo «Error de red» por acción |
| A4 | A · media | La cola de `app.component.ts:97-124` es secuencial: N «Error de red» seguidos demoran cualquier aviso real N×3 s | confirmado | Riesgo aceptado (abajo); RRHH no tiene loops |
| A5 | A · baja | mobile / mobile-pwa: `onSaveCustom` no existe ahí | grep | N/A |
| A6 | A · baja | Conteo RRHH sin llamadores faltantes fuera de `modules/rrhh` (`caja-virtual-dashboard` solo embebe `ListValeComponent`) | grep | Sin cambio (conteo final del script 2: 38) |
| B1 | B · alta, **preexistente** | `PrestamoService.cobrarCuota` solo rechaza cuotas `PAGADA`: con una cuota `PARCIAL`, reintentar un cobro parcial registra otro `INGRESO` en caja | `PrestamoService.java:133-135,144-157` | **Fuera de alcance** (backend; hoy pasa igual, con o sin handler). Se propone issue aparte. No se vende el fix como «reintentar es seguro» |
| B2 | B · media | `cambio-cargo-dialog`: si `onCambiarCargo` commitea y el `onCambiarSalario` encadenado falla, el diálogo queda abierto y repetir duplica el histórico de cargo (sin guard de idempotencia) | `cambio-cargo-dialog.component.ts:87-105`; `FuncionarioRrhhService.java:55-79` | **Aplicado**: aviso explícito + cerrar con el resultado del cargo |
| B3 | B · media | «El script 2 matchea homónimos y no ve `error:` en otra línea» | El script ya resuelve por tipo inyectado y toma el `subscribe(...)` balanceado; se agregó el caso ternario (`const obs = …; obs.pipe().subscribe`) | Sin cambio adicional |
| B4 | B · baja | Rollback trivial, sin estado persistido | — | Sin cambio |

Los ejes no se contradicen: nada para que arbitre el usuario.

## Auditoría del diff (paso 8)

3 fijos; ningún condicional (el diff no toca release ni migraciones). Diff total: 21 archivos,
+330/−81 (≈200 son este plan).

| # | Eje | Hallazgo | Verificación | Qué se hizo |
|---|---|---|---|---|
| F1 | Autorización | Sin hallazgos: ningún gate de rol cambia; «Error de red» es un literal sin URL ni stack; sin `console.*` nuevos | — | Sin cambio |
| F2 | Esquema / estado | Sin hallazgos: los `next` quedaron textualmente iguales a `origin/develop`; en `cambio-cargo-dialog`, `dialogRef.close(res)` deja la pantalla alineada con la base (`legajo-funcionario.component.ts:176-184` hace `setFuncionario(res)` + `recargar()`) | comparado archivo por archivo | Sin cambio |
| F3a | Contrato · media | Un HTTP no-2xx (401, 403, 500) también entra por la rama `error` y «Error de red» mentiría | Apollo envuelve el `HttpErrorResponse` en `ApolloError.networkError` (`@apollo/client/core/QueryManager.js:662-665`); no hay manejo global de 401 fuera de `login.service.ts` | **Aplicado**: helper `mensajeErrorTransporte` en `graphqlErrorUtils.ts` («Error de red» sin status; «El servidor rechazó la operación (HTTP n)» con status) + casos 5-7 del script 1 |
| F3b | Contrato · baja | Doble aviso ante red fuera de RRHH: `conteo-caja-dialog.component.ts:217-221` y `detalle-caso-dialog.component.ts:269-272` (tesorería, no POS) | confirmado | Ya aceptado (PR 2 de #301 / #302) |

## Prueba de runtime (paso 9)

Local, sin mergear: central 8081 perfil `dev` + `ng serve -c web`, login del usuario (yo no
ingreso contraseñas). RRHH:
- **Error de negocio**: una acción que el central rechace con datos reales de la DB local (p. ej.
  anular un vale ya anulado o aprobar una liquidación que no está en BORRADOR). Esperado: un solo
  snackbar «Ups! Algo salió mal…», el diálogo sigue abierto, **sin** excepción no capturada en
  consola.
- **Error de red**: con el parche de `XMLHttpRequest.send` para `graphql` (el mismo del #300),
  disparar una acción de RRHH. Esperado: un solo «Error de red», sin excepción no capturada.
- **Camino feliz**: una acción que el central acepte. Esperado: igual que hoy.
Los casos concretos se eligen consultando la DB local antes de proponer la prueba.

## Qué queda sin verificar

- Llamadores de `onSaveCustom` fuera de RRHH: PR 2 de #301.
- Los 3 métodos RRHH sin llamador quedan como están.
- Karma y e2e: no corren en este repo.
