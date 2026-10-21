# Plan — modificar o rechazar un ítem ya cargado desconfirma antes de guardar (issue #569)

Rama: `fix/transferencia-modificar-rechazar-desconfirma` (desde `develop`). Pieza: desktop.

## Qué pasa hoy

En la edición de una transferencia, «Modificar cantidad», «Modificar vencimiento» y «Rechazar ítem»
pasan por `onModificarItem` (`edit-transferencia.component.ts`): abre `ModificarItemDialogComponent`,
que arma los campos de la etapa en `onAceptar`, y guarda con `saveTransferenciaItem`.

`saveTransferenciaItem` es un PATCH (`TransferenciaItemGraphQL.preservarCamposAusentes` en el central):
un campo en null es «no lo toques». Entonces:

- **Modificar cantidad o vencimiento sobre un ítem rechazado**: escribe la cantidad y el motivo de
  rechazo queda. El ítem queda con cantidad y rechazo a la vez.
- **Rechazar un ítem ya confirmado o modificado**: el diálogo manda cantidad, vencimiento y motivo de
  modificación en null para limpiarlos, el PATCH no los toca. Queda rechazado y con la cantidad vieja.

Los tres botones están en las tres etapas (preparación: los tres; transporte y recepción: «Rechazar»).

## Qué se hace

1. `transferencia-item-confirmacion.ts`: función pura nueva `tieneEtapaCargada(item, etapa)`: `true`
   si el ítem tiene cantidad, vencimiento o motivo de rechazo en **esa** etapa (la misma condición con
   la que el menú muestra «Desconfirmar»). En una etapa que no verifica ítems, `false`.
2. `onModificarItem`: la etapa y el id de la transferencia se leen **una sola vez** antes de abrir el
   diálogo. Al aceptar, si `tieneEtapaCargada(item, etapa)` (sobre la fila de la grilla):
   `onDesconfirmarTransferenciaItem(item.id, etapa)` y, en su `switchMap`, el save de siempre (armado
   adentro: si el desconfirmar falla, no sale). Si no, el save solo, como hoy. Es lo mismo que haría el
   usuario con «Desconfirmar» y después el botón.
3. `ModificarItemDialogComponent.onAceptar`, en las tres etapas (lo marcaron los dos auditores):
   - **Modificar cantidad / vencimiento** pone en null el motivo de rechazo de la etapa en la copia. La
     copia sale de la fila (`Object.assign`) y `toInput()` lo mandaba: después de desconfirmar, el save
     volvía a escribir el rechazo.
   - **Rechazar** ya no manda cantidad y vencimiento en null: copia cantidad, presentación y vencimiento
     de la etapa anterior (`aplicarConfirmacion`), como el avance de etapa y la PWA
     (`inputDeVerificacion`). El central arma el movimiento de stock con `cantidad * presentacion` sin
     guarda (`MovimientoStockService.createMovimientoFromTransferenciaItem`): con la etapa recién
     vaciada y cantidad null daba NPE. Hoy no se veía porque el avance precarga la cantidad y el PATCH
     la conservaba. Un ítem rechazado queda como lo deja el avance: cantidad heredada + motivo.
4. Error, con el patrón de `onDesconfirm` (#501): rechazo del servidor → el genérico ya mostró el
   motivo; si se desconfirmó, se relee ya. Sin respuesta → aviso «No se pudo confirmar si se guardó el
   ítem…» y relectura a los `RECARGA_TRAS_CORTE_MS`, solo si sigue abierta la misma transferencia.

**No se toca**: el backend, la PWA, el menú (#570 cambia solo la línea de «Confirmar» de preparación
en el `.html`; este cambio no toca el `.html`).

**Decisión**: se desconfirma ante cualquier ítem cargado, no con la regla más fina de la PWA
(`requiereDesconfirmarAntes`: solo si cambia el motivo). Una sola regla, igual a la del menú; el costo
es una mutation más sobre un ítem solo confirmado.

## Fases

| Fase | Commit | Tests |
|---|---|---|
| 0 | `docs(transferencias): plan para desconfirmar antes de modificar o rechazar` | — |
| 1 | `fix(transferencias): modificar o rechazar un ítem ya cargado desconfirma antes de guardar` | `transferencia-item-confirmacion.spec.ts` |

Tests (spec puro): `tieneEtapaCargada` por etapa con cantidad, con vencimiento, con rechazo y vacío;
datos de **otra** etapa no cuentan; etapa que no verifica ítems → `false`. Karma con tsconfig temporal
acotado al spec (hay specs rotos en el repo). Revertir la función y ver que fallen.

El cableado de `onModificarItem` no tiene test automático (spec del componente roto): lo cubre la
prueba de runtime, **bloqueante**.

Gate: `npm run check` (AOT) al final.

## Datos, contrato, otras piezas

- Sin cambios de GraphQL ni backend. `N/A para central/filial` porque usa dos mutations que ya existen
  (las dos están en `master` del central) y la PWA ya las usa en este orden.
- `desconfirmarTransferenciaItem` desactiva el movimiento de stock de la etapa y el save lo vuelve a
  activar o lo deja inactivo si queda rechazado.
- PWA: `N/A`, ya desconfirma antes. frc-mobile: fuera de alcance (en mantenimiento).

## Riesgos

- **Desconfirmar OK y save falla**: la etapa queda vacía en el central. Mitigación: relectura (punto 4);
  la fila queda en «Falta verificar» y se vuelve a cargar.
- **Etapa cerrada mientras el diálogo estaba abierto**: el central rechaza el desconfirmar (#471) y el
  save no sale.
- **Dos usuarios a la vez**: entre el desconfirmar y el save otro puede tocar la misma etapa; cada
  mutation toma su lock por separado y gana el último. Repetir es seguro (desconfirmar es idempotente,
  el save es un PATCH).
- **Ítem sin datos de la etapa anterior** (#564/#567): al rechazar, `aplicarConfirmacion` no copia nada
  y queda la cantidad que ya tenía la fila; si la fila no tenía nada cargado no se desconfirma y el
  PATCH conserva la base, como hoy. Si la base tampoco tiene cantidad en la etapa, el save ya falla
  hoy en el central (cantidad × presentación); no cambia con este fix y queda para #564/#567.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Decisión |
|---|---|---|
| A y B | Modificar sobre un rechazado: la copia del diálogo reenvía el motivo de rechazo y el save lo reescribe tras desconfirmar | Verificado en el código. Punto 3: el diálogo lo pone en null |
| A y B | Rechazar tras desconfirmar manda cantidad null y el central da NPE al armar el movimiento | Verificado en `MovimientoStockService` y en el avance (precarga). Punto 3: rechazar hereda de la etapa anterior, como la PWA |
| A y B | «Es lo que hace la PWA» era impreciso: la PWA desconfirma solo si cambia el motivo | Corregido; se mantiene la regla simple (Decisión) |
| B | El error no seguía el patrón de `onDesconfirm` (aviso de corte, relectura demorada, mismo id) | Punto 4 |
| B | El spec de la función pura no cubre el cableado | Prueba de runtime bloqueante, con la base consultada en cada paso |
| B | Dos usuarios a la vez | Riesgos |
| A | Respuesta del save en la grilla | Sin cambio: la selección del save trae producto y presentación, se usaba igual antes |
| A | Central viejo sin la mutation | Descartado: está en `master` |

## Auditoría del diff (paso 8)

Fijo 1 y Fijo 2: `N/A para desktop` porque el diff no toca resolvers, `.graphqls` ni migraciones.
Fijo 3: `desconfirmarTransferenciaItem` está en `master`, `release/beta` y `develop` del central, y el
desktop de stable ya la usa. Revisión de corrección: sin hallazgos nuevos sobre los casos cubiertos;
los dos que marcó (ítem sin datos en la etapa anterior al rechazar o modificar) ya fallan antes del
cambio y quedan anotados en Riesgos.

## Prueba de runtime

Desktop `web-production` de la rama en `127.0.0.1:4201`, central de `develop` (e9298928) en `:8081`
con perfil `dev`, usuario MR. Transferencia 58236, clon de la 51251 (13 → 18, tres ítems sin lote).
Mutations registradas en el navegador; base consultada después de cada paso.

## Resultado (2026-10-21)

**Tests.** `transferencia-item-confirmacion.spec.ts` (Karma, tsconfig temporal acotado): 18 de 18, 3
nuevos de `tieneEtapaCargada`. `npm run check`: OK.

**Runtime** (todo en la base local):

| # | Etapa | Acción | Mutations | Base |
|---|---|---|---|---|
| 1 | Preparación | Rechazar un ítem verificado | desconfirmar → save | rechazo, cantidad heredada 5, salida inactiva |
| 2 | Preparación | Modificar cantidad (3) sobre el rechazado | desconfirmar → save | cantidad 3, CANTIDAD_INCORRECTA, **sin rechazo**, salida −3 activa |
| 3 | Preparación | Rechazar el modificado | desconfirmar → save | rechazo, cantidad vuelve a 5, sin motivo de modificación, salida inactiva |
| 4 | Preparación | Modificar vencimiento sobre el rechazado | desconfirmar → save | vencimiento nuevo, VENCIMIENTO_INCORRECTO, sin rechazo, salida activa |
| 5 | Preparación | «Desconfirmar» a mano y después Rechazar | **solo save** | rechazo con cantidad heredada (antes iba null) |
| 6 | Preparación | Etapa cerrada por SQL con el diálogo abierto | desconfirmar rechazado, save no sale | base intacta, motivo del central en pantalla, relectura |
| 7 | Transporte | Rechazar un ítem verificado | desconfirmar → save | rechazo de transporte, cantidad heredada 10, salida inactiva |
| 8 | Recepción | Rechazar un ítem verificado | desconfirmar → save | rechazo de recepción, entrada en destino inactiva |
| 9 | Recepción | Save cortado en el navegador tras desconfirmar | desconfirmar → save sin respuesta | aviso «No se pudo confirmar si se guardó el ítem…» y consulta nueva a los ~5 s |

«Actualizar» después de los pasos de preparación: la grilla coincide con la base. Antes del cambio, el
paso 2 dejaba cantidad y rechazo juntos y el 3 dejaba el rechazo con la cantidad modificada.
