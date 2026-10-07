# Plan: lecturas por id y por texto que quedan mudas o colgadas (PR 14f)

Parte de #390. Repo: desktop. Sin cambios en el central ni en el genérico.
Rama `fix/lecturas-que-quedan-mudas-o-colgadas`, apilada sobre la del #438.

## 1. El problema [relevado sobre la rama del #438]

Con el #438, `onGetById` / `onGetByTexto` / `onGetByFecha` propagan el error y el genérico avisa. Quedan **40 lugares
en 32 archivos** que reciben ese error y no lo manejan: dejan un error sin capturar en la consola y, los que tienen
su propio «cargando» o su propio modal, siguen colgados (igual que antes del #438).

### a. Dejan pasar algo que no deberían (6)
| Dónde | Qué pasa si la lectura falla |
|---|---|
| Legajo, información general | el formulario queda en blanco y sin la persona cargada; **guardar así crea otra persona** y reasigna el funcionario a ella |
| Abrir una caja existente (`adicionar-caja-dialog`) | la pantalla dice «Nueva Caja» y los conteos quedan sin caja |
| Alta de cliente (persona que ya es cliente) | no se carga el cliente existente; guardar intenta crear **otro cliente** de esa persona |
| Cambio de salario | no se lee el salario mínimo legal y **se saltea esa validación** |
| Nota de remisión, chofer | quedan el documento y la dirección del chofer **anterior** |
| Envase (PDV) | el diálogo queda sin envase y «Cancelar» rompe |

### b. Quedan colgados o en blanco (12)
Garantía en el PDV y lista de sectores (su modal «Buscando…» no se cierra y tapa la pantalla); conteo de billetes
(«Cargando denominaciones…» eterno, en la verificación de retiros); lista de personas («buscando» eterno); edición
de inventario (pantalla vacía al abrir; y cinco relecturas tras guardar que dejan la pantalla vieja, como si no se
hubiera guardado); legajo del funcionario (pantalla en blanco); ventas de una caja (lista vacía); detalle de un
movimiento de stock («cargando»); editar un ítem de transferencia (edición a medias); ítem de devolución (sin
presentaciones); roles de un usuario (parece «sin roles»).

### c. Solo falta atrapar el error (18)
Búsquedas mientras se tipea (marcas de bienes, proveedor y tipo de gasto en pago de compras, usuario en entrada /
salida de stock, responsable en retiro y gasto de caja), y lecturas sueltas (cargos, lote electrónico, sectores de
una zona, familia de mueble, funcionario preseleccionado, persona sin usuario en marcaciones, balance por fecha).

### d. Avisos repetidos
En retiro y gasto de caja, cinco lecturas con corte propio muestran el aviso dos veces casi juntas (el del genérico y
el propio con el mismo texto).

## 2. Cambio

Regla: **el aviso del error ya lo da el genérico**. Cada consumidor hace lo mínimo para quedar en un estado correcto.

- **(a)**: no dejar seguir sobre un dato que no se leyó.
  - Legajo: cartel «No se pudo cargar el funcionario» y «Guardar» bloqueado mientras no esté cargado.
  - Caja existente: aviso y se cierra el diálogo (o la pestaña).
  - Alta de cliente: aviso «No se pudo leer el cliente ya registrado» y «Guardar» bloqueado hasta elegir de nuevo.
  - Cambio de salario: «Guardar» bloqueado hasta leer el mínimo; aviso.
  - Chofer: se limpian sus datos y se pide elegirlo de nuevo.
  - Envase: se cierra el diálogo.
- **(b)**: apagar la bandera o cerrar el modal propio. Donde la pantalla quedaría en blanco o diría algo falso, un
  cartel o aviso propio: conteo de billetes, edición de inventario (al abrir: se cierra la pestaña; relecturas: «Se
  guardó, pero no se pudo actualizar la pantalla: reabrí el inventario»), legajo, ventas de una caja, ítem de
  devolución, roles del usuario. El detalle del movimiento de stock se arma con los datos básicos.
- **(c)**: `error:` vacío (el genérico ya avisó, una vez).
- **(d)**: el aviso propio sale solo cuando el genérico no avisó (el corte por tiempo propio).
- Se corrigen los comentarios que dicen que estas lecturas «no emiten si fallan».

## 3. Lo que no cambia
- El genérico. Los consumidores ya migrados. El código muerto (listado en el relevamiento).
- El alta de funcionario desde un pre-registro (la pantalla ya no se usa).

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix: no seguir sobre un dato que no se pudo leer en legajo, caja, cliente, salario y nota de remision` (a) |
| 2 | `fix: no quedar colgado ni en blanco cuando una lectura falla` (b) |
| 3 | `fix: atrapar el error de las busquedas y lecturas sueltas, y no repetir el aviso en caja` (c, d, comentarios) |

`npm run check` antes de cada push.

## Prueba de runtime

Central y filial locales, desktop en el navegador, fallas inyectadas por consulta.
1. (a): cada uno de los seis con la lectura fallando → no deja seguir; normal → igual que antes.
2. (b): garantía, sectores, conteo de billetes, personas, inventario (abrir y una relectura), legajo.
3. (c): una búsqueda por tecla con error → un aviso, sin errores en consola.
4. (d): gasto de caja con la lectura fallando → un solo aviso; con corte por tiempo → el propio.

## Riesgos
- 32 archivos tocados, la mayoría con una línea. El riesgo está en (a), donde se bloquea «Guardar».

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Hechos corregidos
- El #438 y el #437 ya están en `develop`: la rama sale de `develop`, no se apila, y la nota de remisión no choca.
- **Legajo**: el caso es más amplio. Si falla la lectura del legajo (el padre), la pestaña «Información general»
  recibe el funcionario vacío y **se muestra como «Nuevo funcionario»**: guardar crea persona y funcionario nuevos.
  El legajo pasa al grupo (a). Y no hay reintento natural: hace falta un botón.
- **Abrir una caja existente**: el componente vive como diálogo y como pestaña. En pestaña el «diálogo» es un objeto
  vacío: cerrarlo rompe. Y en el PDV, cerrar sin valor dispara «¿Desea realizar el conteo inicial?», que engaña.
- **Alta de cliente**: no hay unicidad de cliente por persona en el central: el duplicado **entra** y después rompe
  las lecturas de esa persona. Además, hoy el cliente elegido antes **no se limpia** al elegir otra persona: si la
  lectura de la segunda falla (o si la segunda no es cliente), guardar **reasigna el cliente de la primera** a la
  segunda.
- **Cambio de salario**: el mínimo legal no bloquea, solo pide confirmación; y si la clave no está configurada ya
  hoy no valida. Bloquear «Guardar» dejaría a RRHH sin poder cambiar un salario por una consulta secundaria.
- **Chofer**: queda el chofer anterior completo (no una mezcla); el riesgo es emitir con el chofer viejo.
- **Envase**: quien abre el diálogo trata un cierre sin valor como «sin envase». Cerrarlo ante el error sería vender
  sin cobrar el envase, en silencio.
- **Conteo de billetes**: lo usan la verificación de retiros **y el conteo de la caja mayor** (no está muerto). Con
  la grilla sin cargar, el total es 0: el conteo de caja deja «Crear ajuste» habilitado por **todo el saldo como
  faltante**, y la verificación de un retiro acreditaría 0. Y «sin filas» no distingue «falló» de «la moneda no
  tiene billetes»: un cartel no alcanza, el contenedor tiene que saberlo. Pasa al grupo (a).
- **Editar un ítem de transferencia**: el ítem queda seleccionado antes de leer; si la lectura falla, guardar pisa
  ese ítem con el producto que había en el formulario. Pasa al grupo (a).
- **Roles del usuario**: guardar el usuario no toca sus roles; con la lista vacía por error solo se podría agregar
  un rol repetido. Queda en (b), bloqueando «agregar / quitar rol».
- **Ventas de una caja**: la pestaña ya recibe la caja; la lectura solo la completa. Ante el error se sigue con la
  que vino, con aviso, en vez de dejar la lista vacía.
- **Relecturas de inventario**: el mensaje «se guardó» es siempre cierto ahí, pero al fallar la relectura tras
  finalizar o reabrir una zona la pantalla la sigue mostrando en su estado anterior, editable.
- **Avisos repetidos**: son cuatro lecturas, no cinco (la quinta dice otra cosa y se deja).
- Varias pestañas se cierran hoy «por posición»: si el usuario cambió de pestaña mientras tanto, se cierra otra.
  Los cierres nuevos van por referencia.

### Diseño corregido del grupo (a)
- **Legajo (padre e hijo)**: si no se pudo leer, cartel fijo «No se pudo cargar el funcionario» con «Reintentar»;
  no se muestra el formulario como alta ni se puede guardar. El alta real (sin id) no cambia.
- **Caja existente**: cartel con «Reintentar» dentro de la pantalla (vale para diálogo, pestaña y PDV); no se cierra.
- **Alta de cliente**: al elegir persona se limpia el cliente anterior; si la persona es cliente y no se pudo leer,
  «Guardar» bloqueado con el texto fijo «No se pudo leer el cliente ya registrado: elegí la persona de nuevo».
- **Cambio de salario**: si no se pudo leer el mínimo, se avisa en el formulario y al guardar se pide confirmación
  («No se pudo verificar el salario mínimo legal. ¿Continuar?»). No se bloquea.
- **Chofer**: se limpian sus cuatro datos.
- **Envase**: no se cierra; «Sí» queda deshabilitado con «No se pudo leer el envase: podés continuar sin envase».
- **Conteo de billetes**: la grilla muestra «No se pudieron cargar las denominaciones» con «Reintentar» y le avisa
  al que la contiene. El conteo de la caja mayor no deja crear el ajuste, y la verificación de retiros no deja
  confirmar esa moneda en 0 mientras no cargue (el atajo «Usar declarado» sigue valiendo).
- **Ítem de transferencia**: se sale del modo edición y se limpia el formulario.

### Partición (reemplaza «Fases»)
**PR 14f (este): riesgos de datos** — unos 12 archivos.
| Fase | Commit |
|---|---|
| 1 | `fix(rrhh): no guardar un legajo que no se pudo leer como si fuera un alta` (legajo padre e hijo, cambio de salario) |
| 2 | `fix(financiero): no contar ni operar sobre una caja o un conteo que no cargo` (grilla, conteo de caja mayor, verificación de retiros, caja existente) |
| 3 | `fix: no guardar sobre un cliente, un chofer, un envase o un item que no se pudo leer` (cliente, nota de remisión, envase, transferencia) |

**PR 14g (después): lo mecánico** — grupos (b) y (c), los avisos repetidos y los comentarios.

## Prueba de runtime (reemplaza la de arriba, para este PR)
1. Legajo: lectura del padre fallando (no queda como alta) y la del hijo; reintentar; alta nueva sin id; edición normal.
2. Cambio de salario con el mínimo sin leer: avisa, pide confirmación y deja guardar.
3. Conteo de la caja mayor con la grilla fallando: no se puede crear el ajuste; reintentar. Verificación de un retiro.
4. Caja existente: como diálogo, como pestaña y desde el PDV.
5. Cliente: persona A (cliente) y después B (cliente con la lectura fallando; y B que no es cliente): no reasigna.
6. Chofer, envase («No» funciona, «Sí» deshabilitado), ítem de transferencia.

## Auditoría del plan (paso 5, 2026-10-07)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| A | Legajo: si falla la lectura del padre, el hijo queda como «Nuevo funcionario» | alta | padre e hijo al grupo (a), con reintento |
| A | Caja existente: cerrar rompe en pestaña y engaña en el PDV | alta | cartel con reintento |
| A | Cliente: el duplicado entra (sin unicidad) y el cliente anterior no se limpia (reasignación) | alta | limpiar y bloquear |
| A | Conteo de billetes: vivo en la caja mayor; con la grilla caída se puede ajustar todo el saldo | alta | la grilla avisa al contenedor |
| A | Ítem de transferencia: guardar pisa el ítem con otro producto | alta | al grupo (a) |
| A/B | Cambio de salario: bloquear es de más | media | confirmación |
| A | Envase: cerrar = vender sin envase en silencio | media | no se cierra |
| A | Roles del usuario no se borran al guardar | — | queda en (b) |
| A | Son cuatro avisos repetidos, no cinco | baja | corregido |
| B | Tamaño | media | dos PRs |

## Decisiones de Franco (2026-10-07)
- Aprobado con la partición en dos PRs. Rama de este PR: `fix/no-guardar-sobre-lecturas-que-fallaron`, desde `develop`.

## Implementación: desvíos

- **Legajo**: además del cartel, las pestañas no se muestran mientras se lee un legajo que todavía no está en
  pantalla (antes, durante la lectura, «Información general» ya aparecía como alta con «Guardar» habilitado), y esa
  pestaña no deja guardar mientras lee su funcionario.
- **Alta de cliente**: tampoco se puede guardar mientras se lee el cliente existente. Y, en un alta, al elegir una
  persona que **no** es cliente se limpia el cliente de la persona elegida antes (guardar se lo reasignaba). En una
  edición ese caso queda como estaba.
- **Caja existente**: si la caja pedida no viene (sin error), tampoco se trata como «Nueva Caja».
- **Chofer**: no se agregó aviso propio; se limpian los datos y el aviso del error lo da el genérico.
- Se verificó con `npm run check` el estado final de cada tanda, no cada commit por separado.

## Prueba de runtime (paso 9, 2026-10-07)

Worktree servido en `:4202`, central local propio en `:8085` (replicación apagada, schedulers en «Negative
matches»), filial local `:8080`. Fallas inyectadas en el navegador por consulta.

| Caso | Resultado |
|---|---|
| Legajo, falla la lectura del legajo | cartel «No se pudo cargar el funcionario» con Reintentar; no hay pestañas ni formulario de alta |
| Legajo, falla solo la de «Información general» | cartel, «Guardar» deshabilitado; guardar por código no envía nada |
| Legajo, reintentar / lectura lenta / alta nueva | carga con la persona; durante la lectura no hay pestañas; el alta nueva no cambia |
| Cambio de salario con el mínimo sin leer | aviso en el formulario; al guardar pide «Salario mínimo sin verificar» |
| Conteo de la caja mayor con las denominaciones fallando | cartel con Reintentar; «Crear ajuste» deshabilitado y sin efecto por código; reintentar carga 8 denominaciones |
| Caja existente desde el PDV con la lectura fallando | «No se pudo cargar la caja» con Reintentar; sin «Nueva Caja», cuerpo oculto; reintentar → «Editar Caja» |
| Alta de cliente: persona A (cliente), B (cliente, lectura fallando), B bien, persona no cliente | A carga su cliente / B: bloqueado con el motivo, sin el cliente de A, guardar no envía nada / carga el de B / queda sin cliente |

No probado en runtime: verificación de retiros con la grilla fallando (incluido el cambio de moneda), chofer de la
nota de remisión, envase, ítem de transferencia, caja existente como pestaña o como diálogo fuera del PDV, y los
últimos ajustes de la auditoría salvo el del legajo.

## Auditoría del diff (paso 8, 2026-10-07)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Verificación de retiros: la falla de la grilla quedaba marcada al cambiar de moneda y volver | media | la grilla avisa siempre al empezar a cargar |
| Legajo: al reintentar (y durante la lectura) las pestañas aparecían como alta | media | no se muestran hasta tener el funcionario; el hijo no guarda mientras lee |
| Alta de cliente: se podía guardar mientras se leía el cliente | baja | bloqueado durante la lectura |
| Caja existente que no viene (sin error) se trataba como nueva | baja | también muestra el cartel |
| Nota de remisión: sin chofer la nota se puede emitir (no hay validación de chofer obligatorio) | — | sin cambio; a confirmar con negocio |
| Extracción de la carga de caja idéntica a la original, tooltip del ajuste, reglas del HTML, specs | — | verificado, sin hallazgos |

---

# PR 14g: lo mecánico (rama `fix/lecturas-que-quedan-mudas-o-colgadas`, apilada sobre la del #439)

## Implementación: desvíos
- Operador compartido `terminarSiFalla(alFallar?)` (`commons/core/utils/rxjsUtils.ts`): ante el error corre lo que
  haga falta y termina sin emitir. Se inserta en el `pipe` de cada lectura, sin tocar su `next`.
- Un solo commit para los grupos (b), (c) y (d), más uno de ajustes de la auditoría.
- **Edición de inventario**: al no poder abrir se avisa y se cierra la pestaña (por referencia); las cinco relecturas
  tras guardar avisan «Se guardó, pero no se pudo actualizar la pantalla…». No se agregó un botón de reintento ni se
  bloquean las acciones con la pantalla vieja.
- **Ventas de una caja**: se sigue con la caja recibida solo si ya trae su sucursal; si no, aviso.
- **Roles del usuario**: cartel y «agregar rol» deshabilitado.
- `usuario-helper` (persona sin usuario): solo atrapa el error, sin aviso propio.

## Prueba de runtime (2026-10-07)
Mismo entorno que el 14f.

| Caso | Resultado |
|---|---|
| Lista de personas con la búsqueda fallando / normal | apaga su «buscando», un aviso, sin error en la consola / 115 resultados |
| Roles de un usuario con la lectura fallando / normal | cartel «No se pudieron cargar los roles…», «agregar rol» deshabilitado, sin error en la consola / habilitado |

No probado en runtime: garantía, sectores, inventario, ventas de una caja, movimiento de stock, ítem de devolución,
búsquedas por tecla, balance por fecha y los avisos de retiro y gasto de caja.

## Auditoría del diff (2026-10-07)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Ventas de una caja: el respaldo consultaba sin sucursal cuando la caja llega solo con su id (desde retiros) | media | solo si trae sucursal; si no, aviso |
| Inventario recién creado que no se puede abrir: la pestaña se cerraba sin decirlo | baja | aviso |
| Dos comentarios nuevos imprecisos | baja | corregidos |
| `analisis-diferencia` (cálculo de totales por ventas) sin manejo de error | — | es un método sin llamadores |
| Los 31 usos del operador (cadena correcta, antes de `untilDestroyed`), los cuatro avisos, barrido de consumidores sin manejo | — | verificado, sin hallazgos |
