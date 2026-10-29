# Plan: sugerir otro nombre de usuario cuando el elegido ya existe

Rama: `feature/usuarios-sugerir-nickname` (desktop, desde `develop` en `b677f18a`).

## Qué resuelve

Al crear un usuario con un nombre que ya existe (`MAURO RIVAS`), hoy el desktop avisa
«Ya existe un usuario MAURO RIVAS. Elegí otro nombre» y nada más. El encargado tiene que inventar
otro. Con este cambio, el diálogo muestra alternativas libres armadas con el nombre completo de la
persona (`persona.nombre`): con `MAURO ROLANDO RIVAS FERNANDEZ` propone `MAURO FERNANDEZ`,
`ROLANDO RIVAS`, `ROLANDO FERNANDEZ`. Un clic en una la pone en el campo.

## Datos reales que guían la regla (base local `bodega`, 29/10)

- 472 de 501 nicknames tienen la forma «un nombre + un apellido» sacados de `persona.nombre`:
  `RICHARD ALEXIS ROJAS BAEZ` → `RICHARD ROJAS`, `CARLOS DE JESUS VERON MARIN` → `CARLOS VERON`.
- `persona.nombre` no separa nombres de apellidos. Regla: sin partículas (`DE`, `DEL`, `LA`,
  `LAS`, `LOS`, `DA`, `DOS`, `Y`), la primera mitad son nombres y la segunda apellidos (con número
  impar, el del medio cuenta como nombre y como apellido). Candidatos = cada nombre × cada
  apellido, en ese orden, sin el que ya se escribió.
  - 4 palabras: `MAURO ROLANDO RIVAS FERNANDEZ` → MAURO RIVAS, MAURO FERNANDEZ, ROLANDO RIVAS,
    ROLANDO FERNANDEZ.
  - 3: `CLAUDIO RAFAEL ROMERO` → CLAUDIO ROMERO, RAFAEL ROMERO (+ CLAUDIO RAFAEL).
  - 2: `RONALDO COLLANTE` → solo RONALDO COLLANTE.
- Sin sufijos numéricos (`MAURO RIVAS 2`): decidido por Franco al aprobar (29/10). Si ninguna
  combinación queda libre (nombre de 1 o 2 palabras ya tomado), solo sale el aviso de siempre.
- Tildes afuera, Ñ adentro: de 18 usuarios con tilde en `persona.nombre`, ninguno la tiene en el
  nickname (`NÉSTOR IVAN AYALA DAVALOS` → `NESTOR AYALA`); la Ñ sí se conserva (8 nicknames).
- Tope: 6 candidatos por consulta (los primeros en el orden de arriba).
- La unicidad la sigue garantizando la base (`usuario_un_nickname`); esto es solo ayuda.

## Decisión: solo desktop, sin cambios en el central

Se reusa la query existente `verificarUsuario(texto)` (central, `existsByNicknameIgnoreCase`), una
por candidato (≤ 6). Sin query nueva no hay orden de despliegue ni incompatibilidad entre un
desktop nuevo y un central viejo. Costo: varias consultas chicas en vez de una; aceptable para un
alta de usuario.

## Fases

### Fase 1 — regla de candidatos + sugerencias en «Nuevo usuario»

- `src/app/commons/core/utils/nicknameUtils.ts`: `candidatosNickname(nombre, excluir)` → `string[]`
  (pura). Spec `nicknameUtils.spec.ts` con los casos de arriba (2, 3, 4, 5 palabras, partículas,
  espacios dobles, nombre vacío, exclusión sin distinguir mayúsculas).
- `UsuarioService.onSugerirNicknames(nombre, excluir)`: verifica los candidatos en paralelo
  (`forkJoin`) y devuelve hasta 4 libres. Cada consulta va con `errorConf` silencioso **y**
  `propagate: true` (sin `propagate`, `onGetByTexto` con `errorConf` no emite ni falla y el
  `forkJoin` quedaría colgado), más `timeout(15000)` + `catchError(() => of(true))`: lo que no se
  pudo verificar cuenta como tomado y no se sugiere. Sin avisos propios: el aviso de «ya existe» ya
  salió. Nunca falla: sin respuesta devuelve `[]`.
- `AdicionarUsuarioDialogComponent.onSave()`: si el nickname existe y hay persona elegida, se
  muestra el aviso, **se baja `guardando` en el acto** y se piden las sugerencias aparte; se
  muestran debajo del campo como botones; clic → el valor va al campo. La suscripción de
  sugerencias se guarda y se cancela (y `sugerencias = []`) al volver a guardar, al cambiar de
  persona, al hacer clic en una y al guardar con éxito: una respuesta tardía no pisa nada.
  Ninguna rama de las sugerencias toca `guardando`. Al editar un usuario existente vale igual (su
  persona). Una sugerencia que otro tomó entre medio la vuelve a atajar la verificación de
  `onSave`, que sugiere de nuevo.
- Sin funciones en el HTML: `sugerencias` es un array del componente.

### Fase 2 — misma ayuda en el asistente de pre-registro de funcionario

- `FuncionarioWizardComponent.onGuardar()`: hoy, con nickname repetido, muestra
  «Ya existe un usuario con ese nickname». Pasa a mostrar las sugerencias desde `nombrePersona`
  (la persona todavía no existe) con el mismo patrón de botones y la misma cancelación.
- De paso, la verificación del asistente toma el patrón del diálogo (`timeout(15000)`,
  `catchError(() => of(false))`, `defaultIfEmpty(false)`): hoy, con el central caído, el error
  llega a un `subscribe` sin manejador y el botón no responde. Sigue antes de crear persona,
  usuario y funcionario: no se crea nada a medias.

## Tabla de datos nuevos

| Dato | Lo escribe | Lo lee |
|---|---|---|
| `sugerencias: string[]` (diálogo) | `onSave` vía `UsuarioService.onSugerirNicknames` | template del diálogo; clic → `nicknameControl` |
| `sugerencias: string[]` (asistente) | `onGuardar` vía `onSugerirNicknames` | template del asistente; clic → `nicknameUsuario` |

Nada nuevo en base, GraphQL ni configuración.

## Tests

- Fase 1: `nicknameUtils.spec.ts` (Karma con tsconfig temporal acotado, ver memoria
  «Desktop: arranque sin xvfb»): 1, 2, 3, 4, 5 y 6 palabras, partículas, tildes y Ñ, tope de 6,
  exclusión. Spec de `onSugerirNicknames` con `onVerificarUsuario` stub: libres, tomados, uno que
  falla con un `ApolloError` de red (no se sugiere, el resto sí) y todos fallando (`[]`).
  Revertir la regla y ver el spec en rojo.
- Prueba por pantalla (ng serve -c web contra central local 8081, base `bodega`):
  1. Personas → crear usuario para una persona de 4 palabras cuyo «nombre + apellido» ya esté
     tomado (o escribir un nickname existente) → aviso + sugerencias; clic → campo; guardar → OK.
  2. Persona de 2 palabras con nickname tomado → solo el aviso, sin sugerencias.
  3. Usuarios → Nuevo usuario sin persona elegida, nickname repetido → solo el aviso (no hay de
     dónde sugerir).
  4. Editar un usuario y poner el nickname de otro → sugerencias desde su persona.
  5. Central apagado al guardar → aviso de siempre, sin sugerencias, sin colgar el diálogo.
  6. Asistente de pre-registro con nickname repetido → sugerencias; clic → guardar hasta crear el
     funcionario y que el pre-registro quede verificado.
  7. Central lento (consulta demorada por parche de XHR): cambiar de persona o cerrar el diálogo
     con sugerencias en vuelo → no aparecen sugerencias de la persona anterior.
  8. Sugerencia tomada entre medio (crear ese usuario por SQL antes del clic y guardar) → vuelve el
     aviso con sugerencias nuevas. Restaurar por SQL al final.
  9. Editar un usuario sin cambiar el nickname → no verifica ni sugiere.
- `npm run check` al final.

## Cambios durante la prueba (29/10)

- **Sin «Buscando…»**: `onGetByTexto` abre el spinner de pantalla completa en cada consulta; con un central
  lento tapaba el diálogo hasta que llegaban las sugerencias (el clic en «Cambiar» se perdía). Las
  sugerencias van por `onCustomQuery` con `silentLoad` y un contexto de 15 s sin avisos.
- **Chips** (pedido de Franco): `mat-chip-listbox` + `mat-chip-option` en lugar de botones, con un margen
  chico entre los campos y la fila de sugerencias. Se elige con clic o teclado.

## Resultado de la prueba por pantalla (central de `develop` en 8081, Flyway apagado; desktop web)

| # | Caso | Resultado |
|---|---|---|
| 1 | Persona 848 `PEDRO PABLO AMARILLA PRIETO`, `PEDRO AMARILLA` tomado | aviso + PEDRO PRIETO · PABLO AMARILLA · PABLO PRIETO; clic → campo; guardado OK |
| 2 | Persona 512 `ABEL MELGAREJO` (2 palabras, tomado) | solo el aviso, 1 consulta |
| 3 | Nuevo usuario sin persona | N/A: «Guardar» deshabilitado sin persona |
| 4 | Editar usuario y poner un nickname tomado | sugiere desde su persona, sin su propio nickname |
| 5 | Una consulta de candidato falla por red | ese no se sugiere, el resto sí; ningún «Ups!» |
| 6 | Asistente de pre-registro con nickname tomado | chips; elegido → persona, usuario y funcionario creados, pre-registro verificado |
| 7 | Respuestas demoradas 6 s y cambio de persona | sin spinner; no aparecen sugerencias viejas |
| 8 | Sugerencia tomada entre medio (SQL) | vuelve el aviso con sugerencias recalculadas |
| 9 | Editar sin cambiar el nickname | guarda sin verificar ni sugerir |

Datos de prueba borrados al terminar (usuarios 624/625, persona 6722, funcionario 621, pre-registro 680).

## Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| Sugerencias en vuelo pisan estado o traban `guardando` | B, mayor | `guardando` baja con el aviso; suscripción cancelable; pruebas 7 y 8 |
| `errorConf` silencioso sin `propagate` deja colgado el `forkJoin`; sin `errorConf` salen hasta 6 «Ups!» | A y B, mayor | `show:false` + `propagate:true` + `catchError` por candidato; spec |
| «≤ 6 consultas» falso con 5 o 6 palabras | A, menor | tope de 6 candidatos en la función, con spec |
| 1 palabra sin candidato; tildes | A, menor | 1 palabra: sin sugerencias (Franco descartó los sufijos numéricos); tildes afuera, Ñ adentro (medido en base) |
| Verificación del asistente sin manejo de error | A, menor | patrón del diálogo en fase 2 |
| 6 diálogos «Buscando...» | A/B | descartado: es un spinner compartido por `requestId` (cargando-dialog.service) |
| Otras puertas de alta (mobile, PWA) | A | ninguna crea ni renombra usuarios |

## Qué queda sin verificar

- Bodega vs farmacia: mismo código, misma tabla; se prueba solo contra `bodega` local.
- Nombres con apellidos compuestos sin partícula (`RUIZ DIAZ`): la regla los parte; sugiere
  `WILDO DIAZ` y similares. Es una sugerencia, el encargado elige o escribe otro.
