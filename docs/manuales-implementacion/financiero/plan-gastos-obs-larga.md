# Plan: la Obs larga desborda la Lista de Gastos (issue #492)

Rama: `fix/financiero-gastos-obs-larga` (desde `develop` bf83b604). Pieza: solo desktop.

## Problema

En Financiero → Caja y Operativa → Gastos, una Obs larga (gasto id 17 en producción) estira la
columna `observacion` y empuja el resto de la grilla fuera de la pantalla.

Causa: `list-gastos.component.scss` pone `white-space: nowrap` + `overflow: hidden` en todas las
celdas, pero ninguna tiene ancho máximo, así que la celda crece con el texto. El `style="width: 30"`
del `th`/`td` de la Obs no tiene unidad y el navegador lo descarta.

El `td` ya tiene `[matTooltip]="gasto?.observacion"`: el texto completo ya se ve al pasar el mouse.

## Fase 1 — cortar la Obs con «…» (único commit de código)

- `list-gastos.component.scss`: clase `.celda-obs` con `max-width: 250px`, `overflow: hidden`,
  `text-overflow: ellipsis`, `white-space: nowrap`. Es el mismo patrón que `.celda-descripcion` de
  `list-pre-gastos.component.scss`, la pantalla hermana.
- `list-gastos.component.html`: `class="celda-obs"` en el `td` de la Obs y borrar los
  `width: 30` inválidos del `th` y del `td`.
- Plan B si Chromium no respeta `max-width` en un `td` de tabla automática: envolver el texto en
  un `<span class="celda-obs">` con `display: block` (o `inline-block`).

Tests: `N/A para desktop porque el CI no corre Karma ni e2e [ev: .github/workflows/ci.yml]`. Gate:
`npm run check`. Prueba por pantalla (abajo).

## Datos nuevos

Ninguno: no hay campo, columna, query ni mutation nuevos. No toca backend, migraciones, roles ni
replicación.

## Prueba por pantalla

Central local (8081, perfil dev) + `ng serve -c web`, usuario MR:

1. Anotar la `observacion` original de tres gastos de la base local y ponerles: ~300 letras con
   espacios, ~300 letras sin espacios, y un texto con salto de línea. Al final, restaurar por id
   y verificar con un `SELECT`.
2. Abrir Gastos a zoom 100%: la columna Obs termina en «…» y Retiro/Vuelto/Creado/Acciones
   se ven sin achicar el zoom.
3. Pasar el mouse por cada Obs: el tooltip muestra el texto completo.
4. Una Obs corta se ve entera, sin «…»; una Obs vacía no rompe la fila.

## Auditoría del plan (paso 5)

- Eje A (contrato y propagación): sin bloqueantes. `ListGastosComponent` solo se abre como tab
  (mismo listado desde 7 lugares), con encapsulación por defecto: el estilo no se filtra. No toca
  GraphQL, backend ni mobile-pwa. Otras pantallas con Obs larga quedan fuera de alcance.
- Eje B (reversibilidad y estado): sin bloqueantes. Revertir el commit lo deshace entero; un
  desktop sin actualizar sigue como hoy. Se aplicó: casos borde (sin espacios, con salto de línea)
  y restauración concreta de los datos de prueba en la prueba por pantalla.
- Aceptado sin cambiar: la celda muestra la Obs en mayúsculas y el tooltip tal como se guardó
  (ya era así).

## Qué queda sin verificar

- El Electron empaquetado (Chromium 108): se prueba en Chrome por web. El mismo patrón ya corre en
  `list-pre-gastos` dentro del Electron, así que el riesgo es bajo.
