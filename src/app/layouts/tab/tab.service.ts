import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CargandoDialogService } from './../../shared/components/cargando-dialog/cargando-dialog.service';
import { Tab } from './tab.model';
import { LucroPorProductoComponent } from '../../modules/operaciones/venta/reportes/lucro-por-producto/lucro-por-producto.component';

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

    // this.addTab(new Tab(EditTransferenciaComponent, 'Transferencia 19', new TabData(19), null))
    this.tabSub.next(this.tabs);

    // this.productoService.getProducto(1152).subscribe(res => {
    //   console.log(res)
    //   this.addTab(new Tab(ProductoComponent, 'Nuevo Producto', { data: res }))
    // })
  }
  ngOnInit(): void {
    // this.addTab(new Tab(LucroPorProductoComponent, 'Lucro por producto', null, null))
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
