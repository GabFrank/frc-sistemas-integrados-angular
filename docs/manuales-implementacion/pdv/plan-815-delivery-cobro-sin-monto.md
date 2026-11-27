# Plan — el diálogo de delivery deja agregar una línea de cobro sin monto (#815)

Rama: `fix/delivery-cobro-valor-requerido` (desde `develop`). Pieza: **desktop**. Sin cambios de GraphQL.

## Problema

En `edit-delivery-dialog`, si se limpia «Valor» con la X y se aprieta Enter, `addCobroDetalle` arma una línea
«Pago» con `valor = null`. El campo no es obligatorio (`vueltoControl = new FormControl(null)`), así que
`this.vueltoControl.valid` da `true`.

- **Delivery nuevo:** la línea viaja en `saveDeliveryAndVenta`.
- **Delivery guardado:** la línea va por `saveCobroDetalle`.

El filial grababa la fila con `valor` NULL, y eso rompía el balance de toda la caja y trababa el retiro
(filial 18, 27/11; filial #286). Reproducido por pantalla el 27/11.

El filial ya lo contiene en `fix/cobro-detalle-valor-nulo`: descarta la línea en el alta y la rechaza en la
edición. Este cambio cierra la puerta en el cliente.

## Cambio

En `addCobroDetalle`, justo después de `if (this.esCero(saldo)) return …` y **antes** del bloque de descuento
(así no se toca `isDescuento`, `selectedMoneda`, `selectedFormaPago` ni `isVuelto`):

`if (esLineaNueva && !this.isDescuento && this.vueltoControl.enabled && !valor)` → aviso «Ingresá el valor del
cobro.», foco en «Valor» y `return`.

- `!valor` cubre `null` (la X hace `vueltoControl.setValue(null)`), `0` (borrar con Backspace: el currencyMask
  tiene `nullable: false` y deja 0, `numbersUtils.ts` / `moneda.service.ts`) y `NaN`. Una línea «Pago» de 0 no
  rompe el balance, pero es basura (auditoría eje B).
- `!this.isDescuento`: el descuento toma el valor del saldo, no del campo.
- `this.vueltoControl.enabled`: con CONVENIO el campo está deshabilitado y hoy el Enter no hace nada
  (`vueltoControl.valid` es false). Sigue así, sin aviso (auditoría eje A, R1).

Por qué no `Validators.required` en `vueltoControl`:
- el replay de las líneas ya guardadas (`addCobroDetalle(null, c)` al abrir un delivery) pasa por el mismo
  control. Una fila vieja con `valor` NULL (hay en la 1, la 11 y la 18) dejaría de verse en vez de verse como
  hasta hoy;
- y frenaría el descuento, que no depende del campo.

`onAumento` no llega con null (exige `valor < 0`). `pago-touch` ya tiene `Validators.required` y no cambia.

## Tests

`edit-delivery-dialog.component.spec.ts` es el scaffold de `ng generate`, sin providers. Se reemplaza por uno
que instancia el componente con `new` y stubs, sin TestBed: así no corren el template ni los `setTimeout`.

Casos:
- línea nueva con valor `null` (la X) y con `0` (Backspace): no se agrega a `cobroItemList`, no llama a
  `onSaveCobroDetalle` y `vueltoControl` no se reescribe;
- con monto se agrega como siempre;
- replay de una línea guardada (con `id`) con valor null se sigue agregando;
- con CONVENIO (campo deshabilitado) no avisa.

Con el código viejo fallan los casos de null y 0, porque la línea se agrega. El desktop no corre Karma en el CI
(matriz 0.2), así que el test es evidencia, no un gate. Se corre acotado a este spec, con un tsconfig temporal
(memoria «Desktop: arranque sin xvfb»).

## Prueba por pantalla

Desktop web contra el filial local (8082, sucursal 24):
1. **Delivery nuevo:** pago 100.000, después X + Enter, y después Backspace hasta vaciar + Enter. Las dos
   veces aparece el aviso y no se agrega ninguna línea. El vuelto y el guardado siguen como siempre.
2. **Delivery guardado:** lo mismo desde «Editar info.». Se ve el aviso y no sale ninguna request.
3. **Descuento y aumento** con el campo vacío o con monto: sin cambios.

## Despliegue

Solo cliente. Sin orden con el filial (PR borrador filial #287): cada uno corta la línea sin monto por su lado.
Hasta que el filial #287 llegue a bodega, un desktop sin actualizar sigue pudiendo mandar la línea NULL.
El filial no frena una línea de valor 0: este cambio es lo único que la corta. El desktop lo ven los
usuarios cuando actualicen («Cerrar y actualizar»).
