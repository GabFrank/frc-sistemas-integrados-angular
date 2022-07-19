import { InventarioDashboardComponent } from './../../../modules/operaciones/inventario/inventario-dashboard/inventario-dashboard.component';
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
import { FuncionarioDashboardComponent } from '../../../modules/personas/funcionarios/funcionario-dashboard/funcionario-dashboard.component';
import { ListFuncioarioComponent } from '../../../modules/personas/funcionarios/list-funcioario/list-funcioario.component';
import { ListPreRegistroFuncionarioComponent } from '../../../modules/personas/funcionarios/list-pre-registro-funcionario/list-pre-registro-funcionario.component';
import { ListRolesComponent } from '../../../modules/configuracion/roles/list-roles/list-roles.component';
import { ProductosDashboardComponent } from '../../../modules/productos/productos-dashboard/productos-dashboard.component';

@Component({
  selector: "app-side",
  templateUrl: "./side.component.html",
  styleUrls: ["./side.component.scss"],
})
export class SideComponent implements OnInit {

  isTest = true;

  constructor(public tabService: TabService, public mainService: MainService) {

  }

  ngOnInit(): void {
  }

  onItemClick(tab: string): void {
    // this.isTest = this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
    switch (tab) {
      case "list-persona":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_PERSONAS) || this.isTest) {
          this.tabService.addTab(
            new Tab(ListPersonaComponent, "Personas", null, null)
          );
        }
        break;
      case "list-usuario":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_USUARIOS) || this.isTest) {
          this.tabService.addTab(
            new Tab(ListUsuarioComponent, "Usuarios", null, null)
          );
        }
        break;
      case "list-producto":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.VER_PRODUCTOS) || this.isTest || 
          this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
        ) {
          this.tabService.addTab(
            new Tab(ListProductoComponent, "Lista de productos", null, null)
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
      case "funcionario-dashboard":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.VER_FUNCIONARIOS) || this.isTest
        ) {
          this.tabService.addTab(
            new Tab(FuncionarioDashboardComponent, "Gestión de funcionarios", null, null)
          );
        }
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
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VENTA_TOUCH) || this.isTest) {
          this.tabService.addTab(
            new Tab(VentaTouchComponent, "Venta Touch", null, null)
          );
        }
        break;
      case "list-movimiento":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_MOVIMIENTO_DE_STOCK) || this.isTest) {
          this.tabService.addTab(
            new Tab(ListMovimientoStockComponent, "Movimientos", null, null)
          );
        }
        break;
      case "list-inventario":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_INVENTARIO) || this.isTest) {
          this.tabService.addTab(
            new Tab(InventarioDashboardComponent, "Inventario", null, null)
          );
        }
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
          this.mainService.usuarioActual?.roles.includes("ANALISIS-CAJA") || this.isTest
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
          this.mainService.usuarioActual?.roles.includes(ROLES.VER_TRANSFERENCIA
          ) || this.isTest
        ) {
          this.tabService.addTab(
            new Tab(TransferenciaComponent, "Transferencia", null, null)
          );
        }
        break;
      case "list-cotizacion":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.CAMBIAR_COTIZACION
          ) || this.isTest
        ) {
          this.tabService.addTab(
            new Tab(CambioComponent, "Cotizaciónes", null, null)
          );
        }
        break;
      case "list-roles":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.SOPORTE
          ) || this.isTest
        ) {
          this.tabService.addTab(
            new Tab(ListRolesComponent, "Lista de roles", null, null)
          );
        }
        break;
      default:
        break;
    }
  }
}