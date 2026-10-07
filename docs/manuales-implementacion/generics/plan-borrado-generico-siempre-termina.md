# Plan: el borrado genérico siempre termina, y los guardados en varios pasos no quedan a medias

Continuación de #390 (cerrado). Repo: desktop. Sin cambios en el central ni en el filial.

## 1. El problema [relevado sobre `develop`]

### `onDelete` y `onDeleteWithSucId`
58 wrappers en services; 35 con llamadores vivos (~41 sitios).

1. **Cancelar la confirmación deja la pantalla tapada.** El genérico abre «Eliminando…» antes de mirar si el
   usuario confirmó. Si cancela, nadie lo cierra: fondo oscuro a pantalla completa hasta 65 s (el botón «Cerrar»
   aparece a los 10 s), y mientras tanto ningún otro «Buscando…» se cierra. Afecta a los ~23 borrados con
   confirmación (transferencia y sus ítems, ítems de inventario y de devolución, tipo de gasto, terminal POS,
   horario, código, precio por sucursal, impresora, vehículo, equipos, sector, zona…). Además no emite ni completa.
2. **Sin confirmación, ante un rechazo o un error de red emite `null` y no completa.**
3. **Ante un error de red no avisa nada** (en ninguna rama). Un borrado es una escritura: pudo haberse aplicado.
4. **Dice «Eliminado con éxito» sin mirar la respuesta.** El backend devuelve `false` cuando no borró
   (`CrudService.deleteById` atrapa la excepción y devuelve `false`).
5. **`onDeleteWithSucId` con confirmación manda el borrado sin el `sucId`.** Hoy nadie usa esa rama (los dos
   wrappers, ítem de venta y detalle de cobro, van sin confirmación): latente.
6. **Consumidores que tratan cualquier respuesta como éxito** (4), todos en compras / pagos:
   - solicitud de pago, editar un detalle: borra el viejo y agrega el nuevo; si el borrado falló, queda duplicado;
   - solicitud de pago, quitar un detalle: saca la fila aunque no se borró;
   - solicitudes de pago de una compra: «Solicitud eliminada exitosamente» con el borrado fallido;
   - detalle de pago, quitar una cuota: la saca, avisa éxito y recalcula la cantidad de cuotas.
   Seis consumidores tienen un `error:` que hoy no corre nunca.

### Guardados en varios pasos sin manejo de error (`onSave` ya propaga)
De 58 guardados sin `error:`, cinco dejan algo a medias o colgado:
- **Ítem de compra**: abre un modal propio que solo cierra si el guardado sale bien → pantalla tapada 65 s.
- **Asistente de funcionario** (en desuso): persona → usuario → funcionario; el deshacer esperaba un `null` que ya
  no llega.
- **Cliente nuevo**: guarda la persona y después el cliente; si el segundo falla queda la persona sola, sin aviso
  propio.
- **Legajo, información general**: guarda la persona y después el funcionario; si el segundo falla queda la mitad.
- **Alta de funcionario** (diálogo): al guardar no cierra ni avisa nada.

## 2. Cambio

### El genérico de borrado
Una sola implementación para los dos métodos:
- El «Eliminando…» se abre **después** de confirmar. Cancelar **completa sin emitir**.
- **Siempre termina**: éxito → `true` y completa; rechazo → aviso y `null` y completa (como hoy con confirmación).
- **Error de red**: avisa «No se pudo confirmar si se eliminó (error de red): pudo haberse aplicado, verificá
  antes de repetir» y emite `null` y completa. No se cambia a `obs.error`: ~36 consumidores hacen `if (res)` y con
  `null` ya hacen lo correcto.
- **Respuesta `false` del backend**: aviso «No se pudo eliminar» y `null`, en vez de «Eliminado con éxito».
- `onDeleteWithSucId` manda el `sucId` también con confirmación.
- Tests del genérico.

### Consumidores del borrado
Los cuatro que tratan cualquier respuesta como éxito pasan a mirar el resultado: si no se borró, no siguen (no
agregan el detalle nuevo, no sacan la fila, no avisan éxito, no recalculan).

### Guardados en varios pasos
- Ítem de compra: cerrar su modal también ante el error.
- Cliente nuevo y legajo: si falla el segundo paso, decir qué quedó guardado y qué no («La persona se guardó,
  pero el cliente no: volvé a guardar»), y que reintentar no duplique la persona (se reusa la ya guardada).
- Alta de funcionario: cerrar el diálogo al guardar.
- Asistente de funcionario: no se toca (pantalla en desuso, dicho por Franco).

## 3. Lo que no cambia
- Los ~36 consumidores de borrado que ya miran el resultado.
- `onCustomMutation`, `onSaveCustom`: ya terminan.
- `onSaveConDetalle` (ante error de red emite `null` sin aviso) y `onCustomSub`: anotados para otro PR.
- Los 53 guardados sin `error:` y sin estado: el aviso lo da el genérico.

## Fases
| Fase | Commit |
|---|---|
| 1 | `fix: no dar por eliminado lo que no se elimino en solicitudes de pago y cuotas` (consumidores) |
| 2 | `fix: el borrado generico siempre termina, avisa el error de red y no tapa la pantalla al cancelar` (+ tests) |
| 3 | `fix: no dejar a medias ni sin aviso los guardados de cliente, legajo e item de compra` |

`npm run check` antes de cada push.

## Prueba de runtime
Central y filial locales, desktop en el navegador, fallas inyectadas por consulta.
1. Borrado con confirmación (tipo de gasto o terminal POS, sobre un registro de prueba creado para eso):
   cancelar (sin pantalla tapada), confirmar con rechazo, con error de red, y normal.
2. Borrado sin confirmación en el PDV contra el filial: quitar un ítem de una venta en curso, con error y normal.
3. Solicitud de pago: quitar y editar un detalle con el borrado fallando (no duplica ni saca la fila).
4. Cliente nuevo con el segundo guardado fallando: aviso, y al reintentar no duplica la persona.
5. Ítem de compra con el guardado fallando: sin modal colgado.

## Riesgos
- Es el borrado de todo el sistema (35 wrappers vivos). El contrato para quien llama casi no cambia (`true` / `null`);
  lo nuevo es que completa siempre y que cancelar completa sin emitir.
- La respuesta `false` pasa de «éxito» a «no se pudo eliminar»: si algún resolver devuelve `false` habiendo
  borrado, se vería un error falso. Se revisan los resolvers de los 35 wrappers vivos.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Hechos corregidos
- **Solicitudes de pago ya están protegidas**: el servicio convierte un borrado fallido en error (#390), así que
  editar / quitar un detalle y eliminar una solicitud ya no tratan el fallo como éxito. De los cuatro
  consumidores queda **uno**: quitar una cuota en el detalle de pago.
- **Cliente nuevo y legajo no duplican la persona al reintentar**: el segundo intento ya manda el id de la
  persona guardada. Solo falta decir qué quedó guardado.
- **Alta de funcionario**: el genérico ya avisa «Guardado con éxito». Que no cierre el diálogo no es un bug: se
  saca del plan.
- **La respuesta `false` no se puede leer igual en todos**: la mayoría de las mutations de borrado no usan el
  alias `data` (ítem de venta, detalle de cobro, tipo de gasto, terminal POS, transferencia…).

### Cambio al diseño: la respuesta `false` no se toca en este PR
El backend devuelve `false` tanto cuando no pudo borrar como cuando **el registro ya no existe**. En el PDV eso
importa: si quitar un ítem falla por red, el borrado pudo haberse aplicado; al repetir, el backend contesta
`false` y hoy el ítem sale del carrito. Si `false` pasara a ser «no se pudo eliminar», ese ítem no saldría nunca.
Un `false` real por otra causa es raro (una restricción de la base llega como error, no como `false`).
→ Se deja como hoy y se anota. Hacerlo bien pide que el backend distinga «ya no existe» de «no pude».

### Fases (reemplaza la tabla)
| Fase | Commit |
|---|---|
| 1 | `fix(pago): no dar por eliminada una cuota que no se elimino` |
| 2 | `fix: el borrado generico siempre termina, avisa el error de red y no tapa la pantalla al cancelar` (+ tests) |
| 3 | `fix: cerrar el modal del item de compra y avisar el guardado a medias de cliente y legajo` |

Un solo PR: con las correcciones, las fases 1 y 3 son chicas.

## Auditoría del plan (paso 5, 2026-10-07)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | `false` → error: sin alias no se lee, y «ya no existe» también es `false` (PDV) | alta | no se toca `false`; anotado |
| A | Tres de los cuatro consumidores ya estaban protegidos por el servicio | alta | fase 1 reducida a la cuota |
| A | Cliente y legajo no duplican al reintentar | media | solo el aviso |
| A | Alta de funcionario no es un bug | baja | fuera del plan |
| A | Cancelar completando sin emitir: nadie depende de lo contrario | — | confirmado |
| A | Aviso doble donde el consumidor ya avisa su error | baja | se revisa en la fase 2 |
| B | `null` y completar, no `obs.error` (~36 consumidores con `if (res)`) | — | confirmado |
| B | Separar en dos PRs | media | no: tras las correcciones el resto es chico |

## Decisiones de Franco (2026-10-07)
- Aprobado, con la respuesta `false` del backend fuera del alcance.

## Implementación: desvíos
- `onDelete` y `onDeleteWithSucId` comparten una sola implementación privada (`eliminar`).
- El aviso doble no se toca: donde el consumidor ya avisa su error (solicitudes de pago), su texto y el del
  genérico se complementan.
- En cliente y legajo, además del aviso del segundo paso, el primer guardado atrapa su error (el aviso ya lo da
  `onSave`).

## Prueba de runtime (2026-10-07)
Central propio en `:8085` (replicación apagada y verificada), desktop en `:4202`; rechazo y corte de red
inyectados por consulta. El borrado se probó con «eliminar tipo de gasto» sobre un id que no existe, para no
borrar nada.

| Caso | Resultado |
|---|---|
| Borrado con confirmación, cancelar | completa sin emitir; ningún «Eliminando…» pendiente; pantalla libre |
| Borrado con confirmación, rechazo del servidor | «Ups! Ocurrió algun problema al eliminar: …», `null`, completa |
| Borrado con confirmación, corte de red | «No se pudo confirmar si se eliminó (error de red)…», `null`, completa, modal cerrado |
| Cliente nuevo con el guardado del cliente fallando | aviso de `onSave` + «Los datos de la persona se guardaron, pero el cliente no»; el diálogo queda abierto |
| Cliente nuevo, reintento | manda el id de la persona ya guardada (no duplica) |
| Tests del borrado (Karma) | 13 de 13 |

El guardado de la persona se simuló y el del cliente se cortó: no se escribió nada.

**No probado en runtime**: un borrado que sí borra, quitar un ítem de una venta en el PDV, quitar una cuota,
el ítem de compra y el legajo.

## Auditoría del diff (paso 8, 2026-10-07)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Con un error HTTP (502 de un proxy) el aviso negaba un borrado que pudo aplicarse | media | mismo texto que `onSave`: «no se pudo confirmar… respondió HTTP N» |
| Aviso doble en solicitudes de pago, cliente y legajo | baja | se deja: los textos se complementan |
| Sin limpieza: si quien llama se va con la confirmación abierta, confirmar igual borra | baja | igual que antes; anotado |
| Textos de confirmación, condición de `showDialog`, variables, los dos wrappers con `sucId` | — | equivalentes a lo anterior |
