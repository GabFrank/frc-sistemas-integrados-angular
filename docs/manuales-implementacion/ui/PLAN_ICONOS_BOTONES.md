# Plan — íconos de botones con texto a 20px

Rama: `fix/ui-tamano-iconos-botones` (desde `develop` @ `24e73a14`). Pieza: **desktop** únicamente.

## Problema

Angular Material 15 (MDC) fija los `mat-icon` dentro de botones con texto en **18px** (`1.125rem`):

```css
.mat-mdc-button>.mat-icon { font-size:1.125rem; height:1.125rem; width:1.125rem; ... }
.mat-mdc-unelevated-button>.mat-icon,
.mat-mdc-raised-button>.mat-icon,
.mat-mdc-outlined-button>.mat-icon { ...mismo tamaño...; margin-left:-4px; margin-right:8px }
```

(`node_modules/@angular/material/fesm2020/button.mjs`). Casos que reportó el usuario: «Cambiar foto» del legajo
(`informacion-general.component.html:73`) y las opciones PDF / Ticket 58 / Ticket 80 de
`shared/components/imprimir/imprimir-dialog`. `src/styles.scss` no toca el tamaño.

## Decisión del usuario

- Alcance: **todos** los botones con texto (`mat-button`, `mat-stroked-button`, `mat-raised-button`, `mat-flat-button`).
- Tamaño: **20px** (primero 24px; tras probarlo el usuario lo bajó a 20px el 2026-09-29), no `transform: scale()` — scale agranda sin mover la caja y se
  encima con el texto.

## Fase 1 — regla global en `src/styles.scss`

```scss
body .mat-mdc-button > .mat-icon,
body .mat-mdc-unelevated-button > .mat-icon,
body .mat-mdc-raised-button > .mat-icon,
body .mat-mdc-outlined-button > .mat-icon {
  font-size: 20px;
  height: 20px;
  width: 20px;
}
```

Especificidad (0,2,1): le gana a la de Material (0,2,0). Frente a reglas locales con encapsulación emulada, Angular
agrega `[_ngcontent-…]` a **cada** compuesto del selector, así que:

| Regla local | Especificidad | Resultado |
|---|---|---|
| `.x mat-icon` / `.x { mat-icon {} }` | (0,3,1) | gana el local, conserva su tamaño |
| `button mat-icon` | (0,2,2) | gana el local |
| `mat-icon {}` suelto | (0,1,1) | gana la global |
| `.mat-icon {}` o `::ng-deep .mat-icon` | (0,2,0) / (0,1,0) | gana la global |

Los dos casos reportados quedan en 20px: `imprimir-dialog.component.scss` (`.opcion mat-icon`) solo fija `color`, y
`.btn-foto` solo `width`.

No se tocan: `mat-icon-button` (`.mat-mdc-icon-button`, ya en 24px), FAB, `mat-menu-item`, íconos sueltos.

Tabla de datos nuevos: N/A — no nace ningún campo, columna ni clave; es solo CSS.

## Tests

- Paso 9: N/A batería para desktop (el CI no corre tests). Gate: `npm run check` (AOT de producción), leído del log.
- Prueba manual con `ng serve -c web` en Chrome, ventana 1366x768: legajo → Información general → «Cambiar foto»;
  imprimir recibo RRHH → diálogo PDF/Ticket; `pagar-compras-dialog` y `ingresar-retiro-caja-mayor` (filas de botones).

## Auditoría del plan (paso 5)

Eje A — contrato y propagación:
- **Especificidad mal descrita** en la versión inicial («empata con el local»). Verificado y corregido en la tabla de
  arriba.
- Quedan en su tamaño propio por regla local anidada (a propósito, no se tocan): `adicionar-conteo-dialog.component.scss:87`
  (18px), `guia-devolucion.component.scss:346` (18px), `pagar-compras-dialog.component.scss:236` (18px),
  `imprimir-pedido-dialog.component.scss:39` (28px). Inconsistencia visual menor, aceptada.
- Sin botones con alto reducido a mano ni `--mdc-*-button-container-height`/densidad en `src/`. MDC mide 36px de alto:
  20px entra. Lo único que cambia es el **ancho**, +2px por botón con ícono.
- Íconos no hijos directos (envueltos en `span`/`div`) no se tocan: quedan a su tamaño actual.

Eje B — reversibilidad y estado:
- Sin estado persistido, GraphQL, migraciones ni IPC. Los PDF/tickets salen del backend (Jasper/ESC-POS): no los afecta.
- **Reversión**: revert de `styles.scss` + release. El diálogo de actualización se puede posponer, así que no es un
  arreglo instantáneo en una caja abierta: el cambio sube por alpha → beta → stable, sin saltear canales.
- Diálogos de alto fijo con `overflow: hidden` (`ingresar-retiro-caja-mayor`, `registrar-egreso`, `pagar-compras`,
  `delivery-dialog` 900px): el alto de los botones no cambia; revisar en la prueba manual que el ancho extra no corte
  una fila de botones.

## Riesgos / sin verificar

- No se revisaron uno por uno los 588 `<button mat-*-button>`: la prueba manual es por muestreo (pantallas de arriba).
- Si alguna regla local suelta (`mat-icon {}`, `.mat-icon {}`) achicaba a propósito un ícono de botón, pasa a 20px. La
  auditoría no encontró ninguna; se verificaría visualmente pantalla por pantalla.
- Impresión, IPC, auto-update: no aplican.
