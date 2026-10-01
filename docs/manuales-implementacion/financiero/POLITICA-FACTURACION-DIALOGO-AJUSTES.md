# Ajustes al diálogo de política de facturación

Rama: `fix/facturacion-politica-dialogo-scroll-orden` (desde `develop`; el PR #335 que trajo el
diálogo ya está mergeado). Pieza: **desktop**. Sin cambios de backend, GraphQL ni persistencia.

## Pedido (Franco, 2026-10-01)

1. La lista de sucursales (tabla de configuración) scrollea sola; hoy scrollea el diálogo entero.
2. Diálogo más ancho: «NUEVA ESPERANZA SAN ANTONIO» parte la fila en dos.
3. Selector de sucursales ordenado por id asc (hoy por nombre). La tabla, igual: por id de sucursal.

## Fase única

| Archivo | Cambio |
|---|---|
| `configuracion-facturacion-dialog.component.html` | las tablas de configuración y de historial van dentro de un `div.tabla-scroll` |
| `configuracion-facturacion-dialog.component.scss` | `mat-dialog-content` en columna flex (tope 75vh): la `.tabla-scroll` toma el alto que sobra (mínimo 180px) con `overflow: auto`; `thead th` sticky con fondo `#424242` (el mismo que `gestionar-chequeras-dialog`) y borde como `box-shadow`; `.sucursal` con `white-space: nowrap` |
| `configuracion-facturacion-dialog.component.ts` | `sucursales` ordenadas por `id`; `filas`: la global primero, después por `sucursal.id` |
| `factura-legal-dashboard.component.ts` | `width: '960px'` → `'1120px'` (sigue `maxWidth: '95vw'`) |

El selector del historial usa la misma lista `sucursales`, así que también queda por id.

## Tabla de datos nuevos

N/A para desktop porque no nace ningún campo, columna ni clave: solo orden y estilos.

## Tests

N/A batería: el desktop no tiene batería en ningún gate (skill `frc-desktop`, paso 9). Gate:
`npm run check` (AOT). Prueba visual sirviendo el desktop por web.

## Auditoría del plan (paso 5)

- **Eje A** (contrato): el diálogo se abre solo desde `factura-legal-dashboard`; `custom-dialog-container`
  no tiene reglas globales que pisen el ancho. Riesgo: un `max-height` fijo en la tabla, anidado en el
  65vh de `mat-dialog-content`, deja doble scroll. Sticky con `border-collapse`: el borde del `th` no
  se pinta. **Hecho:** layout flex en vez de `max-height` fijo; borde como `box-shadow`.
- **Eje B** (reversibilidad): sin estado ni backend, se revierte con el commit. Riesgo: doble scroll
  en 1366x768 y `nowrap` desbordando el historial. **Hecho:** layout flex (el scroll del diálogo queda
  solo de respaldo bajo el mínimo de 180px) y el historial también va en `.tabla-scroll`, que tiene
  `overflow: auto` en los dos ejes. El orden por id no cambia nada funcional: todo opera por `config.id`.

## Registro

- Paso 6: el plan no se presentó antes de implementar; el pedido de Franco ya fijaba los tres cambios.
  Se presenta con el resultado.
- `npm run check` falló con `Unterminated string token` en archivos ajenos: lo causaba el selector
  `> :not(.tabla-scroll)` del componente (ver `frc-desktop/ui-patterns.md`). Se reemplazó por `> *` y
  `> .tabla-scroll`; el check pasó.

## Fase 2 (pedido de Franco tras ver la fase 1)

Las filas quedaban altas porque «Modificado» apilaba usuario y fecha en dos renglones.

| Archivo | Cambio |
|---|---|
| `configuracion-facturacion-dialog.component.html` | columna «Fecha» propia al lado de «Modificado»; la fila vacía pasa a `colspan="7"` |
| `configuracion-facturacion-dialog.component.scss` | `.modificado` en una línea (`nowrap`); la fecha en gris |
| `factura-legal-dashboard.component.ts` | `width: '1120px'` → `'1280px'` (sigue `maxWidth: '95vw'`) |

Sin auditoría nueva: no abre ningún concern que los ejes A y B de la fase 1 no hayan mirado (ancho
acotado por `maxWidth`, sin estado ni backend).

## Sin verificar

- La prueba visual con datos reales de 24 sucursales: queda para Franco al probar la rama.
