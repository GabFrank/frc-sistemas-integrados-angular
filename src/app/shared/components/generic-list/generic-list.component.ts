import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
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

export class GenericListComponent implements OnInit {

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
  ) {
    this.headerHeight = windowInfoService.innerTabHeight * 0.2;
    this.tableHeight = windowInfoService.innerTabHeight * 0.80;
    this.containerHeight = windowInfoService.innerTabHeight;
  }

  ngOnInit(): void {

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
