# Plan: `onCustomQuery` siempre termina (14h, cierre de #390)

Parte de #390 (es el punto que le da título). Repo: desktop. Sin cambios en el central.
Revierte, con aprobación de Franco (2026-10-07), lo decidido en #355 de no cambiar el comportamiento por defecto.

## 1. El problema [relevado sobre `develop`]

`onCustomQuery`, ante un **error de red** (sin conexión, central offline, corte del link) y sin `errorConf`: no
emite, no completa y no avisa. Quien llama queda esperando para siempre. (Ante un error del servidor ya avisa y
emite `null`.)

De 430 llamadas, 241 no pasan `errorConf`; unas 190 tienen llamadores vivos. Qué pasaría con ellas si el error
empezara a llegar (`obs.error`), que es lo que ya hacen `onSave` y las lecturas por id:

- **~100 mejoran solas**: ya tienen un `error:` correcto que hoy no corre (modales que quedan abiertos, «buscando»
  eterno, buscadores que ignoran Enter).
- **~108 solo necesitan atrapar el error** (no tienen estado propio): sin tocarlas dejarían un error en la consola.
- **~15 tienen estado propio sin `error:`** (cajas para pagar en RRHH, confirmar vale, lista de factura legal,
  exportar a Excel en gráficos…): seguirían colgadas.
- **11 flujos se romperían**: tienen un `switchMap` sobre un filtro, un temporizador o lo que se tipea, sin atrapar
  el error adentro. Hoy sobreviven porque la consulta colgada se cancela con el siguiente cambio; con el error
  **mueren hasta reabrir la pantalla**:
  - los 9 gráficos (dejan de recargar al cambiar un filtro);
  - el buscador global de productos (Ctrl+Espacio);
  - **el sondeo cada 3 s que cierra el registro de una venta con tarjeta** cuando el celular lo completa, y la
    espera de la foto del cupón (PDV);
  - los comentarios de una notificación y dos paneles de formato.
- **6 manejos de error que empezarían a correr y dicen o hacen algo falso**:
  - edición de sucursal: carga una lista de ciudades **de mentira** (Asunción, Ciudad del Este, Encarnación) y al
    guardar puede pisar la ciudad real;
  - ajuste de salario mínimo: «Ningún funcionario quedó por debajo del nuevo mínimo», con tilde verde;
  - proveedor (3 pantallas): «Documento disponible»;
  - configurar replicación: deja «Configurar» habilitado sin saber si ya existe;
  - lector de terminal POS: «terminal no encontrada» en vez de «sin conexión»;
  - abrir caja: reintenta 15 veces la diferencia de maletín (acotado, no escribe).
- **Avisos fuera de lugar** si el genérico avisara siempre: durante el arranque sin red (lectura de la sucursal
  actual, antes de que haya pantalla) y en sondeos (cada 3 s; cada 3 min en el PDV).

No hay lecturas de guarda (saldo, stock, caja abierta, duplicado) que pasen de «falla cerrada» a «seguir» con el
cambio.

## 2. Cambio

### El genérico
Sin `errorConf`, el error de red **falla hacia quien llama**. Con `errorConf`, nada cambia.
Aviso del genérico «No se pudo consultar: …», sin repetir, **salvo**: cuando el corte lo avisó el link, y cuando la
consulta es de fondo (`silentLoad`): un sondeo o una lectura silenciosa no avisan.

No se elige «emitir `null` y completar»: `null` ya es lo que llega ante un error del servidor, y hay consumidores
que con `null` deciden («documento disponible», «no hay cajas abiertas», cotización 1): extenderlo al error de red
agrandaría ese problema.

### Tres PRs
**PR 1 — preparación (no cambia el genérico; todo lo que se rompería o mentiría).** Inofensivo por sí solo.
- Los 11 flujos con `switchMap`: atrapar el error adentro, para que el flujo siga vivo. En el sondeo de tarjeta y
  la espera del cupón, además, seguir sondeando.
- Los 6 manejos que mienten: sucursal sin lista de mentira (no se puede guardar la ciudad si no cargaron);
  ajuste de salario mínimo con «no se pudo consultar»; proveedor «no se pudo verificar el documento»; replicación
  con «Configurar» deshabilitado si no se leyó el estado; terminal POS «sin conexión»; el reintento de abrir caja
  se deja (acotado).
- El servicio de impresión compartido: un solo `error:` cubre todas las impresiones a PDF y a ticket.
- Los ~15 con estado propio colgado (`terminarSiFalla`).
- PDV: los contadores de solicitudes de gasto conservan su valor ante un corte, en vez de ir a 0.

**PR 2 — el cambio.** El genérico (con tests), la lectura del arranque sin aviso, y `terminarSiFalla` en los ~108
que solo necesitan atrapar el error.

**PR 3 — limpieza.** Comentarios viejos, avisos dobles (donde el consumidor y el genérico dicen lo mismo), y las
lecturas de decisión que hoy dependen del `null` del error del servidor (duplicado de persona, timbrado activo
único) pasadas a lectura estricta.

## 3. Lo que no cambia
- El timeout por defecto de `onCustomQuery` (300 s, por los reportes pesados).
- Qué pasa ante un error del servidor (`null`).
- Los ~190 llamadores que ya pasan `errorConf`.

## Prueba de runtime
- PR 1: cada flujo con `switchMap` con la consulta fallando dos veces seguidas (sigue vivo) — con un genérico que
  ya propague, simulado; el sondeo de tarjeta; sucursal; ajuste de salario mínimo; impresión.
- PR 2: tests del genérico; una pantalla de cada grupo con error de red (aviso único, nada colgado, consola sin
  errores); arranque sin red (sin aviso); un sondeo (sin aviso); un reporte (el error llega).

## Riesgos
- Es el genérico más usado (430 llamadas). Mitigación: el PR 1 va primero y solo, y se puede probar que cada
  flujo sobrevive antes de tocar el genérico.
- El sondeo de tarjeta es PDV y plata: si muriera, el registro no se cerraría solo. Es lo primero a cubrir y probar.
- ~108 cambios mecánicos en el PR 2: se parte por módulo si queda grande.

## Decisiones de Franco (2026-10-07)
- Se cambia el comportamiento por defecto de `onCustomQuery` (revierte lo decidido en #355).
- Tres PRs: preparación, genérico, limpieza.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Hechos corregidos
- Los gráficos con `switchMap` son **10**, no 9.
- **La cuenta de «sin `errorConf`» está subestimada**: hay 48 wrappers que aceptan `errorConf` opcional y lo
  reenvían; cada llamador que no lo pasa es una llamada sin `errorConf` (`onGetAllSucursales` tiene 46, la lista
  de monedas unas 36, cajas activas, balance de caja…). El barrido del PR 2 se hace **por llamador**, no por wrapper.
- `silentLoad` **no sirve** para decidir si se avisa: solo significa «sin el modal Buscando…». Lo pasan lecturas
  que el usuario sí espera (los 18 gráficos, el resumen fiscal, la búsqueda de personas, el reconocimiento facial).
- Cuatro de los seis manejos que mienten **ya mienten hoy** ante un rechazo del servidor (`null`): ajuste de
  salario mínimo, proveedor, replicación (su `error:` no corre nunca: el servicio ya convierte todo en `null`) y
  el lector de terminal. Se corrigen los dos caminos.
- El servicio de impresión cubre 15 llamadas (recibos de RRHH, caja mayor, notas, transferencias en lista). Las
  demás impresiones suscriben por su cuenta.
- La lectura del arranque **mejora** con el cambio: sin red hoy espera 5 s; con el error resuelve enseguida.

### Cambios al diseño
- **Aviso del genérico (PR 2)**: avisa siempre, sin repetir, salvo una marca explícita `sinAviso` en el contexto
  de la consulta. La llevan solo los sondeos (tarjeta, cupón, comentarios, contadores del PDV, paneles de formato,
  reintento de abrir caja) y la lectura del arranque.
- **El genérico cancela de verdad (PR 2)**: hoy no tiene limpieza; una consulta que el `switchMap` descarta sigue
  viva y, con el cambio, avisaría su error más tarde (una por cada tick de un sondeo). Devuelve limpieza, cierra
  su modal y no avisa si ya nadie escucha. Los sondeos pasan un corte corto en vez de los 300 s por defecto.
- **Cierre del genérico (PR 2)**: respuesta sin `data` ni `errors`, y completar sin emitir, también terminan.
- **Doble aviso (PR 2)**: unos 100 consumidores ya avisan en su `error:`. Se releva cuáles dicen lo mismo que el
  genérico y esos piden silencio en el mismo PR, no en el 3.
- **`terminarSiFalla` deja el error en la consola**: ahí también cae un error de programación de un operador de
  más arriba, que antes se veía y quedaría mudo.
- **Sucursal**: además de quitar la lista inventada, la ciudad se conserva cuando no se encuentra la elegida.
- **Impresiones que imprime el servidor** (transferencia): si se pierde la respuesta, el aviso tiene que decir
  «no se pudo confirmar la impresión, puede haber salido», no invitar a reintentar. Va en el PR 2.

### Partición (reemplaza «Tres PRs»)
**PR 1 — preparación** (no toca el genérico): los 16 flujos con `switchMap` (10 gráficos, buscador global, sondeo
de tarjeta, espera del cupón ×2, comentarios, dos paneles de formato); los manejos que mienten (sucursal, ajuste
de salario mínimo, proveedor y proveedor de servicio, replicación, lector de terminal); el servicio de impresión;
los contadores del PDV; confirmar vale.

**PR 2 — el genérico**: el cambio con tests, la marca `sinAviso`, la limpieza al cancelar, el arranque; y los
consumidores, por llamador: los que solo necesitan atrapar el error, los que tienen estado propio (pasan del PR 1:
hasta que el genérico no propague no se pueden probar y hoy no empeoran), las fuentes de `combineLatest` /
`forkJoin` sin manejo (gráfico de ingresos y gastos, legajo, observaciones de caja y de venta, modificaciones),
las promesas de la marcación facial, las impresiones directas y los avisos dobles.

**PR 3 — limpieza**: comentarios viejos y las lecturas de decisión que dependen del `null` (duplicado de persona
en el alta de persona y en el legajo, timbrado activo único) pasadas a lectura estricta.

### Anotado, fuera de este cambio
- El `error:` «Se perdió la conexión con el servidor de la sucursal» de la espera del cupón solo corre si falla
  el canal de avisos, y ese fallo corta también el sondeo. Hoy ya es así.
- Proveedor: con el documento sin verificar se avisa pero no se bloquea el guardado.

## Auditoría del plan (paso 5, 2026-10-07)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Wrappers con `errorConf` opcional contados como «ya migrados» | alta | barrido por llamador en el PR 2 |
| A | `terminarSiFalla` esconde errores de programación | alta | deja el error en la consola |
| A | `silentLoad` no distingue un sondeo de una lectura esperada | alta | marca `sinAviso` explícita |
| A | El genérico no cancela: avisos de consultas ya descartadas | alta | limpieza en el PR 2 |
| A | Sucursal: quitar la lista inventada no alcanza | alta | la ciudad se conserva si no se encuentra |
| A | Los manejos que mienten ya mienten con `null` | alta | corregidos los dos caminos |
| A | Contadores del PDV a 0 ante un fallo | media | conservan su valor |
| A | Fuentes de `combineLatest` y `forkJoin` sin manejo | media | PR 2 |
| A | Impresión: el servicio compartido cubre 15 de ~40; la del servidor puede duplicar | media | PR 2 |
| A | Reintento de abrir caja: modal y aviso por intento | media | PR 2, con `sinAviso` |
| A | Sondeo de tarjeta: «se perdió la conexión» inalcanzable | media | anotado |
| A | Gráficos: 10 y no 9 | baja | corregido |
| B | Emitir `null` ante el error de red arreglaría más con menos cambios | — | descartado: `null` es con lo que se decide mal |
| B | Doble aviso en ~100 consumidores | alta | se resuelve en el PR 2, no en el 3 |
| B | Orden de los PRs | media | lo que solo se puede probar con el genérico pasa al PR 2 |

## PR 1 — Implementación: desvíos
- Los consumidores con estado propio colgado (cajas para pagar en RRHH, lista de factura legal, exportar a Excel
  de los gráficos, etc.) pasan al PR 2: hasta que el genérico no propague, su manejo no corre y no se puede
  probar. Del grupo solo entra confirmar vale (apaga su «cargando cajas»).
- Proveedor: solo se corrige el camino del error. Ante un rechazo del servidor la consulta devuelve `null`, igual
  que cuando el documento no existe: distinguirlos pide lectura estricta y va en el PR 3. Hasta el PR 2 el cambio
  de proveedor no tiene efecto.
- El reintento de abrir caja no se toca (acotado, no escribe): PR 2, con la marca `sinAviso`.
- Se agrega `rxjsUtils.spec.ts` (los dos operadores).

## PR 1 — Prueba de runtime (2026-10-07)
Central propio en `:8085` (replicación apagada y verificada), desktop servido en `:4202`. Como el genérico todavía
no propaga, el error de red se simuló haciendo que `onCustomQuery` falle con la forma de un error de Apollo.

| Caso | Resultado |
|---|---|
| Gráfico de ventas por sucursal: dos filtros seguidos con la consulta fallando, después dos normales | las dos fallidas dejan el error en la consola y apagan el «cargando»; las dos siguientes consultan y responden |
| Ajuste de salario mínimo con rechazo (`null`) y con error de red | «No se pudo consultar…», sin el «Ningún funcionario…» |
| Ajuste de salario mínimo normal | lista de afectados como antes |
| Editar sucursal con las ciudades fallando | lista vacía (sin ciudades inventadas); al guardar se envía la ciudad que la sucursal ya tenía |
| Editar sucursal normal | 6 ciudades; se envía la elegida |
| Test de los operadores (Karma) | 3 de 3 |

**No probado en runtime**: sondeo de tarjeta y espera del cupón (cubiertos por el test del operador, no por un
cobro real), buscador global, comentarios, paneles de formato, los otros nueve gráficos, proveedor, replicación,
lector de terminal, servicio de impresión, contadores del PDV y confirmar vale. Los guardados de sucursal se
interceptaron: no se escribió nada.

## PR 1 — Auditoría del diff (paso 8, 2026-10-07)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Proveedor: el `null` del rechazo sigue diciendo «Documento disponible» | media | diferido al PR 3, anotado en desvíos |
| Replicación: «volvé a elegir la sucursal» no reintenta (misma opción) | baja | texto corregido |
| Sondeos: un error por intento en la consola cuando el genérico propague | baja | PR 2 (`sinAviso`) |
| `switchMapSinCortar`: un proyector que lanza en forma síncrona corta el flujo | baja | igual que antes; los 16 devuelven observables |
| Imports de `switchMap` sin usar | baja | quitados |

## PR 2 — el genérico

### Qué cambia en `onCustomQuery`
- **Sin `errorConf`, el error de red llega a quien llama** (antes: ni emitía ni completaba).
- **Aviso sin duplicar**: el genérico avisa «No se pudo consultar: …» solo si quien llama no avisó en su
  `error:`. Lo sabe porque todo el sistema avisa por `NotificacionSnackbarService`: mientras entrega el error
  escucha si salió un aviso. Así los ~100 consumidores que ya dicen lo suyo no quedan con dos carteles y no hay
  que tocarlos uno por uno (reemplaza «esos piden silencio» de los ajustes de arriba).
- **Marca `sinAviso`** en el contexto (`CONTEXTO_SONDEO`: corte de 20 s, sin aviso del link ni del genérico):
  sondeo de venta con tarjeta, espera del cupón, comentarios, paneles de formato, contadores del PDV, reintento
  de abrir caja, y la lectura de la sucursal en el arranque.
- **Cancela de verdad**: si quien llama deja de escuchar, la consulta se corta y su «Buscando…» se cierra.
- **Siempre cierra**: respuesta sin `data` ni `errors`, y completar sin emitir, emiten `null`.
- Con `errorConf`, nada cambia (salvo que el «Buscando…» ahora se cierra también cuando el error no se propaga).

### Consumidores
- Con `error:` propio: empieza a correr (relevados en el plan: correctos, o corregidos en el PR 1).
- Sin `error:` y sin estado: reciben el aviso del genérico; el error queda además en la consola como no
  manejado. **No se editan en masa**: no cambia nada para el usuario y son más de cien archivos.
- Con estado propio, fuentes de flujos compuestos y promesas: se corrigen en este PR.
- Impresión de transferencia (la imprime el servidor): aviso propio «no se pudo confirmar la impresión: puede
  haber salido».
