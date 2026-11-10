# Plan — buscador de funcionario: solo activos en las altas de RRHH

Rama: `fix/rrhh-buscador-solo-activos` (desde `develop` 517616bf). Pieza: desktop. Sin cambios de backend.

## Problema

Al cargar un vale (y en el resto de las altas de RRHH) el buscador de funcionario ofrece también a
los egresados. `app-select-funcionario` ya tiene `[soloActivos]`, que viaja como variable
`soloActivos` a `funcionariosSearchPage` / `funcionariosACargo` (central y filial filtran en la
query; el filial tiene default `false`). Hoy solo lo pasan la carga de bono (`32529e95`) y generar
liquidación, esta última solo para el rol RRHH SUCURSAL (`[soloActivos]="acotado"`, de `67f0e409`).

## Decisiones (Franco, 2026-11-10)

- **Solo activos** en los diálogos que **dan de alta** algo para un funcionario.
- Los **filtros de las listas** (vales, préstamos, bonos, penalizaciones, horas extra, justificativos,
  vacaciones, aguinaldos) **siguen mostrando a todos**: sirven para consultar el historial de un egresado.
- **Finiquito: elegir funcionario** (`list-liquidacion`) sigue con `soloActivos: false` a propósito:
  es la vía para ver el finiquito pagado de un egresado.

## Fase 1 — un commit

### 1a. Buscador solo activos

| Archivo (`src/app/modules/rrhh/…`) | Cambio |
|---|---|
| `vale/edit-vale-dialog/edit-vale-dialog.component.html` | `[soloActivos]="true"` `[descartarInactivo]="true"` |
| `prestamo/edit-prestamo-dialog/edit-prestamo-dialog.component.html` | idem |
| `hora-extra/edit-hora-extra-dialog/edit-hora-extra-dialog.component.html` | idem |
| `penalizacion/edit-penalizacion-dialog/edit-penalizacion-dialog.component.html` | idem |
| `justificativo/edit-justificativo-dialog/edit-justificativo-dialog.component.html` | `[soloActivos]="!esEdicion"` `[descartarInactivo]="!esEdicion"` (editar uno existente de un egresado sigue andando) |
| `bono/edit-bono-dialog/edit-bono-dialog.component.html` | ya tiene `soloActivos`; agregar `descartarInactivo` solo para un bono nuevo («Nueva» de `list-bono.component.ts:103` también preselecciona el filtro; editar uno existente no descarta) |
| `legajo/informacion-general/informacion-general.component.html` («Supervisado por») | `[soloActivos]="true"` solo (sin descartar: es dato guardado del legajo) |

### 1b. Preselección desde el filtro de la lista

«Nueva» en las listas abre el diálogo con `data.funcionarioId` = el del filtro, que puede ser un
egresado: el alta pasaría sin pasar por el buscador. `SelectFuncionarioComponent` gana
`@Input() descartarInactivo = false`: si al resolver la preselección por id el funcionario viene con
`activo === false`, se limpia el campo y se emite `null` (el control queda vacío y `required`).
Opt-in porque en el legajo y en un justificativo existente el funcionario preseleccionado es dato
guardado y no se puede borrar en silencio.

### Fuera del plan (verificado)

- **Generar liquidación** queda como está (`[soloActivos]="acotado"`): el finiquito
  (`LiquidacionFinalCalculator`: indemnización + vacaciones + aguinaldo) no paga los días trabajados del
  mes de egreso; ese sueldo sale de la liquidación mensual, y `generarLote` acepta ids explícitos de un
  egresado. Con `true` se cerraría esa vía.
- Altas de otros módulos con `buscador-field tipo="funcionario"` (gastos, caja virtual, maletín): no son RRHH.
- Ruta `rapido` del preset con `soloACargo` usa la búsqueda general (sin alcance): no alcanzable desde
  `app-select-funcionario` (no tiene campo rápido). Riesgo latente, no se toca acá.

Datos nuevos: ninguno (sin columnas, claves ni variables GraphQL; `descartarInactivo` es un input
de componente: lo escriben los 5 diálogos, lo lee `cargarPreseleccionado`).

## Tests

- N/A batería automática para desktop porque su CI no corre tests (`ci.yml` sin paso de test).
- Gate: `npm run check` (AOT) leído del log.
- Prueba por pantalla (desktop web contra central local 8081), con un funcionario pasado a
  `activo=false` en la base local y restaurado al final:
  - en vale, préstamo, hora extra, penalización, justificativo (nuevo), bono y supervisor: buscarlo por
    nombre → no aparece; un activo → aparece y se elige;
  - filtrar la lista de vales (y las otras 4) por el egresado → aparece; «Nueva» → campo vacío;
  - editar un justificativo existente del egresado → muestra su nombre y guarda;
  - legajo con supervisor egresado → lo sigue mostrando;
  - Finiquito: elegir funcionario → el egresado aparece.

## Qué queda sin verificar

- ~~`activo` NULL en producción~~: verificado el 2026-11-10 en bodega (solo lectura): 150 `true`, 416 `false`, 0 NULL.
- Filial anterior a `v5.0.0-alpha.48` sin `funcionariosSearchPage`: falla igual hoy (no es riesgo nuevo).

## Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| «Nueva» desde un filtro de egresado lo preselecciona | A | 1b, verificado en `list-vale.component.ts:117` y 4 listas más |
| Liquidación mensual del mes de egreso es legítima | A | generar liquidación fuera del plan (verificado en el calculador) |
| `activo` NULL queda fuera con `soloActivos` | B | verificado en prod: 0 NULL |
| Imprecisión sobre la ruta `rapido` con `soloACargo` | A | corregido en «Fuera del plan» |
| Supervisor egresado ya guardado | B | sin `descartarInactivo` en el legajo |
| Filial viejo sin la variable | B | no es nuevo (bono ya la manda) |
