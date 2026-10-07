# Plan — errores de red en RRHH: dinero (issue #390, PR 4)

Pieza: **desktop**. Rama: `fix/rrhh-errores-de-red-en-liquidaciones`, desde `origin/develop` **después del merge de
#394**. Usa `PROPAGAR_ERROR_DE_RED` (#391) y `TIMEOUT_POR_DEFECTO_MS` (`timeout-link`).
Análisis de base: `docs/manuales-implementacion/analisis-oncustomquery-sin-propagate.md`. Skill: `rrhh-expert`.

**RRHH es central-only**: todas estas consultas van al central (`servidor = true`).

## Regla (la de #391–#394)

«Propagar» = solo `networkError`, con `{ timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }` (60 s:
pantallas de administración contra el central; hoy el corte es 300 s). Todos los métodos de este PR tienen **un solo
lugar** que los usa, salvo los indicados (auditoría A: grep exhaustivo, ningún suscriptor fuera de `modules/rrhh`):
se agrega su `error:` y se propaga en el servicio. Un `null` se interpreta **según el método** (ver cada punto):
no siempre es un error.

## 1. Detalle de liquidación (`liquidacion-detalle-dialog`)

- **Conceptos para ítem manual** (`onGetConceptosParaItemManual`, `:133`): hoy, con un error GraphQL, `res || []`
  deja `conceptos` vacío → `sinCatalogo = true` → se quita el validador de operación y se muestra el campo «tipo»
  (`html:35`): se puede cargar un bono con el **signo equivocado**. Cambio:
  - `[]` (catálogo vacío de verdad) → `sinCatalogo = true`, como hoy;
  - `null` o error → flag `conceptosNoCargados`: `sinCatalogo` **no** se activa, el botón «Agregar» se oculta y
    se avisa «No se pudieron cargar los conceptos: no se pueden agregar ítems manuales. Reabrí la liquidación para
    reintentar.». **Editar un ítem existente sigue andando** (no depende del catálogo, `:213-227`).
- **Cabecera** (`onGetById`, `:159`): `error:` con aviso «No se pudo cargar la liquidación…» (sin cabecera el
  diálogo no tiene botones: todo está bajo `*ngIf="liq"`).
- **Ítems** (`onGetItems`, `:172`, recargados desde `recargar()` y `aplicar()` tras guardar/eliminar/aprobar/pagar):
  Aprobar/Pagar/Anular mandan solo el id y los montos los lee el backend (`LiquidacionSueldoGraphQL:87-106`): el
  riesgo es aprobar sin ver. Cambio:
  - flag `itemsCargados`: `true` con una respuesta (también `[]`: una liquidación sin ítems es legítima),
    `false` con `null` o error; **no** se baja al iniciar una recarga (sin parpadeo);
  - gatea **solo Aprobar** (BORRADOR). **Pagar no**: un fallo en la recarga que sigue a Aprobar dejaba la
    liquidación aprobada sin poder pagarse; el neto viene de la cabecera y el backend recalcula;
  - aviso «No se pudieron cargar los ítems…» con un botón **«Reintentar»** que llama a `cargarItems`.
- **Programados** (`onGetItemsProgramados`, `:180`): ya tiene `error: () => {}` → propagar (informativo).

## 2. Finiquito

- `liquidacionFinal.onGetPorFuncionario` (devuelve **lista**: sin finiquito responde `[]`, nunca `null`;
  `LiquidacionFinalGraphQL.java:41-44`). Suscriptores: `legajo-funcionario:245` (botón «Finiquito») y
  `liquidacion-final-dialog:95/:110`. Hoy un `null` (error) se aplana con `res || []` y el legajo **ofrece generar
  otro finiquito aunque ya exista**. Cambio: `res == null` (no `!res`) o error → aviso «No se pudo consultar el
  finiquito…»; en el legajo **no** se ofrece generar; en el diálogo se **conservan** los datos que había.
- `liquidacionFinal.onGetItems` (`liquidacion-final-dialog:104`): mismo criterio que la liquidación —
  `itemsCargados` gatea solo **Aprobar** del finiquito (`html:113`), con «Reintentar».
- `liquidacionFinal.onPreview` (`liquidacion-final-generar-dialog:79`): `cargandoPreview` solo baja en `next` →
  con error de red «Generar» queda con spinner hasta 300 s; con `null` (error de negocio: funcionario inexistente,
  permiso; `previewDefaults` nunca devuelve `null` por fecha, `LiquidacionFinalService.java:237-264`) se habilita
  con campos vacíos. Cambio: flag `previewFallo` que se **resetea al iniciar cada cálculo**; error o `null` →
  baja `cargandoPreview`, `previewFallo = true`, **«Generar» deshabilitado** y aviso «No se pudo calcular el
  finiquito. Cambiá la fecha o reabrí para reintentar.»; las respuestas de un cálculo anterior (cambio de fecha
  rápido) se descartan con un contador.

## 3. Revertir egreso (`legajo-funcionario:215`)

`legajo.onGetEgresoVigente`: **`null` es legítimo** — el backend lo devuelve a propósito cuando el egreso es
anterior al histórico (`FuncionarioRrhhGraphQL.java:96-103`) y el diálogo pide el crédito a mano. Cambio: solo el
**error de red** bloquea (aviso «No se pudo consultar el egreso…», no se abre la reversa); `null` abre la reversa
manual como hoy. (Un error GraphQL también llega como `null` y abre la manual: acotado, el resto de las llamadas
del legajo fallarían igual.)

## 4. Cuotas de vales y préstamos

- `vale.onGetCuotas` (`vale-cuotas-dialog:34`, solo lectura): su `error: () => cargando = false` hoy es
  inalcanzable → propagar + aviso «No se pudieron cargar las cuotas…».
- `prestamo.onGetCuotas` (`prestamo-cuotas-dialog:59`): también se recarga después de cobrar (`:93-96`). Si el
  cobro salió y la recarga falla, la tabla mostraba la cuota como cobrable con el monto viejo. Cambio: `error:` o
  `null` → la tabla se vacía (nada cobrable) y aviso con «Reintentar».

## 5. Exposición financiera del legajo (`financiero-legajo`)

Vales (`:80`), préstamos (`:93`), penalizaciones (`:112`) — un suscriptor cada uno → propagar en el servicio — y
el crédito del cliente (`cargarCredito`, `:120-134`, con `clienteService`/`ventaCreditoService`, que tienen
otros suscriptores → **opt-in**). Hoy, sin respuesta, la exposición queda en **0** sin indicador. Cambio: un flag
**por fuente**; si alguna falló, la exposición total se muestra «no disponible» (con la lista de lo que no cargó)
en vez de 0. Los flags se resetean en cada recarga (`ngOnChanges` → `recomputarExposicion`).

Fuera de este PR: listas (list-liquidacion, list-vale, list-prestamo, aguinaldo, bono, vacaciones), dashboard y
reportes RRHH, configuración RRHH → PR siguiente de RRHH.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `conceptosNoCargados` | `liquidacion-detalle-dialog.ngOnInit` | botón «Agregar» |
| `itemsCargados` (liquidación y finiquito) | `cargarItems` / `recargarItems` | botón Aprobar + «Reintentar» |
| `previewFallo` + contador de cálculo | `liquidacion-final-generar-dialog.cargarPreview` | botón Generar |
| fuentes no cargadas de la exposición | `financiero-legajo` | su template |
| opt-in `errorConf`/`contexto` en los métodos de crédito usados por `cargarCredito` | `financiero-legajo` | `onCustomQuery` |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(rrhh): no cargar items manuales ni aprobar una liquidacion sin datos del servidor` | 1 |
| 2 | `fix(rrhh): no ofrecer otro finiquito ni generarlo sin datos del servidor` | 2, 3 |
| 3 | `fix(rrhh): avisar cuando no cargan cuotas ni la exposicion del funcionario` | 4, 5 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` al final.

## Prueba de runtime

**El central alpha es compartido: no se congela.** Decisión de Franco (2026-10-03): **central local**, desde una
rama local con la última `develop`, con `application.properties` (sin perfil: `:8081`, base `bodega` local) y los
schedulers de replicación apagados por argumento (verificado en *Negative matches* del `--debug`). El desktop apunta
el central a `localhost:8081` y se congela con `kill -STOP` (con `kill -CONT` de respaldo). Casos: abrir una
liquidación, agregar ítem manual, Finiquito desde el legajo, generar finiquito, cuotas de un vale/préstamo,
pestaña financiera del legajo.

## Riesgos y qué queda sin verificar

- Con el central lento, **Aprobar** queda deshabilitado hasta que carguen los ítems; «Reintentar» lo resuelve sin
  cerrar. Pagar no se bloquea.
- Ítems manuales: con los conceptos sin cargar no se pueden agregar (sí editar) hasta reabrir.

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | Revertir egreso: `null` es **legítimo** (egreso anterior al histórico, `FuncionarioRrhhGraphQL.java:96-103`); el plan lo bloqueaba | crítica | **verificado**; solo el error de red bloquea, `null` abre la reversa manual |
| B | `itemsCargados` bloqueaba Pagar si fallaba la recarga que sigue a Aprobar, sin forma de reintentar | alta | gatea solo Aprobar; «Reintentar»; `[]` cuenta como cargado; no parpadea |
| B | Cuotas de préstamo: tras cobrar, una recarga fallida dejaba la cuota como cobrable con el monto viejo | alta | error o `null` vacían la tabla + «Reintentar» |
| A/B | Finiquito: `onGetPorFuncionario` devuelve lista (`[]` = sin finiquito); `null` es error. El diálogo debe conservar datos | media | `res == null`, no `!res`; conservar y avisar |
| A | Finiquito sin el mismo resguardo de Aprobar | media | `itemsCargados` también en `liquidacion-final-dialog` |
| A/B | `previewFallo` trabado al cambiar la fecha; respuestas viejas pisan nuevas; mensaje «no responde» falso ante errores de negocio | media | reset al iniciar, contador, mensaje genérico |
| B | Conceptos sin cargar: «Agregar» quedaba visible sin forma de elegir operación | media | se oculta; editar sigue andando |
| A/B | Exposición: el crédito también la alimenta; el «no disponible» debe ser por fuente y resetearse | baja | aplicado |
| A | Timeouts sin especificar (quedaba 300 s) | media | 60 s (`TIMEOUT_POR_DEFECTO_MS`) silenciado |
| A | Ningún suscriptor fuera de `modules/rrhh`; mobile no comparte código | — | verificado |

## Prueba de runtime (paso 9, 2026-10-03)

Central local `:8081` (rama local desde `develop` 70f1429d, `application.properties`, replicación apagada y verificada en
*Negative matches*), congelado con `kill -STOP` y `kill -CONT` de respaldo. Desktop `ng serve -c web` apuntado al `:8081`.
Para ver el gating sobre datos ya cargados, varios casos abren la pantalla con el central normal y fuerzan la recarga
con el central congelado (`ng.getComponent(...)`), que es el mismo camino que la recarga tras una acción.

| # | Caso | Resultado |
|---|---|---|
| 1 | Liquidación 494 (BORRADOR), central normal | «Agregar Item» visible, Aprobar habilitado |
| 2 | Misma liquidación, recarga con central congelado | a los 60 s avisos de conceptos, cabecera e ítems; «Agregar Item» oculto; aviso con «Reintentar»; Aprobar **deshabilitado**; los ítems a la vista se conservan |
| 3 | Descongelar → «Reintentar» | aviso desaparece, Aprobar habilitado |
| 4 | Legajo (JULIO PEREZ) → Financiero, recarga congelado | los 4 totales «No disponible»; exposición «No disponible — No cargaron: crédito, vales, préstamos»; al recargar con el central normal vuelve a 50.000 |
| 5 | «Liquidación final» con central congelado (sin finiquito vigente) | a los 60,7 s «No se pudo consultar el finiquito…»; **no** se abre el diálogo de generar ni la pestaña |
| 6 | Diálogo de generar finiquito (central normal), congelar y cambiar fecha | a los 60 s aviso, spinner apagado, «Generar» **deshabilitado**; descongelar y cambiar fecha → se recalcula y se habilita. No se generó nada |
| 7 | Cuotas de préstamo, recarga congelado (camino de la recarga tras cobrar) | tabla vacía + aviso + «Reintentar»; con el central normal «Reintentar» la recarga. No se cobró nada |
| 8 | Cuotas de vale abiertas con central congelado | a los 60,7 s aviso y «No se pudieron cargar las cuotas…» (no «El vale no tiene cuotas») |

**No verificado en runtime:** revertir egreso (no hay funcionario egresado a mano en la base local; verificado por
código: `null` abre la reversa manual, solo el error de red bloquea).

## Auditoría del diff (paso 8, 2026-10-03)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Ningún llamador de los métodos que propagan queda sin `error:`; `onGetPorCliente` sin cambios para sus otros llamadores | — | verificado |
| Financiero: respuestas de un funcionario anterior pisan las del nuevo (flags «No disponible» falsos) | media | contador de carga, se descarta lo viejo |
| Detalle de liquidación: dos `cargarItems` en vuelo se pisan | media/baja | contador de pedido |
| Finiquito: `cargaFallo` seguía en `true` tras una acción que devuelve datos frescos | baja | se baja en `aplicar` |
| Avisos decían «el servidor no responde» también con `null` (error GraphQL) | baja | textos neutros donde aplica `null` |
| Exposición vieja hasta la primera respuesta al cambiar de funcionario | baja | se recomputa al resetear el crédito |
| `itemsCargados` no baja mientras recarga | baja | decisión del plan (sin parpadeo); se mantiene |
| `recargarItems` del finiquito es código muerto previo | baja | fuera de alcance |
