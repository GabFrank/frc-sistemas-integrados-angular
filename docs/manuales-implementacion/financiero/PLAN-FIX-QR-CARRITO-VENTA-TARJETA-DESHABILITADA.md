# Plan — ocultar el QR del carrito cuando venta_tarjeta está deshabilitada

Rama: `fix/venta-tarjeta-ocultar-qr-sin-config` (desde `develop` 0c0319ed). Pieza: desktop solamente.

## Problema

Con `configuracion_venta_tarjeta.habilitado = false`, al cobrar con TARJETA en el PDV
(`pago-touch`), la línea del carrito muestra el icono `qr_code_scanner` y al tocarlo abre
`ScanTerminalPosDialogComponent` para ingresar el código del POS. También muestra el indicador
naranja «Falta escanear el cupón», que nunca se va a resolver porque el flujo está apagado.

## Puertas al escaneo en `pago-touch.component.ts`

| Puerta | Respeta `ventaTarjetaHabilitada` |
|---|---|
| Apertura automática al agregar la línea (`escanearSiEsTarjeta`, :823) | sí |
| Bloqueo por terminal al finalizar (`onFinalizar`, :722-732) | sí |
| Armado de `tarjetaPagos` al finalizar (:736) | sí |
| Icono QR de la línea del carrito (`.html` :257-262 → `escanearTarjeta`) | **no** |
| «Escanear otro» dentro de la confirmación de diferencia (:804) | solo se alcanza con el flujo abierto |

## Fase única — `fix(venta-tarjeta)`

1. `pago-touch.component.html`: sumar `ventaTarjetaHabilitada &&` al `*ngIf` del icono QR. El
   indicador de estado se muestra si el flujo está activo **o** la línea ya trae cupón: con el flujo
   apagado desaparece el reloj naranja «Falta escanear» pero el check verde de una línea con cupón
   real queda (propiedades, no funciones: regla #1 del repo).
2. `pago-touch.component.ts`: guarda `if (!this.ventaTarjetaHabilitada) return;` al inicio de
   `escanearTarjeta`, para que ningún llamador futuro reabra la puerta.

Datos nuevos: ninguno. Backend, migraciones, réplica: N/A (no se toca persistencia ni contrato).

## Tests

- `npm run check` (AOT de producción) — gate obligatorio del desktop.
- Unit/e2e: N/A para desktop (el CI no los corre, ciclo §1 paso 9).
- Manual (queda para Franco): PDV local con venta_tarjeta DESACTIVADO → cobrar con TARJETA → la
  línea no muestra QR ni reloj naranja y se finaliza sin pedir cupón. Con ACTIVADO → el diálogo se
  abre solo, el QR y el indicador aparecen como antes.

## Auditoría del plan (paso 5)

- **Eje A**: no hay otras puertas — `ScanTerminalPosDialogComponent` solo se abre desde
  `escanearTarjeta`; `venta-touch` solo consume `tarjetaPagos`. Hallazgo: el indicador es el mismo
  `mat-icon` que el check verde «Cupón registrado»; ocultarlo entero con el flag escondería cupones
  reales (delivery reabierto con `identificadorTransaccion`). **Aplicado**: se oculta solo la rama
  naranja.
- **Eje B**: la guarda va antes de `isDialogOpen = true` → no deja atajos apagados; el flag se
  asigna una sola vez → no corta flujos a mitad; revert limpio. Hallazgo **preexistente, fuera de
  alcance**: `onGetConfiguracion` usa `onCustomQuery` sin `propagate`, así que ante error de red no
  emite (`generic-crud.service.ts:202`), el `error:` de `pago-touch.component.ts:246` es código
  muerto y el flag queda `false` en silencio: con el flujo activo, esa venta sale sin cupón. Ya pasa
  hoy con la apertura automática; el fix no lo agrava. Queda como posible fix aparte.

## Sin verificar

- La prueba manual en el PDV (no se levantó filial/desktop en esta sesión).
- `ventaTarjetaHabilitada` se carga async al abrir el diálogo: si la consulta tarda, el icono
  aparece recién al llegar la respuesta con el flujo activo (antes el default `false` ya ocultaba la
  apertura automática; ahora también oculta el icono en ese intervalo). Se considera correcto.
