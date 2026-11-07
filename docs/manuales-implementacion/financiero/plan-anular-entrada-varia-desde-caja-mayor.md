# Plan: anular una entrada/salida varia desde Movimientos de caja mayor (#692)

Repo: desktop. Sin cambios en el central. Rama `fix/caja-mayor-anular-entrada-varia` desde `origin/develop`.

## 1. El problema [verificado leyendo]

En `caja-virtual-dashboard.component.ts`, una fila con `origenTipo = 'ENTRADA_VARIA'` muestra **Anular**
(`esAnulable` no la excluye) y `onAnular` la manda por la rama genérica `cajaVirtualService.onAnularMovimiento(mov.id)`.
`TesoreriaService.anular` (central) solo acepta `MANUAL`, `MALETIN` y `VUELTO`, y responde «Este movimiento proviene de
ENTRADA_VARIA; anúlelo desde su módulo de origen». El usuario confirma y recibe un error.

La vía correcta ya existe: `EntradaVariaService.onAnular(id, motivo, opciones)` → `anularEntradaVaria` → central
`EntradaVariaService.anular`, que lockea la entrada, rechaza «La entrada/salida ya está anulada», aplica el límite de
días (`requireDentroDelLimiteDeAnulacion`), revierte el movimiento con `TesoreriaService.revertir` (que exige escritura
sobre la caja) y marca `anulado = true`. El resolver exige `requireOperarCaja` (GESTIONAR o CAJA).

El movimiento de una entrada varia lleva `origenId = referenciaId = entrada.id` (central `EntradaVariaService.registrar`)
y la query de movimientos ya trae `origenId` (`caja-virtual/graphql/graphql-query.ts`).

## 2. Cambio (una fase, un archivo)

`caja-virtual-dashboard.component.ts`:
- Id de la entrada: `mov.origenId ?? mov.referenciaId` (el central setea los dos al mismo valor; respaldo pedido por
  la auditoría A). Sin ninguno de los dos, la fila sigue por la rama genérica como hoy (caso teórico: todo movimiento
  ENTRADA_VARIA nace con los dos, `EntradaVariaService.java:69-71`).
- `claveAnulacion`: `ENTRADA_VARIA:<id de la entrada>`.
- `onAnular`: rama `esEntradaVaria` (misma condición), con título «Anular entrada/salida varia», mensaje propio y
  éxito «Entrada/salida varia anulada». Llama `yaAvisado(entradaVariaService.onAnular(<id de la entrada>, undefined,
  sinExitoGenerico))`: va por `onSaveCustom` igual que retiro y operación financiera, así que el rechazo y el error de
  red ya los avisa el genérico. Sin motivo, igual que las otras ramas (el central pone «anulación de entrada varia»).
- Inyectar `EntradaVariaService`.
- `esAnulable`: **sin cambio**. Ya exige `puedeOperar` = `TESORERIA GESTIONAR` o `TESORERIA CAJA`, lo mismo que
  `requireOperarCaja`. El rol acotado (CAJA sin GESTIONAR) puede anular entradas varias en el central, así que no se
  le esconde.

Tras anular, `terminar()` relee movimientos y saldos (comportamiento existente de todas las ramas).

## 3. Lo que no cambia
- El central (todo lo que pide la aceptación ya está ahí).
- `list-entradas-varias-dialog` (sigue anulando con su motivo «ANULADO DESDE ESCRITORIO»).
- Otros orígenes que podrían tener el mismo síntoma (filas con `origenTipo` de un módulo dueño que no es pago
  consolidado, retiro ni operación financiera): fuera de la issue; se revisa en la auditoría si existen y se anota.

## 4. Datos nuevos
Ninguno.

## 5. Tests
- Batería: N/A para desktop (el CI no corre Karma; el dashboard no tiene spec). Gate: `npm run check`.
- Prueba por pantalla (central local 8081 dev + desktop `ng serve -c web`, usuario MR):
  1. Registrar una entrada varia y una salida varia en una caja; anular cada una desde *Movimientos de caja mayor*:
     aparece el ajuste en contra, el original tachado, el saldo vuelve, y en *Entradas/salidas varias* figura anulada.
  2. Segunda anulación con la tabla vieja (otra pestaña sin releer): aviso «La entrada/salida ya está anulada», relee.
  3. Límite de días: entrada con `creado_en` viejo por SQL y límite configurado: aviso del límite, no anula.
  4. Rol acotado: usuario con solo `TESORERIA CAJA` (rol temporal por `usuario_role`) ve el botón y anula.
  5. Regresión: anular un movimiento MANUAL sigue andando por la rama genérica; tras anular una entrada, otra entrada
     de la misma caja sigue anulable (la clave es por entrada).
  6. Sin respuesta (auditoría B): demorar la mutation con el parche de XHR por `variables.id` o el puerto 8099: un solo
     aviso, se relee la caja, la fila queda bloqueada hasta que la relectura termina bien.
  7. Doble clic rápido en «Sí, anular»: un solo contra-movimiento (verificar por SQL).
  8. Egreso vario con vuelto activo: aviso «anule primero los vueltos», no anula.
  9. Rol CAJA sin fila en `caja_virtual_acceso` para esa caja: aviso de permiso del central, no anula.
  Datos de prueba creados en la base local se dejan anulados (no llegan a prod).

## 6. Auditoría del plan (paso 5)
- Eje A: `anularEntradaVaria` existe en el central de develop, release/beta y master; sin cambios de contrato, enum,
  tabla replicada ni variables. Medio: el rol CAJA ve el botón aunque el ACL no le dé escritura en esa caja → lo
  rechaza el central, igual que en las demás ramas; se prueba (punto 9). Otros orígenes con el mismo síntoma (RRHH_*,
  VENTA_CREDITO_COBRO, DEVOLUCION, GASTO no consolidado): anotado, fuera de esta issue, sin abrir vías de anulación de
  vales o egresos de RRHH desde la caja.
- Eje B: sin datos ni migración; la doble anulación la cortan dos locks del central; sin respuesta queda igual que
  retiro y operación financiera. Medio: faltaba probar la rama sin respuesta (punto 6). Bajos: doble clic, vueltos,
  regresión de la clave (puntos 5, 7, 8).

## 7. Sin verificar
- Comportamiento en Electron (no cambia nada propio de Electron).
