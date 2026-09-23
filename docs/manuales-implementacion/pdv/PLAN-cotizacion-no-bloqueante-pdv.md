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
| filial | `FacturaLegalGraphQL:781,789` — `String.format("%.2f", venta.getTotalRs())` | imprime el literal `null` en el ticket |
| central | `VentaCreditoGraphQL:407,413` | **NullPointerException** |
| central | `VentaGraphQL:334,342` | imprime `null` |

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

### Fase 2 — central: lo mismo

Mismo helper, en `VentaCreditoGraphQL:407,413` y `VentaGraphQL:334,342`. Mismo test.

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

### Fase 4 — desktop: el PDV no inventa cotizaciones

1. `venta-touch`: `cambioRs = cambioDs = cambioArg = null`; `setPrecios` normaliza con `?? null`;
   los cuatro pares de división sin guard usan el mismo guard que la línea 1365.
2. `totales.component.html`: si falta la cotización, muestra `—` en vez de `∞` o vacío. Con
   ternario en el template, **sin llamar funciones** (regla del repo).
3. Todo lo que recibe esos valores y divide por ellos, guardado con el mismo criterio:
   `delivery-dialog` (lista de vueltos, líneas 438-458), `edit-delivery-dialog` (`calcularVueltoPara`,
   667-668) y `descuento-dialog` (`onKeyUp`, 104-120 — con `null`, un descuento tipeado en reales
   da **0 Gs en silencio**).

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

## 8 · Orden de merge

1. **filial y central primero.** Solo agregan tolerancia: funcionan igual con el desktop viejo.
   El filial se propaga solo a las filiales **alpha** en ≤15 min al mergear a `develop`.
2. **desktop después.** Contra un backend sin las fases 1-2, un ticket de crédito de una venta sin
   cotización no imprime.

Sin migración, sin DDL: `null` es dato, no esquema. La replicación `BRANCH_TO_MAIN` de `venta` lo
transporta sin cambios.

## 9 · Qué queda sin verificar

1. **Batería de filial y central en local**: el 401 de `jsifenlib` en GitHub Packages. Veredicto: CI.
2. **Prueba de runtime del desktop**: no hay central alcanzable ni credenciales de usuario dev en
   este entorno. El gate que sí corre es `npm run check`.
3. **El camino exacto del cuelgue en campo** (§2.1).
4. **Otros lectores de `venta.totalRs/totalDs` en el desktop** (reimpresión, listados): a cubrir
   en la auditoría.

## 10 · Pasos del ciclo — estado

| Paso | Estado |
|---|---|
| 1 · Rama | local `fix/cotizacion-carga-no-bloqueante` desde `develop`. ⚠️ **Push pendiente de autorización**: la sesión impone `claude/frc-cicd-cotizacion-hotfix-y4o248`, que en el desktop es el PR #334 abierto |
| 2 · Skill | ✅ `frc-cicd`, `frc-desktop` |
| 3 · Análisis | ✅ sobre `develop`. Dos cambios de diseño salieron de acá: (c) afuera, y el alcance pasa a tres repos |
| 4 · Plan | ✅ este archivo |
| 5 · Auditoría del plan | |
| 6 · Presentar y commitear | |
| 7 · Implementación | |
| 8 · Auditoría del diff | |
| 9 · Batería | filial/central por CI; desktop N/A |
| 10 · Build | `npm run check` en el desktop |
| 11 · Documentación | |
| 12 · Cierre | tres PRs a `develop` |
