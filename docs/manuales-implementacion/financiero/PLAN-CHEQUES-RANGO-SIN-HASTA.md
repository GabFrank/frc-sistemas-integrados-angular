# Plan — Dashboard de cheques con el rango incompleto (desktop #811)

Rama `fix/cheques-dashboard-rango-sin-hasta` desde `develop` (`98a02ba0`). Solo desktop. Este archivo se borra en el
PR.

## Problema

`cheques-dashboard.component.ts` arma el rango con `desdeStr` / `hastaStr`, que devuelven `null` si su control está
vacío (fecha borrada, rango a medio elegir, texto que el datepicker no puede leer). Las tres consultas que lanza
`recargar()` lo declaran obligatorio en el central: `chequesDashboard(desde: String!, hasta: String!)`,
`chequesResumenPorDia(desde: String!, hasta: String!)` y `chequesSaldosPorChequera(hasta: String!)`. Con un `null` el
central rechaza el documento entero: la lista no se actualiza y no hay aviso (solo consola / `main.log`).

Disparan la carga, además de «Aplicar» y el `dateChange` del «hasta»: los presets, el cambio de estado, de tipo de
fecha y de chequera, el botón de refrescar y la recarga tras cobrar o anular un cheque (`ejecutar` → `recargar`).
Por eso el arreglo va en el origen del valor, no en cada disparador.

## Cómo se llega al rango incompleto (verificado en Material 15.1.5)

El camino más común no es borrar a mano: con un rango ya elegido, al tocar una fecha nueva en el calendario Material
arranca otro rango, deja el fin vacío y **emite `dateChange` del input final con el calendario todavía abierto**
(`datepicker.mjs:3983-3992`: `!change.selection.end` cuenta como cambio). El `(dateChange)="aplicarFiltros()"` del
html consulta en ese momento con `hasta = null`.

## Cambio

1. **No consultar a mitad de la selección**: el `(dateChange)` del «hasta» pasa a `onHastaChange()`, que solo recarga si
   el «hasta» tiene fecha. Al elegir el fin, el `dateChange` siguiente recarga con el rango completo.
2. **Completar el rango en los controles** en `recargar()`, con calendario cerrado (`@ViewChild` del `rangoPicker`):
   la punta vacía toma la otra; las dos vacías, hoy. Con `setValue(…, { emitEvent: false })`: el usuario **ve** lo que
   se consulta (lista, KPI «Total del filtro» y saldos «hasta la fecha» quedan coherentes con los campos). Con el
   calendario abierto no se escribe: sobreescribir el modelo a mitad de selección le cambiaría el clic siguiente.
3. **Getters `desdeStr` / `hastaStr` con la misma regla** (puros, sin escribir): cualquier disparador que corra con el
   calendario abierto (por ejemplo la recarga al terminar un cobro o una anulación) igual manda fechas válidas.

| desde | hasta | se consulta y se muestra |
|---|---|---|
| D | H | D – H (como hoy) |
| D | vacío | D – D (un día) |
| vacío | H | H – H (un día) |
| vacío | vacío | hoy – hoy, con el «Fecha de» elegido (emisión, pago o cobro) |

Los saldos del costado («pendiente hasta la fecha») usan el mismo «hasta», igual que con un rango elegido a mano.

Diferencia con la propuesta de la issue: no se deshabilita «Aplicar»; con el rango completado no hay consulta
inválida, y un botón deshabilitado no cubriría los demás disparadores.

## Fases

| Fase | Contenido | Tests |
|---|---|---|
| 1 | `onHastaChange`, completar en `recargar()` (calendario cerrado), getters con la regla | spec nuevo del componente sin TestBed (8 dependencias stub): `recargar()` con las 4 filas → ninguna de las tres consultas recibe `null` (falla con el código viejo) y los controles quedan completados; `onHastaChange()` con «hasta» vacío no consulta. Karma a mano con tsconfig acotado (el CI no corre Karma). `npm run check` |

## Pruebas de runtime

Desktop web (`ng serve -c web`) contra un central local en 8081, mirando la red y la consola:

1. Con un rango elegido, abrir el calendario y tocar una fecha nueva: **no sale ninguna consulta** hasta tocar el fin;
   al tocarlo, una sola recarga con el rango nuevo. Sin errores de GraphQL.
2. Borrar «Hasta» y «Aplicar»: el campo se completa con «Desde», la lista y los saldos son de ese día.
3. Borrar «Desde» y «Aplicar»: se completa con «Hasta».
4. Borrar los dos y «Aplicar»: queda hoy – hoy.
5. Con el rango incompleto, cambiar estado, chequera y refrescar: sin errores, y el campo queda completado.

## Riesgo y reversa

Bajo: solo cambia qué fecha se manda cuando falta una punta (antes fallaba). Sin cambios de API ni de base. Reversa:
revertir el commit.

## Sin verificar / fuera de alcance

- Otras pantallas con el mismo patrón de rango (`dateToString` de un control que puede estar vacío) no se revisan acá.
- Un rango invertido (desde > hasta) sigue yendo así al central; no es parte de #811.
- El Excel exporta la lista visible y no lleva el rango en el título (como hoy).
