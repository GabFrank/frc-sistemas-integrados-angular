import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { EChartsOption } from "echarts";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../empresarial/sucursal/sucursal.service";
import { GraficoService } from "../grafico.service";
import { listarAnhosGrafico } from "../../../commons/core/utils/dateUtils";
import { MESES_ETIQUETAS_CORTAS } from "../../../shared/constants/grafico.constants";
import { VistaGraficoShell } from "../../../shared/models/grafico-vista.model";
import {
  GRAFICO_COLORES,
  formatoEjeCompacto,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { IngresoGastoMesAcumulado } from "../interfaces/ingreso-gasto-mes-acumulado.model";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "ingreso-gasto",
  templateUrl: "./ingreso-gasto.component.html",
  styleUrls: ["./ingreso-gasto.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "ingreso-gasto-host",
  },
})
export class IngresoGastoComponent implements OnInit {
  private graficoService = inject(GraficoService);
  private sucursalService = inject(SucursalService);

  sucursalControl = new FormControl<number | null>(null);
  yearControl = new FormControl<number>(new Date().getFullYear());

  sucursales$: Observable<Sucursal[]>;
  anhos: number[] = listarAnhosGrafico();
  mesesEtiquetas = [...MESES_ETIQUETAS_CORTAS];

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

  private configurarDataStream(): void {
    combineLatest([
      this.sucursalControl.valueChanges.pipe(
        startWith(this.sucursalControl.value),
        distinctUntilChanged()
      ),
      this.yearControl.valueChanges.pipe(
        startWith(this.yearControl.value),
        distinctUntilChanged()
      ),
    ])
      .pipe(
        tap(() => this.cargandoSubject.next(true)),
        switchMap(([sucId, year]) => {
          const anho = year || new Date().getFullYear();
          return forkJoin({
            ingresos: this.graficoService.obtenerVentasPorMes(
              anho,
              sucId || undefined
            ),
            gastos: this.graficoService.obtenerGastosPorMes(
              anho,
              sucId || undefined
            ),
          }).pipe(finalize(() => this.cargandoSubject.next(false)));
        }),
        untilDestroyed(this)
      )
      .subscribe(({ ingresos, gastos }) => {
        this.configurarGrafico(ingresos || [], gastos || []);
      });
  }

  private configurarGrafico(
    ingresos: IngresoGastoMesAcumulado[],
    gastos: IngresoGastoMesAcumulado[]
  ): void {
    const ingresosData = new Array(12).fill(0);
    const efvoData = new Array(12).fill(0);
    const tarjetaData = new Array(12).fill(0);
    const otrosData = new Array(12).fill(0);
    const gastosData = new Array(12).fill(0);

    ingresos.forEach((item) => {
      if (item.mes >= 1 && item.mes <= 12) {
        ingresosData[item.mes - 1] = item.total;
        efvoData[item.mes - 1] = item.efvo || 0;
        tarjetaData[item.mes - 1] = item.tarjeta || 0;
        otrosData[item.mes - 1] = item.otros || 0;
      }
    });

    gastos.forEach((item) => {
      if (item.mes >= 1 && item.mes <= 12) {
        gastosData[item.mes - 1] = item.total;
      }
    });

    const hayDatos =
      ingresosData.some((v) => v > 0) || gastosData.some((v) => v > 0);
    this.hayDatosSubject.next(hayDatos);

    this.opcionesSubject.next({
      title: tituloGraficoCentrado("Ingresos vs Gastos Mensual"),
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const filas = Array.isArray(params) ? params : [params];
          if (!filas.length) {
            return "";
          }
          const primera = filas[0] as { name: string };
          let tooltip = `<strong>${primera.name}</strong><br/>`;
          let totalIngresos = 0;
          let breakdown = "";

          filas.forEach((p: { seriesName: string; value: number; color: string; marker: string }) => {
            if (
              p.seriesName !== "Gastos" &&
              p.seriesName !== "Total Ingresos"
            ) {
              totalIngresos += p.value;
              breakdown += `${p.marker} ${p.seriesName}: ${formatoMonedaPy(p.value)}<br/>`;
            } else if (p.seriesName === "Gastos") {
              tooltip += `${p.marker} <strong>${p.seriesName}: ${formatoMonedaPy(p.value)}</strong><br/>`;
            }
          });

          tooltip += `<hr style="border:0;border-top:1px solid #666;margin:5px 0">`;
          tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${GRAFICO_COLORES.primary};"></span> <strong>Total Ingresos: ${formatoMonedaPy(totalIngresos)}</strong><br/>`;
          tooltip += `<div style="padding-left:15px; font-size: 0.9em; color: #ccc">${breakdown}</div>`;
          return tooltip;
        },
      },
      legend: {
        data: ["Efectivo", "Tarjeta", "Otros Ingresos", "Gastos"],
        bottom: 10,
        textStyle: { color: GRAFICO_COLORES.textSecondary },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: [...this.mesesEtiquetas],
        axisLabel: { color: GRAFICO_COLORES.textSecondary },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: GRAFICO_COLORES.textSecondary,
          formatter: (value: number) => formatoEjeCompacto(value),
        },
        splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
      },
      series: [
        {
          name: "Efectivo",
          type: "bar",
          stack: "ingresos",
          data: efvoData,
          itemStyle: { color: GRAFICO_COLORES.primary },
        },
        {
          name: "Tarjeta",
          type: "bar",
          stack: "ingresos",
          data: tarjetaData,
          itemStyle: { color: "#A2C183" },
        },
        {
          name: "Otros Ingresos",
          type: "bar",
          stack: "ingresos",
          data: otrosData,
          itemStyle: { color: "#C5E1A5" },
        },
        {
          name: "Gastos",
          type: "bar",
          data: gastosData,
          itemStyle: { color: "#F44336", borderRadius: [4, 4, 0, 0] },
        },
      ],
    });
  }
}
