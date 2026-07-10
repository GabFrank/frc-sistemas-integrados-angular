import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { EChartsOption } from "echarts";

import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
import { ROLES } from "../../personas/roles/roles.enum";
import {
  formatoEjeCompacto,
  formatoMonedaPy,
  GRAFICO_COLORES,
} from "../../../shared/utils/grafico-echarts.theme";
import { EditDevolucionComponent } from "./edit-devolucion/edit-devolucion.component";
import { GuiaDevolucionComponent } from "./guia-devolucion/guia-devolucion.component";
import { ListDevolucionComponent } from "./list-devolucion/list-devolucion.component";
import { RetiroProveedorComponent } from "./retiro-proveedor/retiro-proveedor.component";
import {
  DashboardDevolucionService,
  FiltroDashboard,
} from "./dashboard/dashboard-devolucion.service";
import { DashRankingItem } from "../../../shared/components/dashboard/dash-ranking-list/dash-ranking-list.component";

interface KpiVista {
  icon: string;
  color: string;
  label: string;
  value: string;
}

interface AccesoRapido {
  icon: string;
  title: string;
  color: string;
  action: () => void;
}

/**
 * Dashboard del módulo de devoluciones. Sigue el patrón de dashboards del
 * sistema (ver docs/DASHBOARDS.md): filtros → KPIs → accesos → chart + rankings.
 * Los valores se precalculan en el .ts (nunca se llaman funciones desde el HTML).
 */
@Component({
  selector: "app-devolucion",
  templateUrl: "./devolucion.component.html",
  styleUrls: ["./devolucion.component.scss"],
})
export class DevolucionComponent implements OnInit, OnDestroy {
  readonly ROLES = ROLES;
  private destroy$ = new Subject<void>();

  cargando = false;

  // Filtro de fecha (inputs type=date, formato YYYY-MM-DD).
  desde = "";
  hasta = "";

  // Sucursal fija cuando el puesto está en una filial (no en el servidor central).
  sucursalFija = false;
  nombreSucursalFija = "";

  kpis: KpiVista[] = [];
  accesos: AccesoRapido[] = [];

  // Chart de serie por día.
  serieOpciones: EChartsOption | null = null;
  serieHayDatos = false;

  // Rankings y desglose (precalculados como items de la lista genérica).
  porEstado: DashRankingItem[] = [];
  topProductos: DashRankingItem[] = [];
  topMotivos: DashRankingItem[] = [];

  constructor(
    private tabService: TabService,
    public mainService: MainService,
    private dashboardService: DashboardDevolucionService
  ) {}

  ngOnInit(): void {
    this.resolverSucursalFija();
    this.armarAccesos();
    this.inicializarRango();
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resolverSucursalFija(): void {
    const sucursal = this.mainService.sucursalActual;
    if (!this.mainService.isServidor && sucursal?.id != null) {
      this.sucursalFija = true;
      this.nombreSucursalFija = sucursal.nombre;
    }
  }

  private inicializarRango(): void {
    // Por defecto: últimos 30 días hasta hoy.
    const hoy = new Date();
    const inicio = new Date();
    inicio.setDate(hoy.getDate() - 29);
    this.hasta = this.aInputDate(hoy);
    this.desde = this.aInputDate(inicio);
  }

  private get filtro(): FiltroDashboard {
    return {
      fechaInicio: `${this.desde} 00:00:00`,
      fechaFin: `${this.hasta} 23:59:59`,
      sucursalId:
        this.sucursalFija && this.mainService.sucursalActual?.id != null
          ? this.mainService.sucursalActual.id
          : null,
    };
  }

  cargar(): void {
    if (!this.desde || !this.hasta) return;
    this.cargando = true;
    const f = this.filtro;

    this.dashboardService
      .onGetResumen(f)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.cargando = false;
          this.armarKpis(r);
        },
        error: () => (this.cargando = false),
      });

    this.dashboardService
      .onGetPorEstado(f)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.porEstado = this.mapEstado(data || [])));

    this.dashboardService
      .onGetTopProductos(f, 5)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.topProductos = this.mapTop(
          (data || []).map((p) => ({
            nombre: p.descripcion,
            principal: p.cantidad,
            secundario: p.valor,
          }))
        );
      });

    this.dashboardService
      .onGetTopMotivos(f, 5)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.topMotivos = this.mapTop(
          (data || []).map((m) => ({
            nombre: m.descripcion,
            principal: m.cantidad,
            secundario: m.items,
            secundarioSufijo: " items",
          }))
        );
      });

    this.dashboardService
      .onGetSerie(f)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.armarSerie(data || []));
  }

  // ===== KPIs =====
  private armarKpis(r: any): void {
    r = r || {};
    this.kpis = [
      {
        icon: "local_shipping",
        color: (r.pendientesRetiro || 0) > 0 ? "warning" : "primary",
        label: "Pendientes de retiro",
        value: `${r.pendientesRetiro || 0}`,
      },
      {
        icon: "assignment_return",
        color: "info",
        label: "Devoluciones",
        value: `${r.total || 0}  ·  ${r.conProveedor || 0}/${r.sinProveedor || 0} c/s prov.`,
      },
      {
        icon: "payments",
        color: "primary",
        label: "Valor devuelto",
        value: formatoMonedaPy(r.valorTotal || 0),
      },
      {
        icon: "delete_sweep",
        color: "error",
        label: "Merma valorizada",
        value: formatoMonedaPy(r.valorMerma || 0),
      },
    ];
  }

  // ===== Rankings =====
  private mapEstado(data: { estado?: string; cantidad?: number }[]): DashRankingItem[] {
    const max = Math.max(1, ...data.map((d) => d.cantidad || 0));
    return data
      .slice()
      .sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0))
      .map((d) => ({
        nombre: this.titulo(d.estado),
        valorPrincipal: `${d.cantidad || 0}`,
        porcentaje: ((d.cantidad || 0) / max) * 100,
      }));
  }

  private mapTop(
    rows: {
      nombre?: string;
      principal?: number;
      secundario?: number;
      secundarioSufijo?: string;
    }[]
  ): DashRankingItem[] {
    const max = Math.max(1, ...rows.map((r) => r.principal || 0));
    return rows.map((r) => ({
      nombre: r.nombre || "—",
      valorPrincipal: `${r.principal || 0}`,
      valorSecundario:
        r.secundarioSufijo != null
          ? `${r.secundario || 0}${r.secundarioSufijo}`
          : formatoMonedaPy(r.secundario || 0),
      porcentaje: ((r.principal || 0) / max) * 100,
    }));
  }

  // ===== Chart =====
  private armarSerie(data: { fecha?: string; cantidad?: number; valor?: number }[]): void {
    this.serieHayDatos = data.length > 0;
    if (!this.serieHayDatos) {
      this.serieOpciones = null;
      return;
    }
    const fechas = data.map((d) => (d.fecha || "").slice(5)); // MM-DD
    const cantidades = data.map((d) => d.cantidad || 0);
    const valores = data.map((d) => d.valor || 0);

    this.serieOpciones = {
      backgroundColor: "transparent",
      grid: { top: 30, right: 50, bottom: 30, left: 45 },
      tooltip: { trigger: "axis" },
      legend: {
        data: ["Cantidad", "Valor"],
        textStyle: { color: GRAFICO_COLORES.textSecondary },
        top: 0,
      },
      xAxis: {
        type: "category",
        data: fechas,
        axisLabel: { color: GRAFICO_COLORES.textSecondary },
        axisLine: { lineStyle: { color: GRAFICO_COLORES.axisLine } },
      },
      yAxis: [
        {
          type: "value",
          axisLabel: { color: GRAFICO_COLORES.textSecondary },
          splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
        },
        {
          type: "value",
          axisLabel: {
            color: GRAFICO_COLORES.textSecondary,
            formatter: (v: number) => formatoEjeCompacto(v),
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Cantidad",
          type: "bar",
          data: cantidades,
          itemStyle: { color: GRAFICO_COLORES.primary, borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 22,
        },
        {
          name: "Valor",
          type: "line",
          yAxisIndex: 1,
          data: valores,
          smooth: true,
          symbolSize: 6,
          lineStyle: { color: GRAFICO_COLORES.accent, width: 2 },
          itemStyle: { color: GRAFICO_COLORES.accent },
        },
      ],
    };
  }

  // ===== Accesos rápidos =====
  private armarAccesos(): void {
    const puedeCrear =
      this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN) ||
      this.mainService.usuarioActual?.roles.includes(ROLES.CREAR_TRANSFERENCIA);

    this.accesos = [
      {
        icon: "manage_search",
        title: "Histórico",
        color: "#2196f3",
        action: () => this.abrir(ListDevolucionComponent, "Lista de devoluciones"),
      },
    ];
    if (puedeCrear) {
      this.accesos.push({
        icon: "add_circle",
        title: "Nueva devolución",
        color: "#4caf50",
        action: () => this.abrir(EditDevolucionComponent, "Nueva devolución"),
      });
      this.accesos.push({
        icon: "local_shipping",
        title: "Retiro de proveedor",
        color: "#ff9800",
        action: () => this.abrir(RetiroProveedorComponent, "Retiro de proveedor"),
      });
    }
    this.accesos.push({
      icon: "menu_book",
      title: "Guía del módulo",
      color: "#9c27b0",
      action: () => this.abrir(GuiaDevolucionComponent, "Guía del módulo"),
    });
  }

  private abrir(component: any, title: string): void {
    this.tabService.addTab(new Tab(component, title, null, DevolucionComponent));
  }

  // ===== Utils (no se llaman desde el HTML) =====
  private aInputDate(d: Date): string {
    const mes = `${d.getMonth() + 1}`.padStart(2, "0");
    const dia = `${d.getDate()}`.padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  private titulo(estado?: string): string {
    if (!estado) return "—";
    return estado.charAt(0) + estado.slice(1).toLowerCase();
  }
}
