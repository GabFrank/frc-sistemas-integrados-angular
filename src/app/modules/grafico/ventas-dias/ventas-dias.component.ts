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
import { formatearFechaGrafico } from "../../../commons/core/utils/dateUtils";
import { PeriodoGraficoInput } from "../utils/grafico-periodo.model";
import { VentasPorHoraItem } from "../venta-sucursal/ventas-por-hora-item.model";
import { VentasPorHoraSerieGrafico } from "./interfaces/ventas-por-hora-serie-grafico.model";
import { VistaGraficoShell } from "../../../shared/models/grafico-vista.model";
import {
  GRAFICO_COLORES,
  GRAFICO_PALETA_BARRAS,
  formatoEjeCompacto,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { GraficoFiltroSucursalesMulti } from "../utils/grafico-filtro-sucursales-multi.helper";
import {
  descargarExcelBase64,
  etiquetaSucursalesSeleccionadas,
  nombreArchivoGraficoExcel,
  periodosComparacionHoyAyer,
} from "../utils/grafico-excel-export.util";

/** Paleta de colores para líneas de múltiples sucursales */
const PALETA_LINEAS = [
  { color: "#009688", areaStart: "rgba(0, 150, 136, 0.4)", areaEnd: "rgba(0, 150, 136, 0)" },
  { color: "#FF9800", areaStart: "rgba(255, 152, 0, 0.3)", areaEnd: "rgba(255, 152, 0, 0)" },
  { color: "#2196F3", areaStart: "rgba(33, 150, 243, 0.3)", areaEnd: "rgba(33, 150, 243, 0)" },
  { color: "#E91E63", areaStart: "rgba(233, 30, 99, 0.3)", areaEnd: "rgba(233, 30, 99, 0)" },
  { color: "#9C27B0", areaStart: "rgba(156, 39, 176, 0.3)", areaEnd: "rgba(156, 39, 176, 0)" },
  { color: "#4CAF50", areaStart: "rgba(76, 175, 80, 0.3)", areaEnd: "rgba(76, 175, 80, 0)" },
];

interface DatosSucursalHora {
  sucursalId: number | null;
  sucursalNombre: string;
  hoy: VentasPorHoraItem[];
  ayer: VentasPorHoraItem[];
}

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

  readonly filtroSucursales = new GraficoFiltroSucursalesMulti();
  sucursales$: Observable<Sucursal[]>;

  private sucursalesLista: Sucursal[] = [];

  private readonly opcionesSubject = new BehaviorSubject<EChartsOption | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly exportandoSubject = new BehaviorSubject<boolean>(false);
  private readonly hayDatosSubject = new BehaviorSubject<boolean>(false);

  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly exportando$ = this.exportandoSubject.asObservable();
  readonly puedeExportar$ = this.hayDatosSubject.asObservable();

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
    this.sucursales$ = this.sucursalService.onGetAllSucursales(true).pipe(
      map((sucs) => (sucs || []).filter((s) => s.activo && s.id > 0 && s.id !== 999)),
      tap((sucs) => (this.sucursalesLista = sucs))
    );
    this.configurarDataStream();
  }

  limpiarFiltros(): void {
    this.filtroSucursales.limpiar();
  }

  exportarExcel(): void {
    if (!this.hayDatosSubject.value || this.exportandoSubject.value) {
      return;
    }
    this.exportandoSubject.next(true);
    const sucIds = this.filtroSucursales.normalizarIds();
    this.graficoService
      .exportarGraficoExcel("VENTAS_HORA", {
        periodos: periodosComparacionHoyAyer(),
        sucIds,
        filtroAnhos: "—",
        filtroMeses: "—",
        filtroRangoDias: "Hoy y Ayer",
        filtroSucursales: etiquetaSucursalesSeleccionadas(
          this.sucursalesLista,
          sucIds
        ),
      })
      .pipe(
        finalize(() => {
          this.exportandoSubject.next(false);
          this.cdr.markForCheck();
        }),
        untilDestroyed(this)
      )
      .subscribe((base64) => {
        descargarExcelBase64(base64, nombreArchivoGraficoExcel("VENTAS_HORA"));
      });
  }

  private configurarDataStream(): void {
    this.filtroSucursales.control.valueChanges
      .pipe(
        startWith(this.filtroSucursales.control.value),
        tap(() => this.cargandoSubject.next(true)),
        switchMap((sucIds) =>
          this.consultarDatos(this.filtroSucursales.normalizarIds(sucIds))
        ),
        untilDestroyed(this)
      )
      .subscribe((datosSucursales) => {
        this.configurarGrafico(datosSucursales);
        this.cdr.markForCheck();
      });
  }

  private consultarDatos(sucIds: number[]): Observable<DatosSucursalHora[]> {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const periodos: PeriodoGraficoInput[] = [
      { etiqueta: "Ayer", inicio: formatearFechaGrafico(ayer), fin: formatearFechaGrafico(ayer) },
      { etiqueta: "Hoy", inicio: formatearFechaGrafico(hoy), fin: formatearFechaGrafico(hoy) },
    ];

    return this.graficoService
      .obtenerVentasPorHoraMulti(
        periodos,
        this.filtroSucursales.normalizarIds(sucIds)
      )
      .pipe(
        map((series) => this.agruparSeriesPorSucursal(series)),
        finalize(() => this.cargandoSubject.next(false))
      );
  }

  private agruparSeriesPorSucursal(series: VentasPorHoraSerieGrafico[]): DatosSucursalHora[] {
    const mapa = new Map<string, DatosSucursalHora>();

    for (const serie of series) {
      const sucId =
        serie.sucId != null && serie.sucId !== "" ? Number(serie.sucId) : null;
      const clave = sucId != null ? String(sucId) : "todas";
      let item = mapa.get(clave);
      if (!item) {
        item = {
          sucursalId: sucId,
          sucursalNombre:
            serie.sucursalNombre || this.resolverNombreSucursal(sucId),
          hoy: [],
          ayer: [],
        };
        mapa.set(clave, item);
      }
      if (serie.etiqueta === "Hoy") {
        item.hoy = serie.datos || [];
      } else if (serie.etiqueta === "Ayer") {
        item.ayer = serie.datos || [];
      }
    }

    return Array.from(mapa.values());
  }

  private resolverNombreSucursal(sucId: number | null): string {
    if (!sucId) {
      return "Todas";
    }
    const encontrada = this.sucursalesLista.find((s) => s.id === sucId);
    return encontrada?.nombre || `Suc. ${sucId}`;
  }

  private configurarGrafico(datosSucursales: DatosSucursalHora[]): void {
    const esMultiple = datosSucursales.length > 1;

    if (esMultiple) {
      this.configurarGraficoMultiple(datosSucursales);
    } else if (datosSucursales.length === 1) {
      this.configurarGraficoSimple(datosSucursales[0]);
    }
  }

  private configurarGraficoSimple(datos: DatosSucursalHora): void {
    const valoresHoy = this.construirArrayHoras(datos.hoy);
    const valoresAyer = this.construirArrayHoras(datos.ayer);

    const hayDatos =
      valoresHoy.some((v) => v > 0) || valoresAyer.some((v) => v > 0);
    this.hayDatosSubject.next(hayDatos);

    this.opcionesSubject.next({
      title: tituloGraficoCentrado("Comparativo de Ventas por Hora (Ayer vs Hoy)"),
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => this.formatearTooltipHoras(params),
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
          data: valoresAyer,
          smooth: true,
          lineStyle: { width: 3, color: GRAFICO_COLORES.warning },
          itemStyle: { color: GRAFICO_COLORES.warning },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
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
          data: valoresHoy,
          smooth: true,
          lineStyle: { width: 4, color: GRAFICO_COLORES.accent },
          itemStyle: { color: GRAFICO_COLORES.accent },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
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

  private configurarGraficoMultiple(datosSucursales: DatosSucursalHora[]): void {
    const series: NonNullable<EChartsOption["series"]> = [];
    const legendData: string[] = [];
    let hayAlgunDato = false;

    datosSucursales.forEach((datos, idx) => {
      const valoresHoy = this.construirArrayHoras(datos.hoy);
      const valoresAyer = this.construirArrayHoras(datos.ayer);
      const paleta = PALETA_LINEAS[idx % PALETA_LINEAS.length];
      const nombreAyer = `Ayer · ${datos.sucursalNombre}`;
      const nombreHoy = `Hoy · ${datos.sucursalNombre}`;

      legendData.push(nombreAyer, nombreHoy);

      if (
        valoresHoy.some((v) => v > 0) ||
        valoresAyer.some((v) => v > 0)
      ) {
        hayAlgunDato = true;
      }

      series.push({
        name: nombreAyer,
        type: "line",
        data: valoresAyer,
        smooth: true,
        lineStyle: { width: 2, color: paleta.color, type: "dashed" },
        itemStyle: { color: paleta.color },
      });
      series.push({
        name: nombreHoy,
        type: "line",
        data: valoresHoy,
        smooth: true,
        lineStyle: { width: 3, color: paleta.color },
        itemStyle: { color: paleta.color },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: paleta.areaStart },
              { offset: 1, color: paleta.areaEnd },
            ],
          },
        },
      });
    });

    this.hayDatosSubject.next(hayAlgunDato);

    this.opcionesSubject.next({
      title: tituloGraficoCentrado(
        "Ventas por Hora - Comparativo por Sucursal",
        `${datosSucursales.length} sucursales`
      ),
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => this.formatearTooltipHoras(params),
      },
      legend: {
        data: legendData,
        bottom: 10,
        textStyle: { color: GRAFICO_COLORES.text, fontSize: 11 },
        type: "scroll",
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "12%",
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
      series,
    });
  }

  private construirArrayHoras(items: VentasPorHoraItem[]): number[] {
    const valores = new Array(24).fill(0);
    items.forEach((item) => {
      const idx = this.obtenerIndiceHora(item.hora);
      if (idx >= 0) {
        valores[idx] = item.total;
      }
    });
    return valores;
  }

  private formatearTooltipHoras(params: unknown): string {
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
  }

  private obtenerIndiceHora(hora: number): number {
    if (hora >= 0 && hora <= 23) {
      return hora;
    }
    return -1;
  }
}
