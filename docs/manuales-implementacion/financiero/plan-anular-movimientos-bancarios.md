# Plan — anular desde los movimientos bancarios (issue desktop #402)

Piezas: **central** + **desktop**. Rama en los dos repos: `feature/financiero-anular-movimientos-bancarios`,
desde `origin/develop`. Skills: `frc-financiero-expert`, `frc-desktop`, `frc-central`.
Un PR por repo; orden: **central primero, desktop después** (§3.2 del ciclo).

## Qué se resuelve

La tabla de movimientos de una cuenta bancaria no tiene acciones: un pago hecho 100 % por banco no tiene fila de
caja y por lo tanto no se puede anular desde la UI (el 03/10/2026 se anularon dos a mano con `anularPagoCpp`).
Se agrega ⋮ → **Anular** por fila, que **enruta al módulo dueño** del movimiento. No se crea ninguna forma nueva
de mover plata: se llaman las dos mutations que ya existen.

## Relevamiento [verificado contra `origin/develop` de los dos repos, 05/10/2026]

- **Central — el dato existe, no se expone.** `financiero.movimiento_bancario` ya tiene `origen_tipo` (varchar) y
  `origen_id`, mapeados en `MovimientoBancario.java`. El type GraphQL (`operacion-financiera.graphqls:69`) no
  los publica. **No hace falta migración.**
- **Quién escribe cada origen en banco** (`BancoLedgerService.registrar`, todos los llamadores):

  | `origenTipo` | Lo escribe | `origenId` | Cómo se anula hoy |
  |---|---|---|---|
  | `PAGO_CPP`, `GASTO`, `RRHH_VALE`, `RRHH_LIQUIDACION_SUELDO`, `RRHH_LIQUIDACION_FINAL`, `RRHH_AGUINALDO` | `PagoProveedorService.procesarEvento:494` | `pago.id` | `anularPagoCpp(pagoId)` — rol `CPP PAGAR` o `GESTIONAR` |
  | `OPERACION_FINANCIERA` | `OperacionFinancieraService` | `operacion.id` | `anularOperacionFinanciera(id)` — rol `GESTIONAR` |
  | `CHEQUE` (contado, emitido por un pago) | `ChequeGestionService.emitir:64` | **`null`** | solo anulando su pago (`anularPorPago`); el detalle del pago **sí** apunta a este movimiento (`procesarEvento:547`) |
  | `CHEQUE` (cobro de un diferido) | `ChequeGestionService.cobrar:94` | `cheque.id` | desde Cheques; ningún detalle de pago lo apunta |
  | `ACREDITACION_POS` | `AcreditacionPosService` (incluye `AJUSTE_±` de diferencia, mismo `origenId`) | `acreditacion.id` | desde su módulo |
  | `VENTA_CREDITO_COBRO` | `CobroCreditoService` | `cuota.id` | desde su módulo |
  | `MANUAL` | `ajustarSaldoCuentaBancaria` | `null` | **no hay endpoint** |
  | `ANULACION` | `BancoLedgerService.revertir` | id del original | es el contra-movimiento |

- **A qué pago pertenece una fila: lo sabe `PagoSolicitudDetalle`, no el `origenId`.** El detalle lleva
  `pagoId` + `movimientoBancarioId`. `origenId = pago.id` vale para la pata bancaria consolidada, pero el cheque
  al contado de un pago tiene `origenId = null`, y un movimiento de pago anterior al motor no tiene detalle. Por
  eso el central expone **`pagoId`** derivado del detalle (en vez del booleano `esPagoConsolidado` de caja) y el
  desktop no interpreta `origenId` para los pagos.
- **Concurrencia de `anularPagoCpp` [verificado, preexistente].** Lee el `Pago` sin lock
  (`PagoProveedorService:623`; `PagoRepository` no tiene `lockById`) y `TesoreriaService.revertir:234` no mira
  `activo`. Dos anulaciones simultáneas del mismo pago pueden pasar las dos el chequeo de `CANCELADO` y duplicar
  el contra-movimiento de caja. Hoy ya es posible con doble clic en la fila de caja (esa ruta no bloquea la
  pantalla); este trabajo suma una segunda puerta (caja y banco a la vez).
- **Desktop — vistas de movimientos bancarios: son dos, no tres.** `cuenta-bancaria.component` no tiene tabla
  propia: abre `list-movimientos-bancarios-dialog`. Las dos vistas son ese diálogo y el bloque BANCO de
  `caja-virtual-dashboard` (`displayedColumnsBanco`, sin columna de acciones). Las dos usan la misma query
  (`movimientosBancariosQuery`, `operacion-financiera/graphql/graphql-query.ts:138`).
- **Motivo.** La fila de caja anula con `DialogosService.confirm` y manda `motivo = null`. Existe
  `shared/components/motivo-dialog` (motivo obligatorio, en mayúsculas), ya usado en `pagar-compras-dialog`.
- **Clientes móviles.** `frc-mobile-pwa` y `frc-mobile` no usan `movimientosBancarios` ni `MovimientoBancario`.

## Decisiones

1. **Enrutar por `pagoId` y `origenTipo`** (en este orden):
   - `anulado` u `origenTipo === 'ANULACION'` → la fila **no muestra** el ⋮.
   - `pagoId` → `anularPagoCpp(pagoId)`. Incluye el **cheque al contado de un pago** — **decisión a confirmar
     con Franco**: el issue dice «cheque: deshabilitar», pero un pago hecho 100 % con cheque al contado no tiene
     fila de caja ni pata consolidada, así que deshabilitarlo deja el mismo hueco que motivó el issue.
   - `origenTipo === 'OPERACION_FINANCIERA' && origenId` → `anularOperacionFinanciera(origenId)`.
   - Resto → **Anular deshabilitado con tooltip**: cobro de cheque diferido («desde Cheques»), acreditación POS
     y sus ajustes, cobro de crédito, ajuste manual («se corrige con otro ajuste»), y `PAGO_CPP`/`GASTO`/`RRHH_*`
     sin `pagoId` («pago anterior al motor de pagos») u origen nulo/desconocido («sin origen registrado»). El
     conjunto de `origenTipo` no se asume cerrado: lo no reconocido cae acá.
2. **Movimiento manual (`MANUAL`): fuera de alcance**, como dice el issue. No hay mutation y agregarla es mover
   plata por un camino nuevo: issue aparte en el central.
3. **Motivo obligatorio** con `MotivoDialogComponent` (un solo diálogo: motivo + aviso de qué se revierte). Es
   lo que pide el issue y difiere de la fila de caja, que no lo pide; no se toca la fila de caja. El aviso dice
   lo que el central hace de verdad, según `origenTipo`: siempre «se anula el pago completo: todos sus
   movimientos de caja y banco y sus cheques»; compras → «las solicitudes vuelven a quedar pendientes de pago y
   las notas de recepción dejan de estar pagadas»; gasto → «el gasto queda cancelado y vuelve a tesorería como
   pendiente»; vale / liquidación / aguinaldo → «el documento vuelve a quedar aprobado, sin pagar»; finiquito →
   lo mismo + «**el funcionario sigue dado de baja**».
6. **Pantalla bloqueada mientras corre la mutation** en las dos rutas: `CargandoDialogService` alrededor de la
   llamada (la ruta de pago usa `mutar`, que no abre el «Guardando…» de `onSaveCustom`), cerrado en `finalize`.
7. **Lock del `Pago` en `anularPagoCpp`** (central, **a confirmar con Franco**: va acá como commit `fix` propio
   o como issue aparte): `PagoRepository.lockById` (`PESSIMISTIC_WRITE`) como primera lectura; la segunda
   anulación espera, ve `CANCELADO` y sale con «El pago ya está anulado».
4. **Rol en el desktop** (UX; la seguridad es la del central): pago → `TESORERIA GESTIONAR` o
   `TESORERIA CPP PAGAR`; operación financiera → `TESORERIA GESTIONAR`. Sin el rol, la opción sale deshabilitada
   con tooltip. Flags calculados en `ngOnInit` y precalculados por fila: ninguna función en el HTML.
5. **Una sola implementación del ruteo**, usada por las dos vistas: función pura + servicio. Nada duplicado
   entre el dashboard y el diálogo.

## Datos nuevos (quién escribe / quién lee)

| Dato | Escribe | Lee |
|---|---|---|
| `MovimientoBancario.origenTipo` (GraphQL, `String`) | ya persistido por `BancoLedgerService.registrar` | `accionAnularMovimientoBancario` (desktop) |
| `MovimientoBancario.origenId` (GraphQL, `Int`) | idem | `MovimientoBancarioAnulacionService` (id de la operación financiera) |
| `MovimientoBancario.pagoId` (GraphQL, `Int`, derivado) | `MovimientoBancarioFieldResolver` ← `PagoSolicitudDetalle.pagoId` por `movimientoBancarioId` (lo setea `procesarEvento:547,554`) | `accionAnularMovimientoBancario` y `MovimientoBancarioAnulacionService` |

Sin columnas, sin migración, sin enum nuevo (`origenTipo` va como `String` porque la entidad lo guarda como
`String`: no entra en `SchemaEnumsSincronizadosTest`).

## Fases

### Fase 1 — central: exponer el origen del movimiento bancario

- `graphql/financiero/operacion-financiera.graphqls`: en `type MovimientoBancario` agregar `origenTipo: String`,
  `origenId: Int`, `pagoId: Int` (con el comentario de por qué no alcanza el `origenId`).
- `PagoSolicitudDetalleRepository`: `Optional<PagoSolicitudDetalle> findFirstByMovimientoBancarioId(Long id)`
  (todos los detalles que comparten un movimiento son del mismo pago).
- `graphql/financiero/MovimientoBancarioFieldResolver` (`GraphQLResolver<MovimientoBancario>`): `pagoId(mov)`.
- **Sin cambios de autorización**: no hay query ni mutation nueva; `movimientosBancarios` ya exige
  `seg.requireVer()` y las dos mutations ya exigen su rol.
- **Tests**: `MovimientoBancarioFieldResolverTest` (Mockito: el `pagoId` del detalle, `null` sin detalle, `null` con
  movimiento o id nulo). Los tests de schema existentes (`SchemaSinCamposDuplicadosTest`,
  `SchemaEnumsSincronizadosTest`) siguen en verde.
- Gate: `./mvnw clean verify -B -DskipFlyway=true`, leído del log. Commit `feat(financiero): …`, push.

### Fase 1b — central: lock del pago al anular (si Franco confirma la decisión 7)

- `PagoRepository.lockById` + usarlo en `anularPagoCpp`. Test en `PagoProveedorServiceTest`: anular lee el pago
  con lock; un pago `CANCELADO` corta sin tocar ledger. La carrera real se prueba en runtime (caso 8).
- Commit aparte `fix(financiero): …`, mismo PR.

### Fase 2 — desktop: contrato y ruteo

- `operacion-financiera/graphql/graphql-query.ts`: `movimientoBancarioFields` + `origenTipo`, `origenId`,
  `pagoId`. Modelo `MovimientoBancario` con los tres campos.
- `operacion-financiera/movimiento-bancario-anulacion.ts`: función pura
  `accionAnularMovimientoBancario(mov, permisos)` → `{ visible, habilitada, via: 'PAGO' | 'OPERACION' | null,
  tooltip, aviso }`, con la tabla de la decisión 1 y el texto de la decisión 3.
- `operacion-financiera/movimiento-bancario-anulacion.service.ts`: `anular(mov)` abre `MotivoDialogComponent`
  con el aviso del caso, bloquea la pantalla (decisión 6), llama a `PagarComprasService.onAnularPago(pagoId,
  motivo)` o `OperacionFinancieraService.onAnular(origenId, motivo, { avisarExito: false })`, y avisa éxito o
  error **una sola vez** (el error que ya avisó `onSaveCustom` no se repite; el de `mutar` lo avisa este
  servicio). Devuelve `Observable<boolean>` que **siempre emite y completa**: `true` = anulado, `false` =
  cancelado por el usuario o error ya avisado (`catchError` + `finalize`; nada queda colgado si la mutation no
  emite).
- **Tests**: spec de la función pura — una fila por caso de la tabla: pata consolidada, cheque al contado con
  `pagoId` y `origenId` nulo, cobro de diferido, `PAGO_CPP` sin `pagoId`, operación financiera, POS y su ajuste,
  cobro de crédito, manual, origen nulo, anulado, `ANULACION`, y cada combinación de rol. Spec del servicio con
  dobles: una sola notificación por camino de error y `false` cuando el usuario cancela. Karma no corre en CI:
  se corren en local si el runner levanta; si no, se anota como no verificado.

### Fase 3 — desktop: bloque BANCO del dashboard de caja

- `caja-virtual-dashboard`: filas bancarias pasan por `toRowBanco` (clon + `_accion` precalculada), columna
  `accionesBanco` con ⋮ → Anular (`[disabled]` + `matTooltip`), y `onAnularBanco(row)` → servicio → `recargar()`
  (saldos de caja, cards de banco y lista: un pago mixto también mueve la caja).

### Fase 4 — desktop: diálogo de movimientos de la cuenta

- `list-movimientos-bancarios-dialog`: misma columna y misma llamada; al anular vuelve a la primera página (el
  contra-movimiento entra arriba) y marca `huboCambios` (campo público).
- `cuenta-bancaria.component.onVerMovimientos`: `afterClosed` → `cargar()` si `componentInstance.huboCambios`,
  leído del componente y no del valor de cierre: el diálogo también se cierra con ESC o clic afuera.

Gate de las fases 2–4: `ng serve -c web` durante el desarrollo y **`npm run check` al final de la fase 4** (regla
del repo: AOT una vez, al final), leído del log. Un commit + push por fase (`feat(financiero): …`).

## Prueba de runtime (paso 9, local)

Central `:8081` (perfil `dev`, base `bodega@5551`) + desktop `ng serve -c web`. Casos, con datos reales de la
base local elegidos por SQL antes de probar:

1. Pago 100 % bancario (uno de compras y un gasto): Anular desde el bloque BANCO → pide motivo → el original
   queda anulado, aparece el `AJUSTE_POSITIVO`, el saldo de la cuenta vuelve, la solicitud queda `SOLICITADO`,
   `Pago` en `CANCELADO`. Comparar con SQL contra lo que deja la fila de caja en un pago equivalente.
2. Lo mismo desde el diálogo de Cuentas Bancarias → Ver movimientos; al cerrar, el saldo de la lista se actualiza.
3. Pago mixto (caja + banco) anulado desde banco: se revierten las dos patas.
4. Depósito / transferencia bancaria: anula la operación completa.
5. Fila ya anulada y fila `ANULACION`: sin ⋮. Cheque, acreditación POS, cobro de crédito, ajuste manual: Anular
   deshabilitado con su tooltip.
6. Usuario sin `GESTIONAR` ni `CPP PAGAR`: deshabilitado; con solo `CPP PAGAR`: anula pagos, no operaciones.
7. Error del central (p. ej. descubierto al revertir una entrada): un solo aviso, la fila no cambia.
8. Carrera: dos `anularPagoCpp` del mismo pago en paralelo (curl); contar contra-movimientos por SQL — uno solo
   por pata. Y fila vieja: anular desde la UI un pago ya anulado en otra pestaña → «El pago ya está anulado».
9. Pago con cheque al contado: Anular desde la fila del cheque anula el pago entero y revierte el cheque.
10. Vale con cuota ya descontada: el central rechaza y el mensaje llega legible. Finiquito: tras anular, el
    funcionario sigue inactivo (lo que el aviso prometió).

## Compatibilidad y despliegue

- **Central nuevo + desktop viejo**: sin efecto (campos de más).
- **Desktop nuevo + central viejo**: `movimientosBancarios` falla entera («campo desconocido») → las dos vistas
  de movimientos bancarios quedan sin datos (con aviso). Por eso **el PR del desktop no se mergea hasta que el
  central del canal esté desplegado**, y lo mismo en cada promoción (alpha → beta/farmacia → stable/bodega).
- **El merge a `develop` del central no despliega** (`deploy-auto.yml` no corre): hace falta
  `gh workflow run Deploy` con `instance=alpha` y esperar `success` antes de mergear el desktop.
- **Rollback**: los dos cambios son de código, sin estado. Volver atrás el desktop quita el botón; volver atrás
  el central **con el desktop nuevo ya instalado** rompe las dos vistas (mismo caso que arriba): se vuelve
  atrás primero el desktop.
- Filial: no se toca. Réplica: no se toca (`movimiento_bancario` sin DDL).

## Sin verificar / pendiente

- Que el ACL de cajas no bloquee anular un pago mixto desde banco a quien no tiene escritura sobre esa caja: es
  el comportamiento correcto (lo rechaza `TesoreriaService`), pero el mensaje se verifica en la prueba 3.
- Estado real de Karma en esta máquina.
- Anular un movimiento bancario manual: issue aparte en el central (no existe la mutation).

## Documentación al cierre (paso 11)

`frc-financiero-expert` dice «un pago 100 % bancario no tiene botón»: deja de ser cierto, pero la skill vive en
`frc-cicd` (solo lectura en esta máquina) → se le avisa a Franco. Este plan se borra en el PR final.

## Auditoría del plan (paso 5, 05/10/2026) — hallazgos y qué se hizo

Dos auditores sin verse; cada hallazgo se verificó contra `origin/develop` antes de aplicarlo.

| # | Eje | Hallazgo | Verificado | Qué se hizo |
|---|---|---|---|---|
| 1 | A y B | El cheque al contado de un pago tiene detalle (`esPagoConsolidado` daría `true`) pero `origenId` nulo: la regla original lo dejaba sin ruta y dependía de un null accidental | sí (`procesarEvento:547`, `ChequeGestionService:64`) | el central expone `pagoId` derivado del detalle; decisión 1 |
| 2 | A | Movimientos de pago sin detalle (anteriores al motor) y orígenes nulos no tenían tooltip | sí por código; no se contó en la base | caso «resto» ampliado + filas de spec |
| 3 | B | `anularPagoCpp` no lockea el `Pago` y `TesoreriaService.revertir` no es idempotente: dos anulaciones simultáneas duplican el contra-movimiento de caja | sí (`:623`, `TesoreriaService:234`) — preexistente | decisión 7 / fase 1b, a confirmar |
| 4 | B | La ruta de pago (`mutar`) no bloquea la pantalla mientras corre | sí (`pagar-compras.service.ts:205`) | decisión 6 |
| 5 | B | El aviso «se reabren todos los documentos» era falso: el gasto queda cancelado, el finiquito no reactiva al funcionario | sí por lo que dicen las skills de dominio y `anularPagoCpp:652-667`; los `sincronizarDesdeSolicitudPago` de RRHH **no se releyeron** — se confirma en la prueba 10 | texto por origen, decisión 3 |
| 6 | B | El `Observable` del servicio podía no emitir en error; el flag de cierre del diálogo se perdía con ESC; la página se corre al anular | sí | fases 2 y 4 |
| 7 | B | La prueba no cubría carrera, fila vieja, vale con cuota descontada, finiquito ni cheque | — | casos 8–10 |
| 8 | A | `origenTipo` como `String`, `origenId` como `Int`, sin espejo en filial, sin uso en mobile/PWA, `movimientoBancarioFields` con un solo consumidor | sí | sin cambios |

Los dos auditores no se contradijeron.
