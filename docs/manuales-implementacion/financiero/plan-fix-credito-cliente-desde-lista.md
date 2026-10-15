# Plan — fix: venta a crédito rechaza al cliente elegido de la lista

Rama `fix/pdv-credito-cliente-desde-lista` desde `develop` (pedido de Franco: fix normal, no hotfix; el bug está en `v4.6.0` estable y llega a stable con la próxima promoción). Solo desktop.

## Síntoma (15/10, sucursal 1, desktop 4.6.0)

Venta de 12.000 a crédito a la persona 934 (cliente 798, FARMACIA FRANCO AREVALOS S.A, crédito
10.000.000, saldo 8.416.000). Apenas carga el cliente sale «No posee saldo suficiente. Verifique en
el aplicativo.» y los botones QR/Firma quedan grises. La consola muestra el cliente con
`saldo: 8416000` y el diálogo muestra `Total: 12.000`. El central y los datos están bien.

## Causa

`add-venta-credito-dialog.component.ts`:

- `ngOnInit` → `nombreClienteControl.valueChanges`: si el control está *dirty*, incrementa
  `busquedaCliente`, llama `quitarClienteSeleccionado()` (selectedCliente y saldoEnCredito a null) y
  programa una búsqueda a 1 s. Lo agregaron `43196934`/`eeded501` (#390, 05/10, entraron en 4.6.0).
- `onClienteSelect(e)` asigna `selectedCliente`, y **después** hace `nombreClienteControl.setValue(...)`.
  Si el control está dirty, ese `setValue` dispara el borrado de arriba, y la línea siguiente lee
  `this.selectedCliente?.saldo` → `undefined`. `12000 <= undefined` es falso → aviso. Botones grises
  porque `selectedCliente == null`.
- El control está dirty cuando el cliente se elige **desde el mat-autocomplete** (clic o Enter):
  `MatAutocompleteTrigger._setValueAndClose` llama `_onChange(cliente)` (Angular forms marca dirty y
  emite valueChanges con el objeto) y recién después `optionSelected` → `onClienteSelect`.
  Además queda programada una búsqueda con el texto «934 - FARMACIA …», que no encuentra nada.

## Fase 1 (única) — commit + push

1. `valueChanges`: ignorar valores que no son texto (el objeto que escribe el autocomplete). Una
   edición del usuario sigue invalidando la selección como pide #390.
2. `onClienteSelect`: cancelar el timer de búsqueda pendiente y escribir el texto del cliente con
   `{ emitEvent: false }` + `markAsPristine()`: escribir el nombre elegido no es editar.
   Calcular `saldoEnCredito` desde `e`, no desde un campo que otro handler puede haber pisado.
3. Test: `add-venta-credito-dialog.component.spec.ts` instancia la clase con stubs y reproduce el
   orden real del autocomplete (`markAsDirty` + `setValue(cliente)` + `onClienteSelect(cliente)`)
   y el camino por número (respuesta con el control pristine). Esperado: cliente seleccionado,
   saldo 8.416.000, sin aviso. Revertir el fix → el test tiene que fallar.

Tabla de datos nuevos: ninguno (sin campos, columnas ni claves nuevas).
Persistencia/migraciones: N/A para desktop porque el cambio es solo de UI.

## Auditoría del plan (paso 5)

- **A y B, coincidentes — búsqueda en vuelo pisa la elección (adoptado).** Ignorar el objeto del
  autocomplete saca el `busquedaCliente++` que por accidente invalidaba respuestas en vuelo: una
  búsqueda por texto que ya salió podía volver y reemplazar al cliente elegido de la lista.
  `onClienteSelect` ahora hace `busquedaCliente++` además de cancelar el timer. Caso de test propio.
- **A — regla «no filtrar en valueChanges» del CLAUDE.md (aceptado con nota).** El filtro es
  mínimo (descartar el objeto que escribe el autocomplete) y queda comentado en el código.
- **A — `setValue(null)`/`reset()` programático ya no invalida.** Nadie lo hace en este diálogo
  (grep); borrar a mano emite `''`, que sigue invalidando.
- **A — mismo patrón sospechoso en `edit-delivery-dialog.component.ts:201-224`.** No verificado;
  fuera de este fix, queda anotado.
- **B — el saldo que se compara es el leído al buscar; la validación es del lado cliente.** Igual
  que antes del fix; no se toca acá.

## Resultado

- Spec en Karma (launcher Electron, `DISPLAY=:0`): sin el fix **2 de 5 fallan** (lista y búsqueda
  en vuelo) por el bug; con el fix **5 de 5**. El «full page reload» que imprime Karma aparece
  igual en las corridas sin fix: es del launcher.
- `npm run check` (AOT): OK.

## Qué queda sin verificar

- Prueba en pantalla contra un central real: se verifica sirviendo el desktop por web
  (`ng serve -c web`) y eligiendo el cliente de la lista. Si no se hace, se dice.
- Karma solo tiene launcher Electron; si no corre, el test se verifica como indica la memoria
  (tsc + node), y se informa así.
