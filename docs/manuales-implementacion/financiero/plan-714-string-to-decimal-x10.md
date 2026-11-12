# Plan #714 — confirmaciones muestran USD/BRL enteros ×10

## Causa

`stringToDecimal` (`src/app/commons/core/utils/numbersUtils.ts`) asume que el texto trae separador decimal.
Con un entero (`"2"`): `indexOf(',')` da -1, `texto[1]` es `undefined` y le agrega un `'0'` → `"20"`.
Además, con más de 2 decimales (sumas de float como `0.15000000000000002`) corta mal.

Llamadores (todos pasan `number.toString()`; los controles usan `currencyMask`, que da número):

- `adicionar-conteo-dialog.component.ts` 420-421 y 488-489 — confirmación de apertura/cierre (la issue)
- `adicionar-gasto-dialog.component.ts` 397-398, 492-499 — confirmación de gasto y vuelto
- `adicionar-retiro-dialog.component.ts` 140-141 — confirmación de retiro

## Fase 1 (única)

`stringToDecimal`: redondear a 2 decimales con `toFixed(2)`, miles con `stringToInteger`, coma decimal, signo aparte
(sin «-0,00»). Texto no numérico o ≥ 1e21 se devuelve tal cual, como hoy.
Mismo formato que hoy para lo que ya andaba (`"2.5"` → `"2,50"`, `"1234.56"` → `"1.234,56"`, `"0"` → `"0,00"`).
Cambio buscado: con más de 2 decimales ahora redondea (`0.005` → `0,01`; `1.005` → `1,00` por el float de `toFixed`),
antes mostraba los 3 decimales o basura. Solo es texto de confirmación.

`stringToUnknown` (único otro consumidor, mismo archivo) no tiene llamadores: no se toca.

Test: `numbersUtils.spec.ts` (hermano de `versionUtils.spec.ts`). Fallan con el código viejo: `"2"` → `2,00`,
`"1234"` → `1.234,00`, `"0.15000000000000002"` → `0,15`, `"-123"` → `-123,00`. Además protegen: `"0"`, `"2.5"`,
`"1234567.8"`, `"-0.001"` → `0,00`, `"NaN"`. Karma no corre en CI: se corre a mano con `DISPLAY=:0` y un tsconfig
temporal acotado al spec (sin commitear). Revertir el fix y comprobar que falla. Gate: `npm run check`.

Datos nuevos: ninguno. Backend: ninguno (solo texto de los diálogos de confirmación). Sin migración.

## Pruebas por pantalla

Desktop web contra central/filial locales, usuario MR, sucursal 24:
abrir caja con 2 USD → la confirmación dice `2,00`; cerrar con 5 USD → `5,00`; reales con decimales;
confirmación de retiro y de gasto con enteros y decimales.

## Fuera de alcance

`adicionar-retiro-dialog` `onVer` carga `retiroRs` en dólares y `retiroDs` en reales (cruzados). Bug aparte: issue.

## Sin verificar

Impresión térmica (no usa esta función). El conteo guarda el total float crudo y la confirmación muestra el redondeado
a 2 decimales: ya era así, no cambia.

## Auditoría del plan (paso 5)

- Eje A: sin otros llamadores, todos pasan número en texto; frc-mobile tiene una copia con el mismo bug (fuera de
  alcance). Casos borde «-0,00» y NaN → incorporados.
- Eje B: NaN/1e21 daban basura con la primera versión → guarda agregada; documentar redondeo y casos del spec →
  incorporado.
