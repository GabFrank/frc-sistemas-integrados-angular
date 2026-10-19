# Plan — filtro «Cobra IPS» en el listado de funcionarios

Pedido de Franco (2026-10-19): en la lista de funcionarios, quitar el filtro «Diarista» y poner en
su lugar un filtro «Cobra IPS» para ver quiénes cobran por IPS.

- Dato: `personas.funcionario.ips_activo` (el toggle «Inscripto en IPS» del legajo). Ya existe; no
  hay migración.
- Piezas: **central** y **desktop**, rama `feature/rrhh-filtro-cobra-ips` en las dos, un PR por repo
  hacia `develop`. Molde: el filtro «Cobra por banco» (central `cb293618`, desktop `dde32dff`).
- **Filial, mobile y mobile-pwa: N/A.** Ninguno usa `funcionariosWithPage` (grep en los tres) y el
  listado consulta siempre al central (`onGetAllWithPage(..., servidor = true)`).

## Fases

### Fase 1 — central

- `funcionario.graphqls`: `funcionariosWithPage(..., cobraBanco: Boolean, ipsActivo: Boolean)`.
- `FuncionarioGraphQL.funcionariosWithPage`, `FuncionarioService.findAllWithPage` (la de 8 filtros)
  y `FuncionarioRepository.findAllWithFilterAndPage` reciben `ipsActivo` al final.
- JPQL: `(cast(:ipsActivo as boolean) is null or coalesce(u.ipsActivo, false) = :ipsActivo)`. El
  `coalesce` hace que un `null` cuente como «No», igual que lo muestra el legajo (`!!f.ipsActivo`).
- El parámetro `diarista` **se queda** en el schema: sacarlo rompe a un desktop viejo que lo manda.
- Tests: los dos IT que llaman a `findAllWithPage` por posición (`FuncionarioFiltroCobraBancoIT`,
  `FuncionarioBusquedaNicknameIT`) suman el argumento. IT nuevo `FuncionarioFiltroIpsIT` con el
  mismo esquema que el de banco: el marcado aparece en «Sí», no en «No», uno puesto en `null`
  aparece en «No» y no en «Sí», y Sí + No = Todos.
- La sobrecarga de 4 argumentos (`FuncionarioService.java:37-38`) suma un `null`.
- Gate: `./mvnw -q compile test-compile` + los tres IT con `-Dit.funcionario=true`.

### Fase 2 — desktop

- `list-funcioario.component`: `diaristaControl` → `ipsActivoControl`; el `mat-select` «Diarista»
  pasa a «Cobra IPS» (Todos / Sí / No) en el mismo lugar.
- `funcionario.service.ts` y `funcionariosWithPageQuery`: `diarista` → `ipsActivo` (el listado era
  el único que lo mandaba).
- Tests: N/A para desktop (Karma no corre en esta máquina ni en ningún gate). Gate: `npm run check`.

## Orden de despliegue

**Central antes que desktop, en cada canal.** Un desktop que manda `$ipsActivo` a un central sin el
argumento recibe error de validación, y el listado y el buscador de «Lucro por funcionario» quedan
vacíos. El PR del desktop se mergea después de que el central con el filtro esté desplegado en
alpha. Lo mismo vale al promover a `release/beta` (farmacia) y a `master` (bodega), y para la web:
primero el central de ese canal. Va escrito en el cuerpo de los dos PRs.

## Datos nuevos

Ninguno. `ips_activo` lo escribe el legajo (`informacion-general.component`, `saveFuncionario`) y lo
leen la liquidación y ahora este filtro.

## Prueba de runtime

Central local (8081, perfil dev, `-Dspring.main.lazy-initialization=false`) + `ng serve -c web`:
con el filtro en Sí / No / Todos, comparar contra
`select ips_activo, count(*) from personas.funcionario group by 1`. Tildar «Inscripto en IPS» en un
legajo y ver que pasa de «No» a «Sí» (en la base local no hay ninguno en `true`; se restaura al
final). Revisar que «Limpiar filtros» lo vuelva a Todos y que el buscador de «Lucro por
funcionario» siga trayendo resultados.

## Rollback

- **Desktop**: `git revert` normal. El central sigue aceptando `diarista`.
- **Central, una vez que salió el desktop nuevo**: revertir solo el predicado del JPQL, **nunca** el
  argumento del schema ni la firma. Sin el argumento, el listado del desktop nuevo falla entero, y
  ese desktop no se puede bajar a la fuerza (el usuario posterga el update).

## Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| «Central antes que desktop» estaba escrito para un canal. Promover el desktop a beta o stable sin el central de ese canal deja el listado vacío en farmacia o bodega | A, B | **Aplicado**: la regla vale en cada canal (alpha, beta, stable y la web) y para los dos centrales. Va en el cuerpo de los dos PRs |
| Segundo llamador de la query en el desktop: `lucro-por-funcionario.component.ts:501` (buscador, solo manda `nombre`) | A | **Aplicado**: no se rompe al quitar `$diarista`, pero entra en la prueba de runtime |
| La sobrecarga de 4 argumentos `FuncionarioService.java:37-38` llama al repositorio por posición | A | **Aplicado**: suma un `null` en la fase 1 |
| `null` en `ips_activo`: el wizard de alta no manda el campo y el mapper inserta `NULL`; la liquidación descuenta IPS con `null` (`LiquidacionSueldoService:253`, `LiquidacionFinalService:226,253`) y el filtro lo mostraría como «No» | B | **Aceptado con medición**: el filtro sigue al legajo (lo que el usuario ve y edita). Base local: 488 en `false`, 0 en `null`, 0 en `true`. Medir en cada central antes del deploy y avisar a Franco. Unificar el criterio va en un issue aparte |
| El IT no fija la semántica del `null` si la base no tiene filas en `null` | B | **Aplicado**: el IT pone un funcionario en `null` dentro de la transacción y verifica que cae en «No» |
| El central local tiene `lazy-initialization=true`: un JPQL roto no falla al arrancar | B | **Aplicado**: la prueba de runtime arranca con `-Dspring.main.lazy-initialization=false` |
| Rollback del central con el desktop nuevo afuera | B | **Aplicado**: sección «Rollback» |

## Qué queda sin verificar

- Cuántos `null` hay en `ips_activo` en los centrales de producción (consulta de solo lectura antes
  del deploy: `select ips_activo, count(*) from personas.funcionario where activo group by 1`).
- Discrepancia preexistente, fuera de este cambio: la liquidación descuenta IPS con `null` y el
  legajo lo muestra como no inscripto.
