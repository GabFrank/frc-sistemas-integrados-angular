# Plan — errores de red en delivery (issue #390, PR 8)

Pieza: **desktop**. Rama: `fix/pdv-errores-de-red-en-delivery`, desde `origin/develop` (no comparte archivos con
#404). Usa `PROPAGAR_ERROR_DE_RED`, `ContextoConsulta`, `TIMEOUT_CONSULTA_MOSTRADOR_MS` (10 s). Relevamiento:
auditor de solo lectura sobre delivery en el POS (`venta-touch/list-delivery`, `edit-delivery-dialog`,
`pago-touch`, `delivery-dialog`, presupuesto, opciones) y `operaciones/delivery`/`vuelto` (2026-10-03); A1–A3
releídos a mano. Todo va al **filial** (el cajero de pie): regla de mostrador, controles de plata fail-closed.

**Restricción**: «Modif. itens» de un delivery está deshabilitado a propósito por fraude: no se re-habilita ni se
abre otra vía para editar ítems; el camino «edit» de `venta-touch` (inalcanzable) no se toca.

Ya cubierto en PRs anteriores (sin cambio): lista de deliverys por caja, guardar delivery y venta, «para entrega»,
reimprimir, `onSaveVentaDelivery`, verificación de cierre de caja.

## 1. Cobros de un delivery que se dan por pagados sin registrarse (fase 1)

- **Cobro de una línea en un delivery ya guardado** (`edit-delivery:527` y `pago-touch:701`, los dos únicos
  llamadores de `ventaService.onSaveCobroDetalle`, filial): el saldo y lo pagado se actualizan **antes** de guardar
  la línea; `onSave` sin `errorConf` no emite ante un error de red, así que la línea no entra en la lista pero el
  saldo queda como pagado: en `pago-touch` el cajero puede finalizar y el delivery se cierra con un cobro
  **incompleto**; en `edit-delivery` cierra el diálogo con plata sin registrar. Con error GraphQL `onSave` lanza y
  no hay `error:` (error sin manejar).
  Cambio: `onSaveCobroDetalle` recibe `errorConf` (los dos llamadores reciben su `error:`); en el `error:` se
  **revierte** lo sumado (pagado, saldo, vuelto). Un error de red puede ser una línea que **sí se guardó** en el
  filial: revertir y dejar cobrar de nuevo la duplicaría. Por eso, ante error de red (no de negocio) se marca
  `cobroIncierto`: se bloquean nuevas líneas y finalizar/guardar con aviso «No se pudo confirmar el cobro: cerrá y
  volvé a abrir el delivery antes de seguir» (al reabrir, el delivery trae sus cobros del filial).

## 2. Tarifa de envío sin cargar (fase 1)

- **Precios de delivery** (`edit-delivery:161`, `deliveryService.onGetPreciosDelivery(false)`, `onGetAll` genérico,
  que nunca emite si falla): `selectedPrecio` queda vacío y `calcularVueltoPara`, `addCobroDetalle`, `onDescuento`
  y `onAumento` hacen `selectedPrecio.valor` → TypeError (no se puede cobrar), y **Guardar no está bloqueado**: el
  delivery se guarda **sin tarifa de envío**; después `pago-touch:234` (`delivery.precio.valor`) también rompe.
  Cambio: `onGetPreciosDelivery` pasa a `onCustomQuery` con `PROPAGAR_ERROR_DE_RED` y 10 s (sus suscriptores:
  `edit-delivery` y `delivery-dialog`, este último sin pantalla que lo abra); error o `null` → aviso con «Reintentar»
  y **Guardar y cobrar bloqueados** mientras no haya precio cargado; los accesos a `selectedPrecio.valor` se
  protegen (sin precio no se calcula vuelto ni saldo, no se usa 0).

## 3. Abrir un delivery con datos que faltan (fase 2)

- **Monedas y formas de pago del POS** (`venta-touch:503, :570`, `onGetAll` genérico, filial): si no cargaron, el
  delivery se abre igual con listas vacías: `selectedFormaPago.descripcion` → TypeError al cobrar, y una moneda sin
  cotización calcula `valor * null`. Cambio: `onDeliveryClick` no abre la lista ni el delivery si faltan monedas o
  formas de pago (aviso «No se cargaron monedas o formas de pago: reintentá»); en `edit-delivery` se agrega la guarda
  de cotización que ya tiene `pago-touch` (`sinCotizacion`: no se registra una línea en una moneda sin cotización).
  La carga de esas listas en `venta-touch` no se cambia acá (otras pantallas del POS dependen de ellas).
- **Abrir un delivery de la lista** (`list-delivery:273`, `deliveryService.onGetById(row.id, false)` sin
  `errorConf`): el clic no hace nada y sale un aviso genérico. Cambio: `errorConf` + 10 s en esa llamada (opt-in; su
  otro suscriptor es `delivery-dialog`), aviso «No se pudo abrir el delivery: reintentá».
- **Buscar cliente** (`edit-delivery:203`, `clienteService.onSearch`, `onGetByTexto`, 31 suscriptores): opt-in con
  aviso si falla (hoy no hace nada). Va al central por defecto: no se cambia el destino en este PR (anotado).

Sin cambio: el camino «edit» de `venta-touch` (`onGetPorId`, `addItem` en modo delivery: inalcanzable y vinculado a
«Modif. itens»), `DeliveryDialogComponent` y `VueltoDialogComponent` (sin pantalla que los abra; borrarlos va en
otro PR), `onDeleteCobroDetalle` (ya trata `null` como fallo), dashboard, precio-delivery, presupuesto, opciones.

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`.

## Fases

| Fase | Commit | Puntos |
|---|---|---|
| 1 | `fix(pdv): no dar por cobrado un delivery sin registrar el cobro ni la tarifa` | 1, 2 |
| 2 | `fix(pdv): no abrir un delivery sin monedas, formas de pago ni datos cargados` | 3 |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Filial `:8080` (el de esta máquina, `/opt`, no compartido) **congelado** con `kill -STOP` + respaldo `kill -CONT`,
como en #391–#398 (lo que va al filial); el login lo hace Franco si hace falta. Con el filial **vivo** se arma un
delivery de prueba en la base local (las pruebas locales pueden crear datos; SIFEN no llega a producción). Con el
filial congelado: agregar una línea de cobro en el delivery (se revierte y se bloquea, no queda pagado), abrir el
delivery (precios: Guardar y cobrar bloqueados), abrir un delivery de la lista, buscar cliente. **No se finaliza
ni se cobra** con el filial congelado.

## Riesgos y qué queda sin verificar

- Tras un cobro sin confirmar el cajero tiene que reabrir el delivery: más lento, pero sin cobros perdidos ni
  duplicados.
- Si el negocio permite un delivery sin tarifa (precio nulo), hoy no hay forma de guardarlo sin precio cargado: no
  verificado en el backend.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

- **La marca de cobro incierto va en el delivery, no en el diálogo**: «reabrir» solo vuelve a leer los cobros del
  filial si se abre desde la lista (`list-delivery` refetchea con `onGetById` cuando `venta.id` es nulo);
  `venta-touch.onPagoClick` reusa el delivery en memoria y `pago-touch` reconstruye los cobros desde ahí, así que una
  marca en el componente se perdería al cerrarlo y se podría **cobrar dos veces**. Cambio: ante un cobro sin
  confirmar se marca el **objeto delivery** compartido (`cobroIncierto`) y se le anula `venta.id` (fuerza el refetch
  al abrirlo desde la lista); `venta-touch.onPagoClick` y `edit-delivery` no cobran ni guardan un delivery marcado
  (aviso «Abrí el delivery desde la lista para verificar su cobro»); el refetch trae un objeto nuevo, sin marca.
- **Negocio vs red**: un error de `onSave` que llega como **array** (`limpiarErroresGraphQL`) es de negocio (no se
  aplicó): se revierte y se puede reintentar. Cualquier otro (red, corte del link) es **incierto**. Un `next` con
  `id` es éxito (incluido GraphQL con datos parciales).
- **Revertir completo**: snapshot antes de sumar (pagado, saldo, vuelto, flags `isVuelto/isDescuento/isAumento`,
  moneda y forma de pago) y restauración en el `error:`; `guardandoCobro` evita un segundo Enter mientras se guarda;
  en `pago-touch`, cerrar el diálogo con un guardado en vuelo marca el delivery como incierto.
- **Precios**: `null` o error = fallo (aviso y «Reintentar»); lista **vacía** = «no hay tarifas de delivery
  configuradas» (mensaje distinto). Un delivery guardado con precio lo trae de su propio dato aunque la consulta
  falle (no se bloquea). Protección de `selectedPrecio.valor` también en `onDeleteItem` y `calcularVueltoPara`; en
  `pago-touch:234`, un delivery legado sin precio avisa en vez de romper.
- **Monedas y formas de pago**: **no** se bloquea la lista de deliverys (ver, para entrega, reimprimir y finalizar no
  las necesitan; además no hay recarga y quedaría bloqueada toda la sesión). La guarda va en `edit-delivery`: sin
  monedas o formas de pago no se cobra ni se guarda, con aviso. En `edit-delivery` se porta la guarda `sinCotizacion`
  de `pago-touch` y `onDeleteItem` usa la cotización de la línea (no divide por `null`).
- **Abrir un delivery de la lista**: `errorConf` con `networkError.propagate` (sin el aviso propio de `onGetById`);
  aviso tanto en el error como con `null`.
- **Cliente**: opt-in por llamada (los otros 30 suscriptores no cambian).

## Auditoría del plan (paso 5, 2026-10-03)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | «Reabrir» no refetchea desde `pago-touch`: la marca en el diálogo se pierde y se puede cobrar dos veces | alta | marca en el objeto delivery + `venta.id` nulo + bloqueo en `onPagoClick` |
| B | Bloquear la lista por monedas la deja muerta toda la sesión y corta acciones que no las necesitan | alta | guarda en `edit-delivery`, no en la lista |
| B | El revert debe incluir flags, moneda y forma de pago | media | snapshot y restauración |
| B | Negocio vs red y GraphQL con datos parciales | media | regla documentada |
| B | Cerrar `pago-touch` con un guardado en vuelo; doble Enter | media | marca incierto al destruir; `guardandoCobro` |
| A/B | Precio: delivery guardado ya lo trae; lista vacía no es fallo; `onDeleteItem`; legado sin precio en `pago-touch` | media | ajustado |
| B | `sinCotizacion` y `onDeleteItem` dividiendo por null | baja | alineado con `pago-touch` |
| A | Llamadores, alcanzabilidad de `pago-touch`, query de precios sin variables, refetch de la lista | — | verificado |
