# Plan — disponible de gasto y retiro con la misma regla que el filial (desktop)

Rama: `fix/caja-disponible-tolerancia` (desde `develop`). Pieza: **desktop**. Sin cambio de GraphQL.
Sigue a la issue filial #80 / PR filial #243, que pasó el control de efectivo del filial a la cuenta del
cierre (`generarBalance`) con tolerancia de 0,005 y solo para montos mayores que 0.

## Problema

`adicionar-gasto-dialog` y `adicionar-retiro-dialog` comparan cada monto contra `−diferencia` del balance
del filial (`verficarValores`), con tres diferencias respecto del filial:

1. **Sin tolerancia.** Con R$ 50,30 de apertura y retiros de 10,10 + 30 + 6 el saldo en `double` es
   4,199999999999996: la pantalla no deja cargar R$ 4,20 (no manda nada). El filial lo acepta. Visto por
   pantalla en la prueba de #80 (07/11).
2. **Compara también los montos 0.** Si el disponible de una moneda es negativo (un dato que no cierra),
   `0 > negativo` bloquea un gasto o retiro que no usa esa moneda. El filial solo controla montos > 0.
3. **Después de un rechazo no recarga el disponible.** El filial rechaza porque el saldo cambió (otro
   retiro, otra pestaña) y el diálogo sigue mostrando y validando con el balance viejo.

## Fase 1 — un commit `fix(caja): ...`

1. `src/app/modules/financiero/pdv/caja/caja.model.ts`:
   - `superaDisponible(monto: number, diferencia: number): boolean` =
     `monto > 0 && monto > −diferencia + 0.005`, junto a `esBalanceVerificable`, con un comentario que remite a
     `PdvCajaService.superaSaldo` del filial (misma regla; `−diferencia` de una caja abierta = `saldoEnCaja`).
   - `esBalanceVerificable` exige además `Number.isFinite` en las tres diferencias: un NaN hoy pasa el
     `typeof` y `monto > NaN` es falso, o sea deja pasar todo. Fail-closed, como el resto de #390.
2. `verficarValores` de los dos diálogos usa `superaDisponible` en las tres monedas. Mensajes sin cambio.
   El vuelto (`onSaveVuelto`, rama `isVuelto` del gasto) no pasa por acá y no se toca.
3. Recargar el disponible tras un rechazo, **solo** en la rama de error del alta:
   - gasto: el `error` de `gastoService.onSave(gasto, false)` → `cargarBalance()` antes del `return` de
     `erroresDeRechazo(err) != null` (no en la rama de la solicitud de gasto, que también usa
     `erroresDeRechazo`);
   - retiro: el `error` de `retiroService.onSave(retiro, false)`, ídem.
   Se recarga ante **cualquier** rechazo, a propósito (filtrar por texto sería frágil): es una consulta
   silenciosa. Mientras recarga (hasta 10 s), Guardar avisa «Todavía se está verificando el saldo»: es el
   fail-closed que ya existe. Si la recarga falla queda «Reintentar».

No se toca `retiro-pre-gasto-dialog` (no valida saldo en pantalla; el filial es el freno desde #243). La
edición de un gasto existente sigue validando contra un balance que ya lo incluye (preexistente, se deja).

### Tests

- `src/app/modules/financiero/pdv/caja/caja.model.spec.ts` (nuevo, Karma):
  - el caso real: diferencia −4,199999999999996 → la comparación vieja (`4.2 > 4.199999999999996`)
    bloqueaba; `superaDisponible(4.2, …)` no supera; 4,21 supera;
  - borde: monto = −diferencia + 0,005 no supera (`>` estricto, como el filial);
  - monto 0, nulo o indefinido con disponible negativo → no supera; diferencia 0 y monto 0,01 → supera;
  - `esBalanceVerificable` con NaN → falso.
- Cómo correrlo: Karma con un tsconfig temporal acotado a este spec (hay specs rotos que tumban la suite
  entera) y `DISPLAY=:0`. `npm run check` (AOT) es el gate del build; no corre tests.

### Prueba por pantalla

Filial de la rama de #243 en el 8082 (sucursal 24) + desktop de esta rama web estático:
1. R$ con centavos: caja con R$ 4,199999… → cargar R$ 4,20 → pasa la pantalla y el filial lo guarda.
2. Disponible negativo en una moneda → un gasto solo en otra moneda se guarda.
3. Rechazo: diálogo abierto, retiro desde otra pestaña, guardar → el filial rechaza → el diálogo recarga
   el disponible (red: nueva `balancePorCajaId`); guardar enseguida avisa «Todavía se está verificando», y
   después el siguiente intento lo bloquea la pantalla.

## Eje A / B

- Contrato: sin cambio de GraphQL; solo lógica de pantalla. Con un filial **sin** #243 (vieja validación)
  el filial puede rechazar menos, nunca más que antes.
- Rollback: solo código.

## Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| El diálogo de gasto tiene dos ramas con `erroresDeRechazo` | A | se nombra la del alta |
| Ruta real de `caja.model.ts` | B | corregida |
| Karma no corre la suite entera (specs rotos); el spec nuevo no compila con el código viejo | B | comando acotado; el spec documenta la comparación vieja |
| NaN pasa `esBalanceVerificable` y deja pasar todo | B | `Number.isFinite` |
| Recargar ante cualquier rechazo; bloqueo mientras recarga | A, B | a propósito; en la prueba por pantalla |
| Contra un filial sin #243 la pantalla se relaja 0,005 | A | anotado |
| Vuelto y edición de gasto fuera | A, B | anotado |

## Sin verificar

- Contra un filial anterior a #243 la pantalla se relaja en 0,005 y en los montos 0, y sigue siendo la
  única barrera real (ese filial no descontaba retiros). Aceptable: 0,005 es redondeo de `double`.

## Resultado de las pruebas (2026-11-07)

- `caja.model.spec.ts`: 4/4 en Karma (acotado, `DISPLAY=:0`). `npm run check`: sin errores.
- Por pantalla, filial de la rama de #243 en el 8082 y este desktop web:
  1. R$ con centavos: con R$ 0,0999… disponible por `double`, un gasto de R$ 0,10 pasa la pantalla y el
     filial lo guarda (gasto 718).
  2. Disponible negativo en guaraníes: un gasto solo en reales se guarda (gasto 720).
  3. Rechazo del filial con el diálogo abierto (retiro hecho desde otra pestaña): el diálogo recarga el
     disponible (nueva `balancePorCajaId` en la red) y el intento siguiente lo bloquea la pantalla. Igual en
     gasto y en retiro.
