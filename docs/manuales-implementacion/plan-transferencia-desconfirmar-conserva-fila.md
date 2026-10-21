# Plan — des-verificar un ítem sin perder la fila (issue #567)

Rama: `fix/transferencia-desconfirmar-conserva-fila` (desde `develop`). Pieza: desktop.

## Qué pasa hoy

`onDesconfirm` (`edit-transferencia.component.ts`) reemplaza la fila de la grilla con la respuesta de
`desconfirmarTransferenciaItem`: `updateDataSourceWithId` hace `arr[index] = value`. La mutation solo
pide los grupos de preparación, transporte y recepción (`presentacion*` como `{id}`), sin
`presentacionPreTransferencia`/producto ni `cantidadPreTransferencia`, y llega como objeto plano, no
como `TransferenciaItem`.

Resultado: la fila muestra el producto en «-» y un «Confirmar» sobre ella no sale. `onConfirm` llama
primero a `puedeConfirmar(item, etapa)`, que en preparación mira `cantidadPreTransferencia` (ya no
está): avisa «no tiene datos de pre-transferencia» y vuelve sin request. En transporte/recepción la
copia se arma con presentaciones `{id}` y `toInput()` no existe en el objeto plano. Hasta «Actualizar».

## Qué se hace

1. `transferencia-item-confirmacion.ts`: función pura nueva `aplicarDesconfirmacion(item, etapa)`, la
   simétrica de `aplicarConfirmacion`. Vacía en `item` los campos de **esa** etapa (cantidad,
   presentación, vencimiento, motivo de modificación, motivo de rechazo), los mismos que vacía el
   backend (`TransferenciaItemGraphQL.desconfirmarTransferenciaItem`). Otras etapas: no toca nada.
2. `onDesconfirm`: la etapa se captura **una sola vez** (`const etapa = this.selectedTransferencia?.etapa`)
   y se usa para el request y para limpiar, igual que `onConfirm`: si `selectedTransferencia` cambia
   mientras vuelve la respuesta, la grilla vacía la misma etapa que vació el backend. Si la mutation
   responde, la fila nueva es `aplicarDesconfirmacion(Object.assign(new TransferenciaItem(), item), etapa)`
   — una copia de la fila actual con la etapa vaciada —, no la respuesta, y se ubica por `item.id`.
   Conserva producto, cantidad pedida, las otras etapas, los campos de la vista (`esProductoConLote`,
   alertas, que `actualizarAlertasPaginaActual` recalcula enseguida) y los métodos de la clase. La
   respuesta se usa solo como señal de éxito; el camino de error (#501) no cambia.
3. `aplicarDesconfirmacion` solo asigna `null` a campos de primer nivel de la copia: no toca objetos
   anidados (`presentacion*`, `transferencia`, `lotesAsignados`), que la copia comparte con la fila
   vieja. No mezclar la respuesta encima: pisaría las presentaciones y el usuario con `{id}` pelado.

**No se toca**: la mutation ni su selección (sigue chica), `updateDataSourceWithId`, el backend, la
PWA.

## Fases

| Fase | Commit | Tests |
|---|---|---|
| 0 | `docs(transferencia): plan para des-verificar sin perder la fila` | — |
| 1 | `fix(transferencia): des-verificar un item conserva la fila y se puede volver a confirmar` | `transferencia-item-confirmacion.spec.ts` |

Tests (spec puro, sin Angular): por cada etapa (preparación, transporte, recepción) vacía solo sus
campos y deja intactos pre-transferencia, las otras etapas y las observaciones; en una etapa que no
verifica ítems no toca nada; una fila plana (sin métodos, como las de la grilla) funciona; trabajar
sobre `Object.assign({}, original)` no modifica el original; después de `aplicarDesconfirmacion`,
`puedeConfirmar` sigue siendo `true` (el escenario del bug). Karma con tsconfig temporal acotado a
este spec (hay specs rotos en el repo).

El cableado de `onDesconfirm` no tiene test automático (el spec del componente es el de plantilla y
está roto): lo cubre la prueba de runtime, que es **bloqueante**.

Gate: `npm run check` (AOT) al final.

## Datos, contrato, otras piezas

- Sin cambios de GraphQL ni de backend: `N/A para central/filial` porque solo cambia qué se pone en
  la grilla después de una respuesta exitosa.
- PWA: `N/A` — recarga los ítems tras des-verificar (`transferencia-detalle.page.ts`).
- frc-mobile: no usa la mutation.

## Riesgos

- **Grilla desalineada con la base** si el backend vaciara campos distintos de los que vacía la
  función. Mitigación: misma lista que el backend, escrita en el comentario; «Actualizar» lo corrige.
- **Rechazo del backend** (etapa ya cerrada, #470/#472, o etapa que no verifica ítems): va por el
  `error`, la fila no cambia. Igual que hoy.
- **Otras etapas desde la copia local**: hoy la respuesta traía los tres grupos y reflejaba cambios
  de otro usuario; la copia muestra lo que ya tenía la fila. Igual que el resto de la grilla hasta
  «Actualizar».
- **Alertas**: la copia arrastra `alertaVencido`/`alertaAveriado` hasta que vuelve
  `actualizarAlertasPaginaActual`; si esa consulta falla queda el aviso de siempre.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Decisión |
|---|---|---|
| A | Único llamador: `onDesconfirm` (tres botones); PWA no depende de la grilla; frc-mobile no usa la mutation; mismos 5 campos que el backend | Confirma el plan |
| A | No mezclar la respuesta encima (pisaría `presentacion*`/`usuario` con `{id}`) | Escrito en el punto 3 |
| A | Alertas y otras etapas quedan de la copia local | Riesgos |
| A | Falta caso con fila plana | Spec |
| B | La etapa debe ser una sola `const` para request y limpieza | Punto 2 |
| B | Copia superficial: no mutar anidados ni el original | Punto 3 + spec |
| B | El spec no prueba el cableado del componente | Prueba de runtime bloqueante |
| B | Ubicar la fila por `item.id`, no `res.id` | Punto 2 |

## Prueba de runtime

Desktop web (`web-production` en 4201) contra un central local, transferencia clonada:
1. Preparación: «Desconfirmar» → la fila conserva el producto y la cantidad pedida, «Falta verificar»;
   «Confirmar» sin «Actualizar» → sale el request y vuelve a «Verificado» (base: preparado igual al
   pedido, movimiento activo).
2. Igual en transporte y en recepción.
3. «Actualizar» después de cada paso: la grilla coincide con lo que había.
4. Borrar los datos de prueba.
