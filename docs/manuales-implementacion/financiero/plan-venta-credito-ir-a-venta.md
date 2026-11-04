# Plan — «Ir a venta» en los movimientos del cliente

Rama: `fix/venta-credito-ir-a-venta` (desde `develop`). Pieza: desktop. Sin cambios de backend.

## Problema

Clientes → menú de un cliente → «Ver movimientos» abre `ListVentaCreditoComponent`. En la columna
**Venta** se ve el número y un ícono `launch` con tooltip «Ir a venta», pero el botón no tiene
`(click)`: el clic sube a la fila y solo la despliega. Nunca lleva a la venta.

## Arreglo

Decisión de Franco (04/11): el ícono abre **las ventas de la caja** donde se hizo la venta
(`ListVentaComponent`, el resumen de caja + su lista de ventas), con la venta filtrada. Primer
borrador abría el buscador genérico (`GenericListVentaComponent`); se descartó.

Patrón existente que se reusa: `list-movimiento-stock` y `list-control-stock-negativo` (`irAVenta`):
leen la venta con `onGetPorId` (la lista de créditos no trae la caja) y abren `ListVentaComponent`
con `TabData.data = { caja: { ...venta.caja, sucursalId }, ventaId }`.

- `list-venta-credito.component.html`: `(click)="$event.stopPropagation(); onIrAVenta(ventaCredito)"`
  en el botón; el botón solo se muestra si `puedeVerVentas` y hay venta.
- `list-venta-credito.component.ts`: `onIrAVenta(ventaCredito)` y el flag `puedeVerVentas`,
  calculado en `ngOnInit` con `mainService.tieneAlgunRol([ANALISIS_DE_CAJA])`, el rol con que el
  menú abre «Cajas» (el destino muestra el resumen de la caja). Sin el rol se sigue viendo el
  número, sin ícono. La lectura usa los mismos parámetros que `onClickRow` (timeout por defecto,
  aviso si el servidor no responde), sin tocar `loading` (es el spinner del detalle de la fila).
  Sin caja: aviso «La venta no tiene una caja asociada.».

Una sola fase. Sin migraciones ni datos nuevos (tabla de datos nuevos: N/A, no nace ningún campo).

## Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| `TabService.addTab` deduplica por **título** y solo cambia `tabData`; el destino filtra solo en `ngOnInit`. Un título repetido reabre la solapa vieja con el filtro viejo. | A y B | Título con caja, venta y sucursal: `Caja C - venta N (Sucursal)`. |
| Usar `venta.sucursalId` (clave de la venta, ya viene en `ventaCreditoPorClienteQuery`). | A | Se usa `venta.sucursalId`, con `sucursal.id` de respaldo. |
| `venta` puede ser null. | B | `*ngIf` en el botón y salida temprana en `onIrAVenta`. |
| `stopPropagation` alcanza; solo se abre como solapa desde `list-clientes`; el destino no modifica nada al llegar. | A y B | Sin cambio. |

## Auditoría del diff (paso 8)

Fijo 1 (autorización), Fijo 2 (esquema) y Fijo 3 (contrato) en un auditor. Condicionales: N/A
(no toca release ni replicación).

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| El gate copiaba los roles de «Ventas» (`ANALISIS_DE_VENTA` incluido), pero el destino muestra el resumen de caja, que hoy solo abre «Cajas» con `ANALISIS_DE_CAJA`: fuga de saldos de caja. | Fijo 1 | Gate solo `ANALISIS_DE_CAJA`. |
| `loading` es el spinner del detalle desplegado: el ícono lo mostraba dentro de otra fila. | Fijo 3 | `onIrAVenta` no lo toca. |
| `ventaPorId` ya trae `caja { id }`; sin GraphQL nuevo. `onGetById` es `fetch` `no-cache`: emite una vez. | Fijo 2/3 | Sin cambio. |
| Si falla `onGetByIdSimp` de la caja, `onGetBalance` del destino lee `selectedCaja.sucursal?.id` vacío. | Fijo 3 | Preexistente en `ListVentaComponent` (mismo objeto que pasan movimientos de stock); fuera de alcance. |

## Pruebas (paso 9) — 04/11, por pantalla contra el central alpha (:8083, solo lectura)

Cliente 3837 (MAURO ROLANDO RIVAS FERNANDEZ), usuario MR.

| Caso | Resultado |
|---|---|
| Venta 63424 (Suc. Itaipu) | Abre «Caja 1958 - venta 63424 (SUC. ITAIPU)» con la venta filtrada; caja 1958 confirmada en la base. La fila de origen no se despliega. |
| Ventas 76373 y 76377, misma caja 2506 (Suc. Calle 10) | Dos solapas distintas, cada una con su venta. |
| Venta sin caja (simulado en la página: no hay datos así) | Aviso, no abre solapa. |
| Corte de red (simulado con un `Error` con `networkError`) | Aviso «No se pudo cargar la venta: el servidor no responde.», sin solapa ni fila desplegada. |
| Roles cambiados en memoria: solo «ANALISIS DE VENTA» / solo «VENTA TOUCH» | Se ven los 4 números, ningún ícono. |
| Solo «ANALISIS DE CAJA» (sin ADMIN) | 4 íconos; clic real en 63424 abre la caja 1958. |
| `npm run check` (AOT) sobre el código final | OK, sin errores (`Build at: 2026-11-04T14:01:26Z`). |

## Fuera de alcance (visto en la prueba)

- `GenericListVentaComponent.aplicarFiltroInicial` pone `sucursalId` como número y las opciones
  del combo son texto: el combo «Sucursal» queda en blanco (la búsqueda filtra bien). Afecta a
  `historial-lote` → «Ver venta». No se toca acá.
