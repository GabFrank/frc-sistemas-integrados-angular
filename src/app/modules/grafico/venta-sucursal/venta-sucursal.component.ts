import {
  ChangeDetectionStrategy,
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
  filter,
  finalize,
  map,
  switchMap,
  tap,
} from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { RangoFechaGrafico } from "../../../shared/components/grafico-filtros-fecha/grafico-filtros-fecha.model";
import { VistaGraficoShell } from "../../../shared/models/grafico-vista.model";
import {
  degradadoBarraVertical,
  ejeCategoriaOscuro,
  ejeValorOscuro,
  formatoMonedaPy,
  gridGraficoOscuro,
  GRAFICO_COLORES,
  tituloGraficoCentrado,
  tooltipEjeMoneda,
} from "../../../shared/utils/grafico-echarts.theme";
import { GraficoService } from "../grafico.service";
import { VentaSucursalItem } from "../interfaces/venta-sucursal-item.model";
import { VentaSucursalDatosGraficoProcesados } from "../interfaces/venta-sucursal-datos-grafico-procesados.model";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-venta-sucursal",
  templateUrl: "./venta-sucursal.component.html",
  styleUrls: ["./venta-sucursal.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "venta-sucursal-host",
  },
})
export class VentaSucursalComponent implements OnInit {
  private graficoService = inject(GraficoService);

  private readonly datosSubject =
    new BehaviorSubject<VentaSucursalDatosGraficoProcesados | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly rangoSubject = new BehaviorSubject<RangoFechaGrafico | null>(
    null
  );

  private datosCrudos: VentaSucursalItem[] = [];

  readonly vista$: Observable<VistaGraficoShell> = combineLatest([
    this.datosSubject,
    this.cargandoSubject,
  ]).pipe(
    map(([datos, cargando]) => ({
      opciones: datos?.opciones ?? null,
      hayDatos: datos?.hayDatos ?? false,
      cargando,
      datosListos: datos !== null,
    }))
  );

  ngOnInit(): void {
    this.configurarDataStream();
  }

  onRangoFechaChange(rango: RangoFechaGrafico): void {
    this.rangoSubject.next(rango);
  }

  private configurarDataStream(): void {
    this.rangoSubject
      .pipe(
        filter((rango): rango is RangoFechaGrafico => rango !== null),
        debounceTime(300),
        tap(() => this.cargandoSubject.next(true)),
        switchMap(({ inicio, fin }) =>
          this.graficoService.obtenerVentasPorSucursal(inicio, fin).pipe(
            finalize(() => this.cargandoSubject.next(false))
          )
        ),
        untilDestroyed(this)
      )
      .subscribe((datos) => {
        this.datosCrudos = datos || [];
        this.datosSubject.next(this.procesarDatos(this.datosCrudos));
      });
  }

  private procesarDatos(data: VentaSucursalItem[]): VentaSucursalDatosGraficoProcesados {
    const validas = [...(data || [])].sort(
      (a, b) => (b.total || 0) - (a.total || 0)
    );
    const totalGeneral = validas.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );

    const opciones: EChartsOption = {
      title: tituloGraficoCentrado(
        "Ventas por Sucursal",
        `Total Período: ${formatoMonedaPy(totalGeneral)}`
      ),
      tooltip: tooltipEjeMoneda("Ventas"),
      grid: gridGraficoOscuro(),
      xAxis: ejeCategoriaOscuro(
        validas.map((v) => v.nombre || `Suc ${v.sucId}`),
        30
      ),
      yAxis: ejeValorOscuro(),
      series: [
        {
          name: "Ventas",
          type: "bar",
          data: validas.map((v) => v.total),
          itemStyle: {
            color: degradadoBarraVertical(),
            borderRadius: [4, 4, 0, 0],
          },
          label: {
            show: true,
            position: "top",
            color: GRAFICO_COLORES.text,
            formatter: (p) => {
              const val = Number(p.value);
              if (val >= 1_000_000) {
                return (val / 1_000_000).toFixed(1) + "M";
              }
              return val.toLocaleString("es-PY");
            },
          },
        },
      ],
    };

    return { opciones, hayDatos: validas.length > 0 };
  }
}
