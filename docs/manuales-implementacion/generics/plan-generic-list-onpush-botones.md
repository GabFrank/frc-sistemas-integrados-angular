# Plan — app-generic-list: botones que quedan deshabilitados en pantallas OnPush (#576)

Rama: `fix/generic-list-onpush-botones` (desde `origin/develop` 69885312).

## Problema

`GenericListComponent.bloquear()` deshabilita el botón tocado y lo rehabilita a 1 s con un
`setTimeout`. El componente usa detección por defecto, pero las 17 pantallas de la issue que lo usan son
`OnPush`: el tick que dispara el `setTimeout` saltea al padre OnPush (nadie lo marcó) y con él a
`app-generic-list`. El botón queda con `disabled = true` hasta que otra cosa redibuje la pantalla.
Afecta a Buscar, Limpiar filtro, Adicionar y los dos botones custom.

## Fase única

- `src/app/shared/components/generic-list/generic-list.component.ts`: inyectar `ChangeDetectorRef`
  y llamar `this.cdr.markForCheck()` dentro del `setTimeout` de `bloquear`. `markForCheck` marca
  al componente y a todos sus ancestros, así que el próximo tick entra al padre OnPush.
- Las 72 pantallas que usan el componente no se tocan. En las que no son OnPush el cambio no
  altera nada (ya se revisaban en cada tick).

### Tests

`N/A para desktop` como batería de gate (el CI no corre Karma; ciclo §1 paso 9). Gate:
`npm run check`. Verificación por pantalla en el navegador (`ng serve -c web`):

1. Solicitudes de gasto (`list-pre-gastos`, OnPush): Buscar tres veces seguidas con >1 s entre
   clics; cada clic consulta (ver la request en red) y el botón vuelve a habilitarse solo.
2. Misma pantalla: Limpiar filtro dos veces; idem.
3. Una pantalla OnPush de otro módulo (`list-gastos` o `list-control-stock-negativo`): Buscar y
   Adicionar.
4. Una pantalla no-OnPush (p. ej. lista de productos) como control: sigue igual.
5. Doble clic rápido sigue bloqueado (el botón se deshabilita en el mismo tick del clic).
6. Un botón custom (`isCustom`) en una pantalla OnPush que lo use: se rehabilita solo.
7. Clic en Buscar y cerrar la tab antes de 1 s: sin errores en consola.

## Auditoría del plan (paso 5)

- Eje A: nadie extiende ni instancia `GenericListComponent` con `new`; el spec propio usa
  `TestBed`, que inyecta `ChangeDetectorRef` solo. Son 17 pantallas OnPush con el tag, no 18:
  `historial-lote` solo lo nombra en un comentario. `app-boton` tiene otro `setTimeout`, pero es
  otro mecanismo y queda fuera de esta issue. GraphQL, roles y canales: N/A. → Aplicado: casos 6 y 7.
- Eje B: `markForCheck` alcanza (no hay `runOutsideAngular` en `src/app`); los resultados del
  padre ya se redibujan por `async`, así que el síntoma es solo el botón. Sin estado persistido:
  revertir es sacar dos líneas. Riesgo menor: un chequeo extra del padre 1 s después de cada clic.
  → Aceptado (costo despreciable).

## Datos nuevos

Ninguno: no hay campos, columnas ni claves nuevas.

## Persistencia, roles, replicación

N/A: cambio solo de UI en un componente compartido; no toca GraphQL, migraciones ni roles.

## Qué queda sin verificar

- Electron (no cambia nada propio de Electron; se prueba como web).
- Las 17 pantallas una por una: se prueban 2–3 representativas porque el cambio está en el
  componente compartido y es el mismo para todas.
