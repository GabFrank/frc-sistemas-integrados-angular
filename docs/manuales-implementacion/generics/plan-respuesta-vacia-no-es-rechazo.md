# Plan: una respuesta vacía del servidor no es un rechazo (PR 12)

Parte de #390. Repo: desktop. Rama: `fix/respuesta-vacia-no-es-rechazo-en-guardados` desde `origin/develop`.

## El problema

`GenericCrudService` convierte una respuesta vacía de Apollo (cuerpo vacío, operación cortada) en un error
sintético «Respuesta vacía del servidor», que llega al que llama **como arreglo de errores**, igual que un rechazo
GraphQL. Pero no es un rechazo: el servidor pudo haber aplicado la operación.

Seis manejadores ya mergeados (PRs #391–#410) distinguen «rechazo» de «sin respuesta» con `Array.isArray(error)`.
Ante una respuesta vacía dicen «no se guardó, reintentá» (o no dicen nada) cuando deberían tratarla como incierta.
Desde el #416 existe `esRechazoDelServidor(error)` (arreglo no vacío **y** ninguno es la respuesta vacía), que usan
los PRs posteriores. Este PR migra los seis.

## Lugares [verificado leyendo]

| # | Archivo | Hoy ante una respuesta vacía | Riesgo |
|---|---|---|---|
| 1 | `pdv/comercial/venta-touch/pago-touch/pago-touch.component.ts` `cobroDeliveryNoRegistrado` | «No se pudo registrar el cobro: reintentá» | **cobro duplicado** en el delivery |
| 2 | `pdv/comercial/venta-touch/list-delivery/edit-delivery-dialog/edit-delivery-dialog.component.ts` `cobroNoRegistrado` | igual | **cobro duplicado** |
| 3 | `pdv/comercial/venta-touch/venta-touch.component.ts` (error de guardar venta) | solo el «Ups… Respuesta vacía» del genérico; no sale «Verifique antes de continuar» | venta repetida sin verificar |
| 4 | `productos/producto/ajustar-stock-dialog/ajustar-stock-dialog.component.ts` | lo toma como «no se aplicó, se puede reintentar» | **ajuste de stock duplicado** |
| 5 | `productos/precio-por-sucursal/adicionar-precio-dialog/adicionar-precio-dialog.component.ts` | queda abierto para reintentar; si ya se bajó el principal afirma «No se guardó el precio nuevo» | precio duplicado / afirmación falsa |
| 6 | `productos/codigo/adicionar-codigo-dialog/adicionar-codigo-dialog.component.ts` | queda abierto para reintentar | código repetido (el diálogo valida «en uso» contra lo ya cargado, que no incluye el recién guardado) |

No se tocan (revisados): `solicitud-pago` (ya excluye la respuesta vacía por texto), `add-familia`, `sub-familia`,
`presentacion`, `ente.service`, `estado-formulario-bien`, `gps-config-dialog`, `producto.component` (usan
`esRechazoDelServidor` para el estado; su `Array.isArray` solo evita un segundo aviso), `factura-legal` y
`qr-pos/mensaje-error` (solo arman el texto del mensaje).

## Cambio

En los seis, `Array.isArray(error)` → `esRechazoDelServidor(error)` donde decide «rechazo». La respuesta vacía cae
entonces en la rama «sin respuesta» que cada uno ya tiene (marcar el delivery como cobro incierto, releer el stock
y comparar, cerrar y pedir revisar, avisar «verifique antes de continuar»).

Detalles:
- **Aviso**: en la rama «sin respuesta» el aviso propio sale también para la respuesta vacía. El «Ups… Respuesta
  vacía del servidor» del genérico no dice qué hacer; el propio sí («cerrá y abrí el delivery…»). Son dos avisos
  en ese caso, a propósito.
- **Cobro de delivery con resultado `null` sin error** (1 y 2): hoy se pasa `[]` para tratarlo como rechazo. Con el
  helper, `[]` no es rechazo y pasa a **incierto** (cerrar y releer el delivery). Es lo más seguro: un `null` sin
  error no prueba que no se guardó. [decisión a revisar en la auditoría]
- **Precio** (5): con respuesta vacía y el principal ya bajado, el texto pasa a ser el de «no se pudo confirmar»,
  no «no se guardó».

## Persistencia, migraciones, replicación, multi-repo

Solo desktop. Sin migraciones ni schema.

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(pdv): no tratar una respuesta vacia como rechazo al guardar venta o cobro` (1, 2, 3) |
| 2 | `fix(productos): no tratar una respuesta vacia como rechazo en stock, precio y codigo` (4, 5, 6) |

## Prueba de runtime

Una respuesta vacía real no se puede provocar a pedido: se simula reemplazando el método del servicio por uno que
falla con el mismo arreglo que arma el genérico.

- Productos (central local): ajuste de stock → relee y compara; precio → cierra con «no se pudo confirmar»;
  código → cierra y recarga. En cada uno, además, un rechazo real simulado sigue dejando reintentar.
- PDV (filial local :8080): cobro de un delivery en los dos diálogos → queda «cobro incierto» y bloquea; venta →
  aviso «Verifique antes de continuar». Si el estado de la caja local no permite llegar a esas pantallas, se prueba
  el manejador directamente sobre el componente abierto y se deja dicho.

## Riesgos

- Cambio chico y mecánico, pero en el camino de cobro: se revisa que ningún rechazo real deje de reconocerse
  (un arreglo con mensaje distinto sigue siendo rechazo).

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Cobro de delivery: el `null` sin error sigue siendo un rechazo
En el filial, `CobroDetalleService.saveAndSend` devuelve `null` **sin guardar nada** cuando el cobro ya tiene un
descuento (regla de «descuento único»). Es un «no» determinista, no una incertidumbre: pasarlo a incierto bloquearía
el cobro del delivery por una regla de negocio. Entonces:
- `cobroDeliveryNoRegistrado` y `cobroNoRegistrado` reciben un parámetro explícito `rechazado`; el llamador del
  `null` pasa `true` y el del `error:` pasa `esRechazoDelServidor(err)`. Se deja de usar `[]` como señal.
- El aviso del `null` pasa a «El servidor no registró la línea (¿ya hay un descuento en este cobro?)».

### Precio con el principal ya bajado
Con respuesta vacía y el principal anterior ya quitado, el aviso de «no se pudo confirmar» agrega que **el principal
anterior ya se había quitado** (hoy esa información solo sale en la rama de rechazo).

### Fase 3: el aviso propio también ante una respuesta vacía en las altas
Corrección a «No se tocan»: `producto.component` **no** usa el helper; suprime su aviso con `!Array.isArray(error)`,
así que ante una respuesta vacía el usuario solo ve «Ups… Respuesta vacía del servidor», sin «pudo haberse guardado».
Lo mismo en las altas de subfamilia, presentación, familia y ente. No hay riesgo de duplicar (el estado ya lo maneja
el helper o la unicidad), es solo el texto: se alinean en una fase aparte para no mezclar decisión con texto.
Las ediciones (formularios de bienes, alertas del GPS) se dejan: reintentar es inocuo.

### Prueba
- Al menos un caso con **cuerpo HTTP vacío real** (ajuste de stock o precio): se intercepta `fetch` en el navegador
  para esa operación, de modo que pase por el link, `sinRespuestaVacia` y `limpiarErroresGraphQL` de verdad.
- Para cada lugar: respuesta vacía → rama incierta; rechazo con otro mensaje → sigue reintentable.
- Sin tests unitarios nuevos: el gate del repo no los corre (ver `frc-desktop`); se deja dicho.

### Fuera de este PR (se anota)
Diálogos de financiero que dejan reintentar ante **cualquier** error sin distinguir (pago de compras, emitir cheque,
chequeras, anular en caja mayor): no usan `Array.isArray`, es un problema anterior y más amplio (también ante un
error de red). Va a un PR propio del #390.

## Fases (reemplaza la tabla de arriba)

| Fase | Commit |
|---|---|
| 1 | `fix(pdv): no tratar una respuesta vacia como rechazo al guardar venta o cobro` |
| 2 | `fix(productos): no tratar una respuesta vacia como rechazo en stock, precio y codigo` |
| 3 | `fix(productos): avisar que un alta pudo guardarse cuando la respuesta llega vacia` (producto, subfamilia, presentación, familia, ente) |

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A/B | El `null` sin error del cobro es la regla de «descuento único» del filial: pasarlo a incierto era una regresión | alta | sigue como rechazo, con parámetro explícito y texto más claro |
| A | `producto.component` no usa el helper; varias altas suprimen su aviso ante la respuesta vacía | media | fase 3 |
| B | Precio: la rama incierta perdía «el principal ya se quitó» | media | se agrega al texto |
| B | La prueba con un método reemplazado no pasa por el camino real | media | un caso con cuerpo HTTP vacío real |
| A | Diálogos de financiero reintentables ante cualquier error | media | anotado para un PR propio |
| A | La respuesta vacía llega como arreglo con el texto exacto por los seis caminos | — | verificado |
| B | Doble aviso en la rama incierta | baja | se mantiene (el del genérico no dice qué hacer) |
