# Plan — fix #302: avisos duplicados en llamadores de `onSaveCustom`

> Plan de trabajo del ciclo de 12 pasos. **Muere al cierre**: se borra en el PR final (paso 11).
> Rama: `fix/generics-avisos-duplicados` (desde `origin/develop` @ `a7d5ac8d`, que ya trae #305 y #306).
> Decisión del usuario: **opción C**. Plan aprobado el 2026-09-15; **B3-a** (resultado por ítem en los
> lotes de dinero/stock), la recomendada, se toma como parte de lo aprobado — el usuario no eligió
> explícitamente entre B3-a y B3-b. Esos dos componentes van al final de cada PR para poder quitarlos.

## Decisión (opción C)

| Evento | Dueño del aviso | Cómo |
|---|---|---|
| **Error** (negocio o transporte) | **solo `GenericCrudService.onSaveCustom`** (trae el mensaje real del backend, limpio desde #298) | Los componentes dejan de mostrar su propio aviso en `error`; el `error` solo apaga banderas / cierra overlays / revierte estado |
| **Éxito** | **el componente**, cuando tiene un texto **específico** (qué se hizo o cuántos) | `onSaveCustom(gql, data, servidor = true, opciones?: { avisarExito?: boolean })`: con `{ avisarExito: false }` no muestra «Guardado con éxito». El service wrapper deja pasar `opciones` (último parámetro, opcional). Sin texto específico → sigue avisando el genérico |
| **Lote** (`forkJoin` de N) | el componente, **un solo** aviso agregado | Cada llamada del lote va con `{ avisarExito: false }` — ver B3 para los lotes de dinero/stock |

**Objeto de opciones, no booleano** *(hallazgo A1)*: 8 wrappers terminan en `servidor: boolean = true`
(`MaletinService.onIngresarCierre`/`onEgresar` `maletin.service.ts:36,51`; `RetiroService.onIngresarACajaMayor`
`retiro.service.ts:62`; `TransferenciaService.onSaveTransferenciaItem(input, precioCosto?, servidor)` `transferencia.service.ts:178`;
`LiquidacionService.onGenerarLote` `liquidacion.service.ts:78`; `PenalizacionService.onGenerarAutoRango`
`penalizacion.service.ts:57`; `AguinaldoService.onCalcular` `aguinaldo.service.ts:30`;
`ConfiguracionRrhhService.onAjustarSalariosAlMinimo` `configuracion-rrhh.service.ts:39-40`). Con un booleano
posicional, `wrapper(…, false)` compilaría y apagaría `servidor` (→ `clientName: null` → cliente local) sin
ningún error. Con un objeto, pasarlo en la posición de `servidor` es error de tipos en el build AOT.

`opciones.avisarExito` apaga **solo** el aviso de éxito: no toca el diálogo «Guardando...» ni los avisos
de error (a diferencia de `silentLoad` de `onCustomMutation`, que apaga el diálogo y el aviso de error).

## Estado (paso 3)

Inventario (agente + lectura de cada sitio + chequeo estático): 82 wrappers de `onSaveCustom`, 88
llamadas desde componentes; la mayoría sin aviso propio. Tres wrappers sin llamador no se tocan
(`PagarComprasService.onPagarLote`, `MaletinService.onIngresar`, `ValeService.onCrearConfirmado`).

**Fuera de alcance**: `ChequeService` y `MarcacionService` (usan `onSave` / `onCustomMutation`);
`gestion-productos-proveedor-dialog.onDesvincular` (Apollo directo); `PagarComprasService` (salvo
`onPagarLote`, usa `mutar()` sin aviso genérico). Hay **dos** clases `CajaVirtualService`: se toca solo
`financiero/caja-virtual/caja-virtual.service.ts` (`rrhh/caja-virtual/caja-virtual.service.ts` no usa
`onSaveCustom`).

## Cambios

### 1. `GenericCrudService.onSaveCustom`

- Cuarto parámetro `opciones?: { avisarExito?: boolean }`; «Guardado con éxito» solo si
  `opciones?.avisarExito !== false`.
- **Ventana anti-ráfaga también para errores de negocio** *(B1)*: hoy solo aplica a transporte. Un
  lote con varios rechazos iguales muestra N «Ups! Algo salió mal…» de 5 s en cola (ya pasa hoy,
  sumado al aviso propio del componente). Misma clave (operación + texto), misma ventana.
- **Texto de respaldo** *(B2)*: si `res.errors[0].message` no es string o viene vacío,
  `limpiarMensajeGraphQL` lo devuelve tal cual y el aviso dice «…operacion: undefined». Se usa
  «el servidor no dio detalle» como respaldo. Hoy lo tapaba el aviso propio del componente, que este fix quita.

### 2. Wrappers que dejan pasar `opciones` (último parámetro, opcional)

| Service | Métodos |
|---|---|
| `BancoService` | `onSave`, `onDelete` |
| `MonedaService` | `onSave`, `onDelete` |
| `CuentaBancariaService` | `onSave`, `onDelete`, `onAjustarSaldo` |
| `CajaVirtualService` (financiero) | `onSave`, `onDelete`, `onOtorgarAcceso`, `onRevocarAcceso`, `onTransferirPropiedad`, `onSaveConfiguracion`, `onRealizarTransferencia`, `onSaveMovimiento`, `onAnularMovimiento` |
| `EntradaVariaService` | `onRegistrar`, `onAnular` |
| `MaletinService` | `onEgresar`, `onIngresarCierre` |
| `OperacionFinancieraService` | `onRegistrar`, `onAnular` |
| `RetiroService` | `onIngresarACajaMayor` |
| `RetiroVerificacionService` | `onAsignarCaso`, `onAnular` |
| `TransferenciaService` | `onSaveTransferenciaItem` |
| `LiquidacionService` | `onGenerarLote` |
| `PenalizacionService` | `onGenerarAutoRango` |
| `ConfiguracionRrhhService` | `onAjustarSalariosAlMinimo` |
| `AguinaldoService` | `onCalcular` |

En los wrappers con `servidor` al final, el llamador que silencia escribe
`wrapper(…args, true, { avisarExito: false })`. Si omite el `true`, el build falla (objeto en lugar de
booleano).

### 3. Componentes

Leyenda: **E** = quitar el aviso propio del `error` (conservar el resto); **S** = pasar
`{ avisarExito: false }` y conservar el aviso propio de éxito; **B** = lote.

#### PR A — tesorería / financiero

| Componente | Llamada | Cambio |
|---|---|---|
| `banco/add-banco-dialog.component.ts:53` | `onSave` | E + S (`'Banco guardado correctamente'`) |
| `banco/banco.component.ts:77` | `onDelete` | S; el `else openAlgoSalioMal` **se conserva** (el backend devolvió `false`, no es un error: `CrudService.deleteById` atrapa la excepción) |
| `moneda/add-moneda-dialog.component.ts:79` | `onSave` | E + S |
| `moneda/moneda.component.ts:65` | `onDelete` | S; `else` se conserva |
| `cuenta-bancaria/add-cuenta-bancaria-dialog.component.ts:151` | `onSave` | E + S |
| `cuenta-bancaria/cuenta-bancaria.component.ts:114` | `onDelete` | S; `else` se conserva |
| `cuenta-bancaria/ajustar-saldo-cuenta-dialog.component.ts:97` | `onAjustarSaldo` | E + S |
| `caja-virtual/add-caja-virtual-dialog.component.ts:101` | `onSave` | E + S |
| `caja-virtual/list-caja-virtual.component.ts:171` | `onDelete` | S; `else` se conserva |
| `caja-virtual/gestionar-accesos-caja-dialog.component.ts:130,154,176` | `onOtorgarAcceso`, `onRevocarAcceso`, `onTransferirPropiedad` | E + S (×3) |
| `caja-virtual/configurar-caja-virtual-dialog.component.ts:96` | `onSaveConfiguracion` | E + S |
| `caja-virtual/transferencia-caja-virtual-dialog.component.ts:104,120` | `forkJoin` ≤3 `onRealizarTransferencia` (helper) | E + S + B |
| `caja-virtual/add-movimiento-caja-virtual-dialog.component.ts:123,151` | `forkJoin` ≤3 `onSaveMovimiento` (helper) | E + S + B |
| `caja-virtual/conteo-caja-dialog.component.ts:208` | `onSaveMovimiento` | E (el éxito ya lo deja al genérico, a propósito) |
| `caja-virtual/ingresar-retiro-caja-mayor-dialog.component.ts:249` | `forkJoin` N `onIngresarACajaMayor` | **ver B3** |
| `caja-virtual/caja-virtual-dashboard.component.ts:666-685` | ternario de 4 ramas | **MIXTO** *(B4)*: las 3 ramas de `onSaveCustom` (`retiroVerificacion.onAnular`, `operacionFinanciera.onAnular`, `cajaVirtual.onAnularMovimiento`) van con `{ avisarExito: false }`. El aviso local de error se muestra **solo si** `esPagoCpp` (`pagarCompras.onAnularPago`, Apollo directo, único aviso) **o** `err?.avisoLocal` — el `throwError` manual «No se encontró la verificación de este retiro» (rama de retiro, `:670`) se arma con `Object.assign(new Error(…), { avisoLocal: true })`, porque no pasa por `onSaveCustom` y si no nadie lo mostraría |
| `entrada-varia/add-entrada-varia-dialog.component.ts:105` | `onRegistrar` | E + S |
| `entrada-varia/list-entradas-varias-dialog.component.ts:77` | `onAnular` | S; `else` se conserva |
| `maletin/maletin-tesoreria-dialog.component.ts:149/154` | ternario `onEgresar`/`onIngresarCierre` | E + S (las dos ramas pasan por `onSaveCustom`; firmas con `servidor` al final → `…, true, { avisarExito: false }`) |
| `operacion-financiera/add-operacion-financiera-dialog.component.ts:610` | `onRegistrar` | S (E ya estaba bien) |
| `operacion-financiera/list-operacion-financiera.component.ts:109` | `onAnular` | S (E ya estaba bien) |
| `operacion-financiera/operacion-financiera-detalle-dialog.component.ts:78` | `onAnular` | E (conserva `isAnulando = false`) + S (`'Operación anulada'`). *No estaba en el inventario del agente: lo encontró el chequeo estático* |
| `retiro/verificacion/list-retiro-casos.component.ts:228` | `onAsignarCaso` | S (`Caso del retiro #N tomado`) |
| `retiro/verificacion/verificar-retiro-dialog.component.ts:212` | `onVerificar` | E |
| `retiro/verificacion/detalle-caso-dialog.component.ts:258` | `onResolverCaso` | E |

#### PR B — RRHH, operaciones, productos (tras el merge de A)

| Componente | Llamada | Cambio |
|---|---|---|
| `rrhh/liquidacion/generar-liquidacion-dialog.component.ts:105` | `onGenerarLote` | S (`'Borradores generados: N'`; `servidor` al final) |
| `rrhh/penalizacion/list-penalizacion.component.ts:139` | `onGenerarAutoRango` | S (éxito o warn «ninguna generada»; `servidor` al final) |
| `rrhh/aguinaldo/list-aguinaldo.component.ts:98` | `onCalcular` | S (`'Aguinaldos calculados: N'`; `servidor` al final) |
| `rrhh/configuracion-rrhh/ajuste-salario-minimo-dialog.component.ts:126` | `onAjustarSalariosAlMinimo` | S (`'N salario/s ajustado/s'`; `servidor` al final) |
| `operaciones/transferencia/edit-transferencia.component.ts:1046` (aviso en `:1061`) | `onSaveTransferenciaItem` | S (`'Lotes asignados'`; firma `(input, precioCosto?, servidor, opciones)`) |
| `operaciones/inventario/list-productos-vencidos.component.ts:367,375` | `forkJoin` N `onSaveTransferenciaItem` | **ver B3** |
| `operaciones/devolucion/edit-devolucion.component.ts:691` | loop N `onSaveDevolucionItem` | E (conserva `huboError` y `closeDialog`). *B5, aceptado*: se pierde el «de un item», pero el genérico da el motivo real del backend |
| `productos/producto/gestion-proveedores-producto-dialog.component.ts:140` | `saveProductoProveedor` | E |

**Excepción que se conserva**: `rrhh/legajo/cambio-cargo-dialog.component.ts:106` — al fallar el
salario encadenado muestra «El cargo se cambió, pero el salario no se pudo actualizar…» además del
genérico. No repite el texto: explica un estado parcial (decisión del #301).

## B3 — lotes de dinero y stock (decisión pendiente)

`ingresar-retiro-caja-mayor-dialog.component.ts:242-259` hace `forkJoin(items.map(onIngresarACajaMayor))`.
`forkJoin` corta en el primer error, pero las demás llamadas siguen y pueden commitear. Hoy la única
pista de qué retiros ya entraron son los N «Guardado con éxito» del genérico; en el error el diálogo
queda abierto con la misma selección y solo dice `err.message`. Si se silencia el éxito por ítem, el
usuario no sabe cuántos retiros ya impactaron la caja mayor y puede reintentar. Mismo patrón (stock)
en `list-productos-vencidos.component.ts:375-389`.

- **B3-a (recomendada)**: resultado **por ítem**. Cada llamada con `{ avisarExito: false }` y
  `catchError` → `{ ok, item }`; `forkJoin` ya no corta. Al terminar: todo bien → el aviso agregado de
  hoy; parcial → un aviso «X de N retiros ingresados; Y con error» (los motivos ya los mostró el
  genérico, deduplicados), quitar de la selección los que entraron y recargar la lista. Cambia el flujo
  de dos componentes.
- **B3-b**: dejar esos dos lotes **fuera** del #302 (sin tocar) y abrir un issue aparte.

## Fases

| Fase | Contenido | Commit |
|---|---|---|
| 0 | Este plan | `docs(generics): plan del fix de avisos duplicados` |
| 1 (PR A) | `onSaveCustom` (opciones, ventana de negocio, respaldo) + wrappers de tesorería | `fix(generics): permitir que el llamador se quede con el aviso de exito` |
| 2 (PR A) | Componentes de tesorería (+ `ingresar-retiro` según B3) | `fix(financiero): un solo aviso por operacion en tesoreria` |
| 3 (PR B) | Wrappers + componentes de RRHH, operaciones y productos | `fix(rrhh): …` / `fix(operaciones): …` |
| 4 | Cierre: borrar este plan | `docs(generics): retirar el plan del fix de avisos duplicados` |

Build AOT leído del log antes de cada push; `git status` sin archivos ajenos.

## Tests

- **`onSaveCustom`** (`$CLAUDE_JOB_DIR/tmp/test302a.ts`, esbuild + node): default igual;
  `{ avisarExito: false }` → sin «Guardado con éxito», mismo `next`/`complete` y mismo diálogo; errores
  de negocio y red siguen avisando. Se agregan: ventana de negocio (N rechazos iguales de la misma
  operación → 1 aviso; otra operación → avisa) y respaldo (`message` undefined/vacío → texto de
  respaldo, nunca «undefined»). **Rojo verificado** contra `develop` (caso `avisarExito`).
- **Chequeo estático** (`$CLAUDE_JOB_DIR/tmp/check302.mjs`): por cada llamada a un wrapper de
  `onSaveCustom`, (E) el `error` no puede mostrar aviso propio salvo las excepciones; (S) si el `next`
  avisa éxito, el último argumento tiene que ser `{ avisarExito: false }`.
  **Rojo verificado contra `develop`: 41 hallazgos (17 E, 24 S)**, sobre 82 wrappers y 88 llamadas.
  Lee solo las claves `next`/`error` de **primer nivel** del observer y sigue los ternarios
  `const obs = … ; obs.subscribe`. **No puede ver 8 llamadas** («?»), que se cubren con tests de
  componente o lectura: `add-movimiento-caja-virtual-dialog` y `transferencia-caja-virtual-dialog`
  (helper + `forkJoin`), `list-productos-vencidos` (`forkJoin` N), `caja-virtual-dashboard` (ternario
  anidado, 3 ramas) y `maletin-tesoreria-dialog` (2 ramas).
- **Lotes**: `add-movimiento-caja-virtual-dialog` real con services fake → un solo aviso de éxito.
- **MIXTO**: `caja-virtual-dashboard.onAnularMovimiento` por rama → CPP y el `throwError` manual
  conservan su aviso; las otras 3 no.
- **B3-a** (si se elige): `ingresar-retiro` con 3 ítems, uno falla → aviso «2 de 3», selección sin los 2
  que entraron.

## Datos nuevos

N/A (parámetro de cliente, sin backend).

## Persistencia, backend, replicación

N/A: solo presentación de avisos en el cliente.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Verificación | Qué se hizo |
|---|---|---|---|---|
| A1 | A · alta | Un booleano `avisarExito` al final cae en `servidor` en 8 wrappers sin error de compilación | Firmas leídas (lista arriba) | **Aplicado**: objeto de opciones `{ avisarExito }`; el build rechaza el objeto en la posición de `servidor` |
| A2 | A · baja | `edit-transferencia` está en `:1046`/`:1061`, no `:1041` | leído | Corregido |
| A-nota | A | Dos clases `CajaVirtualService` | leído | Aclarado cuál se toca |
| A-Q2/Q4/Q5 | A | Otros llamadores quedan igual (default); división PR A/B coherente; mobile N/A | — | Sin cambio |
| A-falso | A | «`check302.mjs` y `test302a.ts` no existen» | Existen en `$CLAUDE_JOB_DIR/tmp`, fuera del repo a propósito | Sin cambio (rutas explícitas en el plan) |
| B1 | B · alta | Lote con varios errores de negocio → N avisos de 5 s en cola | **Exagerado**: hoy `onSaveCustom` ya muestra esos N **más** el aviso del componente; el fix no empeora. Igual la cola se tapa | **Aplicado**: ventana anti-ráfaga también en negocio |
| B2 | B · alta | Sin `message` el aviso dice «…operacion: undefined»; lo tapaba el aviso propio que se quita | `limpiarMensajeGraphQL` devuelve tal cual lo que no es string | **Aplicado**: texto de respaldo |
| B3 | B · alta | Lotes de dinero/stock: silenciar el éxito por ítem deja al usuario sin saber cuántos entraron antes del corte | `ingresar-retiro-caja-mayor-dialog.component.ts:242-259` | **Decide el usuario** (B3-a / B3-b) |
| B4 | B · media | Rama de retiro del dashboard: el `throwError` manual no pasa por `onSaveCustom`; condicionar el aviso solo a CPP lo pierde | `caja-virtual-dashboard.component.ts:666-685` | **Aplicado**: `avisoLocal` en ese error (reemplazado por D1) |
| B4-nota | B · preexistente | Si `onGetVerificacion` (`onCustomQuery` sin `errorConf`) falla por red, no notifica ni completa | — | Anotado, fuera de alcance |
| B5 | B · baja | `edit-devolucion` pierde «de un item»; estado parcial preexistente | — | Aceptado |

## Auditoría del diff — PR A (paso 8)

| # | Fijo | Hallazgo | Verificación | Qué se hizo |
|---|---|---|---|---|
| D1 | 3 · media | El dashboard callaba por defecto: un error que no fuera CPP ni `avisoLocal` quedaba mudo | `caja-virtual-dashboard.component.ts` `onAnular` | **Aplicado**: por defecto avisa; solo calla lo que viene de las 3 ramas de `onSaveCustom`, marcado con `avisadoPorOnSaveCustom` en un `catchError`. Se retira `avisoLocal` |
| D2 | 2 · media | La ventana de 3 s en errores de negocio calla un reintento manual rápido con el mismo error | `avisarErrorSinRepetir` | **Aceptado**: la ventana (3 s) es menor que la duración del aviso de negocio (5 s), así que solo se calla mientras el aviso idéntico sigue en pantalla |
| D3 | 2 · baja | Retiro del dashboard: si `onGetVerificacion` falla por negocio, `onCustomQuery` avisa y devuelve `null`, y además sale «No se encontró la verificación» | Igual en `develop` | Preexistente, anotado en riesgos |
| D4 | 2 | Esquema, migraciones, banderas de guardado y cierres de diálogo | Diff contra `develop`, suscripción por suscripción | Sin hallazgos |
| D5 | 1 | Roles y alcance | — | Sin hallazgos; la nota de UX de la rama retiro es D3 |

## Riesgos conocidos

- Wrappers con `servidor` al final: mitigado por tipos (A1).
- **Preexistente**: `onGetVerificacion` sin `errorConf` puede dejar colgada la anulación de un retiro
  si falla por red; si falla por negocio, sale su aviso más «No se encontró la verificación» (D3).
- **Preexistente**: en `edit-devolucion`, si falla 1 de N ítems del canje, los demás quedan guardados y
  `huboError` bloquea el avance sin decir cuáles entraron.
- **Tamaño**: dos PRs para no pasar las 400 líneas netas.

## Prueba de runtime (paso 9)

Local (central 8081 `dev` + `ng serve -c web`, login del usuario): guardar/borrar una moneda o banco de
prueba (éxito con texto propio, un solo aviso) y un error con el parche de XHR (un solo «Error de red»).
Casos concretos elegidos consultando la DB local.

**Resultado PR A (2026-09-15, `fd57aea1`)**, avisos contados con un `MutationObserver` sobre el snackbar:

| Caso | Avisos | Estado |
|---|---|---|
| Borrar banco de prueba | `["Banco eliminado correctamente"]` | OK, dato de prueba retirado |
| Crear banco con `saveBanco` cortado por red (parche de XHR) | `["Error de red"]`; el diálogo sigue abierto y «Guardar» vuelve a habilitarse | OK, no se creó nada |

Un primer intento dio `["Banco guardado correctamente","Guardado con éxito"]`: la pestaña tenía cargado el
bundle de antes de levantar `ng serve` (`performance.timeOrigin` 13:43). Con recarga real, el caso de arriba.

## Qué queda sin verificar

- `ChequeService` / `MarcacionService` (`onSave` / `onCustomMutation`) pueden tener el mismo patrón
  de duplicado: otro issue.
- Karma y e2e: no corren en este repo.
