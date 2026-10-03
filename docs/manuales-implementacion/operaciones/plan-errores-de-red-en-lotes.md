# Plan — errores de red en lotes (issue #390, PR 9)

Pieza: **desktop**. Rama: `fix/operaciones-errores-de-red-en-lotes`, desde `origin/develop` (no comparte archivos
con #405). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s),
`TIMEOUT_POR_DEFECTO_MS` (60 s). Relevamiento: auditor de solo lectura sobre `lote.service` y sus pantallas (stock
por lote, historial, lotes del producto, ajuste de stock por lote, selección de lotes en transferencias y en la
venta del POS) (2026-10-03); el ajuste releído a mano. Todo va al **central**, salvo la venta del POS (filial),
que ya maneja sus errores (#391–#398) y no cambia.

## Regla (la de #391–#405)

«Propagar» = `networkError`, con contexto explícito y `silenciarAvisoTimeout: true`: 20 s en diálogos, 60 s en
listados. Un `null` (error GraphQL) se trata como fallo, no como «sin resultados». Un fallo no se cachea ni deja a
la vista datos de otro filtro o sucursal como si fueran los del actual. Todos los métodos de `lote.service` en
alcance tienen un solo llamador (o ya pasan su `errorConf`): se propaga en el servicio.

## 1. Ajuste de stock por lote (fase 1)

`ajustar-stock-lote-dialog` (central):
- **Saldo del lote al cambiar de sucursal** (`releerSaldoDelLote` → `onBuscarLotesDeProducto`): si la relectura no
  responde (o vuelve `null`), quedan el saldo y la cantidad **de la sucursal anterior**, con Guardar habilitado: el
  operador corrige sobre un número que no es el de esta sucursal. Si el lote no aparece en la sucursal nueva,
  tampoco se limpia. Cambio: al cambiar de sucursal el saldo del lote queda **sin verificar** (`saldoLoteVerificado =
  false`, Guardar bloqueado) hasta que la relectura responda; error o `null` → aviso con «Reintentar»; lote no
  encontrado en la sucursal → se quita el lote con aviso.
- **Existencia del producto** (`onResumenStockLote`): sin respuesta, `cargando` queda prendido sin aviso (Guardar
  bloqueado, el operador no sabe por qué); con error GraphQL la existencia queda en **0** y Guardar se habilita
  sobre una previsualización falsa. Cambio: `existenciaCargada` bloquea Guardar; error o `null` → aviso y
  «Reintentar»; nunca 0 inventado.
- **Sucursales** (`onGetAllSucursales`, ya acepta `errorConf`): sin respuesta, con una sucursal preseleccionada no
  se carga ni la existencia ni el lote. Cambio: opt-in (60 s) + aviso y «Reintentar».
- Guardar no se permite con una relectura en vuelo.

## 2. Selección de lotes en una transferencia (fase 1)

`seleccionar-lotes-dialog` (`onGetStockPorLoteEnPresentacion`, ya propaga, pero sin corte propio: 300 s): en la
primera carga fallida queda una tabla vacía sin mensaje; en recargas fallidas quedan las filas viejas con su
saldo, y **Confirmar** sigue habilitado (en edición reenvía la asignación previa sin verificar). Cambio: contexto de
20 s en esta llamada; estado «No se pudieron cargar los lotes» con «Reintentar»; con la última carga fallida se
vacían las filas y **Confirmar** queda bloqueado. Sus otros llamadores (venta del POS) no cambian.

## 3. Listados de lotes (fase 2)

- **Stock por lote** (`list-stock-lote`, `onBuscarStockPorLote`): `isSearching` trabado, filas de la búsqueda
  anterior bajo filtros nuevos; con `null` «sin resultados» falso. Cambio: propagar (60 s), al fallar se vacía la
  grilla y se muestra «No se pudo cargar» + «Reintentar».
- **Stock del lote por sucursal** (`onStockLotePorSucursal`, al expandir una fila): con error o `null` se cachea
  `[]` («No hay sucursales para mostrar») y no se reintenta. Cambio: propagar (20 s); al fallar no se cachea
  (`sucursales = null` + marca de error con «Reintentar»).
- **Historial del lote** (`historial-lote`, `onMovimientosPorLote`, `onClientesPorLote`): flags trabados y filas del
  filtro anterior. Cambio: propagar (60 s), al fallar se vacía la tabla con aviso y «Reintentar».
- **Lotes del producto** (`lotes-producto-dialog`, `onGetLotesPorProducto`): «cargando» eterno; con `null` «sin
  lotes» falso. Cambio: propagar por defecto en el servicio (su otro llamador ya pasa `PROPAGAR_ERROR_DE_RED`); al
  fallar «No se pudieron cargar los lotes» + «Reintentar».
- **Sucursales** de `list-stock-lote` e `historial-lote`: opt-in + aviso.

Sin cambio: `onGetStockPorLote` (sin llamadores), el selector genérico de lote (`search-list-dialog`, compartido
por otros módulos: va con su propio PR), la venta del POS (`seleccionar-lote-venta-dialog` ya maneja errores;
`agregarConLote` agrega sin lote ante un error, decisión documentada: se anota para revisarla aparte),
mutaciones `onAjustarStockLote` y `onCambiarEstadoLote` (ya propagan; son absolutas: un reintento no duplica).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(operaciones): no ajustar ni transferir lotes con saldo sin verificar` | 1, 2 |
| 2 | `fix(operaciones): avisar cuando no cargan los listados de lotes` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]; los specs que mockean estos métodos se ajustan si `npm run check` los
compila. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*),
congelado con `kill -STOP` + respaldo `kill -CONT`. Casos: stock por lote (buscar, expandir sucursales), historial,
lotes del producto, ajuste de stock por lote (cambiar de sucursal con el central congelado: Guardar bloqueado),
selección de lotes en una transferencia si hay datos. **No se guarda ningún ajuste ni transferencia** con el central
congelado. Si la base local no tiene productos con lote, se verifica por código. Casos `null`: por código.

## Riesgos y qué queda sin verificar

- Con el central lento, ajustar un lote queda bloqueado hasta que la relectura responda.
- Si el backend no devuelve el lote en una sucursal sin stock (saldo 0), al cambiar a esa sucursal el lote se quita
  (no verificado): el operador lo vuelve a elegir con el buscador.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **Carrera al cambiar de sucursal** (ajuste): cada cambio lanza una relectura del lote y de la existencia sin
  cancelar la anterior; una respuesta tardía de la sucursal anterior pisaba la de la actual. Cambio: contador de
  carga (o comparar la sucursal pedida con la actual) en las dos consultas; solo la última aplica.
- **Lote «no encontrado» no se quita**: el backend devuelve los lotes con saldo 0 en la sucursal
  (`LoteRepository`, LEFT JOIN al saldo); el único «no encontrado» es que la búsqueda parcial por número lo deje
  fuera de la página. Ante eso el lote queda **sin verificar** (Guardar bloqueado) con aviso, y se busca con más
  filas para reducir el caso.
- **Flags y Guardar**: `saldoLoteVerificado` y `existenciaCargada` se apagan y se recalcula `puedeGuardar` en el
  mismo punto; `aplicarLote` (relectura o elección manual en el buscador, que trae saldo fresco) vuelve a verificar.
  Sin existencia cargada no se calcula «existencia después» (se muestra «—»), y en error queda `null`, no 0.
- **Reintentar**: el de sucursales llama a `cargarSucursales()` completo; el del lote relanza la preselección o la
  relectura según corresponda.
- **Transferencias**: `onGetStockPorLoteEnPresentacion` ya acepta `timeoutMs` (9.º parámetro): se pasa 20 s sin
  cambiar la firma. Confirmar se bloquea **solo** si la última carga falló (no cuando el lote previo no está en la
  página cargada, que hoy es válido); al fallar se vacían las filas pero se conserva la selección.
- **`onGetLotesPorProducto`**: propaga por defecto (`errorConf ?? PROPAGAR`, contexto 60 s por defecto); su otro
  llamador (recepción) ya pasa los suyos.
- **Stock del lote por sucursal**: «ya cargado» = `sucursales != null && !errorSucursales`; se mantiene el test del
  spec (no se vuelve a pedir si ya cargó) y el contexto va dentro del servicio (la expectativa
  `toHaveBeenCalledOnceWith(3)` no cambia).
- **Avisos**: en cada pantalla, estado inline con «Reintentar» y un solo aviso por fallo.

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | Carrera entre relecturas al cambiar de sucursal | alta | contador de carga en lote y existencia |
| A/B | El backend devuelve lotes con saldo 0: «no encontrado» es un falso negativo de la página | media | no se quita el lote; queda sin verificar |
| B | Flags nuevos sin recalcular `puedeGuardar` | media | se recalcula en el mismo punto |
| B | Existencia null vs 0 y la previsualización | media | `null` + «—» |
| B | Bloquear Confirmar en transferencias en edición | media | solo con la última carga fallida |
| A | Spec de `list-stock-lote` (llamada y caché) | media | contexto en el servicio; condición de caché ajustada |
| A | `onGetStockPorLoteEnPresentacion` ya acepta timeout; `onGetLotesPorProducto` tiene 2 llamadores | baja | sin cambio de firma; default en el servicio |
| B | Reintento de sucursales y de la preselección; avisos duplicados | baja | ajustado |
| A | Llamadores, streams, mutaciones, venta del POS | — | verificado |
