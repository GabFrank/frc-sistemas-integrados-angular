# Rol `RRHH SUCURSAL` en el desktop

RRHH acotado: un gerente que liquida sueldos y finiquitos solo de los funcionarios de las sucursales a
su cargo, y paga desde su caja los ya aprobados. Quien decide es el central (`RrhhAlcanceService`); acá
solo se evita mostrar lo que el central va a rechazar. Reglas en `modules/rrhh/rol-rrhh-sucursal.ts`.

## Qué cambia en pantalla

- **Menú**: el grupo R.R.H.H. y «Liquidaciones» aparecen también con `RRHH SUCURSAL` (y con
  `RRHH LIQUIDAR`, que veía la entrada y no podía abrirla).
- **Liquidaciones**: el listado llega ya acotado. En modo acotado hay un botón **Finiquito**, porque
  el rol no entra al legajo: elige a un funcionario suyo y sigue el mismo camino que el legajo
  (finiquito vigente o diálogo para generarlo).
- **Generar liquidaciones**: «Todos» dice «de mis sucursales»; el buscador de funcionarios usa
  `funcionariosACargo` (`<app-select-funcionario [soloACargo]="true">`).
- **Detalle de liquidación y de finiquito**: el rol agrega, edita y quita ítems y regenera. No ve
  «Aprobar», «Volver a borrador», el campo de otro período ni la anulación de un ítem programado.
- **Egreso de la caja**: quien opera acotado y además tiene `RRHH SUCURSAL` ve «Pagar Liquidación» y
  «Pagar Finiquito». El diálogo de pago ya trabaja en efectivo desde esa caja para el rol acotado.

## Consultas nuevas

- `funcionariosACargo(texto, soloActivos)`: buscador del rol acotado. Solo lo piden el selector con
  `soloACargo` y el botón «Finiquito».

El resto son las consultas de siempre: el central las acota por rol.
