# PLAN — La cotización que no carga no congela la app ni inventa un 1 en el PDV

> Documento de trabajo del ciclo de 12 pasos (`frc-cicd/ciclo-implementacion-frc-comercial.md`).
> **Se borra en el PR final.** Continúa el trabajo de `GabFrank/franco-system-backend-servidor#323`.

Repos: **desktop** (principal) + **filial** + **central** · tres PRs

## 1 · Síntomas reportados

1. Al abrir la app, si la cotización no está disponible (sin internet, o el proveedor de la
   cotización fuera de alcance), aparece un **loading infinito** y hay que forzar el cierre.
2. Al abrir el PDV, **las cotizaciones se muestran en 1** — y el PDV usa cotización local, no la de
   mercado.

**#323 no soluciona ninguno de los dos.** Fue 100% backend del central (scheduler y scraper). Estos
son del cliente.

## 2 · Causas, verificadas leyendo el código

### 2.1 · El loading

- `CotizacionHeaderService` (bootstrap tras login + cada 10 min) pide las monedas con
  `monedaService.onGetAll()` y después una query por moneda con `cambioService.getUltimoCambioPorMonedaId()`.
  Las dos van **contra el central** y **abren el spinner global**: `onGetAll` siempre lo abre, y
  `getUltimoCambioPorMonedaId` va por `onCustomQuery` sin `silentLoad` (`cambio.service.ts:33`).
- **El spinner es global con refcount**: `CargandoDialogService.closeDialog` solo llama
  `spinnerService.hide()` cuando `dialogRequests.size === 0`. Una request colgada tapa la app entera.
- `onCustomQuery` lleva `timeoutMs: TIMEOUT_CUSTOM_QUERY_MS` = **300 000 ms** (pensado para
  reportes) y la red del spinner vence a los **305 s**.
- Ya existe `createCentralTimeoutLink` (`graphql-connection.service.ts:423`) que corta a **3 s**
  cuando el central **no** figura online. Cubre el arranque en frío sin internet. **El hueco es
  cuando el central figura online** (`cloudConnectionStatusSub === true`, WebSocket conectado) y
  la request igual se traba — p. ej. en la ventana entre que se cae la red y el WebSocket lo
  detecta. Ahí no hay cap: rige el timeout de 5 minutos.

> ⚠️ **No se reprodujo el escenario de campo.** La cadena está en el código; el camino exacto por
> el que se llega al cuelgue en producción no se observó. Por eso el fix no apuesta a un camino:
> saca al poll de fondo del spinner **por construcción**, sea cual sea el timeout que se dispare.

- Además: si el bootstrap falla, el header queda en «Sin cotización» **para siempre**. El timer de
  10 min llama `fetchAll()`, que sale temprano si `monedas` está vacío (`if (!this.monedas.length)
  return;`) — nunca reintenta cargar las monedas. Solo lo recupera el botón manual o re-loguear.

### 2.2 · El 1 en el PDV

```ts
// venta-touch.component.ts:143-145
cambioRs = 1;
cambioDs = 1;
cambioArg = 1;
```

Es el **valor inicial de la variable**. `setPrecios()` solo lo pisa si la query de monedas
responde. «Cambio del día» en `totales.component.html` muestra `{{ cambioRs | number }} Gs.` →
**«1 Gs.»**.

**No es cosmético.** `venta.totalRs = this.totalGs / this.cambioRs` en cuatro lugares (líneas 822,
865, 1071, 1605) → con 1, **una venta de 100 000 Gs queda registrada como 100 000 reales**. Solo la
línea 1365 tiene guard.

Segundo estado roto en el mismo lugar: `setPrecios` asigna `?.cambio` sin fallback. Si la query
responde pero la moneda no tiene cotización — justo lo que devuelve el `MonedaResolver` null-safe
desde el fix de julio — queda `undefined` → `NaN`.

Por qué el PDV cae en el mismo apagón que el header: `setPrecios` usa `onGetAll(false)`, que va al
filial. Pero con `isLocal: false` el link manda **todo** al central
(`graphql-connection.service.ts:296-312`).

## 3 · Decisión de producto (tomada)

**Sin cotización, ningún cálculo en esa moneda produce un número.** Un nulo visible es mejor que un
número inventado. Decidido por Gabriel el 2026-09-23: las cotizaciones del PDV arrancan en `null`.

## 4 · Alcance: por qué son tres repos

El desktop ya manda `totalRs: null` hoy en el camino de la línea 1365. Con este cambio pasa a ser
**el caso normal** cuando la cotización no cargó. Y el backend no lo tolera en la impresión:

| Repo | Sitio | Con `null` hoy |
|---|---|---|
| filial | `VentaCreditoGraphQL:302,309` — `venta.getTotalRs() + precioDeliveryRs` | **NullPointerException** al desboxear: el ticket de crédito no imprime |
| filial | `FacturaLegalGraphQL:781,789` — `String.format("%.2f", venta.getTotalRs())` | imprime **`nu`** en el ticket (ver nota) |
| central | `VentaCreditoGraphQL:407,413` | **NullPointerException** |
| central | `VentaGraphQL:334,342` | imprime **`nu`** |

> **`%.2f` con `null` imprime `nu`, no `null`.** Verificado ejecutando en la JVM (auditoría eje B):
> `java.util.Formatter` imprime el texto de fallback `"null"` y le aplica la precisión como límite
> de caracteres. Los dos pares de sitios fallan de modo distinto: `VentaCredito` revienta por el `+`
> (desboxeo), `FacturaLegal`/`Venta` imprimen basura.

**Severidad real: el dinero no se pierde.** En los dos backends la venta se guarda **antes** del
bloque de impresión, y ese bloque atrapa toda excepción sin relanzar (filial
`VentaGraphQL:336-338`, con `printStackTrace`; central `VentaGraphQL:200-202`, **sin loguear nada**).
El síntoma es «venta cobrada bien, ticket que no sale» — y en el central, **sin ningún rastro**.

`DeliveryGraphQL:168-169` (filial) solo copia el valor: null-safe. `ConteoGraphQL` y
`PdvCajaGraphQL:248` leen el input de conteo, no la venta: fuera de alcance.

Sin arreglar la impresión primero, este cambio **cambiaría un total incorrecto impreso por un
ticket que no se imprime**.

Schema: `totalRs: Float` / `totalDs: Float` en `VentaInput` de los dos backends — nullables.
Entidad `Venta`: `Double` sin `nullable = false`.

## 5 · Fases

### Fase 1 — filial: la impresión tolera totales nulos

Helper `formatearTotalMoneda(Double total, Double extra)` → `"-"` si `total` es nulo, si no
`String.format("%.2f", total + (extra != null ? extra : 0))`. Aplicado en los cuatro sitios.

**Test:** unit del helper — nulo → `"-"`; con valor → formato de dos decimales; con `extra` nulo.
El de nulo **falla con el código viejo** (NPE). Los métodos de impresión son ESC/POS monolíticos y
no se testean enteros: se testea la pieza que cambia.

### Fase 2 — central: lo mismo, y la impresión fallida deja rastro

Mismo helper, en `VentaCreditoGraphQL:407,413` y `VentaGraphQL:334,342`. Mismo test.

Además, el `catch` de la impresión en `VentaGraphQL:200-202` pasa a **loguear** la excepción. Hoy la
traga sin nada: si algún camino de impresión falla, nadie se entera hasta que reclama un cliente.

### Fase 3 — desktop: el header no toca el spinner

1. `timeout-link.ts`: si `context.silenciarAvisoTimeout` es `true`, no avisa al vencer. El corte
   y el error siguen igual.
2. `GenericCrudService.onCustomQuery`: nuevo parámetro opcional `contexto` que se mezcla en el
   `context` de Apollo (permite `timeoutMs` propio y `silenciarAvisoTimeout`). **Sin pasarlo, el
   comportamiento es idéntico al de hoy.**
3. `MonedaService.onGetAllEnSegundoPlano()` y `CambioService.getUltimoCambioPorMonedaIdEnSegundoPlano()`:
   métodos **nuevos** — `silentLoad: true`, `networkError.propagate: true`, `timeoutMs: 20000`,
   `silenciarAvisoTimeout: true`. **No se toca ningún método existente**: `getUltimoCambioPorMonedaId`
   tiene otros 8 consumidores y `onGetAll` tiene 104.
4. `CotizacionHeaderService` usa los dos métodos nuevos, y el timer llama `refresh()` en vez de
   `fetchAll()`, así reintenta cargar las monedas si el bootstrap falló.
5. `loadMonedas` gana handler de `error`: con el método nuevo el error se propaga, y sin handler
   pasaría de «suscripción colgada» a «error de RxJS no manejado».
6. **Secuencia en `fetchAll`**: cada llamada toma un número y solo publica si sigue siendo la más
   reciente. Sin esto, una respuesta lenta del timer pisa la de un click manual más nuevo — y el
   punto 4 alarga esa cadena. Y un flag evita dos `loadMonedas` en vuelo a la vez.

### Fase 4 — desktop: el PDV no inventa cotizaciones

1. `venta-touch`: `cambioRs = cambioDs = cambioArg = null`; `setPrecios` normaliza con `?? null`;
   los cuatro pares de división sin guard usan el mismo guard que la línea 1365.
2. `totales.component.html`: si falta la cotización, muestra `—` en vez de `∞` o vacío. Con
   ternario en el template, **sin llamar funciones** (regla del repo).
3. Todo lo que recibe esos valores y divide por ellos, guardado con el mismo criterio:
   - `delivery-dialog`: lista de vueltos en el `.ts` (438-458) **y las cuatro divisiones del
     template** (`.html:50,62,491,503`).
   - `delivery-presupuesto-dialog.html:145,166`.
   - `edit-delivery-dialog` (`calcularVueltoPara`, 667-668).
   - `descuento-dialog`: con `null`, `valor * null === 0` → **un descuento tipeado en reales se
     guarda como 0 Gs, en silencio**. Decisión: **el campo de esa moneda se deshabilita** cuando no
     hay cotización. Ignorar la tecla sin avisar repite el mismo silencio que este trabajo combate.

   > ⚠️ **`null` es peor que `1` en un template sin guard.** Con `undefined` la división da `NaN` y
   > el `DecimalPipe` lo trata como valor ausente (celda vacía). Con `null` la división da
   > `Infinity` y el pipe muestra **`∞`**. Por eso cada template que divide por estas cotizaciones
   > necesita el guard, aunque hoy no se vea roto.
4. **`pago-touch`, la pantalla de cobro.** Carga sus propias monedas (no hereda el `null` de
   `venta-touch`), pero tiene el mismo problema y uno peor:
   - **Se puede registrar un cobro en REAL o DOLAR con monto `NaN`** si la moneda no tiene
     cotización (`item.cambio = this.selectedMoneda.cambio`, línea 631, y `valor * cambio` en 637).
     Guard en ese único punto de armado del ítem: si la moneda no es GUARANI y no tiene cotización,
     **no se agrega el cobro y se avisa**. El camino de GUARANI queda igual.
   - `setMoneda` (línea 520) hace `this.selectedMoneda.id` sin chequear: con las monedas sin cargar
     es un `TypeError`. Pasa a `?.`.
   - Template `.html:71,95,607,629`: mismo guard `—`.

### Estado intermedio: el `1` también miente cuando la query SÍ responde

`setPrecios()` es asíncrona y nada bloquea cobrar mientras está en vuelo (F8/F11/F12 solo miran
`isDialogOpen`, `isCargando` y `guardandoVenta`). **Hoy, una venta cobrada en esa ventana queda con
`totalRs = totalGs` aunque la query responda bien cien milisegundos después.** Con `null` esa ventana
deja de inventar un número. (Auditoría eje B, confirmado leyendo `venta-touch.component.ts:231,405,
1039,1324`.)

**Tests:** el desktop no tiene batería en ningún gate (CI solo corre `build:prod`). El gate es
`npm run check`.

## 6 · Tabla de datos nuevos

| Dato | Quién lo **escribe** | Quién lo **lee** |
|---|---|---|
| `context.silenciarAvisoTimeout` | `onCustomQuery` cuando lo piden los métodos `EnSegundoPlano` | `timeout-link.ts` |
| `context.timeoutMs` (override por llamada) | idem | `timeout-link.ts` (ya lo leía) |
| cotización del PDV en `null` | `venta-touch.setPrecios` | venta-touch (4 guards), `totales`, `list-delivery` → `edit-delivery-dialog`, `delivery-dialog`, `descuento-dialog` |
| `venta.totalRs/totalDs = null` persistido | desktop `venta-touch` | filial `VentaCreditoGraphQL`, `FacturaLegalGraphQL`, `DeliveryGraphQL` · central `VentaCreditoGraphQL`, `VentaGraphQL` (llega por replicación `BRANCH_TO_MAIN`) |

## 7 · Fuera de alcance, a propósito

**(c) de la propuesta original — que `onGetAll` cierre el observable ante un error.** Se descartó
en el análisis:

- **Emitir `null` rompe el cobro.** `pago-touch.setPrecios` hace `this.monedas = res;
  this.monedas.find(...)` sin chequear nulo. Hoy nunca corre ante un error porque `onGetAll` no
  emite; con `null` sería un `TypeError` en la pantalla de cobro.
- **Completar sin emitir no cambia nada visible.** De los 104 consumidores ninguno tiene handler de
  `complete`; las ramas `next` siguen sin correr, igual que hoy.
- **Ninguno de los dos síntomas depende de él.** `onGetAll` ya cierra su spinner en las dos ramas.

Queda como deuda: un observable que nunca completa es una suscripción que no se libera.

**Otras deudas encontradas en la auditoría, preexistentes y fuera de este trabajo:**

- `PrecioDelivery.valor` es `Double` nullable. En `VentaCreditoGraphQL` (filial 203-205, central
  312-314) `delivery.getPrecio().getValor()` se divide sin chequeo: un precio de delivery nulo es un
  NPE **antes** de llegar al helper de las fases 1-2. No es de cotización.
- `list-delivery` y `edit-delivery-dialog` declaran su propio `cambioRs = 1` (71-72, 106-107). Hoy
  es inofensivo: se pisa en el constructor con lo que manda `venta-touch`, así que desde este
  cambio reciben `null`. Queda la trampa de diseño.
- `ultimas-ventas-dialog.html:68,74` muestra `venta.totalRs` con `| number`: una venta sin
  cotización se ve con **celda vacía**. Decisión: aceptable para un listado histórico; no se toca.
- mobile y mobile-pwa piden `totalRs/totalDs` en su query de venta pero no los usan en ningún
  componente.

## 8 · Orden de merge

1. **filial y central primero.** Solo agregan tolerancia: funcionan igual con el desktop viejo.
   El filial se propaga solo a las filiales **alpha** en ≤15 min al mergear a `develop`.
2. **desktop después.** Contra un backend sin las fases 1-2, un ticket de crédito de una venta sin
   cotización no imprime (la venta queda guardada igual).

> ⚠️ **«Backend primero» es orden de merge, no de rollout verificado.** (Auditoría eje A.) El
> desktop se actualiza solo por `electron-updater` sin ningún gate de versión mínima contra el
> backend; el deploy del central es **manual** con aprobación para farmacia y bodega; y en una
> filial el cron de `check-update` puede faltar (`gotchas.md`, «Cron de check-update puede
> faltar»). **Antes de promover el desktop a beta o stable, verificar que el central y las
> filiales de ese canal ya corren la versión con las fases 1-2.** Mientras tanto el síntoma es un
> ticket de crédito que no imprime — el mismo que ya existe hoy por la línea 1365.

Sin migración, sin DDL: `null` es dato, no esquema. La replicación `BRANCH_TO_MAIN` de `venta` lo
transporta sin cambios.

## 9 · Qué queda sin verificar

1. **Batería de filial y central en local**: el 401 de `jsifenlib` en GitHub Packages. Veredicto: CI.
2. **Prueba de runtime del desktop**: no hay central alcanzable ni credenciales de usuario dev en
   este entorno. El gate que sí corre es `npm run check`.
3. **El camino exacto del cuelgue en campo** (§2.1).
4. **Estado real de las ~26 bases**: la ausencia de `NOT NULL`/`CHECK` sobre `total_rs`/`total_ds`
   se verificó sobre el DDL versionado, no sobre cada instancia. `gotchas.md` documenta intervención
   manual de esquemas en filiales.
5. **Reportes `.jrxml` del central** que puedan leer `total_rs` de una venta replicada: no auditados.

## 10 · Pasos del ciclo — estado

| Paso | Estado |
|---|---|
| 1 · Rama | `claude/frc-cicd-cotizacion-hotfix-y4o248` en los tres repos, desde `develop`. **En el desktop este trabajo entra en el PR #334**, decidido por Gabriel |
| 2 · Skill | ✅ `frc-cicd`, `frc-desktop` |
| 3 · Análisis | ✅ sobre `develop`. Dos cambios de diseño salieron de acá: (c) afuera, y el alcance pasa a tres repos |
| 4 · Plan | ✅ este archivo |
| 5 · Auditoría del plan | ✅ 2 agentes, ejes A y B — ver §12 |
| 6 · Presentar y commitear | |
| 7 · Implementación | |
| 8 · Auditoría del diff | |
| 9 · Batería | filial/central por CI; desktop N/A |
| 10 · Build | `npm run check` en el desktop |
| 11 · Documentación | |
| 12 · Cierre | tres PRs a `develop` |

## 12 · Auditoría del plan (paso 5) — qué cambió

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | `pago-touch.html` y `delivery-presupuesto-dialog.html` dividen por la cotización sin guard | Al alcance (fase 4) |
| A | «Backend primero» es orden de merge, no de rollout: desktop sin gate de versión, central manual, cron de filial que puede faltar | Nota de despliegue con verificación por canal (§8) |
| A | `ultimas-ventas-dialog` muestra celda vacía para una venta sin cotización | Decisión explícita: aceptable (§7) |
| A | Replicación y constraints | ✅ Confirmado: `numeric` nullable sin `CHECK`, `Float` en los dos `.graphqls` |
| A | Parámetro nuevo en `onCustomQuery` | ✅ Seguro: sin subclases, sin specs, ningún caller pasa un sexto argumento |
| B | El `1` también miente cuando la query responde bien, en la ventana asíncrona de `setPrecios` | Refuerza la decisión de `null` (§5) |
| B | `delivery-dialog.html` tiene cuatro divisiones en el template que el plan no veía | Al alcance |
| B | `descuento-dialog`: un descuento en reales se guarda como 0 Gs en silencio | Decidido: se deshabilita el campo |
| B | **`pago-touch` puede registrar un cobro en moneda extranjera con monto `NaN`** | Al alcance: guard en el armado del ítem |
| B | `pago-touch.setMoneda` → `TypeError` con monedas sin cargar | Al alcance: `?.` |
| B | `%.2f` con `null` imprime `nu`, no `null` (verificado en la JVM) | Corregido el §4 |
| B | **La impresión fallida se traga sin rollback y, en el central, sin loguear nada** | El dinero no se pierde; el central pasa a loguear (fase 2) |
| B | `loadMonedas` sin handler de error; carrera entre timer y botón manual | Al alcance (fase 3, puntos 5-6) |
| B | `PrecioDelivery.valor` nullable → NPE en el mismo método | Deuda anotada, fuera de alcance: no es de cotización |
