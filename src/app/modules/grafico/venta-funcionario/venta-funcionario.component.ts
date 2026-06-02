import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
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
  forkJoin,
  map,
  Subject,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatDialog } from "@angular/material/dialog";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { GraficoService } from "../grafico.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../shared/components/search-list-dialog/search-list-dialog.component";
import { UsuarioSearchGQL } from "../../personas/usuarios/graphql/usuarioSearch";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Tab } from "../../../layouts/tab/tab.model";
import { VistaGraficoShell } from "../../../shared/models/grafico-vista.model";
import {
  GRAFICO_COLORES,
  GRAFICO_PALETA_BARRAS,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { VentaFuncionarioDesdeLucroTabData } from "./interfaces/venta-funcionario-desde-lucro-tab-data.model";
import { VentaFuncionarioItem } from "./interfaces/venta-funcionario-item.model";
import { VentaFuncionarioDatosGraficoProcesados } from "./interfaces/venta-funcionario-datos-grafico-procesados.model";
import { GraficoFiltrosPeriodo } from "../utils/grafico-filtro-rango-fechas.helper";
import { GraficoFiltroSucursalesMulti } from "../utils/grafico-filtro-sucursales-multi.helper";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "venta-funcionario",
  templateUrl: "./venta-funcionario.component.html",
  styleUrls: ["./venta-funcionario.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "venta-funcionario-host",
  },
})
export class VentaFuncionarioComponent implements OnInit {
  @Input() data: Tab;

  modoExterno = false;
  funcionariosSeleccionados: Usuario[] = [];

  readonly filtroSucursales = new GraficoFiltroSucursalesMulti();
  readonly filtroPeriodo = new GraficoFiltrosPeriodo();

  sucursales$: Observable<Sucursal[]>;

  private tituloExterno: string | null = null;
  private subtituloExterno: string | null = null;
  private mostrarTodosExterno = false;

  private graficoService = inject(GraficoService);
  private dialog = inject(MatDialog);
  private usuarioSearchGQL = inject(UsuarioSearchGQL);
  private cdr = inject(ChangeDetectorRef);

  private readonly datosSubject =
    new BehaviorSubject<VentaFuncionarioDatosGraficoProcesados | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  private readonly funcionariosSeleccionadosSubject = new BehaviorSubject<
    Usuario[]
  >([]);
  private readonly filtrarSubject = new Subject<void>();

  private datosCrudos: VentaFuncionarioItem[] = [];

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
    this.sucursales$ = this.sucursalesSubject.asObservable();

    this.funcionariosSeleccionadosSubject
      .pipe(untilDestroyed(this))
      .subscribe((usuarios) => {
        this.funcionariosSeleccionados = usuarios;
        this.cdr.markForCheck();
      });

    const tabPayload = this.data?.tabData?.data as
      | VentaFuncionarioDesdeLucroTabData
      | undefined;

    if (
      tabPayload?.source === "lucro-por-funcionario" &&
      tabPayload.datos?.length
    ) {
      this.modoExterno = true;
      this.datosCrudos = tabPayload.datos;
      this.tituloExterno = tabPayload.titulo ?? null;
      this.subtituloExterno = tabPayload.subtitulo ?? null;
      this.mostrarTodosExterno = tabPayload.mostrarTodos ?? true;
      this.datosSubject.next(this.procesarDatos(this.datosCrudos));
      this.cdr.markForCheck();
      return;
    }

    this.filtroPeriodo.configurarLimitesRangoDias(
      (source) => source.pipe(untilDestroyed(this)),
      () => this.cdr.markForCheck()
    );
    this.cargarMetadata();
    this.configurarDataStream();
  }

  buscarFuncionario(): void {
    const dialogData: SearchListtDialogData = {
      titulo: "Buscar Funcionario",
      query: this.usuarioSearchGQL,
      tableData: [
        { id: "id", nombre: "ID", width: "50px" },
        { id: "nombre", nombre: "Nombre", nested: true, nestedId: "persona" },
        { id: "nickname", nombre: "Usuario" },
      ],
      inicialSearch: true,
      multiple: true,
      seleccionadosIniciales: [...this.funcionariosSeleccionados],
    };

    this.dialog
      .open(SearchListDialogComponent, {
        data: dialogData,
        width: "600px",
        height: "600px",
      })
      .afterClosed()
      .subscribe((selected: Usuario | Usuario[]) => {
        if (Array.isArray(selected)) {
          this.aplicarFuncionariosFiltro(selected);
        } else if (selected) {
          this.aplicarFuncionariosFiltro([selected]);
        }
      });
  }

  aplicarFuncionariosFiltro(usuarios: Usuario[]): void {
    this.funcionariosSeleccionadosSubject.next(usuarios || []);
  }

  nombreFuncionario(usuario: Usuario): string {
    return usuario?.persona?.nombre || usuario?.nickname || "";
  }

  quitarFuncionario(indice: number): void {
    const actualizados = this.funcionariosSeleccionados.filter(
      (_, i) => i !== indice
    );
    this.funcionariosSeleccionadosSubject.next(actualizados);
  }

  limpiarFiltros(): void {
    this.filtroSucursales.limpiar();
    this.filtroPeriodo.limpiar();
    this.funcionariosSeleccionadosSubject.next([]);
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
  }

  private configurarDataStream(): void {
    this.filtrarSubject
      .pipe(
        startWith(void 0),
        debounceTime(300),
        tap(() => this.cargandoSubject.next(true)),
        switchMap(() =>
          this.consultarDatos(
            this.filtroSucursales.normalizarIds(),
            this.funcionariosSeleccionadosSubject.value
          )
        ),
        untilDestroyed(this)
      )
      .subscribe((datos) => {
        this.datosCrudos = datos || [];
        this.datosSubject.next(this.procesarDatos(this.datosCrudos));
        this.cdr.markForCheck();
      });
  }

  private consultarDatos(
    sucIds: number[],
    funcionarios: Usuario[]
  ): Observable<VentaFuncionarioItem[]> {
    const anhoFinal =
      this.filtroPeriodo.anhoControl.value || new Date().getFullYear();
    const rangos = this.filtroPeriodo.resolverRangosConsulta(anhoFinal);
    const sucursalesFinal =
      this.filtroSucursales.resolverParaConsultaMulti(sucIds);
    const queries: Record<string, Observable<VentaFuncionarioItem[]>> = {};

    for (const sucId of sucursalesFinal) {
      rangos.forEach((rango, indice) => {
        const clave = `suc_${sucId ?? "todas"}_rango_${indice}`;
        queries[clave] = this.consultarVentasPorRango(
          rango.inicio,
          rango.fin,
          sucId || undefined,
          funcionarios
        );
      });
    }

    const keys = Object.keys(queries);
    if (keys.length === 1) {
      return queries[keys[0]].pipe(finalize(() => this.cargandoSubject.next(false)));
    }

    return forkJoin(queries).pipe(
      map((resultados) => this.combinarFuncionarios(resultados)),
      finalize(() => this.cargandoSubject.next(false))
    );
  }

  private consultarVentasPorRango(
    inicio: string,
    fin: string,
    sucId: number | undefined,
    funcionarios: Usuario[]
  ): Observable<VentaFuncionarioItem[]> {
    if (funcionarios.length === 0) {
      return this.graficoService.obtenerVentasPorFuncionario(
        inicio,
        fin,
        sucId,
        undefined
      );
    }

    if (funcionarios.length === 1) {
      return this.graficoService.obtenerVentasPorFuncionario(
        inicio,
        fin,
        sucId,
        funcionarios[0].id
      );
    }

    return forkJoin(
      funcionarios.map((f) =>
        this.graficoService.obtenerVentasPorFuncionario(
          inicio,
          fin,
          sucId,
          f.id
        )
      )
    ).pipe(
      map((listas) =>
        this.combinarFuncionarios(
          Object.fromEntries(listas.map((items, i) => [String(i), items]))
        )
      )
    );
  }

  private combinarFuncionarios(
    resultados: Record<string, VentaFuncionarioItem[]>
  ): VentaFuncionarioItem[] {
    const mapa = new Map<number, VentaFuncionarioItem>();

    for (const items of Object.values(resultados)) {
      for (const item of items || []) {
        const existente = mapa.get(item.id);
        if (existente) {
          existente.total += item.total || 0;
          existente.cantidad += item.cantidad || 0;
        } else {
          mapa.set(item.id, { ...item });
        }
      }
    }

    return Array.from(mapa.values());
  }

  private procesarDatos(data: VentaFuncionarioItem[]): VentaFuncionarioDatosGraficoProcesados {
    let validas = [...(data || [])].sort(
      (a, b) => (b.total || 0) - (a.total || 0)
    );

    if (this.funcionariosSeleccionados.length > 0) {
      const ids = new Set(this.funcionariosSeleccionados.map((u) => u.id));
      const encontrados = validas.filter((v) => ids.has(v.id));
      const idsEncontrados = new Set(encontrados.map((v) => v.id));
      const faltantes = this.funcionariosSeleccionados
        .filter((u) => !idsEncontrados.has(u.id))
        .map((u) => ({
          id: u.id,
          funcionario: this.nombreFuncionario(u),
          total: 0,
          cantidad: 0,
          productoMasVendido: "Sin datos",
          sucursales: "-",
        }));
      validas = [...encontrados, ...faltantes].sort(
        (a, b) => (b.total || 0) - (a.total || 0)
      );
    } else if (!this.mostrarTodosExterno) {
      validas = validas.slice(0, 15);
    }

    const totalGeneral = validas.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );
    const titulo =
      this.tituloExterno ?? this.resolverTituloGrafico();
    const subtext = this.subtituloExterno
      ? `${this.subtituloExterno} · Total: ${formatoMonedaPy(totalGeneral)}`
      : `Total Mostrado: ${formatoMonedaPy(totalGeneral)}`;

    const opciones: EChartsOption = {
      title: tituloGraficoCentrado(titulo, subtext),
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const fila = Array.isArray(params) ? params[0] : params;
          if (!fila || typeof fila !== "object") {
            return "";
          }
          const el = fila as {
            name: string;
            value: number;
            dataIndex: number;
          };
          const item = validas[el.dataIndex];
          return `<strong>${el.name}</strong><br/>
                    Total: ${formatoMonedaPy(Number(el.value))}<br/>
                    Cantidad de Ventas: ${item?.cantidad ?? 0}<br/>
                    <span style="font-size: 0.9em; color: #aaa">Producto Top:</span> ${item?.productoMasVendido || "N/A"}<br/>
                    <span style="font-size: 0.9em; color: #aaa">Sucursales:</span> ${item?.sucursales || "N/A"}`;
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
          formatter: (val: number) => (val / 1000000).toFixed(0) + "M",
        },
        splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
      },
      yAxis: {
        type: "category",
        data: validas.map((v) => v.funcionario),
        axisLabel: { color: GRAFICO_COLORES.textSecondary },
        inverse: true,
      },
      series: [
        {
          name: "Ventas",
          type: "bar",
          data: validas.map((v) => v.total),
          itemStyle: {
            color: (params: { dataIndex: number }) =>
              GRAFICO_PALETA_BARRAS[
                params.dataIndex % GRAFICO_PALETA_BARRAS.length
              ],
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: "right",
            formatter: (p) =>
              `₲ ${(Number(p.value) / 1000000).toFixed(1)}M`,
            color: GRAFICO_COLORES.text,
          },
        },
      ],
    };

    return { opciones, hayDatos: validas.length > 0 };
  }

  private resolverTituloGrafico(): string {
    const seleccionados = this.funcionariosSeleccionados;
    if (seleccionados.length === 0) {
      return "Ventas por Funcionario (Top 15)";
    }
    if (seleccionados.length === 1) {
      return `Ventas de: ${this.nombreFuncionario(seleccionados[0])}`;
    }
    const nombres = seleccionados.map((u) => this.nombreFuncionario(u));
    if (nombres.length <= 3) {
      return `Ventas de: ${nombres.join(", ")}`;
    }
    return `Ventas de: ${nombres.slice(0, 2).join(", ")} y ${nombres.length - 2} más`;
  }
}
