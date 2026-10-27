# Plan — «Transferir caja» con la sesión del dueño (desktop)

Issue: #635. Rama: `fix/caja-transferir-con-sesion-del-duenio` (desde `develop`). Pieza: **desktop**.
Relacionado: GabFrank/franco-system-backend-filial#198.

## Hoy

`TransferirCajaDialogComponent.onConfirm()` llama `loginService.login(destino, clave)`, que guarda el
token y el usuario del destino, y recién después `onTransferirCaja(cajaId, destinoId)`. La mutation
llega al filial con la sesión del destino. Si la transferencia falla, el PDV queda logueado como el
destino con la caja sin transferir. Un error de red se muestra como «Usuario o contraseña incorrectos».

## Después

1. **Validar** usuario y clave del destino con `POST /login` al mismo servidor que usa `login()`
   (`isLocal` → filial, si no → central), **sin tocar la sesión**: no guarda token, no toca
   `mainService`, no llama `autenticarEnCentral`. El `/login` del filial no escribe nada (verificado),
   así que llamarlo dos veces no duplica efectos.
2. **Transferir** con la sesión actual (el dueño).
3. **Si se transfirió**, pasar la sesión al destino con `loginService.login(...)`, como hoy, y cerrar
   el diálogo y la pestaña.
4. **Si el login final falla** (la caja ya es del destino): cerrar diálogo y pestaña y hacer
   `mainService.logout()` con el aviso «La caja se transfirió a X; iniciá sesión con ese usuario». No
   quedarse con el dueño en memoria y sin token (`noSeCargoElUsuario` borra el token).
5. **Si la transferencia es rechazada**: la sesión sigue siendo la del dueño; el genérico muestra el
   motivo; el botón se rehabilita.
6. **Si la transferencia queda en duda** (timeout del link): no hacer el login final; dejar el aviso
   actual «revisá antes de repetir» y rehabilitar el botón (si se transfirió, repetir lo rechaza el
   filial: «el usuario destino ya tiene una caja abierta»).

## Cambios

- `LoginService.verificarCredenciales(nickname, password): Observable<number>`: emite el id del
  usuario o falla con mensaje: credenciales (o el `aviso` del filial, p. ej. usuario inactivo),
  respuesta sin `usuarioId`, o servidor sin respuesta (timeout propio, como `autenticarEnCentral`).
  Distingue credenciales de red.
- `TransferirCajaDialogComponent`: el orden de arriba; bandera `enCurso` que cubre validar +
  transferir + login final, chequeada al principio de `onConfirm()` (cubre Enter, que hoy dispara
  `onConfirm` por `keyup.enter` aunque el botón esté deshabilitado) y que deshabilita el botón.
- Spec Karma acotado del diálogo con `LoginService` y `CajaService` stubbeados (Karma con tsconfig
  acotado a ese spec: hay specs rotos en el repo): validación falla → no transfiere; transfiere →
  login final; rechazo → sin login; doble `onConfirm` → una sola transferencia; login final falla →
  logout.

Sin cambios de GraphQL ni de backend.

## Compatibilidad

| Desktop | Filial | Resultado |
|---|---|---|
| nuevo | sin #198 | transfiere (el filial no controla) |
| nuevo | con #198 | transfiere (pasa como dueño) |
| viejo | con #198 | transfiere (el filial acepta al destino) |
| nuevo | filial que solo acepta dueño o rol (*) | transfiere |
| viejo | filial que solo acepta dueño o rol (*) | **no transfiere** |

(*) Inferido: esa versión del filial todavía no existe (es quitar el caso «destino» de #198).

El filial deja de aceptar al destino recién cuando no queden desktops viejos. Hoy no hay forma
automática de saberlo (sin versión mínima ni telemetría): esa fase necesita un control (versión del
desktop en el inicio de sesión o una lista de PCs verificadas) que se define en su propio plan. Una
vez desplegada esa fase, revertir este desktop rompe la transferencia.

Con `isLocal=false` (web) la mutation no existe en el central: transferir no funciona ahí, hoy
tampoco. Sin cambio.

## Pruebas

- `npm run check` (AOT), leído del log; el spec Karma del diálogo.
- Por pantalla, desktop servido en el browser contra el filial local, dos cajeros solo con
  `VENTA TOUCH`:
  1. con el filial de #198: transferir → se transfiere, la sesión pasa al destino, el destino cierra;
  2. con una copia local del filial **sin** el caso «destino»: el desktop nuevo transfiere; el de
     `develop` no (confirma el orden de despliegue);
  3. clave incorrecta, usuario inactivo y servidor caído → mensaje distinto, la sesión y la caja no
     cambian (`token` en `localStorage` igual antes y después);
  4. transferencia rechazada (destino con caja abierta) → sesión del dueño intacta;
  5. Enter repetido / doble clic → una sola transferencia;
  6. login final que falla con la caja ya transferida → logout con aviso;
  7. transferencia en duda (respuesta demorada, parche de XHR) → sin login, aviso, botón activo.

## Despliegue

`develop` → alpha; después beta y stable. El desktop se actualiza con consentimiento: puede haber
versiones viejas durante semanas, de ahí el orden de la tabla.

## Auditoría del plan (paso 5)

- Eje A: servidor de validación igual al de `login()`; `/login` del filial sin efectos; único
  llamador; tabla correcta (filas 4-5 inferidas). Agregado: logout si falla el login final; cómo se
  sabrá que no quedan desktops viejos.
- Eje B: agregado `enCurso` (Enter), timeout y `usuarioId` ausente en la validación, mensaje de red,
  caso «transferencia en duda», rollback irreversible tras la fase del filial, spec Karma y casos de
  error en las pruebas.

## Auditoría del diff (paso 8)

- `login()` no se cancelaba al desuscribirse: con el timeout del diálogo, un login tardío podía dejar
  armada la sesión del destino después del logout. Ahora devuelve teardown (POST, carga del usuario y
  autenticación en el central) y el diálogo espera hasta 45 s (más que el peor caso normal, ~20,5 s).
- Se cierra la sesión activa del dueño (`cerrarSesionActiva`) antes del login del destino, con su
  token todavía vigente. Antes quedaba abierta, también con el flujo viejo.
- Con `isLocal=false` la mutation igual va al filial (`servidor=false`); sin cambio respecto de hoy.
- Queda: `sucursalActual` no se limpia en el logout del camino de error (el próximo login la pisa).

## Resultado de las pruebas (2026-10-27)

- Karma (`transferir-caja-dialog.component.spec.ts`): 12 tests; 6 del diálogo fallan con el código
  anterior. `npm run check` sin errores.
- Por pantalla, desktop servido en el browser contra un filial que **solo acepta dueño o rol**, con
  dos cajeros solo `VENTA TOUCH`:
  - clave incorrecta con dos Enter seguidos → una sola validación, la sesión no cambia;
  - transferir → «Caja transferida correctamente», la caja pasa al destino, la sesión también; la
    sesión del dueño queda cerrada en el servidor;
  - el diálogo de `develop` contra el mismo filial → «No autorizado» y la caja no cambia (confirma el
    orden de despliegue; además deja logueado al destino, el error que corrige este cambio);
  - carga del usuario destino cortada → la caja se transfiere, aviso «iniciá sesión con ese usuario»,
    logout y diálogo de login;
  - respuesta de la transferencia cortada → sin login final, aviso «revisá antes de repetir», botón
    activo y sesión del dueño.
