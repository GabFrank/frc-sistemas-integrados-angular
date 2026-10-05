# Plan — el lector del PDV tipea mal con Windows en otro idioma

Rama: `fix/venta-tarjeta-lector-teclado-idioma` (desktop, desde `develop`).
Pieza única: **desktop**. Central y filial: N/A porque la cadena se rompe antes de salir del
navegador; ningún backend la ve distinta de como la manda el desktop.

## 1. Problema, medido

El lector de QR del PDV es keyboard-wedge: no manda caracteres, manda **teclas físicas** según
la tabla de teclado que tiene adentro, y el carácter final lo pone el idioma de teclado de Windows.

Medido el 2026-10-05 con `desktop/docs/utilitarios/diagnostico-lector-teclado.html`, tres
escaneos (dos señas, un cupón ValidaPix FRCP1 real):

- La tabla del lector es **EE.UU.**: `*` llega como `Shift+Digit8`, `|` como `Shift+Backslash`
  (en ABNT2 sería `IntlBackslash`), `-` como `Minus`.
- Lo que recibe la caja según el idioma de Windows:

| Windows | cupón `FRCP1*CXF1**BRL*…` | seña `frc-24-VT-…-654\|32000\|36-…` |
|---|---|---|
| Inglés EE.UU. | ✓ | ✓ |
| Portugués Brasil | ✓ | ✗ `\|` → `}` |
| Español Latinoamérica | ✗ `FRCP1(CXF1((BRL(…` | ✗ `frc'24'VT'…654]32000]36'…` |
| Español España | ✗ igual | ✗ `-` → `'`, `\|` → `Ç` |

- El lector **hace pausas** dentro de una misma lectura: 172 ms y 279 ms medidos entre dos teclas
  consecutivas. Distinguir lector de cajero por velocidad no es confiable.

Decisión del usuario (2026-10-05): arreglo en software, en el desktop, sólo módulo POS.

## 2. Diseño

**Dos lecturas de la misma cadena, sin adivinar quién tipeó.**

1. Una directiva en el input guarda, por cada tecla imprimible, `KeyboardEvent.code` (tecla
   física, independiente del idioma) y `shiftKey`.
2. Con esas teclas se rearma la cadena **como la quiso mandar el lector** (tabla EE.UU.).
3. El consumidor prueba **primero la cadena tal como llegó** (así un cajero que tipea a mano en
   su propio teclado no cambia de comportamiento) y, sólo si no sirve, la rearmada. En el cupón,
   el orden es **por formato** (original y rearmada contra el formato del proveedor de la
   terminal, después el siguiente): ver A1 en §8.
4. La rearmada sólo existe si el registro es **íntegro**: se invalida con cualquier edición que
   no sea tipear al final (Backspace, Delete, flechas, pegar, Ctrl/Alt/Meta, AltGr), y se
   descarta si su largo no coincide con el valor del input (tecla muerta que compuso un acento).
   Ante la duda, no hay alternativa: queda el comportamiento de hoy.
5. El registro arranca de cero cuando la primera tecla cae sobre un input vacío. Los diálogos
   limpian el control con `setValue('', {emitEvent:false})`, que no dispara `input`: por eso el
   reinicio se decide en el `keydown`, mirando el valor.

Por qué no las alternativas:
- **Normalizar caracteres en el parser** (`(`→`*`): adivina, y depende de saber el idioma de la
  caja. Las teclas físicas no adivinan.
- **Reemplazar siempre por la rearmada**: rompe al cajero que tipea el texto debajo del QR con
  su teclado en español (su `*` es `Shift+BracketRight`, que en tabla EE.UU. da `}`).
- **Configurar los lectores**: descartado por el usuario como arreglo único (lector por lector, y
  se rompe al cambiar el idioma de Windows).

## 3. Puntos de entrada (los cuatro, verificados uno por uno)

| # | componente | qué entra | qué se prueba con la alternativa |
|---|---|---|---|
| 1 | `terminal-pos/scan-terminal-pos-dialog` (PDV, F12 → Tarjeta) | cupón **o** código de terminal | cupón: `parsearCupon` con la alternativa si la original no matchea. Terminal: si la búsqueda por la original no encuentra nada y la alternativa difiere, se busca por la alternativa (códigos como `POS-001` también tienen `-`) |
| 2 | `venta-tarjeta/qr-pos/escanear-cupon-dialog` | cupón | `parsearCupon` con la alternativa |
| 3 | `venta-tarjeta/qr-pos/registrar-venta-tarjeta-dialog` | cupón | `parsearCupon` con la alternativa |
| 4 | `venta-tarjeta/ventas-tarjeta-caja-dialog` | seña `frc-…` | si la original no es una seña de venta con tarjeta, se prueba la alternativa antes de rechazar |

Fuera de alcance, anotado: los QR `frc-…` de otras pantallas de la app (mismo riesgo); el
`textarea` de «Probar» del ABM (se pega, no se escanea).

## 4. Datos nuevos

Ninguno persistido. Un solo dato en memoria:

| dato | quién lo escribe | quién lo lee |
|---|---|---|
| registro de teclas del input | `LectorTecladoDirective` (`keydown`, `paste`, `input`) | `LectorTecladoDirective.alternativa(valor)`, llamada por los 4 componentes de §3 en su handler de lectura |

## 5. Fases

**Fase 1 — núcleo puro + directiva.** `shared/lector-teclado/`:
- `teclado-lector.ts`: tabla EE.UU. `code → [normal, shift]` (letras, dígitos, puntuación,
  numpad, espacio) y `rearmarComoLector(teclas)`; `probarConAlternativa(original, alternativa,
  fn)` (helper que devuelve el primer resultado OK, y si ninguno, el de la original).
- `lector-teclado.directive.ts` (`standalone: true`, selector `[frcLectorTeclado]`,
  `exportAs: 'lectorTeclado'`).
- `teclado-lector.spec.ts`: las tres cadenas medidas, en sus cuatro variantes de idioma, rearman
  a la original; tecla muerta y edición invalidan.
  Commit `fix(venta-tarjeta): rearmar la lectura del lector desde las teclas fisicas`.

**Fase 2 — los cuatro puntos de entrada** (§3), importando la directiva standalone en
`financiero.module.ts`. Commit `fix(venta-tarjeta): el cupon y la seña se leen con cualquier idioma de teclado`.

**Fase 3 — documentación**: skill `frc-pos-expert` (gotcha nuevo + corregir «teclado es-LA» en
`cadena-web-para-proveedor.md`, que hoy dice lo contrario de lo medido), comentario del parser
(`qr-pos-parser.ts` dice «teclado es-LA»), `docs/PLAN_TESTEO_MANUAL`-equivalente del módulo.
Commit `docs(venta-tarjeta): …` (la skill va en PR aparte a `frc-cicd`).

## 6. Tests

- Desktop no corre specs en CI (Karma roto, gotcha conocido). El spec se escribe igual y **se
  ejecuta a mano** transpilando `teclado-lector.ts` con `tsc`/`node` en el scratchpad, con las
  cadenas medidas. «Revertir el fix y ver fallar»: N/A para desktop por esa razón, pero el
  script ad hoc se corre también contra la cadena original sin rearmar para ver que no matchea.
- `npm run check` al final de todas las fases.
- **Prueba manual en browser** (`ng serve`, Claude in Chrome) no reproduce el idioma de Windows:
  la extensión no genera `code` reales. La prueba real es en una caja con Windows en español
  (o la iMac con fuente de entrada Español-Latinoamérica), con el lector y:
  1. cupón FRCP1 en los diálogos 1, 2 y 3 → completa;
  2. seña en el diálogo 4 → abre el cobro;
  3. código de terminal con `-` en el diálogo 1 → encuentra la terminal;
  4. el cajero tipea a mano el texto debajo del QR con su teclado en español → completa (usa la
     original);
  5. escanear, borrar un carácter, volver a escanear → sigue funcionando (el registro se
     reinicia con el input vacío).

## 7. Riesgos y qué queda sin verificar

- **La tabla del lector es fija (EE.UU.)**. Medida en un solo modelo de lector. Otro lector
  configurado en otra tabla seguiría fallando en los idiomas que no coincidan. Mitigación: la
  tabla vive en una constante; si aparece otro, se mide con la página de diagnóstico.
- **Pausas del lector vs. debounce** (observado, no lo arregla este plan): una pausa de 279 ms
  supera el `debounceTime(250)` de los diálogos 2 y 3, así que puede dispararse una lectura con
  la cadena a medias. Hoy eso sólo muestra un error que se corrige cuando llega el resto; en el
  diálogo 1 (`debounceTime(350)`, búsqueda por `LIKE`) un prefijo podría encontrar una terminal.
  Se anota como hallazgo; arreglarlo es otro PR.
- Electron 22 / Chromium: `KeyboardEvent.code` está soportado; no verificado con IME.

## 8. Auditoría del plan (paso 5) — hallazgos y qué se hizo

Dos auditores por concern, sin verse (eje A contrato/propagación, eje B reversibilidad/estado).

| # | eje | sev. | hallazgo | decisión |
|---|---|---|---|---|
| A1 | A | media | Probar «la original contra todos los formatos, después la rearmada» deja que una original corrupta matchee el patrón de **otro** proveedor antes de llegar a la rearmada del propio. Hoy hay un solo proveedor WEB; con dos, se cargarían datos de otro formato | **Adoptado, cambia el diseño.** El orden pasa a ser **por formato**: para cada formato, en el orden de `ordenarPorProveedor`, se prueba la original y después la rearmada. El formato del proveedor de la terminal gana siempre. `parsearCupon` recibe la alternativa como parámetro opcional; test con dos formatos WEB |
| A2 | A | baja | `shared/qr-lector/qr-lector.service.ts` (TRF/SOLPAG/RETIRO/PRE_GASTO_RETIRO) tiene el mismo problema con `-` | Fuera de alcance, ya anotado en §3. Se lista en el PR como deuda explícita. La directiva queda en `shared/` para aplicarla ahí después |
| A3 | A | baja | `qrCrudo` viaja al filial y es la base del control de duplicado por cadena cruda | Sin bypass: la rearmada es lo que tipearía un Windows en inglés, así que el valor persistido **converge** sin importar el idioma de la caja. Se guarda la cadena que matcheó (la rearmada si fue ésa) y se deja comentada esa invariante |
| A4 | A | baja | Canales: sin dependencia de backend | Confirmado. Cajas sin actualizar siguen como hoy |
| A5 | A | baja | Atajos globales (F1/F12/F10) escuchan en `document`: la directiva no debe cortar la propagación | La directiva **sólo lee**: sin `stopPropagation` ni `preventDefault`. Se agrega a la prueba manual: el Enter del lector con el diálogo de caja abierto no dispara atajos de fondo |
| B1 | B | alta (según el auditor) | La rearmada podría matchear con datos distintos de los que vio el cajero, y `venta_tarjeta` persiste y replica | **Rechazado como alta, mitigado.** Letras y dígitos salen de la misma tecla en los cuatro idiomas medidos: la original y la rearmada sólo difieren en símbolos. Los campos que carga el mapeo (montos, autorizaciones, referencias, todos alfanuméricos) no pueden cambiar de valor entre una lectura y otra. Mitigación barata: cuando gana la rearmada, el input se reescribe con ella (`emitEvent:false`) para que el cajero vea lo que se usó, y los diálogos siguen mostrando su revisión de monto/moneda como hoy |
| B2 | B | media | Un segundo escaneo sobre un input no vacío concatena: registro íntegro pero inútil. Un `setValue` programático con texto deja el registro desfasado | **Adoptado.** En cada `keydown`: input vacío → registro nuevo; si no, `valor.length !== teclas.length` → registro inválido. Cubre `setValue` con texto, reemplazo de selección y autocompletado. La concatenación de dos escaneos completos no matchea ningún patrón anclado, ni original ni rearmada: mismo resultado que hoy |
| B3 | B | baja | Debounce vs. pausas del lector | Deuda explícita en el PR (§7) |
| B4 | B | baja | Comentario «teclado es-LA» de `qr-pos-parser.ts:16` | Fase 3, no se recorta |
| B5 | B | — | Rollback limpio: sin dato nuevo persistido, sin backend | Confirmado |
| B6 | B | media | Faltan tests de concatenación y de alternativa divergente con dos formatos | Se agregan al spec de fase 1 (A1 + B2) |

## 9. Auditoría del diff (paso 8)

Fijo 1 (autorización) y Fijo 2 (esquema, migración, espejo): **N/A** — `git diff --name-only
origin/develop...HEAD` no toca resolvers, `.graphqls` ni migraciones; es todo `src/app` y `docs`.
Corrieron Fijo 3 (contrato con clientes) y una lente de corrección.

| # | lente | sev. | hallazgo | decisión |
|---|---|---|---|---|
| D1 | Fijo 3 | — | `qrCrudo`: el filial lo compara por igualdad exacta (`findByQrCrudoEnVentasVigentes`); nunca se pudo guardar una cadena con `(` porque el patrón anclado no la aceptaba | Sin acción: confirma A3 |
| D2 | Fijo 3 | — | Los «Probar» del ABM llaman `parsearCupon` sin el parámetro nuevo: comportamiento idéntico | Sin acción |
| D3 | Fijo 3 | media | `scan-terminal`: cupón leído sin terminal deja el texto del cupón en el campo, y el escaneo de la terminal se le pega atrás | **Corregido** (`esperarTerminal`: vacía el campo con `reset`). Defecto previo, alcanzable ahora también en cajas en español |
| D4 | corrección | baja | Con una pausa del lector mayor al debounce, la búsqueda por prefijo ahora prueba dos lecturas | Deuda, junto a B3. La segunda sólo corre si la primera no encontró nada: deja a una caja en español igual que una en inglés |
| D5 | corrección | — | Bloq Mayús: la original sale en minúsculas, la rearmada usa el bit de Shift y la repara | Efecto deseado, sin acción |
| D6 | corrección | — | Orden keydown→input→debounce, `HostListener` apilados, `ViewChild` en `*ngIf`, maxlength, numpad sin NumLock (comentario aclarado) | Verificados sin bug |

