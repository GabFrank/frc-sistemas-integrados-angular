# Plan — texto por defecto del QR con la moneda del precio (#750)

Rama: `fix/etiquetas-qr-moneda` (desde `develop`, ya con #751). Pieza: solo desktop.

## Problema

`print-label-dialog.component.ts:104` arma el texto por defecto del QR en `ngOnInit` con
`precioPrincipal.toLocaleString('es-PY', { style: 'currency', currency: 'PYG' })`: un principal de
5,85 USD queda «Precio: Gs. 6», y eso se codifica en el QR impreso. Se arma antes de que
`loadMonedaPrecio()` (asíncrono) lea la moneda y no se recalcula. Además, `precioPrincipal` null
explota (`toLocaleString` de null).

## Cambio (una fase)

1. `etiqueta-precio.util.ts`: función pura `textoQrEtiqueta(codigo, descripcion, precio, moneda)`
   → `${codigo || ''}\n${descripcion}\nPrecio: ${textoPrecioEtiqueta(precio, moneda)}`.
2. `print-label-dialog.component.ts`:
   - campo privado `qrPorDefecto` (último texto por defecto puesto en el campo);
   - método privado `aplicarQrPorDefecto()`: calcula el texto con `this.monedaPrecio` y lo escribe en
     `qrCodeData` **solo si el campo sigue igual a `qrPorDefecto`** (el usuario no lo editó);
   - se llama en `ngOnInit` (en lugar del armado actual) y en `loadMonedaPrecio` cuando se confirma
     la moneda (junto a `updatePreviewComputedProperties()`, `.ts:196`).
   - el precio se lee como en el resto del componente (`number` o `parseFloat(...) || 0`): null → «Gs. 0».

Efecto en guaraníes: el texto pasa de «Gs. 6.000» (espacio duro de `Intl`) a «Gs. 6.000», el
mismo que imprime la etiqueta. Se lee igual.

## Datos nuevos

Ninguno persistido. `qrPorDefecto` es estado del diálogo: lo escribe `aplicarQrPorDefecto()` y lo lee
la misma función.

## Tests

- `etiqueta-precio.util.spec.ts`: `textoQrEtiqueta` en guaraníes (sin moneda), en USD, y sin código.
  Se corre con Karma acotado al spec (el CI del desktop no corre tests; gate `npm run check`).
- Runtime (web contra alpha, solo lectura): COCA COLA 1.5 L, tipo «QR» → «Precio: US$ 5,85»;
  editar el campo antes de que llegue la moneda (simulando la llegada) → no se pisa;
  AGUA SALTO 2 L → «Precio: Gs. 6.000».

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | `qrCodeData` solo lo leen la vista previa (`.ts:370`), `printLabel` (`.ts:594`) y el textarea; nadie parsea «Precio:» en desktop, PWA ni mobile | Nada: alcance correcto |
| B | `qrPorDefecto` sin inicializar rompería la guarda si la moneda llega síncrona | Se inicializa en `''` (el campo arranca en `''`) |
| B | `setValue` dispara `valueChanges` → `updatePreview` → QR generado dos veces con promesas sin orden | `setValue(…, { emitEvent: false })`; pinta el `updatePreviewComputedProperties()` que ya existe |
| B | `cargando`/`sinConfirmar`: el QR dice «Gs.» | Verificado: la guarda `impresionBloqueadaPorCotizacion()` (`.ts:525`) precede a todas las ramas, incluida la QR; «Reintentar» pasa por `.ts:196` y lo recalcula |
| B | Editar y dejar el mismo texto cuenta como no editado | Aceptado: el texto es idéntico al por defecto |
| B | La guarda no tiene test unitario (solo la función pura) | Las dos ramas (sin editar / editado) se prueban por pantalla |

## Sin verificar

- El QR impreso (solo Electron): `printLabel` lee `qrCodeData` del formulario (`.ts:594`), que es
  lo que cambia.
