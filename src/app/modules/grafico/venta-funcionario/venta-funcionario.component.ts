import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
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
import {
  listarAnhosGrafico,
} from "../../../commons/core/utils/dateUtils";
import {
  MESES_GRAFICO,
  MesGraficoOption,
} from "../../../shared/constants/grafico.constants";

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
  funcionarioSeleccionado: Usuario | null = null;
  mostrarBotonQuitarFuncionario = false;
  colorBotonBuscarFuncionario: "" | "primary" = "";

  sucursalControl = new FormControl<number[]>([]);
  anhoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number[]>([new Date().getMonth() + 1]);

  sucursales$: Observable<Sucursal[]>;
  anhos: number[] = listarAnhosGrafico();
  meses: MesGraficoOption[] = MESES_GRAFICO;

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
  private readonly funcionarioSeleccionadoSubject =
    new BehaviorSubject<Usuario | null>(null);

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

  ngOnInit(): void {
    this.sucursales$ = this.sucursalesSubject.asObservable();

    this.funcionarioSeleccionadoSubject
      .pipe(untilDestroyed(this))
      .subscribe((usuario) => {
        this.funcionarioSeleccionado = usuario;
        this.mostrarBotonQuitarFuncionario = usuario !== null;
        this.colorBotonBuscarFuncionario = usuario ? "primary" : "";
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
    };

    this.dialog
      .open(SearchListDialogComponent, {
        data: dialogData,
        width: "600px",
        height: "600px",
      })
      .afterClosed()
      .subscribe((selected: Usuario) => {
        if (selected) {
          this.funcionarioSeleccionadoSubject.next(selected);
        }
      });
  }

  limpiarFuncionario(): void {
    this.funcionarioSeleccionadoSubject.next(null);
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue([]);
    this.anhoControl.setValue(new Date().getFullYear());
    this.mesControl.setValue([new Date().getMonth() + 1]);
    this.funcionarioSeleccionadoSubject.next(null);
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
      this.funcionarioSeleccionadoSubject.asObservable(),
    ])
      .pipe(
        debounceTime(300),
        tap(() => this.cargandoSubject.next(true)),
        switchMap(([sucIds, anho, mesesSel, funcionario]) =>
          this.consultarDatos(sucIds, anho, mesesSel, funcionario)
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
    anho: number,
    mesesSel: number[],
    funcionario: Usuario | null
  ): Observable<VentaFuncionarioItem[]> {
    const rango = this.calcularRangoFechas(anho, mesesSel);
    const sucursalesFinal: Array<number | null> = sucIds?.length ? sucIds : [null];

    if (sucursalesFinal.length === 1) {
      return this.graficoService
        .obtenerVentasPorFuncionario(
          rango.inicio,
          rango.fin,
          sucursalesFinal[0] || undefined,
          funcionario?.id
        )
        .pipe(finalize(() => this.cargandoSubject.next(false)));
    }

    // Multi-sucursal
    const queries: Record<string, Observable<VentaFuncionarioItem[]>> = {};
    for (const sucId of sucursalesFinal) {
      const clave = `suc_${sucId ?? "todas"}`;
      queries[clave] = this.graficoService
        .obtenerVentasPorFuncionario(
          rango.inicio,
          rango.fin,
          sucId || undefined,
          funcionario?.id
        );
    }

    return forkJoin(queries).pipe(
      map((resultados) => this.combinarFuncionarios(resultados)),
      finalize(() => this.cargandoSubject.next(false))
    );
  }

  private calcularRangoFechas(
    anho: number,
    mesesSel: number[]
  ): { inicio: string; fin: string } {
    const anhoFinal = anho || new Date().getFullYear();
    const mesesFinal = mesesSel?.length ? mesesSel : [new Date().getMonth() + 1];
    const mesMin = Math.min(...mesesFinal);
    const mesMax = Math.max(...mesesFinal);
    const mesMinStr = String(mesMin).padStart(2, "0");
    const ultimoDia = new Date(anhoFinal, mesMax, 0);
    const mesMaxStr = String(ultimoDia.getMonth() + 1).padStart(2, "0");
    const diaMaxStr = String(ultimoDia.getDate()).padStart(2, "0");

    return {
      inicio: `${anhoFinal}-${mesMinStr}-01 00:00:00`,
      fin: `${anhoFinal}-${mesMaxStr}-${diaMaxStr} 23:59:59`,
    };
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

    if (this.funcionarioSeleccionado) {
      const seleccionado = validas.find(
        (v) => v.id == this.funcionarioSeleccionado?.id
      );
      if (seleccionado) {
        validas = [seleccionado];
      } else {
        validas = [
          {
            id: this.funcionarioSeleccionado.id,
            funcionario:
              this.funcionarioSeleccionado.persona?.nombre ||
              this.funcionarioSeleccionado.nickname,
            total: 0,
            cantidad: 0,
            productoMasVendido: "Sin datos",
            sucursales: "-",
          },
        ];
      }
    } else if (!this.mostrarTodosExterno) {
      validas = validas.slice(0, 15);
    }

    const totalGeneral = validas.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );
    const titulo =
      this.tituloExterno ??
      (this.funcionarioSeleccionado
        ? `Ventas de: ${
            this.funcionarioSeleccionado.persona?.nombre ||
            this.funcionarioSeleccionado.nickname
          }`
        : "Ventas por Funcionario (Top 15)");
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
}
