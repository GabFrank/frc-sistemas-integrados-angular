# Plan: la factura legal rechazada por el backend muestra solo su motivo

Issue #470. Repo: desktop. Sin cambios en el central ni en el filial.

## 1. El problema [relevado sobre `develop`]

Emitir la factura legal desde la venta (`add-factura-legal-dialog`, rama que no es «a filial»):

- Cuando el filial **rechaza** la factura con un motivo (sin timbrado activo, timbrado sin teléfono, venta
  innominada sobre el tope, `FACTURA_NO_EMITIBLE`…), `onSaveConDetalle` avisa «Ups!! Algo salio mal: <motivo>»
  y emite `null`.
- El diálogo lee ese `null` igual que un «sin respuesta» y suma «No se pudo confirmar la factura. Verifique en
  la lista de facturas si se emitió antes de volver a intentar.»
- Los avisos se encolan (`app.component.ts`): el cajero ve 5 s el motivo y después 4 s un aviso que lo manda a
  buscar una factura que no existe.

Premisa verificada en el filial (`develop`, `release/beta` y `master`): todas las validaciones de
`FacturaLegalBuilder.build()` corren antes del primer insert, el builder es transaccional, y lo que
`saveFacturaLegal` hace después de guardar (sync de persona, impresión, DE) no propaga errores desde `7780d33`
(2026-09-07). Un rechazo con errores GraphQL significa que no hay factura.

## 2. Cambio

- `FacturaLegalService.onSaveFactura` pide el error a `onSaveConDetalle` (`error = true`) y emite `{ data }` o
  `{ error }`. La impresión «desde esta PC» lee el id de `res.data` y solo imprime si no hay error.
- `onSaveConDetalle`, con la bandera `error`: si la respuesta trae errores **y** datos, emite los dos
  (`{ error, data }`). Sin la bandera sigue emitiendo `null`. El único que pide la bandera es la factura legal.
- El diálogo distingue tres salidas (`alResponderLaEmision`):
  - `data` sin `error` → éxito, como hoy.
  - sin `data` y rechazo del servidor (`esRechazoDelServidor(error)`, el discriminador de #390) → libera el
    botón y **no suma aviso**: el motivo ya lo mostró el genérico. Se puede corregir y volver a emitir.
  - cualquier otra cosa (error de red, corte por tiempo, respuesta vacía, errores con datos, respuesta sin
    datos) → `onFacturaNoConfirmada()`, como hoy.
- No se reintenta solo en ningún caso.

## 3. Lo que no cambia

- Los avisos de `onSaveConDetalle` y lo que emite sin la bandera `error`.
- La emisión «a filial» desde el central (`onSaveFacturaToFilial`): es otra mutation.
- El aviso del caso incierto.

## 4. Fases y tests

Una sola fase (genérico + servicio + diálogo + tests).

- `factura-legal.service.spec.ts` (nuevo): `onSaveFactura` con un `GenericCrudService` real y la mutation
  simulada. Guardada, guardada imprimiendo desde esta PC, rechazada (un solo aviso con el motivo), errores con
  datos, error de red, respuesta vacía, y error de red con quien llama avisando (un solo aviso).
- `add-factura-legal-dialog.component.spec.ts` (reemplaza el `should create` sin providers, que no corría):
  las salidas de `alResponderLaEmision`.
- `generic-crud.sub-y-detalle.spec.ts`: rechazo y errores con datos con la bandera `error`.

Datos nuevos: ninguno. Migraciones: ninguna.

## 5. Sin verificar

- No se reprodujo contra un backend una respuesta con errores y datos a la vez; el caso está cubierto solo por
  tests.

## Decisiones de Franco (2026-10-13)

- Implementar. No hace falta conservar el aviso de «verificar la lista» en el rechazo: todas las sucursales
  corren la última versión del filial.

## Auditoría del plan (2026-10-13, dos agentes)

| Hallazgo | Qué se hizo |
|---|---|
| A1. Un filial anterior a `7780d33` responde error con la factura ya guardada; el desktop lo leería como rechazo | Cubierto por la decisión de Franco. No hay control de versión en el desktop |
| A2. «Timbrado sin teléfono», `FACTURA_NO_EMITIBLE` y venta innominada sobre el tope solo existen en `develop` del filial; en beta y master el síntoma se ve con «sin timbrado activo» y «sin sucursal» | Anotado; la prueba de runtime usa «sin timbrado activo» |
| A3 / B2. Errores con datos parciales se leían como rechazo | Aplicado: el genérico pasa los datos y el diálogo lo trata como incierto |
| A5 / B3. `{ data: null }` sin errores | Ya iba a incierto; se agregó el test |
| B1. El aviso único del caso incierto depende de que el diálogo avise de forma síncrona | Test agregado en el spec del servicio |
| B4. Si `handleFacturaSuccess` lanza, el botón queda tomado sin aviso | Preexistente y del lado seguro; no se toca |
| B5 / B6. Armado de los specs | Servicio y diálogo se instancian a mano; la decisión del diálogo quedó en un método propio |
| `onSaveFactura(…, servidor = true)` por defecto iría al central, que no tiene esta mutation | Preexistente; el único llamador pasa `false`. No se toca |

Los dos auditores coincidieron en que no hay otros llamadores y en que el filial no lanza después de guardar.

## Tests (2026-10-13)

Karma sobre los tres specs: 26 de 26. Con el genérico y el servicio sin el cambio: 6 fallan (los del servicio y
«errores con datos» del genérico).
