import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { GraficoFiltrosPeriodo } from "../utils/grafico-filtro-rango-fechas.helper";
import { GraficoFiltroSucursalesMulti } from "../utils/grafico-filtro-sucursales-multi.helper";
import { periodosDesdeFiltro } from "../utils/grafico-consulta-multi.helper";
import { formatearTooltipGraficoPeriodo } from "../utils/grafico-tooltip-periodo.util";
import { EChartsOption } from "echarts";
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  debounceTime,
  finalize,
  map,
  of,
  Subject,
  startWith,
  switchMap,
  tap,
  timeout,
} from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatDialog } from "@angular/material/dialog";
import { ProductoForPdvGQL } from "../../productos/producto/graphql/productoSearchForPdv";
import { ProductoVendidoEstadistica } from "./interfaces/producto-vendido-estadistica.model";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Familia } from "../../productos/familia/familia.model";
import { GraficoService } from "../grafico.service";
import {
  GRAFICO_COLORES,
  GRAFICO_PALETA_BARRAS,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { ProductoVendidoDatosGraficoProcesados } from "./interfaces/producto-vendido-datos-grafico-procesados.model";
import { ProductoVendidoDetalleProcesado } from "./interfaces/producto-vendido-detalle-procesado.model";
import { ProductoVendidoPantalla } from "./interfaces/producto-vendido-pantalla.model";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../shared/components/search-list-dialog/search-list-dialog.component";
import {
  descargarExcelBase64,
  etiquetaSucursalesSeleccionadas,
  etiquetasFiltroPeriodoGrafico,
  nombreArchivoGraficoExcel,
} from "../utils/grafico-excel-export.util";

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
  private graficoService = inject(GraficoService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private productoSearchGQL = inject(ProductoForPdvGQL);

  readonly filtroSucursales = new GraficoFiltroSucursalesMulti();
  familiaControl = new FormControl<number | null>(null);
  limitControl = new FormControl<number>(10);
  readonly filtroPeriodo = new GraficoFiltrosPeriodo();

  /** IDs de productos específicos para búsqueda */
  productosSeleccionadosIds: number[] = [];
  productosSeleccionadosNombres: string[] = [];

  limits = [10, 30, 50, 100];

  private readonly datosSubject =
    new BehaviorSubject<ProductoVendidoDatosGraficoProcesados | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly exportandoSubject = new BehaviorSubject<boolean>(false);
  private readonly sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  private readonly familiasSubject = new BehaviorSubject<Familia[]>([]);
  private readonly indicesOcultosSubject = new BehaviorSubject<Set<string>>(
    new Set()
  );
  private readonly estadisticasSubject = new BehaviorSubject<
    ProductoVendidoEstadistica[]
  >([]);
  private readonly productosIdsBusquedaSubject = new BehaviorSubject<number[]>([]);
  private readonly filtrarSubject = new Subject<void>();

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
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly exportando$ = this.exportandoSubject.asObservable();
  readonly puedeExportar$ = this.datosSubject.pipe(
    map((datos) => !!(datos?.hayDatos))
  );

  ngOnInit(): void {
    this.filtroPeriodo.configurarLimitesRangoDias(
      (source) => source.pipe(untilDestroyed(this)),
      () => this.cdr.markForCheck()
    );
    this.cargarMetadata();
    this.configurarDataStream();
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

  buscarProductoEspecifico(): void {
    const dialogData: SearchListtDialogData = {
      titulo: "Buscar Producto",
      query: this.productoSearchGQL,
      tableData: [
        { id: "id", nombre: "Código", width: "80px" },
        { id: "descripcion", nombre: "Descripción" },
      ],
      inicialSearch: true,
    };

    this.dialog
      .open(SearchListDialogComponent, {
        data: dialogData,
        width: "600px",
        height: "600px",
      })
      .afterClosed()
      .subscribe((selected: { id: number; descripcion: string }) => {
        if (selected) {
          this.agregarProductoBusqueda(selected.id, selected.descripcion);
        }
      });
  }

  agregarProductoBusqueda(id: number, nombre: string): void {
    if (!this.productosSeleccionadosIds.includes(id)) {
      this.productosSeleccionadosIds = [...this.productosSeleccionadosIds, id];
      this.productosSeleccionadosNombres = [...this.productosSeleccionadosNombres, nombre];
      this.productosIdsBusquedaSubject.next(this.productosSeleccionadosIds);
      this.cdr.markForCheck();
    }
  }

  quitarProductoBusqueda(indice: number): void {
    this.productosSeleccionadosIds = this.productosSeleccionadosIds.filter((_, i) => i !== indice);
    this.productosSeleccionadosNombres = this.productosSeleccionadosNombres.filter((_, i) => i !== indice);
    this.productosIdsBusquedaSubject.next(this.productosSeleccionadosIds);
    this.cdr.markForCheck();
  }

  limpiarFiltros(): void {
    this.filtroSucursales.limpiar();
    this.familiaControl.setValue(null);
    this.limitControl.setValue(10);
    this.filtroPeriodo.limpiar();
    this.productosSeleccionadosIds = [];
    this.productosSeleccionadosNombres = [];
    this.productosIdsBusquedaSubject.next([]);
    this.filtrar();
    this.cdr.markForCheck();
  }

  filtrar(): void {
    this.filtrarSubject.next();
  }

  exportarExcel(): void {
    const datos = this.datosSubject.value;
    if (!datos?.hayDatos || this.exportandoSubject.value) {
      return;
    }
    this.exportandoSubject.next(true);
    const sucIds = this.filtroSucursales.normalizarIds();
    const filtros = etiquetasFiltroPeriodoGrafico(this.filtroPeriodo);
    const familiaId = this.familiaControl.value;
    const familias = this.familiasSubject.value;
    const familiaNombre =
      familiaId != null
        ? familias.find((f) => f.id === familiaId)?.nombre ?? String(familiaId)
        : null;
    const partesExtra: string[] = [];
    if (familiaNombre) {
      partesExtra.push(`Familia: ${familiaNombre}`);
    }
    if (this.productosSeleccionadosNombres.length) {
      partesExtra.push(
        `Productos: ${this.productosSeleccionadosNombres.join(", ")}`
      );
    }
    partesExtra.push(`Top: ${this.limitControl.value ?? 10}`);
    this.graficoService
      .exportarGraficoExcel("PRODUCTOS_VENDIDOS", {
        periodos: periodosDesdeFiltro(this.filtroPeriodo),
        sucIds,
        limit: this.limitControl.value ?? 10,
        familiaId,
        productoIds: this.productosSeleccionadosIds.length
          ? this.productosSeleccionadosIds
          : null,
        ...filtros,
        filtroSucursales: etiquetaSucursalesSeleccionadas(
          this.sucursalesSubject.value,
          sucIds
        ),
        filtroExtra: partesExtra.length ? partesExtra.join(" · ") : undefined,
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
          nombreArchivoGraficoExcel("PRODUCTOS_VENDIDOS")
        );
      });
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
    this.filtrarSubject
      .pipe(
        startWith(void 0),
        debounceTime(300),
        tap(() => {
          this.cargandoSubject.next(true);
          this.indicesOcultosSubject.next(new Set());
        }),
        switchMap(() =>
          this.consultarDatos(
            this.filtroSucursales.normalizarIds(),
            this.familiaControl.value,
            this.limitControl.value || 10,
            this.productosIdsBusquedaSubject.value
          )
        ),
        untilDestroyed(this)
      )
      .subscribe((estadisticas) => {
        this.estadisticasSubject.next(
          this.normalizarEstadisticas(estadisticas || [])
        );
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

  private consultarDatos(
    sucIds: number[],
    famId: number | null,
    limit: number,
    productoIds: number[]
  ): Observable<ProductoVendidoEstadistica[]> {
    return this.graficoService
      .obtenerProductosMasVendidosMulti(
        periodosDesdeFiltro(this.filtroPeriodo),
        this.filtroSucursales.normalizarIds(sucIds),
        famId || undefined,
        limit || 10,
        false,
        productoIds?.length ? productoIds : undefined
      )
      .pipe(
        timeout(20000),
        map((items) =>
          this.normalizarEstadisticas(items).sort(
            (a, b) => b.totalMonto - a.totalMonto
          )
        ),
        catchError(() => of([])),
        finalize(() => this.cargandoSubject.next(false))
      );
  }

  private normalizarEstadisticas(
    items: ProductoVendidoEstadistica[]
  ): ProductoVendidoEstadistica[] {
    return (items || []).map((item) => ({
      ...item,
      productoId: String(item?.productoId ?? ""),
      descripcion: item?.descripcion ?? "Sin descripción",
      cantidad: Number(item?.cantidad ?? 0),
      totalMonto: Number(item?.totalMonto ?? 0),
      porcentaje: Number(item?.porcentaje ?? 0),
      cantidadEntrada: Number(item?.cantidadEntrada ?? 0),
      cantidadVentaMovimiento: Number(item?.cantidadVentaMovimiento ?? 0),
      indiceRotacion: Number(item?.indiceRotacion ?? 0),
    }));
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
          const item = estadisticas.find((e) => e.descripcion === p.name);
          return formatearTooltipGraficoPeriodo({
            titulo: p.name,
            total: Number(p.value),
            desglosePeriodos: item?.desglosePeriodos,
            desgloseAnhos: item?.desgloseAnhos,
            lineasExtra: [
              `Cantidad: ${(item?.cantidad ?? 0).toLocaleString("es-PY")} unidades`,
              `Porcentaje: ${p.percent.toFixed(2)}%`,
            ],
          });
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
