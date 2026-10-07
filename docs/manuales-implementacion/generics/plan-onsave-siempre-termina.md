# Plan: `onSave` siempre termina y avisa (PR 14b)

Parte de #390. Repo: desktop. Sin cambios en el central.
Rama `fix/generico-onsave-siempre-termina` desde `origin/develop`.

## 1. El problema [relevado sobre `origin/develop`]

`GenericCrudService.onSave` abre «Guardando…» y:

| Resultado | Hoy |
|---|---|
| Guardó | emite, completa, «Guardado con éxito» |
| Rechazo del servidor | «Ups! Algo salió mal…» y llega como error a quien llama |
| Rechazo con datos parciales | emite los datos y **no completa** |
| Error de red, corte del link, central offline | cierra el modal y **nada más**: no avisa, no emite, no completa |

O sea: sin red, el usuario aprieta «Guardar», el modal desaparece y la pantalla queda igual, sin decir nada. Y quien
espera el resultado queda esperando para siempre. Solo los que pasan `errorConf` con `propagate` reciben el error
(unos 30 consumidores ya migrados por módulo).

Lo consumen unos 105 lugares vivos (el total con wrappers es ~152). Del relevamiento:
- **~50 sin `error:` ni bandera** (rrhh, personas, empresarial, configuración, activos, `venta-touch` al guardar un
  ítem): hoy un rechazo ya les llega como error sin manejar; sin red no pasa nada y nadie avisa.
- **~57 con `error:` que solo apaga una bandera o avisa**: hoy ese `error:` no corre sin red y la bandera queda
  encendida (`isSaving` en proveedor y sus variantes, hoja de ruta, vinculación de ente, subida de archivos de ente).
- **Cadenas que no cierran**: la lista de transferencias (un `await` que no resuelve y deja sin correr su limpieza),
  «agregar desde sucursal» (queda `guardando` para siempre), el retiro de pre-gasto.
- **Ninguno** hace `err[0].message` ni muestra un «ya existe» falso ante un error que no sea arreglo.

## 2. Cambio

### En el genérico
- **Error de red** (cualquiera: sin conexión, central offline, HTTP 4xx/5xx): `onSave` **propaga siempre el error**
  a quien llama, como ya hace `onSaveCustom`.
- **Aviso**: «No se pudo confirmar si se guardó (<Error de red | HTTP N>): verificá antes de repetir.», sin
  repetir si fallan varios guardados juntos. No se suma cuando el corte ya lo avisó el link, ni para quien pasó su
  propia configuración de error de red (los ~30 migrados, que ya avisan lo suyo): para ellos no cambia nada.
- **Rechazo con datos parciales**: emite y **completa**.
- Si el guardado completa sin emitir: llega como error de «respuesta vacía» (hoy quedaría esperando).
- Sin usuario en sesión ya no rompe al armar el pedido.

Por qué propagar el error y no «emitir `null` y completar»: en un guardado, `null` haría pasar por éxito algo que
no se sabe si se guardó. Relevado: con `null` el diálogo de gasto de caja resetearía el formulario, solicitud de
pago diría «creada», la subida de archivos diría «cargado», el alta de funcionario borraría la persona y el usuario
recién creados, y varios romperían con TypeError.

### Consumidores que se tocan en el mismo PR
Los que con un error nuevo quedarían peor o igual de colgados:
- **Caja (filial)**: `adicionar-gasto-dialog` (finalizar: el spinner propio se cierra solo en el éxito → cerrarlo
  siempre; guardar: `error:`), `adicionar-caja-dialog` (abrir caja: `error:`).
- **Transferencias**: `edit-transferencia` (dos guardados envueltos en promesas sin `catch`) y `edit-devolucion`.
- **Alta de funcionario por pasos** (`funcionario-wizard`): `error:` en la cadena persona → usuario → funcionario,
  sin borrar lo creado ante un error de red.
- Los que desreferencian el resultado sin mirar (`edit-transferencia`, `add-categoria-dialog`).

### Lo que se arregla solo (se verifica, no se toca)
Las banderas de los ~57 con `error:`, la lista de transferencias, «agregar desde sucursal», el retiro de pre-gasto.

## 3. Lo que no cambia
- Los ~50 consumidores sin `error:`: reciben el error sin manejarlo, **igual que hoy ante un rechazo** (queda en la
  consola; el aviso lo da el genérico). Agregarles un `error:` a cada uno es otro PR, por módulo.
- Quien ya muestra su propio aviso genérico («Error al guardar…») lo sigue mostrando, ahora también sin red, después
  del aviso del genérico.
- `onSaveCustom`, `onSaveConDetalle`, `onDelete`: otros PRs.
- El central: ninguna de estas operaciones es idempotente (#376).

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix: manejar el error al guardar en caja, transferencias y alta de funcionario` (consumidores; sin efecto mientras el genérico no propague) |
| 2 | `fix: avisar y propagar el error de red en onSave en vez de no hacer nada` (genérico + tests) |

`npm run check` antes de cada push. Tests del genérico con Karma (`--include`; necesita #432 o el arreglo local).

## Prueba de runtime

Central local (replicación apagada), filial local, desktop en el navegador, con fallas inyectadas por operación.
1. Sin red: un guardado de cada grupo (rrhh, personas, empresarial, configuración) → aviso, el diálogo queda
   abierto y se puede reintentar; nada colgado.
2. Proveedor, hoja de ruta: la bandera se apaga.
3. Caja (filial): guardar y finalizar un gasto, abrir caja, guardar un ítem de venta → aviso, sin spinner colgado,
   el formulario del gasto no se resetea.
4. Transferencias: guardar la cabecera y cambiar de etapa en lote desde la lista.
5. Rechazo real y respuesta vacía: como hoy.
6. Los ya migrados (familia, código, precio, bienes, chequera, cobro): **un** aviso, el suyo.
7. Guardados normales siguen funcionando.

## Riesgos
- Cambio de comportamiento para todos los consumidores de `onSave`. Lo nuevo es que el `error:` de quien lo tiene
  corre también sin red: se revisaron los ~57 y ninguno asume la forma del error.
- El aviso «no se pudo confirmar si se guardó» aparece en pantallas que hoy fallan en silencio.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Hechos corregidos
- **Código muerto** (sin quién los abra): `add-categoria-dialog` del PDV, `adicionar-proveedor-dialog`,
  `ente-vinculacion-dialog`, además de `edit-pago`, `pago-detalle-dialog` y `adicionar-detalle-compra-item-dialog`.
  Salen del plan y de la prueba.
- **«Los ya migrados avisan lo suyo» no es cierto para todos**: el alta de cliente y la actualización de una
  solicitud de pago reciben el error de red y **no avisan nada** (hoy tampoco).
- **El retiro de pre-gasto no «se arregla solo»**: guarda el gasto en el filial y después ejecuta el retiro en el
  central. Si el primer paso queda sin respuesta, su `error:` dice «No se pudo registrar el retiro» y rehabilita
  el botón: un segundo clic crea **otro gasto**. Lo mismo la hoja de ruta (otra hoja).
- El modal «Guardando…» se abre después de leer el usuario: sin sesión no queda un modal huérfano. No se toca esa
  parte (mandar el guardado sin usuario sería peor que abortarlo).
- El commit de consumidores no es «sin efecto»: sus `error:` nuevos ya corren hoy ante un rechazo.

### Criterio de aviso (reemplaza el de arriba)
El genérico avisa ante un error de red **salvo** que quien llama pida expresamente que no (`networkError.show =
false`) o que el corte ya lo haya avisado el link. Entonces:
- los que ya avisan por su cuenta piden que no: los que usan `PROPAGAR_ERROR_DE_RED` ya lo hacen; se agrega al
  cobro del PDV y al alta de solicitud de pago;
- **inicio y cierre de sesión** (que usan `onSave` para registrar la sesión) piden que no: ahí «verificá antes de
  repetir» no tiene sentido. De paso el cierre de sesión deja de colgarse sin red;
- el alta de cliente deja de pedir silencio, y la actualización de solicitud de pago suma su aviso.
Texto: «No se pudo confirmar si se guardó (Error de red | El central no responde | HTTP N): pudo haberse aplicado,
verificá antes de repetir.»

### Alcance: se parte en dos PRs
**Este PR (14b)**: el genérico, el criterio de aviso, y solo los consumidores que con el error propagado quedarían
**peor que hoy**:
- `edit-transferencia`: sus dos guardados son promesas que no rechazan → quedarían pendientes; y la creación de la
  cabecera desreferencia el resultado.
- `edit-devolucion`: `then` sin `catch`.
- Gasto de caja, **finalizar**: el spinner propio se cierra siempre.
- Gasto de caja, **guardar** y **abrir caja**: `error:` que no pierde lo cargado y avisa qué revisar.
- **Retiro de pre-gasto** y **hoja de ruta**: ante un «sin respuesta» no se rehabilita el botón a ciegas (aviso
  «verificá en la lista» y cierre).
- `venta-touch`, guardar ítem de un delivery: aviso propio («verificá el delivery antes de volver a escanear»).

**PR siguiente (14c), anotado**: lo que ya está mal hoy ante un rechazo y necesita lógica propia, no solo no
empeorar: alta de funcionario por pasos (compensar lo creado según en qué paso falló, y reanudar), abrir caja
(adoptar la caja si ya quedó abierta), gasto de caja (detectar si el gasto ya figura), asignar ruta en lote y
«agregar impresoras desde sucursal» (cortar el lote al primer «sin respuesta»).

### Otros
- Quien ya muestra «Error al guardar…» (proveedor y su variante de servicio) queda con dos avisos seguidos y algo
  contradictorios sin red. Se deja; anotado.
- Los ~50 sin `error:` no se tocan: el error queda en la consola, como hoy ante un rechazo.
- Se corren los specs existentes de los componentes tocados (un error nuevo sin manejar puede hacer fallar un test).

## Fases (reemplaza la tabla de arriba)

| Fase | Commit |
|---|---|
| 1 | `fix: no quedar peor ante un error al guardar en caja, transferencias y hoja de ruta` (consumidores) |
| 2 | `fix: no avisar «verifica antes de repetir» al registrar la sesion ni duplicar avisos propios` (quién pide silencio; cliente y solicitud de pago) |
| 3 | `fix: avisar y propagar el error de red en onSave en vez de no hacer nada` (genérico + tests) |

## Prueba de runtime: casos que se agregan
Cierre e inicio de sesión sin red (hoy el cierre se cuelga); alta de cliente y actualización de solicitud de pago
sin red (hoy mudos); retiro de pre-gasto sin respuesta en el primer paso y segundo clic; hoja de ruta; cobro del
PDV (un solo aviso); central offline con un guardado que sí llega; HTTP 4xx/5xx; varios guardados fallando juntos.

## Auditoría del plan (paso 5, 2026-10-06)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Alta de cliente y actualización de solicitud de pago quedaban sin ningún aviso | alta | criterio de aviso nuevo |
| A | Retiro de pre-gasto y hoja de ruta: el error propagado rehabilita el botón y permite duplicar | alta | entran en este PR |
| B | Inicio y cierre de sesión mostrarían «verificá antes de repetir» | alta | piden silencio |
| A | `edit-transferencia`: las promesas no rechazan | alta | entra |
| A | Tres consumidores del plan son código muerto | media | fuera |
| A | Alta de funcionario, abrir caja, gasto, lotes: necesitan lógica propia | alta/media | PR 14c |
| A | «Sin usuario ya no rompe» mandaría el guardado sin usuario | media | no se toca |
| B | Central offline: decir que pudo haberse aplicado | media | en el texto |
| B | `error: () => {}` en los ~50 | — | no |
| B | Tamaño | media | dos PRs |

## Implementación: desvíos

- **Ítem de un delivery en el PDV**: quedó sin aviso propio (el plan lo pedía). Solo deja de quedar el error sin
  manejar; el aviso lo da el genérico.
- **Texto del aviso**: con un status HTTP dice «el servidor respondió HTTP N» en vez de «pudo haberse aplicado».
- **Retiro de pre-gasto**: además de lo planeado, el servicio informa en cuál de los dos guardados falló. Si falló
  el retiro en el central (rechazo o red), el gasto del filial ya está guardado y el diálogo se cierra con ese aviso:
  esto ya pasaba hoy ante un rechazo y permitía duplicar el gasto.
- **Hoja de ruta**: se cierra ante un «sin respuesta» solo en un alta; una edición queda abierta (repetirla es inocuo).
- **Solicitud de gasto** (`preGastoGuardar`): no estaba en el plan; su `error:` decía «No se pudo registrar» también
  sin respuesta.
- Una respuesta sin `data` ni `errors` se trata como respuesta vacía (antes rompía dentro del genérico y no terminaba).
- El alta de cliente conserva su `propagate` y solo deja de pedir silencio.
- Se verificó con `npm run check` el estado final, no cada commit intermedio por separado.

## Prueba de runtime (paso 9, 2026-10-06)

Central local `:8081` (replicación apagada, schedulers en «Negative matches»), filial local `:8080`, desktop con
`ng serve -c web`. Fallas inyectadas en el navegador por operación (red, HTTP 404, rechazo, cuerpo vacío).

| Caso | Resultado |
|---|---|
| Guardar un feriado: red / HTTP / rechazo / vacío / normal | aviso «No se pudo confirmar si se guardó…» y diálogo abierto / ídem con el status / «Ups!…» / «Ups!… Respuesta vacía» / guarda y cierra |
| Registro de sesión con error de red | el error llega a quien llama, sin aviso |
| Gasto de caja (filial), guardar: red / rechazo | no pierde lo cargado, relee la lista / no relee |
| Gasto de caja, finalizar: red / rechazo | sin spinner colgado |
| Abrir caja (filial) con error de red | vuelve al maletín; la caja abierta no se toca |
| Retiro de pre-gasto (servicio reemplazado, con la forma real del error de Apollo): gasto sin respuesta / gasto rechazado / retiro rechazado o sin red / error previo | cierra y relee / queda abierto / cierra «el gasto quedó registrado…» y relee / queda abierto |
| Hoja de ruta (alta): rechazo / red | queda abierta / se cierra sin resultado |

No probado en runtime: edición de transferencia y devolución, alta de cliente, solicitud de pago, cobro del PDV,
solicitud de gasto, edición de hoja de ruta; un guardado real de gasto o de apertura de caja (para no crear datos ni
imprimir); un cierre de sesión real sin red; el corte del link a los 60 s y el de «central offline».
Tests: `generic-crud.on-save.spec.ts`, 13 de 13.

## Auditoría del diff (paso 8, 2026-10-06)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Retiro de pre-gasto: el error de red de Apollo es `instanceof Error` y la rama «sin confirmar» no se activaba (la prueba había usado un objeto plano) | alta | el servicio marca la etapa; reprobado con la forma real |
| Retiro de pre-gasto: un rechazo del retiro en el central deja el gasto guardado y el botón habilitado | media | se cierra con aviso |
| Solicitud de gasto: «No se pudo registrar» ante un sin respuesta | media | no lo dice |
| `onSave` no terminaba con una respuesta sin `data` ni `errors` | media | respuesta vacía |
| La mutation que termina sin emitir fallaba sin aviso | baja | avisa |
| Hoja de ruta: cerrar también en una edición | baja | solo en alta |
| `.catch` que tragaba errores propios del `then` | baja | segundo argumento del `then` |
| Gasto de caja: tras un sin respuesta el botón queda habilitado (relee, no bloquea) | media | queda para el 14c |
| Sesión, cobro, solicitud de pago, cliente: quién avisa en cada camino; specs existentes | — | verificado, sin hallazgos |
