import {
  ChangeDetectionStrategy,
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
import { FormaPagoEstadistica } from "./interfaces/forma-pago-estadistica.model";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { GraficoService } from "../grafico.service";
import { GraficoFiltrosFechaComponent } from "../../../shared/components/grafico-filtros-fecha/grafico-filtros-fecha.component";
import { RangoFechaGrafico } from "../../../shared/components/grafico-filtros-fecha/grafico-filtros-fecha.model";
import {
  GRAFICO_COLORES,
  GRAFICO_PALETA_BARRAS,
  formatoMonedaPy,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { FormaPagoDatosGraficoProcesados } from "./interfaces/forma-pago-datos-grafico-procesados.model";
import { FormaPagoDetalleProcesado } from "./interfaces/forma-pago-detalle-procesado.model";
import { FormaPagoPantalla } from "./interfaces/forma-pago-pantalla.model";
import { formatearRangoFechaGraficoParaApi } from "../utils/grafico-fecha-api.utils";

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
  @ViewChild(GraficoFiltrosFechaComponent)
  filtrosFechaRef: GraficoFiltrosFechaComponent;

  private graficoService = inject(GraficoService);

  private readonly datosSubject =
    new BehaviorSubject<FormaPagoDatosGraficoProcesados | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly rangoSubject = new BehaviorSubject<RangoFechaGrafico | null>(
    null
  );
  private readonly sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);

  sucursalControl = new FormControl<number | null>(null);
  sucursales$: Observable<Sucursal[]> = this.sucursalesSubject.asObservable();

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

  ngOnInit(): void {
    this.cargarSucursales();
    this.configurarDataStream();
  }

  onRangoFechaChange(rango: RangoFechaGrafico): void {
    this.rangoSubject.next(rango);
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue(null);
    this.filtrosFechaRef?.limpiarFiltros();
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
  }

  private configurarDataStream(): void {
    combineLatest([
      this.rangoSubject.pipe(
        filter((rango): rango is RangoFechaGrafico => rango !== null)
      ),
      this.sucursalControl.valueChanges.pipe(
        startWith(this.sucursalControl.value),
        distinctUntilChanged()
      ),
    ])
      .pipe(
        debounceTime(300),
        tap(() => this.cargandoSubject.next(true)),
        switchMap(([rango, sucId]) => {
          const { inicio, fin } = formatearRangoFechaGraficoParaApi(rango);
          return this.graficoService
            .obtenerEstadisticasFormaPago(inicio, fin, sucId || undefined)
            .pipe(
              map((estadisticas) => this.procesarDatos(estadisticas)),
              finalize(() => this.cargandoSubject.next(false))
            );
        }),
        untilDestroyed(this)
      )
      .subscribe((datos) => this.datosSubject.next(datos));
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
      })
    );

    const opciones: EChartsOption = {
      title: tituloGraficoCentrado(
        "Distribución de Formas de Pago",
        `Total: ${formatoMonedaPy(totalMontoNum)}`
      ),
      tooltip: {
        trigger: "item",
        backgroundColor: GRAFICO_COLORES.background,
        borderColor: GRAFICO_COLORES.axisLine,
        textStyle: { color: GRAFICO_COLORES.text },
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number };
          return `<strong>${p.name}</strong><br/>Monto: ${formatoMonedaPy(Number(p.value))}<br/>Porcentaje: ${p.percent.toFixed(2)}%`;
        },
      },
      legend: {
        orient: "vertical",
        right: "5%",
        top: "center",
        textStyle: { color: GRAFICO_COLORES.textSecondary },
      },
      series: [
        {
          name: "Forma de Pago",
          type: "pie",
          radius: ["40%", "70%"],
          center: ["40%", "55%"],
          itemStyle: {
            borderRadius: 8,
            borderColor: GRAFICO_COLORES.backgroundDark,
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: "{b}: {d}%",
            color: GRAFICO_COLORES.textSecondary,
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
