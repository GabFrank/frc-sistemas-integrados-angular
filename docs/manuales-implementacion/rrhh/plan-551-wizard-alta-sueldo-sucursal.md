# Plan — #551: el wizard de alta guarda mal sueldo y sucursal

Rama: `fix/rrhh-wizard-sueldo` (desde `origin/develop` 5ae0c215). Pieza: solo desktop.

## Problema

`funcionario-wizard.component.ts`, `guardarFuncionario()`:

```ts
funcionario.sucursal = this.sucursalFuncionario.value;   // un número, no una Sucursal
funcionario.sueldo = this.sucursalFuncionario.value;     // el id de la sucursal
```

1. **Sueldo** (lo que reporta el issue): se guarda el id de la sucursal en vez del «Sueldo final».
2. **Sucursal** (no estaba en el issue): `Funcionario.toInput()` manda `sucursalId = this.sucursal?.id`.
   Con un número, `?.id` es `undefined`, y en un alta el central (`FuncionarioGraphQL.saveFuncionario`)
   solo asigna sucursal si llega `sucursalId`. El funcionario nace **sin sucursal**.

Evidencia en la base local (`bodega@5551`), altas hechas por el wizard (`pre_registro_funcionario`
verificado): 240, 239 y 238 tienen `sucursal_id` NULL y `sueldo` 13, 13 y 1; las que tienen
sucursal la ganaron después, al editar el legajo (por eso además tienen `creado_en` NULL, el bug
de central#452).

## Fase única

```ts
funcionario.sucursal = this.sucursalList.find(s => s.id == this.sucursalFuncionario.value);
funcionario.sueldo = this.sueldoFuncionario.value;
```

- `sucursalList` ya está cargada (el select se arma con ella y `cargarDatos()` la usa).
- `sueldoFuncionario` usa `currencyMask`: el valor es un número.
- `sueldoFuncionario` suma `Validators.min(1)`: la máscara de guaraníes tiene `allowZero` y
  `allowNegative`, y al borrar el monto deja `0`, que `required` acepta (hallazgo del eje B).

## Auditoría (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| B | `required` no frena el sueldo 0 | `Validators.min(1)` |
| A | Con sucursal, el central también crea el `cliente` de la persona con sucursal (`saveFuncionario`) | Buscado: es lo correcto. `funcionario` y `cliente` están en `central_pub` sin filtro por fila, así que siguen llegando a las mismas filiales. Se mira `cliente.sucursal_id` en la prueba |
| A y B | `find` podría dar `undefined` | Descartado: el select solo ofrece ids de `sucursalList` y es obligatorio |
| A | `cargarDatos()` revienta si el nombre de sucursal del pre-registro no está en la lista | Ya pasaba antes; fuera de alcance |
| B | Si falla el guardado del pre-registro, no hay compensación | Ya pasaba antes; fuera de alcance |
| B | Un desktop sin actualizar sigue grabando mal | La consulta de afectados se repite después del despliegue a stable |
| B | Liquidaciones, aguinaldos y vales ya calculados con el sueldo malo | Fuera de alcance: lo decide RRHH; el sueldo se corrige por «Cambiar salario» (con histórico), no por UPDATE |

Tests: N/A para desktop porque su CI no corre tests y no hay batería confiable (ciclo §1 paso 7).
Gate: `npm run check` leído del log. Prueba por pantalla: desktop `ng serve -c web` contra central
local 8081, alta por el wizard y `select sucursal_id, sueldo from personas.funcionario` del nuevo.

## Datos nuevos

Ninguno: no hay campo, columna ni clave nueva.

## Fuera de alcance

- **Corregir los funcionarios ya afectados en producción.** El sueldo correcto solo lo sabe RRHH.
  Se le pasa a Franco la consulta para encontrarlos (incluye los que quedaron sin sucursal, que la
  consulta del issue no encuentra):

  ```sql
  select f.id, f.sucursal_id, f.sueldo, p.sucursal
  from personas.pre_registro_funcionario p
  join personas.funcionario f on f.id = p.funcionario_id
  where f.sucursal_id is null or f.sueldo is null or f.sueldo < 1000;
  -- sin filtro por activo: los inactivos también pudieron cobrar con el sueldo malo
  ```

## Prueba (2026-10-20)

Central `develop` (32c19a1d) en 8081 con perfil `dev`, desktop de la rama con `ng serve -c web`, usuario MR,
pre-registro de prueba creado por SQL y borrado al final (con su persona, usuario, cliente y funcionario).

| Caso | Resultado |
|---|---|
| Escribir un sueldo y borrarlo | el control queda en `0`, error `min`, Guardar deshabilitado |
| Escribir `0` | ídem |
| Sueldo 3.000.000, sucursal 13, crédito 100.000 → Guardar → Sí | `funcionario`: `sucursal_id` 13, `sueldo` 3000000; `cliente.sucursal_id` 13; pre-registro verificado |

`npm run check`: verde. El primer intento falló con «Unterminated string token» en
`notification-board.component.scss`, un archivo que el diff no toca, mientras el `ng serve`
todavía se cerraba sobre la misma `.angular/cache`; el segundo intento pasó.

**Encontrado aparte, sin tocar:** «Solicitudes de funcionarios» muestra solo la primera página (10
filas, sin orden): `list-pre-registro-funcionario` no pasa `isCargarMas` al listado genérico y su
botón «CARGAR MAS» está comentado. Para la prueba, el wizard se abrió con
`onRegistrarFuncionario` desde la consola.

## Auditoría del diff (paso 8)

| Eje | Resultado |
|---|---|
| Fijo 1 — Autorización | El diff no abre nada nuevo. Hallazgo previo de permisos, fuera de alcance: se pasa por privado |
| Fijo 2 — Esquema | Sin campos nuevos ni espejo en filial: `sueldo` Float→BigDecimal y `sucursalId` ya existían |
| Fijo 3 — Contrato | `saveFuncionario` igual en develop, beta y master: el alta con `sucursalId` y `sueldo` anda en los tres canales. `ipsActivo`/`cobraBanco` siguen en NULL en un alta en los tres canales hasta que entre central#459 (el auditor dijo que develop ya lo tenía; verificado que no) |
| Condicionales A y B | N/A: el diff no toca release ni nada que viaje entre nodos más allá de los valores ya replicados |

## Sin verificar

- Cuántos funcionarios de producción están afectados (no se consulta producción desde acá).
