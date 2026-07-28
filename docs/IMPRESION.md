# Impresión de comprobantes — padrón oficial (desktop)

Guía del **componente oficial de impresión** del sistema. Define cómo se ofrece
la salida de todo comprobante/recibo firmable: **PDF (A4)** o **Ticket (58/80mm)**.

> **Padrón:** toda opción de impresión de un comprobante/recibo firmable debe usar
> este componente y ofrecer **ambos formatos** (PDF y ticket), **salvo** que:
> - el usuario pida explícitamente otra cosa, o
> - uno de los dos formatos no sea viable (ej. un reporte tabular agregado no tiene
>   sentido en ticket → va **solo PDF**).

## Piezas

| Pieza | Ruta | Rol |
|---|---|---|
| `ImprimirDialogComponent` | `shared/components/imprimir/imprimir-dialog.component.ts` | Diálogo que pregunta el formato. Devuelve `{ formato: 'pdf'\|'ticket', anchoMm: number\|null }`. `anchoMm` null = PDF A4; 58/80 = ticket. |
| `ImpresionService` | `shared/components/imprimir/impresion.service.ts` | Orquesta: abre el diálogo → llama al generador con el `anchoMm` elegido → muestra el PDF en el visor integrado (`ReporteService.onAdd` + tab `ReportesComponent`). |

Ambas viven en `SharedModule` (el diálogo declarado; el service `providedIn: 'root'`).

## Cómo usarlo (frontend)

En el componente que dispara la impresión, inyectar `ImpresionService` y llamar:

```ts
onVerRecibo(row: Vale) {
  this.impresionService.imprimir(
    'Recibo vale ' + row.id,                                  // nombre en el visor
    (anchoMm) => this.reportesRrhhService.onReciboVale(row.id, anchoMm)  // generador
  );
}
```

- El **generador** es `(anchoMm) => Observable<base64>`: recibe el ancho elegido y
  devuelve el PDF en base64 en ese formato. `anchoMm` null → PDF A4; 58/80 → ticket.
- Para **solo PDF** (reportes agregados): `this.impresionService.imprimir(nombre, gen, true)`
  (tercer parámetro `soloPdf = true` → el diálogo no ofrece ticket). O directamente
  no usar el diálogo y mostrar el PDF en el visor.

## Cómo generar los dos formatos (backend)

El backend expone **una** query por comprobante con `anchoMm: Int` opcional:

```graphql
imprimirReciboVale(id: ID!, anchoMm: Int): String   # null = PDF A4; 58/80 = ticket
```

En el servicio (`ReporteRrhhService` / `ReciboLiquidacionService`), el `anchoMm`
elige la plantilla JasperReports:

- `null` → plantilla **A4** del comprobante (ej. `recibo-rrhh.jrxml`, `recibo-finiquito.jrxml`, `recibo-liquidacion.jrxml`).
- `58` → `reports/recibo-ticket-58.jrxml` (pageWidth 164 ≈ 58mm).
- `80` → `reports/recibo-ticket-80.jrxml` (pageWidth 227 ≈ 80mm).

Las plantillas ticket son **genéricas** (mismos params/fields: `empresa`, `titulo`,
`funcionario`, `documento`, `fecha`, `clausula`, `total`, `totalEnLetras` + filas
`concepto`/`monto`), así que un mismo par de plantillas sirve para todos los recibos.

### Calidad de impresión térmica (por qué PDF angosto y no ESC/POS)

El "ticket" es un **PDF con ancho de ticket** que se imprime desde el visor
(`ngx-extended-pdf-viewer`, botón de imprimir → diálogo del SO → impresora térmica).
Para que salga nítido y **sin reescalado** (la principal causa de baja calidad):

1. **pageWidth = ancho de papel exacto** (58/80mm) → el driver imprime a 100%.
2. Fuente **SansSerif ≥8pt**, títulos en negrita, **líneas negras sólidas** (nada de
   grises ni bordes finos).
3. **Alto continuo** (`pageHeight` grande, bandas `Stretch`) → sin hoja en blanco.
4. Imprimir **a tamaño real** (no "ajustar a página").

> El sistema también tiene impresión **ESC/POS server-side** (`ImpresionService`/
> `TicketRetiroService` en central, vía `javax.print`) que usan venta/pedido/retiro.
> Es más "auténtica" pero requiere impresora en el servidor y no se previsualiza.
> Para recibos firmables se optó por **PDF angosto** (previsualizable, reusa el visor,
> testeable sin hardware). Como el diálogo es genérico, migrar un caso puntual a
> ESC/POS después es localizado (cambiar solo el generador del backend).

## Dónde ya está aplicado (RRHH)

Recibos con **PDF + Ticket** vía este componente:
vale, penalización, aguinaldo, préstamo (entrega), bono, **finiquito**, **liquidación mensual**.

Reportes agregados (**solo PDF**, sin ticket): nómina del mes, resumen IPS, vales
pendientes, préstamos activos, aguinaldo del año.

## Al agregar una impresión nueva

1. Backend: agregar `anchoMm: Int` a la query y rutear a la plantilla A4/ticket según el ancho.
2. Frontend: inyectar `ImpresionService` y llamar `imprimir(nombre, (anchoMm) => servicio.onGenerar(id, anchoMm))`.
3. Si el comprobante no tiene sentido en ticket, usar `soloPdf = true`.
4. `npm run check` (AOT) antes de pushear.
