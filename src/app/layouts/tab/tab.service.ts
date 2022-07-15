import { EditInventarioComponent } from './../../modules/operaciones/inventario/edit-inventario/edit-inventario.component';
import { CargandoDialogService } from './../../shared/components/cargando-dialog/cargando-dialog.service';
import { Injectable, OnInit } from '@angular/core';
import { Tab } from './tab.model';
import { BehaviorSubject } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { InventarioDashboardComponent } from '../../modules/operaciones/inventario/inventario-dashboard/inventario-dashboard.component';
import { ListInventarioComponent } from '../../modules/operaciones/inventario/list-inventario/list-inventario.component';
import { VentaTouchComponent } from '../../modules/pdv/comercial/venta-touch/venta-touch.component';
import { FuncionarioDashboardComponent } from '../../modules/personas/funcionarios/funcionario-dashboard/funcionario-dashboard.component';
import { ListPreRegistroFuncionarioComponent } from '../../modules/personas/funcionarios/list-pre-registro-funcionario/list-pre-registro-funcionario.component';
import { ListSectorComponent } from '../../modules/empresarial/sector/list-sector/list-sector.component';
import { ListFuncioarioComponent } from '../../modules/personas/funcionarios/list-funcioario/list-funcioario.component';
import { ProductoComponent } from '../../modules/productos/producto/edit-producto/producto.component';
import { Producto } from '../../modules/productos/producto/producto.model';
import { ProductoService } from '../../modules/productos/producto/producto.service';
import { ListActualizacionComponent } from '../../modules/configuracion/actualizacion/list-actualizacion/list-actualizacion.component';
import { ListUsuarioComponent } from '../../modules/personas/usuarios/list-usuario/list-usuario.component';
import { PersonasDashboardComponent } from '../../modules/personas/personas-dashboard/personas-dashboard.component';
import { ListPersonaComponent } from '../../modules/personas/persona/list-persona/list-persona.component';
import { ListCajaComponent } from '../../modules/financiero/pdv/caja/list-caja/list-caja.component';
import { ListRolesComponent } from '../../modules/configuracion/roles/list-roles/list-roles.component';

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
    // new Tab(ListPersonaComponent, 'Lista de personas', null, null),
    // new Tab(ListUsuarioComponent, 'Lista de usuarios', null, null),
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
