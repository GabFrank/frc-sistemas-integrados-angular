# Impresión del POS desde esta PC

> Desde 2026-09-29. Rama `feat/impresora-modo-impresion`. Contraparte en el filial:
> `franco-system-backend-filial/docs/impresion-pos-desde-cliente.md` (rama `feat/impresion-pos-cliente`).

## Qué resuelve

Una PC del POS puede imprimir sus tickets en **su propia impresora USB**, sin que el filial tenga
que alcanzarla (ni IP, ni CUPS compartido). La filial arma el mismo comprobante de siempre en
ESC/POS, lo devuelve en base64 y Electron lo manda crudo a la impresora local.

La impresión **por servidor** sigue existiendo y es la opción por defecto. Cada PC elige.

## Configuración (por PC)

*Configuración del Sistema*:

1. **Impresora USB local → CONFIGURAR**: detectar la USB (o elegir una ya instalada en el SO),
   instalarla (CUPS raw en Linux, *Generic / Text Only* en Windows), nombre y ancho, PROBAR. Se
   guarda sola en `config-backup.json` → `impresoraLocal`.
2. Marcar **Imprimir desde esta PC** (excluyente con *Imprimir por servidor*) y GUARDAR →
   `modoImpresion: 'FRONTEND'`.

`ConfiguracionService.imprimirPorFrontend()` es `true` solo con `FRONTEND` **y** una impresora
local configurada.

## Qué flujos cubre

Todas las impresiones del POS contra la filial (`servidor === false`):

| Flujo | Service | Modo PC |
|---|---|---|
| Cobro con ticket (F11 / Cobro rápido), Finalizar con ticket, venta a crédito (pagaré) | `VentaService.onSaveVenta` | `saveVentaCliente` → imprime `venta.ticketEscpos` |
| Reimpresión de venta | `VentaService.onReimprimirVenta` | `ticketEscpos(VENTA)` |
| Facturación (F12) | `FacturaLegalService.onSaveFactura` | guarda sin `printerName` → `ticketEscpos(FACTURA)` |
| Delivery (pasar a entrega) / reimpresión | `DeliveryService.onSaveDeliveryEstado` / `onReimprimirDelivery` | `saveDeliveryEstadoCliente` → `delivery.ticketEscpos` / `ticketEscpos(DELIVERY)` |
| Balance de caja | `CajaService.onImprimirBalance` | `ticketEscpos(BALANCE)` |
| Gasto / reimpresión | `GastoService.onSave` / `onReimprimir` | `saveGastoCliente` → `ticketEscpos(GASTO)` |
| Retiro / reimpresión | `RetiroService.onSave` / `onReimprimirRetiro` | `saveRetiroCliente` → `ticketEscpos(RETIRO)` |
| Seña de cobro con tarjeta | `VentaTarjetaService.onImprimirSena` | `senaCuponEscpos` |

### Contra el central

Solo dos flujos (desde 2026-09-29, rama `feat/impresion-central-desde-pc` + central
`feat/impresion-central-cliente`, ver `franco-system-backend-servidor/docs/impresion-desde-cliente.md`):

| Flujo | Service | Modo PC |
|---|---|---|
| Lista de facturas → Reimprimir | `FacturaLegalService.onReimprimirFacturaTicket` | `ticketEscpos(FACTURA, id, sucId)` del central |
| Editar caja → Imprimir Cierre (fuera del POS) | `CajaService.onImprimirBalance` | `ticketEscpos(BALANCE, id, sucId)` del central |

Todo lo demás que va al **central** sigue imprimiendo por servidor en cualquier modo (por ejemplo
"Imprimir ticket/PDF en sucursal", o la impresión al crear una factura desde el diálogo de alta).

## Cómo está hecho

- **`ImpresionPosService`** (`src/app/shared/services/impresion-pos/`) es el único que decide y el
  único que habla con Electron:
  - `porCliente(servidor)`: ¿esta operación la imprime el frontend?
  - `imprimir(base64, que)`: `ElectronService.printLocal` con la cola de `impresoraLocal`.
  - `imprimirTicket(tipo, id, que, reimpresion?)`: pide `ticketEscpos` a la filial e imprime.
  - `imprimirSenaCupon(input)`: ídem con `senaCuponEscpos`.
  - `imprimirTicketCentral(tipo, id, sucId, que)`: pide `ticketEscpos` al **central** e imprime.
  - `imprimeEstaPc()`: modo "desde esta PC" sin importar a qué servidor va la operación.
- Cada service del POS tiene una rama `if (this.impresionPos.porCliente(servidor)) { ... }` al
  principio; **fuera de esa rama el código y el pedido son los de siempre**.
- Las mutaciones del modo PC usan **documentos GraphQL aparte** (`saveVentaCliente`,
  `saveDeliveryEstadoCliente`, `saveGastoCliente`, `saveRetiroCliente`). Los originales no se
  tocaron, así una PC en modo servidor sigue funcionando contra filiales sin esta versión.
- La venta (y lo demás) se entrega apenas se guarda; el papel sale después, sin bloquear el cobro.
- Si la impresión local falla, lo guardado queda guardado y se avisa con un snackbar
  ("… no se pudo imprimir en esta PC: … Usá la reimpresión."). La seña no avisa desde el servicio
  porque `venta-touch` ya le dice al cajero qué números anotar.
- Las reimpresiones devuelven `null` si el papel no salió, para que la pantalla no diga
  "Reimpreso con éxito".
- Ancho: los tickets de la filial son de **58 mm / 32 columnas** (igual que por servidor). El
  perfil de la impresora local solo afecta el ticket de prueba.

## Despliegue — el orden importa

1. Desplegar el **filial** con `feat/impresion-pos-cliente`.
2. Recién después, en cada PC que lo necesite, marcar **Imprimir desde esta PC**.

Una PC en modo PC contra un filial viejo **no puede guardar ventas**: el filial rechaza
`imprimirEnCliente` y `ticketEscpos`. En modo servidor no hay ningún riesgo.

## Verificación hecha

- `npm run check` (AOT) OK.
- Los documentos GraphQL nuevos se validaron con `graphql-js` contra el SDL del filial: los 10
  (nuevos y originales) son válidos contra la rama nueva; contra `develop` los nuevos fallan (por
  eso el orden de despliegue) y los originales siguen válidos.
- En el filial: `./mvnw test` (367 tests), incluidos los que comparan byte por byte el ticket
  impreso por el servidor contra el generado para el cliente.

**Pendiente:** prueba real de cada flujo en modo servidor y en modo PC, con la filial levantada.
