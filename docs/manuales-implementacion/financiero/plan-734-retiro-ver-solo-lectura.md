# Plan #734 — tras «Ver» un retiro los campos quedan deshabilitados y Guardar sigue visible

Rama: `fix/financiero-retiro-ver-solo-lectura` (desde `origin/develop` 240e021b, que ya trae #728). Pieza: solo desktop.

## Causa

`AdicionarRetiroDialogComponent.onVer` carga el retiro y llama `disable()` sobre los cinco controles; en el
componente no hay `enable()` ni `reset()`. El template sigue mostrando «Nuevo Retiro» y el botón Guardar
(`*ngIf="responsableControl.value != null"`), que corre `verficarValores()` y avisa saldos sobre un retiro ya
existente (no guarda: los controles deshabilitados no son `valid`). Además Ver no cambia de pestaña: el
usuario queda en la lista sin ver nada.

## Fase única

- `onVer`: además de cargar y deshabilitar, `stepper.selectedIndex = 0` (va a Información).
- Template: título `Retiro #<id>` si hay `selectedRetiro`, si no «Nuevo Retiro»; Guardar solo sin
  `selectedRetiro`; en su lugar, con `selectedRetiro`, botón «Nuevo retiro» → `onNuevo()`.
- `onNuevo()`: `selectedRetiro = null`, controles a su valor inicial (responsable/observación `null`,
  montos `0`) y `enable()`; foco en el responsable.
- Datos nuevos: ninguno. Backend, migraciones, replicación: N/A.
- Tests: spec sin TestBed (como #728): `onVer` deja `selectedRetiro`, deshabilita y va al paso 0; `onNuevo`
  limpia, habilita y saca `selectedRetiro`. Revertir y ver que fallan.
- Build: `npm run check`.

## Auditoría del plan (paso 5)

- Eje A: único llamador `utilitarios-dialog.component.ts:122` (descarta el resultado); `stepper` siempre
  existe en la app (Ver se llama desde el paso 1), el spec sin vista necesita uno falso; `app-buscador-field`
  limpia con `writeValue(null)` y habilita/deshabilita su texto en `setDisabledState`. Sugiere guardar contra
  `selectedRetiro` en `onGuardar` → aplicado.
- Eje B: `onGuardar` no miraba `selectedRetiro` (lo frenaba solo que los controles deshabilitados no son
  `valid`) → se agrega `selectedRetiro == null`. Montos con `reset(0)`, no `null` (`onGuardar` hace
  `.toString()`). El saldo no se recarga: guardar cierra el diálogo y el filial rechaza si cambió. Rollback = revert.

## Prueba por pantalla

Filial propio 8092 (sucursal 24), MR, caja 1185. Utilitarios → Retiro → Lista → Ver 1017: abre Información
con «Retiro #1017», sin Guardar, con «Nuevo retiro». «Nuevo retiro»: campos vacíos y habilitados, título
«Nuevo Retiro», Guardar aparece al elegir responsable. Cargar un retiro real chico y guardarlo (base local)
para ver que el alta sigue funcionando después de Ver → Nuevo.

## Resultado (12/11)

- Paso 8: diff solo en el diálogo (ts, html, spec). Fijo 1 N/A (sin resolver ni rol), Fijo 2 N/A (sin
  entidad, migración ni `.graphqls`), Fijo 3 N/A (sin cambio en queries); ningún condicional dispara.
- Karma (spec acotado): 3 casos nuevos pasan. Con el `.ts` original fallan «Ver va a Información»
  (Expected 1 to be 0) y «Nuevo retiro» (`onNuevo is not a function`). «Guardar no hace nada en Ver» pasa
  igual con el código viejo, porque los controles deshabilitados ya lo frenaban: la guarda es defensa
  explícita. El «should create» falla antes y después (sin `MAT_DIALOG_DATA`).
- `npm run check`: exit 0.
- Pantalla (filial de `origin/develop` en 8092, sucursal 24, MR, caja 1185):
  - Ver 1017 pasa solo a Información: «Retiro #1017», sin Guardar, con «Nuevo retiro».
  - «Nuevo retiro» deja «Nuevo Retiro», campos vacíos y habilitados, foco en Responsable.
  - Con responsable aparece Guardar. El retiro 1022 (1.000 Gs, responsable 415) se guardó bien, sin
    arrastrar montos del 1017.
- Visto y previo, no se toca: tras ir a «Lista de Retiros» y volver, los montos en 0 se pintan como
  error. Es el `MatStep` de un stepper `linear`, que actúa de `ErrorStateMatcher` una vez «interacted». Pasa
  igual en un diálogo recién abierto.

## Sin verificar

Impresión del retiro (la dispara el filial al guardar; el cambio no la toca).
