# Plan: mutations de fondo sin aviso de timeout (issue #528)

Rama `fix/generics-silenciar-timeout-mutation-fondo`, sale de `develop`. Sigue a la tanda 4b de #501 (#523), que dejó este caso aceptado en su fila 2.

## Problema

`setTokenFcm` (cada login y al abrir la campana) y `marcarComoLeida` (al abrir una notificación) van con `silentLoad`, pero si el central queda colgado hasta el timeout del link (60 s) aparece «el servidor no respondió…»: el link avisa salvo que el `context` traiga `silenciarAvisoTimeout: true` (`shared/services/timeout-link.ts`), y `GenericCrudService.onCustomMutation` solo pasa `timeoutMs`. Las lecturas ya lo pasan (`onGetById`, `onCustomQuery` vía `ContextoConsulta`).

## Fase única

| Dónde | Cambio |
|---|---|
| `generic-crud.service.ts` `onCustomMutation` | `opciones?: { timeoutMs?: number; silenciarAvisoTimeout?: boolean }`; el `context` del `mutate` suma `silenciarAvisoTimeout: true` solo si se pide (mismo patrón que `onGetById`) |
| `notificaciones-tablero.service.ts` `setTokenFcm` | pasa `{ silenciarAvisoTimeout: true }` |
| ídem `marcarComoLeida` | ídem |

Opcional y por defecto apagado: las otras ~170 llamadas no cambian. `marcarTodasComoLeidas` queda como está: la inicia el usuario y su componente ya avisa y refresca tras un corte.

## Datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| `opciones.silenciarAvisoTimeout` de `onCustomMutation` | `NotificacionesTableroService.setTokenFcm` / `marcarComoLeida` | `onCustomMutation` → `context` → `crearTimeoutLink` |

## Tests

- `generic-crud.on-custom-mutation.spec.ts`: el `context` del `mutate` lleva `silenciarAvisoTimeout: true` solo cuando se pide; sin opciones no aparece (comportamiento por defecto intacto). Revertir el cambio del genérico y ver fallar el caso nuevo.
- Gates: `npm run check` y `npm run verificar:imports`.

## Prueba de runtime

Central propio con `replication.sync/refresh` apagados, desktop web, usuario `MR`. Interceptor que cuelga `actualizarTokenFcm` y `marcarNotificacionLeida` hasta el timeout de 60 s: sin aviso del link. Control: colgar `marcarTodasNotificacionesLeidas` (sin la opción) sigue mostrando el aviso del link. Éxito normal de las dos llamadas: sin spinner y la notificación queda leída.

### Resultado (2026-10-17)

Central de `develop` en el 8081 (base `bodega` local, perfil `dev`, `replication.sync/refresh` apagados), desktop compilado `web-production` y servido en `127.0.0.1:4201` en modo solo central, usuario `MR`. Un parche de `XMLHttpRequest.send` dejaba sin enviar las mutations elegidas, así que las cortó el timeout de 60 s del link. Tres notificaciones de MR y un `pushToken` de prueba sembrados y restaurados al final, igual que el token de la sesión que tocó `actualizarTokenFcm`.

| Llamada | Colgada hasta el timeout | Éxito real |
|---|---|---|
| `setTokenFcm` (abrir la campana) | sin aviso a los 81 s, sin spinner | sin spinner; el token queda en la sesión de MR |
| `marcarComoLeida` (botón de la tarjeta) | sin aviso a los 80 s, sin spinner; la tarjeta queda sin leer | sin spinner; la tarjeta queda leída y el conteo baja |
| control: «Marcar todas» (sin la opción) | «El servidor no respondió a tiempo: la operación pudo haberse aplicado…» a los 60 s | |

## Auditoría del plan

- **Eje B — límite aceptado:** si el central aplicó `marcarNotificacionLeida` y el link corta igual, la tarjeta queda sin leer hasta el próximo refresco, ahora sin aviso. Se acepta: es idempotente (reabrirla reintenta), no toca dinero ni datos, y el aviso del link («pudo haberse aplicado») no le daba al usuario nada que hacer. Resincronizar el conteo en el `error` se descarta: con el central colgado, esa lectura también se cuelga. El error con `esTimeout` sigue llegando al llamador igual; `isLoading` y el diálogo no cambian.

- **Eje A:** la firma es compatible (los únicos llamadores con 5º argumento, `gps.service.ts`, pasan solo `{ timeoutMs }`); `onSaveCustom` arma su propio `context` y no pasa por `onCustomMutation`; el único lector del campo es `crearTimeoutLink`. Reserva aplicada: el spec afirma la **ausencia** de la clave sin la opción, no solo que sea falsa.

## Sin verificar

Otras mutations silenciosas de fondo que pudieran merecer la opción: en `develop` solo estas dos van con `silentLoad = true`.

## Persistencia, migraciones, replicación, multi-repo

N/A para desktop porque solo cambia el `context` de Apollo del lado cliente; no toca backend ni esquema.
