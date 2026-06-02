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
  forkJoin,
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
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import { FormaPagoDatosGraficoProcesados } from "./interfaces/forma-pago-datos-grafico-procesados.model";
import { FormaPagoDetalleProcesado } from "./interfaces/forma-pago-detalle-procesado.model";
import { FormaPagoPantalla } from "./interfaces/forma-pago-pantalla.model";
import { GraficoFiltrosPeriodo } from "../utils/grafico-filtro-rango-fechas.helper";
import { GraficoFiltroSucursalesMulti } from "../utils/grafico-filtro-sucursales-multi.helper";

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
    this.cdr.markForCheck();
  }

  filtrar(): void {
    this.filtrarSubject.next();
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
    const anhoFinal =
      this.filtroPeriodo.anhoControl.value || new Date().getFullYear();
    const rangos = this.filtroPeriodo.resolverRangosConsulta(anhoFinal);
    const sucursalesFinal =
      this.filtroSucursales.resolverParaConsultaMulti(sucIds);
    const queries: Record<string, Observable<FormaPagoEstadistica[]>> = {};

    for (const sucId of sucursalesFinal) {
      rangos.forEach((rango, indice) => {
        const clave = `suc_${sucId ?? "todas"}_rango_${indice}`;
        queries[clave] = this.graficoService.obtenerEstadisticasFormaPago(
          rango.inicio,
          rango.fin,
          sucId || undefined
        );
      });
    }

    const keys = Object.keys(queries);
    if (keys.length === 1) {
      return queries[keys[0]].pipe(
        map((estadisticas) => this.procesarDatos(estadisticas)),
        finalize(() => this.cargandoSubject.next(false))
      );
    }

    return forkJoin(queries).pipe(
      map((resultados) => {
        const combinadas = this.combinarEstadisticas(resultados);
        return this.procesarDatos(combinadas);
      }),
      finalize(() => this.cargandoSubject.next(false))
    );
  }

  private combinarEstadisticas(
    resultados: Record<string, FormaPagoEstadistica[]>
  ): FormaPagoEstadistica[] {
    const mapa = new Map<string, FormaPagoEstadistica>();

    for (const items of Object.values(resultados)) {
      for (const item of items || []) {
        const clave = item.descripcion;
        const existente = mapa.get(clave);
        if (existente) {
          existente.totalMonto += item.totalMonto;
          existente.cantidadTransacciones += item.cantidadTransacciones;
        } else {
          mapa.set(clave, { ...item });
        }
      }
    }

    const total = Array.from(mapa.values()).reduce((s, e) => s + e.totalMonto, 0);
    for (const item of mapa.values()) {
      item.porcentaje = total > 0 ? (item.totalMonto / total) * 100 : 0;
    }

    return Array.from(mapa.values());
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
