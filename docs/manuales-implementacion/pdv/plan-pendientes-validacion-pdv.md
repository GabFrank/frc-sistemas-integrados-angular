# Plan — pendientes de la validación del PDV al abrir Venta (issue #387, puntos 1 a 4)

Pieza: **desktop** únicamente. Rama: `fix/pdv-pendientes-validacion-pdv`, desde `origin/develop`
**después del merge de #388** (decisión de Franco, 2026-10-02: el punto 1 solo se puede probar con
el timeout de 20 s de #355). Rama creada desde `0d894f34` (merge de #388).

Alcance decidido: puntos 1 a 4 de #387. El punto 5 (relevar las ~427 llamadas a `onCustomQuery`
sin `propagate`) va aparte, con un documento de análisis primero.

Todas las líneas citadas son de `develop` + #388 (`24770f5c`).

## Punto 1 — el «Cargando...» de formas de pago y monedas tapa el aviso

Causa: `ngOnInit` (`venta-touch.component.ts:233-236`) lanza `setPrecios()` (`monedaService.onGetAll(false)`,
`:528`) y `getFormaPagos()` (`formaPagoService.onGetAllFormaPago(false)`, `:464`) **antes** de validar
el PDV. Las dos son no silenciosas con el timeout por defecto de 60 s. Con el filial sin responder,
su spinner queda encima del diálogo «Error de Validación» (sale a los 20 s) hasta los 60 s.

Cambio:
- Mover `setPrecios()` y `getFormaPagos()` a la rama de éxito de `validarPdvSucursal`, junto a
  `iniciarCargaDeCaja()`. Si la validación falla, la pestaña se cierra y esos datos no hacen falta.
- La validación deja de ser silenciosa: `onGetPuntoDeVentaPorId` pasa `silentLoad = false`. El
  cajero ve un «Buscando...» durante la espera (hoy no ve nada propio de la validación). Ese spinner
  lo cierra `onCustomQuery` en su rama de error (`generic-crud.service.ts:191-194`) **antes** de que
  el POS abra el diálogo, así que no lo tapa. Su red de seguridad vence a los 20 + 5 s.
  - Efecto lateral buscado: mientras el spinner está abierto, `isCargando = true` y el teclado del
    POS no responde (`:410`).
- `formaPagoList = []` sigue en `ngOnInit`: la lista vacía es el estado inicial que ya se espera.

## Punto 2 — `pdvValidado` no gatea nada

Hoy solo se asigna (`:192`, `:348`). Se gatea en **los métodos**, no en el `keydown`, para cubrir
teclado y botones con una sola condición. Puertas (todas operan sobre la caja del turno):

| Puerta | Tecla | Botón (html) | Método |
|---|---|---|---|
| Pago | F12 | `:61` | `onPagoClick` (`:1074`) |
| Cobro rápido / CR + ticket | F8 / F11 | `:98`, `:105` | `onTicketClick` (`:1359`) |
| Delivery | F10 | `:111` | `onDeliveryClick` (`:1645`) |
| Utilitarios (cerrar caja, retiro, gasto, …) | F1 | `:123` | `openUtilitarios` (`:1732`) |

Fuera del gate a propósito: F2 (`pdvAuxiliarClick`, solo cambia de carrito), F9 (buscador) y Escape
(borra ítem del carrito local): no tocan la caja ni el servidor.

El spinner de la validación (punto 1) ya bloquea mouse y teclado mientras dura. Pero su botón
«Cerrar» aparece a los 10 s (`app.component.html:9`, `[delay]="10000"`) y hace `closeAll()`: desde
ahí el cajero tiene la pantalla con la validación pendiente. El gate es esa segunda línea de defensa.

En cada método, al principio y junto al `modoConsulta` que ya existe:
`if (!this.pdvValidado) { this.avisarPdvSinValidar(); return; }`. El aviso es un `openWarn`
(«Validando el punto de venta, esperá un momento…»): el comentario de `openUtilitarios` (`:1735-1741`)
ya registra que un atajo mudo le enseña al cajero que la tecla está rota.

Además, el cuerpo del `next:` de `validarPdvSucursal` va en `try/catch`. Una excepción ahí, antes de
`pdvValidado = true` (`:348`), no llega al `error:`: dejaría `pdvValidado = false` para siempre, sin
aviso y con el gate bloqueando en silencio. El `catch` cae al mismo «Error de Validación».

## Punto 3 — el aviso cierra la pestaña activa, no la de Venta

Las 5 ramas de `validarPdvSucursal` (`:287`, `:303`, `:323`, `:342`, `:363`) hacen
`tabService.removeTab(this.tabService.currentIndex)`. Si el cajero pasó a otra pestaña durante la
espera, se cierra esa.

Cambio: método privado `cerrarPestanaPropia()` que busca `this.data` **por identidad**
(`tabService.tabs.indexOf(this.data)`) y cierra ese índice. El `data` es el `Tab` de esta pantalla:
`tab-content.component.ts:43` asigna `instance.data = tab`, y `addTab` con título duplicado conserva
la instancia (`tab.service.ts:164`). Si no la encuentra (ya cerrada, `removeAllTabs`, `reiniciarTab`
que la clonó), no hace nada. Se usa en las 5 ramas de la validación.

Modo diálogo: `VentaTouchComponent` también se abre con `matDialog.open` desde
`delivery-dialog.component.ts:746` (`onModificarItens`). Ahí `this.data` es `undefined` y el método no
hace nada. Hoy ese caso cierra la pestaña activa, que también está mal. Ese botón está **deshabilitado
a propósito por fraude** (memoria «Modif. itens de delivery deshabilitado por fraude»): no se toca ni
se agrega un camino para él.

Las otras dos llamadas a `removeTab(currentIndex)` (`:491` «salir» del diálogo de caja y `:509`
«no» al conteo inicial) **no se tocan**: salen de un diálogo modal que el cajero acaba de contestar
estando en Venta.

## Punto 4 — un error GraphQL sale como «No se encontró el Punto de Venta»

Con `res.errors`, `onCustomQuery` muestra «Ups! Algo salió mal: …» y emite `null`
(`generic-crud.service.ts:174-187`); el POS lo trata como PDV inexistente (`:310-324`).

Cambio, **opt-in** en `GenericCrudService.onCustomQuery`, con la convención que **ya existe**:
`QueryError.graphError` (`generic-crud.service.ts:22-33`), la que usa `onGetByTexto` (`:420-428`).
- `errorConf` pasa a tiparse `QueryError`.
- Rama `res.errors`: el snackbar «Ups!» solo si `graphError?.show !== false` (igual que
  `onGetByTexto`). Si `graphError?.propagate === true`: `obs.error({ message, errors })`, con la misma
  forma que `:428` (`limpiarMensajeGraphQL` / `limpiarErroresGraphQL`), **sin** `next` ni `complete`.
  Si no, lo de hoy (`next(data parcial)` + `complete`).
- El cierre del spinner e `isLoading = false` siguen antes, como hoy.
- Sin la opción, las ~430 llamadas existentes no cambian.

`onGetPuntoDeVentaPorId` pasa `graphError: { propagate: true, show: false }`. En el `error:` de
`validarPdvSucursal`: si el error trae `errors` (GraphQL), el detalle del diálogo muestra
`err.message`. Si no (red o timeout), queda el texto actual «Verifique la conexión con el servidor…».
Una respuesta vacía (`RESPUESTA_VACIA`) entra por la rama GraphQL y se ve como «Respuesta vacía del
servidor»: es un mensaje correcto.

## Fases

| Fase | Commit | Archivos |
|---|---|---|
| 1 | `fix(pdv): validar el pdv antes de cargar monedas y formas de pago` (punto 1) | `venta-touch.component.ts`, `punto-de-venta.service.ts` |
| 2 | `fix(pdv): no cobrar ni abrir utilitarios sin el pdv validado` (punto 2) | `venta-touch.component.ts` |
| 3 | `fix(pdv): cerrar la pestaña de venta y no la activa al fallar la validación` (punto 3) | `venta-touch.component.ts` |
| 4 | `fix(pdv): mostrar el error del servidor al validar el pdv` (punto 4) | `generic-crud.service.ts`, `punto-de-venta.service.ts`, `venta-touch.component.ts` |

Tests por fase: `N/A para desktop porque el CI no corre tests y no hay batería confiable
[ev: desktop:.github/workflows/ci.yml — ningún paso de test]`. `npm run check` al final de todas las
fases (regla de `frc-desktop`); verificación en la prueba de runtime.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `pdvValidado` (ya existía, sin lector) | `validarPdvSucursal` (éxito) | `onPagoClick`, `onTicketClick`, `onDeliveryClick`, `openUtilitarios` |
| `errorConf.graphError.propagate` en `onCustomQuery` (opción existente en `QueryError`, nueva en este método) | `PuntoDeVentaService.onGetPuntoDeVentaPorId` | `GenericCrudService.onCustomQuery` |

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Prueba de runtime

Desktop `ng serve -c web` contra el filial local `:8080`, PDV 3 (memoria «Probar PDV local contra
filial»). Franco hace el login. Congelar con `kill -STOP` y `kill -CONT` de respaldo programado.

| # | Caso | Esperado |
|---|---|---|
| 1 | Filial normal, abrir Venta | abre como siempre; cotizaciones y formas de pago cargadas; F12 con ítems abre el pago |
| 2 | Filial congelado, abrir Venta | «Buscando...» hasta los 20 s; después «Error de Validación» **sin nada encima**; al aceptar se cierra Venta |
| 3 | Filial congelado, cerrar el «Buscando...» y apretar el botón «Pago», «Cobro rápido», «Delivery», «Utilitarios» | aviso «Validando el punto de venta…», no abre nada |
| 4 | Filial congelado, abrir Venta y pasar a otra pestaña antes de los 20 s | el aviso cierra Venta, la otra pestaña sigue abierta |
| 3b | Filial congelado: a los 10 s apretar «Cerrar» del spinner, luego F12 con ítems | aviso «Validando…» (el teclado ya no lo bloquea `isCargando`) |
| 5 | Error GraphQL en la validación (simular: PDV de un id inexistente no sirve, da `null`; ver nota) | «Error de Validación» con el mensaje del servidor, sin snackbar «Ups!» |
| 6 | Filial vuelve, reabrir Venta | abre normal |

Nota caso 5: provocar un `errors` real del resolver `puntoDeVentaPorId` sin tocar el filial no es
obvio. Si no hay forma limpia, queda **no verificado** y se verifica solo leyendo el código.

## Riesgos y qué queda sin verificar

- **Monedas y formas de pago llegan después**: en el camino feliz se suma la latencia de la
  validación (una lectura simple). Si algo en `ngOnInit` o `dialogData.venta` usa `monedas`/`cambio*`
  antes de que lleguen, ya hoy podía pasar (las consultas son asíncronas); igual se revisa en la
  auditoría.
- **Spinner propio de la validación**: si la validación tarda, el cajero ve «Buscando...»; antes no
  veía nada de la validación pero sí el «Cargando...» de las otras dos consultas, así que en la
  práctica no es un spinner nuevo.
- **Opt-in en `GenericCrudService`**: es el archivo más compartido del desktop. El cambio solo actúa
  con la opción nueva; el resto de las llamadas no pasa por la rama nueva.
- **F8/F11 justo después de validar** (preexistente): monedas y formas de pago siguen en vuelo y
  `onTicketClick` usa `this.monedas?.find` / `formaPagoList.find` (`:1376`, `:1410`). Ya tiene una
  guarda de moneda base (`:1371`) con `try/finally`. Con este plan la carga arranca un poco más tarde.
  No se agrega otro gate: se prueba F8 apenas abre la caja (caso 1).
- `startSolicitudesProcesadasPolling` (`:1852`) arranca antes de validar y lee el `selectedCaja` del
  servicio root, que puede ser de una Venta anterior. Es solo lectura y no cobra. Las puertas que
  usan esa caja (`onDeliveryClick`, `:1655`) quedan gateadas.
- `iniciarCargaDeCaja` no tiene `error:` (preexistente): si la consulta de caja no responde, la
  validación ya pasó y no hay caja. Se anota en #387.
- Modo solo central (`isLocal=false`) y Electron empaquetado: no se prueban.

## Auditoría del plan (paso 5, 2026-10-02)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | El plan inventaba `graphQLError`; ya existe `QueryError.graphError` con forma `{message, errors}` | media | **aplicado**: se usa `graphError`, se tipa `errorConf` |
| A | `this.data` es la instancia de `tabs`; `addTab` duplicado la conserva; `reiniciarTab` la clona (no-op correcto) | — | verificado; búsqueda por identidad |
| A | Modo diálogo (`delivery-dialog:746`): `this.data` es `undefined` | baja | no-op; ese botón está deshabilitado por fraude, no se toca |
| A | Puertas completas; Escape y `removeItem` en delivery dependen de `isDelivery` | baja | verificado |
| A | F8 antes de que lleguen monedas/formas de pago; polling con caja vieja | baja | preexistente → Riesgos |
| B | Excepción en `next` antes de `pdvValidado = true` deja el gate bloqueando en silencio | media | **aplicado**: `try/catch` hacia el mismo aviso |
| B | «El spinner no tiene botón Cerrar; el caso 3 es inejecutable» | media | **descartado**: el botón existe (`app.component.html:9`, aparece a los 10 s, `closeAll()`); se lo vio en la prueba de #355. Se suma el caso 3b |
| B | Respuesta vacía con la opción nueva | media | entra por la rama GraphQL con «Respuesta vacía del servidor»: aceptado |
| B | Spinner y `isLoading` se cierran en todos los caminos | — | verificado |
| B | Rollback: la fase 4 toca el `error:` que usa la 3 → revertir en orden 4, 3, 2, 1 | baja | anotado |
| B | `iniciarCargaDeCaja` sin `error:` | baja | preexistente → Riesgos / #387 |
