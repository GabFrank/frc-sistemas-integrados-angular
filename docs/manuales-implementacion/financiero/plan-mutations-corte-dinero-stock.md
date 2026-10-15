# Plan: aviso tras un corte en las escrituras de dinero y stock (issue #501, tanda 1)

Rama `fix/mutations-corte-dinero-stock`, sale de `develop` (con #503). Primera tanda de #501.

## Alcance (lo decidió Franco el 2026-10-15)

Llamadas de dinero y stock:

- gastos;
- devolución;
- transferencia;
- venta a crédito y clientes;
- cancelar un retiro;
- conteo;
- finalizar un inventario.

Entran también las del mismo módulo que la auditoría del plan encontró fuera del inventario de la issue: reversas y retiro de devoluciones, guardar conteo y verificar transporte.

Las demás quedan para las próximas tandas: PDV, replicación, el resto de bajo riesgo y los pendientes sueltos.

## Regla (la de #488)

`onCustomMutation`:

- **Rechazo:** el genérico ya muestra el motivo y en el central no se aplicó nada.
- **Corte:** no avisa nadie. La pantalla suma `avisoTrasMutacion(error, '<qué>')`, que es null en el timeout del link.

Qué hacer tras el corte depende de lo que pase si se reintenta. Eso lo dice el central (revisado en `develop`, en central y filial):

| Reintento | Qué hacer tras el corte |
|---|---|
| El central lo rechaza o queda igual | aviso; la lista se recarga a los 5 s (`RECARGA_TRAS_CORTE_MS`) |
| Duplica | aviso y no se deja repetir desde la misma pantalla sin recargar |

Lo que decide es `erroresDeRechazo(err)`, no si `avisoTrasMutacion` devolvió null. Ese null también sale en el timeout del link: el link ya avisó, pero la operación pudo aplicarse igual, así que el bloqueo y la recarga van en todo lo que no sea rechazo (ajuste de la auditoría del diff).

Las recargas diferidas usan `timer(RECARGA_TRAS_CORTE_MS).pipe(untilDestroyed(this))`, salvo donde ya hay una con guarda (inventario).

## Cambios

### Gastos

| # | Dónde | Reintento en el central | Cambio |
|---|---|---|---|
| 1 | `autorizar-gasto-dialog` `registrarDevolucion` | resta otra vez si el saldo era parcial | aviso; montos a 0 y botón bloqueado (`devolucionSinConfirmar`) con «cerrá el diálogo: la lista se actualiza» |
| 2 | ídem `autorizar` / `rechazar` | queda igual (re-sella) | aviso; el diálogo queda |
| 3 | ídem `finalizar` (completar) | puede repetir el descuento de la cuota o el alta del activo | aviso y Finalizar bloqueado (`finalizarSinConfirmar`) |
| 1-3b | ídem, al cerrar | — | tras una escritura sin respuesta, o tras una devolución registrada, `cancelar()` cierra con `{ recargar: true }`. `list-pre-gastos.autorizarGasto` recarga en ese caso y quita la selección, que tiene la copia vieja. Hoy reabrir reusa el objeto viejo de la lista. `markForCheck` en cada rama, porque el diálogo es OnPush |
| 4 | `list-pre-gastos` `onEnviarATesoreria` | **crea otra solicitud de pago** | aviso. El id queda en `enviosSinConfirmar` (mapa id → true que lee el template) y el botón se oculta para ese pre-gasto aunque se vuelva a elegir la fila vieja. Se quita la selección y la lista se recarga a los 5 s. «Actualizar» limpia el mapa |
| 5 | ídem `onImprimirSolicitud` | solo genera el PDF | en un corte, «No se pudo generar la solicitud para imprimir: revisá la conexión y volvé a intentar.»; en el timeout del link, nada |
| 6 | `list-gastos` `onCancelarGasto` | manda el estado final; queda igual | en un rechazo, recarga inmediata (como hoy); en un corte, aviso y recarga a los 5 s |
| 7 | `list-retiro` `onCancelarRetiro` | ídem | ídem |

### Devolución

| # | Dónde | Reintento | Cambio |
|---|---|---|---|
| 8 | `edit-devolucion` avanzar / acreditar / cancelar | lo rechaza (transición inválida o terminal) | aviso y `cargarDatos` a los 5 s |
| 8b | ídem `onRevertir` | **revierte otro estado más** | aviso y `cargarDatos` a los 5 s. El botón queda deshabilitado (`procesando`) hasta que recarga |
| 8c | ídem `onColectar` | lo rechaza (ya no está SEPARADO) | hoy un corte dice «No se pudo colectar» y un rechazo da doble aviso. Cambia a: rechazo, sin aviso propio; corte, aviso y `cargarDatos` a los 5 s |
| 8d | `historial-colectas` y `historial-retiros`: revertir operación, línea y nota de crédito | revertir otra vez puede deshacer de más | aviso y `cargar()` a los 5 s, con `procesando` hasta que recarga |
| 8e | `retiro-proveedor` `onMarcarRetiro` | el retiro en bloque rechaza lo ya retirado, una por una | hoy un rechazo da doble aviso («Error al marcar…») y un corte miente. Cambia a: rechazo, sin aviso propio; corte, aviso. Los dos recargan el consolidado (el corte a los 5 s) |
| 8f | `acreditar-retiro-dialog` | registra una nota de crédito | tras un corte, aviso y cierre con `true` para que el historial recargue |

### Transferencia

| # | Dónde | Reintento | Cambio |
|---|---|---|---|
| 9 | `edit-transferencia` `onAvanzarEtapa` | la misma etapa se re-ejecuta sin mover stock otra vez | aviso y `cargarDatos` a los 5 s |
| 10 | ídem `onDesconfirm` | idempotente | aviso |
| 10b | `verificar-transporte-dialog` (verificar y continuar sin chofer) | ídem 9 | hoy cierra con `true` sin avisar. Suma el aviso antes de cerrar |

### Crédito y clientes

| # | Dónde | Reintento | Cambio |
|---|---|---|---|
| 11 | `list-venta-credito` «Finalizar» del menú | queda igual (pisa `fechaCobro`) | **hoy el botón no hace nada**: el Observable nunca se suscribe (así desde 2023). `onFinalizarDesdeMenu` lo suscribe, con la confirmación y `verificarEstados`. En un corte dentro de `onFinalizar` (si viene del menú): aviso y recarga a los 5 s. La selección múltiple ya avisaba |
| 12 | `list-clientes` cobro masivo | queda igual | aviso y `onFiltrar(true)` a los 5 s |

### Conteo

| # | Dónde | Reintento | Cambio |
|---|---|---|---|
| 13 | `adicionar-conteo-dialog` `editarConteo` | el filial lo rechaza (`conteoAnteriorId` ya no es el vigente) | en un corte: aviso con «cerrá y volvé a abrir la caja», sale de la edición y no ofrece «Editar montos» hasta reabrir (`edicionSinConfirmar`). El diálogo no relee el conteo del servidor (`cargarDatos` repinta el de memoria): lo vio la prueba de runtime. Un rechazo sigue igual: si el proxy del central no tuvo respuesta del filial, el mensaje ya dice «vuelva a abrir la caja» |
| 13b | ídem `guardarConteo` | devuelve el conteo que ya tenía la caja | aviso; hoy el error no se captura |

### Inventario

| # | Dónde | Reintento | Cambio |
|---|---|---|---|
| 14 | `edit-inventario` `finalizarInventario` | queda igual (devuelve null), salvo si el primero sigue corriendo | aviso, Finalizar bloqueado (`finalizarSinConfirmar`) y `recargarInventarioTrasCorte`. Si la recarga lo trae concluido, el botón ya no aparece. Si sigue abierto, el central puede estar todavía aplicando: queda bloqueado hasta reabrir la pestaña |

Quedan fuera:

- `onDeleteTransferenciaItem`: va por `onDelete`, que ya avisa el corte y emite null.
- `onCancelarInventario` / `onReabrirInventario`: ninguna pantalla los llama.

## Fuera de alcance

Hallazgos del central al revisar los reintentos: faltan guardas de estado en las transiciones de pre-gasto y hay reintentos que duplican. Se los paso por privado a Franco y él decide si van a una issue (repo público).

## Tests

No hay helper nuevo. Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Central local de `develop` (8084), desktop `ng serve -c web` (4201), con un interceptor de XHR que corta la mutation (puerto cerrado) o la rechaza (campo inexistente):

- puntos 4, 6, 11 y 12 por la pantalla;
- 1 a 3 si hay un pre-gasto en trámite en la base local;
- 8, 9 y 14 si hay datos;
- 7 y 13 necesitan una caja en un filial y se cubren con la lectura del código.

## Persistencia, migraciones, replicación, multi-repo

N/A: solo cambian ramas de error del desktop. No toca operaciones GraphQL, backends ni auto-update.
