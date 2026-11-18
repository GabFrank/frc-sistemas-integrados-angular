# Plan — separador de miles en el monto de «Emitir cheque»

Rama: `feat/cheque-monto-separador-miles` (desde `develop`). Pieza: **desktop**, una sola.

## Problema

En `emitir-cheque-dialog` el monto es `<input type="number">`: `33221202` se ve sin puntos y cuesta
leerlo (33.221.202 Gs.). Un cheque mal cargado no se deshace fácil.

## Cambio (una fase)

`src/app/modules/financiero/cheque/emitir-cheque-dialog/`:

- HTML: el input pasa a `type="text" currencyMask [options]="currencyOpts"` (directiva de
  `ngx-currency`, ya exportada por `SharedModule`, que importa `FinancieroModule`). Mismo patrón que
  `cuenta-bancaria/ajustar-saldo-cuenta-dialog`.
- TS: `currencyOpts` arranca en guaraní (0 decimales, miles con `.`) y `onChequeraChange` lo recalcula
  con la moneda de la cuenta de la chequera: guaraní → 0 decimales; otra → 2 decimales con `,`.
  `allowNegative: false`, `nullable: true` (el `required` y `min(0.01)` siguen funcionando).
  La directiva re-aplica opciones en `ngDoCheck`, así que cambiar de chequera reformatea.

El valor del control sigue siendo **número** → la mutation `emitirCheque` no cambia. Nada de backend.

## Datos nuevos

Ninguno (no hay columna, campo ni clave nueva).

## Tests

- Paso 9: `npm run check` (AOT, el gate del repo). El desktop no tiene batería en CI.
- Prueba por pantalla (desktop web contra central local): tipear `33221202` → se ve `33.221.202`;
  emitir y verificar en la base que `cheque.total = 33221202`; chequera en USD (si hay) → 2 decimales;
  borrar el monto → error «Ingrese un monto mayor a 0».

## Auditoría del plan (paso 5) y qué se hizo

| Eje | Hallazgo | Resolución |
|---|---|---|
| A | El símbolo ya va de `matSuffix`; la máscara de tesorería lo pone de prefijo → «Gs. 1.000 Gs.» | Se reusa `MonedaService.currencyOptionsMontoPositivo(moneda, { allowZero: false })` con `prefix: ''` |
| A | La query de chequera no trae `decimales`: la precisión sale de `denominacion` (contiene GUARANI → 0, otra → 2) | Aceptado: es la regla de `decimalesDeMoneda`, la misma de los otros diálogos de tesorería |
| B | Cambiar de chequera USD → Gs con monto cargado: `updateOptions` redondea lo que se ve (`1.235`) pero el control sigue en `1234.56` → se emitiría otro monto | Si la precisión cambia al elegir chequera, el monto se borra |
| B | Modo FINANCIAL (default): en USD, tipear `100` da `1,00`; pegar `33.221.202` da `332.212,02` | Se deja: es lo que se ve (no hay valor oculto) y es igual en pago de compras y maletín |

## Implementación: desvío encontrado en la prueba

`decimalesDeMoneda(null)` da 2 (no contiene GUARANI): sin chequera elegida, `33221202` se veía
`332.212,02`. Sin moneda se usa `{ decimales: 0 }`, que coincide con el sufijo «Gs.» por defecto.

## Auditoría del diff (paso 8)

- Fijo 1 (autorización): N/A para desktop porque no hay resolver, pantalla ni botón nuevo.
- Fijo 2 (esquema): N/A porque no hay migración, entidad ni `.graphqls`.
- Fijo 3 (contrato): `total` sigue siendo `number` en `emitirCheque` (verificado en runtime, abajo).
- Condicionales A/B: N/A, no toca release ni nada replicado.

## Pruebas por pantalla (14/11, desktop web contra central local 8081, usuario MR)

Chequera 3 pasada temporalmente a una cuenta en DOLAR por SQL y restaurada al final.

| Caso | Resultado |
|---|---|
| Sin chequera, tipear `33221202` | se ve `33.221.202 Gs.`, control `33221202` |
| Elegir chequera Gs con ese monto | se conserva |
| Pasar a chequera US$ | monto vacío, control `null`, «Emitir» deshabilitado |
| En US$ tipear `123456` | `1.234,56 US$`, control `1234.56` |
| Volver a Gs con `1.234,56` cargado | monto vacío, control `null` (el caso del eje B) |
| Borrar el monto | «Ingrese un monto mayor a 0» |
| Emitir `33.221.202` | el central rechaza por saldo insuficiente (saldo 4.297.186) |
| Emitir `1.234.567` | cheque 38 en la base con `total = 1234567` |

## Sin verificar / riesgos

- Pegar `33.221.202` en una chequera US$ da `332.212,02` (modo FINANCIAL de la máscara de tesorería).
  Es visible antes de emitir y es igual en pago de compras y maletín; no se cambió.
