import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
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
import {
  listarAnhosGrafico,
} from "../../../commons/core/utils/dateUtils";
import {
  MESES_GRAFICO,
  MesGraficoOption,
} from "../../../shared/constants/grafico.constants";

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

  sucursalControl = new FormControl<number[]>([]);
  anhoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number[]>([new Date().getMonth() + 1]);
  
  fechaRangoGroup = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null),
  });

  minFecha: Date | null = null;
  maxFecha: Date | null = null;

  sucursales$: Observable<Sucursal[]>;
  anhos: number[] = listarAnhosGrafico();
  meses: MesGraficoOption[] = MESES_GRAFICO;
  diasDisponibles: number[] = [];

  detallesConDesglose: FormaPagoDetalleProcesado[] = [];

  private readonly datosSubject =
    new BehaviorSubject<FormaPagoDatosGraficoProcesados | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);

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
    this.configurarDiasDisponibles();
  }

  alternarDesglose(indice: number): void {
    this.detallesConDesglose[indice].expandido =
      !this.detallesConDesglose[indice].expandido;
    this.cdr.markForCheck();
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue([]);
    this.anhoControl.setValue(new Date().getFullYear());
    this.mesControl.setValue([new Date().getMonth() + 1]);
    this.fechaRangoGroup.setValue({ inicio: null, fin: null });
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

  private configurarDiasDisponibles(): void {
    combineLatest([
      this.anhoControl.valueChanges.pipe(startWith(this.anhoControl.value)),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value)),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([anho, mesesSel]) => {
        const anhoFinal = anho || new Date().getFullYear();
        const mesesFinal = mesesSel?.length ? mesesSel : [new Date().getMonth() + 1];

        if (mesesFinal.length === 1) {
          const mes = mesesFinal[0];
          this.minFecha = new Date(anhoFinal, mes - 1, 1);
          this.maxFecha = new Date(anhoFinal, mes, 0);

          const ultimoDia = this.maxFecha.getDate();
          this.diasDisponibles = Array.from({ length: ultimoDia }, (_, i) => i + 1);

          // Reset range if it lies outside the newly selected month/year
          const actualInicio = this.fechaRangoGroup.value.inicio;
          if (actualInicio && (actualInicio.getFullYear() !== anhoFinal || actualInicio.getMonth() !== mes - 1)) {
            this.fechaRangoGroup.setValue({ inicio: null, fin: null }, { emitEvent: false });
          }
        } else {
          this.diasDisponibles = [];
          this.minFecha = null;
          this.maxFecha = null;
          this.fechaRangoGroup.setValue({ inicio: null, fin: null }, { emitEvent: false });
        }
        this.cdr.markForCheck();
      });
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
      this.fechaRangoGroup.valueChanges.pipe(
        startWith(this.fechaRangoGroup.value)
      ),
    ])
      .pipe(
        debounceTime(400),
        tap(() => this.cargandoSubject.next(true)),
        switchMap(([sucIds, anho, mesesSel, rangoFechas]) => {
          const diaInicio = rangoFechas?.inicio ? rangoFechas.inicio.getDate() : null;
          const diaFin = rangoFechas?.fin ? rangoFechas.fin.getDate() : null;
          return this.consultarDatos(sucIds, anho, mesesSel, diaInicio, diaFin);
        }),
        untilDestroyed(this)
      )
      .subscribe((datos) => {
        this.datosSubject.next(datos);
        this.detallesConDesglose = datos?.detalles || [];
        this.cdr.markForCheck();
      });
  }

  private consultarDatos(
    sucIds: number[],
    anho: number,
    mesesSel: number[],
    diaInicio: number | null,
    diaFin: number | null
  ): Observable<FormaPagoDatosGraficoProcesados> {
    const rango = this.calcularRangoFechas(anho, mesesSel, diaInicio, diaFin);
    const sucursalesFinal: Array<number | null> = sucIds?.length ? sucIds : [null];

    if (sucursalesFinal.length === 1) {
      return this.graficoService
        .obtenerEstadisticasFormaPago(rango.inicio, rango.fin, sucursalesFinal[0] || undefined)
        .pipe(
          map((estadisticas) => this.procesarDatos(estadisticas)),
          finalize(() => this.cargandoSubject.next(false))
        );
    }

    // Multi-sucursal
    const queries: Record<string, Observable<FormaPagoEstadistica[]>> = {};
    for (const sucId of sucursalesFinal) {
      const clave = `suc_${sucId ?? "todas"}`;
      queries[clave] = this.graficoService
        .obtenerEstadisticasFormaPago(rango.inicio, rango.fin, sucId || undefined);
    }

    return forkJoin(queries).pipe(
      map((resultados) => {
        const combinadas = this.combinarEstadisticas(resultados);
        return this.procesarDatos(combinadas);
      }),
      finalize(() => this.cargandoSubject.next(false))
    );
  }

  private calcularRangoFechas(
    anho: number,
    mesesSel: number[],
    diaInicio: number | null,
    diaFin: number | null
  ): { inicio: string; fin: string } {
    const anhoFinal = anho || new Date().getFullYear();
    const mesesFinal = mesesSel?.length ? mesesSel : [new Date().getMonth() + 1];
    const mesMin = Math.min(...mesesFinal);
    const mesMax = Math.max(...mesesFinal);

    // Si hay rango de días y es un solo mes
    if (diaInicio && diaFin && mesesFinal.length === 1) {
      const mesStr = String(mesMin).padStart(2, "0");
      const diaInicioStr = String(diaInicio).padStart(2, "0");
      const diaFinStr = String(diaFin).padStart(2, "0");
      return {
        inicio: `${anhoFinal}-${mesStr}-${diaInicioStr} 00:00:00`,
        fin: `${anhoFinal}-${mesStr}-${diaFinStr} 23:59:59`,
      };
    }

    const mesMinStr = String(mesMin).padStart(2, "0");
    const ultimoDia = new Date(anhoFinal, mesMax, 0);
    const mesMaxStr = String(ultimoDia.getMonth() + 1).padStart(2, "0");
    const diaMaxStr = String(ultimoDia.getDate()).padStart(2, "0");

    return {
      inicio: `${anhoFinal}-${mesMinStr}-01 00:00:00`,
      fin: `${anhoFinal}-${mesMaxStr}-${diaMaxStr} 23:59:59`,
    };
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

    // Recalcular porcentajes
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
