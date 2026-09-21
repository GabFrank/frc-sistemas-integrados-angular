# Plan — fix #327: la regla de tamaño del diálogo de últimas ventas se filtra a todos los diálogos

- Issue: GabFrank/frc-sistemas-integrados-angular#327
- Rama: `fix/ui-dialogo-ultimas-ventas-min-width` (desde `origin/develop` @ `cb180e48`)
- Pieza: **desktop** únicamente. Sin backend, sin GraphQL, sin migraciones, sin Electron main.

## Causa

`ultimas-ventas-dialog.component.scss` declara, sin anclar al host:

```scss
::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface { min-width: 800px; max-width: 90vw; max-height: 90vh; }
@media (max-width: 768px) { ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface { min-width: 100%; } }
::ng-deep.mat-mdc-row:hover .mat-mdc-cell { background-color: rgba(255,255,255,.04); }
```

Angular inyecta el `<style>` del componente la primera vez que lo renderiza y no lo quita nunca.
`::ng-deep` sin `:host` delante compila a un selector global, así que desde la primera apertura del
diálogo (PDV → F1 → Reimpresión / Cancelación de venta) **toda superficie de diálogo** de la sesión
queda con `min-width: 800px`, y todas las filas de `mat-table` con ese hover.

El diálogo de conceptos de liquidación (`width: '560px'`, `panelClass: 'liquidacion-concepto-panel'`,
`overflow: hidden` en `styles.scss`) recorta los 240px sobrantes: se pierden Guardar/Cancelar.

### Por qué no sirve `:host ::ng-deep …` (opción 1 de la issue)

La superficie (`.mat-mdc-dialog-container .mdc-dialog__surface`) es **ancestro** del host del
componente, no descendiente. Un selector que empieza en `:host` nunca la alcanza: la regla dejaría de
filtrarse, pero tampoco aplicaría al propio diálogo de últimas ventas. La forma correcta es la
opción 1b: un `panelClass` propio + la regla en `src/styles.scss`, igual que
`.liquidacion-concepto-panel` / `.historial-conteo-panel` / `.modificar-sucursal-dialog`.

## Fases

Una sola fase (el diff es chico, ~25 líneas en 3 archivos).

### Fase 1 — `fix(pdv): acotar el tamano del dialogo de ultimas ventas a su propio panel`

1. `utilitarios-dialog.component.ts`: los dos `open(UltimasVentasDialogComponent, …)`
   (`cancelacionVenta` y `reimpresionVenta`) suman `panelClass: "ultimas-ventas-panel"`.
   Son los **únicos** que abren ese componente (grep de `UltimasVentasDialogComponent`: solo
   `utilitarios-dialog` y la declaración en `operaciones.module.ts`).
2. `ultimas-ventas-dialog.component.scss`:
   - borrar las dos reglas de superficie (la base y la del `@media`);
   - acotar el hover: `:host ::ng-deep .mat-mdc-row:hover .mat-mdc-cell` (las filas están en el
     template propio, así que con `:host` sigue aplicando a esta tabla y deja de tocar las demás).
3. `src/styles.scss`: bloque nuevo junto a los otros paneles de diálogo:
   ```scss
   .ultimas-ventas-panel {
     .mat-mdc-dialog-container .mdc-dialog__surface { min-width: 800px; max-width: 90vw; max-height: 90vh; }
     @media (max-width: 768px) { .mat-mdc-dialog-container .mdc-dialog__surface { min-width: 100%; } }
   }
   ```
   Mismo contenido que la regla vieja: el diálogo de últimas ventas se ve **idéntico**.

### Tests de la fase

- `N/A para desktop` la regla «revertir el fix y ver que el test falla»: el CI no corre tests y no
  hay batería confiable (ciclo §1 paso 7; `ci.yml` sin paso de test; memoria: Karma no arranca en
  esta máquina). Un estilo de cascada tampoco es testeable con Karma de forma útil.
- Gate: `npm run check` (AOT), leído del log.
- Prueba de runtime en local (`npm run ng:serve` + Chrome), reproduciendo la issue:
  1. PDV → F1 → Reimpresión de ticket → cerrar. Verificar que el diálogo de últimas ventas se
     ve igual que antes (ancho ≥ 800px, tabla con scroll, botón salir anclado).
  2. RRHH → Configuración → Conceptos de liquidación → + Adicionar: se ven Guardar y Cancelar
     dentro del panel de 560px. Editar un concepto: idem.
  3. En el DOM: `.mat-mdc-dialog-surface` del diálogo de conceptos sin `min-width: 800px`.
  4. Una tabla cualquiera fuera del diálogo después del paso 1: la celda en hover ya no lleva el
     velo blanco al 4% (efecto casi imperceptible: la fila ya se pinta `#3b883f !important` desde
     `styles.scss:371`; el velo va sobre la celda, encima de ese verde).
  5. Cancelación de venta (segundo `open`) con el panel nuevo.
  6. Verificación que distingue viejo de nuevo (auditoría eje B): tras abrir y cerrar Reimpresión,
     en el diálogo de conceptos `getComputedStyle(document.querySelector('.liquidacion-concepto-panel .mdc-dialog__surface')).minWidth`
     no es `800px`, y el `getBoundingClientRect().right` de Guardar es ≤ al del
     `.cdk-overlay-pane.liquidacion-concepto-panel`. Con el código viejo da `800px` y el botón
     queda afuera (lo midió la issue: 1460 > 1240).

## Tabla de datos nuevos

| Dato | Escritor | Lector |
|---|---|---|
| clase CSS `ultimas-ventas-panel` | `UtilitariosDialogComponent.cancelacionVenta` / `reimpresionVenta` (`panelClass`) | `src/styles.scss` `.ultimas-ventas-panel` |

Sin campos, columnas ni claves de configuración.

## Fuera de alcance (anotado, no se hace en este PR)

- **`search-list-dialog.component.scss:484`**: `::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface { border-radius: 10px !important; }`,
  la misma filtración. Pero `SearchListDialogComponent` se abre desde ~50 lugares, así que en la
  práctica ya es el radio de **todos** los diálogos de casi toda sesión. Acotarlo cambia la
  apariencia de la app entera y no hace perder contenido. Se propone como issue aparte (decidir si
  se promueve a regla global explícita en `styles.scss` o se acota).
- **Punto 2 de la issue** (`overflow: hidden` en `.liquidacion-concepto-panel` /
  `.historial-conteo-panel`): se deja. Es lo que hace que la banda de color llegue a los bordes
  redondeados; con la causa corregida no recorta nada. Quitarlo sería tapar el síntoma.
- Otros `::ng-deep` globales del repo (form fields, steppers, sliders…): un barrido por selectores
  de diálogo (`mat-mdc-dialog*`, `mdc-dialog__surface`, `cdk-overlay-pane`) sin `:host`, incluidos
  los bloques `::ng-deep { … }` a nivel raíz, halló 7 archivos, y solo estos dos filtran sin
  acotar (los otros usan `:host` o un panelClass propio). El resto de
  filtraciones no es de diálogo y no entra en este fix.

## Riesgo y reversibilidad

- Riesgo **bajo**: CSS puro + una propiedad de `MatDialogConfig`. Rollback = revertir el commit.
- Cambio visible buscado: diálogos angostos abiertos después de últimas ventas vuelven a su ancho.
  El hover de tablas ajenas pierde un velo al 4% casi imperceptible.
- Auto-update: no toca `installer.nsh`, `electron-builder.json` ni manifests.
- Commit `fix(...)` → libera patch en alpha al mergear a `develop`.

## Qué queda sin verificar

- Windows/Electron: la prueba es en `ng serve -c web`. El CSS es el mismo en Electron (Chromium),
  el CI compila AOT en Windows y Linux.
- Pantallas < 768px de ancho: el `@media` se preserva tal cual; no hay equipo con esa resolución
  para probar, se verificaría achicando la ventana.

## Auditoría del plan (paso 5)

Dos auditores (sonnet), sin verse, ejes A y B de §2.1 adaptados a CSS.

| # | Eje | Hallazgo | Qué se hizo |
|---|---|---|---|
| A1 | A | «El hover filtrado ya era inerte: `styles.scss:371` lleva `!important`» | **Rechazado en parte** tras leer el código: `:371` pinta la fila, la regla filtrada pinta la celda; no compiten. El efecto existe pero es mínimo → se corrigió la expectativa en pruebas y riesgo |
| A2 | A | Ningún diálogo post-reimpresión depende del min-width 800 (`cerrarCaja` 90%, `retiro`/`gasto` 100%, `garantia` contenido de 250px) | Confirma el plan |
| A3 | A | `utilitarios-dialog` es el único que abre `UltimasVentasDialogComponent` | Confirma el plan |
| A4 | A | El barrido halló 7 archivos con `::ng-deep` de diálogo; 5 acotados (`:host` o panelClass propio) | Confirma: solo 2 filtran sin acotar. Redacción precisada |
| A5 | A | DOM MDC 15 verificado; MDC hereda `min-width: inherit` hasta la surface | Confirma el selector |
| B1 | B | Especificidad nueva 0,3,0 > regla MDC 0,2,0 (`dialog-container.mjs:222`); gana sin depender del orden de inyección | Confirma; sin `!important` |
| B2 | B | `@media` anidado compila con `sass` local | Confirma |
| B3 | B | Filas/celdas en el template propio: `:host ::ng-deep` sigue aplicando | Confirma |
| B4–B5 | B | Diálogo idéntico (width/height inline en el pane); sin estado persistido, revert limpio | Confirma |
| B6 | B | Verificación DOM que falla con el código viejo | **Aplicado**: prueba 6 |
| B7 | B | Si un `open` queda sin `panelClass`, «vuelve a filtrar» | **Corregido**: ya no filtraría (la regla deja de ser global), ese diálogo solo perdería su min-width. Igual se verifican los dos `open` (prueba 5) |

## Estado de pasos del ciclo

- Paso 5: hecho (tabla de arriba). Paso 9: batería `N/A para desktop` (ver arriba); gate `npm run check`.
- Paso 10: `npm run check`. Paso 11: sin doc de dominio que actualizar (el plan se borra en el PR final).
