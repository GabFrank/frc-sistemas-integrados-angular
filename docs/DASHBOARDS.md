# Dashboards de Franco Systems (desktop)

Guía oficial para construir dashboards de módulo en el desktop. Define el
layout, las primitivas reutilizables, la paleta, las reglas de tipografía y el
patrón de datos. El **dashboard de Devoluciones**
(`modules/operaciones/devolucion/`) es la implementación de referencia.

> Un "dashboard de módulo" es la pantalla que se abre al entrar a un módulo
> desde el menú lateral. Reemplaza al viejo landing de cards genéricas
> (`app-boton`) por información valiosa, filtrable y accionable.

---

## 1. Anatomía (orden fijo)

```
dash-container
├── dash-header            título + subtítulo · filtros de fecha · botón Aplicar
├── dash-stats-row         4 KPIs (dash-stat-chip)
├── dash-quick-actions     accesos directos (dash-quick-action)
└── dash-main              2 columnas
    ├── dash-col (izq)     chart (dash-chart-card) + card/ranking secundario
    └── dash-col (der)     rankings / tops (dash-ranking-list)
```

Esqueleto HTML mínimo:

```html
<div class="dash-container">
  <div class="dash-header">
    <div class="dash-header-title">
      <h1 class="dash-title">Mi módulo</h1>
      <span class="dash-subtitle">Panel de control</span>
    </div>
    <div class="dash-header-actions">
      <div class="dash-filtros">
        <mat-form-field appearance="outline"><mat-label>Desde</mat-label>
          <input matInput type="date" [(ngModel)]="desde" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Hasta</mat-label>
          <input matInput type="date" [(ngModel)]="hasta" /></mat-form-field>
      </div>
      <button mat-raised-button color="primary" (click)="cargar()">
        <mat-icon>filter_alt</mat-icon> Aplicar
      </button>
    </div>
  </div>

  <div class="dash-stats-row">
    <dash-stat-chip *ngFor="let k of kpis" [icon]="k.icon" [color]="k.color"
      [label]="k.label" [value]="k.value" [loading]="cargando"></dash-stat-chip>
  </div>

  <div class="dash-quick-actions">
    <dash-quick-action *ngFor="let a of accesos" [icon]="a.icon" [title]="a.title"
      [color]="a.color" (action)="a.action()"></dash-quick-action>
  </div>

  <div class="dash-main">
    <div class="dash-col">
      <dash-chart-card icon="stacked_bar_chart" title="..." [opciones]="serieOpciones"
        [cargando]="cargando" [hayDatos]="serieHayDatos"></dash-chart-card>
      <!-- card secundaria: lista accionable (ej. "estancadas") -->
    </div>
    <div class="dash-col">
      <dash-ranking-list icon="inventory_2" title="Top ..." [items]="topA"></dash-ranking-list>
      <dash-ranking-list icon="report_problem" title="Top ..." [items]="topB"></dash-ranking-list>
    </div>
  </div>
</div>
```

---

## 2. Primitivas reutilizables

Viven en `src/app/shared/components/dashboard/` y están declaradas + exportadas
en `SharedModule`. Cualquier módulo que importe `SharedModule` las tiene. **No
crear componentes nuevos si una primitiva ya cubre el caso.**

| Selector | Uso | Inputs clave |
|---|---|---|
| `dash-stat-chip` | KPI (número + label + icono) | `icon`, `value`, `label`, `color`, `loading` |
| `dash-quick-action` | Acceso directo moderno | `icon`, `title`, `color`, `disabled`; `(action)` |
| `dash-ranking-list` | Top N con barra + medalla | `icon`, `title`, `items: DashRankingItem[]`, `emptyText` |
| `dash-section-header` | Header de card | `icon`, `title`, `badge`, `badgeClass` |
| `dash-chart-card` | Card de gráfico (envuelve `frc-grafico-shell`/echarts) | `icon`, `title`, `opciones`, `cargando`, `hayDatos` |

`DashRankingItem`: `{ nombre, valorPrincipal, valorSecundario?, porcentaje? }`
(`porcentaje` 0-100 pinta la barra).

`color` de `dash-stat-chip`: `primary` (verde) · `success` · `warning` ·
`error` · `info`. El color comunica el estado del KPI (ej. "pendientes" pasa a
`warning` cuando hay > 0).

---

## 3. Paleta

Los estilos viven en **`src/styles/_dashboard.scss`** (clases globales `.dash-*`,
importado una sola vez en `styles.scss`). Los componentes usan esas clases y no
llevan SCSS propio salvo el `:host` de scroll.

Paleta dark FRC (la misma del resto de la app):

| Rol | Color |
|---|---|
| Fondo base | `#303030` |
| Card | `#424242` |
| Borde | `#555` |
| Texto | `#e0e0e0` |
| Texto secundario | `#9e9e9e` |
| Acento | `#689f38` (verde) |
| Semáforo | `#4caf50` / `#ff9800` / `#f44336` / `#2196f3` |

Barras de ranking: degradado verde `#558b2f → #8bc34a`. Cards planas, borde
`1px`, sin sombra salvo hover en quick-actions.

Para los gráficos usar el tema de echarts existente:
`src/app/shared/utils/grafico-echarts.theme.ts` (`GRAFICO_COLORES`,
`formatoMonedaPy`, `formatoEjeCompacto`, ...).

---

## 4. Tipografía (regla dura)

El tamaño de referencia es el **normal** heredado de la app (el del menú
lateral). Nada debe verse "chiquito".

- **Por defecto: no fijar `font-size`** — se hereda el normal (100%). La mayoría
  de los textos (título, títulos de sección, quick-actions, secundarios) NO
  llevan `font-size`.
- **Destacados: 120%** como máximo (`dash-stat-value`).
- **Menores: 90%** (labels, ranks, chips, nombres de ranking) — nunca menos.
- Usar **porcentajes** (`120%` / `90%`), no `rem`, para que escale con la base.

Los ejes/leyenda de echarts usan `fontSize: 13`.

---

## 5. Datos (agregación en el backend)

**Regla:** los KPIs, tops y series se calculan con queries de **agregación en el
backend**, nunca trayendo entidades completas para sumar en el cliente (no
escala). El backend ya tiene tres patrones probados:

- Resumen con constructor JPQL (`ResumenFacturasDto`, `ResumenDevolucionesDto`).
- `GROUP BY` con proyección a DTO (por estado, por motivo, tops).
- Native SQL para series temporales (agrupar por día/mes).

En el ejemplo de Devoluciones (`central`):
`resumenDevoluciones`, `topProductosDevueltos`, `topMotivosDevolucion`,
`devolucionesSeriePorMes` (serie mensual del chart, últimos 12 meses),
`devolucionesEstancadas` (PENDIENTE/SEPARADO con antigüedad mayor a un umbral
configurable) y `devolucionesSeriePorDia` / `devolucionesPorEstadoResumen`
(disponibles, no usadas hoy en la UI). Todo en
`graphql/operaciones/devolucion-dashboard.graphqls`, aditivo, sin migración.

En el cliente:
- Un archivo `graphql-query.ts` con los `gql` + un archivo con las clases
  `Query` (`dashboard/graphql/`).
- Un service que envuelve las queries vía `GenericCrudService.onCustomQuery`
  con `silentLoad = true` (el dashboard maneja su propio estado de carga, sin
  el diálogo global). Ver `dashboard-devolucion.service.ts`.

### Gotchas de agregación (Hibernate 5 / PostgreSQL)

- **Sin aritmética dentro de `CASE … THEN`**: `SUM(CASE WHEN … THEN a*b END)`
  no parsea. Separar en una query escalar filtrada por `WHERE`.
- **Parámetros nullable**: envolver con `cast(:param as tipo)` (JPQL) o
  `CAST(:param AS bigint)` (native) para que PostgreSQL infiera el tipo con
  `null`.
- **Native SQL**: usar `CAST(x AS date)`, **no** `x::date` — el `::` choca con
  la sintaxis `:param` de Hibernate.

---

## 6. Reglas de comportamiento

- **Sucursal del puesto**: si el desktop habla con una **filial**
  (`mainService.isServidor === false`), el dashboard filtra por
  `mainService.sucursalActual` y lo muestra en el subtítulo. Contra el
  **servidor central** (`isServidor === true`, sucursal id 0) muestra todas.
  El filtro va al backend, no se esconde en el HTML.
- **Nunca llamar funciones desde el HTML**: precalcular los KPIs y los items de
  ranking como strings/objetos en el `.ts` (incluye el formateo de moneda).
- **Navegación a hijos**: `tabService.addTab(new Tab(Componente, "Título", null,
  DashboardComponent))`. Los accesos rápidos reemplazan a las viejas cards.
- **Rango por defecto**: el mes en curso (día 1 hasta hoy).
- **El chart de tendencia va desacoplado del filtro**: muestra los últimos 12
  meses (agrupado por mes) para que sea útil como serie histórica, sin importar
  el rango elegido para KPIs/tops. Sí respeta la sucursal.
- **Listas accionables configurables**: cuando una card ofrece un umbral (ej.
  "estancadas" con antigüedad +15d/+1m/+2m/+3m), poner un `mat-select` compacto
  (`.dash-inline-select`) en el `dash-section-header` y recargar solo esa card
  al cambiarlo.

---

## 7. Checklist para un dashboard nuevo

1. Backend: DTOs + queries de agregación (patrones §5), expuestas en un
   `*-dashboard.graphqls` aditivo. Probar cada query contra datos reales.
2. Cliente: `graphql-query.ts` + clases `Query` + service con `silentLoad`.
3. Componente: filtros de fecha, `kpis[]`, `accesos[]`, opciones de chart y
   rankings, todo precalculado en el `.ts`.
4. HTML: el esqueleto de §1 con las primitivas.
5. `_dashboard.scss` ya cubre el look; respetar la regla de tipografía (§4).
6. `npm run check` (AOT) antes de pushear.

---

## 8. echarts

`frc-grafico-shell` (SharedModule) envuelve ngx-echarts con estados de
loading/empty. El provider global de echarts está en `app.module`
(`NgxEchartsModule.forRoot`), así que `dash-chart-card` funciona en cualquier
módulo. Construir el `EChartsOption` en el `.ts` usando `GRAFICO_COLORES` para
los colores dark y `fontSize: 13` en ejes/leyenda.
