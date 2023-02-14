import { CambioComponent } from './../../../modules/financiero/cambio/cambio.component';
import { ProductoComponent } from './../../../modules/productos/producto/edit-producto/producto.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ProductoService } from './../../../modules/productos/producto/producto.service';
import { Tab } from './../../../layouts/tab/tab.model';
import { TabData, TabService } from './../../../layouts/tab/tab.service';
import { ListProductoComponent } from './../../../modules/productos/producto/list-producto/list-producto.component';
import { Injectable, Type } from '@angular/core';
import { comparatorLike } from '../../../commons/core/utils/string-utils';
import { Producto } from '../../../modules/productos/producto/producto.model';
import { EditTransferenciaComponent } from '../../../modules/operaciones/transferencia/edit-transferencia/edit-transferencia.component';
import { ListTransferenciaComponent } from '../../../modules/operaciones/transferencia/list-transferencia/list-transferencia.component';
import { FuncionarioDashboardComponent } from '../../../modules/personas/funcionarios/funcionario-dashboard/funcionario-dashboard.component';
import { ListActualizacionComponent } from '../../../modules/configuracion/actualizacion/list-actualizacion/list-actualizacion.component';
import { ListCajaComponent } from '../../../modules/financiero/pdv/caja/list-caja/list-caja.component';
import { ListSectorComponent } from '../../../modules/empresarial/sector/list-sector/list-sector.component';
import { SolicitarRecursosDialogComponent } from '../../../modules/configuracion/solicitar-recursos-dialog/solicitar-recursos-dialog.component';
import { ROLES } from '../../../modules/personas/roles/roles.enum';
import { PrecioDelivery } from '../../../modules/operaciones/delivery/precio-delivery.model';
import { PrecioDeliveryComponent } from '../../../modules/operaciones/delivery/precio-delivery/precio-delivery.component';

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
  role?: string;
}

export class SearchDataResult {
  componentes: SearchData[]
  productos: SearchData[]
}

export const componenteList: SearchData[] =
  [
    { title: 'Lista de Productos', component: ListProductoComponent },
    { title: 'Lista de Transferencias', component: ListTransferenciaComponent, role: ROLES.VER_TRANSFERENCIA },
    { title: 'Nueva Transferencia', component: EditTransferenciaComponent, role: ROLES.CREAR_TRANSFERENCIA },
    { title: 'Cotización', component: CambioComponent },
    { title: 'Funcionarios', component: FuncionarioDashboardComponent, role: ROLES.VER_FUNCIONARIOS },
    { title: 'Actualizacion', component: ListActualizacionComponent },
    { title: 'Lista de cajas', component: ListCajaComponent, role: ROLES.ANALISIS_DE_CAJA },
    { title: 'Lista de sectores', component: ListSectorComponent },
    { title: 'Solicitar Recursos', component: SolicitarRecursosDialogComponent, role: ROLES.SOPORTE },
    { title: 'Precio del Delivery', component: PrecioDeliveryComponent }
  ]

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class SearchBarService {

  searchDataList: SearchData[] = []

  timer;

  constructor(private tabService: TabService,
    private productoService: ProductoService,
  ) { }

  onSearch(texto): Promise<SearchDataResult> {
    if (this.timer != null) {
      clearTimeout(this.timer);
    }
    return new Promise((resolve, rejects) => {
      let result = new SearchDataResult;
      let componentes = componenteList.filter(e => comparatorLike(texto, e.title))
      result.componentes = componentes;
      let productoList: Producto[];
      this.timer = setTimeout(() => {
        this.productoService.onSearch(texto)
          .pipe()
          .subscribe(res => {
            if (res != null) {
              productoList = res;
              result.productos = []
              productoList.forEach(p => {
                let item: SearchData = { title: p.descripcion, component: ProductoComponent, data: p }
                result.productos.push(item)
              })
            }
            return resolve(result);
          })
      }, 1000);
    })

  }

  openTab(data: SearchData) {
    console.log(data);
    
    this.tabService.addTab(new Tab(data.component, data.title, new TabData(data?.data?.id, data?.data), this.tabService?.currentTab()?.component))
  }
}
