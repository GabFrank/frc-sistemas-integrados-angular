import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DashboardComponent } from '../../modules/dashboard/dashboard.component';
import { ListMaletinComponent } from '../../modules/financiero/maletin/list-maletin/list-maletin.component';
import { ListCajaComponent } from '../../modules/financiero/pdv/caja/list-caja/list-caja.component';
import { EditPedidoComponent } from '../../modules/operaciones/pedido/edit-pedido/edit-pedido.component';
import { PedidoDashboardComponent } from '../../modules/operaciones/pedido/pedido-dashboard/pedido-dashboard.component';
import { ListTransferenciaComponent } from '../../modules/operaciones/transferencia/list-transferencia/list-transferencia.component';
import { VentaTouchComponent } from '../../modules/pdv/comercial/venta-touch/venta-touch.component';
import { ProductoService } from '../../modules/productos/producto/producto.service';
import { CargandoDialogService } from './../../shared/components/cargando-dialog/cargando-dialog.service';
import { Tab } from './tab.model';

export enum TABS {
  'LIST-PERSONA' = 'list-persona',
  'EDIT-PERSONA' = 'edit-persona'
}

export class TabData {
  id?: number
  data?: any;
  constructor(id?, data?) {
    this.id = id
    this.data = data
  }
}

@Injectable({
  providedIn: 'root'
})
export class TabService {

  tabs: Tab[] = []
  currentIndex = -1;
  tabSub = new BehaviorSubject<Tab[]>(this.tabs);
  tabChangedEvent = new EventEmitter<any>();


  constructor(
    private cargandoService: CargandoDialogService,
    private productoService: ProductoService
  ) {

    this.tabs = [
    // new Tab(ListFuncioarioComponent, 'Lista de funcionarios', null, null),
    // new Tab(VentaTouchComponent, 'Venta', null, null),
    new Tab(ListTransferenciaComponent, 'Lista de transferencias', null, null),
    ];
    this.tabSub.next(this.tabs);

    // this.productoService.getProducto(1152).subscribe(res => {
    //   console.log(res)
    //   this.addTab(new Tab(ProductoComponent, 'Nuevo Producto', { data: res }))
    // })

  }


  // Horario especial

  tabChanged(index): void {
    this.tabChangedEvent.emit(index)
    this.setTabActive(index);
  }

  currentTab(): Tab {
    return this.tabs[this.currentIndex];
  }

  setTabActive(index): void {
    if (this.tabs.length > 0) {
      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].active === true) {
          this.tabs[i].active = false;
        }
      }
      if (this.tabs[index] != undefined) {
        this.tabs[index].active = true;
      }
      this.currentIndex = index;
      this.tabSub.next(this.tabs);
    }
  }

  public removeTab(index: number): void {
    //buscar si tiene parent
    const parentComponent = this.tabs[index].parentComponent ?? null;
    // remover tab
    this.tabs[index] = null
    this.tabs.splice(index, 1);
    // si se esta cerrando el tab actual
    if (this.currentIndex == index) {
      //si el numero de tabs es mayor que cero
      if (this.tabs.length > 0) {
        //si el tab a ser cerrado tiene parent
        if (parentComponent != null) {
          // buscar el index del parent
          const parent = this.tabs.findIndex(x => x.component == parentComponent);
          // si el index del parent no es -1 (osea que existe)
          if (parent != -1) {
            this.setTabActive(parent);
          } else {
            this.setTabActive(this.tabs[index]);
          }
        } else {
          this.setTabActive(index);
        }
      }
    }
    this.tabSub.next(this.tabs);
  }

  public addTab(tab: Tab): void {
    this.cargandoService.openDialog()

    const duplicado = this.tabs.findIndex(x => x.title == tab.title);
    if (duplicado == -1) {
      tab.id = this.tabs.length + 1;
      this.currentIndex = tab.id - 1;
      tab.active = true;
      this.tabs.push(tab);
      this.setTabActive(tab.id - 1);
    } else {
      this.setTabActive(duplicado);
    }
    setTimeout(() => {
      this.cargandoService.closeDialog()
      this.tabSub.next(this.tabs);
    }, 500);
  }

  public removeAllTabs(): void {
    this.tabs = [];
    this.tabSub.next(this.tabs);
  }
}
