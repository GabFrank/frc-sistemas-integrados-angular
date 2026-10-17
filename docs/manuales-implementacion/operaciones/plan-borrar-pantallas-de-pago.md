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

### Resultado (2026-10-17, build `web-production` de `60bebdc6` contra el central local `:8081`, usuario MR)

- `npm run check`: exit 0, sin errores (solo los warnings de siempre: CommonJS, autoprefixer, `:lang`).
- Solicitud de pago (menú Compras): la lista carga; SP-000013 (id 16, con `pago` #31) abre **Editar solicitud de
  pago** con notas y forma de pago, y **Gestionar pago** abre. Ambos cerrados con Cancelar.
- Compras → Solicitudes de pago y Lista de compras → Pedido 5: cargan (el 5 está en el paso 3, sin pestaña de pago).
- Pedido 2 (etapa `SOLICITUD_PAGO` en proceso): abre directo en «5. Solicitud de Pago» con el resumen (1 solicitud,
  Gs. 332.161, 0 notas disponibles), la tabla con SP-000013 y su menú de acciones (imprimir, solicitar, cancelar,
  eliminar). No se ejecutó ninguna acción: ninguna toca código del diff.
- Financiero → Cuentas y Bancos → Cheques: carga con la chequera activa.
- Consola: un solo error, el service worker de Firebase (404 del servidor estático de la prueba), ajeno al cambio.
- El central `:8081` de la prueba usa otra base que `bodega` (2 solicitudes); el filtro de fechas del backend
  excluye la SP-000013 con el rango por defecto (también por API directa): preexistente, no es de este cambio.

## Auditoría del diff (paso 8)

3 fijos sobre `7fcb3d2a..60bebdc6`: 43 archivos, solo borrados (+8 líneas del módulo). Fijo 1 OK (no se borra ningún
control de rol), Fijo 2 N/A (sin migración, `.graphqls` ni enum), Fijo 3 OK (sin referencias vivas, ni por string ni
dinámicas). Condicionales A y B: N/A (no toca release ni replicación).

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
