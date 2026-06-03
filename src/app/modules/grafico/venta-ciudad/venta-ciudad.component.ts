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
import { VistaGraficoShell } from "../../../shared/models/grafico-vista.model";
import {
  degradadoBarraVertical,
  ejeCategoriaOscuro,
  ejeValorOscuro,
  formatoMonedaPy,
  gridGraficoOscuro,
  GRAFICO_COLORES,
  GRAFICO_PALETA_BARRAS,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { GraficoService } from "../grafico.service";
import { GraficoFiltrosPeriodo } from "../utils/grafico-filtro-rango-fechas.helper";
import { periodosDesdeFiltro } from "../utils/grafico-consulta-multi.helper";
import { formatearTooltipGraficoPeriodo } from "../utils/grafico-tooltip-periodo.util";
import { VentaCiudadItem } from "./venta-ciudad-item.model";
import { VentaCiudadDatosGraficoProcesados } from "./venta-ciudad-datos-grafico-procesados.model";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-venta-ciudad",
  templateUrl: "./venta-ciudad.component.html",
  styleUrls: ["./venta-ciudad.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "venta-ciudad-host",
  },
})
export class VentaCiudadComponent implements OnInit {
  private graficoService = inject(GraficoService);
  private cdr = inject(ChangeDetectorRef);

  readonly filtroPeriodo = new GraficoFiltrosPeriodo();

  private readonly datosSubject =
    new BehaviorSubject<VentaCiudadDatosGraficoProcesados | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly filtrarSubject = new Subject<void>();

  private datosCrudos: VentaCiudadItem[] = [];

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
  readonly cargando$ = this.cargandoSubject.asObservable();

  ngOnInit(): void {
    this.filtroPeriodo.configurarLimitesRangoDias(
      (source) => source.pipe(untilDestroyed(this)),
      () => this.cdr.markForCheck()
    );
    this.configurarDataStream();
  }

  limpiarFiltros(): void {
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
        switchMap(() => this.consultarVentas()),
        untilDestroyed(this)
      )
      .subscribe((datos) => {
        this.datosCrudos = datos || [];
        this.datosSubject.next(this.procesarDatos(this.datosCrudos));
        this.cdr.markForCheck();
      });
  }

  private consultarVentas(): Observable<VentaCiudadItem[]> {
    return this.graficoService
      .obtenerVentasPorCiudadMulti(periodosDesdeFiltro(this.filtroPeriodo))
      .pipe(finalize(() => this.cargandoSubject.next(false)));
  }

  private procesarDatos(data: VentaCiudadItem[]): VentaCiudadDatosGraficoProcesados {
    const validas = [...(data || [])].sort(
      (a, b) => (b.total || 0) - (a.total || 0)
    );
    const totalGeneral = validas.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );
    const anhosComparativa = this.extraerAnhosComparativa(validas);
    const opciones =
      anhosComparativa.length > 1
        ? this.construirOpcionesComparativaAnhos(
            validas,
            anhosComparativa,
            totalGeneral
          )
        : this.construirOpcionesSimple(validas, totalGeneral);

    return { opciones, hayDatos: validas.length > 0 };
  }

  private extraerAnhosComparativa(items: VentaCiudadItem[]): number[] {
    const anhosFiltro = this.filtroPeriodo.normalizarAnhosSeleccionados();
    if (anhosFiltro.length > 1) {
      return anhosFiltro;
    }

    const anhos = new Set<number>();
    for (const item of items) {
      for (const d of item.desgloseAnhos ?? []) {
        if (d.total !== 0 || (d.cantidad ?? 0) > 0) {
          anhos.add(d.anio);
        }
      }
    }
    return Array.from(anhos).sort((a, b) => a - b);
  }

  private nombreCiudad(item: VentaCiudadItem): string {
    return item.nombre || `Ciudad ${item.ciudadId ?? ""}`;
  }

  private totalPorAnho(item: VentaCiudadItem, anio: number): number {
    return (
      item.desgloseAnhos?.find((d) => d.anio === anio)?.total ?? 0
    );
  }

  private etiquetaValorBarra(valor: number): string {
    if (valor >= 1_000_000) {
      return (valor / 1_000_000).toFixed(1) + "M";
    }
    return valor.toLocaleString("es-PY");
  }

  private labelBarraSuperior() {
    return {
      show: true,
      position: "top" as const,
      color: GRAFICO_COLORES.text,
      formatter: (p: { value?: unknown }) =>
        this.etiquetaValorBarra(Number(p.value)),
    };
  }

  private formatearTooltipCiudad(
    validas: VentaCiudadItem[],
    dataIndex: number
  ): string {
    const item = validas[dataIndex];
    if (!item) {
      return "";
    }
    return formatearTooltipGraficoPeriodo({
      titulo: this.nombreCiudad(item),
      total: item.total ?? 0,
      desglosePeriodos: item.desglosePeriodos,
      desgloseAnhos: item.desgloseAnhos,
    });
  }

  private construirOpcionesSimple(
    validas: VentaCiudadItem[],
    totalGeneral: number
  ): EChartsOption {
    return {
      title: tituloGraficoCentrado(
        "Ventas por Ciudad",
        `Total Período: ${formatoMonedaPy(totalGeneral)}`
      ),
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const fila = Array.isArray(params) ? params[0] : params;
          if (!fila || typeof fila !== "object") {
            return "";
          }
          const p = fila as { dataIndex: number };
          return this.formatearTooltipCiudad(validas, p.dataIndex);
        },
      },
      grid: gridGraficoOscuro(),
      xAxis: ejeCategoriaOscuro(validas.map((v) => this.nombreCiudad(v)), 30),
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
          label: this.labelBarraSuperior(),
        },
      ],
    };
  }

  private construirOpcionesComparativaAnhos(
    validas: VentaCiudadItem[],
    anhos: number[],
    totalGeneral: number
  ): EChartsOption {
    const etiquetaAnhos = anhos.join(" · ");

    return {
      title: tituloGraficoCentrado(
        "Ventas por Ciudad",
        `Comparando ${etiquetaAnhos} · Total: ${formatoMonedaPy(totalGeneral)}`
      ),
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const filas = Array.isArray(params) ? params : [params];
          const primera = filas[0];
          if (!primera || typeof primera !== "object") {
            return "";
          }
          return this.formatearTooltipCiudad(
            validas,
            (primera as { dataIndex: number }).dataIndex
          );
        },
      },
      legend: {
        data: anhos.map(String),
        bottom: 0,
        textStyle: { color: GRAFICO_COLORES.textSecondary },
      },
      grid: gridGraficoOscuro("18%"),
      xAxis: ejeCategoriaOscuro(validas.map((v) => this.nombreCiudad(v)), 30),
      yAxis: ejeValorOscuro(),
      series: anhos.map((anio, idx) => ({
        name: String(anio),
        type: "bar" as const,
        data: validas.map((v) => this.totalPorAnho(v, anio)),
        barGap: "10%",
        itemStyle: {
          color: GRAFICO_PALETA_BARRAS[idx % GRAFICO_PALETA_BARRAS.length],
          borderRadius: [4, 4, 0, 0],
        },
        label: this.labelBarraSuperior(),
      })),
    };
  }
}
