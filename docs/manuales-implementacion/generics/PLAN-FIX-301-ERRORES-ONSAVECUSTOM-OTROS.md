# Plan — fix #301 (parte 2): suscripciones a `onSaveCustom` sin `error` fuera de RRHH

> Plan de trabajo del ciclo de 12 pasos. **Muere al cierre**: se borra en el PR final (paso 11).
> Rama: `fix/otros-errores-onsavecustom`, contra **`develop`** (@ `a9aedabc`, que ya trae el #305).
> Alcance acordado con el usuario: **las suscripciones sin `error` + comentarios desactualizados**,
> y **llevar `c1b8ae5a`** (ventana anti-ráfaga del aviso de transporte). Los avisos duplicados
> (error y éxito) van a #302, no acá.

## Por qué lleva `c1b8ae5a`

El #305 se mergeó a las 14:58 sobre `dac902f3`. El commit con la ventana anti-ráfaga (`c1b8ae5a`,
«el mismo aviso de transporte dentro de 3 s se muestra una sola vez») se pusheó a su rama a las
16:22, **después del merge**, y no llegó a `develop`. Sin él, un corte de red en un lote
(`ingresar-retiro-caja-mayor-dialog`, `list-productos-vencidos`, `add-movimiento-caja-virtual-dialog`,
`transferencia-caja-virtual-dialog`) encola un «Error de red» por llamada. Decisión del usuario:
que viaje en este PR como primer commit. La idea se planteaba apilar este PR sobre el #305; se
descartó porque el #305 ya estaba mergeado (hallazgo A1).

Los handlers de este PR quedan en `error: () => {}` porque `onSaveCustom` (desde el #305, ya en
`develop`) avisa los dos errores: el de negocio y el de transporte.

## Estado (paso 3)

17 services fuera de RRHH envuelven `onSaveCustom`; 39-42 llamadas (según cómo se cuenten los
`forkJoin`). Relevamiento por agente + chequeo estático (resuelve por tipo inyectado, `subscribe`
balanceado, `error:` o segundo callback posicional) + lectura de cada sitio:

- **17 suscripciones sin `error`** (tabla abajo). Ninguna deja una bandera trabada: o no tienen
  bandera, o `edit-transferencia` cierra el overlay con `finalize`.
- **~22 con `error` que repite el aviso** y **~24 con aviso de éxito propio** → #302.
- 2 métodos sin llamador (`PagarComprasService.onPagarLote`, `MaletinService.onIngresar`) — no se
  tocan. *(Corrección A2: `RetiroVerificacionService.onAnular` **sí** tiene llamador,
  `caja-virtual-dashboard.component.ts:669`, dentro del ternario que ya tiene `error`.)*
- 8 marcas «sin subscribe en la cadena» del chequeo son `forkJoin`/ternarios que **sí** tienen
  `error` (verificado a mano): `add-movimiento-caja-virtual-dialog`, `transferencia-caja-virtual-dialog`,
  `list-productos-vencidos`, `caja-virtual-dashboard` (×3), `maletin-tesoreria-dialog` (×2).

## Lista de cambios

Patrón: `subscribe({ next: <cuerpo idéntico>, error: () => {} })`, comentario una vez por archivo
(«El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.»).

| # | Archivo:línea | Llamada | Nota |
|---|---|---|---|
| 1 | `configuracion/actualizacion/edit-actualizacion.component.ts:93` | `onSaveForSucursales` | cierra el diálogo en `next` |
| 2 | `financiero/banco/banco.component.ts:76` | `onDelete` | |
| 3 | `financiero/caja-virtual/list-caja-virtual.component.ts:170` | `onDelete` | |
| 4 | `financiero/cuenta-bancaria/cuenta-bancaria.component.ts:113` | `onDelete` | |
| 5 | `financiero/moneda/moneda.component.ts:64` | `onDelete` | |
| 6 | `financiero/entrada-varia/list-entradas-varias-dialog.component.ts:76` | `onAnular` | |
| 7 | `financiero/gastos/adicionar-gasto-dialog.component.ts:637` | `onSaveVuelto` | anidado en otro `subscribe` |
| 8 | `financiero/retiro/verificacion/list-retiro-casos.component.ts:230` | `onAsignarCaso` | + corregir comentario 218-221 |
| 9 | `financiero/retiro/verificacion/list-retiro-casos.component.ts:251` | `onSoltarCaso` | |
| 10 | `financiero/venta-credito/list-venta-credito.component.ts:478` | `onCobrarVentaCredito` | `next` vacío; sin `untilDestroyed` (no se agrega: fuera de alcance) |
| 11 | `operaciones/devolucion/edit-devolucion.component.ts:436` | `onSaveDevolucionItem` | (la de `:687` ya tiene `error` posicional) |
| 12-15 | `operaciones/transferencia/edit-transferencia.component.ts:844, 1041, 1079, 1189` | `onSaveTransferenciaItem` | 844 y 1041 ya cierran overlay con `finalize` |
| 16 | `pdv/comercial/venta-touch/list-delivery.component.ts:293` | `onSaveDeliveryEstado` | **excepción** *(B1)*: el estado se muta **antes** de llamar (`:292`) sobre la misma referencia que está en `dataSource.data` (`:278` y `delivery-opciones-dialog` no clona). Se captura `const estadoAnterior = this.selectedDelivery.estado;` **antes** de mutar y el `error` restaura `this.selectedDelivery.estado = estadoAnterior` (al ser la misma referencia, la fila de la tabla vuelve también) |
| 17 | `productos/producto-proveedor/gestion-productos-proveedor-dialog.component.ts:179` | `saveProductoProveedor` | ya es `subscribe({ next })` |

Solo comentario (sin cambio de código):

- `financiero/retiro/verificacion/detalle-caso-dialog.component.ts:277-280` — dice que
  `onSaveCustom` «deja el observable colgado»; ya tiene `error`, se corrige el texto.
- `list-retiro-casos.component.ts:218-221` — ídem; la validación previa se mantiene (explica mejor
  el caso), solo cambia el porqué.

## Fases

| Fase | Contenido | Commit | Test |
|---|---|---|---|
| 0 | Este plan | `docs(generics): plan de la parte 2 del fix de errores de onSaveCustom` | — |
| 1 | Tesorería / financiero (#2-#10) + comentarios | `fix(financiero): manejar el error de onSaveCustom en tesoreria` | chequeo estático |
| 2 | Operaciones, PDV, productos, configuración (#1, #11-#17) | `fix(operaciones): manejar el error de onSaveCustom fuera de rrhh` | chequeo estático + test de `list-delivery` |
| 3 | Cierre: borrar este plan | `docs(generics): retirar el plan de la parte 2 del fix de errores de onSaveCustom` | — |

Build AOT leído del log antes de cada push; `git status` sin archivos ajenos.

### Tests

- **Chequeo estático** (`check301all.mjs fuera`): hoy 24 marcas (16 reales + 8 falsas de
  `forkJoin`/ternario) + `gestion-productos-proveedor` (no la veía por el nombre `save…`). Verde =
  solo quedan las 8 falsas, listadas por nombre.
- **`list-delivery`**: instanciar el componente real, llamar el camino «para-entrega» con un
  service fake que falla → `selectedDelivery.estado` vuelve al anterior y no hay error no capturado.
  Rojo contra la rama base.

## Datos nuevos

N/A.

## Persistencia, backend, replicación

N/A para central y filial: solo manejo de errores en el cliente.

## Riesgos conocidos antes de auditar

- `list-delivery` es flujo de POS (venta-touch): el cambio de estado local sin revertir hoy deja la
  fila mostrando «PARA_ENTREGA» aunque no se guardó; el fix lo revierte.
- `edit-transferencia` es muy grande (6 puntos que llaman `onSaveTransferenciaItem`); se tocan solo
  las 4 suscripciones, sin mover lógica.
- El PR lleva `c1b8ae5a` (cambio en `GenericCrudService.onSaveCustom`, alcance de toda la app) junto
  con los llamadores: en la descripción del PR tiene que quedar explícito que no es solo tesorería.
- **Preexistente, no se toca** *(B2)*: `edit-transferencia.component.ts:838-840` pone
  `lotesPendientes`/`presentacionDeLotesPendientes` en `null` **antes** de llamar
  `onSaveTransferenciaItem` (`:844`); si falla, la asignación de lotes se pierde y hay que rehacerla.
  El `error` vacío no lo revierte. Los otros 3 sitios (1041, 1079, 1189) guardan copias locales:
  nada que revertir.
- **Preexistente, backend** *(B3)*: guardar un ítem de transferencia, un ítem de devolución o el
  vuelto de un gasto no tiene guarda de idempotencia: reintentar tras una respuesta perdida duplica
  stock / vuelto. Sin handler hoy la UI ya queda «lista para reintentar»; con el `error` vacío queda
  igual. Este PR no lo cambia ni para bien ni para mal.

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Verificación | Qué se hizo |
|---|---|---|---|---|
| B1 | B · alta | `list-delivery`: el plan no decía de dónde sale el estado anterior; `selectedDelivery` es la referencia compartida con `dataSource.data` | `list-delivery.component.ts:278,292` | **Aplicado**: capturar `estadoAnterior` antes de mutar (fila 16) |
| B2 | B · media, preexistente | `edit-transferencia:838-840` pierde los lotes pendientes si el guardado falla | confirmado | Anotado como deuda, fuera de alcance |
| B3 | B · media/alta, preexistente | Transferencia/devolución/vuelto sin guarda de idempotencia en el central | según el auditor (central) | Anotado; no lo cambia este PR |
| B4 | B · info | Los `onDelete` nunca reciben `next(false)`: la rama `else` es código muerto antes y después | `onSaveCustom` solo emite `error` | Sin cambio |
| A1 | A · media-alta | «El #305 ya está mergeado y su rama no se borró: un PR apilado no se reapunta solo» | se verifica el estado del #305 y si `c1b8ae5a` llegó a `develop` | ver «Base de la rama» (se decide con el usuario) |
| A2 | A · media | `RetiroVerificacionService.onAnular` sí tiene llamador | `caja-virtual-dashboard.component.ts:669` | Corregido en «Estado» |
| A3 | A · media | «Restaurar el estado de delivery sin `updateDataSource` no repinta la fila» | Contradice B1: la mutación in-place de `:292` ya se pinta antes de la respuesta (misma referencia, CD por defecto) | Sin `updateDataSource`; el test verifica también la fila de `dataSource.data` |
| A4 | A · info | Los 4 `onDelete` son wrappers de `onSaveCustom`; `GenericCrudService.onDelete` (distinto) nunca emite `error` | leído | Fuera de #301/#302; deuda anotada acá |
| B3b | B · pendiente | `onCobrarVentaCredito` usa la mutation `cobrarVentaCredito` (`venta-credito.service.ts:65`); no se verificó si el central la protege | — | **No verificado**, anotado |
| B5 | B | «El test de `list-delivery` necesita TestBed/Karma» | **Falso**: el test usa esbuild + node con `Object.create(ListDeliveryComponent.prototype)`, sin DI, y ya corrió en rojo (4 fallos) | Sin cambio |

## Prueba de runtime (paso 9)

Local (central 8081 `dev` + `ng serve -c web`, login del usuario):
- **Negocio**: una acción de tesorería que el backend rechace sin escribir (p. ej. eliminar una
  moneda o banco en uso). Esperado: un solo aviso, sin excepción no capturada.
- **Red**: con el parche de XHR, disparar una de las acciones. Esperado: un solo «Error de red».
- **`list-delivery`** si hay datos: pasar un delivery a «para entrega» con la red cortada →
  el estado de la fila no cambia.

## Qué queda sin verificar

- Avisos duplicados de error/éxito: #302.
- Karma y e2e: no corren en este repo.
