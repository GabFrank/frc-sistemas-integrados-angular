import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { GenericListService } from './generic-list.service';

import { WindowInfoService } from '../../services/window-info.service';

export interface DisplayedLinkData {
  el: any;
  service: GenericListService;
  item: string;
  dialogComponent: any;
}

export interface DialogDetailData{
  data: DisplayedLinkData;
}
@Component({
  selector: 'app-generic-list',
  templateUrl: './generic-list.component.html',
  styleUrls: ['./generic-list.component.css']
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

  @Input()
  isAdicionar: boolean;

  @Input()
  disableAdicionar: boolean;

  @Input()
  disableFilter: boolean;

  @Input()
  data
  
  @Input()
  isLastPage = false;
  
  headerHeight;
  tableHeight;
  containerHeight;

  constructor(
    public windowInfoService: WindowInfoService,
  ) { 
    this.headerHeight = windowInfoService.innerTabHeight * 0.2;
    this.tableHeight = windowInfoService.innerTabHeight * 0.75;
    this.containerHeight = windowInfoService.innerTabHeight;
  }

  ngOnInit(): void {
    
  }

  onAdd(){
    this.adicionar.emit()
  }

  onCancel(){
    this.filtrar.emit()
  }

  onFiltrar(){
    this.filtrar.emit()
  }

  onResetFiltro(){
    this.resetFiltro.emit()
  }

  onCargarMasDatos(){
    this.cargarMasDatos.emit()
  }

  
}
