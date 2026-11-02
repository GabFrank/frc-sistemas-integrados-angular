# Plan — Cajas: Limpiar filtro no reinicia Verificado (#578)

Rama: `fix/caja-limpiar-filtro-verificado` (desde `origin/develop` 07c0dc40). Solo desktop.

## Problema

`ListCajaComponent.onResetFilter()` (`financiero/pdv/caja/list-caja`) reinicia todos los controles
menos `verificadoControl`. Ese valor sí se manda a `cajasWithFilters` (`buscar()`), así que después
de Limpiar la lista sigue filtrada por verificado Sí/No.

`activoControl` (checkbox Abiertas/Cerradas/TODAS) está en pantalla pero el central no tiene
parámetro `activo` en `cajasWithFilters` (`pdv-caja.graphqls:78`): nunca filtró. Decisión de Franco
(22/10): no se toca en este PR, va a una issue aparte.

## Fase 1 — `fix(caja)`

En `onResetFilter()`, antes de la única llamada a `onFilter()`:

- `this.verificadoControl.setValue(null)` → la query sale con `verificado: null`.
- `this.activoControl.setValue(null)` y `this.lastValue = null` → la pantalla vuelve a «TODAS», que
  es lo que la query ya hace. `lastValue` se reinicia junto: si quedara en `false` (Cerradas), el
  siguiente clic (null → true) lo devolvería a null por `onChange()` y el checkbox no avanzaría.

Datos nuevos: ninguno. Backend: sin cambios. Otros llamadores: `onResetFilter` solo lo llama el
`(resetFiltro)` del propio template; `onGetCajasWithFilters` también lo usa `ultimas-cajas-dialog`,
que no se toca.

## Tests

- Desktop sin batería en CI (ciclo §1 paso 9). Gate: `npm run check`.
- Prueba por pantalla (`ng serve -c web`, central local 8081): Verificado en Sí → Limpiar → la
  request lleva `verificado: null` y el checkbox queda indeterminado; idem con No. Abiertas/Cerradas
  en Cerradas → Limpiar → TODAS, y un clic después avanza a Abiertas.

## Auditoría del plan (paso 5)

- Eje A: `onResetFilter` solo lo llama el template; null de verificado llega como `null` a la query.
  Señaló que Limpiar no reinicia la sucursal → **descartado**: el campo Sucursal muestra el nombre
  y en el filial es la sucursal propia a propósito (`ngOnInit`), así que no filtra a escondidas.
- Eje B: sin `valueChanges` en el componente; `setValue` no dispara `(change)`, una sola consulta.
  Confirmó que sin `lastValue = null` el checkbox activo quedaba trabado desde Cerradas (ya en el
  plan). Anotó un desfase previo del `[checked]` de Verificado (false→null) que no se ve y no cambia
  con este fix → fuera de alcance.

## Auditoría del diff (paso 8)

El diff son 4 líneas dentro de `onResetFilter()`.

- Fijo 1: N/A para desktop porque el diff no agrega resolver, menú ni botón que modifique datos.
- Fijo 2: N/A porque no hay migración, enum ni campo nuevo.
- Fijo 3: misma operación y mismas variables. `verificado: null` ya era el valor inicial de la
  pantalla.
- Condicionales A y B: no se disparan, porque el diff no toca release ni replicación.

## Resultado (22/10)

- `npm run check`: exit 0, sin errores.
- Por pantalla: build `web-production` en 4201 contra el central 8081, usuario MR, sucursal 1.
  - Sí + Cerradas + Buscar → `verificado: true`. Limpiar → Todos + TODAS, una sola consulta con
    `verificado: null`.
  - No → `false`. Limpiar → `null`. Desde TODAS, el siguiente clic pasa a Abiertas, sin trabarse.

## Sin verificar

- Electron: N/A, no toca main/preload.
