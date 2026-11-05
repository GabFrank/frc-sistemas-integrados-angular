# Plan — avisar cuando la reimpresión de una factura falla (etapa 3 de los pendientes del central #534)

Rama `fix/impresion-avisar-reimpresion-fallida` (desde `develop`). Pieza: **desktop**. Sin cambios de API.

## Problema

«Reimprimir» factura (lista de facturas, y el diálogo de factura después de guardar) llama a `reimprimirFacturaLegal`.
Central y filial devuelven `false` **solo** cuando la impresión falló (el `catch` de los dos), y desde central#544
también cuando el envío del ticket falla al cerrar. `FacturaLegalService.onReimprimirFactura` solo mira `if (res)`:
con `false` no muestra nada, y el cajero no sabe que no salió.

## Cambio (una fase)

`onReimprimirFactura`:
- con `res === false`: `openWarn("La factura está guardada, pero no se pudo reimprimir: revisá la impresora y
  reimprimila desde la lista de facturas.", 8)`. Dice que la factura quedó guardada porque el diálogo de factura se
  cierra antes de que llegue la respuesta y emitirla de nuevo consumiría otro número de timbrado. Un `false` también
  sale si la factura no existe; en el diálogo no pasa (se espera a que llegue por réplica antes de reimprimir).
- la consulta pasa al patrón de impresión de retiro y gasto (`PROPAGAR_ERROR_DE_RED`,
  `impresionPos.contextoImpresionServidor`, `avisarSinRespuesta("la reimpresión de la factura")`): plazo de 60 s en
  vez de 300 s con el «Buscando…» bloqueando, y sin respuesta avisa «No se pudo confirmar… revisá la impresora antes
  de reintentar» en vez de «No se pudo consultar» y un error sin manejar en la consola.
- un error GraphQL lo sigue mostrando el genérico, que emite `null`: no se avisa dos veces. Se compara con
  `=== false`, no con `!res`, para no avisar también en ese caso.

`onReimprimirFacturaTicket` en modo «Imprimir desde esta PC» va por `ticketEscpos` y avisa por su cuenta: no cambia.

## Fuera de alcance (va después de la etapa del filial)

«Últimas ventas» trata `res != null` como éxito a propósito: el filial devuelve `false` al reimprimir una venta con
factura aunque imprima (`VentaGraphQL.reimprimirVenta` del filial ignora el resultado de la factura). Hasta corregir eso
en el filial, mirar `false` ahí daría falsos avisos.

El filial todavía no avisa una falla al cerrar el envío (no tiene el arreglo del central#544): ahí un ticket chico que
falla sigue volviendo `true`. Va en la etapa del filial.

## Tests

`factura-legal.service.spec.ts` (ya existe): tres casos de `onReimprimirFactura` con `onCustomQuery` simulado —
`false` ⇒ aviso, `true` ⇒ «Guardado con éxito», `null` ⇒ nada. Karma no corre en CI; se corre ese spec a mano
(`DISPLAY=:0`, tsconfig temporal acotado). Gate: `npm run check`. Prueba por pantalla: desktop web contra un central
local con el código de `develop` en un puerto propio, cola CUPS que rechaza ⇒ aviso; que acepta ⇒ «Guardado con
éxito».

### Resultado (29/10)

- Spec: los 10 de `factura-legal.service.spec.ts` pasan (Karma con `DISPLAY=:0` y tsconfig acotado); con el servicio
  anterior falla el caso nuevo de `false`.
- `npm run check`: sin errores.
- Pantalla, desktop web de esta rama contra un central local en el 8093 (Reportes y Análisis → Facturas → Reimprimir
  la factura 452581): con la cola `zz_rechaza`, aviso «La factura está guardada, pero no se pudo reimprimir: revisá
  la impresora y reimprimila desde la lista de facturas.»; con `zz_ok`, «Guardado con éxito» y el trabajo en la
  cola. El camino del diálogo de alta (reimprimir después de emitir) usa el mismo método y el mismo texto; no se
  emitió una factura nueva para probarlo.

## Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| El aviso no decía que la factura quedó guardada: riesgo de emitirla dos veces desde el diálogo | B | el texto lo dice |
| Sin manejo de red: «Buscando…» hasta 300 s y error sin manejar | B | patrón de retiro/gasto |
| El N/A de tests no era cierto: hay spec del servicio | B | tres casos nuevos |
| Ningún caso donde `false` signifique «imprimió» | A | verificado en central y filial |
| Factura inexistente también da `false` | A | el texto no culpa solo a la impresora en el diálogo; en la lista la factura existe |
| El filial no avisa la falla al cerrar | A | anotado; etapa del filial |

## Riesgo y vuelta atrás

- **Riesgo:** bajo. Un aviso más en un caso que hoy queda mudo.
- **Vuelta atrás:** revertir el commit.
