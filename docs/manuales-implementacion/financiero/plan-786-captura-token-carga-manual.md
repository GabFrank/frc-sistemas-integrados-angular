# Plan #786 — la carga manual tras una foto sin campos conserva el token de la captura

Issue: GabFrank/frc-sistemas-integrados-angular#786. Rama `fix/venta-tarjeta-captura-token-carga-manual`
desde `develop` (a5836b19). Relacionado: filial#150 / PR filial#276 (la purga ahora sí alcanza la
carpeta de fotos).

## Problema

`RegistrarVentaTarjetaDialogComponent.confirmarLectura()` (línea 687): cuando el OCR lee la foto
pero el patrón no separa ningún campo, limpia `capturaUrl` **y** `capturaToken`, y le dice al
cajero «cargalo a mano». `onCargarAMano()` (línea 532) manda `capturaToken: this.capturaToken` —ya
`null`— con un comentario que promete lo contrario: «la imagen igual queda atada a la venta».
`completar()` del filial solo copia la ruta de la foto a `venta_tarjeta.imagen_url` si llega el
token (`VentaTarjetaService.java:146`), así que la foto del cupón de un cobro real queda huérfana y
la purga la borraría.

El `null` entró en `ff80887a` como limpieza junto con `capturaUrl`, sin razón propia.

## Alcance verificado

| puerta | ¿pasa por el defecto? |
|---|---|
| Utilitarios (F1) → Conciliación de cupones → completar (`ventas-tarjeta-caja-dialog:643`) | sí, abre este diálogo |
| Lista general → completar pendiente (`list-venta-tarjeta:321`) | sí, abre este diálogo |
| Pago del PDV (`pago-touch`) / escaneo | abren este diálogo para el registro; `escanear-cupon-dialog` tiene su propia carga manual y **ya conserva el token** (comentario de la purga incluido) |

Un solo cambio, en el componente compartido, cubre las cuatro puertas.

## Fase única — commit `fix(venta-tarjeta): ...`

1. Sacar `this.capturaToken = null;` de `confirmarLectura()` (rama `!hayAlgo`), con comentario del
   porqué (#786, purga). `capturaUrl` sí se sigue limpiando: el QR de esa captura ya no escucha.
2. Nada más: `capturaToken` es privado, solo lo leen las dos aperturas de
   `CargaManualCuponDialogComponent`, y una foto nueva (`onCapturar`) lo reemplaza por el token
   nuevo — conservarlo no puede atar una foto vieja a una captura nueva.

## Tabla de datos nuevos

N/A: ningún campo nuevo. `capturaToken` ya tenía escritor (`onCapturar`) y lector (`completar` vía
`carga-manual-cupon-dialog`); el fix deja de borrar el valor entre los dos.

## Multi-repo / migraciones / replicación

N/A para central y filial: `completarVentaTarjeta(input.capturaToken)` ya existe en el filial y ya
copia la ruta. Sin GraphQL nuevo, sin migración. `venta_tarjeta.imagen_url` viaja al central por la
replicación BRANCH_TO_MAIN existente, igual que en el camino OCR.

## Tests y prueba de runtime

- Gate: `npm run check` (AOT). Desktop sin batería en CI (§1 paso 9: N/A).
- Por pantalla, desktop servido como web (`ng serve -c web`) contra central 8081 y filial 8082
  locales (sucursal 24, SIFEN apagado), usuario MR con caja abierta:
  1. Por SQL (y restaurar al final): `configuracion_venta_tarjeta.habilitado = true` (sin eso el
     filial no carga el motor OCR), un `formato_terminal_pos` tipo `MAQUINA` con un patrón que no
     matchee nada, asignado a la terminal de un `venta_tarjeta` PENDIENTE de la caja abierta.
  2. Utilitarios (F1) → Conciliación de cupones → completar ese pendiente → «Subir una imagen»
     desde la PC → el diálogo muestra «no se pudo separar ningún campo».
  3. «Cargar a mano» → completar.
  4. Esperado con el fix: `venta_tarjeta.imagen_url` = `captura_cupon.imagen_url` de esa captura.
     Con `develop`: `imagen_url` queda NULL (reproducir antes, mismo flujo). Evidencia:
     `select v.id, v.estado, v.origen, v.imagen_url, c.imagen_url from financiero.venta_tarjeta v,
     financiero.captura_cupon c where v.id = <id> and c.token = <token>` en las dos corridas.
     La foto del teléfono y «Subir una imagen» usan el mismo token y el mismo POST: se prueba la
     segunda por pantalla.
  5. Regresión: el camino OCR con campos (patrón que sí matchea) sigue atando la foto.
- Restaurar desde una foto previa (`row_to_json`) y comparar con diff: configuración, terminal,
  la fila de `venta_tarjeta` (estado y campos completados), borrar el formato, las capturas y los
  archivos de foto en disco.

## Resultados (2026-11-20)

Por pantalla, desktop `ng serve -c web` en `127.0.0.1:4200` contra central 8081 (`develop`, perfil
dev, sin migraciones pendientes) y filial 8082 (`develop`, OCR cargado), MR en SUC. KM2 (24), PDV 25,
caja 1185. Formato de prueba 900786 (`MAQUINA`) en la terminal 2; venta 1086 (7.500 Gs).
F1 → Conciliación de cupones → completar 1086 → «Elegir una imagen de esta PC»:

| corrida | qué mostró | `venta_tarjeta.imagen_url` |
|---|---|---|
| fix, patrón que no matchea | «no se pudo separar ningún campo» → Cargar a mano → 786001 | `cupones/2026/11/4.jpg` = captura 4 (MANUAL) |
| `develop` (línea restituida), mismo flujo | igual → 786002 | **NULL**, con la captura 5 en disco — el bug |
| fix, patrón que matchea (regresión OCR) | «Confirmá los datos del cupón» → 786003 | `cupones/2026/11/6.jpg` = captura 6 (OCR) |

- `npm run check`: exit 0, `Build at:` sin errores.
- Auditoría del diff (paso 8): Fijo 1, 2 y 3 N/A (no toca menú/roles/resolver, esquema ni
  operaciones GraphQL; el input ya llevaba `capturaToken`); condicionales no disparados.

## Despliegue

Solo desktop. Llega por auto-update; el filial de todos los canales ya acepta `capturaToken`.

## Sin verificar

- Queda atada la foto de la **última captura** del diálogo (`onCapturar` reemplaza el token; dentro
  de una misma captura, cada subida pisa `imagen_url`). Las capturas anteriores siguen huérfanas:
  son intentos fallidos del mismo cupón, no la evidencia elegida.
- (Auditoría eje B) Una captura en `ERROR` (el OCR falló) **ya** conservaba el token antes de este
  fix (`escucharCaptura` no lo limpia) y «cargar a mano» ata esa foto. Es el diseño del filial: «La
  imagen se guarda igual, porque es la evidencia y permite completar a mano después»
  (`CapturaCuponService`). No se cambia. El filial no valida caja ni vencimiento del token en
  `completar()`; el desktop no lo expone (el token nace y muere en la instancia del diálogo).
- (Auditorías A y B) Si un `onCrear` posterior falla, el token sigue siendo el de la captura
  anterior (`onCapturar` solo reasigna en éxito) y «cargar a mano» ata esa foto: es otra foto del
  mismo cupón de la misma venta, efecto acotado y aceptado.
- (Auditoría A) Contrato: `CompletarVentaTarjetaInput.capturaToken` existe en el filial de
  `develop`, `release/beta` y `master`; el desktop ya lo mandaba por el camino OCR. El central no
  lee `imagen_url` (solo columna e input).
