import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  inject,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { EChartsOption } from "echarts";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { GraficoService } from "../grafico.service";
import { SucursalService } from "../../empresarial/sucursal/sucursal.service";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { GraficoFiltrosFechaComponent } from "../../../shared/components/grafico-filtros-fecha/grafico-filtros-fecha.component";
import { RangoFechaGrafico } from "../../../shared/components/grafico-filtros-fecha/grafico-filtros-fecha.model";
import { VistaGraficoShell } from "../../../shared/models/grafico-vista.model";
import {
  GRAFICO_COLORES,
  formatoEjeCompacto,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { GastoCategoriaItem } from "./interfaces/gasto-categoria-item.model";

const PALETA_GASTO_CATEGORIA = [
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
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
  @ViewChild(GraficoFiltrosFechaComponent)
  filtrosFechaRef: GraficoFiltrosFechaComponent;

  private graficoService = inject(GraficoService);
  private sucursalService = inject(SucursalService);

  sucursalControl = new FormControl<number | null>(null);
  sucursales$: Observable<Sucursal[]>;

  private readonly rangoSubject = new BehaviorSubject<RangoFechaGrafico | null>(
    null
  );
  private readonly opcionesSubject = new BehaviorSubject<EChartsOption | null>(
    null
  );
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly hayDatosSubject = new BehaviorSubject<boolean>(false);

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

  ngOnInit(): void {
    this.sucursales$ = this.sucursalService.onGetAllSucursales(true);
    this.configurarDataStream();
  }

  onRangoFechaChange(rango: RangoFechaGrafico): void {
    this.rangoSubject.next(rango);
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue(null);
    this.filtrosFechaRef?.limpiarFiltros();
  }

  private configurarDataStream(): void {
    combineLatest([
      this.rangoSubject.pipe(
        filter((rango): rango is RangoFechaGrafico => rango !== null)
      ),
      this.sucursalControl.valueChanges.pipe(
        startWith(this.sucursalControl.value),
        distinctUntilChanged()
      ),
    ])
      .pipe(
        debounceTime(300),
        tap(() => this.cargandoSubject.next(true)),
        switchMap(([rango, sucId]) => {
          const inicioStr = rango.inicio.split(" ")[0];
          const finStr = rango.fin.split(" ")[0];
          return this.graficoService
            .obtenerGastosPorCategoria(inicioStr, finStr, sucId)
            .pipe(finalize(() => this.cargandoSubject.next(false)));
        }),
        untilDestroyed(this)
      )
      .subscribe((res) => {
        this.configurarGrafico(res || []);
      });
  }

  private configurarGrafico(data: GastoCategoriaItem[]): void {
    const sortedData = [...data].sort((a, b) => a.total - b.total);
    const categories = sortedData.map((d) => d.categoria || "Sin Categoría");
    const values = sortedData.map((d) => d.total);
    const hayDatos = values.some((v) => v > 0);

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
          const p = fila as { name: string; value: number };
          return `${p.name}<br/>Monto: ${formatoMonedaPy(p.value)}`;
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
        data: categories,
        axisLabel: { color: GRAFICO_COLORES.text, fontSize: 14 },
        axisTick: { alignWithLabel: true },
        splitLine: { show: false },
      },
      series: [
        {
          name: "Total",
          type: "bar",
          data: values,
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
