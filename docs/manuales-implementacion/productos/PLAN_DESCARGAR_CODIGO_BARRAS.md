# Plan — Descargar el código de barras de una presentación como JPG

Rama: `feature/productos-descargar-codigo-barras` (sale de `origin/develop` @ `6579a1fc`).
Pieza: **desktop** únicamente.

## Qué se pide

En el diálogo de código de una presentación (`AdicionarCodigoDialogComponent`), un botón en una
esquina de la vista previa del código de barras que descargue la imagen en **`.jpg`**, con el
**valor del código** como nombre de archivo (`7801234567890.jpg`).

## Estado actual

- `adicionar-codigo-dialog.component.ts:178` `refreshBarcodePreview()` genera la vista previa con
  `BarcodeQrGeneratorService.generateBarcode(valor, "CODE128", { width: 2, height: 60, ... })`, que
  dibuja con JsBarcode sobre un `<canvas>` y devuelve `canvas.toDataURL('image/png')`.
- La vista previa (`.barcode-preview`) solo se muestra si hay valor y la presentación **no es
  pesable** (`isPesable`). Se refresca en cada cambio del input.
- Descarga de archivos en el repo: base64 → `Blob` → `URL.createObjectURL` → `<a download>` +
  `click()` + `revokeObjectURL` (`list-factura-legal.component.ts:740-758`). `app/main.ts` no tiene
  `will-download` y `setWindowOpenHandler` (`main.ts:399`) solo toca popups: Electron no la bloquea.

## Diseño

1. **`BarcodeQrGeneratorService.generateBarcode`**: cuarto parámetro opcional
   `mimeType: 'image/png' | 'image/jpeg' = 'image/png'`, pasado a `canvas.toDataURL(mimeType, 0.95)`.
   Default igual al de hoy → los otros 4 llamadores (`print-label-dialog` ×3,
   `print-terminal-pos-dialog`) no cambian. JPEG no tiene alfa: JsBarcode pinta el fondo con
   `background: '#ffffff'` por defecto, así que el JPG sale con fondo blanco, no negro.
2. **`AdicionarCodigoDialogComponent.onDescargarCodigo()`**:
   - toma `codigoControl.value` recortado **una sola vez, antes del `await`** (el mismo valor que
     muestra la vista previa), y usa esa constante para la imagen y para el nombre;
   - genera **aparte** una imagen de mayor resolución para el archivo (`width: 3, height: 100,
     fontSize: 20, margin: 10`, JPEG) — la vista previa queda como está;
   - nombre: el valor con los caracteres inválidos en nombres de archivo (`\ / : * ? " < > |` y
     controles) reemplazados por `_`, más `.jpg`. Si queda vacío o es un nombre reservado de
     Windows (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`), se usa `codigo-barras.jpg`;
   - convierte la data URL a `Blob` (`atob` + `Uint8Array`, `type: 'image/jpeg'`) y descarga con el
     patrón blob del repo (no con `href` = data URL);
   - flag `downloading` para deshabilitar el botón mientras genera; error → snackbar
     `NotificacionSnackbarService` (regla 5), nunca `MatSnackBar` directo.
3. **HTML**: dentro de `.barcode-preview`, un `mat-icon-button` con icono `download`,
   `matTooltip="Descargar JPG"`, `type="button"`, `[disabled]="downloading"`. Mismo `*ngIf` que la
   vista previa → no aparece en pesables ni sin valor.
4. **SCSS**: `.barcode-preview { position: relative }` y el botón `position: absolute; top: 4px;
   right: 4px`, con color oscuro legible sobre el fondo blanco de la vista previa. Se agrega
   `padding-right`/`padding-top` suficiente para que el botón no tape las barras.

Reglas del repo respetadas: sin llamadas a funciones ni getters en bindings (solo el `(click)`),
`@UntilDestroy` ya presente, sin `MatSnackBar`/`MatDialog` directos.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Verificado | Qué se hizo |
|---|---|---|---|
| A | El «patrón del repo» usa blob URL, no data URL | sí, `list-factura-legal.component.ts:740-758` | adoptado: data URL → Blob → objectURL |
| A | Electron no intercepta descargas | sí, `app/main.ts` sin `will-download`; `:399` solo popups | sin cambio; la prueba en Electron sigue en «Sin verificar» |
| A | Otros llamadores de `generateBarcode` compatibles con el 4.º parámetro opcional | sí, 4 llamadores con 3 args | sin cambio |
| A | Otros diálogos (imprimir etiqueta, terminal POS) no reciben el botón | sí | fuera de alcance: son flujos de impresión |
| A | «`generateBarcode` en `adicionar-codigo-dialog.component.ts:253,329`» | **falso**: solo `:185` | descartado |
| B | Nombre vacío tras sanitizar o reservado de Windows | razonable | adoptado: fallback `codigo-barras.jpg` |
| B | Releer el control después del `await` puede desalinear nombre e imagen | sí | adoptado: snapshot antes del `await` |
| B | JPEG sin alfa ¿fondo negro? | sí, jsbarcode `defaults.js:13` `background:"#ffffff"`, pintado en `canvas.js:46` | sin riesgo; `background` explícito se omite |
| B | Enter / submit con foco en el botón | sí, `type="button"`; `handleKeyDown` depende de `isEditting`, no del foco | sin cambio de comportamiento |

## Hallazgo durante la prueba (paso 9)

Al abrir un código **existente** en la versión web (`ng serve -c web`, Pages) el diálogo salía
vacío, como «Nuevo Código» con botón «Editar». Bug **previo, ya en `develop`** desde `ec1e447b`:
`loadPrinters()` → `ElectronService.getPrinters()` llama `ipcRenderer.invoke` sin guarda, en web
`ipcRenderer` es `null`, el `TypeError` corta `ngOnInit` antes de `cargarDato()`. En Electron no
pasa. Decisión de Franco: arreglarlo en esta rama, commit aparte.

| Fase | Contenido | Commit |
|---|---|---|
| 2 | `getPrinters()` devuelve `of([])` sin Electron, igual que `getAppVersion()` (`electron.service.ts:246`) | `fix(productos): precargar el codigo existente en el dialogo de codigo en la version web` |

## Tabla de datos nuevos

N/A — no nace ningún campo, columna ni clave. La imagen se genera en el cliente y no se persiste.

## Roles (regla 10)

N/A — descargar la imagen no modifica datos; el diálogo ya está detrás del acceso a productos.

## Fases

| Fase | Contenido | Commit |
|---|---|---|
| 1 | servicio + componente (ts/html/scss) | `feat(productos): descargar el codigo de barras de la presentacion en jpg` |

Una sola fase: el cambio entero son ~50 líneas en 4 archivos.

## Tests

- Batería: **N/A para desktop** porque su CI no corre tests y no hay batería confiable
  [ev: ciclo §1 paso 9; `.github/workflows/ci.yml` sin paso de test].
- Gate: `npm run check` (AOT), leído del log.
- Prueba manual: `npm run ng:serve` + Chrome, Productos → un producto → presentación → abrir un
  código existente y uno nuevo generado con «Generar»:
  1. aparece el botón en la esquina superior derecha de la vista previa;
  2. clic → baja `<codigo>.jpg`, se abre como JPEG válido, fondo blanco, barras legibles y
     escaneables;
  3. producto pesable → no hay vista previa ni botón;
  4. los otros usos del servicio (imprimir etiquetas) siguen generando PNG.

## Sin verificar

- El diálogo nativo de guardar **dentro de Electron** (`npm start`): se prueba en web; en Electron
  el mismo patrón ya lo usa la descarga de XML/PDF de factura legal. Se verificaría con `npm start`.
- Escaneo real del JPG con lector físico: lo verifica el usuario.

## Multi-repo / canales

N/A — solo desktop, sin GraphQL ni replicación. Al mergear: el usuario verá «Cerrar y actualizar»
dentro de 5 min en el canal correspondiente.
