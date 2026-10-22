# Plan: listas de RRHH vuelven a la página 1 al filtrar

Issue: #574 (fase RRHH). Rama: `fix/rrhh-listas-volver-pagina-1`. Pieza: **desktop** solamente.

## Problema

En las 14 listas paginadas de RRHH, `onFiltrar()` busca con el `pageIndex` actual. El usuario está en la
página X, cambia un filtro (select, Enter, botón Filtrar del `app-generic-list`, cargo) y la consulta pide la
página X del resultado nuevo: si ese resultado tiene menos páginas, la tabla queda vacía. `onResetFiltro()`
pone `pageIndex = 0`, pero no el `mat-paginator` (ninguno enlaza `[pageIndex]`), así que el paginador sigue
marcando la X. En Funcionarios, `onResetFiltro()` ni siquiera reinicia `pageIndex`.

## Solución

El patrón de `productos/producto/list-producto` (`onFiltrar` reinicia, `onSearchProducto` busca), en cada
componente:

1. Se renombra el `onFiltrar()` actual a `buscar()`: la consulta con la página vigente.
2. `onFiltrar()` nuevo: `pageIndex = 0`, `paginator.pageIndex = 0` (con guarda `if (this.paginator)`), y
   `buscar()`.
3. Pasan a `buscar()` los llamadores que **no** son un filtro y deben conservar la página: `ngOnInit`,
   `handlePageEvent` y la recarga después de guardar, editar, anular, pagar, etc.
4. Siguen en `onFiltrar()` los que sí son filtro: `(filtrar)` del `app-generic-list`,
   `(selectionChange)`, `(keyup.enter)`, `onResetFiltro()` y, en Funcionarios, `onSelectCargo()` (ya lo
   llama: no se toca). El template no cambia.
5. Funcionarios: el `onFiltrar()` del `setTimeout` de `ngOnInit` pasa a `buscar()`. La doble consulta de
   arranque (`_changePageSize` emite `page` → `handlePageEvent`, y después el `buscar()` del `setTimeout`) es
   preexistente y no se toca.
6. Altas y procesos que crean filas (`onNuevo`, aguinaldo `onCalcular`, liquidación `onGenerar`) siguen
   recargando con `buscar()` en la página actual, como hoy: es una recarga, no un filtro.

`onResetFiltro()` deja de asignar `pageIndex = 0` a mano y llama a `onFiltrar()`.

No se usa `paginator.firstPage()`: emite `page` → `handlePageEvent` → segunda consulta.

## Archivos (fase única)

Carpetas bajo `src/app/modules/`; el archivo es `<carpeta>/<nombre>.component.ts` (por ejemplo
`rrhh/bono/list-bono/list-bono.component.ts`):

| Pantalla | Componente |
|---|---|
| Aguinaldos | `rrhh/aguinaldo/list-aguinaldo` |
| Bonos | `rrhh/bono/list-bono` |
| Configuración RRHH | `rrhh/configuracion-rrhh/list-configuracion-rrhh` |
| Feriados | `rrhh/feriado/list-feriado` |
| Horas extra | `rrhh/hora-extra/list-hora-extra` |
| Justificativos | `rrhh/justificativo/list-justificativo` |
| Liquidaciones | `rrhh/liquidacion/list-liquidacion` |
| Motivos de vale | `rrhh/motivo-vale/list-motivo-vale` |
| Penalizaciones | `rrhh/penalizacion/list-penalizacion` |
| Préstamos | `rrhh/prestamo/list-prestamo` |
| Tipos de justificativo | `rrhh/tipo-justificativo/list-tipo-justificativo` |
| Vacaciones | `rrhh/vacacion/list-vacacion` |
| Vales | `rrhh/vale/list-vale` |
| Funcionarios | `personas/funcionarios/list-funcioario` |

Solo cambian los `.component.ts`. Fuera de alcance: `list-liquidacion-concepto` (sin paginador),
`list-solicitud-recuperacion` (PARCIAL en la issue: va con la fase de las «a medias») y el resto de módulos
de la issue.

## Tabla de datos nuevos

N/A para desktop porque no nace ningún campo, columna ni clave: solo cambia qué página se pide.

## Migraciones / backend

N/A: no toca central ni filial; las queries y su firma no cambian.

## Tests

- Batería: N/A para desktop porque su CI no corre tests y no hay batería confiable
  [ev: ciclo §1 paso 9; `.github/workflows/ci.yml`]. Gate: `npm run check` (AOT) leído del log.
- Prueba por pantalla, en local (central 8081 perfil `dev` + `ng serve -c web`), en **cada una de las 14**:
  0. Antes: `count(*)` sin filtro y con el filtro elegido; tiene que dar **> 15 y ≤ 15** (el pageSize mínimo
     es 15). Si no, sembrar filas de prueba por SQL (marcadas para borrarlas al final) hasta que dé. Tabla
     de filtro por pantalla en el informe de pruebas.
  1. Ir a una página > 1 (con pageSize 15 si hace falta para tener varias páginas; datos por SQL si no
     alcanzan).
  2. Cambiar un filtro que achique el resultado → la tabla muestra la página 1 con datos y el paginador
     dice página 1.
  3. Botón Limpiar estando en página > 1 → página 1, paginador en 1.
  4. Paginar adelante/atrás → sigue funcionando (no vuelve a la 1).
  5. En una lista con acción (editar/anular/pagar) desde página > 1 → al recargar se queda en esa página.
  6. Funcionarios: elegir cargo con el buscador y quitarlo con la X desde página > 1 → página 1.
  7. Filtros de texto con Enter (Configuración, Feriados, Liquidaciones, Funcionarios): probar el Enter además
     del select.
  - Evidencia dura además de la visual: en la red, la query del filtro sale con página 0.
  - Contraste: una pantalla (Vales) con el código de `origin/develop` (otro worktree, no `git stash`) muestra
    la tabla vacía con los mismos datos y pasos; con la rama, no.

## Qué queda sin verificar / fuera de alcance

- Preexistente, no se arregla acá: (a) respuestas fuera de orden: si una consulta de la página X llega
  después de la de la página 0, la pisa (ninguno de los 14 tiene secuencia como `busquedaSeq` de
  list-producto); (b) anular/eliminar el único ítem de la última página deja la tabla vacía, porque la
  recarga conserva la página. Se documentan en la prueba para no confundirlos con regresión.

- Electron (impresión, IPC): no se toca. Lo que no se pueda ejercitar por pantalla se reporta antes de
  cerrar, no se deja como «cubierto por lectura».
