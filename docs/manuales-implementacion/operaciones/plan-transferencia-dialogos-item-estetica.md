# Plan — diálogos de modificar cantidad, modificar vencimiento y rechazar ítem (transferencia)

Rama: `feature/transferencia-dialogos-item` (desde `develop`). Pieza: desktop. Pedido de Franco
(26/10): «que se vean más estéticos, están muy simples».

## Qué pasa hoy

Los tres son el mismo componente, `ModificarItemDialogComponent`
(`operaciones/transferencia/modificar-item-dialog/`), abierto solo desde
`EditTransferenciaComponent.onModificarItem` (`width: 500px`). El HTML es de la primera versión
(«transferencia funcionando»):

- título como texto suelto centrado, sin cabecera;
- no dice **qué producto** se está tocando;
- filas «etiqueta 30% / valor 70%» con fxFlex;
- vencimiento anterior con `date: "shortDate"` (formato M/d/yy, no el `dd/MM/yy` de la grilla);
- el select de rechazo muestra el enum crudo (`FALTA_PRODUCTO`) y no lleva `mat-form-field`;
- botones de 150px fijos; Aceptar con `[disabled]` sobre el OR de los tres controles.

## Qué se hace (una fase)

Solo presentación. `onAceptar` (lo que arma el ítem, ajustado en #569) **no cambia**, ni el
llamador.

1. **Mismo lenguaje que `VerificarTransporteDialogComponent`**: `styleUrls` suma
   `../ruta-hoja/ruta-hoja.component.scss` (cabecera `.dialog-header` con ícono, título naranja,
   subtítulo y botón cerrar; cuerpo `.dialog-body`; pie `.dialog-footer` con Cancelar y botón
   verde). No se copia CSS: se reusa. Ese scss ya va con tokens `--frc-*` (a092d1e6); el scss
   propio del diálogo también: nada de grises fijos (`docs/TEMA_CLARO_OSCURO.md`).
   - Ícono y título por modo: `edit` «Modificar cantidad», `event` «Modificar vencimiento»,
     `block` «Rechazar ítem».
   - Subtítulo: descripción del producto (`presentacionPreTransferencia.producto.descripcion`,
     la misma que muestra la grilla).
2. **Bloque de datos del ítem** en una tarjeta: código, presentación, cantidad y total en
   unidades, vencimiento en `dd/MM/yyyy`. Los valores salen de la **etapa de origen**, la misma de
   la que copia `aplicarConfirmacion` (se exporta `datosDeOrigen` de
   `transferencia-item-confirmacion.ts`): en rechazar, lo que se muestra es lo que se guarda.
   Las clases `.dato/.etiqueta/.valor` **no están en ruta-hoja**: van en el scss propio, con
   tokens (auditor A). Todo con `?.` y fallback: tras desconfirmar, la fila puede venir sin
   producto en las presentaciones de etapa.
3. **Campo** con `appearance="outline"`. Rechazar: `mat-select` dentro de `mat-form-field` con
   etiquetas legibles («Falta producto», …, mapa en un campo del TS); el valor sigue siendo el
   enum. Aviso naranja corto en rechazar.
   - **Enter** (auditor B): `(keydown.enter)` **solo en los `<input>`** de cantidad y de fecha,
     nunca en el contenedor ni en el select (Enter elige la opción y el keyup llegaba al
     contenedor: rechazaba al instante). El handler es `onEnter()` con guardia
     `if (controlActivo.invalid) return;` antes de `onAceptar()`: un Enter no se salta el
     `[disabled]` del botón.
   - **Foco inicial**: `cdkFocusInitial` en el input de cantidad o de fecha; en rechazar, en el
     select. Nunca en el botón rojo.
   - **X de la cabecera** llama a `onCancelar()` (cierra con `undefined`, como Esc).
   - Se borra `onSelectMotivo` (solo hacía `console.log`, nadie lo llama).
4. **Pie**: Cancelar (`mat-button`) y Confirmar (`mat-flat-button`, verde; en rechazar, rojo
   «Rechazar»). `[disabled]` mira solo el control del modo abierto (`controlActivo.invalid`):
   igual que hoy, porque los otros dos controles quedan nulos e inválidos.
5. El llamador suma `maxWidth: "95vw"` (como verificar transporte). Nada más.

Valores que muestra el HTML se calculan en `ngOnInit` (regla: nada de funciones en el template).

Fuera de alcance (cambian comportamiento): rechazar con `puedeConfirmar` en false manda la
cantidad en null (hueco previo, auditor B); validar cantidad > 0 o máximos, total nuevo en vivo, sacar el motivo comentado
del HTML viejo (se borra con el HTML), tocar los otros diálogos de transferencia.

## Datos nuevos

Ninguno. No hay columnas, campos de input ni claves nuevas: el `input` que sale de `toInput()` es
el mismo.

## Tests

- **Spec nuevo del diálogo sin TestBed** (auditor B): se instancia la clase con `data` y un
  `MatDialogRef` falso, `ngOnInit()` + `onAceptar()` en las 3 etapas × 3 modos, y se compara
  lo que devuelve `close` con lo esperado. Se escribe y corre **antes** de tocar el componente
  (línea base) y después: es la red de «onAceptar no cambia». Reemplaza el spec por defecto,
  que hoy falla (TestBed sin providers). Karma con `DISPLAY=:0` y tsconfig acotado.
- El desktop no tiene batería en ningún gate; el gate es `npm run check` (AOT) al final.
- **Por pantalla** (desktop web contra central local), en una transferencia de prueba:
  - preparación: modificar cantidad, modificar vencimiento y rechazar; Cancelar, cerrar con la X,
    Enter con campo vacío (no confirma) y con campo válido (confirma); el ítem queda guardado
    igual que antes (cantidad / vencimiento / motivo y desconfirmar previo del #569), mirando
    las variables de `saveTransferenciaItem` en la red;
  - Enter con el select abierto y con el calendario abierto (no confirma), fecha tipeada
    inválida (botón deshabilitado), rechazar un ítem ya cargado;
  - transporte o recepción: rechazar.
  - Captura de los tres diálogos, en modo oscuro y en modo claro.

## Qué queda sin verificar

- Electron empaquetado: el estilo es SCSS de componente, el mismo build; no se prueba en el .AppImage.
