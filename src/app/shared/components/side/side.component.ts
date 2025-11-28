import { Component, OnInit } from "@angular/core";
import { MatDialog } from '@angular/material/dialog';
import { ElectronService } from '../../../commons/core/electron/electron.service';
import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
import { LoginDialogService } from "../../services/login-dialog.service";
import { ListRolesComponent } from '../../../modules/configuracion/roles/list-roles/list-roles.component';
import { FinancieroDashboardComponent } from "../../../modules/financiero/financiero-dashboard/financiero-dashboard.component";
import { ListGastosComponent } from "../../../modules/financiero/gastos/list-gastos/list-gastos.component";
import { ListMaletinComponent } from '../../../modules/financiero/maletin/list-maletin/list-maletin.component';
import { ListCajaComponent } from "../../../modules/financiero/pdv/caja/list-caja/list-caja.component";
import { DeliveryDashboardComponent } from '../../../modules/operaciones/delivery/delivery-dashboard/delivery-dashboard.component';
import { EntradaSalidaComponent } from "../../../modules/operaciones/entrada-salida/entrada-salida.component";
import { ListMovimientoStockComponent } from "../../../modules/operaciones/movimiento-stock/list-movimiento-stock/list-movimiento-stock.component";
import { PedidoDashboardComponent } from '../../../modules/operaciones/pedido/pedido-dashboard/pedido-dashboard.component';
import { LucroPorProductoComponent } from '../../../modules/operaciones/venta/reportes/lucro-por-producto/lucro-por-producto.component';
import { UltimasCajasDialogComponent } from '../../../modules/pdv/comercial/venta-touch/ultimas-cajas-dialog/ultimas-cajas-dialog.component';
import { VentaTouchComponent } from "../../../modules/pdv/comercial/venta-touch/venta-touch.component";
import { ClienteDashboardComponent } from '../../../modules/personas/clientes/cliente-dashboard/cliente-dashboard.component';
import { FuncionarioDashboardComponent } from '../../../modules/personas/funcionarios/funcionario-dashboard/funcionario-dashboard.component';
import { ListPersonaComponent } from "../../../modules/personas/persona/list-persona/list-persona.component";
import { ROLES } from "../../../modules/personas/roles/roles.enum";
import { ListUsuarioComponent } from "../../../modules/personas/usuarios/list-usuario/list-usuario.component";
import { ListProductoComponent } from "../../../modules/productos/producto/list-producto/list-producto.component";
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../cargando-dialog/cargando-dialog.service';
import { CambioComponent } from './../../../modules/financiero/cambio/cambio.component';
import { InventarioDashboardComponent } from './../../../modules/operaciones/inventario/inventario-dashboard/inventario-dashboard.component';
import { TransferenciaComponent } from './../../../modules/operaciones/transferencia/transferencia.component';
import { CompraDashboardComponent } from "../../../modules/operaciones/compra/compra-dashboard/compra-dashboard.component";
import { ListRetiroComponent } from "../../../modules/financiero/retiro/list-retiro/list-retiro.component";
import { ListFacturaLegalComponent } from "../../../modules/financiero/factura-legal/list-factura-legal/list-factura-legal.component";
import { UsuarioService } from "../../../modules/personas/usuarios/usuario.service";
import { InicioSesion } from "../../../modules/configuracion/models/inicio-sesion.model";
import { MainVentaObservacionComponent } from "../../../modules/operaciones/venta-observacion/main-venta-observacion/main-venta-observacion.component";
import { MainCajaObservacionComponent } from "../../../modules/financiero/pdv/caja-observacion/main-caja-observacion/main-caja-observacion.component";
import { ListSucursalComponent } from "../../../modules/empresarial/sucursal/list-sucursal/list-sucursal.component";
import { ListSolicitudPagoComponent } from "../../../modules/operaciones/solicitud-pago/list-solicitud-pago/list-solicitud-pago.component";
import { ThermalPrinterComponent } from '../../../modules/configuracion/thermal-printer/thermal-printer.component';
import { ListReplicationComponent } from '../../../modules/configuracion/logical-replication/list-replication/list-replication.component';
import { ListReplicationTablesComponent } from '../../../modules/configuracion/logical-replication/list-replication-tables/list-replication-tables.component';

@Component({
  selector: "app-side",
  templateUrl: "./side.component.html",
  styleUrls: ["./side.component.scss"],
})
export class SideComponent implements OnInit {

  isTest = false;
  isPdvVisible = false;
  isAdminSectionVisible = false;
  isInventarioSectionVisible = false;
  isFinancieroSectionVisible = false;
  isPersonasSectionVisible = false;
  isProductosSectionVisible = false;
  isOperacionesSectionVisible = false;
  isConfiguracionSectionVisible = false;

  constructor(
    public tabService: TabService,
    public mainService: MainService,
    private matDialog: MatDialog,
    private cargandoDialogService: CargandoDialogService,
    private electronService: ElectronService,
    private notificacionService: NotificacionSnackbarService,
    private usuarioService: UsuarioService,
    private loginDialogService: LoginDialogService
  ) {

  }

  ngOnInit(): void {
    console.log(this.mainService.usuarioActual?.roles);

    this.updateMenuVisibility();

    this.mainService.authenticationSub.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.updateMenuVisibility();
      } else {
        this.resetMenuVisibility();
      }
    });
  }

  updateMenuVisibility(): void {
    this.isPdvVisible = this.mainService.isLocal();
    this.isAdminSectionVisible = this.hasAnyRole([ROLES.ADMIN, ROLES.SOPORTE]);

    this.isInventarioSectionVisible = this.hasAnyRole([
      ROLES.VER_INVENTARIO,
      ROLES.CREAR_INVENTARIO,
      ROLES.PARTICIPAR_DEL_INVENTARIO,
      ROLES.VER_MOVIMIENTO_DE_STOCK
    ]);

    this.isFinancieroSectionVisible = this.hasAnyRole([
      ROLES.ANALISIS_DE_CAJA,
      ROLES.ANALISIS_CONTABLE,
      ROLES.CAMBIAR_COTIZACION
    ]);

    this.isPersonasSectionVisible = this.hasAnyRole([
      ROLES.VER_PERSONAS,
      ROLES.EDITAR_PERSONAS,
      ROLES.VER_USUARIOS,
      ROLES.EDITAR_USUARIOS,
      ROLES.VER_FUNCIONARIOS,
      ROLES.CREAR_FUNCIONARIOS,
      ROLES.EDITAR_FUNCIONARIOS
    ]);

    this.isProductosSectionVisible = this.hasAnyRole([
      ROLES.VER_PRODUCTOS,
      ROLES.EDITAR_PRODUCTOS,
      ROLES.CREAR_PRECIOS,
      ROLES.EDITAR_PRECIOS,
      ROLES.VER_PRECIO_COSTO
    ]);

    this.isOperacionesSectionVisible = this.hasAnyRole([
      ROLES.VER_TRANSFERENCIA,
      ROLES.CREAR_TRANSFERENCIA
    ]);

    this.isConfiguracionSectionVisible = this.hasAnyRole([ROLES.ADMIN, "CONFIGURACION", ROLES.SOPORTE]);
  }
  resetMenuVisibility(): void {
    this.isPdvVisible = false;
    this.isAdminSectionVisible = false;
    this.isInventarioSectionVisible = false;
    this.isFinancieroSectionVisible = false;
    this.isPersonasSectionVisible = false;
    this.isProductosSectionVisible = false;
    this.isOperacionesSectionVisible = false;
    this.isConfiguracionSectionVisible = false;
  }

  /**
   * Helper method to check if the user has any of the specified roles
   * @param roleList Array of roles to check
   * @returns true if user has any of the specified roles
   */
  private hasAnyRole(roleList: string[]): boolean {
    if (!this.mainService.usuarioActual?.roles) return false;
    return roleList.some(role => this.mainService.usuarioActual.roles.includes(role));
  }

  onItemClick(tab: string): void {
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
      case "clientes-dashboard":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_USUARIOS)
          || this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
        ) {
          this.tabService.addTab(
            new Tab(ClienteDashboardComponent, "Clientes", null, null)
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
        break;
      case "list-pedido":
        this.tabService.addTab(
          new Tab(PedidoDashboardComponent, "Gestion de pedidos", null, null)
        );
        break;
      case "pdv-restaurant":
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
        break;
      case "list-ciudades":
        break;
      case "list-necesidad":
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
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_INVENTARIO)) {
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
          this.mainService.usuarioActual?.roles.includes(ROLES.ANALISIS_DE_CAJA)
        ) {
          this.tabService.addTab(
            new Tab(ListGastosComponent, "Gastos", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "list-pagos":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.ANALISIS_DE_CAJA)
        ) {
          this.tabService.addTab(
            new Tab(ListSolicitudPagoComponent, "Lista de solicitudes de pago", null, null)
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
          this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN
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
      case "observacion-ventas":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
        ) {
          this.tabService.addTab(
            new Tab(MainVentaObservacionComponent, "Observación de Ventas", null, null)
          );
        }
        else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "observacion-cajas":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
        ) {
          this.tabService.addTab(
            new Tab(MainCajaObservacionComponent, "Observación de Cajas", null, null)
          );
        }
        else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "modificaciones":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
        ) {
          this.notificacionService.openWarn('Funcionalidad en desarrollo: Modificaciones')
        }
        else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "lucro-por-producto":
        this.tabService.addTab(
          new Tab(LucroPorProductoComponent, "Lucro por producto", null, null)
        );
        break;
      case "compras-dashboard":
        this.tabService.addTab(
          new Tab(CompraDashboardComponent, "Compras", null, null)
        );
        break;
      case "list-retiros":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.ANALISIS_DE_CAJA)
        ) {
          this.tabService.addTab(
            new Tab(ListRetiroComponent, "Lista de retiros", null, null)
          );
        }
        break;
      case "list-facturas":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.ANALISIS_DE_CAJA)
        ) {
          this.tabService.addTab(
            new Tab(ListFacturaLegalComponent, "Lista de facturas", null, null)
          );
        }
        break;
      case "list-sucursal":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)
        ) {
          this.tabService.addTab(
            new Tab(ListSucursalComponent, "Lista de sucursales", null, null)
          );
        }
        break;
      case "thermal-printer":
        if (
          this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN) ||
          this.mainService.usuarioActual?.roles.includes("CONFIGURACION")
        ) {
          this.tabService.addTab(
            new Tab(ThermalPrinterComponent, "Impresoras Térmicas", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. ')
        }
        break;
      case "logical-replication":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)) {
          this.tabService.addTab(
            new Tab(ListReplicationComponent, "Replicación Lógica", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. Solo disponible para administradores.')
        }
        break;
      case "replication-tables":
        console.log("replication-tables");
        if (this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)) {
          console.log("replication-tables 2");
          this.tabService.addTab(
            new Tab(ListReplicationTablesComponent, "Tablas de Replicación", null, null)
          );
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción. Solo disponible para administradores.')
        }
        break;
    }
  }

  async onLogout() {
    let inicioSesion = new InicioSesion();
    Object.assign(inicioSesion, this.mainService.usuarioActual.inicioSesion);
    inicioSesion.horaFin = new Date();
    if (inicioSesion != null && inicioSesion?.sucursal != null) {
      await new Promise((resolve, rejects) => {
        this.usuarioService
          .onSaveInicioSesion(inicioSesion.toInput())
          .subscribe((res) => {
            resolve(res);
          });
      });
    }
    this.mainService.logout();
    this.tabService.removeAllTabs();
    this.loginDialogService.openLoginDialog();
  }

  onLogin() {
    this.electronService.relaunch()
  }

  onReiniciar() {
    this.electronService.relaunch()
  }
}
