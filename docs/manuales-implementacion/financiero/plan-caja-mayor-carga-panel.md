# Plan — carga del panel de caja mayor (issue desktop #646)

## Estado de la issue (verificado en `develop` desktop 391756a4, central 17c44d29, 04/11)

**Punto 1 (cards que no se releen al ingresar un retiro): resuelto** por lo que entró el 03/11 (PR #674):
`IngresarRetiroCajaMayorDialog.onProcesar` marca `huboIngresos` (línea 287), `onCancel` cierra con `true`,
`RegistrarIngresoDialog.abrir` lo propaga y el dashboard llama `recargar()`. De los otros caminos que listaba:
`DetallePagoDialog` es de solo lectura (solo «Cerrar», ninguna mutation), así que no necesita recargar;
`OperacionFinancieraDetalleDialog`, `ListEntradasVariasDialog`, maletín y conteo ya recargan. Lo que se hace desde
otra pestaña depende de la suscripción `tesoreriaCambioSub`, a propósito.

**Punto 2 (rendimiento): este plan.**

## Medición antes (central local de `develop`, perfil dev, base bodega local, caja 1, 358 movimientos, 1 cuenta visible)

Script `medir646.py` (mediana de 5 corridas tras una de calentamiento; SQL contadas en el log de Hibernate, sin
el scheduler de notificaciones):

| Consulta de `recargar()` | Mediana | Sentencias SQL |
|---|---|---|
| `cajaVirtualSaldos` | 12,7 ms | 7 |
| `cajaVirtualConfiguracion` | 17,3 ms | 11 |
| `cajaVirtualResumenBancario` | 16,0 ms | 12 |
| `movimientosCajaVirtualFilter` (15 filas) | 34,0 ms | 26 (15 son el `exists` de `esPagoConsolidado`, uno por fila) |

En local cada consulta es rápida: lo que pesa en una sucursal es la **cantidad de idas y vueltas** al central
(latencia de red) y que dos van **encadenadas**. Hoy cada `recargar()` (al abrir, tras cada operación y con cada
aviso de la suscripción) hace 4 pedidos, configuración → resumen en serie.

## Cambios

### Desktop (`caja-virtual-dashboard.component.ts`)

1. `cargarConfigYBancos` se parte en `cargarConfig()` y `cargarBancos(silenciosa)`, **en paralelo**: el resumen
   no usa nada de la configuración (hoy solo la espera).
2. La configuración se lee **al abrir** y **después de «Configurar»** (`onConfigurar` pasa a llamar `cargarConfig()`
   + `cargarBancos()`). `recargar()` deja de pedirla — solo decide si se ven las tarjetas CPP/CPC y no la cambia
   ninguna operación de caja — **salvo que la última lectura haya fallado por red** (`configCargada = false`): ahí la
   reintenta, como hoy se curaba sola en cada recarga. Un `null` (caja sin configuración, o rechazo) cuenta como
   leído: el central devuelve `null` sin configuración (`CajaVirtualConfiguracionGraphQL.java:34`) y repetirlo no
   cambia nada.
3. Si la configuración no carga: `config = null` (sin tarjetas CPP/CPC) y aviso «No se pudo cargar la configuración
   de la caja.» si no es de fondo. El aviso de cuentas bancarias queda solo para el resumen. **Cambio de
   comportamiento:** hoy una config que falla deja también sin cuentas bancarias; ahora las cuentas cargan igual.
4. `cargarBancos` con número de carga (`bancosCargaId`, como `saldosCargaId`): en paralelo, una respuesta vieja no
   pisa a la nueva.
5. Rol acotado (`soloCaja`): igual que hoy, ni configuración ni resumen (el atajo queda en las dos).
6. **Cambio de comportamiento:** un cambio de configuración hecho en otro puesto no se ve hasta reabrir el
   dashboard. Hoy tampoco llegaba por la suscripción (`TesoreriaCambio` solo lo publican saldos y banco), solo se
   veía de rebote en la próxima recarga.

Resultado: `recargar()` pasa de 4 pedidos (2 en serie) a 3 en paralelo; el aviso de la suscripción, igual.

### Central (`MovimientoCajaVirtual`)

7. Campo `esPagoConsolidado` con `@Formula` (`exists` sobre `pago_solicitud_detalle.movimiento_caja_virtual_id`,
   índice `ix_pago_solicitud_detalle_mov_caja` de V239.1): sale en el mismo `select` de la página. Solo lectura,
   sin migración. El filial no tiene esta entidad. Excluida de `equals`/`hashCode`/`toString` (`@Data`).
8. `MovimientoCajaVirtualFieldResolver.esPagoConsolidado` devuelve el valor de la fórmula y solo consulta si viene
   `null` (entidad recién guardada en una mutation, que no se relee). Mismo contrato GraphQL (`Boolean`).

Resultado esperado: movimientos de 26 a ~11 sentencias por página.

## Fases

1. **Central** — `fix(financiero): calcular esPagoConsolidado en la misma consulta de movimientos`. Entidad +
   resolver + test del resolver.
2. **Desktop** — `fix(financiero): no releer la configuración de caja mayor en cada recarga`.

Independientes: no cambia el contrato GraphQL, así que no hay orden de despliegue. Un PR por repo, base `develop`.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `MovimientoCajaVirtual.esPagoConsolidado` (`@Formula`, no es columna) | nadie (lo calcula PostgreSQL al leer) | `MovimientoCajaVirtualFieldResolver` → desktop `movimientoFields` (dashboard, ir al detalle de pago) |

## Tests

- Central: `MovimientoCajaVirtualFieldResolverTest` (Mockito): con el valor de la fórmula no consulta el
  repositorio; con `null` cae al `exists`. Revertir el resolver y ver que el primero falla.
  `./mvnw clean verify -B -DskipFlyway=true` + `gh pr checks`.
- Desktop: batería `N/A para desktop porque su CI no corre tests y no hay batería confiable [ev: ciclo §1 paso 9]`;
  gate `npm run check`.
- Medición después con el mismo script (mismos números de la tabla de arriba, antes/después en los dos PR).
- Prueba por pantalla (central local + `ng serve -c web`, MR):
  1. Abrir caja 1: cards, cuentas bancarias, CPP/CPC según config, movimientos; contar pedidos `/graphql` en la red.
  2. Ingreso de efectivo → recarga: 3 pedidos, sin `cajaVirtualConfiguracion`.
  3. Configurar (ocultar/mostrar CPP o una cuenta) → se refleja.
  4. Un pago CPP en la tabla sigue mostrando «ver detalle de pago» (`esPagoConsolidado` = true) y uno común no.
  5. Configuración que falla (parche de XHR) → aviso y sin tarjetas CPP/CPC; el resto carga.
  6. Rol acotado (GERENTE12) → solo Caja Mayor, sin pedidos de configuración ni resumen.

**Bloqueante antes del PR del central:** leer en el log de Hibernate el SQL de la fórmula (`… = movimientoc0_.id`,
no `d.id`), `EXPLAIN` local de la consulta de movimientos (usa `ix_pago_solicitud_detalle_mov_caja`), y un pago CPP
real en la tabla con `esPagoConsolidado = true`.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | `id` sin calificar en la fórmula podría resolver a `d.id` | Eje B lo verificó con `Template.renderWhereStringTemplate` (Hibernate 5.6.15): solo `id` se prefija con el alias de la entidad. Igual queda como bloqueante leer el SQL real y ver un `true` |
| A | `@Data` mete la fórmula en `equals`/`hashCode`/`toString` | `@EqualsAndHashCode.Exclude` + `@ToString.Exclude` |
| A | Nadie usa el all-args constructor; filial y PWA no tienen el campo; la tabla no está publicada; contrato GraphQL igual → sin orden de despliegue | Sin cambio |
| A/B | Dos cambios de comportamiento del desktop (cuentas con config fallida; config de otro puesto) | Escritos en el punto 3 y 6; van al PR |
| B | Config que falla al abrir no se reintentaba nunca | `recargar()` la reintenta mientras `config == null` |
| B | `onConfigurar` llamaba la función que se parte | Llama `cargarConfig` + `cargarBancos` |
| B | En paralelo, dos recargas de bancos pueden pisarse | `bancosCargaId` |
| B | Mutation que devuelve un movimiento recién guardado: fórmula en `null` | Fallback del resolver (ya en el plan); no hay camino con `false` viejo cacheado |
| B | Costo de la subconsulta en toda carga de la entidad | `EXPLAIN` local bloqueante; en bodega, sin verificar (ver abajo) |

## Fuera de alcance

- `cajaVirtualResumenBancario`: una suma por cuenta visible. Medido con 1 cuenta: 12 sentencias en 16 ms; las cajas
  tienen pocas cuentas visibles. Agruparlo no cambia el tiempo de forma medible.
- `MovimientoBancario.pagoId` (pestaña de banco): mismo patrón por fila; no lo pide la issue.
- Releer solo saldos (y no la tabla) en el aviso de la suscripción: la tabla tiene que mostrar el movimiento nuevo.

## Sin verificar

- Tiempos en alpha / bodega con la latencia real de una sucursal: la medición es local.
- El plan de ejecución de la fórmula sobre la tabla de bodega (más grande que la local).
