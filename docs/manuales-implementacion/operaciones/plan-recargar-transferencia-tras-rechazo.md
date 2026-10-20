# Plan — recargar la transferencia cuando el central rechaza el avance de etapa (#558)

Rama: `fix/transferencia-recargar-tras-rechazo` (desde `develop`). Una sola pieza: desktop.

## Problema

Cuando el central rechaza un avance de etapa, el desktop muestra el motivo pero no recarga la
transferencia: la pantalla queda en la etapa vieja y el mismo botón da el mismo rechazo.

Caminos afectados (son los únicos llamadores de `onAvanzarEtapa` y `onVerificarParaTransporte`):

| Lugar | Hoy ante un rechazo |
|---|---|
| `edit-transferencia.component.ts` · `onAvanzarEtapa` | `return`, sin recargar |
| `verificar-transporte-dialog` · `verificar()` (con chofer) | queda abierto; la pantalla de atrás no recarga |
| `verificar-transporte-dialog` · `onContinuarSinChofer()` | igual |

Los rechazos por etapa del central dicen todos «esta en etapa» en el texto: `validarAvanceDeEtapa`,
el control de `verificarParaTransporte` y el nuevo «ya esta en etapa» de la rama del central
`fix/transferencia-no-repetir-etapa` (#450 del central). No hay un código de error.

## Fase 1 — recarga tras rechazo

1. `onAvanzarEtapa`: en un rechazo, `cargarDatos(id)` enseguida (el aviso ya lo da el genérico). El
   camino sin respuesta (#501) no cambia.
2. Diálogo, `verificar()` y `onContinuarSinChofer()` con la misma regla: un rechazo por etapa
   (mensaje con «esta en etapa») cierra con `true`. Los demás (chofer sin persona, vehículo o
   acompañante inexistente, cualquier otro) dejan el diálogo abierto para corregirlos, pero marcan
   que al cancelar hay que recargar: si el texto del central cambia, el usuario igual vuelve a una
   pantalla al día.

Sin cambios de GraphQL, modelo, persistencia ni roles.

### Tabla de datos nuevos

| Dato | Lo escribe | Lo lee |
|---|---|---|
| `recargarAlCerrar` (estado del diálogo) | `verificar()` al recibir un rechazo | `onCancel()` |

## Tests

Paso 9: el desktop no tiene batería en ningún gate. Gate: `npm run check`. Prueba de runtime por
pantalla, en local (central propio + desktop web):

- Avanzar etapa rechazado: dos pestañas con la misma transferencia; avanzar en una y repetir en la
  otra → aviso y la pantalla pasa a la etapa nueva.
- Verificar con chofer rechazado por etapa: igual, con el diálogo → se cierra y recarga.
- Continuar sin chofer rechazado: igual → se cierra y recarga.
- Verificar con chofer rechazado por otra causa (chofer sin persona, forzado) → queda abierto;
  al cancelar recarga.
- Continuar sin chofer rechazado por otra causa → queda abierto; al cancelar recarga.
- Rechazo y después reintento exitoso en el diálogo → cierra y recarga una vez.
- Tocar dos veces seguidas el botón rechazado en la pantalla → la grilla queda coherente con la etapa.
- Éxito en los tres caminos: sin cambios.

Para el mensaje «ya esta en etapa» hace falta el central de la rama `fix/transferencia-no-repetir-etapa`;
con `develop` del central, repetir la etapa no se rechaza (es justo el bug #450), pero sí rechaza
volver a una etapa anterior y verificar fuera de `PREPARACION_MERCADERIA_CONCLUIDA`.

## Sin verificar

- El texto del rechazo puede cambiar en el central; el fallback de recargar al cancelar cubre el
  diálogo, y `onAvanzarEtapa` recarga ante cualquier rechazo.
- Desconfirmar ítem tiene el mismo patrón (`return` sin recargar); queda fuera de esta issue.
- La recarga tras un rechazo, igual que la del éxito, vuelve la grilla a la página 1 y descarta lo
  tipeado sin guardar en la cabecera. No hay datos guardados que se pierdan.
- `cargarDatos` no cancela una recarga anterior: con dos recargas cruzadas gana la respuesta más
  lenta. Preexistente; se mira en la prueba de doble clic.
- La PWA (`transferencia-detalle.page.ts`) y la app Android tampoco recargan ante un rechazo; fuera
  de alcance.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| B | Mayor: «Continuar sin chofer» cerraba ante cualquier rechazo y perdía lo cargado | misma regla que `verificar()` |
| A | Mayor: reconocer el rechazo por texto es frágil; propone solo recargar al cancelar | se mantiene el cierre por texto (lo pide la issue); la recarga al cancelar cubre cualquier rechazo |
| A | El desktop nuevo contra el central sin #450 | igual que hoy: repetir etapa no se rechaza |
| A, B | Recarga descarta página, filtros y tipeo sin guardar; carrera entre recargas | anotado arriba; mismo comportamiento que el éxito |
