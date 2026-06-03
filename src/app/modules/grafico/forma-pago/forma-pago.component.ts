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
import { FormaPagoEstadistica } from "./interfaces/forma-pago-estadistica.model";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { GraficoService } from "../grafico.service";
import {
  GRAFICO_COLORES,
  GRAFICO_PALETA_BARRAS,
  formatoMonedaPy,
} from "../../../shared/utils/grafico-echarts.theme";
import { FormaPagoDatosGraficoProcesados } from "./interfaces/forma-pago-datos-grafico-procesados.model";
import { FormaPagoDetalleProcesado } from "./interfaces/forma-pago-detalle-procesado.model";
import { FormaPagoPantalla } from "./interfaces/forma-pago-pantalla.model";
import { FormaPagoMonedaDesglose } from "./interfaces/forma-pago-moneda-desglose.model";
import { GraficoFiltrosPeriodo } from "../utils/grafico-filtro-rango-fechas.helper";
import { GraficoFiltroSucursalesMulti } from "../utils/grafico-filtro-sucursales-multi.helper";
import { periodosDesdeFiltro } from "../utils/grafico-consulta-multi.helper";
import { formatearTooltipGraficoPeriodo } from "../utils/grafico-tooltip-periodo.util";
import {
  etiquetaMoneda,
  formatoMontoMoneda,
} from "./utils/forma-pago-moneda-format.util";
import {
  descargarExcelBase64,
  etiquetaSucursalesSeleccionadas,
  etiquetasFiltroPeriodoGrafico,
  nombreArchivoGraficoExcel,
} from "../utils/grafico-excel-export.util";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "forma-pago",
  templateUrl: "./forma-pago.component.html",
  styleUrls: ["./forma-pago.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "forma-pago-host",
  },
})
export class FormaPagoComponent implements OnInit {
  private graficoService = inject(GraficoService);
  private cdr = inject(ChangeDetectorRef);

  readonly filtroSucursales = new GraficoFiltroSucursalesMulti();
  readonly filtroPeriodo = new GraficoFiltrosPeriodo();

  sucursales$: Observable<Sucursal[]>;

  detallesConDesglose: FormaPagoDetalleProcesado[] = [];

  private readonly datosSubject =
    new BehaviorSubject<FormaPagoDatosGraficoProcesados | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly exportandoSubject = new BehaviorSubject<boolean>(false);
  private readonly sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  private readonly filtrarSubject = new Subject<void>();

  readonly pantalla$: Observable<FormaPagoPantalla> = combineLatest([
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
      totalTransacciones: datos?.totalTransacciones ?? "",
    }))
  );
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly exportando$ = this.exportandoSubject.asObservable();
  readonly puedeExportar$ = this.datosSubject.pipe(
    map((datos) => !!(datos?.hayDatos))
  );

  ngOnInit(): void {
    this.cargarSucursales();
    this.filtroPeriodo.configurarLimitesRangoDias(
      (source) => source.pipe(untilDestroyed(this)),
      () => this.cdr.markForCheck()
    );
    this.configurarDataStream();
  }

  alternarDesglose(indice: number): void {
    this.detallesConDesglose[indice].expandido =
      !this.detallesConDesglose[indice].expandido;
    this.cdr.markForCheck();
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
    const datos = this.datosSubject.value;
    if (!datos?.hayDatos || this.exportandoSubject.value) {
      return;
    }
    this.exportandoSubject.next(true);
    const sucIds = this.filtroSucursales.normalizarIds();
    const filtros = etiquetasFiltroPeriodoGrafico(this.filtroPeriodo);
    this.graficoService
      .exportarGraficoExcel("FORMA_PAGO", {
        periodos: periodosDesdeFiltro(this.filtroPeriodo),
        sucIds,
        ...filtros,
        filtroSucursales: etiquetaSucursalesSeleccionadas(
          this.sucursalesSubject.value,
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
        descargarExcelBase64(base64, nombreArchivoGraficoExcel("FORMA_PAGO"));
      });
  }

  private cargarSucursales(): void {
    this.graficoService
      .obtenerSucursales()
      .pipe(
        untilDestroyed(this),
        map((sucs) =>
          (sucs || []).filter((s) => s.activo && s.id > 0 && s.id !== 999)
        )
      )
      .subscribe((sucs) => this.sucursalesSubject.next(sucs));

    this.sucursales$ = this.sucursalesSubject.asObservable();
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
      .subscribe((datos) => {
        this.datosSubject.next(datos);
        this.detallesConDesglose = datos?.detalles || [];
        this.cdr.markForCheck();
      });
  }

  private consultarDatos(
    sucIds: number[]
  ): Observable<FormaPagoDatosGraficoProcesados> {
    return this.graficoService
      .obtenerEstadisticasFormaPagoMulti(
        periodosDesdeFiltro(this.filtroPeriodo),
        this.filtroSucursales.normalizarIds(sucIds)
      )
      .pipe(
        map((estadisticas) => this.procesarDatos(estadisticas)),
        finalize(() => this.cargandoSubject.next(false))
      );
  }

  private procesarDatos(
    estadisticas: FormaPagoEstadistica[]
  ): FormaPagoDatosGraficoProcesados {
    const validas = (estadisticas || []).filter(
      (e) => e.cantidadTransacciones > 0
    );
    const totalMontoNum = validas.reduce(
      (sum, e) => sum + (e.totalMonto || 0),
      0
    );
    const totalTransNum = validas.reduce(
      (sum, e) => sum + (e.cantidadTransacciones || 0),
      0
    );

    const detallesProcesados: FormaPagoDetalleProcesado[] = (estadisticas || []).map(
      (e, i) => ({
        descripcion: e.descripcion,
        montoFormateado: formatoMonedaPy(e.totalMonto),
        cantidadFormateada: `${e.cantidadTransacciones.toLocaleString("es-PY")} transacciones`,
        porcentaje: e.porcentaje || 0,
        color: GRAFICO_PALETA_BARRAS[i % GRAFICO_PALETA_BARRAS.length],
        icono: this.resolverIconoFormaPago(e.descripcion),
        expandido: false,
        desglose: this.procesarDesgloseMoneda(e.desgloseMoneda),
      })
    );

    const opciones: EChartsOption = {
      tooltip: {
        trigger: "item",
        backgroundColor: GRAFICO_COLORES.background,
        borderColor: GRAFICO_COLORES.axisLine,
        textStyle: { color: GRAFICO_COLORES.text },
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number };
          const item = (estadisticas || []).find((e) => e.descripcion === p.name);
          return formatearTooltipGraficoPeriodo({
            titulo: p.name,
            total: Number(p.value),
            desglosePeriodos: item?.desglosePeriodos,
            desgloseAnhos: item?.desgloseAnhos,
            lineasExtra: [`Porcentaje: ${p.percent.toFixed(2)}%`],
          });
        },
      },
      legend: {
        orient: "horizontal",
        bottom: 0,
        left: "center",
        itemGap: 16,
        textStyle: { color: GRAFICO_COLORES.textSecondary, fontSize: 12 },
      },
      series: [
        {
          name: "Forma de Pago",
          type: "pie",
          radius: ["48%", "78%"],
          center: ["50%", "46%"],
          itemStyle: {
            borderRadius: 8,
            borderColor: GRAFICO_COLORES.backgroundDark,
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: "bold",
              color: GRAFICO_COLORES.text,
              formatter: "{b}\n{d}%",
            },
          },
          data: validas.map((e, i) => ({
            value: e.totalMonto,
            name: e.descripcion,
            itemStyle: {
              color: GRAFICO_PALETA_BARRAS[i % GRAFICO_PALETA_BARRAS.length],
            },
          })),
        },
      ],
    };

    return {
      opciones,
      detalles: detallesProcesados,
      totalMonto: formatoMonedaPy(totalMontoNum),
      totalTransacciones: totalTransNum.toLocaleString("es-PY"),
      hayDatos: totalTransNum > 0,
    };
  }

  private procesarDesgloseMoneda(
    desglose?: FormaPagoMonedaDesglose[]
  ): FormaPagoDetalleProcesado["desglose"] {
    return (desglose || [])
      .filter((d) => d.totalMonto > 0)
      .sort((a, b) => b.totalMonto - a.totalMonto)
      .map((d) => ({
        moneda: etiquetaMoneda(d.denominacion),
        monto: d.totalMonto,
        montoFormateado: formatoMontoMoneda(
          d.totalMonto,
          d.simbolo,
          d.denominacion
        ),
        cantidad: d.cantidadTransacciones,
      }));
  }

  private resolverIconoFormaPago(desc: string): string {
    const iconos: Record<string, string> = {
      EFECTIVO: "payments",
      TARJETA: "credit_card",
      CONVENIO: "handshake",
      TRANSFERENCIA: "account_balance",
      CHEQUE: "receipt_long",
    };
    return iconos[desc?.toUpperCase()] || "payment";
  }
}
