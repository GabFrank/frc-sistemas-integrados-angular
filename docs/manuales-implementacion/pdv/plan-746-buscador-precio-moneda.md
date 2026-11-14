# Plan #746 — el buscador de productos (F9) muestra el precio con su moneda

Rama `fix/pdv-buscador-precio-moneda` desde `develop` (523bcdd2). Solo desktop.

## Causa

`pdv-search-producto-dialog.component.html:399` pinta `precio?.precio | number : "1.0-0"`: un precio
PROMOCION de 5,85 USD sale «6». Es solo de pantalla (al elegirlo se cobra bien).

## Fase 1 — tarjeta del tipo de precio con moneda

- `pdv-search-producto-dialog.component.ts`: inyectar `PrecioMonedaService` y copiar `monedaDe()` /
  `digitosDe()` de `producto-categoria-dialog.component.ts:221` (mismo patrón, misma fuente:
  `monedaPdvDe(precio.id)` sobre `mapaPdv`, que llena la venta al abrir el PDV).
- `.html:399`: `<ng-container *ngIf="monedaDe(precio) as m; else …">{{ m.simbolo }} {{ precio | number: digitosDe(m) }}</ng-container>`,
  con el `"1.0-0"` de hoy como `else` (precio en la moneda de la empresa = sin cambio).
- Llamar funciones desde el HTML va contra la regla #1; se sigue igual porque es el patrón ya
  aceptado en la tarjeta de categorías y el `*ngFor` de precios no tiene un modelo propio donde
  precalcular. Costo: un `Map.get` por tarjeta por ciclo.

## Datos nuevos

Ninguno: no hay campo, columna ni clave nueva. N/A.

## Alcance y llamadores

El diálogo lo abren 18 pantallas (PDV, entradas, salidas, transferencias, inventario, reportes…).
Fuera del PDV `monedaEmpresaConPdvEnOtraMoneda` es `null` (lo limpia el `ngOnDestroy` de la venta), así
que un precio de la empresa se ve como hoy. `mapaPdv` no se limpia al salir del PDV: después de abrirlo
una vez, un precio en otra moneda muestra su símbolo también desde otras pantallas (correcto, los ids de
precio son globales). Antes de abrir el PDV en la sesión, o si el F9 se abre antes de que termine la lectura
del mapa, se ve como hoy (no se refresca solo).

## Auditoría (paso 5)

- Eje A: sin cambio de contrato GraphQL; ningún spec construye el diálogo. Riesgo menor: `mapaPdv` viejo
  fuera del PDV (`precio-moneda.service.ts:146`). No se toca: se relee al abrir el PDV y antes de cobrar;
  solo daría un símbolo viejo si un precio cambia de moneda con el PDV cerrado. Queda anotado.
- Eje B: sin OnPush (la función del template se reevalúa); `digitosDe` da `1.0-0` para Gs con PDV en USD.
  Hallazgo aplicado: copiar también la guarda `precio == null → null` de `monedaDe`. Sugerencia de spec de
  `monedaPdvDe`: no se aplica, el fix no cambia ese método.
- Plan presentado sin aprobación explícita (sesión en segundo plano): se implementa directo y se anota.

## Tests

N/A para desktop (CI sin batería, §1 paso 7). Gate: `npm run check`. Prueba por pantalla: desktop web
contra filial local, PDV en Gs, F9, producto con un precio en USD → «US$ 5,85»; un precio en Gs sigue
«15.205»; abrir el buscador desde otra pantalla (p. ej. transferencias) y ver que no cambia.

## Sin verificar

- PDV en USD con precio en Gs («Gs. 37.733»): lo resuelve `monedaPdvDe` igual que en categorías; se
  prueba si la filial local permite abrir un PDV en otra moneda.
