# Análisis — `onCustomQuery` sin `networkError.propagate` (issue #390)

Estado: **relevamiento**, paso 1 de la #390. Fecha: 2026-10-02. Base: `develop` con #389 (`0a142bf2`).
Hecho con 4 auditores de solo lectura por área; los hallazgos marcados **[verificado]** los leí en el
código. El resto es lo que reportó cada auditor; en financiero ~125 de ~190 sitios se clasificaron por
patrón, sin leer uno a uno.

## El problema, en una línea

Ante un error de red o timeout, `onCustomQuery` (`generic-crud.service.ts`) solo hace `obs.error` si
`errorConf.networkError.propagate === true`; si no, el Observable no emite ni completa. El spinner
«Buscando…» propio sí se cierra; lo que queda trabado es lo del **suscriptor**: su `error:`/`catchError`
nunca corre, sus flags (`cargando`, `isLoading`…) no se resetean, `finalize`, `forkJoin` y
`firstValueFrom` no terminan. Timeout por defecto: 300 s.

## Cifras

| Área | Llamadas sin `propagate` | A (roto) | B (sin aviso) | C (inocuo) |
|---|---|---|---|---|
| financiero + pdv + shared + notificaciones | ~140 métodos / ~190 suscripciones | ~70 (POS ~12) | ~75 (POS ~14) | ~40 |
| operaciones | ~86 métodos | ~39 (+12 A*) (POS 1) | ~19 (POS 1) | ~24 |
| rrhh + personas + admin + config | — | ~18 | ~45 suscriptores (~20 de dinero) | ~5 archivos |
| activos + productos + gráficos | todos | 13 filas (+9 exportar) | 12 (POS 5) | 10 archivos |

Clases: **A** = un `error:` que se asume alcanzable o un flag que solo se resetea en next/complete →
queda trabado. **A\*** = el aviso de error escrito es inalcanzable, sin flag. **B** = no se traba, pero
pantalla vacía o click mudo sin aviso. **C** = solo asigna datos.

Ya protegidos (propagan): `cambio`/`moneda` en segundo plano, `punto-de-venta.onGetPuntoDeVentaPorId`,
`mapa-formato`, `impresion-pos`, `buscador-compras:193`, `transferencia:337`,
`cliente.onGetClientePorPersonaDocumentoDetallado`, `onConsultaRuc`, parte de marcación.

**Hallazgo transversal:** muchísimos `error:` ya están escritos (con aviso y reset de flags) y son
inalcanzables. En esos casos el arreglo es **solo** pasar `propagate`; el código de manejo ya existe y
fue pensado para ese caso.

## Prioridad 1 — POS: venta

| Clase | Dónde | Qué pasa con el filial caído |
|---|---|---|
| A **[verificado]** | `lote.service:99` (`errorConf=null`) → `seleccionar-lote-venta-dialog:282` | diálogo de lote en «cargando» en medio de la venta; `manejarErrorDeCarga` (aviso + seguir por FEFO, :311) inalcanzable |
| B **[verificado]** | `producto.service:185 onGetProductoPorCodigo(false)` → `pdv/layout/buscador:206` y `:276` (pesables) | escanea y no pasa nada: sin beep, sin ítem, sin foco |
| B | `producto.service:185/:189` → `pdv-search-producto-dialog:272-300` | `forkJoin` nunca emite, lista con resultados viejos; `catchError` inalcanzables |
| B | `pdv-categoria.service:65` | botones de categorías del PDV nunca cargan |
| B | `tipo-precio.service:16` → `venta-touch:592` | tipos de precio vacíos; el aviso está en el `else` de null |
| B | `movimiento-stock.service:84` → `venta-touch:1865` (post-venta) | notificación de stock crítico perdida (no bloquea) |

## Prioridad 1 — POS: cobro y caja

| Clase | Dónde | Qué pasa |
|---|---|---|
| A | `venta-tarjeta.onMotivoCuponNoUsable:198` → `pago-touch:955`, `escanear-cupon-dialog:363`, `scan-terminal-pos-dialog:295` | escanear cupón no hace nada; `error:` («un fallo de red no puede bloquear el cobro») inalcanzable; diálogos congelados |
| A | `venta-tarjeta` `onGetCobrosTarjetaDeVenta`/`onGetCompletaPorId`/`onFiltrarPorCaja` → registrar-venta-tarjeta-dialog, ventas-tarjeta-caja-dialog | flags trabados en conciliación de cupones |
| A | `configuracion-venta-tarjeta` / `configuracion-factura-con-venta` → `pago-touch:235/:244` | defaults del `error:` no corren; opción de tarjeta ausente sin aviso |
| A | `venta-tarjeta.onCountSinRegistrar` → `adicionar-caja-dialog:627` (al cerrar) | tocar «cierre» no hace nada, sin aviso |
| B **[verificado]** | `adicionar-caja-dialog:196/:205` (deliverys abiertos, gastos pendientes al abrir el diálogo) | **fail-open**: flags en `false`, `goTo("cierre")` (:620-622) deja pasar. Solo si la caída es transitoria (si sigue caído, el cierre mismo falla) |
| A | `caja.onGetCajasWithFilters` → `ultimas-cajas-dialog:56` | spinner infinito |
| A | `caja.onGetCajasAnalisisDiferencias` → `adicionar-caja-dialog:455` | se corta el chequeo de diferencia de maletín sin aviso |
| B **[verificado]** | `delivery.onSaveDeliveryAndVenta:68` → `edit-delivery-dialog:654` | **es una `mutation` (`graphql-query.ts:576`) enviada por `onCustomQuery` → `apollo.query`** (`SaveDeliveryAndVentaGQL extends Query`). Guardar no hace nada ni avisa; si vence el timeout, el link avisa como query («no respondió») y no como mutation («pudo haberse aplicado»). Riesgo de reintento y **duplicado**. Debería ir por `onCustomMutation` |
| B | `caja.onImprimirBalance`, `delivery.onReimprimirDelivery`, `gasto.onReimprimir`, `retiro.onReimprimirRetiro` (rama server-side) | botón imprimir mudo |
| B | `captura-cupon.consultar:152` (sondeo) | diálogo de cupón «esperando» para siempre |
| A (probable POS) | `search-list-dialog:265/:281` | `isSearching` trabado |

## Prioridad 2 — marcación y arranque

| Clase | Dónde | Qué pasa |
|---|---|---|
| A **[verificado]** | `marcacion.service:126` → `marcar-horario:312` (`firstValueFrom` sin timeout) | si la 2.ª consulta no responde, `cargando` true y botón de marcar bloqueado hasta 300 s (la 1.ª sí tiene propagate + timeout 5 s) |
| A | `usuario.service:75 onGetUsuarioParaLogin` → `login.service:161` | el login no emite (pantalla no verificada) |
| A | `usuario.service:69 onGetUsuario` → `main.service:140` | el arranque queda esperando |
| A | `horario.service:35` → `list-funcioario:228` | asignación de horarios nunca termina, sin aviso |

## Prioridad 3 — dinero fuera del POS (RRHH, tesorería)

- A: `liquidacion-final.onPreview` (Generar deshabilitado), `vale.onGetCuotas`, `configuracion-rrhh` salario mínimo, reportes RRHH (`generandoReporte`), caja virtual / tesorería / maletín (financiero-dashboard, caja-virtual-dashboard, confirmar-vale-dialog), gastos (retiro-pre-gasto, poll mudo).
- B: **`liquidacion-detalle-dialog` con cabecera e ítems vacíos y los botones de aprobar/pagar sobre datos no cargados**; finiquito vacío; cuotas de préstamo; exposición financiera del legajo en 0 sin aviso; «Revertir egreso» mudo; listas.

## Prioridad 4 — resto

- Operaciones: devolución (dashboard no arranca: `error: ()=>iniciar()` inalcanzable), compras/recepción (formulario deshabilitado), pagos, transferencias (`edit-transferencia:1854` deja el spinner global «Verificando stock…» ~305 s; grilla de ítems que nunca se pinta), lotes, modificaciones.
- Productos/activos: stock en transferencias y compras («Calculando…»), reportes, códigos, envases, activos (`loadingSubject`), gráficos (17 consultas + 9 exportar con `finalize`).
- Configuración: replicación lógica, facturación, formatos POS. Notificaciones: `isRefreshing` trabado → refresco muerto toda la sesión.

## Propuesta de arreglo

Regla por llamada (no global, decidido en #355):
1. `networkError: { propagate: true, show: false }` en el método del servicio **si todos sus suscriptores
   tienen `error:`/`catchError`**; si alguno no, se le agrega un `error:` en el mismo PR (si no, el
   error queda «Unhandled» en consola y puede romper el stream).
2. Lo que el usuario espera de pie (POS, marcación): `timeoutMs` corto (5–15 s) con
   `silenciarAvisoTimeout` cuando el propio `error:` ya avisa.
3. Reportes/PDF: `timeoutMs` alto y aviso.
4. **Cierres y chequeos de seguridad, fail-closed**: si no se pudo verificar, no dejar pasar.
5. Lo que pasa por `switchMap`/streams del constructor: `catchError` **dentro** del `switchMap`, o el
   stream muere con el primer error.
6. Mutations o acciones con efecto que pasen por `onCustomQuery` (p. ej. `onSaveDeliveryAndVenta`):
   no reintentar a ciegas; avisar «verificá antes de reintentar».

PRs sugeridos (cada uno < 400 líneas, con su prueba de runtime contra el filial congelado):

| PR | Alcance |
|---|---|
| 1 | POS venta: lote, buscador por código, pdv-search, categorías, tipos de precio, stock crítico |
| 2 | POS cobro y caja: cupón/tarjeta, configuración de pago, cierre de caja fail-closed, últimas cajas, delivery, reimpresiones, captura de cupón |
| 3 | Marcación + login + arranque |
| 4 | RRHH dinero (liquidación, finiquito, vales, préstamos, legajo) |
| 5 | Tesorería / caja virtual / gastos / notificaciones |
| 6+ | Operaciones (por submódulo), productos/activos, gráficos, configuración |

`onGetById` tiene el mismo problema en todas sus ramas de error: queda fuera de esta lista y va aparte.

## Snackbars con el servidor caído

`app.component.ts:98-124` encola los snackbars: «Servidor Offline!!» (cada 3 s, 1 s de duración) no
pisa los avisos de los `error:`, solo los retrasa hasta 1 s. Verificado en la prueba del PR 1.

## Sin verificar

- Los ~125 sitios de financiero clasificados por patrón.
- Pantalla de login con el central caído.
- Qué otras mutations pasan por `onCustomQuery` (`grep -l 'mutation' graphql/*` contra clases `extends Query`): se encontró una, no se buscaron más.
- Si guardar un activo sin cuotas cargadas pisa sus cuotas.
- Los >60 suscriptores de `sucursal.onGetAllSucursales`.
- Métodos sin suscriptores (código muerto): listados en los relevamientos por área (`relev-*.md`).
