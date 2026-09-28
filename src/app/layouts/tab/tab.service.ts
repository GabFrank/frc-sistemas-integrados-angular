import { EventEmitter, Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CargandoDialogService } from './../../shared/components/cargando-dialog/cargando-dialog.service';
import { Tab } from './tab.model';

export enum TABS {
  'LIST-PERSONA' = 'list-persona',
  'EDIT-PERSONA' = 'edit-persona'
}

export class TabData {
  id?: number
  data?: any;
  goToSection?: string; // Nueva propiedad para indicar la sección destino
  constructor(id?, data?, goToSection?) {
    this.id = id
    this.data = data
    this.goToSection = goToSection
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

  /**
   * Emite una pestaña cuando vuelve a quedar activa después de haber estado en
   * segundo plano (no al abrirse). Las pantallas quedan vivas al cambiar de
   * pestaña, así que la usan para volver a pedir sus datos: ver onTabReactivada.
   */
  private tabReactivada$ = new Subject<Tab>();
  private ultimaActiva: Tab = null;
  private yaDesactivadas = new WeakSet<Tab>();

  constructor(
    private cargandoService: CargandoDialogService
  ) {

    this.tabs = [
      // new Tab(VentaTouchComponent, 'Venta', null, null)
    ];

    // this.addTab(new Tab(EditTransferenciaComponent, 'Transferencia 56', new TabData(56, {id: 56}), null))
    // open list transferencia, add set timeout 1000
    // this.addTab(new Tab(ListTransferenciaComponent, 'Lista de transferencias', null, null))
    // this.addTab(new Tab(ListInventarioComponent, 'Lista de inventario', null, null))
    // this.addTab(new Tab(EditPedidoComponent, 'Pedido 1', new TabData(1, {id: 1}), null))
    // Test both components - remove one when testing the other
    // this.addTab(new Tab(EditPedidoComponent, 'Pedido 2 (Original)', new TabData(2, {id: 2}), null))
    // this.addTab(new Tab(EditPedido2Component, 'Pedido 14', new TabData(14, {id: 14}), null))
    // open edit pedido 2 for a new pedido
    // list pedidos
    // this.addTab(new Tab(ListCompraComponent, 'Lista de compras', null, null))
    // this.addTab(new Tab(GestionComprasComponent, 'Pedido 24', new TabData(24, {id: 24}), null))
    // Open Compra Dashboard
    // this.addTab(new Tab(CompraDashboardComponent, 'Compras', null, null))
    this.tabSub.next(this.tabs);
  }

  ngOnInit(): void {
    // this.addTab(new Tab(CompraDashboardComponent, 'Compras', null, null))
  }

  // Horario especial

  tabChanged(index): void {
    this.tabChangedEvent.emit(index)
    this.registrarActivacion(index);
    // this.setTabActive(index);
  }

  /** Emite cuando `tab` (el `data` que recibe cada pantalla) vuelve a quedar activa. */
  onTabReactivada(tab: Tab): Observable<Tab> {
    return this.tabReactivada$.pipe(filter((t) => tab != null && t === tab));
  }

  /**
   * Llega por dos caminos para una misma activación: el clic del usuario solo pasa
   * por tabChanged, y setTabActive rebota por tabChanged vía mat-tab-group. Se
   * compara la instancia de Tab (no el índice ni el flag active, que el clic no
   * mantiene); un índice que no resuelve a una pestaña se ignora.
   */
  private registrarActivacion(index): void {
    const tab = typeof index === 'number' ? this.tabs[index] : null;
    if (tab == null || tab === this.ultimaActiva) return;
    if (this.ultimaActiva != null) this.yaDesactivadas.add(this.ultimaActiva);
    this.ultimaActiva = tab;
    if (this.yaDesactivadas.has(tab)) this.tabReactivada$.next(tab);
  }

  currentTab(): Tab {
    return this.tabs[this.currentIndex];
  }

  /**
   * Mantiene currentIndex y active en la pestaña visible cuando cambia por clic
   * (default.component, selectedIndexChange). No emite tabSub: hacerlo vuelve a
   * fijar selectedIndex y dispara el foco del POS en cada clic (por eso se había
   * comentado setTabActive en tabChanged). Se usa selectedIndexChange y no
   * selectedTabChange porque este último puede llegar diferido con un índice viejo
   * al quitar la pestaña activa (#353).
   */
  sincronizarActiva(index): void {
    if (typeof index !== 'number' || this.tabs[index] == null) return;
    this.tabs.forEach((t) => (t.active = false));
    this.tabs[index].active = true;
    this.currentIndex = index;
  }

  setTabActive(index): void {
    // Solo índices de una pestaña existente (antes un Tab o un índice fuera de rango
    // dejaba todo sin active y currentIndex apuntando a nada).
    if (typeof index !== 'number' || this.tabs[index] == null) return;
    for (let i = 0; i < this.tabs.length; i++) {
      if (this.tabs[i].active === true) {
        this.tabs[i].active = false;
      }
    }
    this.tabs[index].active = true;
    this.currentIndex = index;
    this.registrarActivacion(index);
    this.tabSub.next(this.tabs);
  }

  public removeTab(index: number): void {
    const cerrada = this.tabs[index];
    if (cerrada == null) return;
    const eraActiva = index === this.currentIndex;
    const parentComponent = cerrada.parentComponent ?? null;
    this.tabs.splice(index, 1);
    if (this.tabs.length === 0) {
      this.currentIndex = -1;
    } else if (eraActiva) {
      // Volver a la padre si sigue abierta; si no, a la vecina que ocupa su lugar
      // (o la anterior si era la última).
      let destino =
        parentComponent != null
          ? this.tabs.findIndex((x) => x.component == parentComponent)
          : -1;
      if (destino === -1) destino = Math.min(index, this.tabs.length - 1);
      this.setTabActive(destino);
    } else if (index < this.currentIndex) {
      // Se cerró una anterior: la activa es la misma, un lugar antes.
      this.currentIndex--;
    }
    this.tabSub.next(this.tabs);
  }

  public addTab(tab: Tab): void {
    let rId = this.cargandoService.openDialog()
    const duplicado = this.tabs.findIndex(x => x.title == tab.title);
    if (duplicado == -1) {
      tab.id = this.tabs.length + 1;
      this.currentIndex = tab.id - 1;
      tab.active = true;
      this.tabs.push(tab);
      this.setTabActive(tab.id - 1);
    } else {
      this.tabs[duplicado].tabData = tab.tabData;
      this.setTabActive(duplicado);
    }
    setTimeout(() => {
      this.cargandoService.closeDialog(rId.requestId)
      // this.tabSub.next(this.tabs);
    }, 500);
  }

  public removeAllTabs(): void {
    this.tabs = [];
    this.currentIndex = -1;
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

  changeCurrentTabName(name: string) {
    this.tabs[this.currentIndex].title = name;
  }
}

// conteo -> conteo moneda -> caja -> gastos -> retiros -> retiro detalle -> 
// cobro -> cobro detalle -> venta -> venta_item -> factura legal -> factura legal item

