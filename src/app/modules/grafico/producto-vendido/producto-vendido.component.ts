import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { ProductoVendidoEstadistica } from "./interfaces/producto-vendido-estadistica.model";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Familia } from "../../productos/familia/familia.model";
import { GraficoService } from "../grafico.service";
import { GraficoFiltrosFechaComponent } from "../../../shared/components/grafico-filtros-fecha/grafico-filtros-fecha.component";
import { RangoFechaGrafico } from "../../../shared/components/grafico-filtros-fecha/grafico-filtros-fecha.model";
import {
  GRAFICO_COLORES,
  GRAFICO_PALETA_BARRAS,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { ProductoVendidoDatosGraficoProcesados } from "./interfaces/producto-vendido-datos-grafico-procesados.model";
import { ProductoVendidoDetalleProcesado } from "./interfaces/producto-vendido-detalle-procesado.model";
import { ProductoVendidoPantalla } from "./interfaces/producto-vendido-pantalla.model";
import { formatearRangoFechaGraficoParaApi } from "../utils/grafico-fecha-api.utils";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "producto-vendido",
  templateUrl: "./producto-vendido.component.html",
  styleUrls: ["./producto-vendido.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "producto-vendido-host",
  },
})
export class ProductoVendidoComponent implements OnInit {
  @ViewChild(GraficoFiltrosFechaComponent)
  filtrosFechaRef: GraficoFiltrosFechaComponent;

  private graficoService = inject(GraficoService);
  private cdr = inject(ChangeDetectorRef);

  private readonly datosSubject =
    new BehaviorSubject<ProductoVendidoDatosGraficoProcesados | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly rangoSubject = new BehaviorSubject<RangoFechaGrafico | null>(
    null
  );
  private readonly sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  private readonly familiasSubject = new BehaviorSubject<Familia[]>([]);
  private readonly indicesOcultosSubject = new BehaviorSubject<Set<string>>(
    new Set()
  );
  private readonly estadisticasSubject = new BehaviorSubject<
    ProductoVendidoEstadistica[]
  >([]);

  sucursalControl = new FormControl<number | null>(null);
  familiaControl = new FormControl<number | null>(null);
  limitControl = new FormControl<number>(10);

  limits = [10, 30, 50, 100];

  sucursales$: Observable<Sucursal[]> = this.sucursalesSubject.asObservable();
  familias$: Observable<Familia[]> = this.familiasSubject.asObservable();

  readonly pantalla$: Observable<ProductoVendidoPantalla> = combineLatest([
    this.datosSubject,
    this.cargandoSubject,
  ]).pipe(
    map(([datos, cargando]) => ({
      cargando,
      datosListos: datos !== null,
      opciones: datos?.opciones ?? null,
      hayDatos: datos?.hayDatos ?? false,
      detalles: datos?.detalles ?? [],
      totalMonto: datos?.totalMonto ?? "",
    }))
  );

  ngOnInit(): void {
    this.cargarMetadata();
    this.configurarDataStream();
  }

  onRangoFechaChange(rango: RangoFechaGrafico): void {
    this.rangoSubject.next(rango);
  }

  alternarItem(id: string | number): void {
    if (id === null || id === undefined) {
      return;
    }

    const idStr = String(id);
    const nuevosIndices = new Set(this.indicesOcultosSubject.value);

    if (nuevosIndices.has(idStr)) {
      nuevosIndices.delete(idStr);
    } else {
      nuevosIndices.add(idStr);
    }

    this.indicesOcultosSubject.next(nuevosIndices);

    const estadisticasActuales = this.estadisticasSubject.value;
    if (estadisticasActuales.length > 0) {
      this.datosSubject.next(
        this.procesarDatos(estadisticasActuales, nuevosIndices)
      );
      this.cdr.markForCheck();
    }
  }

  trackByProductoId(_index: number, item: ProductoVendidoDetalleProcesado): string {
    return item.productoId;
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue(null);
    this.familiaControl.setValue(null);
    this.limitControl.setValue(10);
    this.filtrosFechaRef?.limpiarFiltros();
  }

  private cargarMetadata(): void {
    this.graficoService
      .obtenerSucursales()
      .pipe(
        untilDestroyed(this),
        map((sucs) =>
          (sucs || []).filter((s) => s.activo && s.id > 0 && s.id !== 999)
        )
      )
      .subscribe((sucs) => this.sucursalesSubject.next(sucs));

    this.graficoService
      .obtenerFamilias()
      .pipe(untilDestroyed(this))
      .subscribe((fams) => this.familiasSubject.next(fams));
  }

  private configurarDataStream(): void {
    const filtros$ = combineLatest([
      this.rangoSubject.pipe(
        filter((rango): rango is RangoFechaGrafico => rango !== null)
      ),
      this.sucursalControl.valueChanges.pipe(
        startWith(this.sucursalControl.value),
        distinctUntilChanged()
      ),
      this.familiaControl.valueChanges.pipe(
        startWith(this.familiaControl.value),
        distinctUntilChanged()
      ),
      this.limitControl.valueChanges.pipe(
        startWith(this.limitControl.value),
        distinctUntilChanged()
      ),
    ]).pipe(debounceTime(300));

    filtros$
      .pipe(
        tap(() => {
          this.cargandoSubject.next(true);
          this.indicesOcultosSubject.next(new Set());
        }),
        switchMap(([rango, sucId, famId, limit]) => {
          const { inicio, fin } = formatearRangoFechaGraficoParaApi(rango);
          return this.graficoService
            .obtenerProductosMasVendidos(
              inicio,
              fin,
              sucId || undefined,
              famId || undefined,
              limit || 10
            )
            .pipe(finalize(() => this.cargandoSubject.next(false)));
        }),
        untilDestroyed(this)
      )
      .subscribe((estadisticas) => {
        this.estadisticasSubject.next(estadisticas || []);
      });

    combineLatest([
      this.estadisticasSubject.asObservable(),
      this.indicesOcultosSubject.asObservable(),
    ])
      .pipe(
        map(([estadisticas, idsOcultos]) =>
          this.procesarDatos(estadisticas, idsOcultos)
        ),
        untilDestroyed(this)
      )
      .subscribe((datos) => {
        this.datosSubject.next(datos);
        this.cdr.markForCheck();
      });
  }

  private procesarDatos(
    estadisticas: ProductoVendidoEstadistica[],
    idsOcultos: Set<string>
  ): ProductoVendidoDatosGraficoProcesados {
    const validasTotal = (estadisticas || []).filter((e) => e.cantidad > 0);

    const detallesProcesados: ProductoVendidoDetalleProcesado[] = (estadisticas || []).map(
      (e, i) => {
        const idStr = String(e.productoId);
        return {
          productoId: idStr,
          descripcion: e.descripcion,
          montoFormateado: formatoMonedaPy(e.totalMonto),
          cantidadFormateada: `${e.cantidad.toLocaleString("es-PY")} unidades`,
          color: GRAFICO_PALETA_BARRAS[i % GRAFICO_PALETA_BARRAS.length],
          oculto: idsOcultos.has(idStr),
        };
      }
    );

    const datosParaGrafico = (estadisticas || []).filter(
      (e) => e.cantidad > 0 && !idsOcultos.has(String(e.productoId))
    );
    const totalMontoNum = datosParaGrafico.reduce(
      (sum, e) => sum + (e.totalMonto || 0),
      0
    );

    const opciones: EChartsOption = {
      title: tituloGraficoCentrado(
        "Top Productos más Vendidos",
        `Total: ${formatoMonedaPy(totalMontoNum)}`
      ),
      tooltip: {
        trigger: "item",
        backgroundColor: GRAFICO_COLORES.background,
        borderColor: GRAFICO_COLORES.axisLine,
        textStyle: { color: GRAFICO_COLORES.text },
        formatter: (params: unknown) => {
          const p = params as {
            name: string;
            value: number;
            percent: number;
          };
          return `<strong>${p.name}</strong><br/>Monto: ${formatoMonedaPy(Number(p.value))}<br/>Porcentaje: ${p.percent.toFixed(2)}%`;
        },
      },
      legend: { show: false },
      series: [
        {
          name: "Producto",
          type: "pie",
          radius: ["35%", "65%"],
          center: ["50%", "55%"],
          itemStyle: {
            borderRadius: 6,
            borderColor: GRAFICO_COLORES.backgroundDark,
            borderWidth: 2,
          },
          label: { show: false },
          data: (estadisticas || [])
            .map((e, i) => {
              if (e.cantidad <= 0 || idsOcultos.has(String(e.productoId))) {
                return null;
              }
              return {
                value: e.totalMonto,
                name: e.descripcion,
                itemStyle: {
                  color: GRAFICO_PALETA_BARRAS[i % GRAFICO_PALETA_BARRAS.length],
                },
              };
            })
            .filter((item) => item !== null),
        },
      ],
    };

    return {
      opciones,
      detalles: detallesProcesados,
      totalMonto: formatoMonedaPy(totalMontoNum),
      hayDatos: validasTotal.length > 0,
    };
  }
}
