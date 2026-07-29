# Testing del módulo RRHH

Estrategia de pruebas para el módulo de Recursos Humanos (backend `central` +
desktop). Se prioriza **testear la lógica de dinero de forma aislada** (cálculos
puros, sin Spring ni DB) y dejar el flujo de UI cubierto por un e2e de humo que
se corre en un ambiente dev real.

## 1. Tests internos (backend) — lógica pura

Las fórmulas de dinero se extrajeron a clases puras bajo
`com.franco.dev.service.rrhh.builder` (mismo patrón que `financiero/builder` y
`productos/builder`), lo que permite testearlas sin levantar el contexto Spring.

| Calculadora | Fórmula | Test | Usada por |
|---|---|---|---|
| `LiquidacionCalculator` | neto = Σ haberes − Σ descuentos | `LiquidacionCalculatorTest` | Fase 5 · liquidación |
| `PenalizacionCalculator` | monto = fijo + porMinuto × minutos | `PenalizacionCalculatorTest` | Fase 2 · penalización tardanza |
| `AguinaldoCalculator` | meses = 12 − mesIngreso + 1; monto = sueldo × meses / 12 | `AguinaldoCalculatorTest` | Fase 4 · aguinaldo |
| `CuotaCalculator` | cuotaBase = total / n; última absorbe redondeo | `CuotaCalculatorTest` | Fase 3 · préstamos |

**Total: 23 casos** (4 liquidación + 5 penalización + 8 aguinaldo + 6 cuotas).

### Cómo correrlos

En un entorno con acceso normal a dependencias:

```bash
cd franco-system-backend-servidor
./mvnw test -Dtest='*CalculatorTest' -DskipFlyway=true
```

> **Nota (entornos restringidos):** si el proxy bloquea GitHub Packages, las
> dependencias de SIFEN (`jsifenlib`, `itext`) no resuelven y `mvnw test` falla
> al compilar las fuentes de `service/sifen`. Las calculadoras **no dependen de
> SIFEN**: se pueden compilar y correr aisladas con `javac` + el
> `junit-platform-console-standalone`, apuntando solo a los `.java` de
> `service/rrhh/builder`. Así se validaron los 19 casos nuevos (todos verdes).

## 2. E2E (desktop) — flujo de humo

`e2e/rrhh-liquidacion.spec.ts` — esqueleto Playwright + Electron que cubre:
login con usuario RRHH → abrir **Liquidaciones** desde el sidenav → generar
borradores del mes → abrir el detalle y verificar haberes/descuentos/neto.

Está **guardado con `RRHH_E2E=1`**: en CI (sin app empaquetada ni backend) los
tests se saltan y no rompen el pipeline. Para correrlo en dev real:

```bash
RRHH_E2E=1 RRHH_E2E_USER=<usuario> RRHH_E2E_PASS=<clave> npm run e2e
```

Requisitos del ambiente dev:

- Backend `central` corriendo, accesible por GraphQL.
- Datos semilla: un funcionario con usuario + sueldo, y una Caja Mayor
  (`CajaVirtual` tipo `CAJA_MAYOR`) activa.
- Usuario con rol `RRHH VER` / `RRHH LIQUIDAR`.

Antes de la primera corrida, ajustar los selectores del login y del sidenav a
los `data-test`/textos reales (el esqueleto usa selectores tentativos).

## 3. Pendientes de cobertura

- Tests de integración del **motor de liquidación** (`generarBorrador` armando
  items automáticos desde vales/préstamos/bonos/aguinaldos) — requieren
  contexto Spring + DB; correr contra el dev real.
- Efectos cruzados del **pago** (VALE→DESCONTADO, cuota→PAGADA, etc.) — validar
  end-to-end en dev.
- **Pago end-to-end del finiquito con descuentos automáticos** (saldado de
  vales/cuotas al pagar) — pendiente de correr contra el dev real (ver T15 en
  `PLAN-TESTEO-MANUAL-RRHH.md`, central).
- **Dashboard RRHH** reconstruido al padrón `desktop/docs/DASHBOARDS.md` (4 KPIs,
  chart de nómina 12 meses, rankings de cumpleaños/exposición financiera/horas
  extra, filtro de período mensual) + **reportes RRHH reubicados** a un mat-menu
  del dashboard (visor PDF integrado, no `window.open()`) — **construcción
  completa**; falta solo el **test manual** del usuario (T16/T17 en
  `PLAN-TESTEO-MANUAL-RRHH.md`, central).
- **Card "Legajos por completar"** (`rrhhFuncionariosIncompletos`): score 1-10
  server-side, filtra inactivos/egresados, paginada, click→legajo. Sin test
  (manual ni automatizado) — validar: el ranking prioriza los peores, el score
  refleja los campos faltantes, la paginación funciona, y el click abre el legajo
  correcto.
- **Aguinaldo — pago separado** (`PagarAguinaldoDialogComponent`): elegir Caja
  Mayor → pagar (EGRESO) → aguinaldo pasa a PAGADO → se ofrece el recibo. Sin
  test. Validar además la **regla de no-doble-pago**: un aguinaldo pagado por
  separado **no debe volver a sumarse** en la liquidación mensual de diciembre.
- **Impresión de recibos — Ticket ESC/POS** (`ImpresionService` + `printLocal`):
  los 7 recibos (vale, penalización, aguinaldo, préstamo, bono, finiquito,
  liquidación mensual) deben imprimir en **PDF (A4)** y en **Ticket (58/80mm)**.
  Validar en la térmica local: conceptos largos se **envuelven sin truncar**,
  acentos limpios, monto alineado. Requiere impresora `uso=TICKET`/`TERMICA`
  configurada. Nota: en **Windows** solo funciona `conexion=RED` (ver
  `desktop/docs/IMPRESION.md`).

## 4. Tests de reportes Jasper (compile + fill + export)

Los `.jrxml` no se validan en el build (compilan en runtime, ver
`central/CLAUDE.md` § Reportes). Patrón adoptado: compilar la plantilla +
`fillReport` con datos dummy + exportar a PDF, en un test JUnit sin levantar
Spring completo.

- `ReciboFiniquitoJrxmlTest` — valida `recibo-finiquito.jrxml` (compila + fill +
  export), el recibo rediseñado de la liquidación final (Fase 6).

La **verificación visual manual** del PDF final en un ambiente dev real sigue
pendiente (el test no evalúa el layout, solo que el pipeline no rompe).
