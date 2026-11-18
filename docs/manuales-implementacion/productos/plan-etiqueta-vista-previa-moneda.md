# Plan — vista previa térmica con la moneda del precio (#747)

Rama: `fix/etiquetas-vista-previa-moneda` (desde `develop`). Pieza: solo desktop.

## Problema

`print-label-dialog.component.html:102` pinta la vista previa térmica con
`precioPrincipal | currency:'PYG':…`: un precio principal de 5,85 USD se ve «₲ 6». La impresión
térmica (`textoPrecioEtiqueta(price, this.monedaPrecio)`, `.ts:478`) y el afiche A4
(`previewPrice`) ya usan la moneda del precio.

## Cambio (una fase)

1. En la línea 102 del HTML, mostrar `{{previewPrice}}`. `previewPrice` sale de
   `textoPrecioEtiqueta(priceNum, this.monedaPrecio)` en `updatePreviewComputedProperties()`, que
   corre al abrir el diálogo, en cada cambio del formulario y cuando llega la moneda del principal
   (`loadMonedaPrecio`, `.ts:196`).

Efecto visible: un precio en guaraníes pasa de «₲ 6.500» a «Gs. 6.500», que es lo que la térmica ya
imprime. La vista previa queda igual a lo impreso, que es lo que pide la issue.

## Datos nuevos

Ninguno: no hay campo, columna, query ni clave nueva.

## Tests

- `etiqueta-precio.util.spec.ts` ya cubre `textoPrecioEtiqueta` (USD con decimales y Gs. sin moneda).
  El cambio está solo en el template, así que no suma test. Paso 9 del desktop: `npm run check`.
- Runtime (web, `ng serve -c web`): abrir «Imprimir Etiqueta» de un producto con el principal en
  USD → la vista previa térmica dice «US$ 5,85»; de uno en guaraníes → «Gs. N».

## Fuera de alcance

- `.ts:104`: el texto por defecto del QR fija `PYG`. Se arma antes de que llegue la moneda y es un
  campo que el usuario edita, así que necesita otro tratamiento. Va en una issue aparte si Franco quiere.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | Un solo llamador (`list-producto.component.ts:418`); ningún otro `currency:'PYG'` en `src/app`; `previewPrice` solo en este componente | Nada: el alcance es este template |
| A | «₲» pasa a «Gs.» y «US$ 5,85» es más largo | Intencional (= lo impreso). Se mira por pantalla que no desborde `.product-price` |
| B | En `cargando` (≤4 s) y `sinConfirmar`, `monedaPrecio` es null y la vista previa dice «Gs. N» | Se deja así: en los dos estados la impresión está bloqueada (`.ts:245-252`), `sinConfirmar` muestra el cartel con «Reintentar» y el afiche ya hace lo mismo. Ocultarlo solo en la térmica las desalinearía |
| B | Principal null → «Gs. 0» (antes vacío) | Igual a lo impreso; `.ts:104` ya falla con null antes |

## Sin verificar

- La etiqueta impresa (solo Electron). No cambia: el código de impresión no se toca.
