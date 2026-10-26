# Impresión de comprobantes — padrón oficial (desktop)

Guía del **componente oficial de impresión** del sistema. Define cómo se ofrece
la salida de todo comprobante/recibo firmable: **PDF (A4)** o **Ticket térmico
(58/80mm)**.

> **Padrón:** toda opción de impresión de un comprobante/recibo firmable debe usar
> este componente y ofrecer **ambos formatos** (PDF y ticket), **salvo** que:
> - el usuario pida explícitamente otra cosa, o
> - uno de los dos formatos no sea viable (ej. un reporte tabular agregado no tiene
>   sentido en ticket → va **solo PDF**).

> Tickets del **POS** impresos en la impresora local de la PC (sin que el filial la alcance):
> ver [impresion-pos-desde-cliente.md](impresion-pos-desde-cliente.md).

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

**Fallback web (#231).** Si el desktop corre en un navegador (sin Electron no hay
`printLocal`), el ticket cae al **PDF angosto** de 58/80mm en el visor y se imprime
con el botón **«Imprimir ticket»** de la barra del visor, eligiendo la térmica en el
diálogo del sistema. En Electron no cambia nada. Diferencias con el ESC/POS:

- No es silencioso: abre el diálogo del SO y el usuario elige la impresora.
- La térmica tiene que estar configurada con papel de ese ancho; si no, el driver
  puede reescalar o recortar.
- No manda el comando de corte de papel (depende del driver).
- Conserva los acentos (el ESC/POS los quita).

Las plantillas `recibo-ticket-58/80.jrxml` usan `isIgnorePagination="true"`: el PDF
es **una sola página con el alto del contenido** (≈286pt para un concepto), no la
página fija de 1200pt que dejaba ~32cm de papel en blanco.

**Por qué un botón propio y no el de imprimir del visor.** El del visor (pdf.js) fija
la hoja al tamaño exacto del PDF (`@page { size }`). La térmica no tiene ese papel,
así que Chrome **centra** la hoja en el rollo y la impresora avanza todo el blanco de
arriba (más de un metro con un rollo largo). «Imprimir ticket»
(`shared/components/imprimir/imprimir-ticket-navegador.ts`) dibuja cada página como
imagen a 203 dpi y la imprime desde un iframe **sin tamaño de hoja**: Chrome usa el
papel de la impresora, empieza desde arriba, y el driver descarta el blanco de abajo.
En los tickets web el botón del visor se oculta.

### Instalar la térmica para imprimir desde el navegador (una vez por PC)

El navegador solo imprime a través del sistema (CUPS / cola de Windows) y necesita
la impresora **con driver**. Una cola *raw* (la que usa Electron para ESC/POS) no le
sirve: Chrome la muestra como «no disponible». **No tocar la cola de Electron**:
agregar otra, sobre el mismo dispositivo, solo para el navegador.

- **Windows:** instalar el driver del fabricante (suele llamarse «POS-58»/«POS-80»)
  y elegir el papel de 58 u 80mm en sus preferencias.
- **Linux:** no hay paquete en Fedora; se usa el driver libre
  [zj-58](https://github.com/klirichek/zj-58) (filtro `rastertozj` + `zj58.ppd`/`zj80.ppd`):

  ```bash
  gcc -O2 -w -std=gnu11 -o rastertozj rastertozj.c -lcups -lcupsimage   # necesita cups-devel
  sudo install -m 755 rastertozj /usr/lib/cups/filter/rastertozj
  sudo install -d /usr/share/cups/model/zjiang
  sudo install -m 644 zj58.ppd zj80.ppd /usr/share/cups/model/zjiang/
  # misma URI que la cola raw (lpstat -v):
  sudo lpadmin -p <cola>_ticket -E -v '<uri usb de la térmica>' \
    -P /usr/share/cups/model/zjiang/zj58.ppd -o PageSize=X48MMY105MM -o BlankSpace=False
  ```

  - `BlankSpace=False`: el driver no imprime el blanco del final de cada hoja, así que
    el ticket sale con su largo real y sin cortes entre hojas.
  - `PageSize=X48MMY105MM`: Chrome dibuja la vista previa con el papel de la
    impresora, y una página web no lo puede cambiar. Con 105mm un vale (~101mm) se ve
    en una sola hoja; un recibo más largo se ve en varias, pero en el rollo sale
    continuo. Medido con el driver: vale 92mm de papel, recibo de 5 conceptos 119mm.
    **No usar un rollo largo** (`X48MMY3276MM`): la vista previa muestra metros de
    blanco.

En el diálogo de Chrome: Márgenes **Ninguno**, Escala **Predeterminada**.

## Piezas

| Pieza | Ruta | Rol |
|---|---|---|
| `ImprimirDialogComponent` | `shared/components/imprimir/imprimir-dialog.component.ts` | Diálogo que pregunta el formato. Botones **PDF (A4)**, **Ticket 58mm**, **Ticket 80mm**. Devuelve `{ formato: 'pdf'\|'ticket', anchoMm: number\|null }`. Con `soloPdf` oculta los dos botones de ticket. |
| `ImpresionService` | `shared/components/imprimir/impresion.service.ts` | Orquesta: abre el diálogo → si **PDF** llama al generador con `(null, false)` y muestra en el visor; si **Ticket** elige la impresora térmica, llama al generador con `(anchoMm, true)` y manda el payload por `printLocal`. Fuera de Electron, el ticket llama con `(anchoMm, false)` y abre el PDF angosto en el visor. |
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
(Configuración → Impresoras)". Si la app no corre en Electron no se busca
impresora: el ticket sale como PDF angosto en el visor (ver «Fallback web»).

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
| `false` | `58`/`80` | **PDF ticket angosto** (fallback web en el visor, `recibo-ticket-58/80.jrxml`) |
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

Recibos con **PDF + Ticket** vía este componente (8 casos):
vale, penalización, aguinaldo, préstamo (entrega), bono, **finiquito**,
**liquidación mensual** y **recibo por ítem de liquidación**.

El recibo por ítem es el ícono `receipt` de cada fila en el detalle de la liquidación
mensual y del finiquito (`imprimirReciboItemLiquidacion` /
`imprimirReciboItemLiquidacionFinal`). Un ítem HABER sale como «RECIBO DE LIQUIDACION
Nro. `<id de la liquidación>`» y un DESCUENTO como «CONSTANCIA DE DESCUENTO». Se ofrece en
BORRADOR, APROBADA y PAGADA (no en ANULADA) y solo en ítems con monto mayor a cero; el
central valida lo mismo.

Reportes agregados (**solo PDF**, sin ticket): nómina del mes, resumen IPS, vales
pendientes, préstamos activos, aguinaldo del año.

## Al agregar una impresión nueva

1. Backend: agregar `anchoMm: Int` **y `escpos: Boolean`** a la query; rutear a
   PDF A4 / PDF ticket / ESC/POS según `escpos` + `anchoMm`.
2. Frontend: inyectar `ImpresionService` y llamar
   `imprimir(nombre, (anchoMm, escpos) => servicio.onGenerar(id, anchoMm, escpos))`.
3. Si el comprobante no tiene sentido en ticket, usar `soloPdf = true`.
4. `npm run check` (AOT) antes de pushear.
