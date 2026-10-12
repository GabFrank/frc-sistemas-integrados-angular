# Plan — errores de red en las altas de familia, subfamilia y presentación (issue #390, PR 11e)

Pieza: **desktop**. Rama: `fix/productos-errores-de-red-en-altas-de-familia-subfamilia-y-presentacion`, desde
`origin/develop` (f52c2b8d, ya con #410–#413). No depende de #414 (no toca promociones, envases ni
producto-proveedor). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS` (20 s).
Relevamiento: el del PR 11b (auditor de solo lectura sobre `productos/`, 2026-10-05) y la auditoría del plan 11d,
que verificó contra el central lo que se cita abajo; los tres diálogos y sus servicios releídos a mano de
`origin/develop`. Todo va al **central**.

## Regla (la de #391–#414)

Un guardado sin respuesta **pudo haberse aplicado**. En una edición (hay id) reintentar es inocuo. En un alta sin
unicidad en la base, reintentar **duplica**: no se reintenta a ciegas y nunca se afirma «no se guardó» (el corte
es del cliente; el central puede confirmar después). Un aviso por flujo.

## Qué pasa hoy [verificado]

- **Familia** (`add-familia-dialog` → `familiaService.onSaveFamilia` → `onSave` genérico, un solo llamador): con
  error de red el genérico se lo traga: no avisa, no emite, y el diálogo queda abierto sin que se sepa si guardó.
  Con error del servidor el `subscribe({ next })` sin `error:` deja una excepción sin capturar. Sin guarda contra
  el doble «Guardar».
- **Subfamilia** (`add-subfamilia-dialog` → `subfamiliaService.onSaveSubfamilia`, un solo llamador): el servicio
  envuelve en un `Observable` con un `subscribe` interno sin `error:` → ante **cualquier** error no emite ni
  completa (y tampoco completa cuando sale bien). El diálogo queda abierto, mudo.
- **Presentación** (`adicionar-presentacion` → `presentacionService.onSavePresentacion` → `onCustomMutation`, que
  ya propaga): el `subscribe` no tiene `error:` → excepción sin capturar; por red no hay ningún aviso.
- **Tipos de presentación** (`tipoPresentacionService.onGetPresentaciones`, un solo llamador): si no cargan, el
  select requerido queda vacío y no se puede guardar, sin explicación.
- **Posición de la subfamilia** (`onCountSubfamilia`, un solo llamador): sin `error:`; si falla, la lista de
  posiciones queda vacía. La posición **no se usa para ordenar en ningún lado** (las consultas ordenan por id).

Qué valida el central: **familia** tiene unicidad por nombre (`familia_unique`; responde «Ya existe una familia con
ese nombre»); **subfamilia** y **presentación** no tienen unicidad (la presentación solo valida «principal única»).

## Cambio

### Clasificar el error de un guardado (helper compartido)

`esRechazoDelServidor(error)` en `generic-crud.service.ts`: `true` solo si el error es un arreglo de errores
GraphQL **y** ninguno es «Respuesta vacía del servidor» (ese mensaje lo fabrica el genérico cuando el servidor
corta sin cuerpo: llega como arreglo pero es un «sin respuesta»). Rechazo = el central dijo que no → no se guardó,
se puede corregir y reintentar. Cualquier otra cosa = sin respuesta.

### Familia
- `onSaveFamilia` propaga el error de red (`PROPAGAR_ERROR_DE_RED`). El diálogo gana `error:` y el flag
  `guardando` (botón deshabilitado mientras guarda).
- Rechazo: queda abierto (el servicio ya avisó). Sin respuesta: aviso «No se pudo confirmar el guardado. Podés
  volver a intentar: si ya se guardó, el sistema lo va a indicar» y queda abierto. **Sin verificación**: la
  unicidad por nombre hace seguro el reintento (alta) y la edición es idempotente.

### Subfamilia
- `onSaveSubfamilia` se reescribe sin el `Observable` envoltorio: `onSave(..., PROPAGAR_ERROR_DE_RED).pipe(tap(...))`
  que mantiene la recarga de las listas en memoria (`onGetSubfamilias`, `familiaService.onGetFamilias`) solo cuando
  hay resultado, y completa.
- Diálogo: `error:` + `guardando`. Rechazo: queda abierto. Sin respuesta en **edición**: aviso y reintento libre.
- Sin respuesta en **alta**: Guardar queda **bloqueado** con un cartel fijo «No se pudo confirmar si la
  subfamilia se guardó. No vuelvas a cargarla sin revisar: cerrá y buscala en la lista» y un botón **Verificar**.
  Verificar busca las subfamilias de esa familia con ese nombre (`onSearchSubfamilia`, tamaño 100, comparando en el
  cliente nombre exacto sin espacios sobrantes ni diferencia de mayúsculas): si encuentra **exactamente una**,
  avisa «Ya existe: se guardó» y cierra devolviéndola (quien abrió el diálogo la selecciona, como en un guardado
  normal); en cualquier otro caso (ninguna, más de una, más resultados que la página, o la búsqueda tampoco
  responde) el cartel sigue y Guardar sigue bloqueado. Cancelar siempre disponible.
- **Posición**: `onCountSubfamilia` con `error:` que deja la lista vacía; no se bloquea nada. En edición, la
  posición actual se agrega a la lista para que el select no quede en blanco.

### Presentación
- `onSavePresentacion` ya propaga: el diálogo gana `error:` + `guardando`. Rechazo: queda abierto. Sin respuesta
  en **edición**: aviso y reintento libre.
- Sin respuesta en **alta**: mismo bloqueo con cartel y **Verificar**, que relee las presentaciones del producto
  (`onGetPresentacionesPorProductoIdParaDialogo`, no pagina) y compara descripción (con el reemplazo por la cantidad
  que hace el servicio cuando viene vacía), cantidad y tipo: exactamente una igual → cierra devolviéndola (trae
  `id`, así quien abrió recarga); si no, sigue bloqueado.
- **Tipos de presentación**: opt-in (`errorConf`, `contexto`) + cartel «No se pudieron cargar los tipos de
  presentación» con «Reintentar».

Sin cambio: `edit-producto/producto.component` (quien abre los tres diálogos: ya actúa solo si recibe la entidad),
`onDeleteFamilia` / `onDeleteSubfamilia` (sin llamadores), `familiaBS` / `subfamiliaBS` del constructor de los
servicios, el `onSave` genérico (se traga el error de red para quien no pasa `errorConf`: PR propio),
`add-familia-dialog` nunca carga posiciones (toda familia nueva queda en posición 1; no es de red).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(productos): avisar cuando no se confirma el guardado de una familia o subfamilia` |
| 2 | `fix(productos): no duplicar una presentacion cuando el alta queda sin respuesta` |

Fase 1: helper, familia y subfamilia (incluido el bloqueo + Verificar). Fase 2: presentación y tipos.
Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*).
**No se guarda nada con el central congelado.** El «sin respuesta» se simula reemplazando la mutation por un error
(con el central vivo, para que Verificar pueda leer):
1. Familia: error simulado → aviso, diálogo abierto, Guardar habilitado otra vez; rechazo real (nombre repetido)
   → mensaje del central, se puede corregir.
2. Subfamilia, alta sin respuesta: bloqueo + cartel; Verificar sin coincidencia → sigue bloqueado; con una
   subfamilia de prueba creada antes en la base local con ese nombre → la encuentra y cierra seleccionándola;
   Verificar con la búsqueda fallida → sigue bloqueado. Edición sin respuesta → reintento libre. Alta normal
   (central vivo): guarda y cierra como hoy.
3. Presentación: lo mismo (alta bloqueada + Verificar con y sin coincidencia; edición libre; alta normal).
4. Tipos de presentación con el central congelado: cartel + Reintentar.
Las entidades de prueba quedan en la base local.

## Riesgos y qué queda sin verificar

- Verificar puede encontrar una subfamilia o presentación **preexistente** igual a la que se intentó cargar y
  cerrar con ella: para el usuario el resultado es el mismo (queda seleccionada la que tiene ese nombre) y no se
  crea un duplicado.
- Si el central confirma el alta **después** de un Verificar sin coincidencia, el diálogo sigue bloqueado: el
  usuario cierra y la encuentra en la lista. No hay rama que permita reintentar un alta sin respuesta.
- Sin verificar: `onEditSubfamilia` no manda `familiaId` (la edición de subfamilia podría fallar hoy por otra
  causa); se mira en la auditoría y, si se confirma, va en un issue aparte.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **Cómo se cierra cada diálogo**: en familia y subfamilia «Cancelar» **no cierra** (solo limpia el formulario) y
  se abren sin `disableClose`: se cierran con Esc o clic afuera, incluso mientras guardan. La presentación sí tiene
  `disableClose` y su Cancelar cierra. Decisión: mientras `guardando`, los diálogos de familia y subfamilia no se
  pueden cerrar (`dialogRef.disableClose = true`, se restaura al terminar); y en el estado bloqueado de un alta de
  subfamilia se agrega un botón **Cerrar** explícito junto a Verificar (Cancelar sigue limpiando, como hoy). El
  bloqueo cubre «seguir en este diálogo»: reabrirlo permite cargar de nuevo, por eso el cartel pide revisar la lista.
- **Verificar necesita su propio manejo de error**: `onSearchSubfamilia` gana `errorConf?` / `contexto?` (hoy no
  los acepta: sin ellos un error de red no emite y Verificar quedaría colgado). `null` o error = **«no se pudo
  verificar»**, con texto distinto de «no se encontró»; los dos dejan Guardar bloqueado.
- **El helper va en `commons/core/utils/graphqlErrorUtils.ts`** (función pura, junto a `limpiarErroresGraphQL`),
  con la constante `MENSAJE_RESPUESTA_VACIA` exportada y usada también por `generic-crud.service.ts` (sin literal
  duplicado). Hay un precedente con el mismo criterio en solicitud de pago.
- **Avisos**: el aviso propio del diálogo solo si `!esTimeoutDeLink(error)` (en el corte por tiempo ya avisa el
  link: «pudo haberse aplicado»). Con «Respuesta vacía del servidor» el servicio ya muestra su «Ups…»: el diálogo
  no agrega otro aviso (en un alta de subfamilia o presentación muestra el cartel fijo, que no es un aviso).
- **«Guardado con éxito» duplicado**: `onSave` ya lo muestra y los diálogos de familia y subfamilia lo repiten: se
  quita el de los diálogos.
- **Comparaciones de Verificar**: ids y cantidad con `Number()`; descripción nula del lado del servidor tolerada;
  nombre de subfamilia en mayúsculas y sin espacios sobrantes (el diálogo ya lo manda en mayúsculas; la
  presentación se compara tal cual, no pasa a mayúsculas). Si el alta se aplicó y ya existía otra igual, hay dos
  coincidencias: no se elige ninguna y queda bloqueado (cae en «cerrá y revisá»).
- **Listas en memoria**: cuando Verificar encuentra la subfamilia, recarga `subfamiliaBS` / `familiaBS` igual que
  un guardado normal. La subfamilia nueva no aparece en la tabla de la pantalla de producto ni en un guardado
  normal (solo queda seleccionada): ya es así y no se toca.
- **Fases** (reordenadas): 1 = helper + familia + subfamilia (guardado, avisos, posición) **sin** Verificar;
  2 = bloqueo + Verificar de subfamilia y de presentación, y tipos de presentación.

| Fase | Commit |
|---|---|
| 1 | `fix(productos): avisar cuando no se confirma el guardado de una familia o subfamilia` |
| 2 | `fix(productos): no duplicar una subfamilia o presentacion cuando el alta queda sin respuesta` |

### Dos hallazgos que no son de este PR (para decidir)

1. **Editar una subfamilia probablemente la saca de su familia** (inferido del código, sin ejecutar):
   `onEditSubfamilia` abre el diálogo sin `familiaId`, el input sale sin `familiaId`, y el central arma una
   `Subfamilia` nueva que solo recibe familia si viene ese campo; `familia_id` admite NULL. Editar le dejaría
   `familia_id = NULL` (y `creado_en` nulo). No es de red. Se **verifica en la prueba de runtime** con una
   subfamilia de prueba en la base local; el arreglo (mandar la familia de la subfamilia al editar) es de una
   línea, pero va en este PR solo si el usuario lo pide: si no, issue aparte con prioridad alta.
2. **PRs ya mergeados tratan «error en arreglo» como rechazo** sin excluir «Respuesta vacía del servidor»:
   `ajustar-stock-dialog` (el más delicado: permitiría reintentar un ajuste que pudo aplicarse),
   `adicionar-precio-dialog`, `adicionar-codigo-dialog`, `producto.component`, y en el POS `venta-touch`,
   `pago-touch` y `edit-delivery-dialog`. No se tocan acá: quedan para un PR chico que los pase al helper nuevo.

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Cancelar no cierra en familia / subfamilia y se pueden cerrar con Esc mientras guardan | alta | no cerrables mientras guardan; botón Cerrar en el estado bloqueado |
| A | `onSearchSubfamilia` no acepta `errorConf`: Verificar quedaría colgado; `null` no es «ninguna» | alta | parámetros + «no se pudo verificar» |
| B | Doble aviso (link en el corte; «Ups» con respuesta vacía; «Guardado con éxito» repetido) | alta | regla de avisos; se quita el éxito duplicado |
| A | Editar una subfamilia le quitaría la familia (no es de red) | media | se verifica en runtime; decisión del usuario |
| A | «Arreglo = rechazo» en PRs ya mergeados | media | anotado para un PR aparte |
| A | Ubicación del helper y literal duplicado | media | `graphqlErrorUtils.ts` + constante |
| B | Comparaciones (ids como texto, descripción nula, dos coincidencias); listas en memoria | media | reglas explícitas |
| B | Fase 1 muy cargada | baja | Verificar pasa a la fase 2 |
| A/B | Formas de error, mensaje de respuesta vacía intacto, `subfamiliaSearch` filtra por familia y devuelve lo mismo que el guardado, campos de presentaciones, unicidad de familia, la posición no ordena, sin Enter en los formularios | — | verificado |

## Implementación: desvíos

- **Editar una subfamilia la dejaba sin familia: confirmado y arreglado acá** (decisión del usuario). El diálogo
  manda `data.familiaId ?? data.subfamilia.familia.id`; si en una edición no se conoce la familia, no guarda y avisa.
- **`producto.component` sí se toca** (dos líneas): los diálogos de subfamilia y presentación cierran con un
  marcador `sinConfirmar` cuando el alta quedó sin respuesta, y la pantalla de producto recarga la lista de
  subfamilias / las presentaciones (sin eso, el cartel «cerrá y revisá» mandaba a mirar una lista sin refrescar).
  Con un alta de subfamilia sin confirmar el diálogo solo se cierra por «Cerrar».
- **Familia**: el central responde «No se pudo guardar» al nombre repetido (no «Ya existe…»); el aviso del diálogo
  lo dice sin citar el mensaje.
- **Presentación**: la descripción se compara sin distinguir mayúsculas.
- **Posición de la subfamilia**: el conteo nunca devolvió un valor utilizable (la consulta no trae el alias que el
  genérico espera): el selector estaba vacío siempre. No se toca (la posición no ordena nada).
- `finalize` en los tres guardados para que `guardando` / `disableClose` no queden trabados si algo falla dentro
  del `next`.

## Prueba de runtime (2026-10-05)

Central local `:8081` sin perfil (replicación apagada; los dos schedulers en *Did not match*), `ng serve -c web`.
Los «sin respuesta» se simularon reemplazando el guardado por un error (no se envió nada); el resto contra el
central vivo. Desde la edición de COCA COLA 2LTS (familia BEBIDAS), sin guardar el producto.

| Caso | Resultado |
|---|---|
| Alta normal de subfamilia («PRUEBA390 SUB A») | guarda, cierra y queda seleccionada; un solo «Guardado con éxito»; no cerrable mientras guarda |
| **Editar esa subfamilia (antes del arreglo)** | el servidor la devuelve con `familia: null` |
| Editarla con el arreglo | el input lleva `familiaId` y vuelve con su familia |
| Subfamilia: rechazo | queda abierto, Guardar habilitado |
| Subfamilia: alta sin respuesta (error de red y respuesta vacía) | Guardar bloqueado, cartel + Verificar + Cerrar; un segundo Guardar no envía nada |
| Verificar: sin coincidencia / búsqueda fallida / exactamente una igual | «Todavía no aparece…» / «No se pudo verificar…» (siguen bloqueados) / cierra seleccionándola |
| Subfamilia: edición sin respuesta | aviso, reintento libre |
| Familia: sin respuesta / nombre repetido (contra el central) | aviso y reintento / rechazo del servidor, queda abierto |
| Presentación: alta sin respuesta; Verificar sin coincidencia y con una igual; edición sin respuesta | bloqueo + cartel; sigue bloqueado; cierra con ella; aviso y reintento |
| Tipos de presentación con el central congelado | aviso con Reintentar, Guardar deshabilitado |

Tras los arreglos de la auditoría se volvió a probar: alta de subfamilia sin respuesta → solo se cierra por
«Cerrar» y la pantalla de producto vuelve a buscar las subfamilias (la selección de subfamilia se limpia, como en
cualquier búsqueda); alta de presentación sin respuesta → «Cancelar» recarga las presentaciones.

**Sin probar en pantalla**: Verificar de presentación con la lectura fallida; «Reintentar» de los tipos al
reanudar; la guarda de edición sin familia conocida (hoy todas las fuentes traen la familia).

En la base local quedó la subfamilia de prueba «PRUEBA390 SUB A» (id 85, familia BEBIDAS).

## Auditoría del diff (paso 8, 2026-10-05)

| Sev. | Hallazgo | Qué se hizo |
|---|---|---|
| media | El cartel manda a revisar la lista, pero al cerrar con el alta sin confirmar la pantalla de producto no recargaba: no se vería la subfamilia / presentación guardada y se la volvería a cargar | cierre con marcador + recarga |
| baja | En una edición sin familia conocida se seguiría guardando sin familia | no guarda y avisa |
| baja | `guardando` / `disableClose` trabados si algo falla dentro del `next` | `finalize` |
| baja | Verificar puede cerrar con una subfamilia o presentación igual que ya existía | aceptado (no se crea un duplicado); anotado |
| baja | Un HTTP 4xx se trata como «sin respuesta» y bloquea el alta | lado conservador; sin cambio |
| — | Sin caminos para duplicar dentro del diálogo, clasificación de errores, avisos sin duplicar, firma de `onSearchSubfamilia`, otros llamadores, reglas de HTML | sin hallazgos |
