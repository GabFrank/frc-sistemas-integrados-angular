# Plan — Crear usuarios desde el escritorio (issue #477)

Rama `fix/usuarios-crear-desde-personas` en **central** y **desktop**, las dos desde `origin/develop`
(central `223bfd2d`, desktop `47494c19`, 2026-10-14).

## Objetivo

Que un encargado con `EDITAR_USUARIOS` (o ADMIN) cree un usuario desde **Administración → Personas →
⋮ → «Crear usuario»** o desde **Administración → Usuarios → «Nuevo usuario»**. El diálogo trae la
persona cargada, pide la clave con **`123` precargado** para no tener que tipearla, permite cargar los
roles y guarda. Editar un usuario existente **no** le cambia la clave.

## Hallazgos del análisis (lo que la issue no dice)

| # | Hecho | Evidencia |
|---|---|---|
| H1 | El central pisa la clave con `"123"` en todo usuario nuevo, sin importar lo que mande el cliente | central `UsuarioService.save` (L175-185) |
| H2 | `saveUsuario` mapea el input entero con ModelMapper: un update sin `password` la guarda en **null** | central `UsuarioGraphQL.saveUsuario` (L71-86) |
| H3 | El central crea usuarios sin clave por dentro y depende del `"123"` de H1 | central `FuncionarioGraphQL` L207, `FuncionarioService` L113 |
| H4 | `persona_id` es **único** en `personas.usuario`: una persona con usuario no puede tener otro | `V0__initial_schema.sql:9518` `usuario_un_persona` |
| H5 | El diálogo ignora `data.personaId`, manda siempre `password='123'` y se cierra al guardar; los roles usan `selectedUsuario.id`, que es null hasta guardar, así que en un alta no se pueden cargar roles | desktop `adicionar-usuario-dialog.component.ts` L60-110 |
| H6 | El ítem «Crear usuario / Ir a usuario» de Personas abre el mismo diálogo con `{personaId}` también cuando la persona **ya tiene** usuario (`persona.isUsuario`) | `list-persona.component.html` L123-124 |
| H7 | Ningún ítem del menú dispara `list-persona`; el `case` existe | `side-mini-variant.component.ts` L745-766 y L1295 |
| H8 | Otros clientes de `saveUsuario` mandan clave: el wizard de funcionario (`'123'`), el reseteo explícito (`onInitPassword`, `'123'`) y el «cambiar contraseña» del mobile | desktop `funcionario-wizard` L188, `list-usuario` L176; mobile `cambiar-contrasenha-dialog` L69 |

## Fase 1 — central: la clave se respeta al crear y se conserva al editar

Archivos: `graphql/personas/input/UsuarioInput.java`, `resources/graphql/personas/usuario.graphqls`,
`graphql/personas/UsuarioGraphQL.java` (`saveUsuario`), `service/personas/UsuarioService.java`.

- **Campo nuevo y opcional `UsuarioInput.respetarPassword: Boolean`** (`.graphqls` y Java en el mismo
  commit). Solo lo manda el diálogo nuevo del desktop.
  - Sirve de traba de compatibilidad: un central **viejo** rechaza la mutation por campo desconocido,
    así que el desktop nuevo muestra el error en vez de guardar mal (auditoría A1/B2).
  - Un campo opcional nuevo no rompe a ningún cliente que no lo mande.
- **Alta** (`id == null`):
  - Con `respetarPassword = true` y una clave no vacía, se guarda la que vino.
  - En cualquier otro caso queda `"123"`, como hoy. Así no cambian el alta interna de funcionario
    (H3), el wizard ni `TokenController /new` (auditoría A2/B7).
- **Edición** (`id != null`):
  - Si la clave viene vacía (null o en blanco), se conserva la guardada (`repository.findById`),
    tenga o no el campo nuevo.
  - Esto cierra el NPE del login con clave null (`TokenController.generate` L69) sin importar qué
    cliente mande el update.
  - Si la clave viene, se usa: el reseteo y el cambio de clave del mobile siguen andando (H8).
- **De paso, en la edición**: `email` y `creadoEn`, que no vienen en el input y ModelMapper los
  pisaba a null en cada update (`UsuarioGraphQL.java:73`, auditoría B3), se copian de la fila
  guardada cuando llegan null.
  - `usuario` (quién lo creó) lo reescribe el `GenericCrudService` del desktop con el usuario actual.
    Queda como deuda anotada, no se toca.
- Solo se copian valores a la entidad nueva; la leída con `findById` no se muta (auditoría B4).
- Se mantiene el `toUpperCase()` de nickname y clave. No se toca el modelo de clave en texto plano:
  está fuera del alcance y no va en el PR (repo público).
- Sin migración.
- Filial: **N/A para filial** porque el desktop guarda usuarios contra el central (cliente
  `servidor`) y `personas.usuario` llega al filial por replicación. El `saveUsuario` del filial no se
  toca.

Tests (`src/test/.../service/personas/UsuarioServiceClaveTest.java`, mismo estilo que
`UsuarioServiceFiltroRolTest`, Mockito sobre el repositorio). Los marcados **[R]** fallan con el
código viejo:
1. alta sin clave, y alta con `"  "` → `"123"`;
2. alta con `abc` **sin** `respetarPassword` → `"123"` (no cambia `/new` ni el alta interna);
3. **[R]** alta con `abc` y `respetarPassword=true` → `"ABC"`;
4. **[R]** edición sin clave (null, `""` y `"  "`) → conserva la guardada;
5. edición con clave → la nueva en mayúsculas;
6. **[R]** edición sin `email`/`creadoEn` → conserva los guardados;
7. edición con un id inexistente (`findById` vacío) → no revienta y se comporta como hoy;
8. el `save` recibe la entidad nueva, no la leída (captor).
9. **[R]** en `UsuarioGraphQL.saveUsuario`, con el ModelMapper real: un input de edición sin clave
   no termina en una clave null.

Gate: `./mvnw -o test -Dtest=UsuarioService*Test` + build `./mvnw -o -DskipTests package`, leídos
del log.

## Fase 2 — desktop: menú Personas + diálogo de usuario

### 2.1 Menú (`side-mini-variant.component.ts`)
Agregar, después de «Usuarios»:
`{ name: 'Personas', icon: 'badge', action: 'list-persona', visibilityRoles: [ROLES.VER_PERSONAS] }`.
El `case "list-persona"` ya valida con `openTabIfAuthorized(ROLES.VER_PERSONAS, …)`.

### 2.2 Diálogo `adicionar-usuario-dialog`
- `AdicionarUsuarioDialogData` suma `personaId?: number`.
- Al abrir con `personaId` (y sin `usuario`):
  - Consultar `onGetUsuarioPorPersonaId`. Si la persona **ya tiene usuario** (H4/H6), se abre ese
    usuario en modo edición.
  - Si no tiene, se carga la persona con `onGetPersona` y queda fija en `selectedPersona`.
  - Las dos consultas se protegen con timeout + `catchError`, porque `onGetById` no emite en error.
- Al abrir sin nada (botón «Nuevo usuario»): se elige la persona con `BuscarPersonaDialogComponent`.
  Si la persona elegida ya tiene usuario, se avisa y se abre ese usuario en edición, para no chocar
  con la clave única.
- Se muestra la persona elegida (nombre y documento) arriba del formulario.
- Campo **Clave** (`passwordControl`):
  - Solo en el alta (`selectedUsuario.id == null`).
  - Precargado con `'123'` y `Validators.required`.
  - `type="password"`, con un botón de ojo para verla.
- `onSave()`:
  - Manda siempre `respetarPassword: true`: `UsuarioInput` del desktop suma el campo y `toInput()`
    lo copia.
  - Alta: `password = passwordControl.value`. Al guardar, el diálogo **no se cierra**: toma el `id`
    devuelto, pasa a modo vista y habilita la tabla de roles, para cargarlos ahí mismo (H5).
  - Edición: `password = null` (no se envía). Con la fase 1 el central conserva la clave.
  - Flag `guardando`: el botón queda deshabilitado mientras dura el guardado, para que un doble clic
    no dispare dos altas que choquen con `usuario_un_nickname` y `usuario_un_persona` (auditoría B5).
  - Si el central devuelve un error (nickname repetido, o un central viejo que no conoce
    `respetarPassword`), se rehabilita el botón y el error se ve por el snackbar del
    `GenericCrudService`. Se verifica en la prueba que el mensaje se entienda.
- Cerrar o cancelar después de un alta devuelve el usuario creado, no `null`, para que el llamador
  refresque la lista (auditoría B5).
- Alta sin persona elegida: el botón Guardar queda deshabilitado (flag calculado, no una función en
  el HTML).
- La tabla de roles y el botón «+» solo se muestran con `selectedUsuario.id != null`.
- El botón «+» de roles sigue gateado por **ADMIN**, como hoy (decidido, ver «Puntos abiertos»).

### 2.3 Lista de usuarios (`list-usuario`)
- Botón **«Nuevo usuario»** en la cabecera. Abre el diálogo sin datos y refresca la lista al cerrar
  con un resultado.
- El botón se ve con `puedeEditarUsuarios = mainService.tieneAlgunRol([ROLES.EDITAR_USUARIOS])`,
  calculado en `ngOnInit`. Ese método ya incluye el bypass de ADMIN.
- `onInitPassword` queda como está: es el reseteo explícito con confirmación, sigue en `'123'`.

### 2.4 Lista de personas (`list-persona`)
- `abrirUsuario` sigue pasando `{personaId}`; el diálogo resuelve si es alta o edición.
- El ítem del menú ⋮ se gatea con el mismo `puedeEditarUsuarios`.

Gate: `npm run check` (AOT) al final, leído del log. Como no hay Karma headless, no se agregan specs
ejecutables: la prueba es por pantalla.

## Datos nuevos

| Dato | Quién lo escribe | Quién lo lee |
|---|---|---|
| `UsuarioInput.password` en el **alta** (antes se descartaba) | `AdicionarUsuarioDialogComponent.onSave` | `UsuarioService.save` (central) → login (`TokenController`) |
| `AdicionarUsuarioDialogData.personaId` (ya lo mandaba `list-persona`) | `ListPersonaComponent.abrirUsuario` | `AdicionarUsuarioDialogComponent.ngOnInit` |

| `UsuarioInput.respetarPassword` (campo GraphQL nuevo, opcional) | `UsuarioInput.toInput` del desktop, desde `AdicionarUsuarioDialogComponent.onSave` | `UsuarioGraphQL.saveUsuario` → `UsuarioService` (central) |

No nacen columnas ni claves en la base.

## Auditoría del plan (paso 5) y qué se hizo

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| Un desktop nuevo contra un central viejo deja la clave en null y el login da NPE; el desktop no puede detectarlo y el deploy del central es manual | A1 / B2 (alto) | Traba `respetarPassword` + la edición conserva la clave aunque el campo no venga + gate «desplegado por instancia» |
| `TokenController /new` cambiaría de semántica (respetaría la clave del cuerpo) | A2 / B7 | El alta respeta la clave solo con `respetarPassword`; `/new` no cambia |
| ModelMapper pisa `email` y `creadoEn` a null en cada edición | B3 | Se conservan en la fase 1; `usuario` (quién lo creó) queda como deuda anotada |
| Doble clic, cancelar después del alta, error de nickname | B5 | Flag `guardando`, cerrar devuelve el creado, casos 9-10 |
| Faltan tests de regresión y del camino por ModelMapper | B6 | Tests marcados [R] + test 9 sobre `saveUsuario` |
| Faltan casos de mobile y de clave en blanco | A3 / A4 | Test 1 con `"  "`; prueba por API del input del mobile |
| Con EDITAR_USUARIOS sin VER_PERSONAS no se ve «Personas» | A (pregunta 4) | Va a «Puntos abiertos» |
| JPA, detached o managed | B4 | Sin riesgo si no se muta la leída; test 8 |

## Orden y compatibilidad (§3)

- **Central primero, y desplegado (no solo mergeado) en cada instancia antes de que el desktop nuevo
  llegue a ese canal.** El deploy del central es manual (`deploy-auto.yml` nunca corre), así que el
  merge no alcanza. Instancias:
  - alpha: mauro, puerto 8083;
  - beta / farmacia: 8082;
  - stable / bodega: 8081.
  La versión mínima del central va en la descripción del PR del desktop. El orden se repite en cada
  promoción alpha → beta → stable.
- **Si igual se cruzan**, el desktop nuevo contra un central viejo **no rompe nada**:
  `respetarPassword` hace fallar la mutation por campo desconocido y el diálogo muestra el error.
  Antes de esta traba, la clave quedaba null y el usuario no podía entrar (NPE en el login).
- Un desktop viejo contra el central nuevo sigue igual que hoy: manda `'123'` y la clave se resetea
  al editar. No rompe nada.
- Mobile y mobile-pwa: el cambio de contraseña manda la clave completa (no depende del null), así
  que con el central nuevo se comportan igual.
- Filial: `personas.usuario` es MAIN_TO_ALL (`V112:31`). Todos los llamadores del desktop usan
  `servidor=true`, así que no hace falta tocar el filial.

## Entorno de prueba (sin chocar con la otra sesión)

- Worktrees propios:
  - central: `franco-system-backend-servidor/.claude/worktrees/usuarios-crear`
  - desktop: `frontend/frc-desktop-fix-usuarios-crear`
- Central local en el **8084**, con perfil `dev` y un `application-user-dev.properties` propio en el
  worktree.
- Desktop con `ng serve -c web --port 4201`, apuntando al central 8084 (config en el `localStorage`
  del origen `:4201`).
- El filial no se levanta: el flujo no lo usa.
- Base `bodega@5551` compartida y sin migraciones. Se crea un usuario de prueba sobre una persona
  sin usuario y se lo da de baja (`activo=false`) al terminar.
- Los procesos se apagan por PID. Los de `/opt/` (8080, 8083) no se tocan.

## Casos de prueba por pantalla

1. Personas visible en el menú con VER_PERSONAS; oculta sin ese rol.
2. Persona sin usuario → ⋮ «Crear usuario» → persona cargada, clave `123` precargada → guardar →
   el diálogo queda abierto → agregar rol → cerrar. Login con ese usuario y `123`.
3. Lo mismo cambiando la clave a otra: el login entra con la nueva.
4. Persona con usuario → ⋮ «Ir a usuario» → abre ese usuario en edición, sin campo de clave.
5. Editar el nickname o `activo` de un usuario: la clave **no cambia** (verificar en la base).
6. Usuarios → «Nuevo usuario» → buscar persona → mismo flujo que el 2. Si se elige una persona con
   usuario, avisa y abre la edición.
7. Reseteo explícito (⋮ «Resetear contraseña») sigue dejando `123`.
8. Alta de funcionario por el wizard sigue creando el usuario con `123`.
9. Doble clic en Guardar → una sola alta. Nickname repetido → error legible, el diálogo sigue usable.
10. Crear y cancelar → la lista de Usuarios muestra el nuevo.
11. Editar un usuario: `creado_en` y `email` siguen iguales en la base.
12. Contra el central alpha viejo (:8083), sin el fix: editar falla con un error y la clave no
    cambia. Prueba la traba de compatibilidad, **solo lectura** sobre un usuario de prueba.
    Si no hay un usuario de prueba seguro en el alpha, queda sin verificar.
- Mobile cambiando la clave contra el central nuevo: no se prueba en esta máquina (no hay app
  conectada al central local). Se verifica por API con el mismo input que manda el mobile.

## Puntos abiertos

- **Un usuario con EDITAR_USUARIOS pero sin VER_PERSONAS** no ve «Personas». Igual puede crear desde
  Usuarios → «Nuevo usuario», si además tiene VER_USUARIOS para abrir esa lista.
- **Roles al crear (decidido por Franco, 2026-10-14):** el «+» de roles sigue siendo solo de
  **ADMIN**. Abrirlo a EDITAR_USUARIOS permitiría que ese rol se asigne ADMIN.

## Qué queda sin verificar

- Que el central exija rol para `saveUsuario` en el backend: fuera de alcance, se reporta en privado,
  no en el PR.
- Compatibilidad real desktop nuevo ↔ central viejo: no se prueba; se cubre con el orden de deploy.
