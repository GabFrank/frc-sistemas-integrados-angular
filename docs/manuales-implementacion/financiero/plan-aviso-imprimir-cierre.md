# Plan — aviso de éxito al imprimir el cierre de caja

Rama: `fix/caja-aviso-imprimir-cierre` (desde `develop`). Pieza: desktop. Central, filial y PWA: N/A,
el cambio es solo de aviso en la UI y no cambia ningún contrato.

## Problema

«Imprimir Cierre» del diálogo de caja (Financiero → Cajas → abrir una caja) imprime pero no avisa
nada. Las otras reimpresiones avisan «Reimpreso con éxito» (`ultimas-ventas-dialog`, facturas).
`adicionar-caja-dialog.component.ts` `goTo("imprimir")` tiene `// TODO: Implement success notification`.

Las fallas ya avisan por su cuenta, no hace falta tocarlas:

- por servidor: el error GraphQL lo muestra el genérico (el central lanza «No se pudo imprimir el
  balance») y la falta de respuesta, `avisarSinRespuesta` (completa sin emitir);
- «Imprimir desde esta PC» (`imprimirTicketCentral`): `avisarFallo` y emite `false`.

Éxito = la respuesta no es nula ni `false` (`PdvCaja` por servidor, `true` desde esta PC).

## Fase única

`goTo("imprimir")`: en `next`, si la respuesta es verdadera,
`notificacionBar.openSucess("Cierre impreso con éxito")`.

El texto es «Cierre impreso» y no «Reimpreso» porque el mismo `goTo("imprimir")` corre solo al
guardar el conteo de cierre (`getConteoMonedaCierre`): ahí es la primera impresión.

Datos nuevos: ninguno.

## Fuera de alcance

- **QR que sale como texto** (`…-PDVCAJA-7569-1-…-null-null1Q0`): la PRT80 no entiende la función
  165 del QR. Ya está arreglado en central #642 y filial #260 (mergeados a `develop` el 14/11), que
  todavía no llegaron a `release/beta` ni a `master`. Se arregla con el release, no con código.
- ~~`ultimas-cajas-dialog`~~: Franco lo pidió el 17/11 y entró en la fase. Va contra la filial
  (`servidor=false`), y la filial lanza `GraphQLException` si no imprime.

## Pruebas

- Paso 9: `npm run check` (AOT). El desktop no tiene batería en el CI; sin spec nuevo (es una línea).
- Por pantalla, desktop web contra central local: «Imprimir Cierre» de una caja cerrada.
  - Con impresora válida: sale el aviso verde.
  - Con impresora inexistente: sale solo el aviso de error, sin el verde.
  - Impresión a una cola `zz_` de captura, para no gastar papel en `frc-ticket`.

## Auditoría del plan (paso 5)

- **Eje A (contrato).** Dijo que el central ignora el `Boolean` de `printBalance` y devuelve la caja
  aunque no imprima: falso aviso de éxito. **Descartado.** Leyó el checkout local del central, que
  está en otra rama. `PdvCajaService.imprimirBalance` lanza «No se pudo imprimir el balance» en
  `develop`, `release/beta` y `master` (`06b6f689`, 29/10). Igual queda como prueba obligatoria,
  con una impresora inexistente.
  Llamadores: `goTo("imprimir")` solo lo usan el botón y el cierre automático, que también corre
  en venta-touch (filial, `servidor=false`). Ahí el filial también lanza si no imprime.
  Datos parciales con `errorPolicy: 'all'`: borde raro, se acepta.
- **Eje B (estado).** El cierre ya está guardado antes de imprimir, y el cambio no toca `isCierre`
  ni `selectedCaja`. Los avisos se encolan (`app.component.ts`), así que el verde no tapa al de
  diferencia de maletín. **Queda fuera:** caja inexistente o proxy a la filial sin IP devuelven
  `null` sin error y no avisan nada. Ya pasaba antes; el cambio no lo empeora.

## Auditoría del diff (paso 8)

Fijo 1 (autorización), Fijo 2 (esquema) y Fijo 3 (contrato): N/A para el desktop. El diff son dos
`next` de subscribe que muestran un snackbar; no toca resolvers, migraciones, consultas GraphQL ni
modelos. Ningún condicional aplica: no toca release ni replicación.

## Resultado de las pruebas (17/11)

Desktop web (`ng serve -c web`) contra el alpha de mauro: central :8083 (con #642) y filial :8080.
Impresora: cola `zz_cierre` → `socket://127.0.0.1:9101`, capturada con `nc`. No salió papel.

| Pantalla | Impresora | Aviso |
|---|---|---|
| Cajas › caja 3019 › Imprimir Cierre (central) | `zz_cierre` | «Cierre impreso con éxito» |
| ídem | `zz_noexiste` | solo «Ups! Algo salió mal: No se pudo imprimir el balance» |
| PDV › Últimas cajas › 3019 › Imprimir balance (filial) | `zz_cierre` | «Cierre impreso con éxito» |
| ídem | `zz_noexiste` | solo el error, sin verde |

| Cajas › 3021 › Conteo Cierre › Cerrar Caja (imprime solo) | `zz_cierre` | «Cierre impreso con éxito» |

La 3021 se cerró con Gs 100.000 y después se volvió a abrir con «Reabrir caja» (motivo «PRUEBA AVISO
IMPRIMIR CIERRE»). Quedó como antes en la filial y en el central: activa, apertura 15045, sin cierre.

En «Últimas cajas» se puso `sucursalActual.id = 2` en memoria. La sesión web está en modo central
(sucursal 0); la PC de una sucursal real trae la suya.

QR capturado del central alpha: `GS ( k` con fn 67 (tamaño), 69 (corrección), 80 (datos
`frc-2-PDVCAJA-3019-2-IngresarRetiroCajaMayor-null-null`) y 81 (imprimir). **No hay fn 65
(modelo)**: el arreglo de #642 está en `develop`. El ticket de Franco
(`…-null-null1Q0`) sale de un central sin ese arreglo.

## Sin verificar

- El modo «Imprimir desde esta PC» (solo Electron): se lee por código que devuelve `true`/`false`.
