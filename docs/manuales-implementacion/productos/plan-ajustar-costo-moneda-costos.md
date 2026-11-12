# Plan — «Ajustar costo» sin las líneas en otra moneda cuando COSTOS no la usa (#712)

## Problema

`ajustar-costo-dialog` muestra «Costo actual en Dolar» / «Última compra en Dolar» si
`getCostoEnCosteo` trae `monedaCosteo` distinta de la de la empresa. `monedaCosteo` sale del último
`costo_por_producto` del producto, no de la configuración vigente: con COSTOS desactivado las líneas
siguen. Esperado (runbook «Moneda por módulo», C9): sin las líneas en USD.

Menor: el input «Nuevo costo» arranca con `costoMedio` crudo (`5161.1111111111`).

## Fase única (desktop) — `fix(productos)`

1. `cargarCostoCosteo`: combinar `getCostoEnCosteo` con `monedaModuloService.monedaDe(ModuloMoneda.COSTOS)`
   y mostrar el bloque solo si la moneda del costeo **es la que COSTOS resuelve hoy** y no es la de la
   empresa. Desactivado, el central (`MonedaModuloLector.resolver`) devuelve la de la empresa → se
   ocultan. COSTOS pasado a otra moneda (EUR) con costeo viejo en USD → también se ocultan.
   La pantalla de configuración ya llama `MonedaModuloService.refrescar()` al guardar/desactivar.
2. `cargarCostoActual`: `costoActual` redondeado a los decimales de la moneda de la empresa
   (`redondearMonto`, ya existente). Lo mostrado ya salía redondeado por `app-costo-display`; así el
   input, la diferencia y el «no hay diferencia» comparan el mismo número.

Fuera de alcance: los otros dos llamadores de `getCostoEnCosteo` (diálogos de precio y precio
especial) usan el costeo solo si coincide con la moneda del precio, para el aviso de margen; no
muestran líneas en USD y no cambian.

## Auditoría del plan (paso 5)

- Eje A: si la empresa no se resolvió al abrir, el redondeo no se aplicaba después → **aplicado**:
  se redondea en la suscripción a `empresa$` (BehaviorSubject, emite al abrir o al resolverse),
  solo con el campo sin tocar (`pristine`).
- Eje B: redondear con decimales desconocidos daría 0 → **ya cubierto**: sin empresa resuelta no se
  redondea. Precisión: el costo de la empresa pierde lo que ya no se mostraba (Gs. sin decimales);
  solo se guarda si el usuario confirma un valor distinto. **Aceptado.**
- Eje B: `monedaDe` se cachea por sesión; si otra PC desactiva COSTOS, esta sigue mostrando las
  líneas hasta reloguear. Comportamiento previo de `MonedaModuloService`, solo visual. **Fuera de alcance.**

## Datos nuevos

Ninguno: no hay campo, columna ni clave nueva.

## Tests

N/A de batería en desktop (§1 paso 9: el CI no corre Karma). Gate: `npm run check`.
Prueba por pantalla (web local contra central local con COSTOS configurado/desactivado):
- COSTOS = Dólar y producto costeado en USD → se ven las líneas en Dolar.
- COSTOS desactivado → no se ven.
- «Nuevo costo» arranca redondeado (sin decimales en Gs.); Guardar sin cambiar → «No hay diferencia».

## Resultado (12/11/2026)

- `npm run check`: verde (solo los warnings CommonJS de siempre).
- Por pantalla: desktop de la rama (`ng serve -c web`, 127.0.0.1:4200) contra un central de `develop`
  local en el 8081 (`bodega`, sin migraciones pendientes), usuario MR. Producto 150 con una fila de
  costo de prueba costeada en USD (0,8378 / 1,00 US$, costo de la empresa 5161.1111111111):
  - COSTOS = Dólar → se ven «Costo actual en Dolar 0,8378 US$» y «Última compra en Dolar 1,00 US$»;
    el input arranca en `5161`; Guardar sin cambios → «No hay diferencia»; 5200 → +39 Gs. / +0,8 %.
  - COSTOS desactivado (por la pantalla, sin recargar) → sin las líneas en Dolar; el central sigue
    devolviendo `monedaCosteo` DOLAR y `monedaDeModulo(COSTOS)` GUARANI: las oculta el fix.
  - COSTOS = Real con el costeo en USD → sin líneas en otra moneda.
- Datos de prueba borrados (configuraciones de COSTOS y fila de costo 207097, secuencias restauradas).

## Auditoría del diff (paso 8)

- Fijo 1: N/A — sin resolver ni acción nueva; `monedaDeModulo` ya la consulta `MonedaModuloService`.
- Fijo 2: N/A — sin migración, `.graphqls` ni modelo nuevo.
- Fijo 3: sin bloqueantes. Central viejo: el diálogo abre, muestra y guarda (sin costeo
  `getCostoEnCosteo` da null; sin `monedaDeModulo`, `monedaDe` cae a la empresa). Ids siempre
  pedidos en las dos queries. `setValue` no pisa lo escrito (`pristine`). Teórico, aceptado: si la
  moneda de la empresa cambiara de decimales con el diálogo abierto, el redondeo previo no se recupera.
- Condicionales: no aplican (ni release ni datos replicados).

## Sin verificar

- Contra un central sin `monedaDeModulo` (viejo) `monedaDe` cae a la empresa → no se muestran las
  líneas. Aceptado: sin esa consulta tampoco existe el costeo en otra moneda.
