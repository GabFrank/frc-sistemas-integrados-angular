# Fix — `closeDialog()` sin `requestId` cierra el spinner de otra request (#319)

Rama: `fix/cargando-close-dialog-id` (desde `origin/develop`, con #320). Pieza: **desktop**.

## Diagnóstico (paso 3)

`CargandoDialogService.closeDialog(requestId?)` (`shared/components/cargando-dialog/cargando-dialog.service.ts:66`)
sin id cierra `dialogRequests.keys().next().value`: el primer spinner pendiente, que puede ser de otra
request. El del llamador queda hasta el timer de seguridad (`TIMEOUT_POR_DEFECTO_MS + 5000` = 65 s) y el
ajeno desaparece antes de tiempo. En el PDV eso bloqueaba los atajos (#316).

Relevamiento (subagente + verificación, `grep -rnE "closeDialog\(\s*\)" src/app`, sin comentadas):
**66 llamadas en 22 archivos**. `pago-touch` ya se corrigió en #320. Ya usan el id: `generic-crud.service.ts`
(14), `tab.service.ts`, `adicionar-conteo-dialog`, `adicionar-caja-dialog`, `list-productos-vencidos`,
`list-producto`, `pago-touch`.

| Patrón | Casos | Arreglo |
|---|---|---|
| A · apertura y cierre en el mismo método | la mayoría | `const { requestId } = openDialog(...)` + `closeDialog(requestId)` |
| B · varios cierres (next/error/ramas) de una apertura | list-factura-legal (4), edit-factura-legal ngOnInit, adicionar-gasto, edit-transferencia (2), list-transferencia onDelete, ajustar-stock, ajustar-stock-lote, ajustar-costo | mismo `requestId` en todos |
| C · apertura en un método, cierre en otro | `edit-factura-legal-dialog`: `onGuardar` (`:213`) → `nominarFactura` (`:264`, `:273`); `adicionar-precio-dialog`: `continuarGuardado` (`:217`) → `guardarPrecio` (`:268`, `:273`); `create-item-dialog`: `ngOnInit` (`:53`) → `cargarDatos` (`:91`) | el id **como parámetro** del método que cierra (no campo de instancia: explícito y sin estado colgado) |
| D · cierre sin apertura propia | `adicionar-gasto-dialog.component.ts:571` (dentro de `gastoService.onSave`, que ya abre/cierra su spinner con id en `GenericCrudService`); `salida-dialog.component.ts:310` (tras `PdvSearchProductoDialogComponent`, que no usa el spinner; 30 usos más no cierran nada) | **borrar**: hoy solo pueden cerrar un spinner ajeno |
| E · una apertura, cierres desde un loop | `edit-devolucion` `onConfirmarCanje` (forEach concurrente), `list-transferencia` `onAsignarRuta` (secuencial, `finally`) | `requestId` local; la reentrancia por doble clic queda anotada, fuera de alcance |

Ramas que abren y **nunca** cierran (hoy las salva el fallback de otro flujo o el timer):
- `entrada-dialog` `onItemSave` (`:375`): si `itemFormGroup` es inválido o `res == null`.
- `entrada-dialog` `onDelete` (`:270-287`): abre antes de la confirmación; no cierra si se cancela ni si `res2` es falso (B2).
- `salida-dialog` `onDelete` (`:234`): si se cancela la confirmación.
- `salida-dialog` `onItemSave` (`:343-398`): formulario inválido, y **toda la rama de stock insuficiente** (`:357-378`: ni al cancelar ni al guardar) (B1).
- `create-item-dialog` `ngOnInit` (`:53`): rama `data.presentacion` (`:57-61`, cerrar **dentro** del `subscribe` de presentaciones, no en línea: B4), rama que cierra el diálogo, y `cargarDatos` con etapa distinta de `PRE_TRANSFERENCIA_CREACION/ORIGEN` (`:86`) (B3).
- `edit-transferencia` `onSaveTransferencia` (`:809-815`) y guardado de solicitante (`:1342-1347`): `subscribe` sin `error`; pasar a `finalize` como los pares de `:843` y `:1045` del mismo archivo (B5).

**Regla para estas ramas:** todo camino terminal (cancelar, inválido, error, respuesta vacía) cierra su
spinner. Para los guardados, `finalize(() => closeDialog(requestId))` en el `pipe`; para cancelar/inválido,
cierre explícito en esa rama.

**Ya en producción (B6):** `generic-crud.service.ts:369` (`onGetById`, handler de error) llama
`closeDialog(requestId)` aunque `requestId` sea `null` por `silentLoad`: hoy dispara el fallback y cierra
el spinner de otro flujo. La fase 4 (null = no-op) lo corrige sin tocar el archivo.

## Fases (un commit cada una)

1. **PDV y productos**: `delivery-dialog` (2), `garantia-dialog` (1), `producto.component` (3),
   `ajustar-stock-dialog` (2), `ajustar-stock-lote-dialog` (2), `ajustar-costo-dialog` (2),
   `adicionar-precio-dialog` (2, caso C).
   `fix(pdv): cerrar cada spinner de carga con su id en pdv y productos`
2. **Operaciones**: `edit-transferencia` (10), `list-transferencia` (3), `create-item-dialog` (1, C + rama
   sin cierre), `seleccionar-sucursal-dialog` (1), `entrada-dialog` (5 + rama sin cierre),
   `salida-dialog` (6, borrar `:310`, rama sin cierre en `onDelete`), `edit-devolucion` (2),
   `adicionar-detalle-compra-item-dialog` (1).
   `fix(operaciones): cerrar cada spinner de carga con su id`
3. **Financiero y resto**: `list-factura-legal` (8), `edit-factura-legal-dialog` (7, C),
   `adicionar-gasto-dialog` (4, borrar `:571`), `list-sector` (1), `actualizacion.service` (1),
   `funcionario.service` (1), `funcionario-wizard` (1).
   `fix(financiero): cerrar cada spinner de carga con su id`
4. **Service**: `closeDialog(requestId: number)` obligatorio; se borra el fallback «cerrar el primero»;
   con `null`/`undefined` no hace nada (lo usa `generic-crud` con `silentLoad`). El compilador impide
   volver a llamarlo sin argumento.
   `fix(core): closeDialog exige el id del spinner que cierra`

Regla de implementación: no cambiar la lógica de cada flujo más allá de capturar/pasar el id, salvo las 3
ramas sin cierre y los 2 cierres a borrar. Donde la apertura es condicional o está en un `try`, declarar
el id antes.

### Tabla de datos nuevos

N/A: `requestId` ya existe; solo se propaga.

### Tests

- Automatizados: N/A para desktop (sin batería en CI).
- Gate: `npm run check` leído del log, **después de la fase 4** (el compilador verifica que no quede
  ningún `closeDialog()` sin id). Además `grep -rnE "closeDialog\(\s*\)" src/app` vacío.
- Manual en local (se pueden crear datos), comprobando en consola que al terminar cada flujo
  `cargandoService.dialogRequests.size == 0` y no quedan spinners visibles:
  1. PDV: delivery-dialog (cargar datos, nuevo delivery).
  2. Productos: ajustar stock, ajustar costo, adicionar precio (con y sin principal — caso C).
  3. Transferencias: guardar transferencia e ítem, eliminar, asignar ruta.
  4. Entrada/Salida: abrir, guardar ítem con formulario inválido (rama que hoy no cierra), eliminar
     cancelando la confirmación (idem en salida).
  5. Factura legal: listar y una acción (cancelar); guardar factura electrónica con cliente (caso C → `nominarFactura`).
  6. Gastos: adicionar gasto (el cierre borrado no deja spinner colgado).
  7. Concurrencia: spinner ajeno abierto desde consola → correr uno de estos flujos → el ajeno sigue
     pendiente al terminar (antes lo cerraba).

## Auditoría del plan (paso 5)

| # | Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|---|
| A1 | A | Inventario completo: 29 archivos con `openDialog()` (7 ya correctos + 22 del plan); alias `cargandoDialog`, `cargandoService`, `cargandoDialogService` | — | Verificado |
| A2 | A | Ningún `closeDialog` con valor no numérico; sin usos en specs, e2e, `app/`; `electron-printer/` no existe en el repo | — | Verificado |
| A3 | A | Los `.spec.ts` están excluidos de `tsconfig.app.json`: el gate de la fase 4 no los cubre (hoy 0 usos) | baja | Anotado |
| A4 | A | Los 2 cierres a borrar no dependen de ninguna apertura | — | Verificado |
| A5 | A | `guardarPrecio()` tiene **4** llamadas (`:249`, `:253`, `:256`, `:260`), todas deben recibir el mismo id | baja | Instrucción de implementación |
| A6 | A | `closeAll`/`dialogSub` no usan el fallback | — | Verificado |
| B1 | B | `salida-dialog.onItemSave`: rama de stock insuficiente sin ningún cierre | alta | **Adoptado** |
| B2 | B | `entrada-dialog.onDelete`: no cierra al cancelar ni con `res2` falso | media | **Adoptado** |
| B3 | B | `create-item-dialog.cargarDatos`: etapa no contemplada no cierra | media | **Adoptado** |
| B4 | B | Rama `data.presentacion`: cerrar dentro del `subscribe`, no en línea (cierre prematuro) | media | **Adoptado** |
| B5 | B | `edit-transferencia` `:809` y `:1342` sin `error:` en el `subscribe` | baja | **Adoptado** (`finalize`) |
| B6 | B | `generic-crud.onGetById` cierra con `requestId` null en error: hoy roba el spinner ajeno | — | Lo corrige la fase 4 |
| B7 | B | Loops (`edit-devolucion`, `list-transferencia`): `const requestId` antes del loop queda en scope; cierres repetidos pasan a idempotentes | — | Verificado |

## Qué queda sin verificar

- Flujos con muchos call sites que no se ejercitan a mano (p. ej. las 10 de `edit-transferencia`): el
  cambio es mecánico y lo respalda el compilador tras la fase 4.
- Reentrancia por doble clic en `edit-devolucion.onConfirmarCanje` y `list-transferencia.onAsignarRuta`.

## N/A

- Migraciones / espejo / replicación: N/A para desktop, no toca persistencia.
- Multi-repo (§3): N/A, solo desktop.
- Rol (regla #10): N/A, no agrega pantalla ni botón.
