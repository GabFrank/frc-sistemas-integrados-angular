# Plan — Ventas de la caja: «Anular verif.» deja la caja mostrándose verificada (#682)

Pieza: desktop. Rama `fix/ventas-caja-anular-verificacion` desde `develop`. Sin cambios de central, filial ni esquema.

## Causa

`ListVentaComponent.onVerificado` (`list-venta.component.ts`) guarda la respuesta de `verificarCaja` como estado:
`this.selectedCaja.verificado = resVerif`. El central (`PdvCajaGraphQL.verificarCaja`) devuelve `true` siempre que
la operación se aplicó, al verificar y al anular. Tras anular, la pantalla queda en `true` («Verificado: Sí»,
botón «Anular verif.») hasta reabrir la pestaña.

## Fase única

En el `subscribe` de `onVerificado`, si `resVerif` es `true`:
- `selectedCaja.verificado = verificado` (el valor que se mandó);
- `selectedCaja.verificadoPor = verificado ? usuarioActual : null`.

Sin datos nuevos. `onVerificarCaja` no tiene otros llamadores.

## Pruebas (por pantalla, desktop web contra central local de develop)

- ADMIN: Cajas → caja sin verificar → Ir a Ventas → Verificar: «Sí», «Verificado por» con el usuario, botón
  «Anular verif.». Anular: «No», sin «Verificado por», botón «Verificar»; la base queda `verificado = false`.
- Rechazo (usuario sin `ANALISIS DE CAJA` no ve el botón tras #681; en `develop` sí): el estado no cambia.
- Build: `ng build --configuration production`.

## Fuera de alcance

- El central guarda `verificado_por_id` también al anular (queda el usuario que anuló). Es del central.
- La lista de Cajas no se refresca al volver de la pestaña (comportamiento previo).

## Auditoría del plan (paso 5)

| Hallazgo | Qué se hizo |
|---|---|
| A: ¿otros lectores o llamadores? | Ninguno: `onVerificarCaja` solo desde list-venta; PWA y mobile no usan `verificarCaja`; el filial no la define |
| A: el central siempre devolvió `true` (o lanza error) | El fix usa el valor enviado: correcto contra cualquier versión |
| A1: si la lectura de la caja falló, `selectedCaja` es el objeto de la fila de Cajas y el fix también la actualiza | Aceptado: es el estado correcto |
| B: error de red sin `error:` en el `subscribe` (la mutation pudo aplicarse y la pantalla no cambia) | Fuera de alcance: previo; el genérico avisa «No se pudo consultar…» |
| A2/B: `verificadoPor` null en pantalla y el usuario que anuló en la base | Aceptado: el bloque solo se muestra con `verificado` |

## Sin verificar

- Karma/e2e: no corren en CI (N/A desktop).
