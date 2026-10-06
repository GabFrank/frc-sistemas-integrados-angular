# Plan — promoción sobre un precio inactivo (2x1) en el diálogo de promociones

Rama: `feature/productos-promocion-precio-inactivo` (desde `develop`). Pieza: **solo desktop**.

## Problema

Una promo por presentación (2x1) se arma con una presentación y un precio **inactivos** (p. ej.
5.000) y después una promoción por sucursal que los habilita. La filial cobra el valor de la
**promoción**, no el del precio (`PrecioEspecialLector.copiaConEspecial` del filial). En el diálogo
«Promociones por sucursal»:

1. «Precio promocional» arranca vacío y es obligatorio: hay que volver a escribir los 5.000.
2. El precio inactivo se rotula «Precio actual — Lo cobran todas las demás sucursales», que es
   falso: inactivo no lo cobra ninguna.
3. La píldora de porcentaje compara contra un precio que no rige en ningún lado.
4. Cortar dice «vuelve al precio global» / «vuelve al precio actual»: en realidad el precio vuelve
   a quedar inactivo en esa sucursal.

## Alcance

Solo `src/app/modules/productos/precio-especial/` (diálogo, lista, util y spec). Sin cambios de GraphQL,
central, filial ni base. El precio de la promoción sigue siendo obligatorio en el central.

«Precio inactivo» = `data.precio.activo === false`. `null`/`undefined` se tratan como activo (la
columna tiene `DEFAULT true`; la ficha ya pide `precios { activo }` en
`presentacionPorProductoId`). El único que abre el diálogo es `producto.component.ts`.

## Fase 1 (única)

- `precio-especial.util.ts`: `precioPromocionalInicial(precio)` → el valor del precio si está
  inactivo y es > 0; si no, `null`.
- `precio-especial-dialog.component.ts`:
  - `precioInactivo`, y textos calculados en `ngOnInit` (el template no llama funciones):
    rótulo, nota, ayuda, tooltip y detalle de cortar.
  - Alta: `precioControl` arranca con `precioPromocionalInicial` (también tras guardar y tras
    «Cancelar edición», en `onNuevo`). Se usa `reset(valor)` para que quede sin tocar. Editar una
    promoción existente sigue mostrando el valor de esa promoción.
  - `descuentoPorcentaje = null` si el precio está inactivo. El margen sobre costo se mantiene.
- `precio-especial-dialog.component.html`: chip «Precio inactivo»; rótulo «Precio cargado» y nota
  «Inactivo: no se cobra en ninguna sucursal»; sin tachado en ese caso; ayuda y tooltip de cortar
  según el caso.
- `list-precio-especial` (pantalla «Promociones»): el detalle de cortar usa el mismo texto según
  el caso, y la columna «Global» marca «(inactivo)» cuando el precio no rige. Su query ya pide
  `precioPorSucursal { activo }`.
- Precio activo: **sin cambios** de comportamiento ni de textos.

### Tests

- `precio-especial.util.spec.ts`: `precioPromocionalInicial` (inactivo con valor, activo, `activo`
  null/undefined, precio 0/null).
- Paso 9 batería: N/A para desktop (el CI no corre tests); gate = `npm run check`.
- Runtime en local (`ng serve -c web` contra central local): precio inactivo → campo precargado,
  textos nuevos, alta con solo elegir sucursal, cortar; precio activo → igual que hoy.

## Datos nuevos

Ninguno. No nace ningún campo, columna ni clave.

## Reversión

Revertir el commit. No hay estado: las promociones guardadas no cambian de forma.

## Auditoría del plan (paso 5)

Eje A — contrato y propagación:

- **La pantalla «Promociones» repite el texto falso al cortar y muestra el precio inactivo como
  «Global»** (`list-precio-especial.component.ts:161`, `.html:37`). Verificado → **incluido** en la
  fase.
- `precio.activo` llega al diálogo como copia de la fila de la ficha: si se cambia el activo del
  precio y la ficha no relee, el diálogo usa el valor anterior. Aceptado: solo cambia textos y la
  precarga; lo que se guarda lo decide el usuario.
- Sin cambio de contrato; mobile-pwa no usa promociones; central y filial ya tienen promociones en
  `develop`, `release/beta` y `master`.

Eje B — estado interno:

- **Con la precarga el botón «Agregar» queda habilitado sin haber escrito el precio**, también en
  la segunda alta tras guardar, y sin costo cargado no hay aviso de margen. Verificado →
  **mitigado**: el comparador muestra el valor en grande al lado del «Precio cargado» y la ayuda
  dice de dónde sale y que se puede cambiar. Se probó un `mat-hint` bajo el campo y se descartó:
  repetía el comparador y quedaba pegado a la ayuda. No se exige tocar el campo: sería volver a
  pedir el dato dos veces.
- Un 2x1 legítimo suele quedar bajo el margen mínimo y pide confirmación al guardar. Es el
  comportamiento de hoy al escribir el mismo valor a mano: no cambia.
- El `null` del porcentaje va dentro de `actualizarComparador` (se recalcula en cada tecla) y la
  precarga se hace después de suscribir `valueChanges`. → incorporado.
- El texto de ayuda actual ya menciona el caso inactivo: se reemplaza, no se suma.

## Sin verificar

- Precios con `activo` NULL: en la copia local de bodega hay **0** (683 inactivos de 11.417). No se
  consultó farmacia.
- Karma no corre en ningún gate: el spec se corre a mano si el entorno lo permite.

## Registro de la fase 1 (2026-10-06)

- Paso 8: Fijo 1 y Fijo 2 N/A para desktop porque el diff no toca resolver, menú, migración ni
  `.graphqls` (`git diff --name-only`: solo `precio-especial/`). Un auditor sobre el diff (contrato,
  regresión del precio activo, AOT): sin hallazgos.
- Runtime en local (`ng serve -c web` :4201 contra central `dev` :8081, base bodega local), producto
  8216, precio 12690 (promo 2x1, 13.000, inactivo): campo precargado, textos nuevos, alta eligiendo
  solo la sucursal, precarga repuesta tras guardar, confirm de cortar correcto; precio activo 12465
  igual que antes; pantalla «Promociones» muestra «14.000 (inactivo)». La promoción de prueba
  (id 28) quedó cortada.
- `npm run check`: exit 0, sin errores.
- Sin correr: Karma (`precio-especial.util.spec.ts`).

## Fase 2 — checkbox «Promoción» y altas encadenadas (pedido de Franco, 2026-10-06)

### Problema

Armar un 2x1 son tres diálogos sueltos (presentación, precio, sucursales) y en los dos primeros hay
que acordarse de apagar «Activo». Si se olvida en el precio, el 2x1 queda vigente en todas las
sucursales (el PDV parte el ítem en la presentación mayor mirando solo el `activo` del precio).

### Alcance

Solo desktop. Sin cambios de GraphQL, central, filial ni base: `activo=false` ya viaja en
`PresentacionInput` y `PrecioPorSucursalInput`. No nace ningún campo persistido.

### Cambios

- `adicionar-presentacion` (solo en el **alta**): checkbox «Es una promoción (2x1, 3x2…)». Marcado:
  `activo=false` y `principal=false`, los dos toggles bloqueados; al guardar se derivan del
  checkbox, no del toggle. Cierra con la presentación más `promocion: true` solo si quedó inactiva.
- `adicionar-precio-dialog` (solo en el **alta**): checkbox «Precio de promoción». Llega marcado
  solo si quien lo abre pasa `data.promocion`. Marcado: `activo=false` (toggle bloqueado, y derivado
  del checkbox al guardar) y `principal=true`, editable. Cierra con el precio más `promocion: true`
  solo si quedó inactivo. El botón del pie deja de llamar `formGroup.enable()` en cada clic: solo al
  pasar de ver a editar (`onBotonPrincipal`).
- `producto.component.ts`: `onAdicionarPresentacion` sigue con `abrirPrecio(presentación guardada,
  null, true)`; `abrirPrecio` (extraído de `onAddPrecio`) sigue con `abrirPromociones` (extraído de
  `onPrecioEspecial`) si el usuario tiene `puedeGestionarPrecios`; si no, avisa. Cancelar el precio
  en la cadena avisa que la presentación quedó sin precio.
- En la **edición** no aparece el checkbox. Un guardado `sinConfirmar` no encadena nada.

### Datos nuevos

Ninguno persistido. En memoria: `promocion` en el valor de cierre de los dos diálogos (escribe el
diálogo, lee `ProductoComponent`) y `AdicionarPrecioPorSucursalData.promocion` (escribe
`ProductoComponent.abrirPrecio`, lee `AdicionarPrecioDialogComponent.ngOnInit`).

### Auditoría del plan (paso 5)

- **Eje A, alto: el precio de promoción nacía `principal=false`** y el PDV, en cajas sin tipos de
  precio, toma `principal && activo` (`venta-touch.component.ts:789`, `:824`); el filial conserva
  el `principal` original. Un 2x1 armado con la cadena no se cobraba ahí. Verificado → el checkbox
  pone `principal=true` (editable). En la copia local, el 2X1 que ya funciona (precio 12888) es
  principal.
- **Eje B, alto: `formGroup.enable()` en cada clic del botón** rehabilitaba el toggle Activo
  bloqueado; tras un guardado que no cierra (aviso de margen, tipo repetido, rechazo) se podía
  guardar `activo=true` con el checkbox marcado. Verificado → el valor se deriva del checkbox y el
  `enable()` queda solo en el paso a editar.
- **Eje B, medio: marcar por defecto cuando la presentación está inactiva** cambiaba el alta normal
  de un precio sobre una presentación inactiva que no es promo. → descartado ese default.
- **A y B, medio: «Verificar» puede cerrar con una presentación igual que ya existía activa.** → solo
  se encadena si lo guardado quedó `activo=false`.
- **Eje B: `data` como canal de salida.** → se usa el valor de cierre (copia con `promocion`), sin
  tocar las constantes `*_SIN_CONFIRMAR`.
- Roles: el paso de sucursales solo abre con `puedeGestionarPrecios`; sin el rol, avisa. El alta de
  precio no tiene gate hoy y la cadena no agrega acceso.
- mobile-pwa crea presentaciones y precios por su cuenta y queda sin esta automatización.
- No se agregó la util `esAltaDePromocion`: sin el default por presentación inactiva no hay lógica
  pura que probar.

### Ajuste pedido por Franco (2026-10-06)

El control es un `mat-slide-toggle` «Es promoción», como Principal y Activo, y los tres van en la
misma fila en los dos diálogos (donde este plan dice «checkbox», leer «toggle»). Los diálogos pasan
a `minWidth: 480px` para que entren.

### Auditoría del diff (paso 8)

Fijo 1 y Fijo 2 N/A para desktop porque el diff no toca resolver, menú, migración ni `.graphqls`.
Un auditor sobre el diff:

- **Medio-alto: marcar «Precio de promoción» en una presentación que ya tiene principal** forzaba
  `principal=true`, el guardado bajaba al principal anterior y la presentación quedaba sin principal
  activo. Verificado (`continuarGuardado`) → `principal=true` solo si la presentación no tiene
  precios; con otros precios lo decide el usuario. Al desmarcar se deshace solo lo que puso el
  checkbox.
- Bajo, aceptado: «Verificar» que encuentra una única presentación igual **e inactiva** sigue con
  el alta de precio como si fuera la recién creada.

### Tests

- Runtime local: alta de presentación marcada como promoción → se abre el precio ya marcado
  (inactivo y principal) → se abre sucursales con el precio cargado → queda inactiva en la ficha y
  vigente solo en la sucursal elegida. Alta normal sin marcar: igual que hoy, sin encadenar.
  Edición: sin checkbox.
- `npm run check`.

### Reversión

Revertir el commit. Las presentaciones y precios creados con el checkbox son iguales a los que hoy
se crean apagando «Activo» a mano.

### Registro de la fase 2 (2026-10-06)

- Runtime en local (producto 8216): alta de presentación «PRUEBA 3X2» marcada como promoción
  (id 12015, guardada `activo=f, principal=f`) → se abrió el alta de precio ya marcada → precio
  12889 guardado `activo=f, principal=t` → se abrió sucursales con 26.000 cargado. Alta normal de
  precio: sin marcar, activo, no principal. Edición: sin el control, y «Editar» habilita el
  formulario. Marcar en una presentación con precios no toca Principal. Esa cadena se recorrió con
  el checkbox; tras pasar a toggle se revisó el estado y la fila en los dos diálogos, sin volver a
  guardar.
- `npm run check`: exit 0, sin errores (corrido sobre la versión con toggle).
- Quedaron en la base local la presentación 12015 y el precio 12889, inactivos y sin sucursales.
