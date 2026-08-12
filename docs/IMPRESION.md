# Impresión de comprobantes — padrón oficial (desktop)

Guía del **componente oficial de impresión** del sistema. Define cómo se ofrece
la salida de todo comprobante/recibo firmable: **PDF (A4)** o **Ticket térmico
(58/80mm)**.

> **Padrón:** toda opción de impresión de un comprobante/recibo firmable debe usar
> este componente y ofrecer **ambos formatos** (PDF y ticket), **salvo** que:
> - el usuario pida explícitamente otra cosa, o
> - uno de los dos formatos no sea viable (ej. un reporte tabular agregado no tiene
>   sentido en ticket → va **solo PDF**).

## Cómo funciona (resumen)

El mismo comprobante se genera en el **backend** en dos formatos según los
parámetros de la query:

- **PDF (A4)** — Jasper → base64 de un PDF → se muestra en el **visor integrado**.
- **Ticket** — el backend genera un **payload ESC/POS crudo** (base64 de bytes,
  no PDF) → el cliente Electron lo manda **directo a la impresora térmica local**
  con `lp -o raw` (o socket TCP si es de red). **No** pasa por ningún visor ni por
  el diálogo de impresión del SO — sale al toque, sin reescalado ni PostScript.

Esto es un cambio respecto al approach viejo (ticket = "PDF angosto" impreso desde
el visor): hoy el ticket es **ESC/POS client-side vía `printLocal`**.

## Piezas

| Pieza | Ruta | Rol |
|---|---|---|
| `ImprimirDialogComponent` | `shared/components/imprimir/imprimir-dialog.component.ts` | Diálogo que pregunta el formato. Botones **PDF (A4)**, **Ticket 58mm**, **Ticket 80mm**. Devuelve `{ formato: 'pdf'\|'ticket', anchoMm: number\|null }`. Con `soloPdf` oculta los dos botones de ticket. |
| `ImpresionService` | `shared/components/imprimir/impresion.service.ts` | Orquesta: abre el diálogo → si **PDF** llama al generador con `(null, false)` y muestra en el visor; si **Ticket** elige la impresora térmica, llama al generador con `(anchoMm, true)` y manda el payload por `printLocal`. |
| `ElectronService.printLocal` | `commons/core/electron/electron.service.ts` | `ipcRenderer.invoke('print-local', args)` → main process. |
| `imprimirLocalRaw` | `app/main.ts` | Impresión real: `RED` → socket TCP a `ip:puerto` (9100); `CUPS/USB/BLUETOOTH` → `spawn('lp', ['-d', cola, '-o', 'raw'])`. |
| `Impresora` / `ImpresoraService` | `modules/configuracion/impresoras/` | Registro de impresoras. Campos: `uso` (`TICKET`/`FACTURA`/…), `tipo` (`TERMICA`/…), `conexion` (`CUPS`/`USB`/`RED`/`BLUETOOTH`), `colaCups`, `ip`, `puerto`, `esPredeterminada`. |

`ImprimirDialogComponent` y `ImpresionService` viven en `SharedModule` (el diálogo
declarado; el service `providedIn: 'root'`).

## Cómo usarlo (frontend)

En el componente que dispara la impresión, inyectar `ImpresionService` y llamar:

```ts
onVerRecibo(row: Vale) {
  this.impresionService.imprimir(
    'Recibo vale ' + row.id,                                        // nombre en el visor
    (anchoMm, escpos) => this.reportesRrhhService.onReciboVale(row.id, anchoMm, escpos)
  );
}
```

- El **generador** es `(anchoMm, escpos) => Observable<base64>` — **dos parámetros**:
  - PDF: se invoca con `(null, false)` → devuelve base64 de un PDF A4.
  - Ticket: se invoca con `(anchoMm, true)` → devuelve base64 de un **payload ESC/POS**.
- Para **solo PDF** (reportes agregados): `this.impresionService.imprimir(nombre, gen, true)`
  (tercer parámetro `soloPdf = true` → el diálogo no ofrece ticket).

### Selección de la impresora de ticket

`ImpresionService.imprimirTicket` elige la térmica con `elegirImpresoraTicket`:
filtra `uso === 'TICKET' || tipo === 'TERMICA'`, prefiere la que tenga
`esPredeterminada`, si ninguna está marcada usa la primera candidata. Si no hay
candidatas → notificación "No hay impresora de ticket configurada
(Configuración → Impresoras)". Si la app no corre en Electron → notificación
"requiere la app de escritorio".

## Cómo generar los dos formatos (backend)

El backend expone **una** query por comprobante con `anchoMm: Int` y
`escpos: Boolean` (ambos opcionales/nullables):

```graphql
imprimirReciboVale(id: ID!, anchoMm: Int, escpos: Boolean): String
```

En el servicio (`ReporteRrhhService` / `ReciboLiquidacionService`), la firma
uniforme es `(Long id, Integer anchoMm, boolean escpos)`, con tres salidas:

| `escpos` | `anchoMm` | Salida |
|---|---|---|
| `false` | `null` | **PDF A4** (`recibo-rrhh.jrxml` genérica o plantilla dedicada) |
| `false` | `58`/`80` | **PDF ticket angosto** (preview en visor, `recibo-ticket-58/80.jrxml`) |
| `true` | `58`/`80` | **Payload ESC/POS crudo** (`ReciboTicketEscPos.build`), para `printLocal` |

`ReciboTicketEscPos` (`utilitarios/print/ReciboTicketEscPos.java` en central):
`cols = anchoMm>=80 ? 48 : 32`; **el concepto se envuelve a varias líneas sin
truncar** (`filaConcepto`/`wrapAncho`) — un concepto largo (ej. penalización con
descripción) ocupa 2+ líneas completas, monto a la derecha en la primera; `na()`
quita acentos (la térmica RAW no soporta codepages con tildes).

## ⚠️ Limitaciones por plataforma

- **macOS / Linux**: `lp -o raw` funciona para `CUPS`/`USB`/`BLUETOOTH`. ✅
- **Windows**: `imprimirLocalRaw` **bloquea** CUPS/USB/Bluetooth (mensaje "Impresión
  CUPS local aún no soportada en Windows"). Solo funciona `conexion === 'RED'`
  (socket TCP a `ip:puerto`). Para tickets en Windows, configurar la impresora como
  **RED**.
- **"Compartir al servidor"** (diálogo de alta de impresora): el botón se muestra
  siempre, pero la función (`share-local-printer` → `compartirImpresoraLocal`) solo
  tiene éxito en **Linux** (`compartirImpresoraLocal` gatea `platform !== 'linux'`).
  En macOS/Windows falla con "Compartir CUPS solo disponible en Linux". Para una
  impresora en la **PC del usuario** (no filial/sucursal) no hace falta compartir:
  el ticket sale local vía `printLocal`.

## Dónde ya está aplicado (RRHH)

Recibos con **PDF + Ticket** vía este componente (7 casos):
vale, penalización, aguinaldo, préstamo (entrega), bono, **finiquito**,
**liquidación mensual**.

Reportes agregados (**solo PDF**, sin ticket): nómina del mes, resumen IPS, vales
pendientes, préstamos activos, aguinaldo del año.

## Al agregar una impresión nueva

1. Backend: agregar `anchoMm: Int` **y `escpos: Boolean`** a la query; rutear a
   PDF A4 / PDF ticket / ESC/POS según `escpos` + `anchoMm`.
2. Frontend: inyectar `ImpresionService` y llamar
   `imprimir(nombre, (anchoMm, escpos) => servicio.onGenerar(id, anchoMm, escpos))`.
3. Si el comprobante no tiene sentido en ticket, usar `soloPdf = true`.
4. `npm run check` (AOT) antes de pushear.
