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
import { IngresoGastoMesAcumulado } from "../venta-mes/interfaces/ingreso-gasto-mes-acumulado.model";
import { IngresoGastoCombinado } from "./interfaces/ingreso-gasto-combinado.model";
import {
  PALETA_INGRESOS_MULTI,
  PALETA_GASTOS_MULTI,
} from "./constants/ingreso-gasto.constants";
import { GraficoFiltroSucursalesMulti } from "../utils/grafico-filtro-sucursales-multi.helper";

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

  readonly filtroSucursales = new GraficoFiltroSucursalesMulti();
  yearControl = new FormControl<number[]>([new Date().getFullYear()]);

  sucursales$: Observable<Sucursal[]>;
  anhos: number[] = listarAnhosGrafico();
  mesesEtiquetas = [...MESES_ETIQUETAS_CORTAS];

  private sucursalesLista: Sucursal[] = [];

  private readonly opcionesSubject = new BehaviorSubject<EChartsOption | null>(null);
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
    this.sucursales$ = this.sucursalService.onGetAllSucursales(true).pipe(
      map((sucs) => (sucs || []).filter((s) => s.activo && s.id > 0 && s.id !== 999)),
      tap((sucs) => (this.sucursalesLista = sucs))
    );
    this.configurarDataStream();
  }

  limpiarFiltros(): void {
    this.filtroSucursales.limpiar();
    this.yearControl.setValue([new Date().getFullYear()]);
  }

  private configurarDataStream(): void {
    combineLatest([
      this.filtroSucursales.control.valueChanges.pipe(
        startWith(this.filtroSucursales.control.value)
      ),
      this.yearControl.valueChanges.pipe(
        startWith(this.yearControl.value)
      ),
    ])
      .pipe(
        tap(() => this.cargandoSubject.next(true)),
        switchMap(([sucIds, years]) =>
          this.consultarDatos(
            this.filtroSucursales.normalizarIds(sucIds),
            years
          )
        ),
        untilDestroyed(this)
      )
      .subscribe((combinados) => {
        this.configurarGrafico(combinados);
      });
  }

  private consultarDatos(
    sucIds: number[],
    years: number[]
  ): Observable<IngresoGastoCombinado[]> {
    const anhosSeleccionados = years?.length ? years : [new Date().getFullYear()];
    const sucursalesSeleccionadas =
      this.filtroSucursales.resolverParaConsultaMulti(sucIds);

    const queries: Record<string, Observable<{
      ingresos: IngresoGastoMesAcumulado[];
      gastos: IngresoGastoMesAcumulado[];
    }>> = {};

    for (const anho of anhosSeleccionados) {
      for (const sucId of sucursalesSeleccionadas) {
        const clave = `${anho}_${sucId ?? "todas"}`;
        queries[clave] = forkJoin({
          ingresos: this.graficoService.obtenerVentasPorMes(anho, sucId || undefined),
          gastos: this.graficoService.obtenerGastosPorMes(anho, sucId || undefined),
        });
      }
    }

    return forkJoin(queries).pipe(
      map((resultados) => this.transformarResultados(resultados)),
      finalize(() => this.cargandoSubject.next(false))
    );
  }

  private transformarResultados(
    resultados: Record<string, {
      ingresos: IngresoGastoMesAcumulado[];
      gastos: IngresoGastoMesAcumulado[];
    }>
  ): IngresoGastoCombinado[] {
    const combinados: IngresoGastoCombinado[] = [];

    for (const [clave, val] of Object.entries(resultados)) {
      const [anhoStr, sucIdStr] = clave.split("_");
      const sucId = sucIdStr === "todas" ? null : Number(sucIdStr);
      const sucNombre = this.resolverNombreSucursal(sucId);
      combinados.push({
        sucursalId: sucId,
        sucursalNombre: sucNombre,
        anho: Number(anhoStr),
        ingresos: val.ingresos || [],
        gastos: val.gastos || [],
      });
    }

    return combinados;
  }

  private resolverNombreSucursal(sucId: number | null): string {
    if (!sucId) {
      return "Todas";
    }
    const encontrada = this.sucursalesLista.find((s) => s.id === sucId);
    return encontrada?.nombre || `Suc. ${sucId}`;
  }

  private configurarGrafico(datos: IngresoGastoCombinado[]): void {
    const esMultiple = datos.length > 1;

    if (esMultiple) {
      this.configurarGraficoComparativo(datos);
    } else if (datos.length === 1) {
      this.configurarGraficoSimple(datos[0]);
    }
  }

  private configurarGraficoSimple(d: IngresoGastoCombinado): void {
    const efvoData = new Array(12).fill(0);
    const tarjetaData = new Array(12).fill(0);
    const otrosData = new Array(12).fill(0);
    const gastosData = new Array(12).fill(0);

    d.ingresos.forEach((item) => {
      if (item.mes >= 1 && item.mes <= 12) {
        efvoData[item.mes - 1] = item.efvo || 0;
        tarjetaData[item.mes - 1] = item.tarjeta || 0;
        otrosData[item.mes - 1] = item.otros || 0;
      }
    });

    d.gastos.forEach((item) => {
      if (item.mes >= 1 && item.mes <= 12) {
        gastosData[item.mes - 1] = item.total;
      }
    });

    const hayDatos =
      efvoData.some((v) => v > 0) ||
      tarjetaData.some((v) => v > 0) ||
      gastosData.some((v) => v > 0);

    this.hayDatosSubject.next(hayDatos);

    this.opcionesSubject.next({
      title: tituloGraficoCentrado(
        "Ingresos vs Gastos Mensual",
        `${d.sucursalNombre} · ${d.anho}`
      ),
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => this.formatearTooltipSimple(params),
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

  private configurarGraficoComparativo(datos: IngresoGastoCombinado[]): void {
    const series: NonNullable<EChartsOption["series"]> = [];
    const legendData: string[] = [];
    let hayAlgunDato = false;

    datos.forEach((d, idx) => {
      const ingresosData = new Array(12).fill(0);
      const gastosData = new Array(12).fill(0);

      d.ingresos.forEach((item) => {
        if (item.mes >= 1 && item.mes <= 12) {
          ingresosData[item.mes - 1] = item.total;
        }
      });

      d.gastos.forEach((item) => {
        if (item.mes >= 1 && item.mes <= 12) {
          gastosData[item.mes - 1] = item.total;
        }
      });

      if (ingresosData.some((v) => v > 0) || gastosData.some((v) => v > 0)) {
        hayAlgunDato = true;
      }

      const etiqueta = `${d.sucursalNombre} ${d.anho}`;
      const colorIngreso = PALETA_INGRESOS_MULTI[idx % PALETA_INGRESOS_MULTI.length];
      const colorGasto = PALETA_GASTOS_MULTI[idx % PALETA_GASTOS_MULTI.length];
      const ingresoNombre = `Ingresos · ${etiqueta}`;
      const gastoNombre = `Gastos · ${etiqueta}`;

      legendData.push(ingresoNombre, gastoNombre);

      series.push(
        {
          name: ingresoNombre,
          type: "bar",
          data: ingresosData,
          itemStyle: { color: colorIngreso, borderRadius: [4, 4, 0, 0] },
          barGap: "10%",
        },
        {
          name: gastoNombre,
          type: "bar",
          data: gastosData,
          itemStyle: { color: colorGasto, borderRadius: [4, 4, 0, 0], opacity: 0.75 },
        }
      );
    });

    this.hayDatosSubject.next(hayAlgunDato);

    this.opcionesSubject.next({
      title: tituloGraficoCentrado(
        "Ingresos vs Gastos Mensual",
        `Comparando ${datos.length} combinaciones`
      ),
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => this.formatearTooltipComparativo(params),
      },
      legend: {
        data: legendData,
        bottom: 10,
        textStyle: { color: GRAFICO_COLORES.textSecondary, fontSize: 11 },
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
      series,
    });
  }

  private formatearTooltipSimple(params: unknown): string {
    const filas = Array.isArray(params) ? params : [params];
    if (!filas.length) {
      return "";
    }
    const primera = filas[0] as { name: string };
    let tooltip = `<strong>${primera.name}</strong><br/>`;
    let totalIngresos = 0;
    let desglose = "";

    filas.forEach((p: { seriesName: string; value: number; marker: string }) => {
      if (p.seriesName !== "Gastos" && p.seriesName !== "Total Ingresos") {
        totalIngresos += p.value;
        desglose += `${p.marker} ${p.seriesName}: ${formatoMonedaPy(p.value)}<br/>`;
      } else if (p.seriesName === "Gastos") {
        tooltip += `${p.marker} <strong>${p.seriesName}: ${formatoMonedaPy(p.value)}</strong><br/>`;
      }
    });

    tooltip += `<hr style="border:0;border-top:1px solid #666;margin:5px 0">`;
    tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${GRAFICO_COLORES.primary};"></span> <strong>Total Ingresos: ${formatoMonedaPy(totalIngresos)}</strong><br/>`;
    tooltip += `<div style="padding-left:15px; font-size: 0.9em; color: #ccc">${desglose}</div>`;
    return tooltip;
  }

  private formatearTooltipComparativo(params: unknown): string {
    const filas = Array.isArray(params) ? params : [];
    if (!filas.length) {
      return "";
    }
    const primera = filas[0] as { name: string };
    let tooltip = `<strong>${primera.name}</strong><br/>`;

    filas.forEach((p: { seriesName: string; value: number; marker: string }) => {
      if (p.value > 0) {
        tooltip += `${p.marker} ${p.seriesName}: ${formatoMonedaPy(p.value)}<br/>`;
      }
    });

    return tooltip;
  }
}
