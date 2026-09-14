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
import { sucursalesConServidor } from "../../empresarial/sucursal/sucursal-servidor.util";
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
import {
  descargarExcelBase64,
  etiquetaSucursalesSeleccionadas,
  etiquetasFiltroPeriodoGrafico,
  nombreArchivoGraficoExcel,
} from "../utils/grafico-excel-export.util";

/**
 * Escala de calor del gasto: azul (menor) -> verde -> ámbar -> rojo (mayor).
 *
 * El color va atado al **monto**, no a la posición en la lista. Antes salía de
 * `dataIndex % paleta.length`, o sea que seguía al *puesto* en el ranking: la categoría de arriba
 * era roja siempre, aunque gastara la décima parte que el mes pasado, y una categoría cambiaba de
 * color al cambiar el filtro sin haber cambiado en nada. Con `visualMap` sobre el valor, el rojo
 * significa "es lo que más se gastó" y el degradé intermedio da el nivel de cada una.
 *
 * Los cuatro pasos despejan 3:1 sobre las dos superficies oscuras del tema (#303030 y #424242).
 * El rojo es `#FF5252` y no el `warn` del tema (`#F44336`), que se queda en 2.73:1 sobre #424242.
 */
const ESCALA_GASTO = ["#2196F3", "#4CAF50", "#FFC107", "#FF5252"];

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

  private sucursalesLista: Sucursal[] = [];

  private readonly opcionesSubject = new BehaviorSubject<EChartsOption | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly exportandoSubject = new BehaviorSubject<boolean>(false);
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
  readonly exportando$ = this.exportandoSubject.asObservable();
  readonly puedeExportar$ = this.hayDatosSubject.asObservable();

  ngOnInit(): void {
    // Incluye SERVIDOR (sucursal 0): ahi se registran los gastos pagados desde la caja mayor.
    this.sucursales$ = this.sucursalService.onGetAllSucursales(true).pipe(
      map((sucs) => sucursalesConServidor(sucs)),
      tap((sucs) => (this.sucursalesLista = sucs))
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

  exportarExcel(): void {
    if (!this.hayDatosSubject.value || this.exportandoSubject.value) {
      return;
    }
    this.exportandoSubject.next(true);
    const sucIds = this.filtroSucursales.normalizarIds();
    const filtros = etiquetasFiltroPeriodoGrafico(this.filtroPeriodo);
    this.graficoService
      .exportarGraficoExcel("GASTO_CATEGORIA", {
        periodos: periodosDesdeFiltro(this.filtroPeriodo),
        sucIds,
        ...filtros,
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
        descargarExcelBase64(
          base64,
          nombreArchivoGraficoExcel("GASTO_CATEGORIA")
        );
      });
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
            desgloseAnhos: item?.desgloseAnhos,
          });
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        // Deja lugar abajo para la escala de color, que es la leyenda del degradé.
        bottom: 48,
        containLabel: true,
      },
      visualMap: {
        type: "continuous",
        // dimension 0 es el valor de la barra: con el default, ECharts toma la categoría y
        // pinta todo del mismo color.
        dimension: 0,
        min: 0,
        max: Math.max(...valores, 0),
        orient: "horizontal",
        left: "center",
        bottom: 4,
        itemHeight: 160,
        calculable: false,
        // Escala de calor multi-color: sin esta leyenda el degradé no dice qué significa.
        text: ["Mayor gasto", "Menor gasto"],
        textStyle: { color: GRAFICO_COLORES.textSecondary, fontSize: 12 },
        inRange: { color: ESCALA_GASTO },
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
            borderRadius: [0, 4, 4, 0],
          },
          barWidth: "60%",
        },
      ],
    });
  }
}
