# Plan — errores de red en transferencias (issue #390, PR 6a)

Pieza: **desktop**. Rama: `fix/operaciones-errores-de-red-en-transferencias`, desde `origin/develop` (no comparte
archivos con #398). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (#391) y
`TIMEOUT_POR_DEFECTO_MS`. Relevamiento: auditor de solo lectura sobre transferencias y devoluciones (2026-10-03),
cada suscriptor leído. Todo va al **central**. Devoluciones van en 6b.

## 0. `onGetById` con `errorConf` opcional (base de este PR y de 6b)

`onGetById` (`generic-crud.service.ts:339`) no emite nada ante **ningún** error, y con un error GraphQL **no
cierra** su «Buscando…» (queda hasta el corte de 65 s). Tiene un parámetro `error?` que no se usa. Cambio:
nuevo parámetro final opcional `errorConf?: QueryError` (12.º; el único llamador con 11 argumentos,
`cliente.service:100`, es compatible). **Sin él, el comportamiento es idéntico al de hoy** (los >60 llamadores no
cambian). Con él:
- error de red → el aviso propio («Problema al realizar esta operación») solo si `networkError.show === true`
  (`PROPAGAR_ERROR_DE_RED` lo apaga: avisa el `error:` del llamador, sin duplicar), y `obs.error(error)` si
  `networkError.propagate`;
- error GraphQL → cierra el diálogo (hoy no lo cierra), avisa como hoy, y **emite `null` y completa** (contrato de
  `onCustomQuery`), o `obs.error({ message, errors })` si `graphError.propagate`. Ojo: con `errorConf` un `null`
  también puede ser «no encontrado»: cada llamador lo trata explícitamente;
- en las dos ramas de error `isLoading = false` (hoy la de red no lo baja: el cursor `progress` de
  `app.component:341` queda puesto).

## 1. Cargar un ítem: chequeo de stock (`edit-transferencia:1849-1890`) [el más grave]

Al agregar un ítem se abre el overlay global «Verificando stock…» y se consulta el stock del producto en el
origen (`producto.onGetStockPorProductoAndSucursal`, `silentLoad`, corte 300 s) y la configuración
(`configuracionTransferencia.onGetConfiguracion`, anidada). Sin respuesta: el overlay tapa la app 65 s y se cierra
solo; **no avisa**, el ítem no se agrega y la consulta sigue colgada; el `error:` escrito (avisa y limpia,
fail-closed) es inalcanzable. Cambio:
- `onGetStockPorProductoAndSucursal` (`producto.service:140`) recibe `errorConf?`/`contexto?` y se usa opt-in
  **solo desde esta llamada** (tiene otros 4 llamadores del POS y compras) con `TIMEOUT_CONSULTA_DE_FONDO_MS`;
- **auditoría:** con un error GraphQL hoy emite `null`, `stock != null && stock < 0` da `false` y **agrega el ítem
  sin verificar** (fail-open). Cambio: en esta llamada `stock == null` cuenta como error → no se agrega, aviso;
- `onGetConfiguracion` (transferencias) recibe parámetros y propaga en el servicio con 20 s (2 suscriptores, los
  dos con `error:`);
- el overlay se cierra y se avisa en el `error:` que ya existe (solo avisa; el `onClear` está en el interno).
  **Fail-closed: sin verificar stock no se agrega el ítem**, ni con error de red ni con `null`.

## 2. Abrir una transferencia y su grilla de ítems

- `transferencia.onGetTransferencia` (`onGetById`, 3 suscriptores): `edit-transferencia:429` (pantalla vacía sin
  aviso), `list-transferencia:245` (búsqueda por id colgada) y `:368` (`onDelete`) → `errorConf` en el servicio y
  `error:` en los dos que no lo tienen. **Auditoría:** con `errorConf` un error GraphQL emite `null`, y `onDelete`
  (`:368-395`) seguiría a borrar (`transferenciaCompleta?.transferenciaItemList` falsy): hoy no borra porque no
  emite. Cambio: en `onDelete`, `null` → aviso y **no borra** (sigue fail-closed).
- `onGetTransferenciaItensPorTransferenciaId` (`onGetById`) y `…WithFilter` (`onCustomQuery`, recibe parámetros,
  20 s) → todo pasa por `cargarPaginaItems` (`edit-transferencia:~460-540`): un `error:` ahí con aviso.
- `onAlertasTransferenciaItems` (`:488` dentro de un `switchMap`, `:539` `actualizarAlertasPaginaActual`, 5
  llamadores): si propagara, el error mataría el pipe; y **hoy** un `null` (error GraphQL) hace `for…of null` en
  `combinarItemsConAlertas` → TypeError → la grilla no se pinta. Cambio: el método recibe parámetros (hoy pasa
  `null` fijo), propaga con 20 s; `catchError(() => of([]))` dentro del `switchMap`, `error:` en `:539` y
  `alertas ?? []`: **los ítems se muestran aunque las alertas no carguen** (con aviso).

## 3. Crear una transferencia y listas

- `sucursal.onGetAllSucursales` en `seleccionar-sucursal-dialog:66` (overlay global cerrado solo en `next`: el
  selector de origen/destino queda en blanco 65 s) y `list-transferencia:186` (filtros; con `null`, `res.filter`
  lanza TypeError) → opt-in en la llamada (5a le dio los parámetros), `res?.` y `error:`; en el selector, error o
  `null` → cierra el overlay **y el diálogo** con aviso (en blanco no sirve).
- `presentacion.onGetPresentacionesPorProductoId` (`onGetById`) en `create-item-dialog:59` (overlay global cerrado
  solo en `next`) → recibe `errorConf`, `error:` y `null` cierran el overlay y el diálogo con aviso.
- `onGetTransferenciasWithFilters` (`list-transferencia:221`, también cada 300 s por `interval`): lista vacía sin
  aviso → recibe parámetros, opt-in con 60 s + `error:` en `onFilter` (cada `onFilter` es una suscripción nueva: el
  `interval` no muere). Al abrir la lista se llama 3 veces: con red caída pueden salir avisos apilados (aceptado).
- `buscarHojasRutaPorFecha` (`entregadores:132`, `isLoading` trabado, `error:` inalcanzable) → propagar en el
  servicio con 20 s.
- `onGetHojaRuta` (`onGetById`, `ruta-hoja:83`, `finalize` nunca corre) → `errorConf` + `error:`; error o `null`
  **cierran el diálogo** con aviso: con `selectedHojaRuta` sin cargar, `onSave` (`:196`) mandaría `id` undefined y
  crearía una hoja nueva duplicada.
- `onGetTransferenciaItem` (`onGetById`, `list-movimiento-stock:436` y `:800`) → `errorConf` + `error:` en `:800`.

Sin cambio: `onGetTransferenciasPorHojaRuta` (ya propaga), `lote.onGetStockPorLoteEnPresentacion` (ya propaga),
`onImprimirTransferencia` (B, sin traba; va con los reportes).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(operaciones): no dejar el overlay de stock ni la grilla de una transferencia sin respuesta` | 0, 1, 2 |
| 2 | `fix(operaciones): avisar cuando no cargan sucursales, listas y hojas de ruta de transferencias` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` al final.

## Prueba de runtime

Central local `:8081` (rama local de pruebas, sin perfil, replicación apagada y verificada en *Negative
matches*), congelado con `kill -STOP` y un respaldo `kill -CONT`. Casos: abrir una transferencia existente
(cabecera, grilla, alertas), agregar un ítem (chequeo de stock: aviso y no agrega), crear una transferencia
(selector de sucursales), lista y búsqueda por id. **No se guarda ni se envía ninguna transferencia** con el
central congelado. Casos `null` (error GraphQL): verificados por código.

## Riesgos y qué queda sin verificar

- `onGetById` cambia de firma (parámetro opcional 12.º): sin efecto para quien no lo pasa (verificado: el único
  llamador con 11 argumentos es compatible).
- Con el central lento (>20 s) no se puede agregar un ítem hasta que responda (hoy tampoco, pero sin aviso).

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | `onDelete` pasaría a **borrar** con un `null` (error GraphQL con `errorConf`) | alta | `null` → aviso, no borra |
| B | Chequeo de stock: con error GraphQL **hoy** agrega el ítem sin verificar | alta | `stock == null` = error, no agrega |
| A | Varias firmas no tienen `errorConf`/`contexto` (stock, configuración, alertas, filtros, presentaciones) | media | listadas: parámetros finales opcionales |
| B | Sin timeout propio quedaban 300 s | media | 20 s (fondo) / 60 s (listas) |
| A/B | Aviso duplicado de `onGetById` | media | con `errorConf`, el propio solo si `show === true` |
| B | `onGetById` no baja `isLoading` en el error de red (cursor `progress`) | media | se baja en las dos ramas |
| A | Faltaban `res?.` en filtros y `error:` en `actualizarAlertasPaginaActual` | media | agregados |
| B | Selector de sucursales, alta de ítem y hoja de ruta quedaban en blanco; la hoja podía duplicarse al guardar | media | error o `null` cierran el diálogo |
| A | «ningún llamador con 11 argumentos»: `cliente.service:100` los usa, compatible | baja | texto corregido |
| A | Redacción (`error:` de stock solo avisa; «paginador inactivo» sin mecanismo) | baja | corregido |
| B | Avisos apilados al abrir la lista (3 llamadas) | baja | aceptado |
| A/B | Llamadores de los 7 métodos; `closeDialog` idempotente; `interval` no muere; `catchError` en `switchMap` correcto | — | verificado |
