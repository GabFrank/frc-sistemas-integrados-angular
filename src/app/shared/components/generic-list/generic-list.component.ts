import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef, HostListener, NgZone } from '@angular/core';
import { GenericListService } from './generic-list.service';

import { WindowInfoService } from '../../services/window-info.service';

export interface DisplayedLinkData {
  el: any;
  service: GenericListService;
  item: string;
  dialogComponent: any;
}

export interface DialogDetailData {
  data: DisplayedLinkData;
}
@Component({
  selector: 'app-generic-list',
  templateUrl: './generic-list.component.html',
  styleUrls: ['./generic-list.component.scss']
})

export class GenericListComponent implements OnInit, OnDestroy {

  @Input()
  titulo: string;

  @Output()
  adicionar = new EventEmitter<any>(null);

  @Output()
  filtrar = new EventEmitter<any>(null);

  @Output()
  resetFiltro = new EventEmitter<any>(null);

  @Output()
  cargarMasDatos = new EventEmitter<any>(null);

  @Output()
  customFunction = new EventEmitter<any>(null);

  @Output()
  customFunction2 = new EventEmitter<any>(null);

  @Input()
  isAdicionar: boolean;

  @Input()
  isCustom: boolean;

  @Input()
  customName: string;

  @Input()
  isCustom2: boolean;

  @Input()
  customName2: string;

  @Input()
  isMenu: boolean = true;

  @Input()
  disableAdicionar: boolean;

  @Input()
  disableFilter: boolean;

  @Input()
  disableCustom: boolean;

  @Input()
  disableCustom2: boolean;

  @Input()
  data

  @Input()
  buscarTrigger;

  @Input()
  isLastPage = false;

  @Input()
  isCargarMas = false;

  // Cada boton queda deshabilitado un segundo despues del clic, como hacia app-boton (evita el doble clic).
  bloqueados = { buscar: false, limpiar: false, adicionar: false, custom: false, custom2: false };

  headerHeight;
  tableHeight;
  containerHeight;

  constructor(
    public windowInfoService: WindowInfoService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {
    this.headerHeight = windowInfoService.innerTabHeight * 0.2;
    this.tableHeight = windowInfoService.innerTabHeight * 0.80;
    this.containerHeight = windowInfoService.innerTabHeight;
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.dejarDeSeguirDetalle();
  }

  // Filas desplegables (multiTemplateDataRows): el detalle se abre debajo de la fila. Si la fila está al pie de la
  // lista, el detalle crece por debajo del paginador fijo y no se ve. Al desplegarse se desplaza la lista lo justo
  // para mostrarlo, y se sigue el detalle mientras crece porque su contenido suele llegar después (ej. stock por
  // sucursal). Se deja de seguir apenas el usuario desplaza la lista por su cuenta, o a los 10 s.
  private seguimiento: { observer: ResizeObserver; timer: any; soltar: () => void } = null;

  @HostListener('click', ['$event'])
  onClickEnLista(event: MouseEvent): void {
    const fila = (event.target as HTMLElement)?.closest?.('tr.mat-mdc-row') as HTMLTableRowElement;
    if (fila == null || this.esFilaDeDetalle(fila)) return;
    const detalle = fila.nextElementSibling as HTMLTableRowElement;
    if (detalle == null || !this.esFilaDeDetalle(detalle)) return;
    this.dejarDeSeguirDetalle();
    this.zone.runOutsideAngular(() => {
      const observer = new ResizeObserver(() => this.mostrarDetalle(fila, detalle));
      observer.observe(detalle);
      const timer = setTimeout(() => this.dejarDeSeguirDetalle(), 10000);
      const usuario = ['wheel', 'touchmove', 'keydown', 'mousedown'];
      const soltar = () => this.dejarDeSeguirDetalle();
      usuario.forEach((e) => window.addEventListener(e, soltar, { capture: true, passive: true }));
      this.seguimiento = {
        observer,
        timer,
        soltar: () => usuario.forEach((e) => window.removeEventListener(e, soltar, { capture: true })),
      };
    });
  }

  private esFilaDeDetalle(fila: HTMLTableRowElement): boolean {
    return fila.cells?.length === 1 && fila.cells[0].colSpan > 1;
  }

  private dejarDeSeguirDetalle(): void {
    if (this.seguimiento == null) return;
    this.seguimiento.observer.disconnect();
    clearTimeout(this.seguimiento.timer);
    this.seguimiento.soltar();
    this.seguimiento = null;
  }

  private mostrarDetalle(fila: HTMLTableRowElement, detalle: HTMLTableRowElement): void {
    if (!fila.isConnected || detalle.getBoundingClientRect().height < 1) return; // se cerró o cambió la página
    const caja = this.cajaConScroll(fila);
    if (caja == null) return;
    const cajaRect = caja.getBoundingClientRect();
    // Lo que tapan el paginador y el encabezado fijos dentro de la caja.
    const paginador = caja.querySelector('.mat-mdc-paginator') as HTMLElement;
    const tapadoAbajo = paginador && getComputedStyle(paginador).position === 'sticky' ? paginador.offsetHeight : 0;
    // Material pone el sticky del encabezado en cada th, no en la fila.
    const encabezado = fila.closest('table')?.querySelector('tr.mat-mdc-header-row > th') as HTMLElement;
    const tapadoArriba = encabezado && getComputedStyle(encabezado).position === 'sticky' ? encabezado.offsetHeight : 0;
    const falta = detalle.getBoundingClientRect().bottom - (cajaRect.bottom - tapadoAbajo);
    if (falta <= 0) return;
    // Sin pasarse: la fila clickeada no sale por arriba aunque el detalle sea más alto que la caja.
    const margenArriba = fila.getBoundingClientRect().top - (cajaRect.top + tapadoArriba);
    const desplazar = Math.min(falta, Math.max(0, margenArriba));
    if (desplazar > 0) caja.scrollTop += desplazar;
  }

  private cajaConScroll(desde: HTMLElement): HTMLElement {
    for (let el = desde.parentElement; el != null; el = el.parentElement) {
      const overflow = getComputedStyle(el).overflowY;
      if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight) return el;
    }
    return null;
  }

  onAdd() {
    this.bloquear('adicionar');
    this.adicionar.emit()
  }

  onCancel() {
    this.filtrar.emit()
  }

  onFiltrar() {
    this.bloquear('buscar');
    this.filtrar.emit()
  }

  onResetFiltro() {
    this.bloquear('limpiar');
    this.resetFiltro.emit()
  }

  onCargarMasDatos() {
    this.cargarMasDatos.emit()
  }

  onCustomFunc() {
    this.bloquear('custom');
    this.customFunction.emit()
  }

  onCustomFunc2() {
    this.bloquear('custom2');
    this.customFunction2.emit()
  }

  private bloquear(boton: keyof GenericListComponent['bloqueados']): void {
    this.bloqueados = { ...this.bloqueados, [boton]: true };
    setTimeout(() => {
      this.bloqueados = { ...this.bloqueados, [boton]: false };
      // Si el padre es OnPush, sin esto el tick saltea la vista y el boton queda deshabilitado (#576).
      this.cdr.markForCheck();
    }, 1000);
  }

}
