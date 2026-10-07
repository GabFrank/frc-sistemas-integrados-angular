# Plan: las suscripciones escuchan hasta que se las corta, y el guardado con detalle avisa el error de red

Continuación de #390 (cerrado). Repo: desktop. Sin cambios en el central ni en el filial.

## 1. El problema [relevado sobre `develop`]

### `onCustomSub` (3 usos: QR de venta a crédito, QR de transferencia en edición y en lista)
- **Se corta con el primer aviso que llega, sea de quien sea.** Los canales del central (`ventaCreditoQrAuth`,
  `transferenciaQrEscaneadoSub`) son uno solo para todos los desktops conectados; cada pantalla filtra después
  por su cliente o su transferencia. Si el primer aviso es de otra caja se descarta, y la escucha ya quedó
  cerrada: la venta a crédito no se confirma sola y el diálogo del QR de la transferencia no se cierra al
  escanear. Pasa cuando hay dos QR abiertos a la vez.
- **Dejar de escuchar no corta la conexión**: sigue viva hasta que llegue algún aviso.
- **Venta a crédito**: si el QR se cierra sin escanear, la escucha sigue; un escaneo tardío del mismo código
  confirmaría la venta con el diálogo ya cerrado.
- Ante un corte de la conexión no termina ni avisa.

### `onSaveConDetalle` (1 uso vivo: emitir la factura legal)
- Ante un error de red emite `null` sin avisar. La factura legal ya avisa lo suyo («No se pudo confirmar la
  factura. Verifique en la lista…») y no reintenta. El guardado de venta a crédito no tiene llamadores.

## 2. Cambio
- **`onCustomSub` escucha hasta que quien llama deja de escuchar**; al dejar de escuchar corta la conexión. Un
  aviso con error se avisa y se sigue escuchando; si la conexión se corta, completa.
- **Venta a crédito**: dejar de escuchar cuando se cierra el diálogo del QR.
- **`onSaveConDetalle`**: ante un error de red avisa «No se pudo confirmar si se guardó…» solo si quien llama
  no avisó (la factura sigue mostrando solo su aviso).
- Tests de los dos.

## 3. Lo que no cambia
- Las dos pantallas de transferencia: ya dejan de escuchar al cerrar el diálogo.
- Qué emite `onSaveConDetalle` (`null`, o `{ error }` con la bandera).

## Decisiones de Franco (2026-10-07)
- Aprobado.

## Implementación: desvíos
- El «Buscando…» de `onCustomSub` (hoy nadie lo pide) se abre al suscribirse y no al llamar.
- Venta a crédito: cada QR corta su propia escucha (no la del campo compartido), por si se abre otro antes de
  que termine de cerrarse el anterior.
- No hubo auditoría del plan por agente: el relevamiento se hizo leyendo los tres consumidores y los dos
  publishers del central; la auditoría del diff confirmó las premisas.

## Prueba de runtime (2026-10-07)
Central propio en `:8085` (replicación apagada y verificada), desktop en `:4202`. Los avisos se dispararon con la
misma operación que usa el celular (`transferenciaQrEscaneado`, `ventaCreditoQrAuth`).

| Caso | Resultado |
|---|---|
| QR de transferencia (lista) abierto; aviso de otra transferencia | el diálogo sigue abierto y escuchando |
| Ídem; aviso de la misma transferencia en otra sucursal | sigue abierto |
| Ídem; aviso propio | el diálogo se cierra |
| Canal de venta a crédito (por el servicio): dos avisos seguidos | llegan los dos; no completa con el primero |
| Ídem; dejar de escuchar y otro aviso | no llega |
| Tests (Karma) | 10 de 10 |

Antes del cambio, el primer aviso ajeno cerraba la escucha y el propio ya no llegaba.

**No probado en runtime**: el diálogo de venta a crédito con QR en una venta real del PDV (confirmación tras un
aviso ajeno, y el escaneo tardío con el QR cerrado), el QR de transferencia desde la edición, y el aviso nuevo de
`onSaveConDetalle` emitiendo una factura con corte de red.

## Auditoría del diff (paso 8, 2026-10-07)

| Hallazgo | Sev. | Qué se hizo |
|---|---|---|
| Venta a crédito: el cierre de un QR viejo podía cortar la escucha de uno nuevo | baja | cada QR corta la suya |
| Doble confirmación de la venta a crédito con dos avisos que coincidan | — | no ocurre: deja de escuchar antes de confirmar |
| Doble cierre del diálogo de transferencia | — | inocuo |
| Canales del central globales, sin filtro y sin repetir avisos viejos | — | confirmado |
| Factura legal: su aviso sale en el momento, el genérico no duplica | — | confirmado |
| Tests: faltan el aviso vacío, el corte por tiempo y el modal con `cargando` | baja | anotado |
