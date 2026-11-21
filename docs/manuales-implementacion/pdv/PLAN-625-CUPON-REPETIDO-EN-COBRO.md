# Plan #625 — el mismo cupón escaneado en dos líneas del mismo cobro

Rama `fix/pdv-cupon-repetido-en-cobro`, desde `origin/develop` dbaec8f0. Solo desktop. La parte de
backend (lock por cupón y por cobro) ya está: filial #278 (mergeado) y #279.

## Problema

Venta 81509 de Itaipú: dos líneas de tarjeta con el mismo cupón. En `pago-touch`, `procesarCupon`
(el punto común de las dos puertas de lectura) pregunta al backend `onMotivoCuponNoUsable`, que
solo ve cupones **ya guardados**; y si el diálogo ya preguntó (`datosCupon.verificado`) ni eso. Nadie
mira las otras líneas del cobro en memoria: el mismo cupón en dos líneas pasa las dos veces. Hoy el
backend (#278) rechaza el segundo al completar, pero recién después de guardar la venta: la línea
queda PENDIENTE, sale una seña y el cajero se entera tarde.

Reproducido por pantalla el 21/11 (venta local 79361): dos líneas R$ 50 con el mismo QR, las dos
con ✔ en el cobro.

## Arreglo (una fase)

1. `cobro-tarjeta.ts`: `lineaConMismoCupon(lineas, item, datosCupon): CobroDetalle | null`, función
   pura. Otra línea (no `item`) con `datosCupon` que sea el mismo cupón, con la misma regla que el
   backend (`motivoCuponNoUsable`):
   - mismo `qrCrudo` (recortado, no vacío); o
   - mismo `identificadorTransaccion` (recortado, no vacío); o
   - mismo `codigoAutorizacion` (recortado, sin distinguir mayúsculas) **en la misma terminal**, y
     monto **del cupón** igual o desconocido en alguno de los dos (como `montosDistintos` del
     backend; no `item.valor`).
   No filtra por `esCobroTarjetaRegistrable`: solo las líneas con cupón aplicado tienen `datosCupon`
   (es memoria; las de un delivery reabierto no lo traen).
     La terminal se compara con `Number(id)` en los dos lados (GraphQL `ID` llega como string; el
     gotcha de `Sucursal.id`). Sin terminal en alguno de los dos cuenta como la misma (el backend
     trata la terminal nula como comodín).
2. `pago-touch.procesarCupon`: primera línea, **antes** del atajo `verificado` y antes de la
   consulta por red, síncrona y con `return`. Si hay otra línea con ese cupón:
   `avisarCuponNoUsable('Ese cupón ya está cargado en otra línea de este cobro.')`,
   `finEscaneoTarjeta()`, y no se aplica: si la línea ya tenía un cupón bueno de un escaneo anterior
   se **conserva** (igual que el rechazo por red y «Más tarde»). Mismo camino que el rechazo por red.
   Todas las puertas que aplican un cupón (`aplicarCupon` ← `evaluarCupon` / «Registrar igual»)
   pasan por `procesarCupon`, así que no hay forma de saltearla.

## Lo que NO se hace

- **Completar en serie** (punto 2 de la issue, `concatMap` en `registrarPagosConTarjeta`). Con #278
  el filial serializa `completar` por cupón y por cobro, así que en paralelo ya no se duplica. Un
  desktop con este fix **sí** puede correr contra un filial sin #278 (los canales se promueven por
  separado), pero no es regresión: el `forkJoin` es el de hoy y este fix solo agrega un corte antes
  de guardar, que cubre el caso de Itaipú. Lo que queda en ese cruce (dos QR distintos del mismo
  cobro) ya existía. Para cerrarlo: #278 en el canal antes de promover este desktop.
- Validar contra cupones de **otras ventas** en memoria: no existen; eso lo hace el backend.

## Datos nuevos

Ninguno.

## Tests

- `cobro-tarjeta.spec.ts`: mismo QR (con espacios) → la otra línea; misma referencia; mismo código
  y terminal (ids `'3'` y `3`) con montos iguales o uno desconocido; mismo código en **otra**
  terminal → null; mismo código con montos distintos → null; terminal faltante → cuenta como la
  misma; la propia línea no cuenta; líneas sin cupón → null.
- Karma está roto en el repo (`require.context`): se corre con un `tsconfig` temporal acotado a
  ese spec (memoria «Desktop: arranque sin xvfb»). Control: la función como stub que devuelve
  `null` (revertirla del todo daría error de compilación, no rojo).
- El cableado en `procesarCupon` (antes de `verificado`) no tiene test automático: el componente
  no se testea en este repo. Lo cubre la prueba por pantalla, por las dos puertas.
- `npm run check` (AOT) al final.

## Prueba por pantalla

Desktop servido estático, PDV de la 24 contra el filial propio: venta con dos líneas de tarjeta y el
mismo QR en las dos → la segunda avisa «Ese cupón ya está cargado en otra línea de este cobro…» y
queda pendiente; con dos QR distintos, las dos con ✔. Por **las dos puertas**: el input único del
primer diálogo (QR que resuelve la terminal) y el diálogo de cupón después de elegir la terminal
(que marca `verificado: true`); en este el aviso llega después de cerrarse, por snackbar. Y la
rama del código: dos cupones distintos con el mismo código de autorización, misma terminal y mismo
monto (cupón retipeado) → la segunda avisa.

## Auditoría del plan (paso 5)

Ejes A y B, los dos «aceptar con reservas», sin bloqueos. Aplicado: terminal comparada con
`Number()` y nula = comodín (como el backend), monto del cupón, el cupón bueno anterior se conserva
al rechazar, control con stub en vez de revertir, prueba por las dos puertas y por la rama del
código, justificación correcta de no serializar. Verificado sin hallazgo: todas las puertas que
aplican un cupón pasan por `procesarCupon`; PagoTouch se abre desde venta-touch y venta crédito y
los dos pasan por ahí; las líneas de un delivery reabierto no traen `datosCupon`; borrar una línea
la saca de la comparación; mobile y PWA no tienen un cobro con varias tarjetas.
Anotado sin cambio: `escanearTarjeta` pisa `item.terminalPos` antes de validar el cupón (heredado,
igual que el rechazo por red); el cableado en `procesarCupon` solo lo cubre la prueba por pantalla. Con la línea rechazada, «Registrar más
tarde» y finalizar: la venta se guarda y la línea queda PENDIENTE (sin seña de rechazo del
backend). Datos y config restaurados al final.

## Compatibilidad y despliegue

Sin cambio de GraphQL. Al mergear a `develop` sale como alpha del desktop; el cajero lo recibe al
aceptar la actualización. Rollback = revertir.
