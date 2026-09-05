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
import { comparatorLike } from '../../../commons/core/utils/string-utils';
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
}

export class SearchDataResult {
  componentes: SearchData[]
  productos: SearchData[]
}

export const componenteList: SearchData[] =
  [
    { title: 'Lista de Productos', component: ListProductoComponent, visibilityRoles: [ROLES.VER_PRODUCTOS] },
    { title: 'Lista de Transferencias', component: ListTransferenciaComponent, visibilityRoles: [ROLES.VER_TRANSFERENCIA] },
    { title: 'Nueva Transferencia', component: EditTransferenciaComponent, visibilityRoles: [ROLES.CREAR_TRANSFERENCIA] },
    { title: 'Cotización', component: CambioComponent, visibilityRoles: [ROLES.CAMBIAR_COTIZACION] },
    { title: 'Funcionarios', component: FuncionarioDashboardComponent, visibilityRoles: [ROLES.VER_FUNCIONARIOS] },
    { title: 'Actualizacion', component: ListActualizacionComponent, visibilityRoles: [ROLES.ADMIN] },
    { title: 'Lista de cajas', component: ListCajaComponent, visibilityRoles: [ROLES.ANALISIS_DE_CAJA] },
    { title: 'Lista de sectores', component: ListSectorComponent, visibilityRoles: [ROLES.ADMIN] },
    { title: 'Lista de cargos', component: ListCargoComponent, visibilityRoles: [ROLES.ADMIN] },
    { title: 'Conceptos de liquidación', component: ListLiquidacionConceptoComponent, visibilityRoles: [ROLES.RRHH_CONFIG, ROLES.RRHH_GESTIONAR, ROLES.ADMIN] },
    { title: 'Solicitar Recursos', component: SolicitarRecursosDialogComponent, visibilityRoles: [ROLES.SOPORTE] },
    { title: 'Precio del Delivery', component: PrecioDeliveryComponent, visibilityRoles: [ROLES.ADMIN] },
    { title: 'Lista de clientes', component: ListClientesComponent, visibilityRoles: [ROLES.VER_PERSONAS] },
    { title: 'Lista de retiros', component: ListRetiroComponent, visibilityRoles: [ROLES.ANALISIS_DE_CAJA] },
    { title: 'Lista de gastos', component: ListGastosComponent, visibilityRoles: [ROLES.ANALISIS_DE_CAJA] },
    { title: 'Lucro por funcionario', component: LucroPorFuncionarioComponent, visibilityRoles: [ROLES.ADMIN] },
    { title: 'Lucro por producto', component: LucroPorProductoComponent, visibilityRoles: [ROLES.ADMIN] }
  ]

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class SearchBarService {

  searchDataList: SearchData[] = []

  constructor(
    private tabService: TabService,
    private productoService: ProductoService
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
    return componenteList.filter((e) => comparatorLike(texto ?? '', e.title));
  }

  openTab(data: SearchData) {
    this.tabService.addTab(new Tab(data.component, data.title, new TabData(data?.data?.id, data?.data), this.tabService?.currentTab()?.component))
  }
}
