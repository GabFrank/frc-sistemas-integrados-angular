# Plan — el ícono de imprimir del visor de reportes imprime todas las hojas

Rama: `fix/reportes-imprimir-todas-las-hojas` (desde `develop`, `ad44b6b0`). Pieza única: desktop.

## Problema

En la pestaña **Reportes**, el ícono de impresora del visor (`ngx-extended-pdf-viewer` 18.1.15)
imprime solo la hoja 1 de un PDF A4 de varias hojas (reportado con la transferencia de 3 hojas;
descargando el PDF salen las 3). El PDF del central está completo.

## Causa (reproducida)

`src/styles.scss:168` deja el `body` en `position: fixed; height: 100%` (desde `52656f49`, 2023).
Para imprimir, pdf.js pone una imagen por hoja en `#printContainer` (hijo del `body`) y llama a
`window.print()`. Chromium no fragmenta un elemento fijo entre hojas: el `body` cabe en una y el
resto se recorta. El CSS de impresión del visor (`body[data-pdfjsprinting]`) no toca `position`.

Prueba con Electron 43.8.3 (`printToPDF`, A4) imitando el CSS del visor con 3 `.printedPage`:
sin body fijo → 3 hojas; con el body de la app → 1 hoja («HOJA 1»); con el arreglo → 3 hojas.

## Fase 1 — arreglo

En `src/styles.scss`, dentro del `@media print` que ya existe para `#printContainer` (línea ~477):

```scss
body[data-pdfjsprinting] { position: static !important; }
```

- Solo `position`: el `height: 100%` del visor queda, porque `.printedPage{height:100%}` y la
  imagen `max-height:100%` acotan cada hoja con él (auditoría eje B). Probado con la misma
  maqueta: solo `position: static` → 3 hojas.

- Solo actúa en impresión y solo mientras pdf.js imprime (`data-pdfjsprinting` lo pone el visor en
  `beforeprint` y lo saca en `afterprint`): la pantalla no cambia.
- Alcance: todo PDF impreso con el ícono del visor (la pestaña Reportes). El otro visor,
  `imprimir-en-sucursal-dialog`, tiene `showPrintButton=false`. El ticket del navegador
  (`imprimir-ticket-navegador.ts`) y las etiquetas (`print-label-dialog`) imprimen desde un iframe
  propio: no les llega el estilo del `body` de la app.

Sin datos nuevos, sin migraciones, sin backend: N/A tabla de datos y espejo en filial.

## Tests

- Desktop sin batería en gate (§1 paso 9): `npm run check` (AOT) como gate.
- Prueba de runtime: la app real en **Electron** (build de producción de la rama), con un PDF real
  de varias hojas en la pestaña Reportes y el **ícono real** del visor. Para no manejar el diálogo
  GTK, una copia de prueba (sin commitear) reemplaza `window.print` antes de que pdf.js lo guarde,
  deja el estado de impresión armado (hojas en `#printContainer`, `data-pdfjsprinting`) y el main
  lo captura con `printToPDF({preferCSSPageSize:true})`. Contar hojas antes (develop) y después.
- Regresión de pantalla: abrir la pestaña Reportes y otras pestañas, verificar que el layout no
  cambia fuera de la impresión.

## Auditoría del plan (paso 5)

- Eje A (propagación): sin riesgo bloqueante. Ticket y etiquetas imprimen en iframe propio; el
  atributo solo lo pone pdf.js; la regla está en `@media print`, la pantalla no cambia. Nota: el
  `display:block !important` de `styles.scss:478` pisa el `flex` del visor (centrado): sin cambio.
- Eje B (reversibilidad): rollback = revertir una regla CSS, sin estado persistido. Hallazgo
  aplicado: sacar `height:auto` (desacotaba la imagen y podía partir una hoja con otros márgenes).
  Hallazgo aplicado: probar con el ícono real y un PDF real, no solo cajas sintéticas.

## Sin verificar

- El diálogo de impresión de Windows (esta máquina es Linux). Lo prueba Franco imprimiendo la
  transferencia desde el desktop en Windows con el build del PR.
