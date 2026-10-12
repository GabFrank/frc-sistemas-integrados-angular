import { CambioComponent } from './../../../modules/financiero/cambio/cambio.component';
import { ProductoComponent } from './../../../modules/productos/producto/edit-producto/producto.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ProductoService } from './../../../modules/productos/producto/producto.service';
import { Tab } from './../../../layouts/tab/tab.model';
import { TabData, TabService } from './../../../layouts/tab/tab.service';
import { ListProductoComponent } from './../../../modules/productos/producto/list-producto/list-producto.component';
import { Injectable, Type } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Producto } from '../../../modules/productos/producto/producto.model';
import { EditTransferenciaComponent } from '../../../modules/operaciones/transferencia/edit-transferencia/edit-transferencia.component';
import { ListTransferenciaComponent } from '../../../modules/operaciones/transferencia/list-transferencia/list-transferencia.component';
import { FuncionarioDashboardComponent } from '../../../modules/personas/funcionarios/funcionario-dashboard/funcionario-dashboard.component';
import { ListActualizacionComponent } from '../../../modules/configuracion/actualizacion/list-actualizacion/list-actualizacion.component';
import { ListCajaComponent } from '../../../modules/financiero/pdv/caja/list-caja/list-caja.component';
import { ListSectorComponent } from '../../../modules/empresarial/sector/list-sector/list-sector.component';
import { ListCargoComponent } from '../../../modules/empresarial/cargo/list-cargo/list-cargo.component';
import { ListLiquidacionConceptoComponent } from '../../../modules/rrhh/liquidacion-concepto/list-liquidacion-concepto/list-liquidacion-concepto.component';
import { SolicitarRecursosDialogComponent } from '../../../modules/configuracion/solicitar-recursos-dialog/solicitar-recursos-dialog.component';
import { ROLES } from '../../../modules/personas/roles/roles.enum';
import { PrecioDeliveryComponent } from '../../../modules/operaciones/delivery/precio-delivery/precio-delivery.component';
import { ListClientesComponent } from '../../../modules/personas/clientes/list-clientes/list-clientes.component';
import { ListRetiroComponent } from '../../../modules/financiero/retiro/list-retiro/list-retiro.component';
import { ListGastosComponent } from '../../../modules/financiero/gastos/pages/list-gastos/list-gastos.component';
import { LucroPorProductoComponent } from '../../../modules/operaciones/venta/reportes/lucro-por-producto/lucro-por-producto.component';
import { LucroPorFuncionarioComponent } from '../../../modules/operaciones/venta/reportes/lucro-por-funcionario/lucro-por-funcionario.component';
import { ListPrecioEspecialComponent } from '../../../modules/productos/precio-especial/list-precio-especial/list-precio-especial.component';
import { NavegacionMenuService } from '../../components/side-mini-variant/navegacion-menu.service';

export enum TIPO_SEARCH {
  COMPONENTE = 'COMPONENTE',
  PRODUCTO = 'PRODUCTO',
  PERSONA = 'PERSONA'
}

export interface SearchData {
  title: string,
  component?: Type<any>,
  producto?: Producto,
  data?: any;
  role?: string; // Mantener para compatibilidad hacia atrás
  visibilityRoles?: string[]; // Nueva propiedad para múltiples roles
  // Pantalla del menu lateral: se abre con su action en vez de con component
  action?: string;
  ruta?: string;
  // En las entradas manuales: action del menu que abre la misma pantalla. Si el usuario ya la
  // tiene en el menu, la entrada manual se omite para no listarla dos veces.
  menuAction?: string;
}

export class SearchDataResult {
  componentes: SearchData[]
  productos: SearchData[]
}

// Pantallas que NO estan en el menu lateral (o que se buscan con otro nombre). Las del menu no
// se cargan aca: el buscador las toma solas de NavegacionMenuService.
export const componenteList: SearchData[] =
  [
    { title: 'Lista de Productos', component: ListProductoComponent, menuAction: 'list-producto', visibilityRoles: [ROLES.VER_PRODUCTOS] },
    { title: 'Lista de Transferencias', component: ListTransferenciaComponent, visibilityRoles: [ROLES.VER_TRANSFERENCIA] },
    { title: 'Nueva Transferencia', component: EditTransferenciaComponent, visibilityRoles: [ROLES.CREAR_TRANSFERENCIA] },
    { title: 'Cotización', component: CambioComponent, menuAction: 'list-cotizacion', visibilityRoles: [ROLES.CAMBIAR_COTIZACION] },
    { title: 'Funcionarios', component: FuncionarioDashboardComponent, visibilityRoles: [ROLES.VER_FUNCIONARIOS] },
    { title: 'Actualizacion', component: ListActualizacionComponent, visibilityRoles: [ROLES.ADMIN] },
    { title: 'Lista de cajas', component: ListCajaComponent, menuAction: 'list-caja', visibilityRoles: [ROLES.ANALISIS_DE_CAJA] },
    { title: 'Lista de sectores', component: ListSectorComponent, visibilityRoles: [ROLES.ADMIN] },
    { title: 'Lista de cargos', component: ListCargoComponent, menuAction: 'list-cargo', visibilityRoles: [ROLES.ADMIN] },
    { title: 'Conceptos de liquidación', component: ListLiquidacionConceptoComponent, menuAction: 'list-liquidacion-concepto', visibilityRoles: [ROLES.RRHH_CONFIG, ROLES.RRHH_GESTIONAR, ROLES.ADMIN] },
    { title: 'Solicitar Recursos', component: SolicitarRecursosDialogComponent, visibilityRoles: [ROLES.SOPORTE] },
    { title: 'Precio del Delivery', component: PrecioDeliveryComponent, visibilityRoles: [ROLES.ADMIN] },
    { title: 'Lista de clientes', component: ListClientesComponent, menuAction: 'clientes-dashboard', visibilityRoles: [ROLES.VER_PERSONAS] },
    { title: 'Lista de retiros', component: ListRetiroComponent, menuAction: 'list-retiros', visibilityRoles: [ROLES.ANALISIS_DE_CAJA] },
    { title: 'Lista de gastos', component: ListGastosComponent, visibilityRoles: [ROLES.ANALISIS_DE_CAJA] },
    { title: 'Lucro por funcionario', component: LucroPorFuncionarioComponent, menuAction: 'lucro-por-funcionario', visibilityRoles: [ROLES.ADMIN] },
    { title: 'Lucro por producto', component: LucroPorProductoComponent, menuAction: 'lucro-por-producto', visibilityRoles: [ROLES.ADMIN] },
    { title: 'Promociones', component: ListPrecioEspecialComponent, menuAction: 'list-precio-especial', visibilityRoles: [ROLES.CREAR_PRECIOS, ROLES.EDITAR_PRECIOS] }
  ]

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class SearchBarService {

  searchDataList: SearchData[] = []

  constructor(
    private tabService: TabService,
    private productoService: ProductoService,
    private navegacionMenuService: NavegacionMenuService
  ) { }

  onSearch(texto: string): Observable<SearchDataResult> {
    const result = new SearchDataResult();
    result.productos = [];

    if (!texto?.trim()) {
      return of(result);
    }

    return this.productoService.onSearch(texto).pipe(
      map((productoList) => {
        if (productoList != null) {
          result.productos = productoList.map((p) => ({
            title: p.descripcion,
            component: ProductoComponent,
            data: p,
          }));
        }
        return result;
      })
    );
  }

  filtrarComponentes(texto: string): SearchData[] {
    const palabras = this.normalizar(texto).split(' ').filter((p) => p.length > 0);
    if (palabras.length === 0) {
      return [];
    }
    const delMenu: SearchData[] = this.navegacionMenuService.pantallasVisibles().map((p) => ({
      title: p.titulo,
      ruta: p.ruta,
      action: p.action
    }));
    const actionsDelMenu = new Set(delMenu.map((e) => e.action));
    const extras = componenteList.filter((e) => !e.menuAction || !actionsDelMenu.has(e.menuAction));

    const porTitulo: SearchData[] = [];
    const porRuta: SearchData[] = [];
    for (const e of [...delMenu, ...extras]) {
      const titulo = this.normalizar(e.title);
      if (palabras.every((p) => titulo.includes(p))) {
        porTitulo.push(e);
      } else {
        const completo = this.normalizar(e.ruta) + ' ' + titulo;
        if (palabras.every((p) => completo.includes(p))) {
          porRuta.push(e);
        }
      }
    }
    return [...porTitulo, ...porRuta];
  }

  // Minusculas y sin tildes: "tesoreria" tiene que encontrar "Tesorería"
  private normalizar(texto: string): string {
    return (texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  openTab(data: SearchData) {
    if (data.action) {
      this.navegacionMenuService.abrir(data.action);
      return;
    }
    this.tabService.addTab(new Tab(data.component, data.title, new TabData(data?.data?.id, data?.data), this.tabService?.currentTab()?.component))
  }
}
