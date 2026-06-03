import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { EChartsOption } from "echarts";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  debounceTime,
  finalize,
  map,
  Subject,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { GraficoService } from "../grafico.service";
import { SucursalService } from "../../empresarial/sucursal/sucursal.service";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { VistaGraficoShell } from "../../../shared/models/grafico-vista.model";
import {
  GRAFICO_COLORES,
  formatoEjeCompacto,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { GastoCategoriaItem } from "./interfaces/gasto-categoria-item.model";
import { GraficoFiltrosPeriodo } from "../utils/grafico-filtro-rango-fechas.helper";
import { GraficoFiltroSucursalesMulti } from "../utils/grafico-filtro-sucursales-multi.helper";
import { periodosDesdeFiltro } from "../utils/grafico-consulta-multi.helper";
import { formatearTooltipGraficoPeriodo } from "../utils/grafico-tooltip-periodo.util";

const PALETA_GASTO_CATEGORIA = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7",
  "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
  "#009688", "#4CAF50", "#8BC34A", "#CDDC39",
  "#FFEB3B", "#FFC107", "#FF9800", "#FF5722",
];

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "gasto-categoria",
  templateUrl: "./gasto-categoria.component.html",
  styleUrls: ["./gasto-categoria.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "gasto-categoria-host",
  },
})
export class GastoCategoriaComponent implements OnInit {
  private graficoService = inject(GraficoService);
  private sucursalService = inject(SucursalService);
  private cdr = inject(ChangeDetectorRef);

  readonly filtroSucursales = new GraficoFiltroSucursalesMulti();
  readonly filtroPeriodo = new GraficoFiltrosPeriodo();

  sucursales$: Observable<Sucursal[]>;

  private readonly opcionesSubject = new BehaviorSubject<EChartsOption | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly hayDatosSubject = new BehaviorSubject<boolean>(false);
  private readonly filtrarSubject = new Subject<void>();

  readonly vista$: Observable<VistaGraficoShell> = combineLatest([
    this.opcionesSubject,
    this.cargandoSubject,
    this.hayDatosSubject,
  ]).pipe(
    map(([opciones, cargando, hayDatos]) => ({
      opciones,
      hayDatos,
      cargando,
      datosListos: opciones !== null,
    }))
  );
  readonly cargando$ = this.cargandoSubject.asObservable();

  ngOnInit(): void {
    this.sucursales$ = this.sucursalService.onGetAllSucursales(true).pipe(
      map((sucs) => (sucs || []).filter((s) => s.activo && s.id > 0 && s.id !== 999))
    );
    this.filtroPeriodo.configurarLimitesRangoDias(
      (source) => source.pipe(untilDestroyed(this)),
      () => this.cdr.markForCheck()
    );
    this.configurarDataStream();
  }

  limpiarFiltros(): void {
    this.filtroSucursales.limpiar();
    this.filtroPeriodo.limpiar();
    this.filtrar();
    this.cdr.markForCheck();
  }

  filtrar(): void {
    this.filtrarSubject.next();
  }

  private configurarDataStream(): void {
    this.filtrarSubject
      .pipe(
        startWith(void 0),
        debounceTime(300),
        tap(() => this.cargandoSubject.next(true)),
        switchMap(() =>
          this.consultarDatos(this.filtroSucursales.normalizarIds())
        ),
        untilDestroyed(this)
      )
      .subscribe((res) => {
        this.configurarGrafico(res || []);
      });
  }

  private consultarDatos(
    sucIds: number[]
  ): Observable<GastoCategoriaItem[]> {
    return this.graficoService
      .obtenerGastosPorCategoriaMulti(
        periodosDesdeFiltro(this.filtroPeriodo),
        this.filtroSucursales.normalizarIds(sucIds)
      )
      .pipe(finalize(() => this.cargandoSubject.next(false)));
  }

  private configurarGrafico(data: GastoCategoriaItem[]): void {
    const datosOrdenados = [...data].sort((a, b) => a.total - b.total);
    const categorias = datosOrdenados.map((d) => d.categoria || "Sin Categoría");
    const valores = datosOrdenados.map((d) => d.total);
    const hayDatos = valores.some((v) => v > 0);

    this.hayDatosSubject.next(hayDatos);
    this.opcionesSubject.next({
      title: tituloGraficoCentrado("Gastos por Categoría"),
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const fila = Array.isArray(params) ? params[0] : params;
          if (!fila || typeof fila !== "object") {
            return "";
          }
          const p = fila as { name: string; value: number; dataIndex: number };
          const item = datosOrdenados[p.dataIndex];
          return formatearTooltipGraficoPeriodo({
            titulo: p.name,
            total: Number(p.value),
            desglosePeriodos: item?.desglosePeriodos,
          });
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLabel: {
          color: GRAFICO_COLORES.textSecondary,
          formatter: (value: number) => formatoEjeCompacto(value),
        },
        splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
      },
      yAxis: {
        type: "category",
        data: categorias,
        axisLabel: { color: GRAFICO_COLORES.text, fontSize: 14 },
        axisTick: { alignWithLabel: true },
        splitLine: { show: false },
      },
      series: [
        {
          name: "Total",
          type: "bar",
          data: valores,
          label: {
            show: true,
            position: "right",
            formatter: (p) => {
              const val = Number(p.value);
              if (val >= 1_000_000) {
                return (val / 1_000_000).toFixed(1) + "M";
              }
              return (val / 1_000).toFixed(0) + "k";
            },
            color: "#fff",
            fontWeight: "bold",
          },
          itemStyle: {
            color: (params: { dataIndex: number }) =>
              PALETA_GASTO_CATEGORIA[
                params.dataIndex % PALETA_GASTO_CATEGORIA.length
              ],
            borderRadius: [0, 4, 4, 0],
          },
          barWidth: "60%",
        },
      ],
    });
  }
}
