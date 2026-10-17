# Plan — borrar las pantallas de pago sin acceso (issue #502)

Rama `fix/operaciones-borrar-pantallas-pago`, sale de `develop` (`3cd97558`).

## Decisión (Franco, 2026-10-17)

Borrar: «si a día de hoy no lo consume nada, puedes borrarlo».

## Por qué no las consume nada

- `EditPago`, `PagoDetalleDialog`, `ListPago` y `ModificarSucursalPagoDetalle` solo están en `operaciones.module.ts`.
  `PagoGeneral` y `PagoGeneralList` no están declarados en ningún módulo (la issue dice que sí: no es así).
- Ningún menú, tab, selector, ruta, spec externo ni e2e los nombra. `list-pago` navega a `/operaciones/pagos/detalle`,
  que no existe.
- La única puerta era `list-solicitud-pago` («Pago para solicitud #…» abría `EditPago`). Se quitó en `7aca0cf7`
  (Gabriel, 2025-07-17) al rehacer compras; `master` tampoco la tiene.
- Los services (`PagoService`, `PagoDetalleService`, `PagoDetalleCuotaService`) y sus `graphql/` solo los usan esas
  pantallas.

## Qué se queda

| Archivo | Lo usa |
|---|---|
| `pago/pago.model.ts` | `compra/gestion-compras/solicitud-pago.model.ts` (`Pago`) |
| `pago/pago-detalle-cuota/pago-detalle-cuota.model.ts` | `financiero/cheque/cheque.model.ts` (`PagoDetalleCuota`) |
| `pago/pago-detalle/pago-detalle.model.ts` | lo importa `pago-detalle-cuota.model.ts` |

Los tres modelos no importan nada de lo que se borra.

## Fase 1 (única) — `fix(operaciones): borrar las pantallas de pago sin acceso desde la UI`

- Borrar en `src/app/modules/operaciones/pago/`: `edit-pago/` (con `pago-detalle-dialog/`), `list-pago/`,
  `pago-general/`, `pago-general-list/` (con sus 2 specs), `pago-detalle-cuota/modificar-sucursal-pago-detalle/`,
  `graphql/`, `pago-detalle/graphql/`, `pago-detalle-cuota/graphql/`, `pago.service.ts`, `pago-detalle.service.ts`,
  `pago-detalle-cuota.service.ts`.
- `operaciones.module.ts`: quitar los 4 imports y las 4 declaraciones.
- Los planes viejos que nombran estas pantallas (`generics/plan-*.md`, `operaciones/plan-*solicitud-pago.md`) quedan
  como están: describen el código de su momento.

Tipo `fix`: el código tiene que salir publicado (sin `feat`/`fix` no hay alpha).

- Se dejan a propósito los `case "list-pagos"` de `side-mini-variant.component.ts:1103` y del huérfano
  `side/side.component.ts:332`: están comentados (no-op) y apuntan a `ListSolicitudPagoComponent`, no a lo que se borra.

## Datos nuevos / persistencia

N/A: no nace ningún campo ni migración y no se toca el backend. El schema `pago*` del central **sigue vivo**: lo usa
`frc-mobile` (`savePago`, `savePagoDetalle`, `pagoConFiltros`) y la PWA lee `solicitudPago.pago`.

Base local `bodega` al 2026-10-17 (solo lectura): `pago` 32 filas (última 2026-10-13), `pago_detalle` 0,
`pago_detalle_cuota` 0, 18 solicitudes con `pago_id`. Los `pago` los crea el motor de tesorería
(`PagoProveedorService:498`), no estas pantallas; detalle y cuota vacíos confirman que el flujo de `EditPago` no se usa.
Nada queda inaccesible: esos datos ya no tenían pantalla.

## Tests

- N/A batería (desktop sin batería en ningún gate). Gate: `npm run check` (AOT de producción), leído del log. Cubre las
  dependencias de tipos de los modelos que se quedan (`cheque.model`, `solicitud-pago.model`).
- Karma no aplica: los únicos specs del área se borran con sus componentes.
- Antes del commit: `grep -rn "operaciones/pago/\|\.\./pago/" src` solo debe nombrar `cheque.model.ts` y
  `solicitud-pago.model.ts` (más imports internos de los 3 modelos).

## Prueba por pantalla (desktop web contra central local)

Humo de `OperacionesModule` y de quienes importan los modelos que se quedan:

1. Menú → lista de solicitudes de pago y dashboard de solicitudes: cargan.
2. Abrir el diálogo crear/editar de una solicitud **con `pago_id`** (usa `SolicitudPago.pago`).
3. Gestión de compras → un pedido → pestaña de solicitudes de pago.
4. Menú → Cheques (`ChequesDashboardComponent`): carga. Es humo: su query no pide `pagoDetalleCuota`.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | Sin consumidores fuera de `pago/` (rutas, clases, GQL, selectores, config, `app/`, `e2e/`) | — |
| A | El texto no decía que `pago*` del central lo usa frc-mobile | agregado arriba |
| A | Entradas de menú `list-pagos` muertas | se dejan; anotado arriba |
| A/B | Faltaba un grep final además del AOT | agregado en Tests |
| B | Tabs en memoria, services sin efectos al construirse, rollback = revert limpio | — |
| B | Cheques no ejercita `PagoDetalleCuota` | la prueba de cheques queda como humo; la cubre el AOT |
| B | Datos huérfanos sin verificar | contado en la base local (arriba) |

## Qué queda sin verificar

- Electron: no se toca nada del main process; el build web cubre el código Angular.
- Para reponer las pantallas: `git revert` del commit de la fase (o recuperarlas de `3cd97558`).
