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
  debounceTime,
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
import { VistaGraficoShell } from "../../../shared/models/grafico-vista.model";
import {
  GRAFICO_COLORES,
  formatoEjeCompacto,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { GastoCategoriaItem } from "./interfaces/gasto-categoria-item.model";
import {
  listarAnhosGrafico,
} from "../../../commons/core/utils/dateUtils";
import {
  MESES_GRAFICO,
  MesGraficoOption,
} from "../../../shared/constants/grafico.constants";

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

  sucursalControl = new FormControl<number[]>([]);
  anhoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number[]>([new Date().getMonth() + 1]);

  sucursales$: Observable<Sucursal[]>;
  anhos: number[] = listarAnhosGrafico();
  meses: MesGraficoOption[] = MESES_GRAFICO;

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
      map((sucs) => (sucs || []).filter((s) => s.activo && s.id > 0 && s.id !== 999))
    );
    this.configurarDataStream();
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue([]);
    this.anhoControl.setValue(new Date().getFullYear());
    this.mesControl.setValue([new Date().getMonth() + 1]);
  }

  private configurarDataStream(): void {
    combineLatest([
      this.sucursalControl.valueChanges.pipe(
        startWith(this.sucursalControl.value)
      ),
      this.anhoControl.valueChanges.pipe(
        startWith(this.anhoControl.value)
      ),
      this.mesControl.valueChanges.pipe(
        startWith(this.mesControl.value)
      ),
    ])
      .pipe(
        debounceTime(300),
        tap(() => this.cargandoSubject.next(true)),
        switchMap(([sucIds, anho, mesesSel]) =>
          this.consultarDatos(sucIds, anho, mesesSel)
        ),
        untilDestroyed(this)
      )
      .subscribe((res) => {
        this.configurarGrafico(res || []);
      });
  }

  private consultarDatos(
    sucIds: number[],
    anho: number,
    mesesSel: number[]
  ): Observable<GastoCategoriaItem[]> {
    const anhoFinal = anho || new Date().getFullYear();
    const mesesFinal = mesesSel?.length ? mesesSel : [new Date().getMonth() + 1];
    const sucursalesFinal: Array<number | null> = sucIds?.length ? sucIds : [null];

    const rango = this.calcularRangoFechas(anhoFinal, mesesFinal);

    if (sucursalesFinal.length === 1) {
      return this.graficoService
        .obtenerGastosPorCategoria(rango.inicio, rango.fin, sucursalesFinal[0] || undefined)
        .pipe(finalize(() => this.cargandoSubject.next(false)));
    }

    // Multi-sucursal: combinar resultados
    const queries: Record<string, Observable<GastoCategoriaItem[]>> = {};
    for (const sucId of sucursalesFinal) {
      const clave = `suc_${sucId ?? "todas"}`;
      queries[clave] = this.graficoService
        .obtenerGastosPorCategoria(rango.inicio, rango.fin, sucId || undefined);
    }

    return forkJoin(queries).pipe(
      map((resultados) => this.combinarGastosCategorias(resultados)),
      finalize(() => this.cargandoSubject.next(false))
    );
  }

  private calcularRangoFechas(
    anho: number,
    meses: number[]
  ): { inicio: string; fin: string } {
    const mesMin = Math.min(...meses);
    const mesMax = Math.max(...meses);
    const mesMinStr = String(mesMin).padStart(2, "0");
    const ultimoDia = new Date(anho, mesMax, 0);
    const mesMaxStr = String(ultimoDia.getMonth() + 1).padStart(2, "0");
    const diaMaxStr = String(ultimoDia.getDate()).padStart(2, "0");

    return {
      inicio: `${anho}-${mesMinStr}-01 00:00:00`,
      fin: `${anho}-${mesMaxStr}-${diaMaxStr} 23:59:59`,
    };
  }

  private combinarGastosCategorias(
    resultados: Record<string, GastoCategoriaItem[]>
  ): GastoCategoriaItem[] {
    const mapaCategoria = new Map<string, GastoCategoriaItem>();

    for (const items of Object.values(resultados)) {
      for (const item of items || []) {
        const clave = item.categoria || "Sin Categoría";
        const existente = mapaCategoria.get(clave);
        if (existente) {
          existente.total += item.total;
          existente.cantidad = (existente.cantidad || 0) + (item.cantidad || 0);
        } else {
          mapaCategoria.set(clave, { ...item, cantidad: item.cantidad || 0 });
        }
      }
    }

    return Array.from(mapaCategoria.values());
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
