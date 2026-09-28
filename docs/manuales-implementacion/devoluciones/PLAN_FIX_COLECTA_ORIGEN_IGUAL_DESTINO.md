# Plan — Colecta interna: no contar ni ofrecer devoluciones que ya están en el destino (#224)

Rama: `fix/colecta-omite-origen-igual-destino` (desde `origin/develop` @ `e94c2c5e`).
Pieza: **desktop** únicamente. Issue: GabFrank/frc-sistemas-integrados-angular#224.

## Problema (verificado en código)

- `colecta.component.ts` `onColectar()` cuenta los orígenes de **todas** las filas tildadas
  (`new Set(... f.origen)`, por **nombre**) sin compararlos con el depósito destino.
- Todas las filas vienen tildadas por defecto, incluida la que ya está en el destino.
- El central (`DevolucionService.colectarLinea`, `develop`) rechaza origen = destino con
  `"El deposito destino debe ser distinto a la sucursal de origen"`; `colectarEnBloque` devuelve esa
  fila con `ok=false`, borra la cabecera vacía y sigue. **El backend está bien, no se toca.**
- El snackbar final dice `"N colectada(s), M con error a X"` y descarta el `mensaje` del backend.

No hace falta tocar GraphQL: `devolucionFields` ya trae `sucursalOrigen { id nombre }` y la mutation
`colectarDevolucionesEnBloque` ya pide `resultados { id ok mensaje }`.

## Fase única — `fix(devoluciones): …` (un commit + push)

Archivos: `colecta/colecta.component.ts`, `colecta.component.html`, `colecta.component.scss`.

1. `FilaColecta` suma `origenId: number | null` y `enDestino: boolean`.
2. `aplicarDestino()`: se llama en `(ngModelChange)` del destino **y al final de
   `cargarSeparadas()`** (incluida la recarga tras colectar), y marca
   `enDestino = Number(origenId) === Number(destino.id)` — el `ID` de GraphQL puede llegar como
   string. Una fila que pasa a `enDestino` se destilda; una que deja
   de estarlo vuelve a tildarse (el default de la pantalla es "todo tildado").
3. Filas `enDestino`: checkbox `[disabled]`, fila atenuada y leyenda "ya está en el destino".
   `toggleTodas` solo actúa sobre filas colectables.
4. El conteo de orígenes del diálogo usa `origenId` (no el nombre) y solo filas seleccionadas y
   colectables. `ids` enviados al backend excluyen `enDestino` (defensa aunque no puedan tildarse).
   Si hay filas `enDestino`, el diálogo lo dice: "N devolución(es) ya está(n) en <destino> y no se
   colectan".
5. Snackbar: con fallos, `openWarn` muestra los `mensaje` distintos del backend
   (`"2 enviada(s) a X. 1 sin colectar: <motivo>"`) con duración 8 s. Sin fallos, igual que hoy.
6. De paso, por la regla "sin funciones/getters en bindings" (y porque el bloque se reescribe):
   `seleccionadas` (getter usado en el HTML) pasa a campos `cantidadSeleccionadas` /
   `todasSeleccionadas` recalculados en `recalcularSeleccion()` tras cada cambio.
   `todasSeleccionadas` es `false` si no hay filas colectables (evita el `0 === 0`).
   `mensaje` nulo del backend → "motivo desconocido".
7. **Puerta gemela** (hallazgo del eje A): la colecta individual desde *editar devolución*
   (`edit-devolucion.component.ts` `onColectar()` → `ColectarDialogComponent`) ofrece el mismo origen
   como destino y el backend lo rechaza con el mismo mensaje. `ColectarDialogData` suma
   `sucursalOrigenId?`; el diálogo lo excluye de la lista; `edit-devolucion` lo pasa.
   Archivos extra: `colectar-dialog.component.ts`, `edit-devolucion.component.ts`.

### Datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `FilaColecta.origenId` | `cargarSeparadas()` (de `sucursalOrigen.id`) | `aplicarDestino()`, `onColectar()` |
| `FilaColecta.enDestino` | `aplicarDestino()` | template (disabled/leyenda), `toggleTodas`, `recalcularSeleccion`, `onColectar` |
| `cantidadSeleccionadas`, `todasSeleccionadas` | `recalcularSeleccion()` | template (botón y checkbox de cabecera) |

Nada persiste: ni columna, ni migración, ni campo GraphQL.

### Tests

`N/A para desktop porque su CI no corre tests y no hay batería confiable [ev: .github/workflows/ci.yml
— ningún paso de test]`. Gate: `npm run check` (AOT) leído del log. Prueba de runtime: `ng serve -c
web` contra central local (8081, perfil `dev`) con devoluciones `SEPARADO` reales de la base local.

## Casos de prueba manual

1. Destino = sucursal que tiene separadas → esas filas aparecen destildadas, deshabilitadas y con la
   leyenda; el botón cuenta solo las demás.
2. Cambiar el destino a otra sucursal → la fila vuelve a habilitarse y tildarse; las del nuevo
   destino se deshabilitan.
3. Tildar/destildar todo desde la cabecera → no toca las filas `enDestino`.
4. Selección de 2+ orígenes → el diálogo cuenta solo orígenes colectables y menciona las excluidas.
5. Fallo del backend (p. ej. devolución ya colectada desde otra pestaña) → snackbar con el motivo.
6. Destino = único origen presente → ninguna fila colectable: botón "(0)", checkbox de cabecera
   sin tildar.
7. Colectar y recargar → las filas del destino siguen deshabilitadas (aplicarDestino tras recarga).
8. *Editar devolución* de una SEPARADO → "Enviar a depósito" no lista su propia sucursal de origen.

## Auditoría del plan (paso 5)

Dos auditores Sonnet, sin verse, 2026-09-28.

**Eje A — contrato y propagación**
- MEDIA · puerta gemela en `ColectarDialogComponent` / `edit-devolucion` → **aplicado** (punto 7).
- BAJA · backend de beta/prod sin el rechazo origen=destino → **descartado**: el rechazo viene de
  `b885580a`, ancestro de `origin/master` y `origin/release/beta` (≥ v4.10.0).
- BAJA · contrato GraphQL → confirmado sin cambios (`devolucionFields`, `resultados{id ok mensaje}`).
- BAJA · otros clientes → mobile-pwa no ofrece colectar (`devolucion-detalle.page.ts:32`); mobile no
  tiene colecta. Nada que propagar.

**Eje B — reversibilidad y estado**
- Sin migración, sin DML, sin cambio de contrato: desktop viejo ↔ backend nuevo y viceversa siguen
  andando; rollback = revertir el commit.
- ALTA · `aplicarDestino` debe correr también tras `cargarSeparadas` → **aplicado** (punto 2, caso 7).
- MEDIA · `===` entre ids que pueden ser string/number → **aplicado** (`Number()` en ambos lados).
- MEDIA · checkbox de cabecera tildado sin colectables → **aplicado** (punto 6, caso 6).
- MEDIA · doble click → ya cubierto por `[disabled]="colectando"`; se mantiene.
- BAJA · `mensaje` nulo → **aplicado** (fallback).

## Qué queda sin verificar

- Impresión, IPC y auto-update: no aplica (pantalla sin Electron).
- El comportamiento con más de 200 separadas (la página de la query está fija en 200): preexistente,
  fuera de alcance.
