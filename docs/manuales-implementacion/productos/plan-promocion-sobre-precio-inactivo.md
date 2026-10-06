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
