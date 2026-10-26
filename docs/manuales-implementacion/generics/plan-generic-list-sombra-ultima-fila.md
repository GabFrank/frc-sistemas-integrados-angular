# Plan — sombra bajo la tabla de las listas (generic-list)

## Problema

En las pantallas de lista (ej. RRHH › Vales), con pocas filas la última fila no se distingue del
espacio vacío de abajo: la tabla y su caja tienen el mismo fondo (`--frc-superficie-tabla`),
`generic-list` le quita la sombra a la tabla (`box-shadow: none`, que también anula el
`mat-elevation-z2` de cada pantalla) y Material no dibuja el borde inferior de la última fila. Solo
se ve el límite cuando el hover pinta la fila.

## Cambio (una fase)

`src/app/shared/components/generic-list/generic-list.component.scss`, regla
`:host ::ng-deep .gl-tabla table.mat-mdc-table:not(td table)` (regla nueva): una sombra hacia
abajo con el token de tema `--frc-sombra` (oscuro 0.4, claro 0.15).

- Llega a las 74 pantallas que usan `app-generic-list`, de una vez.
- No duplica intensidad: ninguna `list-*` define sombra propia en la tabla (grep de `box-shadow`
  en `list-*/*.scss`: solo tarjetas, chips y botones). El `mat-elevation-z2` de las pantallas ya
  queda anulado por esta misma regla y lo sigue estando.
- Fuera de alcance: tablas fuera de `generic-list` (diálogos, PDV).

## Datos nuevos

Ninguno.

## Tests

N/A para desktop porque su CI no corre tests (ver ciclo §1 paso 7). Gate: `npm run check`.
Prueba por pantalla: Vales filtrado con pocas filas (oscuro y claro), una lista que scrollea
(paginador pegado abajo, sin sombra rara) y el hover.

## Sin verificar

Cómo se ve en cada una de las 74 pantallas; se revisan Vales y dos más.

## Auditoría (paso 5)

- **Eje A:** el selector es descendente y alcanzaba tablas anidadas en filas de detalle
  (`list-sector.component.html:139`, zonas con `mat-elevation-z8`). → La sombra va en una regla
  aparte con `:not(td table)`; las anidadas siguen con `box-shadow: none`. Duda de `!important` en
  `mat-elevation-z*`: verificado en el tema de Material 15, no lo lleva → no hay duplicación.
- **Eje B:** con blur parejo, el `overflow: auto` de `[table]` recorta la sombra a los costados.
  → Spread negativo. Probado en pantalla: `0 3px 4px -2px` quedaba casi invisible; valor final `0 4px 6px -2px var(--frc-sombra)`. Con 0 filas queda la sombra
  bajo el encabezado: se acepta. Paginador sticky (`z-index: 2`) queda encima.

## Resultado

- **Prueba por pantalla** (desktop web de la rama contra el central alpha, solo lectura): Vales con
  9 filas en oscuro y claro, el corte de la última fila se ve sin hover; Sectores vacío (línea bajo
  el encabezado), con muchas filas (scroll normal) y con detalle expandido (las 66 tablas de zonas
  quedan con `box-shadow: none`, solo la de afuera lleva sombra).
- **Paso 8:** N/A los fijos 1 a 3 porque el diff es solo SCSS de `generic-list` (sin resolver, sin
  esquema, sin GraphQL); ningún condicional se dispara.
- **Paso 10:** `npm run check` exit 0. El aviso «8 rules skipped» es de Bootstrap (`:lang`), previo.
- **Paso 11:** N/A, no cambia ninguna convención documentada.
