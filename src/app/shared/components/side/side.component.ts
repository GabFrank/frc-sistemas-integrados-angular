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
import { MatDialog } from '@angular/material/dialog';
import { UltimasCajasDialogComponent } from '../../../modules/pdv/comercial/venta-touch/ultimas-cajas-dialog/ultimas-cajas-dialog.component';
import { ListPedidoComponent } from '../../../modules/operaciones/pedido/list-pedido/list-pedido.component';
import { PedidoDashboardComponent } from '../../../modules/operaciones/pedido/pedido-dashboard/pedido-dashboard.component';
import { ListMaletinComponent } from '../../../modules/financiero/maletin/list-maletin/list-maletin.component';
import { CargandoDialogComponent } from '../cargando-dialog/cargando-dialog.component';
import { CargandoDialogService } from '../cargando-dialog/cargando-dialog.service';
import { ElectronService } from '../../../commons/core/electron/electron.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { DeliveryDashboardComponent } from '../../../modules/operaciones/delivery/delivery-dashboard/delivery-dashboard.component';

@Component({
  selector: "app-side",
  templateUrl: "./side.component.html",
  styleUrls: ["./side.component.scss"],
})
export class SideComponent implements OnInit {

  isTest = false;

  constructor(
    public tabService: TabService,
    public mainService: MainService,
    private matDialog: MatDialog,
    private cargandoDialogService: CargandoDialogService,
    private electronService: ElectronService,
    private notificacionService: NotificacionSnackbarService
  ) {

  }

  ngOnInit(): void {
  }

  onItemClick(tab: string): void {
    // this.isTest = this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
    switch (tab) {
      case "list-persona":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_PERSONAS)) {
          this.tabService.addTab(
            new Tab(ListPersonaComponent, "Personas", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-usuario":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_USUARIOS)
          || this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
        ) {
          this.tabService.addTab(
            new Tab(ListUsuarioComponent, "Usuarios", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-producto":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.VER_PRODUCTOS) ||
          this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
        ) {
          this.tabService.addTab(
            new Tab(ListProductoComponent, "Lista de productos", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-compra":
        // this.tabService.addTab(
        //   new Tab(ListCompraComponent, "Compras", null, null)
        // );
        break;
      case "list-pedido":
        this.tabService.addTab(
          new Tab(PedidoDashboardComponent, "Gestion de pedidos", null, null)
        );
        break;
      case "pdv-restaurant":
        // this.tabService.addTab(
        //   new Tab(RestaurantComponent, "Venta Restaurant", null, null)
        // );
        break;
      case "funcionario-dashboard":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.VER_FUNCIONARIOS)
        ) {
          this.tabService.addTab(
            new Tab(FuncionarioDashboardComponent, "Gestión de funcionarios", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
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
        if ((this.mainService.usuarioActual?.roles.includes(ROLES.VENTA_TOUCH))) {
          this.tabService.addTab(
            new Tab(VentaTouchComponent, "Venta", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "pdv-venta-ultimas-cajas":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VENTA_TOUCH)) {
          this.matDialog.open(UltimasCajasDialogComponent, {
            width: '90%',
            height: '90%',
            disableClose: false
          })
        }
        break;
      case "list-movimiento":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_MOVIMIENTO_DE_STOCK)) {
          this.tabService.addTab(
            new Tab(ListMovimientoStockComponent, "Movimientos", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-inventario":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_INVENTARIO)) {
          this.tabService.addTab(
            new Tab(InventarioDashboardComponent, "Inventario", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
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
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-caja":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.ANALISIS_DE_CAJA)
        ) {
          this.tabService.addTab(
            new Tab(ListCajaComponent, "Cajas", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "finanzas-dashboard":
        if (
          this.mainService.usuarioActual?.roles.includes(
            "ANALISIS-FINANCIERO"
          ) || true
        ) {
          this.tabService.addTab(
            new Tab(FinancieroDashboardComponent, "Financiero", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
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
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-transferencias":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.VER_TRANSFERENCIA
          )
        ) {
          this.tabService.addTab(
            new Tab(TransferenciaComponent, "Transferencia", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-cotizacion":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.CAMBIAR_COTIZACION
          )
        ) {
          this.tabService.addTab(
            new Tab(CambioComponent, "Cotizaciónes", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-roles":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.SOPORTE
          )
        ) {
          this.tabService.addTab(
            new Tab(ListRolesComponent, "Lista de roles", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-maletin":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.CAMBIAR_COTIZACION
          )
        ) {
          this.tabService.addTab(
            new Tab(ListMaletinComponent, "Maletines", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
        case "delivery-dashboard":
          this.tabService.addTab(
            new Tab(DeliveryDashboardComponent, "Delivery Dash", null, null)
          );
          break;
    }
  }

  onLogout() {
    this.cargandoDialogService.openDialog();
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioId");
    this.mainService.usuarioActual = null;
    this.mainService.logged = false;
    this.tabService.removeAllTabs()
    this.electronService.relaunch()
  }

  onLogin() {
    this.electronService.relaunch()
  }
}