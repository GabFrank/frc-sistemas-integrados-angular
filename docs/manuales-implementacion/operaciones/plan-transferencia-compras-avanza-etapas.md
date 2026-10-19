# Plan — el rol de compras avanza todas las etapas de una transferencia

Pedido de Franco (2026-10-19): quien tenga el rol de compras ve **todos** los botones de avance
dentro de una transferencia, hasta concluir la recepción, sin importar en qué sucursal esté ni quién
sea el responsable de la etapa. El resto de los usuarios sigue igual.

- Rol: **`VER STOCK COMPRAS`** (elegido por Franco). En bodega lo tienen 8 usuarios (consulta de
  solo lectura a `personas.usuario_role`, 2026-10-19). Es el mismo rol que ya libera la sucursal
  COMPRAS en transferencias. En la base local no está sembrado: hay que asignarlo para probar.
- Piezas: **desktop** y **mobile-pwa**. Un PR por repo, hacia `develop`.
- **Central y filial: N/A.** `avanzarEtapaTransferencia` (`TransferenciaGraphQL.java:375`) solo
  valida el orden de las etapas y el solicitante; no mira sucursal, responsable ni rol. Todos los
  controles que se levantan acá son de pantalla.
- ADMIN también queda exento: el helper de cada repo ya lo trata así (`MainService.tieneAlgunRol`
  en el desktop, `PERMISOS` con ADMIN en todas las áreas en la PWA).

## Qué esconde hoy cada botón

### Desktop — `edit-transferencia.component`

| Etapa → botón | Control actual |
|---|---|
| PRE_TRANSFERENCIA_ORIGEN → «Preparar para envio» | `puedePrepararEnvio` (origen, servidor o sucursal 0) |
| PREPARACION_MERCADERIA → «Finalizar» + confirmar ítems | `puedeEditar` (responsable de la etapa o nadie) |
| PREPARACION_MERCADERIA_CONCLUIDA → «Verificar para transporte» | ninguno |
| TRANSPORTE_VERIFICACION → «Iniciar transporte» + ítems | `puedeEditar` (ya abierto a todos en esta etapa) |
| TRANSPORTE_EN_CAMINO / EN_DESTINO → «Iniciar Recepción» | `isDestino` |
| RECEPCION_EN_VERIFICACION → «Finalizar» + ítems | `isDestino && puedeEditar` |

### PWA — `transferencia-detalle.page` + `etapas.ts`

Los botones de tomar etapa piden `puedeTomarEtapa` (responsable, nadie o llegar con el QR). Los de
cerrar una verificación piden `puedeEditarEtapa` (responsable o nadie). No hay control por sucursal.
El QR de la sucursal de destino al iniciar la recepción **se mantiene**: si se cancela no bloquea, y
si es de otra sucursal sí bloquea, porque eso indica que se está recibiendo en el lugar equivocado.

## Fases

### Fase 1 — desktop

- `esCompras = mainService.tieneAlgunRol([ROLES.VER_STOCK_COMPRAS])`, calculado una vez (campo, no
  función en el HTML).
- `puedePrepararEnvio ||= esCompras`, `puedeEditar ||= esCompras` (en `verificarEtapa`).
- HTML: «Iniciar Recepción» y «Finalizar» de recepción pasan de `isDestino` a
  `(isDestino || esCompras)`.
- Sin aviso extra al avanzar desde otra sucursal: se probó una confirmación propia y Franco pidió
  sacarla (2026-10-19). Queda la confirmación de etapa que el desktop ya tenía.
- Tests: N/A para desktop (no hay batería en ningún gate, §1 paso 7). Gate: `npm run check`.

### Fase 2 — mobile-pwa

- `ROLES.VER_STOCK_COMPRAS = 'VER STOCK COMPRAS'` en `roles.enum.ts`.
- `PERMISOS.transferenciaTodasLasEtapas = [ADMIN, VER_STOCK_COMPRAS]`.
- `puedeEditarEtapa(t, usuarioId, exento = false)`: con `exento` devuelve `true`.
  `puedeTomarEtapa` recibe y pasa el mismo `exento`.
- La página calcula `exento` con `RoleService.tieneAlgunRol(auth.roles(), PERMISOS.…)`.
- Tests: casos nuevos en `src/app/pruebas/transferencia-etapas.spec.ts` (el exento edita y toma una
  etapa ajena sin código; sin el flag todo sigue igual).
- Gates: `npm test` y `npm run build`. Bloque nuevo en `docs/PLAN_TESTEO_MANUAL.md`.

## Datos nuevos

Ninguno: no hay columnas, claves ni configuración nuevas. El rol ya existe en producción.

## Prueba de runtime

Con un usuario que tenga `VER STOCK COMPRAS` y no sea ADMIN, parado en una sucursal que no es origen
ni destino, recorrer una transferencia de punta a punta en el desktop (central local + `ng serve -c
web`) y en la PWA (`npm start`). Repetir con un usuario sin el rol para ver que los botones siguen
ocultos.

## Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| Quien toca el botón queda como responsable (`TransferenciaGraphQL.java:397`, `:432`). Si compras toma una etapa, el personal de la sucursal ya no la puede cerrar | A | **Aceptado**: es la regla actual («la etapa la trabaja quien la tomó»), y compras puede cerrarla. Se avisa a Franco |
| PWA: un QR de otra sucursal bloquea «Iniciar recepción» (`transferencia-detalle.page.ts:679`) | A | **Aceptado**: cancelar el escaneo no bloquea. Un QR de otra sucursal indica un error de lugar |
| El central acepta reenviar la etapa actual (`EtapaTransferencia.puedeAvanzarA`, `>=`). Dos personas en la misma etapa pisan las cantidades ya verificadas | B | **Preexistente**: hoy ya pasa con dos usuarios de la misma sucursal. Queda fuera de este PR y se le ofrece a Franco como fix aparte en el central |
| El desktop no tiene control de lugar para recibir desde otra sucursal | B | **Descartado por Franco**: se implementó una confirmación y pidió quitarla. Compras avanza con la confirmación de etapa de siempre |
| PWA: el exento cierra una etapa con ítems que verificó otro | B | **Aceptado**: es lo pedido. `accionHabilitada` sigue exigiendo cero pendientes |
| `frc-mobile` (Android) tiene su propio avance | A | **N/A para mobile**: está en mantenimiento y Franco pidió desktop y PWA |

## Qué queda sin verificar

- Asignar el rol en producción a quien corresponda es tarea de Franco o Gabriel (no es código).
- La lista de la PWA muestra las transferencias de la sucursal en sesión. Para abrir otra hay que
  entrar por QR o por enlace. No se cambia acá.
