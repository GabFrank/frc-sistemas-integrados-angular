import { Injectable } from '@angular/core';
import { Tab } from './tab.model';
import { BehaviorSubject } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { ProductoComponent } from '../../modules/productos/producto/edit-producto/producto.component';
import { ListProductoComponent } from '../../modules/productos/producto/list-producto/list-producto.component';

export enum TABS {
  'LIST-PERSONA' = 'list-persona',
  'EDIT-PERSONA' = 'edit-persona'
}

export class TabData{
  id?: number
  data?: any;
  constructor(id?, data?){
    this.id = id
    this.data = data
  }
}

@Injectable({
  providedIn: 'root'
})
export class TabService {

  tabs : Tab[] = []
  currentIndex = -1;
  tabSub = new BehaviorSubject<Tab[]>(this.tabs);
  tabChangedEvent = new EventEmitter<any>();


  constructor() {
    this.tabs = [
      // new Tab(ListProductoComponent, 'Productos', null, null)
    ];
    this.tabSub.next(this.tabs);
  }

  tabChanged(index): void{
    this.tabChangedEvent.emit(index)
    this.setTabActive(index);
  }

  setTabActive(index): void {
    if(this.tabs.length > 0){
      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].active === true) {
          this.tabs[i].active = false;
        }
      }
      if(this.tabs[index]!=undefined){
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
          if(parent != -1){
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
    const duplicado = this.tabs.findIndex(x => x.title == tab.title);
    if (duplicado == -1) {
      tab.id = this.tabs.length + 1;
      this.currentIndex = tab.id - 1;
      tab.active = true;
      this.tabs.push(tab);
      this.setTabActive(tab.id-1);
    } else {
      this.setTabActive(duplicado);
    }
    this.tabSub.next(this.tabs);
  }
}
