# Plan — Cajas: filtro por turno (DIA / NOCHE / MADRUGADA)

Rama `feature/caja-filtro-turno` en **central** y **desktop**. El filial no se toca.

## Pedido

En Cajas (`financiero/pdv/caja/list-caja`) filtrar por el turno en que se abrió la caja:
DIA 08–17, NOCHE 17–01, MADRUGADA 01–08, con tolerancia porque hay cajeros que abren antes
(16:50 ya es NOCHE). Franco pidió deducir la tolerancia de producción y aprobó (2026-11-08):
**bodega 07:00 / 15:30 / 23:00, farmacia con sus propios horarios**.

## Datos de producción (último año, consulta de solo lectura, 2026-11-08)

**Bodega** (central `5552/bodega`, 18.085 cajas), aperturas por franja de 10 min:

| Turno nominal | Empiezan a abrir | Pico | Abren antes de la hora |
|---|---|---|---|
| DIA 08:00 | 07:40 | 07:50–08:10 | 36 % |
| NOCHE 17:00 | 15:50 (bulto a las 16:00) | 16:50–17:00 | 49 % |
| MADRUGADA 01:00 | 23:20 | 00:00 | 92 % |

Franjas casi vacías: 02:00–07:20 (16 cajas en el año), 15:00–15:40 (15), 21:00–22:50 (9). Bultos
chicos fuera de pico: ~300 cerca del mediodía y ~180 a las 18:30–19:10, repartidos por sucursal
(reemplazos/refuerzos). 9 sucursales no tienen madrugada (4, 6, 7, 8, 10, 20, 21, 23, 24).

**Farmacia** (central `5551/farmacia`, 6.229 cajas): picos a las 06:50–07:10 y 14:50–15:10, sin
madrugada. Primeras aperturas 04:20; valle más bajo 12:20–12:50.

**La sesión de Postgres de producción está en America/Argentina/Buenos_Aires**, no en Asunción.

## Decisiones

- **Cada turno empieza en una hora de corte y dura hasta el corte siguiente** (circular). Los
  cortes caen en franjas vacías, así que la tolerancia no parte a ningún grupo de cajeros:

  | Instancia | Turno | Ventana | Tolerancia antes del inicio nominal |
  |---|---|---|---|
  | bodega | DIA | 07:00 – 15:29 | 1 h |
  | bodega | NOCHE | 15:30 – 22:59 | 1 h 30 |
  | bodega | MADRUGADA | 23:00 – 06:59 | 2 h |
  | farmacia | DIA (mañana) | 04:00 – 12:29 | — |
  | farmacia | NOCHE (tarde) | 12:30 – 03:59 | — |

  Reparto bodega con estos cortes: DIA 7.336, NOCHE 8.242, MADRUGADA 2.507 (suman 18.085).
- **Los cortes van en una propiedad por instancia**, como `SIFEN_NOTAS_CONSULTA_ENABLED`:
  `app.caja.turnos=${CAJA_TURNOS:MADRUGADA=23:00,DIA=07:00,NOCHE=15:30}`. Bodega usa el default; el
  `.env` de farmacia lleva `CAJA_TURNOS=DIA=04:00,NOCHE=12:30`. Un turno que no figura (MADRUGADA en
  farmacia) no existe en esa instancia. No hay propiedad previa que distinga bodega de farmacia.
- **Valor mal escrito: no tumba el central.** Se loguea `ERROR` al arrancar y el filtro queda sin
  turnos (el desktop no muestra el selector). Un central caído por una variable sería peor.
- **El desktop pide los turnos al central** (query nueva `cajaTurnos`) para listar solo los que
  existen y mostrar sus horas reales en cada opción. Si la query falla (central viejo), el selector no
  aparece y la pantalla queda como hoy.
- **Hora usada: `pdv_caja.creado_en`**, la del filtro de fechas: no es nula y difiere de
  `fecha_apertura` en más de 30 min en 78 de 51.196 cajas (base local).
- **La hora se convierte a `app.timezone` dentro de la query** (`function('timezone', :zona,
  c.creadoEn)`): producción tiene la sesión en Buenos_Aires, y nada asegura que `TimeZoneConfig`
  corra antes de que Hikari abra conexiones. Verificado por SQL: con `set timezone='UTC'` y la
  conversión explícita el reparto no cambia.
- **El día se rota para que el primer corte sea el minuto 0**: `r = mod(minutos + offset, 1440)`
  con `offset = 1440 − primer corte`. Así cada turno es un rango continuo `desde ≤ r < hasta`; sin
  turno, `0..1440`; turno inexistente, `0..0`. Los parámetros nunca son nulos ni se comparan entre
  sí (auditorías A y B).
- **Una caja MADRUGADA abierta a las 23:30 cuenta en el día en que se abrió** (no cambia la regla de
  fechas).
- **Se reusa el enum `Turno`** (`domain/administrativo/enums/Turno.java`, ya en GraphQL por
  `horario.graphqls`). Sin migración. Para farmacia «DIA/NOCHE» se leen como mañana/tarde; el
  selector muestra las horas.
- **Descartado: el turno del horario del cajero** (`horario.turno`): pocos funcionarios tienen
  horario y un reemplazo saldría en el turno de su horario.

## Tabla de datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| propiedad `app.caja.turnos` / env `CAJA_TURNOS` | default en `application.properties`; `.env` de farmacia (a mano, antes del deploy) | `CajaTurnos` (componente nuevo, parsea al arrancar) |
| query `cajaTurnos: [CajaTurno]` (`turno`, `desde`, `hasta` como `HH:mm`) | `PdvCajaGraphQL.cajaTurnos` desde `CajaTurnos` | `list-caja` (`turnoList`, horas en cada opción) vía `CajaService.onGetCajaTurnos` |
| argumento `turno: Turno` de `cajasWithFilters` | `list-caja` (`turnoControl`) → `CajaService.onGetCajasWithFilters` → `CajasWithFiltersTurnoGQL` | `PdvCajaGraphQL.cajasWithFilters` → `PdvCajaService.findAllWithFilters` (rango con `CajaTurnos`) → `PdvCajaRepository.findAllWithFilters` |

## Fases

### Fase 1 — central (PR primero)

- `application.properties`: `app.caja.turnos=${CAJA_TURNOS:MADRUGADA=23:00,DIA=07:00,NOCHE=15:30}`.
- `CajaTurnos` (`service/financiero`): parsea la propiedad (cortes ordenados, sin repetidos, nombres
  del enum); `rango(Turno)` → `{offset, desde, hasta}`; `ventanas()` para la query. Valor inválido:
  `log.error` y sin turnos.
- `pdv-caja.graphqls`: `turno: Turno` en `cajasWithFilters` después de `activo`; `type CajaTurno` y
  query `cajaTurnos`.
- `PdvCajaGraphQL`: `cajasWithFilters` con `Turno turno`; `cajaTurnos()` con el mismo rol que la
  lista (`ANALISIS_DE_CAJA`), y su fila en `ControlRolMatrizTest`.
- `PdvCajaService.findAllWithFilters`: `Turno turno` después de `activo`; pasa zona, offset, desde,
  hasta.
- `PdvCajaRepository.findAllWithFilters`: `String zona, int offset, int desde, int hasta`; el JPQL
  suma `mod(hour(t) * 60 + minute(t) + :offset, 1440) >= :desde and … < :hasta` con
  `t = function('timezone', :zona, c.creadoEn)`. Probar en runtime que Hibernate lo traduce (no hay
  precedente de `hour()` en HQL en el repo); si no, `cast` o native query.
- **Tests**: unitario de `CajaTurnos` (corre en CI): bordes de bodega 06:59/07:00, 15:29/15:30,
  22:59/23:00, 00:00; config de farmacia (MADRUGADA inexistente → vacío; NOCHE cruza medianoche);
  valor inválido → sin turnos. `CajasWithFiltersTurnoIT` (estilo `CajasWithFiltersActivoIT`,
  `-Dit.caja=true`, solo lectura, sucursal 3): cada turno no vacío con todas sus cajas dentro de la
  ventana, comparando contra un SQL con la hora de Asunción explícita (no contra la hora leída en Java:
  con la JVM en UTC el `LocalDateTime` sale corrido 3 h, problema previo y ajeno al filtro), y la suma
  de los tres = total sin turno; correrlo también con `-Duser.timezone=UTC`. Ajustar `CajasWithFiltersActivoIT` a la firma nueva. Revertir el JPQL y ver
  que el IT falla. Batería `./mvnw clean verify -B -DskipFlyway=true` (copia fuera de `dev-frc` si
  jdtls molesta).

### Fase 2 — desktop

- `graphql-query.ts`: `cajaTurnos` y `cajasWithFiltersTurno` (la de `activo` + `$turno: Turno`),
  con sus clases `graphql/cajaTurnos.ts` y `graphql/cajaWithFiltersTurno.ts`.
  `cajasWithFiltersActivo` no cambia.
- `CajaService`: `onGetCajaTurnos()`; `onGetCajasWithFilters` con `turno` después de `activo`. Con
  `servidor == null || servidor` y turno, la query con turno; si no, como hoy.
- `list-caja`: en `ngOnInit` pide `cajaTurnos`; con respuesta arma `turnoList` (Todos + los turnos
  con sus horas en el texto de la opción, «Día · 07:00 a 15:30», el fin excluido) y muestra el
  `mat-select` en la fila del maletín; sin respuesta no lo muestra. Elegir un turno llama `onFilter()`; `onResetFilter` lo vuelve a null.
- `ultimas-cajas-dialog`: pasa `null` en la posición nueva.
- **Tests**: N/A batería (el CI del desktop no corre tests). Gate `npm run check`.

## Prueba de runtime (local)

Central de la rama en 8081 (perfil dev), desktop `ng serve -c web`, usuario MR.

1. Cajas, sucursal 3 con un rango que tenga los tres turnos: Todos / Día / Noche / Madrugada →
   cada total coincide con un `count` por SQL con la misma regla; las horas de la lista caen en la
   ventana; página 2 respeta el filtro.
2. Turno + Abiertas/Cerradas juntos.
3. Limpiar vuelve a Todos.
4. Central con `CAJA_TURNOS=DIA=04:00,NOCHE=12:30`: el selector muestra solo Día y Noche con esas
   horas y filtra con ellas.
5. Central con un valor inválido: arranca, loguea el error, el selector no aparece y la lista anda.
6. Desktop contra un central sin la rama (develop): el selector no aparece y la lista anda.
7. Últimas cajas del PDV (filial propio 8082, sucursal 24) sigue abriendo y listando.

## Orden de despliegue

1. `CAJA_TURNOS=DIA=04:00,NOCHE=12:30` en `/opt/frc-backend-central/<farmacia>/.env` **antes** de
   que el central de la rama llegue a farmacia (canal beta). Lo hace Franco (sudo). Sin la variable,
   farmacia usaría los cortes de bodega: no rompe, pero clasifica mal la mañana.
2. Central antes que desktop en cada canal. Un desktop nuevo contra un central viejo no muestra el
   selector; un desktop viejo contra el central nuevo no se entera (argumento opcional).

## Sin verificar

- La tzdata del Postgres de producción (gotchas.md: hubo JVM con tzdb vieja; Paraguay es −03 fijo
  desde oct-2024). Con tzdata vieja el filtro correría 1 h en invierno. Se verificaría con
  `select now() at time zone 'America/Asuncion'` en el central.
- El nombre exacto del directorio de farmacia en `/opt/frc-backend-central/` (leer su `.env` no se
  permitió desde esta sesión): lo confirma Franco al cargar la variable.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | Sin uso de `cajasWithFilters` en mobile ni mobile-pwa; 2 llamadores en el desktop, 1 en el central; `ControlRolMatrizTest` la nombra pero no depende de la firma | Nada que cambiar |
| A | `Turno` como argumento desde otro `.graphqls` ya funciona (`jornada.graphqls:80`) | Se reusa |
| A/B | `Integer` nulo comparado entre parámetros puede bindearse sin tipo: rompe la lista con «Todos» | Día rotado y rango siempre no nulo |
| A | La condición `servidor` tiene que conservar `servidor == null \|\|` | Se conserva |
| B | `extract(hour)` usa la zona de la sesión JDBC; producción está en Buenos_Aires | Conversión explícita con `timezone(:zona, …)`; IT con `-Duser.timezone=UTC` |
| B | Sumar `$turno` a la query de `activo` rompe Abiertas/Cerradas contra un central viejo | Query aparte; además el selector solo aparece si el central responde `cajaTurnos` |
| B | El IT no corre en CI y no prueba bordes exactos | Unitario de `CajaTurnos` con los bordes, que sí corre en CI |
| B | Sin índice sobre la expresión | Se acepta: sucursal + fechas acotan antes |
| B | Un `creado_en` nulo quedaría fuera de los tres turnos (hoy hay 0) | Se acepta |
| — | Farmacia tiene otros horarios (pedido de Franco) | Cortes por instancia en `CAJA_TURNOS`; variable nueva en el `.env` de farmacia antes del deploy (eje A, pregunta 4) |
