import { Component, EventEmitter, HostListener, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ElectronService } from '../../../commons/core/electron/electron.service';
import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
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
import { ListSucursalComponent } from "../../../modules/empresarial/sucursal/list-sucursal/list-sucursal.component";
import { ListSolicitudPagoComponent } from "../../../modules/operaciones/solicitud-pago/list-solicitud-pago/list-solicitud-pago.component";
import { ThermalPrinterComponent } from '../../../modules/configuracion/thermal-printer/thermal-printer.component';
import { ListReplicationComponent } from '../../../modules/configuracion/logical-replication/list-replication/list-replication.component';
import { ListReplicationTablesComponent } from '../../../modules/configuracion/logical-replication/list-replication-tables/list-replication-tables.component';
import { MainVentaObservacionComponent } from "../../../modules/operaciones/venta-observacion/main-venta-observacion/main-venta-observacion.component";
import { MainCajaObservacionComponent } from "../../../modules/financiero/pdv/caja-observacion/main-caja-observacion/main-caja-observacion.component";
import { Subscription } from 'rxjs';
import { AnalisisDiferenciaComponent } from '../../../modules/financiero/analisis-diferencia/analisis-diferencia.component';
import { ListTimbradoComponent } from '../../../modules/financiero/timbrado/list-timbrado/list-timbrado.component';


// Define interfaces for the navigation items structure
interface BaseNavigationItem {
  name: string;
  icon: string;
  isVisible?: boolean; // Property to store visibility state
  visibilityRoles?: string[]; // The roles that can see this item
  requiresLocalMode?: boolean; // Whether this item requires local mode
  requiresServerMode?: boolean; // Whether this item requires server mode
}

interface ActionNavigationItem extends BaseNavigationItem {
  action: string;
  items?: never;
  isExpanded?: never;
}

interface ParentNavigationItem extends BaseNavigationItem {
  isExpanded: boolean;
  items: (ActionNavigationItem | ParentNavigationItem)[];
  action?: never;
}

type NavigationItem = ActionNavigationItem | ParentNavigationItem;

@Component({
  selector: 'app-side-mini-variant',
  templateUrl: './side-mini-variant.component.html',
  styleUrls: ['./side-mini-variant.component.scss']
})
export class SideMiniVariantComponent implements OnInit, OnDestroy {
  @Input() isExpanded = false;
  @Output() toggleSideNav = new EventEmitter<boolean>();
  
  private authSubscription: Subscription;

  //An ADMIN puede ver todos los items  
  navigationItems: NavigationItem[] = [
    {
      name: 'PDV',
      icon: 'point_of_sale',
      isExpanded: false,
      requiresLocalMode: true,
      items: [
        { 
          name: 'Punto de Venta', 
          icon: 'shopping_cart', 
          action: 'pdv-venta-touch', 
          visibilityRoles: [ROLES.VENTA_TOUCH]
        },
        { 
          name: 'Últimas cajas', 
          icon: 'history', 
          action: 'pdv-venta-ultimas-cajas',
          visibilityRoles: [ROLES.VENTA_TOUCH]
        }
      ]
    },
    {
      name: 'Operaciones',
      icon: 'business_center',
      isExpanded: false,
      requiresServerMode: false,
      visibilityRoles: [ROLES.VER_TRANSFERENCIA, ROLES.CREAR_TRANSFERENCIA, ROLES.VER_INVENTARIO, ROLES.CREAR_INVENTARIO, ROLES.PARTICIPAR_DEL_INVENTARIO, ROLES.VER_MOVIMIENTO_DE_STOCK],
      items: [
        {
          name: 'Compras',
          icon: 'add_shopping_cart',
          isExpanded: false,
          items: [
            { name: 'Compras', icon: 'shopping_basket', action: 'compras-dashboard' }
          ]
        },
        {
          name: 'Gestión de Stock',
          icon: 'inventory',
          isExpanded: false,
          items: [
            { 
              name: 'Transferencias', 
              icon: 'swap_horiz', 
              action: 'list-transferencias',
              visibilityRoles: [ROLES.VER_TRANSFERENCIA]
            },
            { 
              name: 'Inventarios', 
              icon: 'storage', 
              action: 'list-inventario',
              visibilityRoles: [ROLES.VER_INVENTARIO, ROLES.CREAR_INVENTARIO, ROLES.PARTICIPAR_DEL_INVENTARIO]
            },
            { 
              name: 'Movimientos', 
              icon: 'swap_vert', 
              action: 'list-movimiento',
              visibilityRoles: [ROLES.VER_MOVIMIENTO_DE_STOCK, ROLES.VER_INVENTARIO]
            }
          ]
        },
        {
          name: 'Venta',
          icon: 'sell',
          isExpanded: false,
          items: [
            { 
              name: 'Cajas', 
              icon: 'point_of_sale', 
              action: 'list-caja',
              visibilityRoles: [ROLES.ANALISIS_DE_CAJA]
            },
            { name: 'Delivery', icon: 'delivery_dining', action: 'delivery-dashboard' }
          ]
        },
        {
          name: 'Observaciones',
          icon: 'visibility',
          isExpanded: false,
          visibilityRoles: [ROLES.ADMIN],
          items: [
            { 
              name: 'Observaciones de cajas', 
              icon: 'receipt_long', 
              action: 'observacion-cajas',
              visibilityRoles: [ROLES.ADMIN]
            },
            { 
              name: 'Observaciones de ventas', 
              icon: 'shopping_cart_checkout', 
              action: 'observacion-ventas',
              visibilityRoles: [ROLES.ADMIN]
            }
          ]
        }
      ]
    },
    {
      name: 'Financiero',
      icon: 'account_balance',
      isExpanded: false,
      requiresServerMode: false,
      visibilityRoles: [ROLES.ANALISIS_DE_CAJA, ROLES.ANALISIS_CONTABLE, ROLES.CAMBIAR_COTIZACION],
      items: [
        {
          name: 'Análisis de diferencias',
          icon: 'equalizer',
          action: 'analisis-diferencias',
          visibilityRoles: [ROLES.ADMIN]
        },
        { 
          name: 'Cotización', 
          icon: 'monetization_on', 
          action: 'list-cotizacion',
          visibilityRoles: [ROLES.CAMBIAR_COTIZACION]
        },
        { 
          name: 'Pagos', 
          icon: 'payment', 
          action: 'list-pagos',
          visibilityRoles: [ROLES.ANALISIS_DE_CAJA]
        },
        { 
          name: 'Gastos', 
          icon: 'money_off', 
          action: 'list-gastos',
          visibilityRoles: [ROLES.ANALISIS_DE_CAJA]
        },
        { 
          name: 'Retiros', 
          icon: 'savings', 
          action: 'list-retiros',
          visibilityRoles: [ROLES.ANALISIS_DE_CAJA]
        },
        { 
          name: 'Facturas', 
          icon: 'receipt', 
          action: 'list-facturas',
          visibilityRoles: [ROLES.ANALISIS_DE_CAJA]
        },
        { 
          name: 'Timbrado', 
          icon: 'text_snippet', 
          action: 'list-timbrado',
          visibilityRoles: [ROLES.ADMIN]
        },
        { 
          name: 'Maletines', 
          icon: 'work', 
          action: 'list-maletin',
          visibilityRoles: [ROLES.ADMIN]
        },
        { 
          name: 'Lucro por producto', 
          icon: 'trending_up', 
          action: 'lucro-por-producto',
          visibilityRoles: [ROLES.ADMIN]
        },
        {
          name: 'Documento Electrónico',
          icon: 'qr_code_2',
          action: 'list-dte',
          visibilityRoles: [ROLES.ADMIN]
        }
      ]
    },
    {
      name: 'Productos',
      icon: 'inventory_2',
      isExpanded: false,
      requiresServerMode: false,
      visibilityRoles: [ROLES.VER_PRODUCTOS, ROLES.EDITAR_PRODUCTOS, ROLES.CREAR_PRECIOS, ROLES.EDITAR_PRECIOS, ROLES.VER_PRECIO_COSTO],
      items: [
        { 
          name: 'Productos', 
          icon: 'category', 
          action: 'list-producto',
          visibilityRoles: [ROLES.VER_PRODUCTOS, ROLES.ADMIN]
        }
      ]
    },
    {
      name: 'Bancario',
      icon: 'account_balance_wallet',
      isExpanded: false,
      items: [],
      requiresServerMode: false,
      visibilityRoles: [ROLES.ADMIN]
    },
    {
      name: 'R.R.H.H.',
      icon: 'people',
      isExpanded: false,
      requiresServerMode: false,
      visibilityRoles: [ROLES.VER_PERSONAS, ROLES.EDITAR_PERSONAS, ROLES.VER_USUARIOS, ROLES.EDITAR_USUARIOS, ROLES.VER_FUNCIONARIOS, ROLES.CREAR_FUNCIONARIOS, ROLES.EDITAR_FUNCIONARIOS],
      items: [
        { 
          name: 'Clientes', 
          icon: 'person', 
          action: 'clientes-dashboard',
          visibilityRoles: [ROLES.VER_PERSONAS]
        },
        { 
          name: 'Usuarios', 
          icon: 'manage_accounts', 
          action: 'list-usuario',
          visibilityRoles: [ROLES.VER_USUARIOS]
        },
        { 
          name: 'Funcionarios', 
          icon: 'badge', 
          action: 'funcionario-dashboard',
          visibilityRoles: [ROLES.VER_FUNCIONARIOS]
        },
        { 
          name: 'Roles', 
          icon: 'admin_panel_settings', 
          action: 'list-roles',
          visibilityRoles: [ROLES.SOPORTE]
        }
      ]
    },
    {
      name: 'Empresarial',
      icon: 'business',
      isExpanded: false,
      requiresServerMode: false,
      visibilityRoles: [ROLES.ADMIN],
      items: [
        { 
          name: 'Sucursales', 
          icon: 'store', 
          action: 'list-sucursal',
          visibilityRoles: [ROLES.ADMIN]
        }
      ]
    },
    {
      name: 'Configuración',
      icon: 'settings',
      isExpanded: false,
      requiresServerMode: false,
      visibilityRoles: [ROLES.ADMIN, "CONFIGURACION", ROLES.SOPORTE],
      items: [
        { 
          name: 'Impresoras Térmicas', 
          icon: 'print', 
          action: 'thermal-printer',
          visibilityRoles: [ROLES.ADMIN, "CONFIGURACION"]
        },
        { 
          name: 'Replicación Lógica', 
          icon: 'sync', 
          action: 'logical-replication',
          visibilityRoles: [ROLES.ADMIN]
        },
        { 
          name: 'Tablas de Replicación', 
          icon: 'table_chart', 
          action: 'replication-tables',
          visibilityRoles: [ROLES.ADMIN]
        }
      ]
    }
  ];

  constructor(
    public tabService: TabService,
    public mainService: MainService,
    private matDialog: MatDialog,
    private cargandoDialogService: CargandoDialogService,
    private electronService: ElectronService,
    private notificacionService: NotificacionSnackbarService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    // Update menu visibility on component init
    this.updateMenuVisibility();
    
    // Subscribe to authentication changes to update menu visibility
    this.authSubscription = this.mainService.authenticationSub.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.updateMenuVisibility();
      } else {
        // Reset visibility when logged out
        this.resetMenuVisibility();
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * Updates visibility for all menu items based on user roles and environment
   */
  updateMenuVisibility(): void {
    const isLocal = this.mainService.isLocal();
    const isServer = this.mainService?.isServidor;
    const userRoles = this.mainService.usuarioActual?.roles || [];
    
    // First level items
    for (const item of this.navigationItems) {
      // Check if item requires specific mode
      if (item.requiresLocalMode && !isLocal) {
        item.isVisible = false;
        continue;
      }
      
      if (item.requiresServerMode && !isServer) {
        item.isVisible = false;
        continue;
      }
      
      // Check roles for visibility
      item.isVisible = this.checkItemVisibility(item, userRoles);
      
      // Check child items if this is a parent
      if ('items' in item && item.items) {
        for (const childItem of item.items) {
          childItem.isVisible = this.checkItemVisibility(childItem, userRoles);
          
          // For nested children (3rd level)
          if ('items' in childItem && childItem.items) {
            for (const grandChild of childItem.items) {
              grandChild.isVisible = this.checkItemVisibility(grandChild, userRoles);
            }
          }
        }
      }
    }
  }

  /**
   * Checks if a menu item should be visible based on user roles
   */
  private checkItemVisibility(item: BaseNavigationItem, userRoles: string[]): boolean {
    // If no roles specified, it's visible
    if (!item.visibilityRoles || item.visibilityRoles.length === 0) {
      return true;
    }
    
    // Check if user has any of the required roles, if user is ADMIN, it can see all items
    if (userRoles.includes(ROLES.ADMIN)) {
      return true;
    }
    return userRoles.some(role => item.visibilityRoles.includes(role));
  }

  /**
   * Resets visibility for all menu items to false
   */
  resetMenuVisibility(): void {
    // Reset visibility of all items
    const resetItemVisibility = (items: any[]) => {
      for (const item of items) {
        item.isVisible = false;
        if (item.items) {
          resetItemVisibility(item.items);
        }
      }
    };
    
    resetItemVisibility(this.navigationItems);
  }

  // Click handler for the entire side nav that will expand it
  onSideNavClick(): void {
    if (!this.isExpanded) {
      this.toggleSidenav(true);
    }
  }

  // Toggle the side nav state
  toggleSidenav(expanded: boolean): void {
    this.isExpanded = expanded;
    this.toggleSideNav.emit(this.isExpanded);
  }

  // Detect clicks outside the sidenav to close it
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    // Get the sidenav element
    const sidenavElement = document.querySelector('.side-nav-container');
    
    // Check if the click was outside the sidenav
    if (this.isExpanded && sidenavElement && !sidenavElement.contains(event.target as Node)) {
      // Prevent closing when clicking on the toggle button in the header (that should be handled separately)
      const isHeaderMenuButton = (event.target as HTMLElement).closest('[class*="header-menu-toggle"]');
      if (!isHeaderMenuButton) {
        this.toggleSidenav(false);
      }
    }
  }

  // Toggle menu section expansion
  toggleMenuSection(section: any, event: Event): void {
    event.stopPropagation();
    if (this.isExpanded) {
      section.isExpanded = !section.isExpanded;
    } else {
      this.toggleSidenav(true);
      section.isExpanded = true;
    }
  }

  // Handle item click
  onItemClick(action: string | undefined, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    // If no action is provided, just return
    if (!action) {
      return;
    }
    
    // Expand sidenav if it's not already expanded
    if (!this.isExpanded) {
      this.toggleSidenav(true);
      return; // Just expand on first click, don't take action yet
    }

    // Actual action handling (copied from the original component but improved)
    switch (action) {
      case "pdv-venta-touch":
        this.openTabIfAuthorized(ROLES.VENTA_TOUCH, VentaTouchComponent, "Venta");
        break;
      case "pdv-venta-ultimas-cajas":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VENTA_TOUCH)) {
          this.matDialog.open(UltimasCajasDialogComponent, {
            width: '90%',
            height: '90%',
            disableClose: false
          });
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción.');
        }
        break;
      case "list-movimiento":
        this.openTabIfAuthorized(ROLES.VER_INVENTARIO, ListMovimientoStockComponent, "Movimientos");
        break;
      case "list-inventario":
        this.openTabIfAuthorized(ROLES.VER_INVENTARIO, InventarioDashboardComponent, "Inventario");
        break;
      case "list-entrada-salida":
        this.openTabIfAuthorized("ANALISIS-PRODUCTOS", EntradaSalidaComponent, "Entrada/Salida");
        break;
      case "list-caja":
        this.openTabIfAuthorized(ROLES.ANALISIS_DE_CAJA, ListCajaComponent, "Cajas");
        break;
      case "finanzas-dashboard":
        this.openTabIfAuthorized("ANALISIS-FINANCIERO", FinancieroDashboardComponent, "Financiero");
        break;
      case "list-gastos":
        this.openTabIfAuthorized(ROLES.ANALISIS_DE_CAJA, ListGastosComponent, "Gastos");
        break;
      case "list-pagos":
        this.openTabIfAuthorized(ROLES.ANALISIS_DE_CAJA, ListSolicitudPagoComponent, "Lista de solicitudes de pago");
        break;
      case "list-transferencias":
        this.openTabIfAuthorized(ROLES.VER_TRANSFERENCIA, TransferenciaComponent, "Transferencia");
        break;
      case "list-cotizacion":
        this.openTabIfAuthorized(ROLES.CAMBIAR_COTIZACION, CambioComponent, "Cotizaciónes");
        break;
      case "list-timbrado":
        this.openTabIfAuthorized(ROLES.ADMIN, ListTimbradoComponent, "Timbrado");
        break;
      case "list-roles":
        this.openTabIfAuthorized(ROLES.SOPORTE, ListRolesComponent, "Lista de roles");
        break;
      case "list-maletin":
        this.openTabIfAuthorized(ROLES.ADMIN, ListMaletinComponent, "Maletines");
        break;
      case "delivery-dashboard":
        this.tabService.addTab(new Tab(DeliveryDashboardComponent, "Delivery Dash", null, null));
        break;
      case "lucro-por-producto":
        this.tabService.addTab(new Tab(LucroPorProductoComponent, "Lucro por producto", null, null));
        break;
      case "compras-dashboard":
        this.tabService.addTab(new Tab(CompraDashboardComponent, "Compras", null, null));
        break;
      case "list-retiros":
        this.openTabIfAuthorized(ROLES.ANALISIS_DE_CAJA, ListRetiroComponent, "Lista de retiros");
        break;
      case "list-facturas":
        this.openTabIfAuthorized(ROLES.ANALISIS_DE_CAJA, ListFacturaLegalComponent, "Lista de facturas");
        break;
      case "analisis-diferencias":
        this.openTabIfAuthorized(ROLES.ADMIN, AnalisisDiferenciaComponent, "Análisis de diferencias");
        break;
      case "list-sucursal":
        this.openTabIfAuthorized(ROLES.ADMIN, ListSucursalComponent, "Lista de sucursales");
        break;
      case "list-persona":
        this.openTabIfAuthorized(ROLES.VER_PERSONAS, ListPersonaComponent, "Personas");
        break;
      case "list-usuario":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_USUARIOS) 
            || this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)) {
          this.tabService.addTab(new Tab(ListUsuarioComponent, "Usuarios", null, null));
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción.');
        }
        break;
      case "clientes-dashboard":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_USUARIOS) 
            || this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)) {
          this.tabService.addTab(new Tab(ClienteDashboardComponent, "Clientes", null, null));
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción.');
        }
        break;
      case "list-producto":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.VER_PRODUCTOS) 
            || this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)) {
          this.tabService.addTab(new Tab(ListProductoComponent, "Lista de productos", null, null));
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción.');
        }
        break;
      case "funcionario-dashboard":
        this.openTabIfAuthorized(ROLES.VER_FUNCIONARIOS, FuncionarioDashboardComponent, "Gestión de funcionarios");
        break;
      case "thermal-printer":
        if (this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN) 
            || this.mainService.usuarioActual?.roles.includes("CONFIGURACION")) {
          this.tabService.addTab(new Tab(ThermalPrinterComponent, "Impresoras Térmicas", null, null));
        } else {
          this.notificacionService.openWarn('No tenés acceso a esta opción.');
        }
        break;
      case "logical-replication":
        this.openTabIfAuthorized(ROLES.ADMIN, ListReplicationComponent, "Replicación Lógica");
        break;
      case "replication-tables":
        this.openTabIfAuthorized(ROLES.ADMIN, ListReplicationTablesComponent, "Tablas de Replicación");
        break;
      case "observacion-cajas":
        this.openTabIfAuthorized(ROLES.ADMIN, MainCajaObservacionComponent, "Observación de Cajas");
        break;
      case "observacion-ventas":
        this.openTabIfAuthorized(ROLES.ADMIN, MainVentaObservacionComponent, "Observación de Ventas");
        break;
    }
  }

  // Helper method to open a tab if the user is authorized
  private openTabIfAuthorized(role: string, component: any, title: string): void {
    if (this.mainService.usuarioActual?.roles.includes(role) || this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN)) {
      this.tabService.addTab(new Tab(component, title, null, null));
    } else {
      this.notificacionService.openWarn('No tenés acceso a esta opción.');
    }
  }

  async onLogout() {
    let inicioSesion = new InicioSesion();
    Object.assign(inicioSesion, this.mainService.usuarioActual.inicioSesion);
    inicioSesion.horaFin = new Date();  
    if(inicioSesion != null && inicioSesion?.sucursal != null){
      await new Promise((resolve, rejects) => {
        this.usuarioService
          .onSaveInicioSesion(inicioSesion.toInput())
          .subscribe((res) => {
            resolve(res);
          });
      }); 
    }  
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioId");
    this.mainService.usuarioActual = null;
    this.mainService.logged = false;
    this.tabService.removeAllTabs();
    this.electronService.relaunch();
  }

  onLogin() {
    this.electronService.relaunch();
  }

  onReiniciar() {
    this.electronService.relaunch();
  }

  // Check if an item is visible using isVisible property
  isItemVisible(item: any): boolean {
    return item.isVisible !== false; // If not explicitly set to false, show it
  }

  // Helper function to check if item has children
  hasChildren(item: NavigationItem): boolean {
    return 'items' in item && !!item.items && item.items.length > 0;
  }

  // Helper function to safely get action
  getAction(item: NavigationItem): string | undefined {
    return 'action' in item ? item.action : undefined;
  }
}
