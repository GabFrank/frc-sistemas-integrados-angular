# Plan #728 — «Ver» retiro muestra reales y dólares cruzados

Rama: `fix/financiero-retiro-ver-monedas` (desde `origin/develop` 1076128b). Pieza: solo desktop.

## Causa

`AdicionarRetiroDialogComponent.onVer` (`adicionar-retiro-dialog.component.ts:284-285`) carga
`dolarControl ← retiro.retiroRs` y `realControl ← retiro.retiroDs`. En todo el resto del desktop
`retiroRs` es reales y `retiroDs` dólares (`retiro.service.ts:138-139` los arma desde `REAL` y `DOLAR`;
el alta en `onGuardar` usa `realControl` → REAL y `dolarControl` → DOLAR; `adicionar-gasto-dialog`
carga `realControl ← retiroRs`).

## Fase única

Cambiar las dos líneas: `realControl ← retiroRs`, `dolarControl ← retiroDs`.

- Datos nuevos: ninguno. Backend, migraciones, replicación: N/A (solo cambia qué control muestra qué valor).
- Alcance: solo la vista «Ver» del diálogo (campos deshabilitados). No toca lo guardado, la reimpresión
  ni los totales.
- Tests: no hay spec que cubra `onVer`. El «should create» existente no puede crear el componente (el
  TestBed no provee `data` ni servicios), así que el caso nuevo llama a `onVer` sobre un objeto con los
  cinco `FormControl`, sin TestBed, con Rs=10 ≠ Ds=20. Karma no corre en CI (matriz 0.2): se corre
  local con tsconfig acotado, y se revierte el fix para ver que el caso falla.
- Build: `npm run check`.

## Prueba por pantalla

Filial propio (sucursal 24) en un puerto libre + desktop estático, usuario `MR`, caja 1185.
PDV → Utilitarios → Retiro → en la lista, Ver sobre un retiro con reales ≠ dólares (crearlo si no hay).
Esperado: el campo Reales muestra el valor de la columna Rs y Dólares el de la columna Ds.

## Auditoría del plan (paso 5)

- Eje A: mapeo confirmado hasta el filial (`RetiroResolver.java:30-36`, Rs = moneda 2, Ds = moneda 3);
  `onVer` tiene un único llamador (`.html:301`); ningún otro cruce en desktop, `frc-mobile` ni la PWA
  (el plan decía que `frc-mobile` tenía una copia del diálogo: no la tiene, corregido).
- Eje B: nada persistido cambia; tras Ver los controles quedan deshabilitados y `onGuardar` exige
  `.valid`, así que no se guarda con esos valores; rollback = revert. El test original del plan no era
  viable con el spec actual → caso sin TestBed (arriba).
- Preexistente, fuera de alcance (los dos ejes): tras Ver los controles no se vuelven a habilitar hasta
  cerrar el diálogo. Se menciona en el PR, no se toca.

## Resultado (12/11)

- Paso 8: diff = 2 líneas de `onVer` + 1 spec. Fijo 1 N/A (no toca resolver ni rol: solo desktop), Fijo 2 N/A
  (sin entidad, migración ni `.graphqls`), Fijo 3 N/A (sin cambio en queries ni campos pedidos); ningún
  condicional dispara (sin release ni tablas replicadas).
- Karma (spec acotado): el caso nuevo pasa; con el fix revertido falla con «Expected 10 to be 20» /
  «Expected 20 to be 10». El «should create» falla igual antes y después (sin provider de `MAT_DIALOG_DATA`).
- `npm run check`: exit 0.
- Pantalla (filial propio 8092, sucursal 24, MR, caja 1185): Ver sobre el retiro 1017 (4,2 R$) → Reales 4.20,
  Dólares 0.00; con un detalle temporal de 7,5 US$ → Reales 4.20, Dólares 7.50 (detalle borrado). «Guardar»
  tras Ver no crea retiro: avisa «El monto en reales es mayor a lo que tiene en caja» (antes nombraba la
  moneda equivocada) y la caja sigue con 9 retiros.

## Sin verificar

Impresión del retiro (no la toca el cambio).
