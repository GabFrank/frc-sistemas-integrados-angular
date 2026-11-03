# Plan — QR en tickets de retiro y cierre, y retiros por caja en caja mayor

Ramas (desde `origin/develop`, 2026-11-03):

| Pieza | Rama |
|---|---|
| filial | `feature/ticket-qr-retiro-cierre` |
| central | `feature/ticket-qr-cierre-caja` |
| desktop | `feature/caja-mayor-qr-retiros-por-caja` |

## Qué se pide

1. Los tickets de **retiro** y de **cierre de caja** del PDV imprimen un QR con la caja (`pdv_caja.id`) y la
   sucursal. El formato es el mismo que el de transferencias y lo lee el lector de códigos (HID) de caja mayor.
2. Al escanear en caja mayor:
   - **QR de retiro**: se muestran los montos del retiro por moneda. Si la caja tiene **otros retiros
     pendientes**, aparece «¿Quiere traer los demás retiros vinculados a esta caja?». Si confirma, se suman
     a la lista con sus monedas, listos para procesar.
   - **QR de cierre**: trae **directo** todos los retiros pendientes de la caja, sin preguntar.
3. En «Ingresar retiro de PDV», al pulsar **Procesar** sobre un retiro cuya caja tiene otros pendientes,
   aparece la misma pregunta. Si confirma, la verificación muestra **apilados** los retiros de esa caja,
   **cada uno con su propio conteo**.

Decisiones de Franco (2026-11-03): el cierre trae todo directo; la pregunta cuenta solo los retiros
**pendientes** (no ingresados ni cancelados); el apilado lleva un conteo por retiro.

## Formato del QR

Mismo esquema que la transferencia (`frc-{suc}-TRF-{id}-{suc}-EditTransferenciaComponent-null-null`),
8 segmentos separados por `-`, que `QrLectorService.parse` ya lee por posición:

| Ticket | Código |
|---|---|
| Retiro | `frc-{suc}-RETIRO-{retiroId}-{suc}-IngresarRetiroCajaMayor-{cajaId}-null` |
| Cierre | `frc-{suc}-PDVCAJA-{cajaId}-{suc}-IngresarRetiroCajaMayor-null-null` |

- La sucursal va en las posiciones 1 y 4, como la transferencia en PDF: `sucursalDe()` la toma de la 1.
- `RETIRO` ya está en `QrTipoSoportado` con `idOrigen` = id del retiro. La caja va en la posición 6
  (`campo6`, el `data` de `codificarQr`).
- `PDVCAJA` es nuevo. Un desktop viejo lo rechaza con «documento que la caja no puede cobrar ni pagar
  (PDVCAJA)», sin romper nada.
- ⚠️ El código de **retiro** NO es inocuo para un desktop viejo (auditoría, eje A). El lector ya está en
  stable y en beta, y su `resolverRetiro` usa `filterRetiros`, que no trae `retiroDetalleList`. La
  verificación abriría sin monedas y confirmaría conteos vacíos, o sea un faltante de todo lo declarado.
  Hoy no pasa porque ningún ticket lleva ese QR. Por eso el orden de despliegue de abajo es obligatorio.
- El lector HID manda teclas físicas en distribución EE.UU.: con Windows en español el `-` llega como `'`
  (`shared/lector-teclado/teclado-lector.ts:31`). El input del carrito tiene que usar `frcLectorTeclado`
  y reintentar el parse con `alternativa()`, igual que los diálogos de venta con tarjeta.

## Tabla de datos nuevos

| Dato | Lo escribe | Lo lee |
|---|---|---|
| Código QR del retiro | filial `ImpresionService.printRetiro` | desktop `QrLectorService.parse` → `QrLectorDialogComponent.resolverRetiro` |
| Código QR del cierre | filial `ImpresionService.printBalance`, central `ImpresionService.printBalance` (`ticketEscposCentral` BALANCE) | desktop `QrLectorService.parse` → `QrLectorDialogComponent.resolverCaja` (nuevo) |
| `RetiroDto.sucursalId` (filial) | `RetiroGraphQL.saveRetiro`, `RetiroGraphQL.reimprimirRetiro`, `TicketEscposGraphQL.retiroDto` | `ImpresionService.printRetiro` (arma el QR) |
| `QrTipoSoportado.PDVCAJA` (desktop) | `qr-lector.model.ts` | `QrLectorService.esSoportado`, `resolverDocumento` |
| `VerificarRetiroDialogData.retiros` (desktop) | `IngresarRetiroCajaMayorDialogComponent.onProcesar` | `VerificarRetiroDialogComponent` |

Sin tablas, columnas, enums de base, migraciones ni cambios de `.graphqls`. Nada viaja por replicación.

## Fases

### F1 · filial — QR en los tickets de retiro y de cierre

- `RetiroDto` suma `sucursalId`, seteado en los tres lugares que lo arman: `RetiroGraphQL` (alta y
  reimpresión) y `TicketEscposGraphQL.retiroDto`.
- Helper estático nuevo `utilitarios/print/QrTicket` con `retiro(sucId, retiroId, cajaId)` y
  `caja(sucId, cajaId)`, que devuelven el código. Así el formato vive en un solo lugar por repo.
- `printRetiro`: imprime el QR después del bloque «VALORES DE RETIRO» y antes de la firma, con
  `qrCode.setSize(6)` centrado, igual que `printSenaCupon`. La sucursal sale de `retiroDto.getSucursalId()`
  (parte de la PK; `RetiroService` la completa en el alta). Si viniera null, el ticket sale sin QR:
  se descartó el respaldo a `idSucursalActual()` porque esa llamada lanza si falta la propiedad.
- `printBalance`: imprime el QR de la caja antes de la firma (`balanceDto.getIdCaja()` y
  `balanceDto.getSucursal().getId()`). Si falta la sucursal, va sin QR: un código sin sucursal
  traería la caja equivocada.
- Cuidado con `Style center` mutable: `printRetiro` lo deja en bold. Se usa un `Style` propio para el QR.
- **El bloque del QR va en su propio `try { … } catch (Exception e) { log.warn }`** (auditoría, eje B).
  `saveRetiro` es `@Transactional` e imprime dentro de la transacción (`RetiroGraphQL.java:85,118`), y
  `printRetiro`/`printBalance` solo atrapan `IOException`. Una RuntimeException del QR desharía el retiro
  con la plata ya fuera del cajón, o dejaría al cajero sin ticket. Si el QR falla, el ticket sale sin QR.
- Tests: `QrTicketTest` (JUnit) con los dos formatos, y con los null que no deben producir código; y un
  test de `printRetiro`/`printBalance` contra un `ByteArrayOutputStream` con un QR que lanza, que
  verifica que el ticket sale igual.

### F2 · central — QR en el cierre que imprime el central

- Mismo helper `QrTicket` y el QR de la caja en `ImpresionService.printBalance`, con el mismo `try/catch`
  propio que en F1. Es el camino de
  `ticketEscposCentral(BALANCE)`, el que usa el desktop cuando imprime el cierre contra el central.
- `printRetiro` del central es código muerto (su único llamador está comentado): no se toca.
- Test: `QrTicketTest`, igual que en el filial.

### F3 · desktop — el lector trae los retiros de la caja

- `RetiroService.onGetPendientesDeCaja(sucId, cajaId, destinoId?)` devuelve `Retiro[]`, o error si la
  consulta falla (no `[]`: «no hay» y «no se pudo saber» son distintos). Se apoya en `onGetFlotantes`
  con `size` 100:
  - ya filtra por caja + sucursal;
  - excluye los ingresados, los enviados, los EN_PROCESO y los cancelados;
  - trae `retiroDetalleList`;
  - respeta el rol acotado con `cajaVirtualDestinoId`.

  El lector y `onProcesar` pasan `destinoId` solo si `operaAcotadoCaja(mainService)`, como hoy
  `cargar()`.
- Input del carrito con `frcLectorTeclado`. Si `parse(crudo)` falla, se reintenta con
  `parse(lector.alternativa())`.
- `qr-lector.model.ts`: suma `PDVCAJA` a `QrTipoSoportado` y `montos` (texto «X Gs · Y R$ · Z US$») a
  `QrItemCarrito`.
- `resolverDocumento` pasa a devolver `QrItemCarrito[]`:
  - `RETIRO`: sigue usando `filterRetiros` para los mensajes de «ya ingresó» o «cancelado». Después pide los
    pendientes de su caja (`campo6` del QR, o `retiro.cajaSalida.id` si falta). El retiro escaneado se
    reemplaza por su versión de la lista de pendientes, que trae `retiroDetalleList`. Hoy el
    retiro escaneado llega sin detalle, y «Procesar» abre la verificación con las monedas vacías.
    - Si el retiro no está entre los pendientes de la caja, se rechaza: «sigue abierto en el PDV» si
      está `EN_PROCESO`, y si no «no corresponde a esta caja mayor» (rol acotado, otra sucursal).
    - Si la consulta de pendientes falla, se rechaza el escaneo con «no se pudo consultar la caja,
      volvé a escanear». No entra el retiro solo y sin detalle.
    - Si hay otros pendientes, se pregunta «¿Quiere traer los demás retiros vinculados a esta caja?» con
      `DialogosService.confirm`. Sí: se suman todos. No: solo el escaneado.
  - `PDVCAJA`: trae todos los pendientes de la caja, sin preguntar. Si no hay ninguno, se rechaza con
    «La caja N no tiene retiros pendientes».
- `PDVCAJA` entra al carrito como ítems tipo `RETIRO`, así que la regla de «mismo tipo» y el ruteo del
  dashboard (`rutearEscaneo`) no cambian.
- Los ítems que ya están en el carrito se saltean en silencio al sumar los de una caja. El rechazo
  «ya está en la lista» queda solo para el reescaneo del mismo papel.
- La fila del carrito muestra `montos` (las tres monedas) en vez de solo guaraníes.
- Después de la pregunta, el foco vuelve al input del lector.
- Tests (Karma, con tsconfig acotado):
  - el parse de los dos códigos nuevos y de su versión con `'` en `qr-lector.service.spec.ts`;
  - un spec de `resolverDocumento(RETIRO)` que exija `documento.retiroDetalleList` no vacío: **falla con
    el código de hoy** (fix del detalle vacío);
  - un spec de `PDVCAJA` que trae N ítems sin preguntar;
  - un spec de `RETIRO` con hermanos: pregunta, y con Sí suma, con No no.

### F4 · desktop — Procesar con los retiros de la misma caja apilados

- El cuerpo por retiro de `VerificarRetiroDialogComponent` (filas por moneda, grilla, borrador,
  categoría) se extrae a un componente `app-verificar-retiro-bloque`, con un `@Input retiro`. El diálogo
  queda como contenedor de N bloques, con la observación y el botón «Confirmar e ingresar» comunes.
- `VerificarRetiroDialogData` pasa a `retiros: Retiro[]` (y `retiro` se elimina; su único llamador es
  `onProcesar`).
- `onProcesar(row)`: pide los pendientes de `(row.sucursalId, row.cajaSalida.id)`. Si hay otros, hace la
  misma pregunta. Sí: el diálogo abre con `row` primero y los demás debajo. No, o la consulta falla: abre
  solo con `row`, como hoy.
- Confirmar: valida todos los bloques (grilla sin cargar, diferencias) y arma **un** resumen de
  diferencias por retiro. Después llama `verificarRetiro` **de a uno, en secuencia** (`concatMap`), para
  que cada uno quede con su conteo y su caso.
  - **Ante cualquier error** (rechazo, red caída o timeout), se vuelven a consultar los pendientes de la
    caja (auditoría, eje B). El central pudo haber commiteado el que «falló», u otra PC pudo haber
    verificado uno del apilado. Todo bloque que ya no esté pendiente:
    - sale del diálogo y se borra su borrador, aunque no haya devuelto OK;
    - recién entonces se muestra «N de M ingresados», con los que quedan.

    Así un reintento no se traba en «ya fue verificado». Si la re-consulta también falla, el diálogo
    avisa «no se pudo confirmar qué entró: cerrá y volvé a abrir» y no permite reintentar.
  - El central no acredita dos veces (`RetiroVerificacionService` toma el lock y rechaza lo ya
    verificado). Lo de arriba es para que la UI no mienta.
  - «Cancelar» se deshabilita mientras `guardando`: cerrar a mitad cortaría la secuencia con un retiro en
    vuelo.
  - Defensa: «Confirmar» se bloquea si algún bloque no tiene filas (retiro sin `retiroDetalleList`), con
    el aviso «no se pudo leer lo declarado de este retiro». Nunca se mandan conteos vacíos.
- Al cerrar, `onProcesar` quita de `seleccionados` los retiros que ya no estén pendientes (en modo
  escaneo quedaban tildados después de verificados).
- Al cerrar, el diálogo devuelve cuántos entraron, para el aviso de `onProcesar`.
- La pregunta se hace también si esos retiros ya llegaron juntos desde el escáner. Así lo pide el
  requisito: «Procesar» siempre pregunta si la caja tiene otros pendientes.
- Tests (Karma): la secuencia con 3 retiros. Falla el 2.º y la re-consulta dice que el 1.º ya no está
  pendiente: el 1.º sale con su borrador borrado y el 3.º no se envía. Además, un caso con falla por red
  en el que la re-consulta dice que el 2.º sí entró.

### F6 · desktop — verificación en tabla compacta y conteo editable (devolución de la demo, 2026-11-03)

Pedido de Franco y Gabriel después de la demo: con más de tres retiros, los bloques apilados obligan a
scrollear, y abrir «Contar» para cada moneda es incómodo. Decisiones de Franco: **tabla compacta**, y
la verificación es **rápida** solo si no se usó la grilla de billetes en ninguna moneda. «Rápida»
significa «no se contó billete por billete»; ya no significa «aceptó lo declarado», porque un monto
tipeado distinto de lo declarado también puede ser rápida.

**Tabla**
- Una sola tabla para todo el diálogo: una fila por retiro × moneda, con las columnas Retiro · Moneda
  · Declarado · Contado · Diferencia · acciones. Entran 8 a 10 retiros sin scrollear. El scroll queda
  dentro de la tabla.
- La arma una grilla CSS en el diálogo. `VerificarRetiroBloqueComponent` conserva el estado y la
  lógica de un retiro, y renderiza sus filas con `:host { display: contents }` (hay precedente en
  `grafico-filtros-fecha`), filas en `ng-container`, y las filas expandidas con
  `grid-column: 1 / -1`.
- Con un solo retiro no hay columna Retiro: el diálogo cambia `grid-template-columns` según
  `conEncabezado`.
- El aviso «Se recuperó un conteo» va en una fila de ancho completo.
- El ancho se cambia en el `width` del `dialog.open` (hoy 65vw, en `ingresar-retiro…component`):
  es inline y le gana a un `panelClass`.

**Contado: vacío ≠ 0** (auditoría F6, ejes A y B: el código de F4 arranca en 0)
- `FilaMoneda.contado: number | null`. Vacío significa sin contar: no tiene diferencia ni motivo, y
  «Confirmar» se bloquea con «Falta contar el retiro #N (moneda)». Un 0 tipeado vale (el sobre llegó
  vacío).
- El chequeo de la grilla que no cargó (`grillaNoCargo && !(contado > 0)`) se reemplaza por
  `contado == null`. Así no bloquea un 0 explícito.
- `conteos()` no usa `|| 0` y redondea a los decimales de la moneda. El central compara exacto y no
  tiene la tolerancia de 0,005 del front.
- El input usa `currencyMask` con opciones **por fila, precalculadas** (sin funciones en el HTML),
  igual que `pagar-compras-dialog.currencyOpts`:
  - `nullable: true` (si no, borrar deja 0);
  - `allowNegative: false`;
  - `precision` según `moneda.decimales` (0 en Gs);
  - `thousands '.'` y `decimal ','`;
  - modo `NATURAL` (el `FINANCIAL` del preset hace que «100» se lea 1,00).

  No se usan los presets compartidos de `numbersUtils`. El input va con `[(ngModel)]` y
  `(ngModelChange)`.

**Grilla y «= declarado»** (auditoría F6: la grilla emite `totalChange` al abrirse)
- El input lo escribe **solo `cantidadesChange` → `totalDe()`**, como hoy. Nunca `totalChange`: si no,
  abrir ▦ sobre un monto tipeado lo pone en 0. La grilla no se toca y `conteo-caja-dialog` queda
  intacto.
- Si se tipea a mano o se usa «= declarado», se descartan los billetes de esa moneda y **se cierra la
  grilla** (`monedaAbierta = null`). La grilla guarda sus filas y no se entera de que se vació.
- «= declarado» guarda el monto en `montos`. Abrir ▦ sobre un monto tipeado no lo cambia hasta que se
  edita una cantidad.

**Borrador**
- Se guarda en otra clave, `frc.verificacion-retiro.v2.{id}.{suc}`, con `montos?: {monedaId: number}`
  además de `cantidades`. Se lee primero esa y, si no está, la vieja.
- Así, un desktop anterior (rollback) no ve el borrador nuevo, en vez de verlo con ceros.
- Al restaurar: si la moneda tiene billetes, manda el total de `cantidades`. Si no, el valor de
  `montos`. Si tampoco, queda vacía.
- Un borrador viejo con `cantidades: {}` restaura la moneda **vacía**, no en 0.
- `hayBorrador` cuenta como empezado cualquier billete o cualquier `montos[id] != null`, incluido el 0.
  Cambia el sentido del chip: «= declarado» y cancelar ahora dejan «En proceso».

**Teclado**: Enter pasa al siguiente input de contado de la tabla, en el orden del DOM, incluso de un
retiro al siguiente. Lo maneja el diálogo.

**Acciones por fila**:
- **▦** despliega la grilla debajo;
- **=** usa lo declarado;
- el motivo de la diferencia es un select chico en la celda;
- la observación se abre con un ícono en la primera fila del retiro.

**Pendiente fuera de F6**: el central no rechaza conteos negativos ni decimales en Gs. El front los
impide con la máscara. Validarlo en el central queda como fix aparte.

**Tests (Karma) — cada uno falla con el bug que cubre**
- Bloque:
  - tipear un monto → contado, diferencia y `esRapida() == true`;
  - la grilla → `esRapida() == false`;
  - tipear después de la grilla → se descartan los billetes y se cierra la grilla;
  - borrar el input → `motivoParaNoConfirmar` no es null, nunca 0;
  - un 0 explícito → manda 0 y no bloquea;
  - un borrador viejo con `cantidades: {}` → la fila queda vacía y bloquea;
  - «= declarado», cerrar y reabrir → restaura lo declarado;
  - abrir la grilla después de tipear → el input no cambia (la grilla emite `totalChange` y se
    ignora);
  - «100» en US$ → `conteos()` manda 100;
  - un total de R$ con centavos → redondeado a 2;
  - `hayBorrador` con solo `montos`, incluido 0 → true.
- Diálogo: Enter pasa al siguiente input.

**Prueba por pantalla**:
- los 3 retiros de una caja (por ejemplo, la 6213 de la sucursal 1);
- tipear, usar la grilla, «= declarado»;
- borrar un input y que bloquee;
- un 0 explícito;
- una diferencia con su motivo;
- una observación;
- cerrar y reabrir para ver el borrador;
- Enter entre filas;
- confirmar.

### F5 · documentación

- Desktop: el formato del QR y el flujo, en `docs/IMPRESION.md` y en la nota de caja mayor que
  corresponda.
- Filial y central: N/A (no hay `docs/` de dominio en filial; en central, el formato del QR se documenta
  en el javadoc de `QrTicket`).
- Este plan se borra en el PR final del desktop.

## Orden de despliegue

Ningún cambio toca tablas, esquema ni GraphQL, así que no hay orden forzado por replicación (§3.2).

**El orden lo fija el bug del detalle vacío, no la replicación: desktop primero.**

1. Desktop F3+F4 en el canal y **instalado** en las PCs de caja mayor de ese canal.
2. Recién entonces filial F1 y central F2 en ese mismo canal.

Un filial con QR delante de un desktop viejo hace que escanear un retiro abra la verificación vacía
(ver «Formato del QR»). Desde la auditoría del diff, el central rechaza esa confirmación sin conteos, así
que el riesgo ya no es la plata sino un escaneo que no sirve. El central con ese rechazo va antes que el
filial. Para alpha alcanza con mergear el desktop antes que el filial. Para `release/beta`
y `master`, la promoción del filial espera a que la del desktop esté instalada en la caja mayor. Las PCs
de caja mayor son pocas y conocidas, pero el update del desktop es postergable, así que hay que verificar
la versión instalada.

- Un desktop nuevo con tickets viejos (sin QR) no cambia nada. Con el filial viejo, el ticket de cierre
  no tiene QR y punto.
- Un desktop viejo rechaza el QR de cierre con mensaje.
- **El PR del filial a `develop` sale a las filiales alpha en ≤15 min**: se avisa antes de mergear.

## Tests y pruebas de runtime (paso 9)

- filial `./mvnw clean verify -B`, central `./mvnw clean verify -B -DskipFlyway=true` (el gate es
  `gh pr checks`), desktop `npm run check` + Karma acotado a los specs tocados.
- Runtime local: filial propio en 8082 (sucursal 24, `sifen.enabled=false`), central en 8081 (o en 8084
  si el 8081 es de otra sesión), y desktop con `ng serve -c web`.
  - Ticket de retiro y de cierre: `ticketEscpos(RETIRO|BALANCE)` y `ticketEscposCentral(BALANCE)`,
    decodificando el base64 para verificar que lleva el comando QR (`GS ( k`) con el código exacto.
    Además, una impresión real en la térmica `frc-ticket`.
  - Escaneo: el lector HID escribe como teclado, así que se tipea el código en el input del carrito, con
    Enter. Casos:
    - retiro solo, sin otros pendientes en la caja: no pregunta;
    - retiro con otros dos pendientes: pregunta; probar Sí y No;
    - cierre de una caja con tres pendientes: los trae sin preguntar;
    - cierre de una caja sin pendientes: rechazo;
    - retiro ya ingresado: rechazo;
    - el mismo retiro escaneado dos veces: duplicado;
    - el QR de cierre y luego el de un retiro de la misma caja: no se duplica.
  - Procesar:
    - un retiro con otros pendientes: probar Sí (apilado), contar y confirmar todos;
    - un retiro con otros pendientes: probar No (uno solo);
    - una falla a mitad del lote, forzada con un retiro que se ingresa por otra vía entre medio;
    - el borrador por retiro al cerrar y reabrir.
  - Rol acotado (TESORERIA CAJA): la caja trae solo los pendientes de las sucursales que cubre.
  - Falla de red a mitad del apilado: respuesta perdida con el puerto 8099 o con demora por
    `variables.id` (memoria «probar respuestas fuera de orden»). El retiro entra en el central y la UI
    lo saca igual.
  - Un QR que lanza en el filial: el retiro se guarda y el ticket sale sin QR.
  - Un ticket real de retiro y de cierre en la térmica `frc-ticket`, no solo el base64.
- Datos (auditoría, eje B): `retiro` también baja del central a la filial por la publicación filtrada por
  sucursal.
  - Antes de sembrar, mirar `pg_publication_tables` y `pg_subscription` de la base local.
  - Sembrar `retiro` + `retiro_detalle` con ids altos, fuera de la secuencia del filial, en una sucursal
    sin suscripción local.
  - Levantar el central con `replication.sync/refresh` apagados.
  - Borrar al final por `(id, sucursal_id)`.
  - Alternativa más limpia: generar los retiros por la pantalla del PDV contra el filial local, que es
    también la forma de obtener el ticket real.

## Qué queda sin verificar y cómo se verificaría

- **Lector físico: prueba obligatoria antes del PR**, no opcional. Con el papel de la térmica local y un
  lector HID en esta máquina, con distribución en español. Si no hay lector físico acá, se frena y se le
  pide a Franco antes de informar.
- Impresión desde Electron («imprimir desde esta PC»): usa el mismo base64, que sí se verifica.

## Auditoría del plan (paso 5, 2026-11-03)

Dos auditores sin verse entre sí, los dos con veredicto REVISE. Cada hallazgo se verificó contra el
código antes de aplicarlo.

| Eje | Hallazgo | Verificado | Qué se hizo |
|---|---|---|---|
| A | El lector ya está en stable y beta; con el QR de retiro, un desktop viejo abre la verificación sin monedas | sí: `qr-lector.service.ts` existe en `origin/master` y en `origin/release/beta` | orden de despliegue «desktop primero»; defensa en F4 contra conteos vacíos |
| A | Lector HID con Windows en español: `-` llega como `'` | sí: `teclado-lector.ts:31` (`Minus: '-_'`) y la directiva `frcLectorTeclado` | F3 usa `frcLectorTeclado` + `alternativa()`; spec; lector físico pasa a prueba obligatoria |
| A | El rol acotado necesita `destinoId` en el lector | sí: `ingresar-retiro…component.ts:93,176` | F3 lo pasa con `operaAcotadoCaja` |
| A | Error de la consulta de pendientes y mensaje para EN_PROCESO | sí: `RetiroRepository` excluye EN_PROCESO | F3: rechazo explícito con mensaje propio |
| B | Una excepción del QR dentro de `saveRetiro` (`@Transactional`) deshace el retiro | sí: `RetiroGraphQL.java:85,118`; `printRetiro` solo atrapa `IOException` (`:619`) | F1/F2: `try/catch` propio del bloque QR + test |
| B | Falla de red a mitad del apilado: el retiro queda acreditado y la UI lo muestra pendiente | sí: `onVerificar` usa `onSaveCustom`, que emite error ante falla de transporte | F4: re-consulta de pendientes ante cualquier error; Cancelar deshabilitado al guardar |
| B | Falta un test que falle con el código viejo | sí | specs de F3 y F4 |
| B | `seleccionados` conserva los ya verificados en modo escaneo | sí: `onProcesar` solo llama `cargar()` | F4 los poda al cerrar |
| B | Los datos sembrados en el central pueden bajar a la filial local | no se pudo verificar (sin acceso a la base en la auditoría) | procedimiento de siembra en «Tests y pruebas»; se verifica antes de sembrar |
| B | Riesgo de impresoras de 58 mm | parcial: la seña ya imprime QR ESC/POS en la térmica del PDV | ticket real en la prueba de runtime |

## Auditoría del diff (paso 8, 2026-11-03)

Tres ejes fijos. No aplicó ningún condicional: el diff no toca release, migraciones ni replicación.

| Eje | Veredicto | Hallazgo | Qué se hizo |
|---|---|---|---|
| Fijo 1 (autorización) | riesgo bajo | El lector consulta `filterRetiros` antes que la lista de pendientes. Es lo mismo que ya hacía develop. | Sin cambio en este trabajo. Se anotó como pendiente aparte. |
| Fijo 1 | — | La reconciliación compara por id. | Comentario en el diálogo: todos los retiros son de la misma sucursal y caja. |
| Fijo 2 (esquema y datos) | ACCEPT | El plan decía que se usaba `idSucursalActual()` como respaldo y el código no lo hace. | Se corrigió el plan (F1). |
| Fijo 3 (contrato) | MEDIUM | Un desktop viejo confirma sin conteos y el central acredita 0. | **Central:** `verificar` rechaza si no hay ningún conteo y el retiro tiene declarado (`RetiroVerificacionConteoVacioTest`, que falla sin el cambio). Así queda protegida cualquier versión del desktop. |
| Fijo 3 | MEDIUM | El bloque usaba colores fijos. | Se pasó a tokens `--frc-*`. |
| Fijo 3 | LOW | La reconciliación contaba como «ingresado» lo que se canceló en otra PC. | El resultado separa `ingresados` y `fuera`, cada uno con su aviso. |
| Fijo 3 | LOW | El contador del reintento mezclaba totales. | Usa el total inicial del diálogo. |
| Fijo 3 | LOW | La caja salía del QR antes que del dato del central. | Ahora manda `retiro.cajaSalida.id` y el QR queda de respaldo. |
| Fijo 3 | LOW | Cerrar con Esc el diálogo abierto desde el escáner no recargaba el saldo. | Se agregó `disableClose`. |

Con el rechazo del central, el orden «desktop primero» deja de proteger la plata y queda como cuestión de
uso: un desktop viejo que escanea un QR de retiro recibe «No llegó el conteo…» en vez de abrir un caso falso.
Se mantiene igual, porque con el desktop viejo el escaneo no sirve.

## Auditoría del plan de F6 (2026-11-03)

Dos auditores sin verse entre sí, los dos con veredicto REVISE. Se verificaron contra el código el
`totalChange` de la grilla al cargar (`grilla-conteo.component.ts:96,122`) y el `nullable: false` de
los presets de `currencyMask` (`numbersUtils.ts:14,29`). Todo quedó incorporado a F6:

- vacío ≠ 0;
- opciones de máscara propias;
- el input solo desde `cantidadesChange`;
- la grilla se cierra al tipear;
- borrador v2 con lectura de respaldo de la clave vieja;
- redondeo en `conteos()`;
- tests que fallan con cada bug.

Queda fuera la validación de negativos y decimales en el central.
