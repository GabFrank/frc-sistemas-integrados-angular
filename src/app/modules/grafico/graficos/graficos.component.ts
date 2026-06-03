import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
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
import { VentaCiudadComponent } from "../venta-ciudad/venta-ciudad.component";
import { GraficosDashboardVista } from "./interfaces/graficos-dashboard-vista.model";
import { construirVistaDashboardMock } from "./graficos-dashboard-opciones.util";

type TipoGraficoDashboard =
  | "productos"
  | "analisis-producto"
  | "pago"
  | "gasto-categoria"
  | "funcionario"
  | "hora"
  | "ingreso-gasto"
  | "venta-sucursal"
  | "venta-ciudad";

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

  readonly vista$: Observable<GraficosDashboardVista> = new BehaviorSubject(
    construirVistaDashboardMock()
  ).asObservable();

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
      case "venta-ciudad":
        this.tabService.addTab(
          new Tab(VentaCiudadComponent, "Ventas por Ciudad", null, null)
        );
        break;
    }
  }
}
