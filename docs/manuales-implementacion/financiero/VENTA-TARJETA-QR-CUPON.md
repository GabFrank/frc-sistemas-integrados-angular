# Venta con tarjeta por QR — lado desktop

> El **qué** y el **por qué** del módulo están en el central:
> `central/docs/manuales-implementacion/financiero/VENTA-TARJETA-QR-CUPON.md`.
> Acá va solo lo propio del cliente. Rama: `feat/qr-pos-formato-generico`.

## 1. Dónde vive

Todo bajo `src/app/modules/financiero/venta-tarjeta/qr-pos/`:

| Archivo | Rol |
|---|---|
| `qr-pos-parser.ts` | El motor. Parsea el cupón contra los formatos activos, escala el importe según los decimales de la moneda, ordena los formatos por proveedor y detecta el cupón cruzado (`formatoCruzado`) |
| `escanear-cupon-dialog/` | Diálogo de lectura **antes** de que la venta exista. Devuelve los datos, no persiste nada |
| `registrar-venta-tarjeta-dialog/` | Diálogo para completar un PENDIENTE: muestra el QR para el celular y acepta la lectura local |
| `formato-qr-pos/` | ABM de formatos (pantalla de ADMIN) |
| `venta-tarjeta-qr-payload.ts` | Arma el `QrData` que el celular escanea |
| `cobro-tarjeta.ts` | El predicado "esta línea de cobro hay que registrarla" |
| `mensaje-error.ts` | Saca el mensaje del backend sea cual sea la forma en que llegó el error |
| `../graphql/cobrosTarjetaDeVenta.ts` | Trae los cobros con tarjeta de una venta cerrada, para saber a cuál vincular el cupón. Va contra el **filial** (`servidor=false`), que es el mismo backend que resuelve `completarVentaTarjeta` |

## 2. Los datos del cupón viajan en el `CobroDetalle`, en memoria

`CobroDetalle` tiene dos campos **transitorios**: `terminalPos` y `datosCupon`. Son de UI, viven
solo mientras dura el cobro y **nunca se mandan en `toInput()`**.

Hay un tercero que **sí se manda**: al leer el cupón se escribe también
`item.identificadorTransaccion`, que es un campo real de `cobro_detalle`. Ese es el que deja el
vínculo cupón↔cobro grabado de una, exacto, en el mismo `saveVenta` — sin que el backend tenga
que deducir después a qué línea pertenecía. Ver §7 del manual del central.

Consecuencia práctica: hasta que `saveVenta` responde, no hay nada persistido del lado de tarjeta.
`venta-touch.component.ts` recibe los `TarjetaPago` al cerrar el diálogo de pago y recién ahí llama
a `registrarPagosConTarjeta(tarjetaPagos, ventaId)`, que crea el PENDIENTE y lo completa.

⚠️ Ese método se llama desde **las dos** ramas de guardado: la venta normal y la de **delivery**,
que tiene su propio `onSaveVentaDelivery`. Antes de esto, un delivery pagado con tarjeta **no
generaba ningún registro de `venta_tarjeta`**. Si aparece un tercer camino de guardado, tiene que
llamarlo también.

## 3. Trampas del repo que pegan acá

- **Reabrir un delivery reproduce sus líneas de cobro ya guardadas.** `addCobroDetalle` se llama
  una vez por línea existente, así que el disparo automático del escaneo se gatea con
  `esLineaNueva = selectedItem?.id == null` — calculado **antes** del `Object.assign`, que copia
  el id al item nuevo. Sin eso, reabrir un delivery con 3 tarjetas abre 3 diálogos modales de
  golpe.
- **Nada de funciones ni getters en el template** (regla del `CLAUDE.md`). El predicado de
  `cobro-tarjeta.ts` se usa en el TS; en el HTML la misma condición va escrita inline. **Si cambia
  una, hay que cambiar la otra** — están documentadas cruzadas.
- **Apollo congela lo que devuelve.** Los objetos que vuelven de una query no se mutan: se clonan.
- **El QR se arma con `codificarQr()`, nunca con `JSON.stringify`.** El mobile rechaza toda cadena
  que no empiece con `frc-`. Hay un test que falla si alguien lo vuelve a cambiar.
- **`id` es `ID` (string) y `xxxId` es `Int` (número).** En el schema del central los `id` llegan
  como string y los campos `xxxId` como número, así que **cualquier `===` entre esos dos lados es
  falso siempre**. Mordió dos veces en este módulo: el botón de completar no aparecía nunca
  (`sucursalId === sucursalActual.id`), y `formatoCruzado` habría marcado *todos* los cupones
  correctos como "de otra terminal" apenas se cargaran proveedores. Los dos casos comparan con
  `Number()` en ambos lados y tienen test.
- **El diálogo de completar se bloquea mientras hay que elegir cobro.** Se pone
  `dialogRef.disableClose = true` al entrar al selector: sin eso, un click en el backdrop
  descartaba el cupón ya leído en silencio.
- **El símbolo de moneda sale del COBRO, no de la terminal.** Son cosas distintas y pueden
  diferir: pegarle el símbolo de la terminal al monto del cobro mostraba `8.000 R$` para un cobro
  de 8.000 Gs. La moneda de la terminal se usa solo para avisar que difiere. Ver §8.1 del manual
  del central.
- **La lista muestra la moneda del REGISTRO** (`venta_tarjeta.moneda_id`, `V219.5`/`V92.5`), no la
  de la terminal: esa última es configuración mutable y cambiarla reescribía el significado de
  todo el histórico de esa terminal. Se cae a la de la terminal solo para filas anteriores a la
  columna. Los decimales salen de `moneda.decimales` (0 en Gs., 2 en R$) y no de un `1.0-2` fijo,
  que mostraba `55,5 R$`. `simboloMoneda` / `digitosMoneda` se precalculan por fila en
  `aFilaConMoneda()`: el template no puede llamar funciones ni getters, y la fila se **copia**
  porque los resultados de Apollo vienen congelados.
- **`GenericCrudService.onCustomMutation` propaga el ARRAY de errores de GraphQL**, no un `Error`:
  `err.message` da `undefined` y el mensaje del backend se pierde. Usar `mensajeDeError()`
  (`qr-pos/mensaje-error.ts`), que cubre las tres formas. Un bloqueo que no explica por qué es
  casi tan malo como no bloquear: el cajero reintenta a ciegas.

## 4. El rol nuevo son 3 ediciones en el sidebar

`VENTA_TARJETA_COMPLETAR` (enum `roles.enum.ts` ↔ fila `VENTA TARJETA COMPLETAR` de
`personas.role`, migración `V218.5` del central). Como toda entrada de menú, son **tres** puntos en
`side-mini-variant.component.ts` y falta uno deja el módulo inalcanzable:

1. `visibilityRoles` del **grupo** "Reportes y Análisis"
2. `visibilityRoles` del **ítem** "Terminales POS"
3. el `case` de `onItemClick()` → `openTabIfAuthorized(ROLES.VENTA_TARJETA_COMPLETAR, ...)`
   (esa función ya deja pasar `ADMIN` además del rol pedido)

Dentro de `terminal-pos-dashboard.component.html`, los botones de **Nueva terminal** y
**Proveedores de servicios** quedaron gateados a `ADMIN`: el cajero con el rol nuevo entra al
dashboard pero solo ve **Ventas con tarjeta**.

## 5. Tests

`npm test` (Karma) está roto de antes y el CI no lo corre. Los specs de este módulo se corrieron
transpilando con esbuild y ejecutándolos en node:

```bash
node_modules/.bin/esbuild <spec>.ts --bundle --platform=node --format=cjs \
  --outfile=/tmp/spec.js '--external:@angular/*' --external:rxjs
node -r /tmp/jasmine-shim.js /tmp/spec.js
```

45 verdes: `qr-pos-parser` (23), `venta-tarjeta-qr-payload` (8), `cobro-tarjeta` (8), `mensaje-error` (6).

⚠️ **`npm run check` no typechequea los `.spec.ts`** — `src/tsconfig.app.json` los excluye con
`"exclude": ["**/*.spec.ts"]`. Para que un error de tipos en un spec no pase silencioso:

```bash
node_modules/.bin/tsc -p src/tsconfig.spec.json --noEmit
```
