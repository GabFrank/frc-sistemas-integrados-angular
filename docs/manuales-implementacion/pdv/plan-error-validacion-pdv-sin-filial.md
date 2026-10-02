# Plan — aviso de error al validar el PDV con el filial sin responder (issue #355)

Rama: `fix/pdv-error-validacion-pdv-sin-filial` (desde `origin/develop` `1c2c223e`). Pieza: **desktop** únicamente.

## Problema

Al abrir *Venta*, `VentaTouchComponent.validarPdvSucursal()` consulta el PDV al filial con
`PuntoDeVentaService.onGetPuntoDeVentaPorId(pdvId, false)` y tiene un `error:` que muestra
«Error de Validación» y cierra la pestaña. Ese `error:` nunca se ejecuta:

1. `onGetPuntoDeVentaPorId` llama a `GenericCrudService.onCustomQuery(..., servidor, null, true)`:
   `errorConf = null`.
2. En `onCustomQuery`, ante un error de red, `obs.error(error)` solo corre si
   `errorConf?.networkError?.propagate == true` (`generic-crud.service.ts` ~L202). Con `null` el
   Observable no emite ni completa.
3. Y aunque propagara: con el filial **congelado** (proceso vivo, kernel aceptando la conexión) no
   hay error de red. El único que corta la consulta es el timeout link, que para `onCustomQuery`
   vale **300 s** (`TIMEOUT_CUSTOM_QUERY_MS`). Con el filial **caído** (puerto cerrado) el error sí
   es inmediato.

## Decisiones (Franco, 2026-10-02)

- **Alcance: solo la validación del PDV.** La revisión de las ~427 llamadas a `onCustomQuery` sin
  `propagate` va a una issue aparte (ver «Fuera de alcance»).
- **Timeout de la validación: 20 s** (`TIMEOUT_CONSULTA_DE_FONDO_MS`), con
  `silenciarAvisoTimeout: true`: el diálogo «Error de Validación» ya explica lo que pasó y el
  snackbar genérico «El servidor no respondió a tiempo» sería un segundo aviso del mismo hecho.

## Fase 1 — propagar el error y acotar el tiempo (un commit, `fix(pdv): …`)

`src/app/modules/financiero/punto-de-venta/punto-de-venta.service.ts`

```ts
onGetPuntoDeVentaPorId(id: number, servidor: boolean = true): Observable<PuntoDeVenta> {
  return this.genericService.onCustomQuery(
    this.puntoDeVentaPorId, { id }, servidor,
    { networkError: { propagate: true, show: false } },
    true,
    { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true }
  );
}
```

- Tiene **un solo llamador** (`venta-touch.component.ts:308`, verificado con grep), así que cambiar
  el contrato del método no afecta otras pantallas.
- `show: false`: sin snackbar «Error de red»; el diálogo del POS es el aviso.
- `venta-touch.component.ts` no cambia: su `error:` ya tiene el texto y el cierre de pestaña
  correctos. Se agrega un comentario corto que diga que ese `error:` depende del `propagate` del
  servicio.

Tests de la fase: `N/A para desktop porque el CI no corre tests y no hay batería confiable
[ev: desktop:.github/workflows/ci.yml — ningún paso de test]`. La verificación es la prueba de runtime
del paso 9 y `npm run check`.

## Tabla de datos nuevos

`N/A`: no nace ningún campo, columna ni clave. Solo cambian opciones de una consulta existente.

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque el cambio no toca GraphQL, esquema ni backend` — la query
`puntoDeVentaPorId` del filial queda igual.

## Prueba de runtime (paso 9)

Receta de la memoria «Probar PDV local contra filial»: desktop servido por HTTP
(`npx ng serve -c web --host 127.0.0.1`), IP Servidor `localhost:8080` (servicio `frc-filial`),
Central `localhost:8083`, PDV 3, «Usar Servidor Local». El login lo hace Franco.

| # | Caso | Esperado |
|---|---|---|
| 1 | Filial normal, abrir *Venta* | abre como hoy, sin diálogos ni snackbars nuevos |
| 2 | `kill -STOP` al filial, abrir *Venta* | a los ~20 s aparece «Error de Validación»; al aceptar se cierra la pestaña. Sin snackbar «no respondió a tiempo». (`kill -CONT` de respaldo programado en segundo plano) |
| 3 | `kill -CONT`, reabrir *Venta* | abre normal |
| 4 | Filial caído (puerto cerrado), abrir *Venta* | «Error de Validación» casi inmediato |
| 5 | PDV de otra sucursal (si hay un id a mano) | sigue el diálogo «PDV no corresponde» de siempre |
| 6 | Filial congelado, cerrar *Venta* antes de los 20 s | no aparece ningún diálogo después (`untilDestroyed`) |
| 7 | Filial congelado, pasar a otra pestaña durante los 20 s | **documentar** qué pestaña cierra el diálogo (preexistente, ver Riesgos) |
| 8 | Filial congelado, F12 durante la espera | **documentar** el comportamiento (preexistente, ver Riesgos) |
| 9 | `isLocal=false` (solo central), abrir *Venta* | abre normal; si el central tarda >3 s con el WS sin confirmar, ahora sale «Error de Validación» |

Antes de la prueba: traer `develop` a la rama si avanzó.

## Riesgos y qué queda sin verificar

- **Filial lento pero vivo** (apertura de turno con carga alta): si la consulta tarda más de 20 s,
  el cajero ve el error y reabre *Venta*. Hoy en ese mismo caso queda colgado sin aviso, así que no
  es una regresión, pero sí un comportamiento nuevo. No se mide en local.
- **Cierre de la pestaña equivocada (preexistente):** el `error:` cierra
  `tabService.currentIndex`. Si en esos 20 s el cajero pasa a otra pestaña, el diálogo cierra esa.
  El patrón ya existe en las otras ramas de error de `validarPdvSucursal`; con un timeout de 20 s
  se vuelve más alcanzable. Fuera de alcance; se anota en la issue de seguimiento.
- **Modo `isLocal=false` (solo central):** todo va por `http2`, que lleva
  `createCentralTimeoutLink` (`graphql-connection.service.ts:423-441`). Si el WS central todavía no
  se confirmó online y la respuesta tarda más de 3 s, ese link da un error de red. Hoy se tragaba y
  *Venta* quedaba colgada; con el fix sale «Error de Validación» y se cierra la pestaña. Es el
  comportamiento buscado, pero con un umbral de 3 s en vez de 20. Caso 9 de la prueba.
- **Error GraphQL ≠ error de red (preexistente):** si el filial responde con `errors`,
  `onCustomQuery` muestra el snackbar «Ups! Algo salió mal» y emite `null`
  (`generic-crud.service.ts:174-187`). El POS lo muestra como «No se encontró el Punto de Venta»,
  que es engañoso. El fix no lo cambia → seguimiento.
- **`pdvValidado` no gatea nada (preexistente):** solo se asigna (`venta-touch.component.ts:192`,
  `:348`), nadie lo lee. Los atajos F12/F11/F8 miran `isDialogOpen`, `isCargando` y
  `guardandoVenta` (`:409`). Mientras la validación está pendiente se puede intentar cobrar. El fix
  acota esa ventana de 300 s a 20 s; agregar el gate queda en el seguimiento para no ampliar el
  alcance.
- Electron empaquetado: no se prueba; el cambio es solo de la capa Angular/Apollo, igual en web y
  en Electron.

## Fuera de alcance → issue de seguimiento

- Las ~427 llamadas a `onCustomQuery` sin `networkError.propagate` (118 archivos): los `error:` que
  tengan sus suscriptores son inalcanzables ante un error de red. Hay que relevar cuáles asumen lo
  contrario, empezando por el POS (caja, cotizaciones).
- El cierre de pestaña por `currentIndex` en `validarPdvSucursal`: capturar la pestaña propia al
  iniciar la validación.
- El error GraphQL de la validación mostrado como «No se encontró el PDV».
- Gatear F12/F11/F8 con `pdvValidado`.

## Auditoría del plan (paso 5, 2026-10-02)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Un solo llamador; el contrato GraphQL no cambia; el contexto llega al link del filial; igual en web y Electron | — | verificado, sin cambios |
| A | Con `isLocal=false` el timeout de 3 s del central puede disparar el diálogo | media | verificado en `graphql-connection.service.ts:426-441`; se anota en Riesgos y como caso 9 |
| A/B | El error GraphQL sale como «No se encontró el PDV» + snackbar | media/baja | preexistente; se anota en Riesgos y en el seguimiento |
| B | `pdvValidado` no gatea F12/F11/F8 | media | verificado con grep; preexistente; se anota en Riesgos y en el seguimiento |
| B | No queda ningún flag colgado; una respuesta tardía se descarta; cerrar *Venta* antes no abre diálogo; el rollback es limpio | baja | verificado; se suman los casos 6-8 |
