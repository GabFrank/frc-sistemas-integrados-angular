# Plan — fix: espaciado de los mensajes de error en «Información del cliente»

Rama: `fix/clientes-espaciado-error-telefono` (desde `origin/develop` @ `147282c2`).
Pieza: **desktop** únicamente. Este archivo se borra en el PR final (ciclo §1 paso 11).

## Qué pasa

En `AddClienteDialogComponent` (título «Información del cliente»), el mensaje bajo **Teléfono**
(«Número de teléfono no válido.») abre un hueco grande en el formulario.

Causa, verificada en runtime (`ng serve -c web` + central local, 2026-09-25):

- Los tres `<mat-error>` del diálogo (Nombre, C.I/RUC, Teléfono) están **afuera** del
  `<mat-form-field>` y envuelven el texto en un `<h6>`. Cada uno ocupa **42 px + 12 px de margen
  = 54 px** en el flujo del documento.
- El de Nombre usa `formGroup.touched` como condición: al tocar **cualquier** campo (por ejemplo
  Teléfono) aparece también, así que se suman dos huecos.
- Medido: al marcar Teléfono como tocado, el diálogo pasa de **384 px a 491 px (+107)** y se
  recentra, así que todo el formulario salta.

Por qué no se ve en el resto de la app: 283 `mat-error` del repo están **dentro** del
`mat-form-field`, donde MDC los posiciona `absolute` en el subscript. `styles.scss:276` colapsa ese
subscript a `height: 0` para toda la app, así que el error se dibuja bajo la línea sin empujar
nada. Solo 9 `mat-error` en 5 archivos están afuera.

## Fase 1 — mover los tres `mat-error` adentro del `mat-form-field`

Archivo: `src/app/modules/personas/clientes/add-cliente-dialog/add-cliente-dialog.component.html`.

- Nombre, C.I/RUC y Teléfono: el `<mat-error>` pasa adentro de su `<mat-form-field>`, sin `<h6>` y
  sin `*ngIf`. MDC lo muestra solo en estado de error (`invalid && (touched || submitted)`).
- Textos sin cambios.

Por qué los tres y no solo Teléfono: es el mismo defecto en el mismo diálogo, y el de Nombre
aparece **junto** con el de Teléfono. Arreglar solo Teléfono deja un salto de 54 px en el mismo
gesto que reportó el usuario.

Cambio de comportamiento, deliberado: el error de Nombre deja de aparecer por tocar otro campo;
aparece al tocar Nombre, como el resto de la app.

Sin `.ts`, sin `.scss`, sin GraphQL, sin Electron, sin persistencia.

Prototipo en el DOM vivo (mismo markup que genera MDC): el diálogo se queda en **384 px** con los
dos errores visibles, y el texto cae en la franja bajo la línea del campo, legible.

### Tests de la fase

- Gate: `npm run check` (AOT), leído entero del log.
- `N/A para desktop` el test de bug que falla con el código viejo (ciclo §1 paso 7): el CI del
  desktop no corre tests y no hay batería confiable.
- Prueba de runtime con `npm run ng:serve` contra el central local: Administración → Clientes →
  Lista de clientes → «+ Adicionar»; tocar Teléfono y salir vacío. Esperado: el mensaje aparece
  bajo el campo y **el diálogo no cambia de alto**. Repetir en editar cliente (el mismo diálogo con
  `data.cliente`) y en la pestaña «Nuevo cliente» de `cliente-dashboard`.

## Tabla de datos nuevos

N/A: no nace ningún campo, columna ni clave.

## Fuera de alcance (se anota, no se toca)

- `personas/persona/adicionar-persona-dialog` y `personas/persona/persona.component` tienen el
  mismo patrón (`mat-error` afuera del campo). Otro fix, si el usuario quiere.
- El texto «Número de teléfono no válido.» no corresponde al validador (`Validators.required`
  solamente): dice «no válido» cuando lo que falta es el dato. No se cambia sin pedido.
- El `margin-left: 26px` inline de la fila C.I/Teléfono desalinea esa fila respecto de las otras.

## Auditoría del plan (paso 5, 2026-09-25)

**Eje A — contrato y propagación.** Sin bloqueantes. No cambia GraphQL. Los tres consumidores
(`list-clientes.component.ts:151,166` como diálogo, `cliente-dashboard.component.ts:79` como tab)
solo pasan `data`; ninguno lee los `mat-error`. Ningún `.spec` ni e2e los selecciona.
Riesgo anotado: el error queda visible solo porque el subscript global (`styles.scss:276`,
`height: 0`) no tiene `overflow: hidden`. Es la misma dependencia de los otros 283 `mat-error`
del repo; si alguien toca ese selector, se ven afectados todos a la vez.
→ Se acepta: no se agrega nada, se deja anotado.

**Eje B — reversibilidad y estado.** Sin persistencia; el revert del commit es limpio; postergar
la actualización solo deja el bug. El test N/A está bien justificado (`.github/workflows/ci.yml`
corre builds, no Karma). Riesgo: el error de Nombre deja de aparecer si el usuario completa los
otros campos sin pasar por Nombre; hoy aparece por `formGroup.touched`. «Guardar» sigue
deshabilitado (`formGroup.invalid`), así que no entra un cliente sin nombre; lo que se pierde es
el aviso temprano, y queda el asterisco del label. En edición, `setValue()` no marca touched: sin
cambio.
→ Se acepta como parte del fix (es el mismo comportamiento que el resto de la app), y se pregunta
al usuario al presentar el plan.

## Qué queda sin verificar

- Build Electron empaquetado: el cambio es solo template y el mismo CSS aplica; se verifica en
  alpha con la actualización normal.
- Resoluciones chicas donde el diálogo (60 % de ancho) haga que el label de la fila siguiente
  quede más cerca del error: se verifica en la prueba de runtime achicando la ventana.
