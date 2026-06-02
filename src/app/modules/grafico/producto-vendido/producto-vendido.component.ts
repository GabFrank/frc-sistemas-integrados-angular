import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { GraficoFiltrosPeriodo } from "../utils/grafico-filtro-rango-fechas.helper";
import { EChartsOption } from "echarts";
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  debounceTime,
  finalize,
  forkJoin,
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

  sucursalControl = new FormControl<number[]>([]);
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
    this.sucursalControl.setValue([]);
    this.familiaControl.setValue(null);
    this.limitControl.setValue(10);
    this.filtroPeriodo.limpiar();
    this.productosSeleccionadosIds = [];
    this.productosSeleccionadosNombres = [];
    this.productosIdsBusquedaSubject.next([]);
    this.cdr.markForCheck();
  }

  filtrar(): void {
    this.filtrarSubject.next();
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
            this.sucursalControl.value || [],
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
    const anhoFinal =
      this.filtroPeriodo.anhoControl.value || new Date().getFullYear();
    const mesesFinal = this.filtroPeriodo.normalizarMesesSeleccionados(
      this.filtroPeriodo.mesControl.value
    );
    const rangoDias = this.filtroPeriodo.obtenerRangoDiasSiAplica();

    const sucursalesNormalizadas = (sucIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    const sucursalesFinal: Array<number | null> = sucursalesNormalizadas.length
      ? Array.from(new Set(sucursalesNormalizadas))
      : [null];

    const queries: Record<string, Observable<ProductoVendidoEstadistica[]>> = {};
    for (const sucId of sucursalesFinal) {
      for (const mes of mesesFinal) {
        const rango =
          rangoDias ?? this.filtroPeriodo.calcularRangoMes(anhoFinal, mes);
        const clave = `suc_${sucId ?? "todas"}_mes_${mes}`;
        queries[clave] = this.consultarProductosPorSucursal(
          rango.inicio,
          rango.fin,
          sucId || undefined,
          famId,
          limit,
          productoIds
        );
      }
    }

    const keys = Object.keys(queries);
    if (keys.length === 1) {
      return queries[keys[0]].pipe(finalize(() => this.cargandoSubject.next(false)));
    }

    return forkJoin(queries).pipe(
      map((resultados) => this.combinarProductos(resultados)),
      finalize(() => this.cargandoSubject.next(false))
    );
  }

  private consultarProductosPorSucursal(
    inicio: string,
    fin: string,
    sucId: number | undefined,
    famId: number | null,
    limit: number,
    productoIds: number[]
  ): Observable<ProductoVendidoEstadistica[]> {
    return this.graficoService
      .obtenerProductosMasVendidos(
        inicio,
        fin,
        sucId,
        famId || undefined,
        limit || 10,
        false,
        undefined,
        productoIds?.length ? productoIds : undefined
      )
      .pipe(
        timeout(20000),
        catchError(() => of([]))
      );
  }

  private combinarProductos(
    resultados: Record<string, ProductoVendidoEstadistica[]>
  ): ProductoVendidoEstadistica[] {
    const mapa = new Map<string, ProductoVendidoEstadistica>();

    for (const items of Object.values(resultados)) {
      for (const item of items || []) {
        const existente = mapa.get(item.productoId);
        if (existente) {
          existente.cantidad += item.cantidad || 0;
          existente.totalMonto += item.totalMonto || 0;
        } else {
          mapa.set(item.productoId, { ...item });
        }
      }
    }

    // Recalcular porcentajes
    const total = Array.from(mapa.values()).reduce((s, e) => s + e.totalMonto, 0);
    for (const item of mapa.values()) {
      item.porcentaje = total > 0 ? (item.totalMonto / total) * 100 : 0;
    }

    return this.normalizarEstadisticas(Array.from(mapa.values())).sort(
      (a, b) => b.totalMonto - a.totalMonto
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
