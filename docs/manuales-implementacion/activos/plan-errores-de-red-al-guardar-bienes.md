# Plan — errores de red al guardar un bien (issue #390, PR 11f-2b)

Pieza: **desktop**. Rama: `fix/activos-errores-de-red-al-guardar-bienes`, desde `origin/develop` **después del merge
de #418** (mismos cuatro formularios; usa `EstadoFormularioBien` y el cartel `app-bien-estado-carga` que agrega
#418). Usa `PROPAGAR_ERROR_DE_RED`, `esRechazoDelServidor`, `esTimeoutDeLink`. Relevamiento: el del bloque de
activos y la auditoría del plan 11f-2 (2026-10-05), que leyó los cuatro resolvers de guardado del central; los
cuatro servicios y servicios de diálogo releídos a mano (sobre la rama de #418). Todo va al **central**.

Alcance: el **guardado** de equipo, mueble, inmueble y vehículo. La carga quedó en #418; el panel de archivos va en
11f-2c.

## Regla (la de #391–#418)

Un guardado sin respuesta pudo haberse aplicado. En una edición (hay id) reintentar es inocuo. En un alta sin
unicidad en la base, reintentar **duplica**: no se reintenta a ciegas y nunca se afirma «no se guardó». Un aviso
por flujo.

## Qué pasa hoy [verificado]

Los cuatro `onGuardar` de servicio (`equipos.service`, `mueble.service`, `inmueble.service`, `vehiculo.service`; un
solo llamador cada uno: su servicio de diálogo) usan el `onSave` genérico **sin** `errorConf`:
- **Error de red**: el genérico se lo traga — no avisa, no emite, y cierra su modal «Guardando…». El formulario no
  se entera y el botón sigue activo.
- **Error del servidor**: el genérico avisa y hace `error(array)`; el `subscribe` del formulario no tiene `error:`
  → excepción sin capturar.
- No hay guarda contra el doble «Guardar» (solo el modal del genérico).
- **Alta**: el formulario recién carga el id del bien cuando vuelve la respuesta. Si no vuelve, el id queda vacío y
  el siguiente Guardar es **otra alta**. El central no tiene unicidad en equipo, mueble ni inmueble (ni
  identificador ni nombre); en vehículo sí (chapa).
- **El central no es atómico**: guarda el bien, después crea el ente y después sincroniza lo financiero, en
  transacciones separadas, y casi todos sus errores salen como «No se pudo guardar…» **aunque el bien ya esté
  guardado**. Por eso en un alta un rechazo del servidor tampoco garantiza que no se guardó.

## Cambio

### Servicios
Los cuatro `onGuardar` propagan el error de red (`PROPAGAR_ERROR_DE_RED`). Si el genérico emite datos junto con un
error (emite sin completar), el id que traiga se toma como guardado.

### Estado compartido (`EstadoFormularioBien`, de #418)
Gana `guardando` (sin doble Guardar) y `altaSinConfirmar`; los dos entran en `guardarBloqueado`. La clasificación
del error vive en una función del mismo archivo, para no repetirla cuatro veces:

| Caso | Qué hace |
|---|---|
| Edición (hay id), rechazo del servidor | nada más: el genérico ya avisó; se puede corregir y reintentar |
| Edición, sin respuesta | aviso «No se pudo confirmar el guardado: podés volver a intentar» (salvo en el corte del link o con respuesta vacía, que ya avisan) |
| Alta de **vehículo**, cualquier error | igual que una edición: la chapa única hace seguro el reintento |
| Alta de **equipo, mueble o inmueble**, cualquier error (rechazo o sin respuesta) | `altaSinConfirmar`: Guardar bloqueado y cartel fijo |
| …salvo el rechazo «El proveedor seleccionado no es válido» en mueble e inmueble | el central lo valida **antes** de guardar: se puede corregir y reintentar |

### Cartel y cierre
`app-bien-estado-carga` gana la variante «No se pudo confirmar si el bien se guardó. No vuelvas a cargarlo sin
revisar: cerrá y buscalo en la lista», con un botón **Cerrar**. Sin «verificar»: identificador y nombre no son
únicos y las búsquedas son por texto parcial.

Con un alta sin confirmar, **cerrar refresca la lista** (por el botón del cartel, por Cancelar o por la X): en
diálogo se cierra con `true` (quien lo abrió ya refresca con eso); en vehículo abierto en **pestaña** nadie
refresca, así que el servicio de diálogo llama al refresco de la lista antes de quitar la pestaña.

### Formularios (los cuatro, mismo cambio)
`onGuardar` marca `guardando`, gana `error:` (que delega en la función compartida) y libera `guardando` al terminar
por cualquier camino. Lo demás del flujo (primer guardado de un alta deja el diálogo abierto y recarga ente y
cuotas; el segundo cierra) no cambia.

Sin cambio: la carga (#418), el editor de cuotas (#417), el panel de archivos (11f-2c), las altas auxiliares de
tipo / marca / modelo / familia (11f-3), el pre-registro de vehículo (11f-3).

## Persistencia, migraciones, replicación, multi-repo

`N/A para desktop porque no toca GraphQL, esquema ni backend`. Para el issue de **central**: guardado del bien
atómico (bien + ente + financiero en una transacción) y mensajes que distingan «no se guardó» de «se guardó pero
falló lo financiero».

## Fases

| Fase | Commit |
|---|---|
| 1 | `fix(activos): avisar cuando no se confirma el guardado de un bien` (servicios, `guardando`, `error:`, edición y vehículo) |
| 2 | `fix(activos): no duplicar un bien cuando el alta queda sin respuesta` (alta sin confirmar, cartel, cierre refrescando) |

Tests: `N/A para desktop` [ev: ci.yml]. `npm run check` antes de **cada** push, encadenado con `&&`.

## Prueba de runtime

Central local `:8081` (worktree de pruebas, sin perfil, replicación apagada y verificada en *Negative matches*).
**No se guarda nada con el central congelado**: el «sin respuesta» y el rechazo se simulan reemplazando el guardado
por un error (no se envía nada). La base local solo tiene un vehículo; equipo, mueble e inmueble se prueban con el
formulario de alta (necesitan propietario y tipo: si la base local no tiene tipos, se crea uno con el central vivo).
1. Edición de vehículo sin respuesta → aviso, Guardar habilitado de nuevo; rechazo → sin aviso propio.
2. Alta de vehículo sin respuesta → igual que edición.
3. Alta de equipo (o mueble) sin respuesta y con rechazo → cartel fijo, Guardar bloqueado, un segundo Guardar no
   envía nada; Cerrar, Cancelar y la X cierran refrescando la lista.
4. Alta de mueble con el rechazo de proveedor inválido (simulado con el mensaje exacto) → se puede reintentar.
5. Doble clic en Guardar → un solo envío.
6. Alta normal y edición normal con el central vivo (un bien de prueba en la base local).

## Riesgos y qué queda sin verificar

- En un alta de equipo, mueble o inmueble, un error de validación legítimo del central también bloquea (hay que
  cerrar y volver a cargar). Es el lado seguro: no hay forma fiable de saber si el bien ya se guardó.
- La excepción del proveedor depende del texto exacto del mensaje del central: si cambia, cae en el caso general
  (bloquea), que es seguro.
- Depende de #418: si cambia en la revisión, este plan se ajusta.

## Ajustes por la auditoría del plan (mandan sobre lo de arriba)

### Clasificación del error (reemplaza la tabla de arriba)

«Alta» = lo que ve el servidor: `!form.getRawValue().id`, calculado **antes** de enviar (no `registroGuardado`,
que ya es verdadero en una edición y tras el primer guardado).

| Caso | Qué hace |
|---|---|
| Edición, rechazo del servidor | nada más (el genérico ya avisó); se corrige y se reintenta |
| Edición, sin respuesta | aviso «No se pudo confirmar el guardado: podés volver a intentar» (no en el corte del link ni con respuesta vacía, que ya avisan) |
| Alta de equipo, mueble o inmueble, **cualquier** error | `altaSinConfirmar` |
| Alta de vehículo, **rechazo** del servidor con chapa cargada | se corrige y se reintenta (lo más común es «Ya existe un vehículo con la chapa…») |
| Alta de vehículo, **sin respuesta** (red, corte, respuesta vacía), o rechazo con la chapa vacía | `altaSinConfirmar` |

- **Sin la excepción del proveedor inválido**: el texto real del central es «El proveedor seleccionado no es
  valido.» (sin tilde), con prefijo en equipo y sin prefijo en los otros; es frágil y el caso es rarísimo (el
  proveedor sale de un buscador). Se quita la fila y la prueba 4.
- **Vehículo no es «siempre seguro»**: la chapa única se valida en el servicio del central, **no hay restricción
  en la base**. Si el pedido se cortó por tiempo, el central puede seguir procesándolo y un reintento inmediato
  pasaría la validación → duplicado. Por eso «sin respuesta» en un alta de vehículo también bloquea. Y con la
  chapa en blanco (el formulario acepta espacios) no hay validación.
- Cuando el central guardó el vehículo pero falló después (ente o financiero), el reintento responde «chapa
  repetida»: no duplica, pero el vehículo queda a medias hasta editarlo. El aviso del rechazo de un alta de
  vehículo agrega: «si dice que la chapa ya existe, cerrá y buscá el vehículo en la lista».

### `guardando`
- Se libera en `next`, en `error` **y** al terminar: el genérico puede emitir datos junto con un error **sin
  completar**, y con solo «al terminar» quedaría prendido para siempre (el segundo Guardar de un alta, bloqueado).
- Solo entra en `guardarBloqueado`; no hace falta bloquear Cancelar (el modal «Guardando…» del genérico tapa el
  diálogo).
- Si llegan datos con id junto con un error, se toma como guardado y **no** se agrega aviso propio (el genérico ya
  mostró el error).

### Servicios
`onSave(gql, input, undefined, undefined, true, PROPAGAR_ERROR_DE_RED)` en los cuatro (el `errorConf` es el sexto
parámetro). Los cuatro ya refrescan su lista cuando hay respuesta.

### Cartel
- Va en un bloque propio de `app-bien-estado-carga`, **fuera** del contenedor que hoy exige `bien === 'ok'` (un
  alta tiene `bien === 'nuevo'`): entrada `altaSinConfirmar` y salida `cerrar`.
- El cartel está arriba del contenido (que tiene scroll) y Guardar abajo, fijo: si el usuario guardó con el
  formulario desplazado no lo vería. Al activarse `altaSinConfirmar` se muestra además el mismo texto como aviso
  largo. Es el único caso con cartel + aviso.

### Cierre refrescando
- Un solo punto: `onCancelar(dialogRef, refrescar)` de cada servicio de diálogo → cierra con `true` si
  `refrescar`. El botón Cerrar del cartel, Cancelar y la X llaman al mismo `onCancelar()` del formulario, que pasa
  `estado.altaSinConfirmar`. Los cuatro diálogos tienen `disableClose` (no se cierran con Esc ni clic afuera).
- Vehículo en pestaña (solo se abre así desde el pre-registro, siempre como alta): antes de quitar la pestaña se
  llama a `vehiculoService.refrescar()`.

### Otras precisiones
- Si después del primer guardado de un alta falla la recarga de ente y cuotas: el bien ya tiene id (es una
  edición, sin riesgo de duplicar); aplica lo de #418 (cartel con Reintentar si era «pagando»; aviso informativo si
  no).
- Riesgo conocido, sin cambio: un HTTP 400 / 401 / 403 llega como «sin respuesta» y en un alta bloquea (seguro).

### Prueba de runtime (reemplaza los casos 2 y 4)
2. Alta de vehículo: rechazo simulado → aviso con la pista de la chapa, se puede reintentar; sin respuesta →
   cartel + aviso, bloqueado; cerrar refresca la lista.
4. Datos + error simulados (emite sin completar) en el primer guardado de un alta → queda con id y el segundo
   Guardar funciona.

## Auditoría del plan (paso 5, 2026-10-05)

| Eje | Hallazgo | Sev. | Qué se hizo |
|---|---|---|---|
| B | `guardando` quedaría prendido si el genérico emite datos + error sin completar | alta | se libera en `next`, `error` y al terminar |
| A | El texto del proveedor estaba mal (sin tilde) y con prefijo distinto por bien | alta | se quita la excepción |
| A | Contradicción: vehículo nunca quedaba «sin confirmar» pero se planeaba refrescar su pestaña | alta | vehículo sin respuesta sí bloquea; el refresco de la pestaña tiene sentido |
| A | La chapa única no tiene restricción en la base: un reintento tras un corte puede duplicar | media | sin respuesta en alta de vehículo = sin confirmar |
| A | Qué cuenta como alta | media | `!form.getRawValue().id` antes de enviar |
| A | El cartel no se vería en un alta (`bien === 'nuevo'`) ni con el formulario desplazado | media | bloque propio + aviso largo |
| A | Cierre: un solo punto; `disableClose` en los cuatro; pestaña de vehículo | media | `onCancelar(dialogRef, refrescar)` |
| B | Datos + error: el genérico ya avisó | media | sin aviso propio |
| A | HTTP 400/401/403 bloquean un alta | media | riesgo conocido |
| A/B | «Qué pasa hoy» en los cuatro; primer y segundo guardado de un alta; central no atómico; un llamador por servicio; tamaño (~250–300 líneas) | — | verificado |

## Implementación: desvíos

- **Las dos fases quedaron en un commit**: la clasificación del error vive en una sola función compartida
  (`EstadoFormularioBien.alFallarElGuardado`), que usan los cuatro formularios.
- **Avisos de un alta sin confirmar** (auditoría del diff): en el corte por tiempo no hay aviso propio (ya avisa
  el link); tras un rechazo del servidor el aviso dice que el bien igual pudo haber quedado guardado; sin
  respuesta, el texto del cartel. El cartel queda fijo en los tres casos.
- El texto del cartel sale de la misma constante que el aviso.

## Prueba de runtime (2026-10-05)

Central local `:8081` sin perfil (replicación apagada; los dos schedulers en *Did not match*), `ng serve -c web`,
vivo. Los errores de guardado se simularon reemplazando el `onGuardar` del servicio por un error (no se envió
nada). Vehículo abierto en **diálogo**; las altas se probaron con ids inventados (la base local no tiene tipos ni
modelos para armar un bien nuevo válido).

| Caso | Resultado |
|---|---|
| Edición de vehículo sin respuesta | aviso «No se pudo confirmar el guardado…», Guardar habilitado |
| Edición con rechazo | sin aviso propio; se puede corregir |
| Doble Guardar (respuesta demorada) | un solo envío |
| Alta de vehículo con rechazo | aviso con la pista de la chapa; no bloquea |
| Alta de vehículo sin respuesta / con respuesta vacía | cartel + aviso, Guardar bloqueado; un segundo Guardar no envía |
| Alta de vehículo con rechazo y chapa en blanco | bloquea |
| Cerrar con el alta sin confirmar (botón del cartel y Cancelar) | cierra y refresca la lista una vez |
| Datos + error sin completar | el formulario queda con id y Guardar habilitado (no queda «guardando») |
| Alta de equipo con rechazo | cartel + aviso, bloqueado, un solo envío; cerrar refresca la lista |
| Edición real de vehículo (central vivo) | guarda, cierra, un solo «Guardado con éxito», cuotas iguales |

**Sin probar en pantalla**: mueble e inmueble (mismo código y mismo cambio que equipo); vehículo en pestaña (desde
el pre-registro); un alta real completa (primer guardado que deja abierto, segundo que cierra); la X del título con
un alta sin confirmar (va por el mismo `onCancelar()`); los textos de aviso ajustados tras la auditoría.

## Auditoría del diff (paso 8, 2026-10-05)

| Sev. | Hallazgo | Qué se hizo |
|---|---|---|
| media | Alta cortada por tiempo: aviso del link + aviso propio | sin aviso propio en el corte |
| media | Alta rechazada (equipo, mueble, inmueble): «Ups…» del genérico + «no se pudo confirmar…», que no aplicaba | aviso que explica que igual pudo haberse guardado |
| baja | Texto del cartel duplicado a mano; import de `finalize` en línea aparte | constante única; import unido |
| baja | Si la pestaña de vehículo se cierra con su propia X (del gestor de pestañas) con un alta sin confirmar, la lista no se refresca | anotado, sin cambio |
| — | Ningún camino manda una segunda alta tras un error; `altaSinConfirmar` no se desbloquea; `guardando` no queda trabado; camino feliz intacto; los tres cierres pasan por `onCancelar()`; los 4 formularios equivalentes | sin hallazgos |
