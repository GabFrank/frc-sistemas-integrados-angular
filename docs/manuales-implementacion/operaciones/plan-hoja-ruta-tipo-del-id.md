# Plan — hoja de ruta: el tipo de los ids en las queries del desktop (#560)

Rama: `fix/transferencia-hoja-ruta-id` (desde `develop`). Una sola pieza: desktop.

## Problema

El central (`hoja-ruta.graphqls`) declara los argumentos `ID!` y el desktop
(`transferencia/graphql/graphql-query.ts`) los manda como `Int!`. graphql-java rechaza la
consulta antes de ejecutarla («VariableTypeMismatch»).

| Operación | Desktop | Central | ¿Quién la llama? |
|---|---|---|---|
| `hojaRuta(id)` | `Int!` | `ID!` | `onGetHojaRuta`: precarga de `verificar-transporte-dialog`; `ruta-hoja.component` (solo con `data.hojaRutaId`, que hoy nadie pasa) |
| `hojaRutaPorVehiculo(vehiculoId)` | `Int!` | `ID!` | nadie |
| `hojaRutaPorChofer(choferId)` | `Int!` | `ID!` | nadie |
| `hojaRutaActivaPorVehiculo(vehiculoId)` | `Int!` | `ID!` | nadie |
| `deleteHojaRuta(id)` | `Int!` | `ID!` | `onDeleteHojaRuta`, sin llamadores |

El filial no tiene schema de hoja de ruta: todas van al central. La PWA no usa estas queries.

## Fase 1

Las cinco pasan a `ID!`. Sin cambios de servicio ni de componentes: el valor sigue siendo un número
y GraphQL lo acepta como `ID`.

## Tests

Paso 9: el desktop no tiene batería en ningún gate. Gate: `npm run check`. Runtime en local
(central `develop` en 8081 + desktop web):

- Verificar para transporte en una transferencia con hoja: sin aviso de error, vehículo y
  acompañantes precargados.
- Sin hoja: igual que antes.
- Las cuatro sin llamador y el camino de `ruta-hoja` con `hojaRutaId`: no hay pantalla; se mandan
  los documentos del desktop al central local desde la página (mismo token) y se verifica que no
  vuelvan con error de validación.

## Sin verificar

- `ruta-hoja` con `hojaRutaId` por pantalla: ningún llamador lo abre así.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | ¿Algún canal del central declara `Int!`? | `master`, `release/beta` y `develop` declaran `ID!` (leído por la API de GitHub) |
| A | No hay más queries con el desajuste; filial y app Android no tienen hoja de ruta; la PWA solo la lee anidada | sin cambios |
| A | `ID!` con valor numérico: mismo patrón que `transferenciasPorHojaRuta`, que ya anda | se prueba por pantalla |
| B | La precarga empieza a funcionar y el confirm solo nombra al chofer: vehículo y acompañantes viejos se confirman sin mirarlos | es el comportamiento diseñado (igual que la PWA); la hoja anterior no se toca |
| B | `deleteHojaRuta` por API | con un id inexistente, para no borrar datos |
