# Plan — Ventas de la caja: aviso sin acceso cuando el central también rechaza las ventas

Pieza: desktop. Rama `fix/ventas-caja-aviso-sin-acceso` desde `develop` (con #681 y #683).
Acompaña al central #562 (control de rol en el detalle de la caja), que ahora también rechaza la lista de ventas
de una caja ajena (`ventasPorCajaId`) para quien no es dueño ni tiene `ANALISIS DE CAJA` o tesorería.

## Qué pasa con el central nuevo

`ListVentaComponent` (#681), al rechazarse la caja por permiso, avisa «No tenés acceso a la caja N: se muestran sus
ventas, sin el balance.» y carga las ventas. Con #562 la lista también se rechaza: el aviso miente y el genérico
suma un «Ups! Algo salió mal: No autorizado…» (dos avisos, lo que #672 quería evitar).

## Fase única — `list-venta.component.ts`

- Aviso: «No tenés acceso a la caja N.» Es cierto con un central que solo tiene #561 (hoy develop/alpha: la caja
  se rechaza y las ventas cargan) y con #562 (tampoco las ventas). Sin #561 no se rechaza nada y no hay aviso.
- `onGetVentas`: con `sinAccesoCaja`, `LECTURA_ESTRICTA` (sin aviso del genérico). En el `error:`: un rechazo
  «No autorizado» deja la lista vacía sin otro aviso (el resumen ya dice «sin acceso a esta caja» de forma
  permanente); otro rechazo avisa su motivo; el de red, el aviso de hoy. Con acceso, el `errorConf` de hoy.
- Sin acceso y sin sucursal: «No tenés acceso a la caja N.» igual (antes «no se pueden mostrar sus ventas»).

Sin datos nuevos. Nada más cambia: con acceso, el flujo es el de hoy.

## Pruebas (desktop web contra el central de #562 local)

- Solo VER INVENTARIO: Movimientos → Ir a VENTA → un solo aviso «No tenés acceso a la caja 2662.», lista vacía.
- Tesorería / ADMIN: lista, balance y conteos como hoy, sin avisos.
- Contra un central con #561 sin #562 (develop actual): el mismo aviso y las ventas cargadas.
- Build: `ng build --configuration production`.

## Auditoría del plan (paso 5)

| Hallazgo | Qué se hizo |
|---|---|
| A-R1: la premisa del «central viejo» estaba mal | Corregida: el caso real es #561 sin #562 |
| B: silenciar todo error GraphQL de la lista tapa fallos que no son de permiso | Aplicado: solo se calla «No autorizado» |
| B: el aviso dura 6 s y no hay estado permanente | Ya existe: el resumen dice «— (sin acceso a esta caja)» |
| A-R3: Movimientos, stock negativo y V. crédito pierden la lista con #562 | Asumido: decisión de #562 |
| A: los 9 llamadores pasan por el mismo `sinAccesoCaja`; con acceso nada cambia | Sin cambio |

## Sin verificar

- Karma/e2e: N/A desktop.
