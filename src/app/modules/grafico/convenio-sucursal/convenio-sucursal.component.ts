import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { EChartsOption } from "echarts";
import { BehaviorSubject, Observable, Subject, catchError, finalize, map, of, tap } from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { GraficoService } from "../grafico.service";
import { SucursalService } from "../../empresarial/sucursal/sucursal.service";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { GraficoFiltroSucursalesMulti } from "../utils/grafico-filtro-sucursales-multi.helper";
import { switchMapSinCortar } from "../../../commons/core/utils/rxjsUtils";
import { dateToString } from "../../../commons/core/utils/dateUtils";
import {
  GRAFICO_COLORES,
  tituloGraficoCentrado,
} from "../../../shared/utils/grafico-echarts.theme";
import {
  ConvenioConteo,
  ConvenioSucursalIntegridad,
  EstadoIntegridadConvenio,
} from "./interfaces/convenio-sucursal-integridad.model";

const COLOR_CANCELADAS = "#FF5252";

const ESTADOS_VENTA_CREDITO = [
  { valor: null, nombre: "Todos" },
  { valor: "ABIERTO", nombre: "Abiertas" },
  { valor: "FINALIZADO", nombre: "Finalizadas" },
  { valor: "CANCELADO", nombre: "Canceladas" },
  { valor: "EN_MORA", nombre: "En mora" },
  { valor: "INCOBRABLE", nombre: "Incobrables" },
];

const INTEGRIDAD_TEXTO: Record<EstadoIntegridadConvenio, string> = {
  OK: "OK",
  DIFERENCIA: "DIFERENCIA",
  SIN_CONEXION: "SIN CONEXIÓN",
  SIN_IP: "SIN IP",
};

/** Fila de la tabla ya armada: el template no llama funciones. */
interface FilaIntegridadVista {
  sucursal: string;
  centralTotal: number;
  centralDetalle: string;
  filialTotal: string;
  filialDetalle: string;
  faltan: number;
  sobran: number;
  distinto: number;
  tooltipFaltan: string;
  tooltipSobran: string;
  tooltipDistinto: string;
  ultimoCentral: string;
  ultimoFilial: string;
  integridad: string;
  claseIntegridad: string;
  tooltipIntegridad: string;
}

interface ConvenioSucursalVista {
  opciones: EChartsOption | null;
  filas: FilaIntegridadVista[];
  resumen: string;
}

function detalleConteo(c: ConvenioConteo | null): string {
  if (!c) return "";
  const partes = [`Abiertas ${c.abiertas}`, `Finalizadas ${c.finalizadas}`, `Canceladas ${c.canceladas}`];
  if (c.otras) partes.push(`Otras ${c.otras}`);
  return partes.join(" · ");
}

function tooltipIds(ids: string[], cantidad: number): string {
  if (!cantidad) return "";
  const mas = cantidad > ids.length ? ` (+${cantidad - ids.length} más)` : "";
  return `Ids: ${ids.join(", ")}${mas}`;
}

function filaVista(r: ConvenioSucursalIntegridad): FilaIntegridadVista {
  return {
    sucursal: r.sucursalNombre || `Sucursal ${r.sucursalId}`,
    centralTotal: r.central.total,
    centralDetalle: detalleConteo(r.central),
    filialTotal: r.filial ? String(r.filial.total) : "—",
    filialDetalle: detalleConteo(r.filial),
    faltan: r.faltanEnCentral,
    sobran: r.sobranEnCentral,
    distinto: r.estadoDistinto,
    tooltipFaltan: tooltipIds(r.idsFaltanEnCentral, r.faltanEnCentral),
    tooltipSobran: tooltipIds(r.idsSobranEnCentral, r.sobranEnCentral),
    tooltipDistinto: tooltipIds(r.idsEstadoDistinto, r.estadoDistinto),
    ultimoCentral: r.ultimoCentral || "—",
    ultimoFilial: r.ultimoFilial || "—",
    integridad: INTEGRIDAD_TEXTO[r.estadoIntegridad] || r.estadoIntegridad,
    claseIntegridad: `integridad--${(r.estadoIntegridad || "").toLowerCase()}`,
    tooltipIntegridad: r.error || "",
  };
}

function resumen(items: ConvenioSucursalIntegridad[]): string {
  const cuenta = (e: EstadoIntegridadConvenio) => items.filter((i) => i.estadoIntegridad === e).length;
  const total = items.reduce((s, i) => s + i.central.total, 0);
  return `${total} convenios en el central · ${cuenta("OK")} sucursales OK · ` +
    `${cuenta("DIFERENCIA")} con diferencia · ${cuenta("SIN_CONEXION")} sin conexión · ${cuenta("SIN_IP")} sin IP`;
}

/** Barras apiladas por estado (central) y la marca del total de la filial para comparar a simple vista. */
export function opcionesConveniosPorSucursal(
  items: ConvenioSucursalIntegridad[],
  subtitulo?: string
): EChartsOption {
  const nombres = items.map((i) => i.sucursalNombre || `Sucursal ${i.sucursalId}`);
  const serie = (name: string, color: string, campo: keyof ConvenioConteo) => ({
    name,
    type: "bar" as const,
    stack: "central",
    itemStyle: { color },
    emphasis: { focus: "series" as const },
    data: items.map((i) => i.central[campo]),
  });
  return {
    title: tituloGraficoCentrado("Convenios por Sucursal", subtitulo),
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 36, textStyle: { color: GRAFICO_COLORES.text } },
    grid: { left: "3%", right: "3%", top: 80, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: nombres,
      axisLabel: { color: GRAFICO_COLORES.text, rotate: nombres.length > 8 ? 35 : 0 },
      axisLine: { lineStyle: { color: GRAFICO_COLORES.axisLine } },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: GRAFICO_COLORES.textSecondary },
      splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
    },
    series: [
      serie("Abiertas", GRAFICO_COLORES.info, "abiertas"),
      serie("Finalizadas", GRAFICO_COLORES.success, "finalizadas"),
      serie("Canceladas", COLOR_CANCELADAS, "canceladas"),
      serie("Otras", GRAFICO_COLORES.warning, "otras"),
      {
        name: "Total en la filial",
        type: "line",
        symbol: "diamond",
        symbolSize: 12,
        lineStyle: { opacity: 0 },
        itemStyle: { color: "#FFFFFF" },
        data: items.map((i) => (i.filial ? i.filial.total : null)),
      },
    ],
  };
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "convenio-sucursal",
  templateUrl: "./convenio-sucursal.component.html",
  styleUrls: ["./convenio-sucursal.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvenioSucursalComponent implements OnInit {
  private graficoService = inject(GraficoService);
  private sucursalService = inject(SucursalService);
  private cdr = inject(ChangeDetectorRef);

  readonly filtroSucursales = new GraficoFiltroSucursalesMulti();
  readonly estados = ESTADOS_VENTA_CREDITO;
  readonly estadoControl = new FormControl<string | null>(null);
  readonly fechaRango = new FormGroup({
    inicio: new FormControl<Date | null>(null, Validators.required),
    fin: new FormControl<Date | null>(null, Validators.required),
  });

  sucursales$: Observable<Sucursal[]>;

  private readonly vistaSubject = new BehaviorSubject<ConvenioSucursalVista | null>(null);
  private readonly cargandoSubject = new BehaviorSubject<boolean>(false);
  private readonly filtrarSubject = new Subject<void>();

  readonly vista$ = this.vistaSubject.asObservable();
  readonly cargando$ = this.cargandoSubject.asObservable();

  ngOnInit(): void {
    this.sucursales$ = this.sucursalService.onGetAllSucursales(true).pipe(
      catchError(() => of([] as Sucursal[])),
      map((sucs) => sucs.filter((s) => Number(s.id) !== 0))
    );
    this.rangoPorDefecto();
    // Sin consulta al abrir: cada corrida se conecta a la base de todas las filiales elegidas.
    this.filtrarSubject
      .pipe(
        tap(() => this.cargandoSubject.next(true)),
        switchMapSinCortar(() => this.consultar()),
        untilDestroyed(this)
      )
      .subscribe((items) => {
        if (items) {
          this.vistaSubject.next({
            opciones: opcionesConveniosPorSucursal(items),
            filas: items.map(filaVista),
            resumen: resumen(items),
          });
        }
        this.cdr.markForCheck();
      });
  }

  filtrar(): void {
    if (this.fechaRango.invalid || this.cargandoSubject.value) return;
    this.filtrarSubject.next();
  }

  limpiarFiltros(): void {
    this.filtroSucursales.limpiar();
    this.estadoControl.setValue(null);
    this.rangoPorDefecto();
    this.vistaSubject.next(null);
    this.cdr.markForCheck();
  }

  private rangoPorDefecto(): void {
    const fin = new Date();
    const inicio = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() - 30);
    this.fechaRango.setValue({ inicio, fin });
  }

  private consultar(): Observable<ConvenioSucursalIntegridad[] | null> {
    const { inicio, fin } = this.fechaRango.value;
    // Solo la fecha, en texto: el central arma el rango por días y no hay hora que se corra.
    return this.graficoService
      .obtenerConvenioIntegridadPorSucursal(
        dateToString(inicio, "yyyy-MM-dd"),
        dateToString(fin, "yyyy-MM-dd"),
        this.estadoControl.value,
        this.filtroSucursales.normalizarIds()
      )
      .pipe(
        // El aviso del error ya lo muestra onCustomQuery; acá solo se evita cortar el stream.
        catchError(() => of(null)),
        finalize(() => this.cargandoSubject.next(false))
      );
  }
}
