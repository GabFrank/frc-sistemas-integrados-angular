import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { TabService } from "../../../layouts/tab/tab.service";
import { Tab } from "../../../layouts/tab/tab.model";
import { ProductoVendidoComponent } from "../producto-vendido/producto-vendido.component";
import { AnalisisProductoComponent } from "../analisis-producto/analisis-producto.component";
import { FormaPagoComponent } from "../forma-pago/forma-pago.component";
import { VentaFuncionarioComponent } from "../venta-funcionario/venta-funcionario.component";
import { VentasDiasComponent } from "../ventas-dias/ventas-dias.component";
import { GastoCategoriaComponent } from "../gasto-categoria/gasto-categoria.component";
import { IngresoGastoComponent } from "../ingreso-gasto/ingreso-gasto.component";
import { VentaSucursalComponent } from "../venta-sucursal/venta-sucursal.component";
import { DeliverySucursalComponent } from "../delivery-sucursal/delivery-sucursal.component";
import { VentaCiudadComponent } from "../venta-ciudad/venta-ciudad.component";
import { EvolucionCostoComponent } from "../evolucion-costo/evolucion-costo.component";
import { RankingInflacionComponent } from "../ranking-inflacion/ranking-inflacion.component";
import { ConvenioSucursalComponent } from "../convenio-sucursal/convenio-sucursal.component";
import { GraficosDashboardVista } from "./interfaces/graficos-dashboard-vista.model";
import { construirVistaDashboardMock } from "./graficos-dashboard-opciones.util";
import { Tema, TemaService } from "../../../shared/services/tema.service";
import { opcionesSegunTema } from "../../../shared/utils/grafico-echarts.theme";

type TipoGraficoDashboard =
  | "productos"
  | "analisis-producto"
  | "pago"
  | "gasto-categoria"
  | "funcionario"
  | "hora"
  | "ingreso-gasto"
  | "venta-sucursal"
  | "delivery-sucursal"
  | "venta-ciudad"
  | "evolucion-costo"
  | "ranking-inflacion"
  | "convenio-sucursal";

@Component({
  selector: "app-graficos",
  templateUrl: "./graficos.component.html",
  styleUrls: ["./graficos.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "graficos-dashboard-host",
  },
})
export class GraficosComponent {
  private tabService = inject(TabService);
  private temaService = inject(TemaService);

  private readonly vistaBase = construirVistaDashboardMock();

  /** Los gráficos con los grises del tema actual: ECharts dibuja en canvas y no ve las variables CSS. */
  readonly vista$: Observable<GraficosDashboardVista> = this.temaService.tema$.pipe(
    map((tema) => vistaSegunTema(this.vistaBase, tema))
  );

  onChartClick(tipo: TipoGraficoDashboard): void {
    switch (tipo) {
      case "productos":
        this.tabService.addTab(
          new Tab(ProductoVendidoComponent, "Productos Vendidos", null, null)
        );
        break;
      case "analisis-producto":
        this.tabService.addTab(
          new Tab(AnalisisProductoComponent, "Análisis de Productos", null, null)
        );
        break;
      case "pago":
        this.tabService.addTab(
          new Tab(FormaPagoComponent, "Formas de Pago", null, null)
        );
        break;
      case "gasto-categoria":
        this.tabService.addTab(
          new Tab(GastoCategoriaComponent, "Gastos por Categoría", null, null)
        );
        break;
      case "funcionario":
        this.tabService.addTab(
          new Tab(
            VentaFuncionarioComponent,
            "Ventas por Funcionario",
            null,
            null
          )
        );
        break;
      case "hora":
        this.tabService.addTab(
          new Tab(VentasDiasComponent, "Ventas por Hora", null, null)
        );
        break;
      case "ingreso-gasto":
        this.tabService.addTab(
          new Tab(IngresoGastoComponent, "Ingresos vs Gastos", null, null)
        );
        break;
      case "venta-sucursal":
        this.tabService.addTab(
          new Tab(VentaSucursalComponent, "Ventas por Sucursal", null, null)
        );
        break;
      case "delivery-sucursal":
        this.tabService.addTab(
          new Tab(DeliverySucursalComponent, "Ventas con Delivery", null, null)
        );
        break;
      case "venta-ciudad":
        this.tabService.addTab(
          new Tab(VentaCiudadComponent, "Ventas por Ciudad", null, null)
        );
        break;
      case "evolucion-costo":
        this.tabService.addTab(
          new Tab(EvolucionCostoComponent, "Evolución de Costos", null, null)
        );
        break;
      case "ranking-inflacion":
        this.tabService.addTab(
          new Tab(RankingInflacionComponent, "Inflación de Costos", null, null)
        );
        break;
      case "convenio-sucursal":
        this.tabService.addTab(
          new Tab(ConvenioSucursalComponent, "Convenios por Sucursal", null, null)
        );
        break;
    }
  }
}

function vistaSegunTema(vista: GraficosDashboardVista, tema: Tema): GraficosDashboardVista {
  const resultado = { ...vista };
  for (const clave of Object.keys(resultado) as (keyof GraficosDashboardVista)[]) {
    if (clave !== "cargando") {
      resultado[clave] = opcionesSegunTema(vista[clave], tema);
    }
  }
  return resultado;
}
