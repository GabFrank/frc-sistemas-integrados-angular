import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ListClientesComponent } from '../../modules/personas/clientes/list-clientes/list-clientes.component';
import { CargandoDialogService } from './../../shared/components/cargando-dialog/cargando-dialog.service';
import { Tab } from './tab.model';
import { ListMovimientoStockComponent } from '../../modules/operaciones/movimiento-stock/list-movimiento-stock/list-movimiento-stock.component';
import { ListInventarioComponent } from '../../modules/operaciones/inventario/list-inventario/list-inventario.component';
import { EditCompraComponent } from '../../modules/operaciones/compra/edit-compra/edit-compra.component';
import { EditPedidoComponent } from '../../modules/operaciones/pedido/edit-pedido/edit-pedido.component';
import { ListTransferenciaComponent } from '../../modules/operaciones/transferencia/list-transferencia/list-transferencia.component';
import { ListProductoComponent } from '../../modules/productos/producto/list-producto/list-producto.component';
import { ListFacturaLegalComponent } from '../../modules/financiero/factura-legal/list-factura-legal/list-factura-legal.component';

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
export class TabService implements OnInit {

  tabs: Tab[] = []
  currentIndex = -1;
  tabSub = new BehaviorSubject<Tab[]>(this.tabs);
  tabChangedEvent = new EventEmitter<any>();

  constructor(
    private cargandoService: CargandoDialogService
  ) {

    this.tabs = [
      // new Tab(VentaTouchComponent, 'Venta', null, null),
    ];

    // this.addTab(new Tab(ListTransferenciaComponent, 'Lista de transferencias', null, null))
    // this.addTab(new Tab(ListProductoComponent, 'Lista de productos', null, null))
    this.addTab(new Tab(ListFacturaLegalComponent, 'Lista de facturas', null, null))
    this.tabSub.next(this.tabs);
  }
  
  ngOnInit(): void {
    // this.addTab(new Tab(CompraDashboardComponent, 'Compras', null, null))
  }

  // Horario especial

  tabChanged(index): void {
    this.tabChangedEvent.emit(index)
    // this.setTabActive(index);
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
    const parentComponent = this.tabs[index]?.parentComponent ?? null;
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
      // this.tabSub.next(this.tabs);
    }, 500);
  }

  public removeAllTabs(): void {
    this.tabs = [];
    this.tabSub.next(this.tabs);
  }

  onGoToTab(name: string) {
    let index = this.tabs.findIndex(t => t.title == name);
    if (index != -1) {
      this.setTabActive(index)
    }
  }

  getIndexByName(nombre: string) {
    let index = this.tabs.findIndex(t => t.title == nombre);
    return index;
  }

  reiniciarTab() {
    let auxTab = new Tab()
    Object.assign(auxTab, this.currentTab())
    this.removeTab(this.currentIndex)
    this.addTab(auxTab)
  }

  removeCurrentTab() {
    this.removeTab(this.currentIndex)
  }
}

// conteo -> conteo moneda -> caja -> gastos -> retiros -> retiro detalle -> 
// cobro -> cobro detalle -> venta -> venta_item -> factura legal -> factura legal item

