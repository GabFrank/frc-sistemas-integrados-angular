import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { EChartsOption } from "echarts";
import { FormControl } from "@angular/forms";
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
import { GraficoService } from "../grafico.service";
import { SucursalService } from "../../empresarial/sucursal/sucursal.service";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { formatearFechaGrafico } from "../../../commons/core/utils/dateUtils";
import { VentasPorHoraItem } from "../interfaces/ventas-por-hora-item.model";
import { VistaGraficoShell } from "../../../shared/models/grafico-vista.model";
import {
  GRAFICO_COLORES,
  formatoEjeCompacto,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "ventas-dias",
  templateUrl: "./ventas-dias.component.html",
  styleUrls: ["./ventas-dias.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "ventas-dias-host",
  },
})
export class VentasDiasComponent implements OnInit {
  private graficoService = inject(GraficoService);
  private sucursalService = inject(SucursalService);
  private cdr = inject(ChangeDetectorRef);

  sucursalControl = new FormControl<number | null>(null);
  sucursales$: Observable<Sucursal[]>;

  private readonly opcionesSubject = new BehaviorSubject<EChartsOption | null>(
    null
  );
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly hayDatosSubject = new BehaviorSubject<boolean>(false);

  private readonly horasDelDia = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

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
    this.sucursalControl.valueChanges
      .pipe(
        startWith(this.sucursalControl.value),
        distinctUntilChanged(),
        tap(() => this.cargandoSubject.next(true)),
        switchMap((sucId) => {
          const hoy = new Date();
          const ayer = new Date(hoy);
          ayer.setDate(ayer.getDate() - 1);
          const hoyStr = formatearFechaGrafico(hoy);
          const ayerStr = formatearFechaGrafico(ayer);

          return forkJoin({
            hoy: this.graficoService.obtenerVentasPorHora(
              hoyStr,
              sucId ?? undefined
            ),
            ayer: this.graficoService.obtenerVentasPorHora(
              ayerStr,
              sucId ?? undefined
            ),
          }).pipe(finalize(() => this.cargandoSubject.next(false)));
        }),
        untilDestroyed(this)
      )
      .subscribe(({ hoy, ayer }) => {
        this.configurarGrafico(hoy || [], ayer || []);
        this.cdr.markForCheck();
      });
  }

  private configurarGrafico(
    dataHoy: VentasPorHoraItem[],
    dataAyer: VentasPorHoraItem[]
  ): void {
    const valuesHoy = new Array(24).fill(0);
    const valuesAyer = new Array(24).fill(0);

    dataHoy.forEach((item) => {
      const idx = this.obtenerIndiceHora(item.hora);
      if (idx >= 0) {
        valuesHoy[idx] = item.total;
      }
    });

    dataAyer.forEach((item) => {
      const idx = this.obtenerIndiceHora(item.hora);
      if (idx >= 0) {
        valuesAyer[idx] = item.total;
      }
    });

    const hayDatos =
      valuesHoy.some((v) => v > 0) || valuesAyer.some((v) => v > 0);
    this.hayDatosSubject.next(hayDatos);

    this.opcionesSubject.next({
      title: tituloGraficoCentrado(
        "Comparativo de Ventas por Hora (Ayer vs Hoy)"
      ),
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const filas = Array.isArray(params) ? params : [];
          if (!filas.length) {
            return "";
          }
          const primera = filas[0] as { name: string };
          let res = `Hora: ${primera.name}:00<br/>`;
          filas.forEach(
            (p: { seriesName: string; value: number; marker: string }) => {
              res += `${p.marker} ${p.seriesName}: ${formatoMonedaPy(Number(p.value))}<br/>`;
            }
          );
          return res;
        },
      },
      legend: {
        data: ["Ayer", "Hoy"],
        bottom: 10,
        textStyle: { color: GRAFICO_COLORES.text },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: this.horasDelDia,
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
          name: "Ayer",
          type: "line",
          data: valuesAyer,
          smooth: true,
          lineStyle: { width: 3, color: GRAFICO_COLORES.warning },
          itemStyle: { color: GRAFICO_COLORES.warning },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(255, 152, 0, 0.3)" },
                { offset: 1, color: "rgba(255, 152, 0, 0)" },
              ],
            },
          },
        },
        {
          name: "Hoy",
          type: "line",
          data: valuesHoy,
          smooth: true,
          lineStyle: { width: 4, color: GRAFICO_COLORES.accent },
          itemStyle: { color: GRAFICO_COLORES.accent },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(0, 150, 136, 0.5)" },
                { offset: 1, color: "rgba(0, 150, 136, 0)" },
              ],
            },
          },
        },
      ],
    });
  }

  private obtenerIndiceHora(hora: number): number {
    if (hora >= 0 && hora <= 23) {
      return hora;
    }
    return -1;
  }
}
