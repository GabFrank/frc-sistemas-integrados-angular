import { CambioComponent } from './../../../modules/financiero/cambio/cambio.component';
import { TransferenciaComponent } from './../../../modules/operaciones/transferencia/transferencia.component';
import { Component, OnInit } from "@angular/core";
import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
import { FinancieroDashboardComponent } from "../../../modules/financiero/financiero-dashboard/financiero-dashboard.component";
import { ListGastosComponent } from "../../../modules/financiero/gastos/list-gastos/list-gastos.component";
import { ListCajaComponent } from "../../../modules/financiero/pdv/caja/list-caja/list-caja.component";
import { EntradaSalidaComponent } from "../../../modules/operaciones/entrada-salida/entrada-salida.component";
import { ListMovimientoStockComponent } from "../../../modules/operaciones/movimiento-stock/list-movimiento-stock/list-movimiento-stock.component";
import { VentaTouchComponent } from "../../../modules/pdv/comercial/venta-touch/venta-touch.component";
import { ListPersonaComponent } from "../../../modules/personas/persona/list-persona/list-persona.component";
import { ROLES } from "../../../modules/personas/roles/roles.enum";
import { ListUsuarioComponent } from "../../../modules/personas/usuarios/list-usuario/list-usuario.component";
import { ListProductoComponent } from "../../../modules/productos/producto/list-producto/list-producto.component";

@Component({
  selector: "app-side",
  templateUrl: "./side.component.html",
  styleUrls: ["./side.component.scss"],
})
export class SideComponent implements OnInit {

  constructor(public tabService: TabService, public mainService: MainService) {

  }

  ngOnInit(): void {
  }

  onItemClick(tab: string): void {
    switch (tab) {
      case "list-persona":
        if (this.mainService.usuarioActual?.roles.includes("VISTA-RRHH")) {
          this.tabService.addTab(
            new Tab(ListPersonaComponent, "Personas", null, null)
          );
        }
        break;
      case "list-usuario":
        if (this.mainService.usuarioActual?.roles.includes("VISTA-RRHH")) {
          this.tabService.addTab(
            new Tab(ListUsuarioComponent, "Usuarios", null, null)
          );
        }
        break;
      case "list-producto":
        if (
          this.mainService.usuarioActual?.roles.includes("VISTA-PRODUCTOS") || true
        ) {
          this.tabService.addTab(
            new Tab(ListProductoComponent, "Productos", null, null)
          );
        }
        break;
      case "list-compra":
        // this.tabService.addTab(
        //   new Tab(ListCompraComponent, "Compras", null, null)
        // );
        break;
      // case "list-pedido":
      //   this.tabService.addTab(
      //     new Tab(ListPedidoComponent, "Pedidos", null, null)
      //   );
      //   break;
      // case "pdv-restaurant":
      //   // this.tabService.addTab(
      //   //   new Tab(RestaurantComponent, "Venta Restaurant", null, null)
      //   // );
      //   break;
      case "list-funcionario":
        // this.tabService.addTab(
        //   new Tab(ListFuncioarioComponent, "Funcionarios", null, null)
        // );
        break;
      case "list-paises":
        // this.tabService.addTab(
        //   new Tab(ListPaisComponent, "Países", null, null)
        // );
        break;
      case "list-ciudades":
        // this.tabService.addTab(
        //   new Tab(ListCiudadComponent, "Ciudades", null, null)
        // );
        break;
      case "list-necesidad":
        // this.tabService.addTab(
        //   new Tab(ListNecesidadComponent, "Necesidades", null, null)
        // );
        break;
      case "pdv-venta-touch":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VENTA_TOUCH) || true) {
          this.tabService.addTab(
            new Tab(VentaTouchComponent, "Venta Touch", null, null)
          );
        }
        break;
      case "list-movimiento":
        this.tabService.addTab(
          new Tab(ListMovimientoStockComponent, "Movimientos", null, null)
        );
        break;
      case "list-entrada-salida":
        if (
          this.mainService.usuarioActual?.roles.includes(
            "ANALISIS-PRODUCTOS"
          )
        ) {
          this.tabService.addTab(
            new Tab(EntradaSalidaComponent, "Entrada/Salida", null, null)
          );
        }
        break;
      case "list-caja":
        if (
          this.mainService.usuarioActual?.roles.includes("ANALISIS-CAJA") || true
        ) {
          this.tabService.addTab(
            new Tab(ListCajaComponent, "Cajas", null, null)
          );
        }
        break;
      case "finanzas-dashboard":
        if (
          this.mainService.usuarioActual?.roles.includes(
            "ANALISIS-FINANCIERO"
          )
        ) {
          this.tabService.addTab(
            new Tab(FinancieroDashboardComponent, "Financiero", null, null)
          );
        }
        break;
      case "list-gastos":
        if (
          this.mainService.usuarioActual?.roles.includes(
            "ANALISIS-FINANCIERO"
          )
        ) {
          this.tabService.addTab(
            new Tab(ListGastosComponent, "Gastos", null, null)
          );
        }
        break;
      case "list-transferencias":
        if (
          this.mainService.usuarioActual?.roles.includes(
            "ANALISIS-FINANCIERO"
          ) || true
        ) {
          this.tabService.addTab(
            new Tab(TransferenciaComponent, "Transferencia", null, null)
          );
        }
        break;
      case "list-cotizacion":
        if (
          this.mainService.usuarioActual?.roles.includes(
            "ANALISIS-FINANCIERO"
          ) || true
        ) {
          this.tabService.addTab(
            new Tab(CambioComponent, "Cotizaciónes", null, null)
          );
        }
        break;
      default:
        break;
    }
  }
}